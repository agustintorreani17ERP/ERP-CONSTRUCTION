import * as XLSX from "xlsx";

export type ImportWarning = {
  sheet: string;
  row: number;
  field: string;
  message: string;
  item?: string;
};

export type ParsedBudgetRow = {
  sheet: string;
  rowNumber: number;
  code: string;
  name: string;
  category: string;
  unit: string | null;
  quantity: number;
  unitPrice: number;
  originalAmount: number;
  noCotiza: boolean;
  unitReview: boolean;
  unitSuggestion: string | null;
  nodeKind: "RUBRO" | "SUBRUBRO" | "ITEM" | "AGREGADO";
  hierarchyLevel: number;
  path: string;
  parentPath: string | null;
};

export type ParsedBudget = {
  rows: ParsedBudgetRow[];
  warnings: ImportWarning[];
  mapping: Record<string, string[]>;
  sheets: string[];
  metadata: { projectName?: string; clientName?: string; contractNumber?: string };
};

type CanonicalField = "code" | "description" | "unit" | "quantity" | "unitPrice" | "total";

const synonyms: Record<CanonicalField, string[]> = {
  code: ["item", "n", "nro", "numero", "codigo", "item n"],
  description: ["descripcion", "detalle", "concepto", "rubro", "item descripcion"],
  unit: ["unidad", "und", "unid", "um", "u m"],
  quantity: ["cantidad", "cant", "metrado"],
  unitPrice: ["precio unitario", "pu", "costo unitario", "precio unit"],
  total: ["precio total", "monto total", "costo total", "importe total", "total"],
};

const knownUnits: Record<string, string> = {
  m2: "m²", "m²": "m²", mts2: "m²",
  m3: "m³", "m³": "m³", mts3: "m³",
  ml: "m", "m.l.": "m", m: "m",
  un: "un", "un.": "un", u: "un", unid: "un",
  gl: "gl", gbl: "gl", global: "gl",
  kg: "kg", mes: "mes", esc: "esc",
};

export function text(value: unknown) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200d\ufeff]/g, "")
    .trim()
    .replace(/\s+/g, " ");
}

function key(value: unknown) {
  return text(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function number(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  let raw = text(value);
  if (!raw || /^no\s*cotiza$/i.test(raw)) return null;
  const negative = /^-/.test(raw) || /^\(.*\)$/.test(raw);
  raw = raw.replace(/[()]/g, "").replace(/[^\d,.-]/g, "").replace(/-/g, "");
  if (!raw || !/\d/.test(raw)) return null;
  const comma = raw.lastIndexOf(",");
  const dot = raw.lastIndexOf(".");
  if (comma >= 0 && dot >= 0) {
    const decimal = comma > dot ? "," : ".";
    raw = raw.replace(decimal === "," ? /\./g : /,/g, "").replace(decimal, ".");
  } else if (comma >= 0) {
    raw = raw.replace(/\./g, "").replace(",", ".");
  } else if ((raw.match(/\./g) ?? []).length > 1 || raw.split(".")[1]?.length === 3) {
    raw = raw.replace(/\./g, "");
  }
  const result = Number(raw);
  return Number.isFinite(result) ? (negative ? -result : result) : null;
}

function similarity(left: string, right: string) {
  if (left === right || left.includes(right) || right.includes(left)) return 1;
  const distance = Array.from({ length: left.length + 1 }, (_, row) =>
    Array.from({ length: right.length + 1 }, (_, column) => row === 0 ? column : column === 0 ? row : 0)
  );
  for (let row = 1; row <= left.length; row += 1) {
    for (let column = 1; column <= right.length; column += 1) {
      distance[row][column] = Math.min(
        distance[row - 1][column] + 1,
        distance[row][column - 1] + 1,
        distance[row - 1][column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1)
      );
    }
  }
  return 1 - distance[left.length][right.length] / Math.max(left.length, right.length, 1);
}

function mapHeaders(values: unknown[]) {
  const mapped = new Map<CanonicalField, number[]>();
  values.forEach((value, index) => {
    const header = key(value).replace(/[.:°№]/g, " ").replace(/\s+/g, " ");
    (Object.keys(synonyms) as CanonicalField[]).forEach((field) => {
      const match = synonyms[field].some((candidate) => similarity(header, candidate) >= (candidate.length <= 3 ? 1 : 0.72));
      if (match) mapped.set(field, [...(mapped.get(field) ?? []), index]);
    });
  });
  return mapped;
}

function findHeader(matrix: unknown[][]) {
  for (let index = 0; index < Math.min(matrix.length, 80); index += 1) {
    const mapped = mapHeaders(matrix[index]);
    const count = [...mapped.keys()].length;
    if (count >= 3 && mapped.has("description") && (mapped.has("code") || mapped.has("quantity"))) {
      return { index, mapped };
    }
  }
  return null;
}

function resolveUnit(raw: unknown) {
  const original = key(raw).replace(/\s+/g, "");
  if (!original) return { unit: null, review: false, suggestion: null };
  const unit = knownUnits[original];
  if (unit) return { unit, review: false, suggestion: null };
  const candidate = Object.keys(knownUnits).sort((left, right) => similarity(original, right) - similarity(original, left))[0];
  return { unit: text(raw), review: true, suggestion: knownUnits[candidate] ?? null };
}

function aggregate(name: string) {
  return /^(subtotales?|precio total|avance|total general|resumen)/i.test(name);
}

function hierarchy(code: string, name: string, hasCost: boolean) {
  if (aggregate(name)) return { nodeKind: "AGREGADO" as const, level: 0 };
  const numeric = code.match(/\./g)?.length;
  if (numeric === undefined) return { nodeKind: hasCost ? "RUBRO" as const : "RUBRO" as const, level: 0 };
  if (numeric === 0) return { nodeKind: "RUBRO" as const, level: 0 };
  if (numeric === 1) return { nodeKind: "SUBRUBRO" as const, level: 1 };
  return { nodeKind: "ITEM" as const, level: numeric + 1 };
}

export function parseBudgetWorkbook(buffer: Buffer): ParsedBudget {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const rows: ParsedBudgetRow[] = [];
  const warnings: ImportWarning[] = [];
  const mapping: Record<string, string[]> = {};
  const metadata: ParsedBudget["metadata"] = {};
  const codes = new Map<string, { sheet: string; row: number }>();
  const eligibleSheets = workbook.SheetNames.filter((sheet) => !/resumen|plan de trabajo|cronograma/i.test(sheet));

  for (const sheetName of eligibleSheets) {
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], { header: 1, defval: "", blankrows: true });
    const header = findHeader(matrix);
    if (!header) continue;
    mapping[sheetName] = [...header.mapped.entries()].flatMap(([field, columns]) => columns.map((column) => `${field}=${text(matrix[header.index][column])}`));
    const lastByLevel: string[] = [];

    for (let index = header.index + 1; index < matrix.length; index += 1) {
      const values = matrix[index];
      const fields = (field: CanonicalField) => header.mapped.get(field)?.map((column) => values[column]).find((value) => text(value) !== "");
      const code = text(fields("code"));
      const name = text(fields("description"));
      const rawQuantity = fields("quantity");
      const rawUnitPrice = fields("unitPrice");
      const rawTotal = fields("total");
      if (!name && !code && ![rawQuantity, rawUnitPrice, rawTotal].some((value) => text(value))) continue;
      if (!name) {
        warnings.push({ sheet: sheetName, row: index + 1, field: "descripcion", message: "Fila ignorada: no tiene descripción ni datos suficientes" });
        continue;
      }
      const quantity = number(rawQuantity) ?? 0;
      const unitPrice = number(rawUnitPrice) ?? 0;
      const parsedTotal = number(rawTotal);
      const noCotiza = [rawQuantity, rawUnitPrice, rawTotal].some((value) => /no\s*cotiza/i.test(text(value))) || (rawQuantity === undefined && rawUnitPrice === undefined && parsedTotal === null);
      const total = parsedTotal ?? quantity * unitPrice;
      const resolved = resolveUnit(fields("unit"));
      const kind = hierarchy(code, name, quantity > 0 || unitPrice > 0 || total > 0);
      const path = code || `${sheetName}.${index + 1}`;
      const parentPath = code.includes(".") ? code.slice(0, code.lastIndexOf(".")) : null;
      if (code && codes.has(code)) {
        const previous = codes.get(code)!;
        warnings.push({ sheet: sheetName, row: index + 1, field: "item", item: code, message: `Código repetido; también aparece en ${previous.sheet}, fila ${previous.row}` });
      } else if (code) {
        codes.set(code, { sheet: sheetName, row: index + 1 });
      }
      if (resolved.review) warnings.push({ sheet: sheetName, row: index + 1, field: "unidad", item: code || name, message: `Unidad no reconocida; sugerencia: ${resolved.suggestion ?? "sin sugerencia"}` });
      if (quantity < 0 || unitPrice < 0 || total < 0) {
        warnings.push({ sheet: sheetName, row: index + 1, field: "monto", item: code || name, message: "Monto negativo: la fila no puede importarse" });
        continue;
      }
      if (kind.nodeKind !== "AGREGADO") {
        lastByLevel[kind.level] = path;
        lastByLevel.length = kind.level + 1;
      }
      rows.push({ sheet: sheetName, rowNumber: index + 1, code: code || path, name, category: kind.nodeKind, unit: resolved.unit, quantity, unitPrice, originalAmount: total, noCotiza, unitReview: resolved.review, unitSuggestion: resolved.suggestion, nodeKind: kind.nodeKind, hierarchyLevel: kind.level, path, parentPath: parentPath ?? (kind.level > 0 ? lastByLevel[kind.level - 1] ?? null : null) });
    }
  }

  if (!rows.length) throw new Error("No se detectó ninguna tabla presupuestaria en las hojas del archivo");
  if (!rows.some((row) => row.nodeKind !== "AGREGADO" && (row.quantity > 0 || row.unitPrice > 0 || row.originalAmount > 0) || row.noCotiza)) {
    throw new Error("No se detectaron filas de presupuesto con cantidad, precio o estado No cotiza");
  }
  return { rows, warnings, mapping, sheets: eligibleSheets, metadata };
}
