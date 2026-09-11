export interface Project {
  id: number;
  code: string;
  name: string;
  location?: string | null;
  roadSection?: string | null;
  contractNumber?: string | null;
  clientName?: string | null;
  executionMonths?: number | null;
  globalBudget: string | number;
  montoContractualManual?: string | number | null;
  montoRealActualizado?: string | number | null;
  startDate?: string | null;
  endDate?: string | null;
  status: string;
  budgetItems?: BudgetItem[];
  workFronts?: WorkFront[];
}

export interface BudgetItem {
  id: number;
  projectId: number;
  code: string;
  name: string;
  category: string;
  originalAmount: string | number;
  committedAmount: string | number;
  executedAmount: string | number;
}

export interface WorkFront {
  id: number;
  projectId: number;
  code: string;
  name: string;
  chiefId: number;
  chief?: Personnel;
}

export interface Personnel {
  id: number;
  fullName: string;
  role: "JEFE_FRENTE" | "COMPRAS" | "GERENCIA" | "ALMACEN";
  email?: string | null;
}

export interface Partner {
  id: number;
  kind: "SUPPLIER" | "SUBCONTRACTOR" | "BOTH";
  name: string;
  taxId: string;
  fiscalAddress?: string | null;
  phone?: string | null;
  email?: string | null;
  classification?: string | null;
}

export interface Material {
  id: number;
  code: string;
  description: string;
  unit: string;
  category: string;
  estimatedCost: string | number;
}

export interface MaterialRequestDetail {
  id: number;
  materialId: number;
  budgetItemId: number;
  quantity: string | number;
  material?: Material;
  budgetItem?: BudgetItem;
}

export interface MaterialRequest {
  id: number;
  number: string;
  projectId: number;
  workFrontId: number;
  requestedById: number;
  requestedDate?: string | null;
  status: "BORRADOR" | "APROBADO_PARA_COMPRA" | "EMITIDA" | "RECIBIDO" | "ANULADO";
  notes?: string | null;
  project?: Project;
  workFront?: WorkFront;
  requestedBy?: Personnel;
  details?: MaterialRequestDetail[];
  purchaseOrders?: { id: number; number: string; status: string }[];
  createdAt: string;
}

export interface PurchaseOrderDetail {
  id: number;
  materialId: number;
  budgetItemId: number;
  quantity: string | number;
  unitPrice: string | number;
  subtotal: string | number;
  material?: Material;
  budgetItem?: BudgetItem;
  requestDetail?: MaterialRequestDetail;
}

export interface PurchaseOrder {
  id: number;
  number: string;
  projectId: number;
  partnerId: number;
  materialRequestId?: number | null;
  issueDate?: string | null;
  expectedDate?: string | null;
  status: "BORRADOR" | "APROBADO_PARA_COMPRA" | "EMITIDA" | "RECIBIDO" | "ANULADO";
  totalAmount: string | number;
  stockRegistered: boolean;
  partner?: Partner;
  project?: Project;
  materialRequest?: MaterialRequest;
  details?: PurchaseOrderDetail[];
  createdAt: string;
}

export interface SubcontractCertificate {
  id: number;
  subcontractId: number;
  number: string;
  issueDate: string;
  amount: string | number;
  status: "BORRADOR" | "APROBADO_PARA_COMPRA" | "EMITIDA" | "RECIBIDO" | "ANULADO";
  advancePercentage?: string | number | null;
  notes?: string | null;
}

export interface SubcontractorContract {
  id: number;
  number: string;
  projectId: number;
  partnerId: number;
  budgetItemId: number;
  description: string;
  contractAmount: string | number;
  certifiedAmount?: string | number;
  paidAmount?: string | number;
  status: "BORRADOR" | "ACTIVO" | "CERRADO" | "CANCELADO";
  startDate?: string | null;
  endDate?: string | null;
  partner?: Partner;
  project?: Project;
  budgetItem?: BudgetItem;
  certificates?: SubcontractCertificate[];
}

export interface WarehouseStock {
  id: number;
  projectId: number;
  materialId: number;
  currentStock: string | number;
  reservedStock: string | number;
  project?: Project;
  material?: Material;
}

export interface StockMovement {
  id: number;
  projectId: number;
  materialId: number;
  movementType: "RECEIPT" | "CONSUMPTION" | "ADJUSTMENT";
  quantity: string | number;
  sourceType: string;
  sourceId?: number | null;
  note?: string | null;
  createdAt: string;
  project?: Project;
  material?: Material;
}

export interface DashboardData {
  kpis: {
    globalBudget: number;
    originalBudget: number;
    realSpend: number;
    committed: number;
    available: number;
    variance: number;
    issuedPurchaseOrders: number;
    subcontractCertified: number;
    subcontractPaid: number;
    contractualAmount: number;
    realUpdated: number;
    totalSpent: number;
    availableReal: number;
  };
  budgetByItem: {
    id: number;
    code: string;
    name: string;
    category: string;
    originalAmount?: number;
    committedAmount?: number;
    executedAmount?: number;
    available?: number;
    original?: number;
    committed?: number;
    executed?: number;
    remaining?: number;
  }[];
  issuedOrders: {
    id: number;
    number: string;
    partnerName: string;
    issueDate: string;
    totalAmount: number;
  }[];
  subcontractors: {
    id: number;
    number: string;
    partnerName: string;
    description: string;
    contractAmount: number;
    status: string;
    certifiedAmount: number;
  }[];
  recentCertificates: {
    id: number;
    number: string;
    subcontractNumber: string;
    partnerName: string;
    issueDate: string;
    amount: number;
    status: string;
  }[];
}

export interface Certificacion {
  id: number;
  projectId?: number | null;
  partnerId?: number | null;
  budgetItemId?: number | null;
  subcontratista?: string | null;
  rubro?: string | null;
  unidad?: string | null;
  cantidad_medida: number;
  monto_total: number;
  estado: "BORRADOR" | "EN_REVISION" | "APROBADA" | "RECHAZADA";
  evidencia?: string | null;
  esAdenda: boolean;
  project?: Project;
  partner?: Partner;
  budgetItem?: BudgetItem;
  createdAt?: string;
  updatedAt?: string;
}

export interface MachineryEquipment {
  id: string;
  code: string;
  name: string;
  type: "PESADA" | "TRANSPORTE" | "COMPACTACION" | "ASFALTO" | "MENOR";
  brandModel: string;
  plateOrSeries: string;
  workFrontId?: number;
  operatorName: string;
  status: "OPERATIVO" | "MANTENIMIENTO" | "STANDBY";
  fuelConsumptionPerHour: number; // liters/hour
  hourMeter: number;
}

export interface DailySiteLog {
  id: string;
  date: string;
  workFrontId: number;
  weather: "DESPEJADO" | "NUBLADO" | "LLUVIA_LEVE" | "LLUVIA_INTENSA_PARALIZADA";
  temperatureC: number;
  workStatus: "NORMAL" | "PARCIAL" | "SUSPENDIDA";
  directLaborCount: number;
  subcontractorLaborCount: number;
  hoursWorked: number;
  activitiesDescription: string;
  incidentsOrDelays?: string;
  supervisorName: string;
}

