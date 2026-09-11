import React, { useState } from "react";
import {
  Receipt,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Package,
  XCircle,
  Eye,
  Building2,
  Printer,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Truck,
  Check,
} from "lucide-react";
import {
  PurchaseOrder,
  MaterialRequest,
  Partner,
  Project,
} from "../types";
import { formatMoney, formatDate, formatDateTime } from "../utils/format";
import { getStatusBadge } from "../utils/statusBadges";
import { api } from "../api";

interface PurchaseOrdersTabProps {
  project?: Project | null;
  purchaseOrders: PurchaseOrder[];
  materialRequests: MaterialRequest[];
  partners: Partner[];
  currency: "PYG" | "USD";
  onRefresh: () => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
  selectedRequestForNewPO?: MaterialRequest | null;
  onClearSelectedRequestForPO: () => void;
}

export const PurchaseOrdersTab: React.FC<PurchaseOrdersTabProps> = ({
  project,
  purchaseOrders,
  materialRequests,
  partners,
  currency,
  onRefresh,
  showToast,
  selectedRequestForNewPO,
  onClearSelectedRequestForPO,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [partnerFilter, setPartnerFilter] = useState<string>("ALL");
  const [showNewModal, setShowNewModal] = useState(Boolean(selectedRequestForNewPO));
  const [inspectOrder, setInspectOrder] = useState<PurchaseOrder | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Eligible requests for new PO
  const eligibleRequests = materialRequests.filter(
    (r) => r.status === "APROBADO_PARA_COMPRA" || r.id === selectedRequestForNewPO?.id
  );

  // Form state
  const [selectedRequestId, setSelectedRequestId] = useState<number>(
    selectedRequestForNewPO?.id || eligibleRequests[0]?.id || 1
  );
  const [partnerId, setPartnerId] = useState<number>(partners[0]?.id || 1);
  const [expectedDate, setExpectedDate] = useState<string>("");
  const [unitPrice, setUnitPrice] = useState<number>(150000);

  // Active target request
  const currentReq = eligibleRequests.find((r) => r.id === selectedRequestId) || selectedRequestForNewPO;
  const currentDetail = currentReq?.details?.[0];

  const filteredOrders = purchaseOrders.filter((po) => {
    const matchesSearch =
      po.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (po.partner?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (po.details || []).some((d) =>
        (d.material?.description || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesStatus = statusFilter === "ALL" || po.status === statusFilter;
    const matchesPartner = partnerFilter === "ALL" || String(po.partnerId) === partnerFilter;
    return matchesSearch && matchesStatus && matchesPartner;
  });

  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try {
      await api.approvePurchaseOrder(id);
      showToast(`Orden #${id} aprobada exitosamente`);
      onRefresh();
    } catch (err: any) {
      showToast(err.message || "Error al aprobar orden", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleIssue = async (id: number) => {
    setActionLoading(id);
    try {
      await api.issuePurchaseOrder(id);
      showToast(`Orden #${id} emitida y presupuesto comprometido`);
      onRefresh();
    } catch (err: any) {
      showToast(err.message || "Error al emitir orden", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReceive = async (id: number) => {
    setActionLoading(id);
    try {
      await api.receivePurchaseOrder(id);
      showToast(`Orden #${id} recibida en obra e ingresada a pañol`);
      onRefresh();
    } catch (err: any) {
      showToast(err.message || "Error al recibir orden", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id: number) => {
    if (!window.confirm("¿Estás seguro de anular esta orden? Si ya fue emitida, se liberará el presupuesto comprometido.")) {
      return;
    }
    setActionLoading(id);
    try {
      await api.cancelPurchaseOrder(id);
      showToast(`Orden #${id} anulada`);
      onRefresh();
    } catch (err: any) {
      showToast(err.message || "Error al anular orden", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentReq || !currentDetail) {
      showToast("Selecciona un pedido de material válido", "error");
      return;
    }
    if (unitPrice <= 0) {
      showToast("El precio unitario debe ser mayor a 0", "error");
      return;
    }

    setSubmitting(true);
    try {
      await api.createPurchaseOrder({
        materialRequestId: currentReq.id,
        partnerId: Number(partnerId),
        expectedDate: expectedDate ? new Date(expectedDate).toISOString() : undefined,
        details: [
          {
            requestDetailId: currentDetail.id,
            quantity: Number(currentDetail.quantity),
            unitPrice: Number(unitPrice),
          },
        ],
      });
      showToast("Orden de compra creada exitosamente");
      setShowNewModal(false);
      onClearSelectedRequestForPO();
      onRefresh();
    } catch (err: any) {
      showToast(err.message || "Error al crear la orden de compra", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-600" />
            <h1 className="text-xl font-bold text-stone-900 font-display">
              Órdenes de Compra (OC) & Abastecimiento
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Cadena de abastecimiento con reserva de techo presupuestario al emitir y recepción física en pañol.
          </p>
        </div>

        <button
          id="btn-open-new-po-modal"
          onClick={() => {
            if (eligibleRequests.length === 0) {
              showToast("No hay pedidos aprobados para compra disponibles.", "info");
            }
            setShowNewModal(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-lg text-xs font-semibold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Orden de Compra</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl p-4 border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            id="search-orders-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por N° OC, proveedor o material..."
            className="w-full pl-9 pr-4 py-2 border border-stone-200 rounded-lg text-xs outline-none focus:border-amber-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-stone-400" />
          <select
            id="status-orders-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-stone-200 rounded-lg px-3 py-2 text-xs font-medium text-stone-700 outline-none focus:border-amber-500 bg-white"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="BORRADOR">Borrador</option>
            <option value="APROBADO_PARA_COMPRA">Aprobada</option>
            <option value="EMITIDA">Emitida (Compromiso)</option>
            <option value="RECIBIDO">Recibido (Stock)</option>
            <option value="ANULADO">Anulado</option>
          </select>

          <select
            id="partner-orders-filter"
            value={partnerFilter}
            onChange={(e) => setPartnerFilter(e.target.value)}
            className="border border-stone-200 rounded-lg px-3 py-2 text-xs font-medium text-stone-700 outline-none focus:border-amber-500 bg-white"
          >
            <option value="ALL">Todos los Proveedores</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">N° Orden</th>
                <th className="p-3.5">Proveedor Vial</th>
                <th className="p-3.5">Pedido Origen (PM)</th>
                <th className="p-3.5">Material & Cantidad</th>
                <th className="p-3.5 text-right">Monto Total</th>
                <th className="p-3.5 text-center">Estado</th>
                <th className="p-3.5 text-right">Acciones de Flujo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-stone-400">
                    No hay órdenes de compra que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const detail = order.details?.[0];
                  const isLoading = actionLoading === order.id;

                  return (
                    <tr key={order.id} className="hover:bg-stone-50/80 transition">
                      <td className="p-3.5 font-mono font-bold text-stone-900">
                        <button
                          onClick={() => setInspectOrder(order)}
                          className="hover:underline text-amber-700 font-bold"
                        >
                          {order.number}
                        </button>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-stone-800">
                          {order.partner?.name || "Proveedor"}
                        </div>
                        <div className="text-[11px] text-stone-400 font-mono">
                          RUC: {order.partner?.taxId || "—"}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-mono text-blue-700 font-semibold">
                          {order.materialRequest?.number || `PM #${order.materialRequestId}`}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="font-medium text-stone-800">
                          {detail?.material?.description || "Material"}
                        </div>
                        <div className="text-[11px] font-mono text-stone-500">
                          {detail?.quantity} {detail?.material?.unit} @{" "}
                          {formatMoney(detail?.unitPrice, currency)}
                        </div>
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-stone-900">
                        {formatMoney(order.totalAmount, currency)}
                      </td>
                      <td className="p-3.5 text-center">{getStatusBadge(order.status)}</td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {order.status === "BORRADOR" && (
                            <button
                              disabled={isLoading}
                              onClick={() => handleApprove(order.id)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-semibold transition flex items-center gap-1 disabled:opacity-50"
                              title="Aprobar para emisión"
                            >
                              <Check className="w-3 h-3" />
                              <span>Aprobar</span>
                            </button>
                          )}

                          {order.status === "APROBADO_PARA_COMPRA" && (
                            <button
                              disabled={isLoading}
                              onClick={() => handleIssue(order.id)}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-semibold transition flex items-center gap-1 disabled:opacity-50"
                              title="Emitir al proveedor y comprometer presupuesto"
                            >
                              <Clock className="w-3 h-3" />
                              <span>Emitir (Comprometer)</span>
                            </button>
                          )}

                          {order.status === "EMITIDA" && (
                            <button
                              disabled={isLoading}
                              onClick={() => handleReceive(order.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold transition flex items-center gap-1 disabled:opacity-50"
                              title="Recibir en obra: ingresa inventario y ejecuta partida"
                            >
                              <Package className="w-3 h-3" />
                              <span>Recibir en Obra</span>
                            </button>
                          )}

                          {(order.status === "BORRADOR" ||
                            order.status === "APROBADO_PARA_COMPRA" ||
                            order.status === "EMITIDA") && (
                            <button
                              disabled={isLoading}
                              onClick={() => handleCancel(order.id)}
                              className="p-1 text-stone-400 hover:text-rose-600 transition"
                              title="Anular orden"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => setInspectOrder(order)}
                            className="p-1 text-stone-400 hover:text-stone-700 transition"
                            title="Ver detalle / Imprimir"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Purchase Order Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-stone-900">
                  Nueva Orden de Compra (OC)
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowNewModal(false);
                  onClearSelectedRequestForPO();
                }}
                className="text-stone-400 hover:text-stone-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Pedido de Material Aprobado (PM)
                </label>
                <select
                  value={selectedRequestId}
                  onChange={(e) => {
                    const reqId = Number(e.target.value);
                    setSelectedRequestId(reqId);
                    const sel = eligibleRequests.find((r) => r.id === reqId);
                    if (sel?.details?.[0]?.material?.estimatedCost) {
                      setUnitPrice(Number(sel.details[0].material.estimatedCost));
                    }
                  }}
                  className="w-full border border-stone-300 rounded-lg p-2 text-xs font-medium bg-white"
                >
                  {eligibleRequests.length === 0 ? (
                    <option value="">No hay pedidos aprobados disponibles</option>
                  ) : (
                    eligibleRequests.map((req) => (
                      <option key={req.id} value={req.id}>
                        {req.number} — {req.workFront?.name} (
                        {req.details?.[0]?.material?.description || "Material"})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {currentDetail && (
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 text-xs">
                  <div className="font-semibold text-stone-700">Ítem a Comprar:</div>
                  <div className="font-bold text-stone-900 mt-0.5">
                    {currentDetail.material?.description} ({currentDetail.quantity}{" "}
                    {currentDetail.material?.unit})
                  </div>
                  <div className="text-[11px] text-stone-500 font-mono mt-0.5">
                    Partida a imputar: {currentDetail.budgetItem?.code} — {currentDetail.budgetItem?.name}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Proveedor Vial / Cantera / Distribuidor
                </label>
                <select
                  value={partnerId}
                  onChange={(e) => setPartnerId(Number(e.target.value))}
                  className="w-full border border-stone-300 rounded-lg p-2 text-xs font-medium bg-white"
                >
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (RUC: {p.taxId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Precio Unitario Cotizado
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                    className="w-full border border-stone-300 rounded-lg p-2 text-xs font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Fecha Estimada de Entrega
                  </label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full border border-stone-300 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              {/* Total Calculation Preview */}
              {currentDetail && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-center justify-between text-xs">
                  <span className="font-semibold text-amber-900">Total Orden de Compra:</span>
                  <span className="font-mono font-bold text-amber-900 text-sm">
                    {formatMoney(Number(currentDetail.quantity) * unitPrice, currency)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewModal(false);
                    onClearSelectedRequestForPO();
                  }}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg text-xs font-semibold hover:bg-stone-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !currentReq}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                >
                  {submitting ? "Generando..." : "Generar Orden de Compra"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Formal Purchase Order Inspection Modal */}
      {inspectOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 border border-stone-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-black">
                  OC
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900 font-display">
                    {inspectOrder.number}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    {getStatusBadge(inspectOrder.status)}
                    <span className="text-xs text-stone-500">
                      Fecha: {formatDate(inspectOrder.issueDate || inspectOrder.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-2 border border-stone-200 hover:bg-stone-50 rounded-lg text-stone-600 transition"
                  title="Imprimir Orden Oficial"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setInspectOrder(null)}
                  className="text-stone-400 hover:text-stone-600 text-lg font-bold p-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Official Formal Document View */}
            <div className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-4 bg-stone-50 rounded-lg border border-stone-200">
                <div>
                  <div className="text-[10px] uppercase font-bold text-stone-400">Comitente / Obra</div>
                  <div className="font-bold text-stone-900 text-sm mt-0.5">
                    {inspectOrder.project?.name || project?.name || "Obra Vial"}
                  </div>
                  <div className="text-stone-500 mt-1">
                    Tramo: {inspectOrder.project?.roadSection || project?.roadSection || "Tramo Principal"}
                  </div>
                  <div className="text-stone-500">
                    Contrato: {inspectOrder.project?.contractNumber || project?.contractNumber || "MOPC"}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-stone-400">Proveedor Adjudicado</div>
                  <div className="font-bold text-stone-900 text-sm mt-0.5">
                    {inspectOrder.partner?.name}
                  </div>
                  <div className="text-stone-600 mt-1 font-mono">
                    RUC: {inspectOrder.partner?.taxId}
                  </div>
                  <div className="text-stone-500">
                    Dirección: {inspectOrder.partner?.fiscalAddress || "Ciudad del Este / Asunción"}
                  </div>
                  <div className="text-stone-500">
                    Tel: {inspectOrder.partner?.phone || "—"} | Email: {inspectOrder.partner?.email || "—"}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-stone-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-200">
                    <tr>
                      <th className="p-2.5">Material / Descripción</th>
                      <th className="p-2.5">Partida</th>
                      <th className="p-2.5 text-right">Cantidad</th>
                      <th className="p-2.5 text-right">P. Unitario</th>
                      <th className="p-2.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {inspectOrder.details?.map((item) => (
                      <tr key={item.id}>
                        <td className="p-2.5">
                          <div className="font-bold text-stone-900">
                            {item.material?.description || "Material vial"}
                          </div>
                          <div className="text-[10px] text-stone-400 font-mono">
                            Cód: {item.material?.code}
                          </div>
                        </td>
                        <td className="p-2.5 font-mono text-stone-600">
                          {item.budgetItem?.code}
                        </td>
                        <td className="p-2.5 text-right font-mono font-semibold">
                          {item.quantity} {item.material?.unit}
                        </td>
                        <td className="p-2.5 text-right font-mono">
                          {formatMoney(item.unitPrice, currency)}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-stone-900">
                          {formatMoney(item.subtotal, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-stone-50 border-t border-stone-200 font-bold">
                    <tr>
                      <td colSpan={4} className="p-2.5 text-right text-stone-700">
                        TOTAL ORDEN:
                      </td>
                      <td className="p-2.5 text-right font-mono text-sm text-stone-900">
                        {formatMoney(inspectOrder.totalAmount, currency)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Reception status notice */}
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-stone-800">
                    Estado en Almacén / Pañol de Obra:
                  </div>
                  <div className="text-stone-500">
                    {inspectOrder.stockRegistered
                      ? "Inventario ingresado y registrado en el pañol central de la obra."
                      : "Pendiente de remisión y control de pesaje/calidad en faena."}
                  </div>
                </div>
                <span
                  className={`font-semibold px-2 py-1 rounded text-xs ${
                    inspectOrder.stockRegistered
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {inspectOrder.stockRegistered ? "Stock Ingresado" : "Pendiente Recepción"}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-stone-200 mt-4">
              <div className="text-[11px] text-stone-400">
                InfraTrack ERP • Trazabilidad Financiera Certificada
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInspectOrder(null)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg text-xs font-semibold hover:bg-stone-50 transition"
                >
                  Cerrar
                </button>
                {inspectOrder.status === "EMITIDA" && (
                  <button
                    onClick={() => {
                      handleReceive(inspectOrder.id);
                      setInspectOrder(null);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition"
                  >
                    Recibir en Obra
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
