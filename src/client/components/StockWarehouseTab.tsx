import React, { useState } from "react";
import {
  Package,
  ArrowUpRight,
  ArrowDownLeft,
  SlidersHorizontal,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  Layers,
  Fuel,
  Clock,
  HardHat,
  Plus,
} from "lucide-react";
import {
  WarehouseStock,
  StockMovement,
  Material,
  WorkFront,
  Project,
} from "../types";
import { formatDate, formatDateTime } from "../utils/format";
import { getMovementBadge } from "../utils/statusBadges";
import { api } from "../api";

interface StockWarehouseTabProps {
  project?: Project | null;
  stock: WarehouseStock[];
  movements: StockMovement[];
  materials: Material[];
  workFronts: WorkFront[];
  onRefresh: () => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export const StockWarehouseTab: React.FC<StockWarehouseTabProps> = ({
  project,
  stock,
  movements,
  materials,
  workFronts,
  onRefresh,
  showToast,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [movementFilter, setMovementFilter] = useState<string>("ALL");
  const [showConsumptionModal, setShowConsumptionModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Consumption Form state
  const [consumptionForm, setConsumptionForm] = useState({
    materialId: materials[0]?.id || 1,
    quantity: 5,
    workFrontId: workFronts[0]?.id || 1,
    note: "",
  });

  // Adjustment Form state
  const [adjustmentForm, setAdjustmentForm] = useState({
    materialId: materials[0]?.id || 1,
    quantity: 0,
    note: "",
  });

  const filteredStock = stock.filter((item) => {
    const matName = item.material?.description || "";
    const matCode = item.material?.code || "";
    return (
      matName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      matCode.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const filteredMovements = movements.filter((mov) => {
    const matchesType = movementFilter === "ALL" || mov.movementType === movementFilter;
    const matName = mov.material?.description || "";
    const matchesSearch =
      matName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (mov.note || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleConsumptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project?.id) {
      showToast("Selecciona una obra primero", "error");
      return;
    }
    if (consumptionForm.quantity <= 0) {
      showToast("La cantidad debe ser mayor a 0", "error");
      return;
    }

    setSubmitting(true);
    try {
      const selectedWf = workFronts.find((wf) => wf.id === Number(consumptionForm.workFrontId));
      const fullNote = `${selectedWf ? `[${selectedWf.name}] ` : ""}${consumptionForm.note || "Consumo en faena"}`;

      await api.registerConsumption(project.id, {
        materialId: Number(consumptionForm.materialId),
        quantity: Number(consumptionForm.quantity),
        note: fullNote,
      });
      showToast("Salida de material a frente registrada exitosamente");
      setShowConsumptionModal(false);
      onRefresh();
    } catch (err: any) {
      showToast(err.message || "Error al registrar consumo", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project?.id) {
      showToast("Selecciona una obra primero", "error");
      return;
    }
    if (adjustmentForm.quantity === 0) {
      showToast("El ajuste debe ser distinto de 0", "error");
      return;
    }
    if (!adjustmentForm.note.trim()) {
      showToast("Indica el motivo del ajuste físico", "error");
      return;
    }

    setSubmitting(true);
    try {
      await api.registerAdjustment({
        projectId: project.id,
        materialId: Number(adjustmentForm.materialId),
        quantity: Number(adjustmentForm.quantity),
        note: adjustmentForm.note,
      });
      showToast("Ajuste de inventario aplicado");
      setShowAdjustmentModal(false);
      onRefresh();
    } catch (err: any) {
      showToast(err.message || "Error al aplicar ajuste", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-600" />
            <h1 className="text-xl font-bold text-stone-900 font-display">
              Pañol Central & Almacén de Obra
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Control físico de inventario de insumos viales, despacho a frentes de trabajo y registro de combustible/áridos.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-open-consumption-modal"
            onClick={() => setShowConsumptionModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Salida a Frente de Obra</span>
          </button>
          <button
            id="btn-open-adjustment-modal"
            onClick={() => setShowAdjustmentModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-stone-800 hover:bg-stone-700 active:scale-95 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <SlidersHorizontal className="w-4 h-4 text-purple-400" />
            <span>Ajuste de Stock</span>
          </button>
        </div>
      </div>

      {/* Stock Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredStock.length === 0 ? (
          <div className="col-span-4 bg-white rounded-xl border border-stone-200 p-8 text-center text-stone-400 text-xs shadow-sm">
            No hay existencias registradas en el pañol central.
          </div>
        ) : (
          filteredStock.map((item) => {
            const current = Number(item.currentStock || 0);
            const reserved = Number(item.reservedStock || 0);
            const isLow = current <= 5;

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl p-4 border border-stone-200 shadow-sm flex flex-col justify-between hover:border-amber-400 transition"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-stone-600 px-1.5 py-0.5 rounded bg-stone-100">
                      {item.material?.code}
                    </span>
                    {isLow ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="w-3 h-3" /> Stock Bajo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Disponible
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-stone-900 text-sm mt-2 line-clamp-2">
                    {item.material?.description || "Insumo vial"}
                  </h3>
                  <div className="text-[11px] text-stone-500 mt-0.5">
                    Categoría: {item.material?.category}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400">
                      Stock en Pañol
                    </span>
                    <div className="font-mono text-xl font-black text-stone-900">
                      {current}{" "}
                      <span className="text-xs font-normal text-stone-500">
                        {item.material?.unit}
                      </span>
                    </div>
                  </div>
                  {reserved > 0 && (
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-stone-400">
                        Reservado
                      </span>
                      <div className="font-mono text-xs font-semibold text-amber-700">
                        {reserved} {item.material?.unit}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Movements Ledger */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-stone-700" />
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
              Libro de Movimientos de Inventario
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={movementFilter}
              onChange={(e) => setMovementFilter(e.target.value)}
              className="border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-stone-700 bg-white outline-none"
            >
              <option value="ALL">Todos los Movimientos</option>
              <option value="RECEIPT">Ingresos (Órdenes de Compra)</option>
              <option value="CONSUMPTION">Salidas a Frente de Obra</option>
              <option value="ADJUSTMENT">Ajustes de Inventario</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3">Fecha & Hora</th>
                <th className="p-3">Tipo Movimiento</th>
                <th className="p-3">Material Involucrado</th>
                <th className="p-3 text-right">Cantidad</th>
                <th className="p-3">Destino / Detalle / Frente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-stone-400">
                    No se registran movimientos en el historial.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((mov) => {
                  const qty = Number(mov.quantity);
                  const isPositive = mov.movementType === "RECEIPT" || qty > 0;

                  return (
                    <tr key={mov.id} className="hover:bg-stone-50 transition">
                      <td className="p-3 text-stone-500 font-mono">
                        {formatDateTime(mov.createdAt)}
                      </td>
                      <td className="p-3">{getMovementBadge(mov.movementType)}</td>
                      <td className="p-3">
                        <span className="font-semibold text-stone-900">
                          {mov.material?.description || "Material"}
                        </span>
                        <span className="ml-1.5 font-mono text-[10px] text-stone-400">
                          ({mov.material?.code})
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold">
                        <span
                          className={
                            mov.movementType === "RECEIPT"
                              ? "text-emerald-700"
                              : mov.movementType === "CONSUMPTION"
                              ? "text-amber-700"
                              : "text-purple-700"
                          }
                        >
                          {mov.movementType === "CONSUMPTION" ? "-" : "+"}
                          {Math.abs(qty)} {mov.material?.unit}
                        </span>
                      </td>
                      <td className="p-3 text-stone-600 text-[11px]">
                        {mov.note || (mov.sourceType ? `Origen: ${mov.sourceType} #${mov.sourceId}` : "—")}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Consumption Modal */}
      {showConsumptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-stone-900">
                  Registrar Salida / Despacho a Frente de Obra
                </h3>
              </div>
              <button
                onClick={() => setShowConsumptionModal(false)}
                className="text-stone-400 hover:text-stone-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConsumptionSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Insumo / Material a Despachar
                </label>
                <select
                  value={consumptionForm.materialId}
                  onChange={(e) =>
                    setConsumptionForm({ ...consumptionForm, materialId: Number(e.target.value) })
                  }
                  className="w-full border border-stone-300 rounded-lg p-2 text-xs font-medium bg-white"
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.code} — {m.description} ({m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Cantidad a Retirar
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    value={consumptionForm.quantity}
                    onChange={(e) =>
                      setConsumptionForm({
                        ...consumptionForm,
                        quantity: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full border border-stone-300 rounded-lg p-2 text-xs font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Frente Receptor
                  </label>
                  <select
                    value={consumptionForm.workFrontId}
                    onChange={(e) =>
                      setConsumptionForm({
                        ...consumptionForm,
                        workFrontId: Number(e.target.value),
                      })
                    }
                    className="w-full border border-stone-300 rounded-lg p-2 text-xs font-medium bg-white"
                  >
                    {workFronts.map((wf) => (
                      <option key={wf.id} value={wf.id}>
                        {wf.code} — {wf.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Maquinaria / Destino / Chofer que Retira
                </label>
                <input
                  type="text"
                  value={consumptionForm.note}
                  onChange={(e) => setConsumptionForm({ ...consumptionForm, note: e.target.value })}
                  placeholder="Ej: Carga a Camión Volquete #04 para base granular Km 136..."
                  className="w-full border border-stone-300 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowConsumptionModal(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg text-xs font-semibold hover:bg-stone-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                >
                  {submitting ? "Registrando..." : "Confirmar Salida"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjustment Modal */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-stone-900">
                  Ajuste de Inventario Físico
                </h3>
              </div>
              <button
                onClick={() => setShowAdjustmentModal(false)}
                className="text-stone-400 hover:text-stone-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdjustmentSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Material a Ajustar
                </label>
                <select
                  value={adjustmentForm.materialId}
                  onChange={(e) =>
                    setAdjustmentForm({ ...adjustmentForm, materialId: Number(e.target.value) })
                  }
                  className="w-full border border-stone-300 rounded-lg p-2 text-xs font-medium bg-white"
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.code} — {m.description} ({m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Cantidad del Ajuste (+ para sumar, - para restar)
                </label>
                <input
                  type="number"
                  step="any"
                  value={adjustmentForm.quantity}
                  onChange={(e) =>
                    setAdjustmentForm({
                      ...adjustmentForm,
                      quantity: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full border border-stone-300 rounded-lg p-2 text-xs font-mono"
                  placeholder="Ej: -2.5 o 5"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Motivo del Ajuste (Auditoría / Merma por lluvia / Rotura)
                </label>
                <textarea
                  rows={2}
                  value={adjustmentForm.note}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, note: e.target.value })}
                  placeholder="Justificación del conteo físico..."
                  className="w-full border border-stone-300 rounded-lg p-2 text-xs"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAdjustmentModal(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg text-xs font-semibold hover:bg-stone-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                >
                  {submitting ? "Aplicando..." : "Aplicar Ajuste"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
