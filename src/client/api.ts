import {
  DashboardData,
  Project,
  Material,
  Partner,
  Personnel,
  WorkFront,
  BudgetItem,
  MaterialRequest,
  PurchaseOrder,
  SubcontractorContract,
  WarehouseStock,
  StockMovement,
} from "./types";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  const payload = await response.json();
  if (!response.ok || payload.success === false) {
    const errorMsg =
      payload.error?.message ||
      payload.message ||
      (typeof payload.error === "string" ? payload.error : "Error en el servidor");
    throw new Error(errorMsg);
  }
  return payload.data as T;
}

export const api = {
  // Health
  getHealth: () => request<{ status: string; service: string }>("/health"),

  // Dashboard
  getDashboard: (projectId?: number) =>
    request<DashboardData>(`/api/dashboard${projectId ? `?projectId=${projectId}` : ""}`),

  // Catalogs
  getProjects: () => request<Project[]>("/api/projects"),
  getMaterials: () => request<Material[]>("/api/materials"),
  getPartners: (kind?: string) =>
    request<Partner[]>(`/api/partners${kind ? `?kind=${kind}` : ""}`),
  getPersonnel: () => request<Personnel[]>("/api/personnel"),
  getWorkFronts: (projectId?: number) =>
    request<WorkFront[]>(`/api/work-fronts${projectId ? `?projectId=${projectId}` : ""}`),
  getBudgetItems: (projectId?: number) =>
    request<BudgetItem[]>(`/api/budget-items${projectId ? `?projectId=${projectId}` : ""}`),

  // Material Requests
  getMaterialRequests: () => request<MaterialRequest[]>("/api/pedidos"),
  createMaterialRequest: (body: {
    projectId: number;
    workFrontId: number;
    requestedById: number;
    requestedDate?: string;
    notes?: string;
    details: {
      materialId: number;
      budgetItemId: number;
      quantity: number;
    }[];
  }) =>
    request<MaterialRequest>("/api/pedidos", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  approveMaterialRequest: (id: number) =>
    request<MaterialRequest>(`/api/pedidos/${id}/aprobar`, { method: "POST" }),
  deleteMaterialRequest: (id: number) =>
    request<{ deleted: boolean }>(`/api/pedidos/${id}`, { method: "DELETE" }),

  // Purchase Orders
  getPurchaseOrders: () => request<PurchaseOrder[]>("/api/compras"),
  createPurchaseOrder: (body: {
    materialRequestId: number;
    partnerId: number;
    expectedDate?: string;
    details: {
      requestDetailId: number;
      quantity: number;
      unitPrice: number;
    }[];
  }) =>
    request<PurchaseOrder>("/api/compras", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  approvePurchaseOrder: (id: number) =>
    request<PurchaseOrder>(`/api/compras/${id}/aprobar`, { method: "POST" }),
  issuePurchaseOrder: (id: number) =>
    request<PurchaseOrder>(`/api/compras/${id}/emitir`, { method: "POST" }),
  receivePurchaseOrder: (id: number) =>
    request<PurchaseOrder>(`/api/compras/${id}/recibir`, { method: "POST" }),
  cancelPurchaseOrder: (id: number) =>
    request<PurchaseOrder>(`/api/compras/${id}/anular`, { method: "POST" }),
  deletePurchaseOrder: (id: number) =>
    request<{ deleted: boolean }>(`/api/compras/${id}`, { method: "DELETE" }),

  // Subcontracts
  getSubcontracts: () => request<SubcontractorContract[]>("/api/subcontratos"),
  createSubcontract: (body: {
    projectId: number;
    partnerId: number;
    budgetItemId: number;
    description: string;
    contractAmount: number;
    startDate?: string;
    endDate?: string;
  }) =>
    request<SubcontractorContract>("/api/subcontratos", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  createSubcontractCertificate: (body: {
    subcontractId: number;
    amount: number;
    advancePercentage?: number;
    notes?: string;
    periodFrom?: string;
    periodTo?: string;
    physicalProgressPct?: number;
  }) =>
    request<any>("/api/subcontratos/certificados", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  certifySubcontractCertificate: (id: number) =>
    request<any>(`/api/subcontratos/certificados/${id}/certificar`, { method: "POST" }),
  approveSubcontractCertificate: (id: number) =>
    request<any>(`/api/subcontratos/certificados/${id}/aprobar`, { method: "POST" }),
  paySubcontractCertificate: (id: number) =>
    request<any>(`/api/subcontratos/certificados/${id}/pagar`, { method: "POST" }),
  cancelSubcontractCertificate: (id: number) =>
    request<any>(`/api/subcontratos/certificados/${id}/anular`, { method: "POST" }),

  // Certificaciones de Avance / Obras Viales
  getCertificaciones: (projectId?: number) =>
    request<any[]>(`/api/certificaciones${projectId ? `?projectId=${projectId}` : ""}`),
  createCertificacion: (body: {
    projectId?: number;
    partnerId?: number;
    budgetItemId?: number;
    subcontratista?: string;
    rubro?: string;
    unidad?: string;
    cantidad_medida: number;
    monto_total: number;
    evidencia?: string;
    esAdenda?: boolean;
  }) =>
    request<any>("/api/certificaciones", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  importBudgetFile: async (file: File, projectId?: number) => {
    const formData = new FormData();
    formData.append("file", file);
    if (projectId) formData.append("projectId", String(projectId));
    const response = await fetch("/api/certificaciones/import-budget", {
      method: "POST",
      body: formData,
    });
    const payload = await response.json();
    if (!response.ok || payload.success === false) {
      throw new Error(payload.error?.message || payload.message || "Error al importar presupuesto");
    }
    return payload.data;
  },

  // Warehouse Stock
  getStock: (projectId?: number) =>
    request<WarehouseStock[]>(`/api/stock${projectId ? `?projectId=${projectId}` : ""}`),
  getStockMovements: (projectId?: number) =>
    request<StockMovement[]>(`/api/stock/movimientos${projectId ? `?projectId=${projectId}` : ""}`),
  registerConsumption: (projectId: number, body: { materialId: number; quantity: number; note?: string }) =>
    request<WarehouseStock>(`/api/stock/${projectId}/consumos`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  registerAdjustment: (body: { projectId: number; materialId: number; quantity: number; note: string }) =>
    request<WarehouseStock>("/api/stock/ajustes", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
