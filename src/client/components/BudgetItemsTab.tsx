import React, { useState } from "react";
import {
  FileSpreadsheet,
  Upload,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Layers,
  ArrowUpDown,
  Download,
  FileCheck,
  Plus,
} from "lucide-react";
import { BudgetItem, Project } from "../types";
import { formatMoney, formatCompactMoney, formatPercent } from "../utils/format";
import { api } from "../api";

interface BudgetItemsTabProps {
  project?: Project | null;
  budgetItems: BudgetItem[];
  currency: "PYG" | "USD";
  onRefresh: () => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export const BudgetItemsTab: React.FC<BudgetItemsTabProps> = ({
  project,
  budgetItems,
  currency,
  onRefresh,
  showToast,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [showImportModal, setShowImportModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Extract unique categories
  const categories = Array.from(new Set(budgetItems.map((b) => b.category).filter(Boolean)));

  const filteredItems = budgetItems.filter((item) => {
    const matchesSearch =
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "ALL" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalOriginal = budgetItems.reduce((acc, i) => acc + Number(i.originalAmount || 0), 0);
  const totalCommitted = budgetItems.reduce((acc, i) => acc + Number(i.committedAmount || 0), 0);
  const totalExecuted = budgetItems.reduce((acc, i) => acc + Number(i.executedAmount || 0), 0);
  const totalAvailable = Math.max(0, totalOriginal - (totalCommitted + totalExecuted));
  const globalPct = totalOriginal > 0 ? ((totalCommitted + totalExecuted) / totalOriginal) * 100 : 0;

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      showToast("Por favor selecciona un archivo Excel o CSV", "error");
      return;
    }

    setUploading(true);
    try {
      await api.importBudgetFile(selectedFile, project?.id);
      showToast("Presupuesto importado y procesado exitosamente");
      setShowImportModal(false);
      setSelectedFile(null);
      onRefresh();
    } catch (err: any) {
      showToast(err.message || "Error al importar el archivo", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-amber-600" />
            <h1 className="text-xl font-bold text-stone-900 font-display">
              Partidas Presupuestarias & Cómputo Métrico
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Estructura de desglose de obra (WBS/EDT), límites de compromiso y control de techos duros.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-open-import-budget"
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 active:scale-95 text-white text-xs font-semibold shadow-sm transition"
          >
            <Upload className="w-4 h-4 text-amber-400" />
            <span>Importar Cómputo (Excel)</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-stone-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Presupuesto Base Partidas
          </span>
          <div className="mt-1 font-mono text-lg font-extrabold text-stone-900">
            {formatMoney(totalOriginal, currency)}
          </div>
          <div className="mt-1 text-[11px] text-stone-500">{budgetItems.length} partidas activas</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-stone-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
            Comprometido (OC Emitidas)
          </span>
          <div className="mt-1 font-mono text-lg font-extrabold text-amber-900">
            {formatMoney(totalCommitted, currency)}
          </div>
          <div className="mt-1 text-[11px] text-stone-500">
            {totalOriginal > 0 ? ((totalCommitted / totalOriginal) * 100).toFixed(1) : 0}% del total
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-stone-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
            Ejecutado (Recepciones/Cert.)
          </span>
          <div className="mt-1 font-mono text-lg font-extrabold text-blue-900">
            {formatMoney(totalExecuted, currency)}
          </div>
          <div className="mt-1 text-[11px] text-stone-500">Gasto real en faena</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-stone-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            Saldo Disponible Total
          </span>
          <div className="mt-1 font-mono text-lg font-extrabold text-emerald-900">
            {formatMoney(totalAvailable, currency)}
          </div>
          <div className="mt-1 text-[11px] font-mono text-emerald-700 font-bold">
            {(100 - globalPct).toFixed(1)}% disponible
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            id="search-budget-items-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código (ej. 01-MS) o descripción de rubro..."
            className="w-full pl-9 pr-4 py-2 border border-stone-200 rounded-lg text-xs outline-none focus:border-amber-500 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-stone-400" />
          <select
            id="category-budget-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-stone-200 rounded-lg px-3 py-2 text-xs font-medium text-stone-700 outline-none focus:border-amber-500 bg-white"
          >
            <option value="ALL">Todas las Categorías</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Budget Items Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">Código</th>
                <th className="p-3.5">Descripción de Rubro</th>
                <th className="p-3.5">Categoría</th>
                <th className="p-3.5 text-right">Presupuesto Base</th>
                <th className="p-3.5 text-right">Comprometido</th>
                <th className="p-3.5 text-right">Ejecutado</th>
                <th className="p-3.5 text-right">Saldo Disponible</th>
                <th className="p-3.5 text-center min-w-[140px]">Estado / Techo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-stone-400">
                    No se encontraron partidas presupuestarias con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const orig = Number(item.originalAmount || 0);
                  const comm = Number(item.committedAmount || 0);
                  const exec = Number(item.executedAmount || 0);
                  const spent = comm + exec;
                  const available = Math.max(0, orig - spent);
                  const pct = orig > 0 ? (spent / orig) * 100 : 0;
                  const isCritical = pct >= 90;
                  const isWarning = pct >= 75 && pct < 90;

                  return (
                    <tr key={item.id} className="hover:bg-stone-50/80 transition">
                      <td className="p-3.5 font-mono font-bold text-stone-900">{item.code}</td>
                      <td className="p-3.5 font-semibold text-stone-800">{item.name}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700">
                          {item.category}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-mono font-semibold text-stone-900">
                        {formatMoney(orig, currency)}
                      </td>
                      <td className="p-3.5 text-right font-mono text-amber-800">
                        {formatMoney(comm, currency)}
                      </td>
                      <td className="p-3.5 text-right font-mono text-blue-800">
                        {formatMoney(exec, currency)}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-emerald-700">
                        {formatMoney(available, currency)}
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full ${
                                isCritical
                                  ? "bg-rose-500"
                                  : isWarning
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}
                              style={{ width: `${Math.min(100, Math.max(2, pct))}%` }}
                            />
                          </div>
                          <span
                            className={`font-mono text-[10px] font-bold ${
                              isCritical
                                ? "text-rose-600"
                                : isWarning
                                ? "text-amber-600"
                                : "text-emerald-700"
                            }`}
                          >
                            {pct.toFixed(1)}%
                          </span>
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

      {/* Budget Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-stone-900">
                  Importar Cómputo y Presupuesto
                </h3>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-stone-400 hover:text-stone-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFileUpload} className="mt-4 space-y-4">
              <p className="text-xs text-stone-500">
                Carga la planilla de cotización u oferta de la obra (formato .xlsx, .xls o .csv) para actualizar automáticamente las partidas presupuestarias y sus techos de gasto.
              </p>

              <div className="border-2 border-dashed border-stone-300 hover:border-amber-500 rounded-xl p-6 text-center transition cursor-pointer bg-stone-50/50">
                <input
                  id="budget-file-input"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="budget-file-input" className="cursor-pointer flex flex-col items-center">
                  <Upload className="w-8 h-8 text-stone-400 mb-2" />
                  <span className="text-xs font-semibold text-stone-700">
                    {selectedFile ? selectedFile.name : "Haz clic para seleccionar archivo Excel/CSV"}
                  </span>
                  <span className="text-[10px] text-stone-400 mt-1">
                    Formatos soportados: Planillas MOPC, Excel de rubros, CSV delimitado por comas
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg text-xs font-semibold hover:bg-stone-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                >
                  {uploading ? "Procesando planilla..." : "Procesar e Importar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
