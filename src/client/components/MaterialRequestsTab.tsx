import React, { useState } from "react";
import {
  HardHat,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ChevronRight,
  Receipt,
  FileText,
  UserCheck,
  AlertCircle,
  Eye,
  Trash2,
} from "lucide-react";
import {
  MaterialRequest,
  WorkFront,
  Personnel,
  Material,
  BudgetItem,
  Project,
} from "../types";
import { formatDate, formatDateTime } from "../utils/format";
import { getStatusBadge } from "../utils/statusBadges";
import { api } from "../api";

interface MaterialRequestsTabProps {
  project?: Project | null;
  materialRequests: MaterialRequest[];
  workFronts: WorkFront[];
  personnel: Personnel[];
  materials: Material[];
  budgetItems: BudgetItem[];
  currency: "PYG" | "USD";
  onRefresh: () => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
  onOpenCreatePOForRequest: (req: MaterialRequest) => void;
}

export const MaterialRequestsTab: React.FC<MaterialRequestsTabProps> = ({
  project,
  materialRequests,
  workFronts,
  personnel,
  materials,
  budgetItems,
  currency,
  onRefresh,
  showToast,
  onOpenCreatePOForRequest,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [frontFilter, setFrontFilter] = useState<string>("ALL");
  const [showNewModal, setShowNewModal] = useState(false);
  const [inspectRequest, setInspectRequest] = useState<MaterialRequest | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    workFrontId: workFronts[0]?.id || 1,
    requestedById: personnel.find((p) => p.role === "JEFE_FRENTE")?.id || personnel[0]?.id || 1,
    materialId: materials[0]?.id || 1,
    budgetItemId: budgetItems[0]?.id || 1,
    quantity: 10,
    notes: "",
  });

  const filteredRequests = materialRequests.filter((req) => {
    const matchesSearch =
      req.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.workFront?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.notes || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.details || []).some((d) =>
        (d.material?.description || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesStatus = statusFilter === "ALL" || req.status === statusFilter;
    const matchesFront = frontFilter === "ALL" || String(req.workFrontId) === frontFilter;
    return matchesSearch && matchesStatus && matchesFront;
  });

  const handleApprove = async (id: number) => {
    try {
      await api.approveMaterialRequest(id);
      showToast(`Pedido #${id} aprobado para compra`);
      onRefresh();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Seguro que deseas eliminar este pedido en borrador?")) return;
    try {
      await api.deleteMaterialRequest(id);
      showToast("Pedido eliminado correctamente");
      onRefresh();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project?.id) {
      showToast("Selecciona una obra válida primero", "error");
      return;
    }
    if (formData.quantity <= 0) {
      showToast("La cantidad debe ser mayor a 0", "error");
      return;
    }

    setSubmitting(true);
    try {
      await api.createMaterialRequest({
        projectId: project.id,
        workFrontId: Number(formData.workFrontId),
        requestedById: Number(formData.requestedById),
        notes: formData.notes,
        details: [
          {
            materialId: Number(formData.materialId),
            budgetItemId: Number(formData.budgetItemId),
            quantity: Number(formData.quantity),
          },
        ],
      });
      showToast("Pedido de material generado exitosamente en borrador");
      setShowNewModal(false);
      onRefresh();
    } catch (err: any) {
      showToast(err.message || "Error al crear el pedido", "error");
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
            <HardHat className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-stone-900 font-display">
              Pedidos de Material en Faena (PM)
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Requerimientos originados por Jefes de Frente de obra. Requieren aprobación técnica antes de generar Orden de Compra.
          </p>
        </div>

        <button
          id="btn-open-new-request-modal"
          onClick={() => {
            setFormData({
              workFrontId: workFronts[0]?.id || 1,
              requestedById: personnel.find((p) => p.role === "JEFE_FRENTE")?.id || personnel[0]?.id || 1,
              materialId: materials[0]?.id || 1,
              budgetItemId: budgetItems[0]?.id || 1,
              quantity: 10,
              notes: "",
            });
            setShowNewModal(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 active:scale-95 text-white rounded-lg text-xs font-semibold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Pedido de Material</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl p-4 border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            id="search-requests-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por N° Pedido, material, frente o notas..."
            className="w-full pl-9 pr-4 py-2 border border-stone-200 rounded-lg text-xs outline-none focus:border-blue-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-stone-400" />
          <select
            id="status-requests-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-stone-200 rounded-lg px-3 py-2 text-xs font-medium text-stone-700 outline-none focus:border-blue-500 bg-white"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="BORRADOR">Borrador</option>
            <option value="APROBADO_PARA_COMPRA">Aprobado para Compra</option>
            <option value="EMITIDA">Emitida (OC Generada)</option>
            <option value="RECIBIDO">Recibido en Obra</option>
          </select>

          <select
            id="front-requests-filter"
            value={frontFilter}
            onChange={(e) => setFrontFilter(e.target.value)}
            className="border border-stone-200 rounded-lg px-3 py-2 text-xs font-medium text-stone-700 outline-none focus:border-blue-500 bg-white"
          >
            <option value="ALL">Todos los Frentes</option>
            {workFronts.map((wf) => (
              <option key={wf.id} value={wf.id}>
                {wf.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Material Requests Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">N° Pedido</th>
                <th className="p-3.5">Frente de Obra</th>
                <th className="p-3.5">Solicitante</th>
                <th className="p-3.5">Material & Cantidad</th>
                <th className="p-3.5">Partida Imputada</th>
                <th className="p-3.5 text-center">Estado</th>
                <th className="p-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-stone-400">
                    No hay pedidos de material que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const detail = req.details?.[0];
                  const hasOrders = req.purchaseOrders && req.purchaseOrders.length > 0;

                  return (
                    <tr key={req.id} className="hover:bg-stone-50/80 transition">
                      <td className="p-3.5 font-mono font-bold text-stone-900">
                        <button
                          onClick={() => setInspectRequest(req)}
                          className="hover:underline text-blue-700 font-bold"
                        >
                          {req.number}
                        </button>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-stone-800">
                          {req.workFront?.name || `Frente #${req.workFrontId}`}
                        </div>
                        {req.notes && (
                          <div className="text-[11px] text-stone-400 truncate max-w-xs">{req.notes}</div>
                        )}
                      </td>
                      <td className="p-3.5 text-stone-700">
                        {req.requestedBy?.fullName || "Jefe de Frente"}
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-stone-900">
                          {detail?.material?.description || "Material vial"}
                        </div>
                        <div className="text-[11px] font-mono text-stone-500">
                          {detail?.quantity} {detail?.material?.unit || "un"}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-mono px-1.5 py-0.5 rounded bg-stone-100 text-stone-800 text-[11px]">
                          {detail?.budgetItem?.code || "01-MS"}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">{getStatusBadge(req.status)}</td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {req.status === "BORRADOR" && (
                            <>
                              <button
                                onClick={() => handleApprove(req.id)}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs transition flex items-center gap-1"
                                title="Aprobar para que el departamento de compras emita OC"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Aprobar</span>
                              </button>
                              <button
                                onClick={() => handleDelete(req.id)}
                                className="p-1 text-stone-400 hover:text-rose-600 transition"
                                title="Eliminar borrador"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {req.status === "APROBADO_PARA_COMPRA" && (
                            <button
                              onClick={() => onOpenCreatePOForRequest(req)}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold shadow-xs transition flex items-center gap-1"
                              title="Generar Orden de Compra formal para proveedor"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span>Crear OC</span>
                            </button>
                          )}

                          <button
                            onClick={() => setInspectRequest(req)}
                            className="p-1 text-stone-400 hover:text-stone-700 transition"
                            title="Ver detalles"
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

      {/* Create Requisition Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <HardHat className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-stone-900">
                  Nuevo Pedido de Material (PM)
                </h3>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-stone-400 hover:text-stone-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Frente de Obra
                  </label>
                  <select
                    value={formData.workFrontId}
                    onChange={(e) => setFormData({ ...formData, workFrontId: Number(e.target.value) })}
                    className="w-full border border-stone-300 rounded-lg p-2 text-xs font-medium bg-white"
                  >
                    {workFronts.map((wf) => (
                      <option key={wf.id} value={wf.id}>
                        {wf.code} — {wf.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Jefe de Frente / Solicitante
                  </label>
                  <select
                    value={formData.requestedById}
                    onChange={(e) => setFormData({ ...formData, requestedById: Number(e.target.value) })}
                    className="w-full border border-stone-300 rounded-lg p-2 text-xs font-medium bg-white"
                  >
                    {personnel.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName} ({p.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Material Vial
                </label>
                <select
                  value={formData.materialId}
                  onChange={(e) => setFormData({ ...formData, materialId: Number(e.target.value) })}
                  className="w-full border border-stone-300 rounded-lg p-2 text-xs font-medium bg-white"
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.code} — {m.description} ({m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Partida Presupuestaria
                  </label>
                  <select
                    value={formData.budgetItemId}
                    onChange={(e) => setFormData({ ...formData, budgetItemId: Number(e.target.value) })}
                    className="w-full border border-stone-300 rounded-lg p-2 text-xs font-medium bg-white"
                  >
                    {budgetItems.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.code} — {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Cantidad Requerida
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 1 })}
                    className="w-full border border-stone-300 rounded-lg p-2 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Justificación / Tramo Kilométrico de Destino
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ej: Para colado de losas en alcantarilla celular Km 134+200..."
                  className="w-full border border-stone-300 rounded-lg p-2 text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg text-xs font-semibold hover:bg-stone-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                >
                  {submitting ? "Creando..." : "Crear Pedido"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Request Modal */}
      {inspectRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-extrabold text-stone-900">
                    {inspectRequest.number}
                  </span>
                  {getStatusBadge(inspectRequest.status)}
                </div>
                <div className="text-xs text-stone-500">
                  Creado el {formatDateTime(inspectRequest.createdAt)}
                </div>
              </div>
              <button
                onClick={() => setInspectRequest(null)}
                className="text-stone-400 hover:text-stone-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
                <div className="font-semibold text-stone-700">Frente de Obra:</div>
                <div className="text-stone-900 mt-0.5 font-medium">
                  {inspectRequest.workFront?.name || "Frente de Obra"}
                </div>
                <div className="font-semibold text-stone-700 mt-2">Solicitado por:</div>
                <div className="text-stone-900 mt-0.5">
                  {inspectRequest.requestedBy?.fullName || "Jefe de Frente"} (
                  {inspectRequest.requestedBy?.role || "JEFE_FRENTE"})
                </div>
                {inspectRequest.notes && (
                  <>
                    <div className="font-semibold text-stone-700 mt-2">Notas / Justificación:</div>
                    <div className="text-stone-900 mt-0.5 italic">{inspectRequest.notes}</div>
                  </>
                )}
              </div>

              <div className="border border-stone-200 rounded-lg overflow-hidden">
                <div className="bg-stone-100 px-3 py-2 font-bold text-stone-800">
                  Ítems Requeridos
                </div>
                <div className="p-3 space-y-2">
                  {inspectRequest.details?.map((d) => (
                    <div key={d.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-stone-900">
                          {d.material?.description || "Material vial"}
                        </div>
                        <div className="text-[11px] text-stone-500 font-mono">
                          Código: {d.material?.code} | Partida: {d.budgetItem?.code} ({d.budgetItem?.name})
                        </div>
                      </div>
                      <div className="font-mono font-bold text-stone-900 text-sm">
                        {d.quantity} {d.material?.unit}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {inspectRequest.purchaseOrders && inspectRequest.purchaseOrders.length > 0 && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <span className="font-bold text-amber-900">Órdenes de Compra Vinculadas:</span>
                  <div className="mt-1 space-y-1">
                    {inspectRequest.purchaseOrders.map((po) => (
                      <div key={po.id} className="flex items-center justify-between font-mono text-[11px]">
                        <span className="font-bold text-amber-800">{po.number}</span>
                        {getStatusBadge(po.status)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100 mt-4">
              <button
                type="button"
                onClick={() => setInspectRequest(null)}
                className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg text-xs font-semibold hover:bg-stone-50 transition"
              >
                Cerrar
              </button>
              {inspectRequest.status === "BORRADOR" && (
                <button
                  type="button"
                  onClick={() => {
                    handleApprove(inspectRequest.id);
                    setInspectRequest(null);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition"
                >
                  Aprobar para Compra
                </button>
              )}
              {inspectRequest.status === "APROBADO_PARA_COMPRA" && (
                <button
                  type="button"
                  onClick={() => {
                    const req = inspectRequest;
                    setInspectRequest(null);
                    onOpenCreatePOForRequest(req);
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition"
                >
                  Crear Orden de Compra
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
