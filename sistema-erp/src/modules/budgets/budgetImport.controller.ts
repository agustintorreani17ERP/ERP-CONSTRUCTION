import { BudgetNodeKind } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { Router } from "express";
import { z } from "zod";
import { ok } from "../../http/respond";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/asyncHandler";
import { DomainError, NotFoundError } from "../../errors/domain";

export const budgetImportRouter = Router();

const budgetRowSchema = z.object({
  code: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(500),
  quantity: z.union([z.string(), z.number()]).optional(),
  unit: z.string().trim().max(40).optional(),
  unitPrice: z.union([z.string(), z.number()]).optional(),
  totalPrice: z.union([z.string(), z.number()]).optional(),
  sourceRow: z.number().int().positive().optional(),
});

const budgetSheetSchema = z.object({
  sheetId: z.union([z.string(), z.number()]).transform(String).pipe(z.string().trim().min(1).max(160)),
  rows: z.array(budgetRowSchema).min(1).max(20_000),
});

const budgetImportSchema = z.union([
  budgetSheetSchema,
  z.object({ sheets: z.array(budgetSheetSchema).min(1).max(100) }),
]);

function parseDecimal(value: unknown, field: string, row: number, required: boolean) {
  const original = String(value ?? "").trim();
  if (!original) {
    if (required) throw new DomainError("INVALID_IMPORT_DATA", `La fila ${row}: ${field} es obligatoria`, 422);
    return new Decimal(0);
  }

  let normalized = original.replace(/\s/g, "").replace(/(?:Gs\.?|USD|US\$|\$)/gi, "").replace(/[^\d,.-]/g, "");
  const negative = normalized.startsWith("-") || (original.startsWith("(") && original.endsWith(")"));
  normalized = normalized.replace(/-/g, "");
  const comma = normalized.lastIndexOf(",");
  const dot = normalized.lastIndexOf(".");
  if (comma >= 0 && dot >= 0) {
    const decimalSeparator = comma > dot ? "," : ".";
    normalized = normalized.replace(decimalSeparator === "," ? /\./g : /,/g, "").replace(decimalSeparator, ".");
  } else if (comma >= 0) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else if ((normalized.match(/\./g) ?? []).length > 1 || (dot >= 0 && normalized.split(".")[1]?.length === 3)) {
    normalized = normalized.replace(/\./g, "");
  }

  try {
    const decimal = new Decimal(`${negative ? "-" : ""}${normalized}`);
    if (!decimal.isFinite()) throw new Error("not finite");
    return decimal;
  } catch {
    throw new DomainError("INVALID_IMPORT_DATA", `La fila ${row}: ${field} debe ser numérico`, 422);
  }
}

function levelFor(code: string) {
  return code.split(".").length;
}

budgetImportRouter.post(
  "/projects/:id/budget-import",
  asyncHandler(async (req, res) => {
    const projectId = Number(req.params.id);
    if (!Number.isInteger(projectId) || projectId <= 0) throw new DomainError("INVALID_PROJECT", "El identificador de la obra no es válido");
    const input = budgetImportSchema.parse(req.body);
    const sheets = "sheets" in input ? input.sheets : [input];
    const importedRows = sheets.flatMap((sheet) => sheet.rows.map((row) => ({ ...row, sheetId: sheet.sheetId })));
    const codes = new Set<string>();
    for (const row of importedRows) {
      if (codes.has(row.code)) throw new DomainError("DUPLICATE_BUDGET_CODE", `Código repetido en el archivo: ${row.code}`, 422);
      codes.add(row.code);
      if (levelFor(row.code) > 3) throw new DomainError("INVALID_IMPORT_DATA", `El código ${row.code} supera el nivel jerárquico permitido`, 422);
    }

    const imported = await prisma.$transaction(async (tx) => {
      const project = await tx.project.findUnique({ where: { id: projectId }, select: { id: true } });
      if (!project) throw new NotFoundError("Obra", projectId);
      const existing = await tx.budgetItem.findFirst({ where: { projectId, code: { in: [...codes] } }, select: { code: true } });
      if (existing) throw new DomainError("DUPLICATE_BUDGET_CODE", `El código ${existing.code} ya existe en la obra`, 409);

      const ids = new Map<string, number>();
      const rows = [...importedRows].sort((a, b) => levelFor(a.code) - levelFor(b.code) || a.code.localeCompare(b.code, undefined, { numeric: true }));
      for (const row of rows) {
        const level = levelFor(row.code);
        const isItem = level === 3;
        const parentCode = level > 1 ? row.code.slice(0, row.code.lastIndexOf(".")) : undefined;
        const parentId = parentCode ? ids.get(parentCode) : undefined;
        if (parentCode && !parentId) throw new DomainError("INVALID_IMPORT_DATA", `La fila ${row.sourceRow ?? "?"}: no existe el padre ${parentCode}`, 422);
        const quantity = parseDecimal(row.quantity, "quantity", row.sourceRow ?? 0, isItem);
        const unitPrice = parseDecimal(row.unitPrice, "unitPrice", row.sourceRow ?? 0, isItem);
        const totalPrice = parseDecimal(row.totalPrice, "totalPrice", row.sourceRow ?? 0, isItem);
        const nodeKind = level === 1 ? BudgetNodeKind.RUBRO : level === 2 ? BudgetNodeKind.SUBRUBRO : BudgetNodeKind.ITEM;
        const created = await tx.budgetItem.create({
          data: {
            projectId,
            code: row.code,
            name: row.description,
            category: nodeKind,
            unit: isItem ? row.unit || null : null,
            totalQuantity: isItem ? quantity : 0,
            unitPrice: isItem ? unitPrice : 0,
            originalAmount: isItem ? totalPrice : 0,
            parentId,
            path: row.code,
            hierarchyLevel: level,
            nodeKind,
            sourceSheet: row.sheetId,
            sourceRow: row.sourceRow,
          },
          select: { id: true, code: true },
        });
        ids.set(created.code, created.id);
      }
      return { projectId, sheets: sheets.map((sheet) => sheet.sheetId), rows: rows.length };
    });
    ok(res, imported, 201);
  })
);