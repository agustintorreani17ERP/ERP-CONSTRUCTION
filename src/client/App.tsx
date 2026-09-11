import React, { useState, useEffect, useCallback } from "react";
import { Navbar, ActiveTab } from "./components/Navbar";
import { DashboardTab } from "./components/DashboardTab";
import { BudgetItemsTab } from "./components/BudgetItemsTab";
import { MaterialRequestsTab } from "./components/MaterialRequestsTab";
import { PurchaseOrdersTab } from "./components/PurchaseOrdersTab";
import { SubcontractsTab } from "./components/SubcontractsTab";
import { StockWarehouseTab } from "./components/StockWarehouseTab";
import { WorkFrontsTab } from "./components/WorkFrontsTab";
import { DailyLogTab } from "./components/DailyLogTab";
import { PartnersPersonnelTab } from "./components/PartnersPersonnelTab";
import { ToastContainer, ToastMessage } from "./components/Toast";
import {
  Project,
  BudgetItem,
  WorkFront,
  Personnel,
  Partner,
  Material,
  MaterialRequest,
  PurchaseOrder,
  SubcontractorContract,
  WarehouseStock,
  StockMovement,
  DashboardData,
} from "./types";
import { api } from "./api";
import { Loader2, AlertCircle } from "lucide-react";

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [currency, setCurrency] = useState<"PYG" | "USD">("PYG");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Core entities
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(undefined);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [workFronts, setWorkFronts] = useState<WorkFront[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [subcontracts, setSubcontracts] = useState<SubcontractorContract[]>([]);
  const [stock, setStock] = useState<WarehouseStock[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);

  // Navigation helpers & states
  const [selectedRequestForPO, setSelectedRequestForPO] = useState<MaterialRequest | null>(null);
  const [openSubcontractModalTrigger, setOpenSubcontractModalTrigger] = useState(false);

  // Toast feedback state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch all primary project data
  const fetchData = useCallback(
    async (projId?: number, isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        // Fetch projects first if not loaded
        let currentProjects = projects;
        if (currentProjects.length === 0) {
          currentProjects = await api.getProjects();
          setProjects(currentProjects);
        }

        const effectiveProjId = projId || selectedProjectId || currentProjects[0]?.id || 1;
        if (!selectedProjectId && effectiveProjId) {
          setSelectedProjectId(effectiveProjId);
        }

        // Parallel queries
        const [
          dashRes,
          budRes,
          wfRes,
          persRes,
          partRes,
          matRes,
          reqRes,
          poRes,
          scRes,
          stockRes,
          movRes,
        ] = await Promise.allSettled([
          api.getDashboard(effectiveProjId),
          api.getBudgetItems(effectiveProjId),
          api.getWorkFronts(effectiveProjId),
          api.getPersonnel(),
          api.getPartners(),
          api.getMaterials(),
          api.getMaterialRequests(),
          api.getPurchaseOrders(),
          api.getSubcontracts(),
          api.getStock(effectiveProjId),
          api.getStockMovements(effectiveProjId),
        ]);

        if (dashRes.status === "fulfilled") setDashboard(dashRes.value);
        if (budRes.status === "fulfilled") setBudgetItems(budRes.value);
        if (wfRes.status === "fulfilled") setWorkFronts(wfRes.value);
        if (persRes.status === "fulfilled") setPersonnel(persRes.value);
        if (partRes.status === "fulfilled") setPartners(partRes.value);
        if (matRes.status === "fulfilled") setMaterials(matRes.value);
        if (reqRes.status === "fulfilled") setMaterialRequests(reqRes.value);
        if (poRes.status === "fulfilled") setPurchaseOrders(poRes.value);
        if (scRes.status === "fulfilled") setSubcontracts(scRes.value);
        if (stockRes.status === "fulfilled") setStock(stockRes.value);
        if (movRes.status === "fulfilled") setStockMovements(movRes.value);
      } catch (err: any) {
        console.error("Error loading ERP data:", err);
        setError(err.message || "Error al conectar con el servidor de la obra");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [projects, selectedProjectId]
  );

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectProject = (id: number) => {
    setSelectedProjectId(id);
    fetchData(id, true);
  };

  const handleRefresh = () => {
    fetchData(selectedProjectId, true);
  };

  const handleToggleCurrency = () => {
    setCurrency((prev) => (prev === "PYG" ? "USD" : "PYG"));
  };

  const handleOpenCreatePOForRequest = (req: MaterialRequest) => {
    setSelectedRequestForPO(req);
    setActiveTab("compras");
  };

  const currentProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  // Counters for Navbar badges
  const pendingRequisitionsCount = materialRequests.filter((r) => r.status === "BORRADOR").length;
  const pendingOrdersCount = purchaseOrders.filter(
    (o) => o.status === "BORRADOR" || o.status === "APROBADO_PARA_COMPRA"
  ).length;
  const pendingCertificatesCount = subcontracts.reduce((acc, sc) => {
    const pendingCerts = (sc.certificates || []).filter((c) => c.status === "BORRADOR");
    return acc + pendingCerts.length;
  }, 0);
  const lowStockCount = stock.filter((s) => Number(s.currentStock || 0) <= 5).length;

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col font-sans">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={handleSelectProject}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        currency={currency}
        onToggleCurrency={handleToggleCurrency}
        pendingRequisitionsCount={pendingRequisitionsCount}
        pendingOrdersCount={pendingOrdersCount}
        pendingCertificatesCount={pendingCertificatesCount}
        lowStockCount={lowStockCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-stone-500">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-3" />
            <p className="text-sm font-semibold">Cargando datos de obra y faena...</p>
            <p className="text-xs text-stone-400 mt-1">Conectando con base de datos presupuestaria</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center max-w-lg mx-auto my-12">
            <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
            <h2 className="text-base font-bold text-rose-900">Error de Comunicación</h2>
            <p className="text-xs text-rose-700 mt-1">{error}</p>
            <button
              onClick={() => fetchData(selectedProjectId, false)}
              className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              Reintentar Conexión
            </button>
          </div>
        ) : (
          <>
            {activeTab === "dashboard" && (
              <DashboardTab
                project={currentProject}
                dashboard={dashboard}
                currency={currency}
                materialRequests={materialRequests}
                purchaseOrders={purchaseOrders}
                subcontracts={subcontracts}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onOpenNewRequest={() => setActiveTab("pedidos")}
                onOpenNewOrder={() => setActiveTab("compras")}
                onOpenNewSubcontract={() => {
                  setOpenSubcontractModalTrigger(true);
                  setActiveTab("subcontratos");
                }}
              />
            )}

            {activeTab === "partidas" && (
              <BudgetItemsTab
                project={currentProject}
                budgetItems={budgetItems}
                currency={currency}
                onRefresh={handleRefresh}
                showToast={showToast}
              />
            )}

            {activeTab === "pedidos" && (
              <MaterialRequestsTab
                project={currentProject}
                materialRequests={materialRequests}
                workFronts={workFronts}
                personnel={personnel}
                materials={materials}
                budgetItems={budgetItems}
                currency={currency}
                onRefresh={handleRefresh}
                showToast={showToast}
                onOpenCreatePOForRequest={handleOpenCreatePOForRequest}
              />
            )}

            {activeTab === "compras" && (
              <PurchaseOrdersTab
                project={currentProject}
                purchaseOrders={purchaseOrders}
                materialRequests={materialRequests}
                partners={partners}
                currency={currency}
                onRefresh={handleRefresh}
                showToast={showToast}
                selectedRequestForNewPO={selectedRequestForPO}
                onClearSelectedRequestForPO={() => setSelectedRequestForPO(null)}
              />
            )}

            {activeTab === "subcontratos" && (
              <SubcontractsTab
                project={currentProject}
                subcontracts={subcontracts}
                partners={partners}
                budgetItems={budgetItems}
                currency={currency}
                onRefresh={handleRefresh}
                showToast={showToast}
                openNewModalByDefault={openSubcontractModalTrigger}
              />
            )}

            {activeTab === "stock" && (
              <StockWarehouseTab
                project={currentProject}
                stock={stock}
                movements={stockMovements}
                materials={materials}
                workFronts={workFronts}
                onRefresh={handleRefresh}
                showToast={showToast}
              />
            )}

            {activeTab === "frentes" && (
              <WorkFrontsTab
                project={currentProject}
                workFronts={workFronts}
                personnel={personnel}
              />
            )}

            {activeTab === "parte-diario" && (
              <DailyLogTab
                project={currentProject}
                workFronts={workFronts}
                showToast={showToast}
              />
            )}

            {activeTab === "directorio" && (
              <PartnersPersonnelTab
                partners={partners}
                personnel={personnel}
                materials={materials}
              />
            )}
          </>
        )}
      </main>

      {/* Global Toast Notifications Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
export default App;
