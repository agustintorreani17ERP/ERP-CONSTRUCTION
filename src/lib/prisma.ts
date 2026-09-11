import { PrismaClient, Prisma } from "@prisma/client";
import { toDecimal } from "./money";

// In-memory data store for fallback/preview when PostgreSQL is offline
const D = (v: string | number) => new Prisma.Decimal(v);

function createInitialStore() {
  const project = {
    id: 1,
    code: "PY02-T3",
    name: "Ruta Nacional PY02 — Tramo Caaguazú–Coronel Oviedo",
    location: "Caaguazú, Paraguay",
    roadSection: "Km 132 – Km 168",
    contractNumber: "MOPC-2024-VIAL-041",
    clientName: "MOPC",
    executionMonths: 24,
    globalBudget: D("18500000000"),
    montoContractualManual: D("18500000000"),
    montoRealActualizado: D("18500000000"),
    startDate: new Date("2025-03-01"),
    endDate: new Date("2027-08-31"),
    status: "ACTIVO",
    deletedAt: null,
    createdAt: new Date("2025-03-01"),
    updatedAt: new Date("2025-03-01"),
  };

  const budgetItems = [
    {
      id: 1,
      projectId: 1,
      code: "01-MS",
      name: "Movimiento de suelo",
      category: "TERRAPLEN",
      originalAmount: D("4200000000"),
      committedAmount: D("0"),
      executedAmount: D("0"),
      createdAt: new Date("2025-03-01"),
      updatedAt: new Date("2025-03-01"),
    },
    {
      id: 2,
      projectId: 1,
      code: "02-EST",
      name: "Estructuras (alcantarillas y puentes menores)",
      category: "ESTRUCTURAS",
      originalAmount: D("5100000000"),
      committedAmount: D("0"),
      executedAmount: D("0"),
      createdAt: new Date("2025-03-01"),
      updatedAt: new Date("2025-03-01"),
    },
    {
      id: 3,
      projectId: 1,
      code: "03-PAV",
      name: "Pavimento asfáltico",
      category: "PAVIMENTO",
      originalAmount: D("9200000000"),
      committedAmount: D("0"),
      executedAmount: D("0"),
      createdAt: new Date("2025-03-01"),
      updatedAt: new Date("2025-03-01"),
    },
  ];

  const personnel = [
    { id: 1, fullName: "Ing. Carlos Benítez", role: "JEFE_FRENTE", email: "cbenitez@obra.local" },
    { id: 2, fullName: "Lic. María Gómez", role: "COMPRAS", email: "mgomez@obra.local" },
    { id: 3, fullName: "Ing. Roberto Almirón", role: "GERENCIA", email: "ralmiron@obra.local" },
    { id: 4, fullName: "Sr. Jorge Duarte", role: "ALMACEN", email: "jduarte@obra.local" },
  ];

  const workFronts = [
    { id: 1, projectId: 1, code: "F1-KM132-145", name: "Frente 1 — Calzada Este", chiefId: 1, chief: personnel[0] },
  ];

  const partners = [
    {
      id: 1,
      kind: "SUPPLIER",
      name: "Asfaltos del Este S.A.",
      taxId: "80012345-6",
      fiscalAddress: "Ruta 2 km 14, Ciudad del Este",
      phone: "+595 21 555-010",
      email: "ventas@asfaltoseste.com.py",
      classification: "EMULSION_ASFALTICA",
    },
    {
      id: 2,
      kind: "SUPPLIER",
      name: "Aceros Guaraní S.A.",
      taxId: "80098765-1",
      fiscalAddress: "Av. Artigas 2450, Asunción",
      phone: "+595 21 555-220",
      email: "pedidos@acerosguarani.com.py",
      classification: "ACERO_CORRUGADO",
    },
    {
      id: 3,
      kind: "SUBCONTRACTOR",
      name: "Pavimentadora del Sur Ltda.",
      taxId: "80112233-4",
      fiscalAddress: "Encarnación",
      email: "contacto@pavimentadorasur.com.py",
      classification: "PAVIMENTO_FLEXIBLE",
    },
  ];

  const materials = [
    {
      id: 1,
      code: "CEM-CPC40",
      description: "Cemento Portland CPC-40",
      unit: "ton",
      category: "CONGLOMERANTES",
      estimatedCost: D("1850000"),
    },
    {
      id: 2,
      code: "EMU-CRS1",
      description: "Emulsión asfáltica CRS-1",
      unit: "ton",
      category: "LIGANTES",
      estimatedCost: D("6200000"),
    },
    {
      id: 3,
      code: "ACE-12",
      description: "Acero corrugado Ø12 mm",
      unit: "kg",
      category: "ACERO",
      estimatedCost: D("8500"),
    },
    {
      id: 4,
      code: "ARI-3/4",
      description: "Árido triturado 3/4\"",
      unit: "m3",
      category: "AGREGADOS",
      estimatedCost: D("210000"),
    },
  ];

  const warehouseStock = [
    { id: 1, projectId: 1, materialId: 1, currentStock: D("120"), reservedStock: D("0") },
    { id: 2, projectId: 1, materialId: 2, currentStock: D("35"), reservedStock: D("0") },
    { id: 3, projectId: 1, materialId: 3, currentStock: D("18500"), reservedStock: D("0") },
    { id: 4, projectId: 1, materialId: 4, currentStock: D("420"), reservedStock: D("0") },
  ];

  const materialRequests = [
    {
      id: 1,
      number: "PM-000001",
      projectId: 1,
      workFrontId: 1,
      requestedById: 1,
      status: "APROBADO_PARA_COMPRA",
      notes: "Hormigonado de alcantarillas en km 134",
      createdAt: new Date("2025-03-02"),
      updatedAt: new Date("2025-03-02"),
      details: [
        {
          id: 1,
          materialRequestId: 1,
          materialId: 1,
          budgetItemId: 2,
          quantity: D("45"),
        },
      ],
    },
    {
      id: 2,
      number: "PM-000002",
      projectId: 1,
      workFrontId: 1,
      requestedById: 1,
      status: "BORRADOR",
      notes: "Riego de liga para carpeta asfáltica tramo 1",
      createdAt: new Date("2025-03-03"),
      updatedAt: new Date("2025-03-03"),
      details: [
        {
          id: 2,
          materialRequestId: 2,
          materialId: 2,
          budgetItemId: 3,
          quantity: D("20"),
        },
      ],
    },
  ];

  const purchaseOrders = [
    {
      id: 1,
      number: "OC-000001",
      projectId: 1,
      partnerId: 1,
      materialRequestId: 1,
      status: "EMITIDA",
      totalAmount: D("124000000"),
      stockRegistered: false,
      issueDate: new Date("2025-03-04"),
      expectedDate: new Date("2025-03-12"),
      createdAt: new Date("2025-03-04"),
      updatedAt: new Date("2025-03-04"),
      details: [
        {
          id: 1,
          purchaseOrderId: 1,
          materialId: 2,
          budgetItemId: 3,
          quantity: D("20"),
          unitPrice: D("6200000"),
          subtotal: D("124000000"),
          requestDetailId: 1,
        },
      ],
    },
    {
      id: 2,
      number: "OC-000002",
      projectId: 1,
      partnerId: 2,
      materialRequestId: 1,
      status: "APROBADO_PARA_COMPRA",
      totalAmount: D("85000000"),
      stockRegistered: false,
      issueDate: null,
      expectedDate: new Date("2025-03-15"),
      createdAt: new Date("2025-03-05"),
      updatedAt: new Date("2025-03-05"),
      details: [
        {
          id: 2,
          purchaseOrderId: 2,
          materialId: 3,
          budgetItemId: 2,
          quantity: D("10000"),
          unitPrice: D("8500"),
          subtotal: D("85000000"),
          requestDetailId: 1,
        },
      ],
    },
  ];

  const subcontracts = [
    {
      id: 1,
      number: "SC-000001",
      projectId: 1,
      partnerId: 3,
      budgetItemId: 3,
      description: "Pavimentación asfáltica en tramo principal Km 132 a Km 140",
      contractAmount: D("1200000000"),
      certifiedAmount: D("300000000"),
      paidAmount: D("0"),
      status: "ACTIVO",
      startDate: new Date("2025-03-01"),
      endDate: new Date("2025-10-31"),
      createdAt: new Date("2025-03-01"),
      updatedAt: new Date("2025-03-01"),
      certificates: [
        {
          id: 1,
          subcontractId: 1,
          number: "CERT-000001",
          issueDate: new Date("2025-03-05"),
          amount: D("300000000"),
          status: "EMITIDA",
          advancePercentage: D("25"),
          notes: "Certificado 1er mes de avance físico",
        },
      ],
    },
  ];

  const stockMovements = [
    {
      id: 1,
      projectId: 1,
      materialId: 1,
      movementType: "RECEIPT",
      quantity: D("50"),
      sourceType: "InitialStock",
      sourceId: 1,
      note: "Carga inicial de almacén central",
      createdAt: new Date("2025-03-01"),
    },
    {
      id: 2,
      projectId: 1,
      materialId: 4,
      movementType: "RECEIPT",
      quantity: D("200"),
      sourceType: "InitialStock",
      sourceId: 2,
      note: "Acopio de áridos triturados en campamento",
      createdAt: new Date("2025-03-02"),
    },
  ];

  return {
    project: [project],
    budgetItem: budgetItems,
    personnel,
    workFront: workFronts,
    partner: partners,
    material: materials,
    materialRequest: materialRequests,
    materialRequestDetail: [] as any[],
    purchaseOrder: purchaseOrders,
    purchaseOrderDetail: [] as any[],
    subcontractorContract: subcontracts,
    subcontractorCertificate: subcontracts[0].certificates,
    warehouseStock,
    stockMovement: stockMovements,
    budgetCommitment: [] as any[],
    documentAuditLog: [] as any[],
    projectBackup: [] as any[],
  };
}

let mockStore = createInitialStore();

function expandRelations(modelName: string, item: any, include?: any) {
  if (!item) return item;
  const res = { ...item };

  if (modelName === "project" || include?.project) {
    if (include?.budgetItems && item.id) {
      res.budgetItems = mockStore.budgetItem.filter((b) => b.projectId === item.id);
    }
    if (include?.workFronts && item.id) {
      res.workFronts = mockStore.workFront.filter((w) => w.projectId === item.id);
    }
  }

  if (res.projectId && !res.project) {
    res.project = mockStore.project.find((p) => p.id === res.projectId) || null;
  }
  if (res.materialId && !res.material) {
    res.material = mockStore.material.find((m) => m.id === res.materialId) || null;
  }
  if (res.partnerId && !res.partner) {
    res.partner = mockStore.partner.find((p) => p.id === res.partnerId) || null;
  }
  if (res.chiefId && !res.chief) {
    res.chief = mockStore.personnel.find((p) => p.id === res.chiefId) || null;
  }
  if (res.requestedById && !res.requestedBy) {
    res.requestedBy = mockStore.personnel.find((p) => p.id === res.requestedById) || null;
  }
  if (res.workFrontId && !res.workFront) {
    res.workFront = mockStore.workFront.find((w) => w.id === res.workFrontId) || null;
  }
  if (res.budgetItemId && !res.budgetItem) {
    res.budgetItem = mockStore.budgetItem.find((b) => b.id === res.budgetItemId) || null;
  }
  if (res.materialRequestId && !res.materialRequest) {
    res.materialRequest = mockStore.materialRequest.find((mr) => mr.id === res.materialRequestId) || null;
  }

  if (res.subcontractId && !res.contract) {
    res.contract = mockStore.subcontractorContract.find((c) => c.id === res.subcontractId) || null;
  }

  if (res.details && Array.isArray(res.details)) {
    res.details = res.details.map((d: any) => ({
      ...d,
      material: d.material || mockStore.material.find((m) => m.id === d.materialId) || null,
      budgetItem: d.budgetItem || mockStore.budgetItem.find((b) => b.id === d.budgetItemId) || null,
    }));
  }

  if (include?.certificates && item.certificates) {
    res.certificates = item.certificates;
  }

  return res;
}

function matchesWhere(rawItem: any, where: any, modelName: string = ""): boolean {
  if (!where) return true;
  const item = expandRelations(modelName, rawItem);

  for (const [key, val] of Object.entries(where)) {
    if (val === null && item[key] !== null) return false;
    if (val === undefined) continue;

    if (typeof val === "object" && val !== null) {
      if ("in" in val && Array.isArray((val as any).in)) {
        if (!(val as any).in.includes(item[key])) return false;
      } else if ("notIn" in val && Array.isArray((val as any).notIn)) {
        if ((val as any).notIn.includes(item[key])) return false;
      } else if ("not" in val) {
        if (item[key] === (val as any).not) return false;
      } else {
        // Nested relation or composite key e.g. projectId_materialId or contract: { projectId }
        let target = item[key];
        if (!target && key === "project" && item.projectId) {
          target = mockStore.project.find((p) => p.id === item.projectId);
        } else if (!target && key === "contract" && item.subcontractId) {
          target = mockStore.subcontractorContract.find((c) => c.id === item.subcontractId);
        }

        let matched = true;
        for (const [subK, subV] of Object.entries(val)) {
          if (item[subK] !== undefined) {
            if (item[subK] !== subV) matched = false;
          } else if (target && typeof target === "object") {
            if (typeof subV === "object" && subV !== null) {
              if ("not" in (subV as any) && target[subK] === (subV as any).not) matched = false;
            } else if (target[subK] !== subV) {
              matched = false;
            }
          } else {
            matched = false;
          }
        }
        if (!matched) return false;
      }
    } else if (item[key] !== val) {
      return false;
    }
  }
  return true;
}

function applyUpdateData(item: any, data: any) {
  if (!data) return;
  for (const [key, val] of Object.entries(data)) {
    if (val !== null && typeof val === "object" && !Array.isArray(val) && !(val instanceof Date)) {
      if ("increment" in val) {
        const inc = (val as any).increment;
        item[key] = toDecimal(item[key] ?? 0).plus(toDecimal(inc));
      } else if ("decrement" in val) {
        const dec = (val as any).decrement;
        item[key] = toDecimal(item[key] ?? 0).minus(toDecimal(dec));
      } else if ("set" in val) {
        item[key] = (val as any).set;
      } else if ("connect" in val) {
        if ((val as any).connect?.id !== undefined) {
          item[`${key}Id`] = (val as any).connect.id;
        }
      } else {
        item[key] = val;
      }
    } else {
      item[key] = val;
    }
  }
  item.updatedAt = new Date();
}

function createMockModel(modelName: string) {
  return {
    findMany: async (args?: any) => {
      const collection = (mockStore as any)[modelName] || [];
      let results = [...collection];

      if (args?.where) {
        results = results.filter((item) => matchesWhere(item, args.where));
      }

      if (args?.take && typeof args.take === "number") {
        results = results.slice(0, args.take);
      }

      return results.map((item) => expandRelations(modelName, item, args?.include));
    },
    findFirst: async (args?: any) => {
      const collection = (mockStore as any)[modelName] || [];
      if (!args?.where) return collection[0] ? expandRelations(modelName, collection[0], args?.include) : null;
      const found = collection.find((item: any) => matchesWhere(item, args.where)) || null;
      return expandRelations(modelName, found, args?.include);
    },
    findUnique: async (args?: any) => {
      const collection = (mockStore as any)[modelName] || [];
      if (!args?.where) return null;

      let found = null;
      if (args.where.id !== undefined) {
        found = collection.find((item: any) => item.id === args.where.id);
      } else {
        found = collection.find((item: any) => matchesWhere(item, args.where)) || null;
      }

      return expandRelations(modelName, found, args?.include);
    },
    create: async (args: any) => {
      if (!(mockStore as any)[modelName]) {
        (mockStore as any)[modelName] = [];
      }
      const collection = (mockStore as any)[modelName];
      const newId = collection.length > 0 ? Math.max(...collection.map((i: any) => i.id || 0)) + 1 : 1;

      let detailsArray: any[] = [];
      if (args.data.details?.create) {
        const createData = Array.isArray(args.data.details.create)
          ? args.data.details.create
          : [args.data.details.create];
        detailsArray = createData.map((d: any, idx: number) => ({
          id: Date.now() + idx,
          ...d,
        }));
      }

      const newItem = {
        id: newId,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...args.data,
        details: detailsArray.length > 0 ? detailsArray : args.data.details,
      };
      collection.push(newItem);
      return expandRelations(modelName, newItem, args?.include);
    },
    update: async (args: any) => {
      const collection = (mockStore as any)[modelName] || [];
      const item = collection.find((i: any) => matchesWhere(i, args?.where));
      if (item) {
        applyUpdateData(item, args.data);
        return expandRelations(modelName, item, args?.include);
      }
      return args.data ?? {};
    },
    updateMany: async (args: any) => {
      const collection = (mockStore as any)[modelName] || [];
      let count = 0;
      for (const item of collection) {
        if (!args?.where || matchesWhere(item, args.where)) {
          applyUpdateData(item, args.data);
          count++;
        }
      }
      return { count };
    },
    upsert: async (args: any) => {
      if (!(mockStore as any)[modelName]) {
        (mockStore as any)[modelName] = [];
      }
      const collection = (mockStore as any)[modelName];
      let item = collection.find((i: any) => matchesWhere(i, args?.where));
      if (item) {
        if (args.update) {
          applyUpdateData(item, args.update);
        }
        return expandRelations(modelName, item, args?.include);
      } else {
        const createData = { ...(args.create || {}) };
        if (args.where) {
          for (const [k, v] of Object.entries(args.where)) {
            if (typeof v === "object" && v !== null && k.includes("_")) {
              for (const [subK, subV] of Object.entries(v)) {
                if (createData[subK] === undefined) {
                  createData[subK] = subV;
                }
              }
            } else if (v !== undefined && typeof v !== "object" && createData[k] === undefined) {
              createData[k] = v;
            }
          }
        }
        const newId = collection.length > 0 ? Math.max(...collection.map((i: any) => i.id || 0)) + 1 : 1;
        const newItem = {
          id: newId,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...createData,
        };
        collection.push(newItem);
        return expandRelations(modelName, newItem, args?.include);
      }
    },
    delete: async (args: any) => {
      const collection = (mockStore as any)[modelName] || [];
      const idx = collection.findIndex((i: any) => matchesWhere(i, args?.where));
      if (idx !== -1) {
        const [deleted] = collection.splice(idx, 1);
        return deleted;
      }
      return {};
    },
    deleteMany: async (args?: any) => {
      if (!args?.where) {
        (mockStore as any)[modelName] = [];
        return { count: 0 };
      }
      const collection = (mockStore as any)[modelName] || [];
      const remaining = collection.filter((i: any) => !matchesWhere(i, args.where));
      const deletedCount = collection.length - remaining.length;
      (mockStore as any)[modelName] = remaining;
      return { count: deletedCount };
    },
    aggregate: async (args?: any) => {
      const collection = (mockStore as any)[modelName] || [];
      let filtered = collection;
      if (args?.where) {
        filtered = collection.filter((item: any) => matchesWhere(item, args.where));
      }
      const sumResult: Record<string, any> = {};
      if (args?._sum && typeof args._sum === "object") {
        for (const key of Object.keys(args._sum)) {
          let sum = new Prisma.Decimal(0);
          for (const item of filtered) {
            if (item[key] !== undefined && item[key] !== null) {
              sum = sum.plus(toDecimal(item[key]));
            }
          }
          sumResult[key] = sum;
        }
      } else {
        let totalAmount = new Prisma.Decimal(0);
        let amount = new Prisma.Decimal(0);
        for (const item of filtered) {
          if (item.totalAmount) totalAmount = totalAmount.plus(toDecimal(item.totalAmount));
          if (item.amount) amount = amount.plus(toDecimal(item.amount));
        }
        sumResult.totalAmount = totalAmount;
        sumResult.amount = amount;
      }
      return {
        _sum: sumResult,
        _count: filtered.length,
      };
    },
    count: async (args?: any) => {
      const collection = (mockStore as any)[modelName] || [];
      if (!args?.where) return collection.length;
      return collection.filter((item: any) => matchesWhere(item, args.where)).length;
    },
  };
}

let rawPrisma: PrismaClient | null = null;
let isDbOffline = !process.env.DATABASE_URL || process.env.DATABASE_URL.includes("mock") || process.env.DATABASE_URL.includes("servidor");

if (!isDbOffline) {
  try {
    rawPrisma = new PrismaClient({
      log: ["error"],
    });
  } catch (err) {
    isDbOffline = true;
    console.warn("[InfraTrack ERP] No se pudo instanciar PrismaClient real, usando mock:", err);
  }
}

export const prisma: PrismaClient = new Proxy(
  {},
  {
    get(_target, prop: string) {
      if (prop === "$connect") return async () => {};
      if (prop === "$disconnect") return async () => {};
      if (prop === "$transaction") {
        return async (arg: any) => {
          if (typeof arg === "function") {
            return arg(prisma);
          }
          if (Array.isArray(arg)) {
            return Promise.all(arg);
          }
          return arg;
        };
      }

      const mockModel = createMockModel(prop);

      if (!isDbOffline && rawPrisma && prop in rawPrisma) {
        const realModel = (rawPrisma as any)[prop];
        return new Proxy(realModel, {
          get(targetModel, method: string) {
            const originalMethod = targetModel[method];
            if (typeof originalMethod !== "function") return targetModel[method];
            return async (...args: any[]) => {
              if (isDbOffline) {
                const mockFn = (mockModel as any)[method];
                return typeof mockFn === "function" ? mockFn(...args) : null;
              }
              try {
                return await originalMethod.apply(targetModel, args);
              } catch (dbErr: any) {
                isDbOffline = true;
                console.warn(
                  `[InfraTrack ERP] Base de datos no disponible (${dbErr?.code || "offline"}), activando modo memoria simulada.`
                );
                const mockFn = (mockModel as any)[method];
                return typeof mockFn === "function" ? mockFn(...args) : null;
              }
            };
          },
        });
      }

      return mockModel;
    },
  }
) as unknown as PrismaClient;

