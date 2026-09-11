import React from "react";
import {
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Receipt,
  FileCheck,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Layers,
  ChevronRight,
  Package,
  HardHat,
  Truck,
  Plus,
} from "lucide-react";
import { DashboardData, Project, BudgetItem, MaterialRequest, PurchaseOrder, SubcontractorContract } from "../types";
import { formatMoney, formatCompactMoney, formatPercent, formatDate } from "../utils/format";
import { getStatusBadge } from "../utils/statusBadges";

interface DashboardTabProps {
  project?: Project | null;
  dashboard: DashboardData | null;
  currency: "PYG" | "USD";
  materialRequests: MaterialRequest[];
  purchaseOrders: PurchaseOrder[];
  subcontracts: SubcontractorContract[];
  onNavigateTab: (tab: any) => void;
  onOpenNewRequest: () => void;
  onOpenNewOrder: () => void;
  onOpenNewSubcontract: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  project,
  dashboard,
  currency,
  materialRequests,
  purchaseOrders,
  subcontracts,
  onNavigateTab,
  onOpenNewRequest,
  onOpenNewOrder,
  onOpenNewSubcontract,
}) => {
  const kpis = dashboard?.kpis || {
    globalBudget: 0,
    contractualAmount: 0,
    realUpdated: 0,
    totalSpent: 0,
    availableReal: 0,
    committed: 0,
    realSpend: 0,
    issuedPurchaseOrders: 0,
    subcontractCertified: 0,
    subcontractPaid: 0,
  };

  const budgetItems = dashboard?.budgetByItem || [];
  const issuedOrders = dashboard?.issuedOrders || [];
  const recentCertificates = dashboard?.recentCertificates || [];

  // Compute percentages
  const contractual = kpis.contractualAmount || kpis.globalBudget || 1;
  const realTotal = kpis.realUpdated || contractual;
  const totalSpent = kpis.totalSpent || 0;
  const availableReal = kpis.availableReal || Math.max(0, realTotal - totalSpent);
  const spentPct = Math.min(100, (totalSpent / realTotal) * 100);

  // Requisitions pending approval
  const pendingRequests = materialRequests.filter((r) => r.status === "BORRADOR");
  // Orders pending issue or receive
  const pendingOrders = purchaseOrders.filter((o) => o.status === "BORRADOR" || o.status === "APROBADO_PARA_COMPRA");

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner with Quick Actions */}
      <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <h1 className="text-xl font-bold text-stone-900 font-display">
              Control Presupuestario & Estado de Faena
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Supervisión en tiempo real de partidas presupuestarias, compromisos financieros y aprovisionamiento en obra.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            id="btn-quick-new-request"
            onClick={onOpenNewRequest}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 active:scale-95 text-white text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Pedido (PM)</span>
          </button>
          <button
            id="btn-quick-new-order"
            onClick={onOpenNewOrder}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Orden (OC)</span>
          </button>
          <button
            id="btn-quick-new-subcontract"
            onClick={onOpenNewSubcontract}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 active:scale-95 text-white text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Subcontrato</span>
          </button>
        </div>
      </div>

      {/* Primary Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Contractual Initial */}
        <div className="bg-white rounded-xl p-4 border border-stone-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Presupuesto Contractual
            </span>
            <div className="p-2 rounded-lg bg-stone-100 text-stone-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 font-mono text-xl font-extrabold text-stone-900">
            {formatMoney(contractual, currency)}
          </div>
          <div className="mt-2 flex items-center text-xs text-stone-500 justify-between border-t border-stone-100 pt-2">
            <span>Contrato Base MOPC</span>
            <span className="font-semibold text-stone-700">{project?.code || "PY02"}</span>
          </div>
        </div>

        {/* Metric 2: Real Updated with Adendas */}
        <div className="bg-white rounded-xl p-4 border border-stone-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Monto Real Actualizado
            </span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 font-mono text-xl font-extrabold text-blue-900">
            {formatMoney(realTotal, currency)}
          </div>
          <div className="mt-2 flex items-center text-xs text-stone-500 justify-between border-t border-stone-100 pt-2">
            <span>Incluye Adendas/Modif.</span>
            <span className="font-semibold text-blue-700 font-mono">
              +{formatCompactMoney(Math.max(0, realTotal - contractual))}
            </span>
          </div>
        </div>

        {/* Metric 3: Total Spent & Committed */}
        <div className="bg-white rounded-xl p-4 border border-stone-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Comprometido + Ejecutado
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 font-mono text-xl font-extrabold text-amber-900">
            {formatMoney(totalSpent, currency)}
          </div>
          <div className="mt-2 flex items-center text-xs text-stone-500 justify-between border-t border-stone-100 pt-2">
            <span>Ratio Consumido</span>
            <span className="font-bold text-amber-800 font-mono">{spentPct.toFixed(1)}%</span>
          </div>
        </div>

        {/* Metric 4: Real Available */}
        <div className="bg-white rounded-xl p-4 border border-stone-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Saldo Disponible Real
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 font-mono text-xl font-extrabold text-emerald-900">
            {formatMoney(availableReal, currency)}
          </div>
          <div className="mt-2 flex items-center text-xs text-stone-500 justify-between border-t border-stone-100 pt-2">
            <span>Margen de Obra</span>
            <span className="font-bold text-emerald-700 font-mono">
              {(100 - spentPct).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar with Hard Budget Ceiling */}
      <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
              Ejecución Presupuestaria Global vs. Techo de Gasto
            </h2>
            <p className="text-xs text-stone-500">
              Monitoreo estricto del techo presupuestario para prevenir descalces financieros en faena.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-stone-600">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              Gastado: {formatCompactMoney(totalSpent)}
            </span>
            <span className="flex items-center gap-1.5 text-stone-600">
              <span className="w-2.5 h-2.5 rounded-full bg-stone-200"></span>
              Disponible: {formatCompactMoney(availableReal)}
            </span>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full bg-stone-100 rounded-full h-3 overflow-hidden p-0.5 border border-stone-200">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              spentPct > 90 ? "bg-rose-500" : spentPct > 75 ? "bg-amber-500" : "bg-blue-600"
            }`}
            style={{ width: `${Math.max(2, spentPct)}%` }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-stone-500">
          <span>0 ₲</span>
          <span className="font-semibold text-stone-700">Techo: {formatMoney(realTotal, currency)}</span>
        </div>
      </div>

      {/* Two Column Layout: Budget Items Watchdog & Operational Action Queues */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Budget Items Watchdog (Partidas Presupuestarias) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                Techo Presupuestario por Rubro / Partida
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab("partidas")}
              className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 transition"
            >
              <span>Ver todas las partidas</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 overflow-x-auto">
            {budgetItems.length === 0 ? (
              <div className="text-center py-8 text-stone-400 text-xs">
                No hay partidas registradas para esta obra.
              </div>
            ) : (
              <div className="space-y-4">
                {budgetItems.map((item) => {
                  const orig = Number(item.original ?? item.originalAmount ?? 0);
                  const comm = Number(item.committed ?? item.committedAmount ?? 0);
                  const exec = Number(item.executed ?? item.executedAmount ?? 0);
                  const rem = Number(item.remaining ?? item.available ?? orig - (comm + exec));
                  const pct = orig > 0 ? ((comm + exec) / orig) * 100 : 0;
                  const isCritical = pct >= 90;
                  const isWarning = pct >= 75 && pct < 90;

                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg border border-stone-200 bg-stone-50/50 hover:bg-stone-50 transition"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-stone-200 text-stone-800">
                            {item.code}
                          </span>
                          <span className="text-xs font-semibold text-stone-900">{item.name}</span>
                          <span className="text-[10px] uppercase font-bold text-stone-400 bg-stone-100 px-1 rounded">
                            {item.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-mono">
                          <span className="text-stone-500">
                            Gastado: <span className="font-semibold text-stone-800">{formatCompactMoney(comm + exec)}</span>
                          </span>
                          <span className="text-stone-300">/</span>
                          <span className="text-stone-700 font-bold">{formatCompactMoney(orig)}</span>
                        </div>
                      </div>

                      {/* Item progress bar */}
                      <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isCritical ? "bg-rose-500" : isWarning ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min(100, Math.max(3, pct))}%` }}
                        />
                      </div>

                      <div className="mt-1.5 flex items-center justify-between text-[11px]">
                        <span className="text-stone-500">
                          Saldo Disponible:{" "}
                          <span className="font-mono font-semibold text-emerald-700">
                            {formatMoney(rem, currency)}
                          </span>
                        </span>
                        <span
                          className={`font-mono font-bold ${
                            isCritical
                              ? "text-rose-600"
                              : isWarning
                              ? "text-amber-600"
                              : "text-emerald-700"
                          }`}
                        >
                          {pct.toFixed(1)}% utilizado
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Operational Action Queues */}
        <div className="space-y-4">
          {/* Pending Approval Requisitions */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <HardHat className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                  Pedidos Pendientes ({pendingRequests.length})
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab("pedidos")}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold"
              >
                Ver todos
              </button>
            </div>

            {pendingRequests.length === 0 ? (
              <p className="text-xs text-stone-400 py-3 text-center">
                No hay pedidos en borrador pendientes.
              </p>
            ) : (
              <div className="space-y-2">
                {pendingRequests.slice(0, 3).map((req) => (
                  <div
                    key={req.id}
                    className="p-2.5 rounded-lg border border-stone-200 bg-stone-50 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-mono font-bold text-stone-900">{req.number}</div>
                      <div className="text-[11px] text-stone-500">
                        {req.workFront?.name || "Frente de Obra"}
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigateTab("pedidos")}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-semibold transition"
                    >
                      Revisar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Purchase Orders */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                  Órdenes en Gestión ({pendingOrders.length})
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab("compras")}
                className="text-[11px] text-amber-700 hover:text-amber-900 font-semibold"
              >
                Ver todas
              </button>
            </div>

            {pendingOrders.length === 0 ? (
              <p className="text-xs text-stone-400 py-3 text-center">
                Todas las órdenes han sido emitidas o recibidas.
              </p>
            ) : (
              <div className="space-y-2">
                {pendingOrders.slice(0, 3).map((order) => (
                  <div
                    key={order.id}
                    className="p-2.5 rounded-lg border border-stone-200 bg-stone-50 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-mono font-bold text-stone-900">{order.number}</div>
                      <div className="text-[11px] text-stone-500 font-mono">
                        {formatMoney(order.totalAmount, currency)}
                      </div>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Subcontractors Commitment Card */}
          <div className="bg-stone-900 text-stone-100 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Subcontratos Viales
              </span>
              <FileCheck className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xs text-stone-300">
              Certificados acumulados de avance físico y retenciones de garantía de obra.
            </div>
            <div className="mt-3 pt-3 border-t border-stone-800 flex items-center justify-between text-xs">
              <span className="text-stone-400">Total Certificado</span>
              <span className="font-mono font-bold text-stone-100">
                {formatMoney(kpis.subcontractCertified, currency)}
              </span>
            </div>
            <button
              onClick={() => onNavigateTab("subcontratos")}
              className="mt-3 w-full py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 text-xs font-bold transition flex items-center justify-center gap-1"
            >
              <span>Gestionar Subcontratos</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Issued Orders Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-stone-700" />
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
              Últimas Órdenes de Compra Emitidas
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab("compras")}
            className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1"
          >
            <span>Ver módulo de compras</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
              <tr>
                <th className="p-3">N° Orden</th>
                <th className="p-3">Proveedor / Proveedor Vial</th>
                <th className="p-3">Fecha Emisión</th>
                <th className="p-3 text-right">Monto Total</th>
                <th className="p-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {issuedOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-stone-400">
                    No se han emitido órdenes de compra aún.
                  </td>
                </tr>
              ) : (
                issuedOrders.map((ord: any) => (
                  <tr key={ord.id} className="hover:bg-stone-50/80 transition">
                    <td className="p-3 font-mono font-bold text-stone-900">{ord.number}</td>
                    <td className="p-3 font-medium text-stone-800">
                      {ord.partner?.name || ord.partnerName || "Proveedor"}
                    </td>
                    <td className="p-3 text-stone-500">{formatDate(ord.issueDate)}</td>
                    <td className="p-3 text-right font-mono font-semibold text-stone-900">
                      {formatMoney(ord.totalAmount, currency)}
                    </td>
                    <td className="p-3 text-center">
                      {getStatusBadge(ord.status || "EMITIDA")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
