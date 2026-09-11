import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/asyncHandler";
import { ok } from "../../http/respond";
import { DomainError, NotFoundError } from "../../errors/domain";

export const catalogsRouter = Router();

catalogsRouter.get(
  "/projects",
  asyncHandler(async (_req, res) => {
    const data = await prisma.project.findMany({
      where: { deletedAt: null },
      include: { budgetItems: true, workFronts: { include: { chief: true } } },
      orderBy: { id: "asc" },
    });
    ok(res, data);
  })
);

catalogsRouter.get(
  "/projects/archived",
  asyncHandler(async (_req, res) => {
    ok(res, await prisma.projectBackup.findMany({ orderBy: { deletedAt: "desc" } }));
  })
);

catalogsRouter.get(
  "/projects/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const project = await prisma.project.findUnique({
      where: { id },
      include: { budgetItems: true, workFronts: true },
    });
    if (!project) throw new NotFoundError("Obra", id);
    ok(res, project);
  })
);

const projectSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(3),
  location: z.string().min(2),
  clientName: z.string().min(2),
  executionMonths: z.coerce.number().int().positive(),
  roadSection: z.string().optional(),
  contractNumber: z.string().optional(),
  globalBudget: z.coerce.number().positive(),
  montoContractualManual: z.coerce.number().positive().optional(),
});

const partnerSchema = z.object({
  kind: z.enum(["SUPPLIER", "SUBCONTRACTOR", "BOTH"]),
  name: z.string().min(3),
  taxId: z.string().min(3),
  fiscalAddress: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  classification: z.string().optional(),
});

const materialSchema = z.object({
  code: z.string().min(2),
  description: z.string().min(3),
  unit: z.string().min(1),
  category: z.string().min(2),
  estimatedCost: z.coerce.number().nonnegative(),
});

const personnelSchema = z.object({
  fullName: z.string().min(3),
  role: z.enum(["JEFE_FRENTE", "COMPRAS", "GERENCIA", "ALMACEN"]),
  email: z.string().email().optional(),
});

const budgetItemSchema = z.object({
  projectId: z.number().int(),
  code: z.string().min(2),
  name: z.string().min(3),
  category: z.string().min(2),
  originalAmount: z.coerce.number().positive(),
});

const workFrontSchema = z.object({
  projectId: z.number().int(),
  name: z.string().min(3),
  chiefId: z.number().int(),
});

catalogsRouter.post(
  "/projects",
  asyncHandler(async (req, res) => {
    const body = projectSchema.parse(req.body);
    const project = await prisma.project.create({
      data: {
        ...body,
        montoContractualManual: body.montoContractualManual ?? body.globalBudget,
        montoRealActualizado: body.montoContractualManual ?? body.globalBudget,
      },
    });
    ok(res, project, 201);
  })
);

catalogsRouter.delete(
  "/projects/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new DomainError("INVALID_PROJECT", "El identificador de la obra no es válido");
    }

    await prisma.$transaction(async (tx) => {
      const project = await tx.project.findUnique({
        where: { id },
        include: {
          budgetItems: true,
          workFronts: { include: { chief: true } },
          materialRequests: { include: { details: true, purchaseOrders: true } },
          purchaseOrders: { include: { details: true } },
          subcontracts: { include: { partner: true, budgetItem: true, certificates: true } },
          warehouseStock: { include: { material: true } },
          stockMovements: { include: { material: true } },
          certificaciones: { include: { partner: true, budgetItem: true } },
        },
      });
      if (!project) throw new NotFoundError("Obra", id);
      if (project.deletedAt) throw new DomainError("PROJECT_ALREADY_ARCHIVED", "La obra ya está archivada", 409);
      const snapshot = JSON.parse(JSON.stringify(project));
      await tx.projectBackup.create({
        data: {
          originalProjectId: id,
          projectCode: project.code,
          projectName: project.name,
          snapshot,
        },
      });
      await tx.project.update({
        where: { id },
        data: { deletedAt: new Date(), deletedBy: "usuario-actual" },
      });
    });

    ok(res, { deleted: true, id });
  })
);

catalogsRouter.get(
  "/projects/:id/backup",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const backup = await prisma.projectBackup.findUnique({ where: { originalProjectId: id } });
    if (!backup) throw new NotFoundError("Respaldo de obra", id);
    ok(res, backup);
  })
);

catalogsRouter.post(
  "/partners",
  asyncHandler(async (req, res) => {
    const body = partnerSchema.parse(req.body);
    ok(res, await prisma.partner.create({ data: body }), 201);
  })
);

catalogsRouter.post(
  "/materials",
  asyncHandler(async (req, res) => {
    const body = materialSchema.parse(req.body);
    ok(res, await prisma.material.create({ data: body }), 201);
  })
);

catalogsRouter.post(
  "/personnel",
  asyncHandler(async (req, res) => {
    const body = personnelSchema.parse(req.body);
    ok(res, await prisma.personnel.create({ data: body }), 201);
  })
);

catalogsRouter.post(
  "/budget-items",
  asyncHandler(async (req, res) => {
    const body = budgetItemSchema.parse(req.body);
    const project = await prisma.project.findUnique({ where: { id: body.projectId } });
    if (!project) throw new NotFoundError("Obra", body.projectId);
    ok(res, await prisma.budgetItem.create({ data: body }), 201);
  })
);

catalogsRouter.post(
  "/work-fronts",
  asyncHandler(async (req, res) => {
    const body = workFrontSchema.parse(req.body);
    const [project, chief] = await Promise.all([
      prisma.project.findUnique({ where: { id: body.projectId } }),
      prisma.personnel.findUnique({ where: { id: body.chiefId } }),
    ]);
    if (!project) throw new NotFoundError("Obra", body.projectId);
    if (!chief) throw new NotFoundError("Personal", body.chiefId);
    if (chief.role !== "JEFE_FRENTE") {
      throw new DomainError("INVALID_CHIEF", "El responsable debe tener rol JEFE_FRENTE");
    }
    ok(res, await prisma.workFront.create({ data: body, include: { chief: true, project: true } }), 201);
  })
);

catalogsRouter.get(
  "/partners",
  asyncHandler(async (_req, res) => {
    ok(res, await prisma.partner.findMany({ orderBy: { name: "asc" } }));
  })
);

catalogsRouter.get(
  "/materials",
  asyncHandler(async (_req, res) => {
    ok(res, await prisma.material.findMany({ orderBy: { code: "asc" } }));
  })
);

catalogsRouter.get(
  "/personnel",
  asyncHandler(async (_req, res) => {
    ok(res, await prisma.personnel.findMany({ where: { active: true } }));
  })
);

catalogsRouter.get(
  "/budget-items",
  asyncHandler(async (req, res) => {
    const projectId = req.query.projectId ? Number(req.query.projectId) : undefined;
    ok(
      res,
      await prisma.budgetItem.findMany({
        where: projectId ? { projectId } : undefined,
        include: { project: true },
        orderBy: { code: "asc" },
      })
    );
  })
);
