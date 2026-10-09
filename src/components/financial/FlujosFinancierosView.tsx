import React, { useState, useMemo } from 'react';
import {
  CuentaPorCobrar,
  RegistroCombustible,
  RegistroMantenimiento,
  CajaChicaGasto
} from '../../types/erp';
import { PeriodoFiltro, TipoFlujo } from '../../types/financialAnalytics';
import { buildConsolidatedFlows } from '../../utils/analyticsCalculations';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  Fuel,
  Wrench,
  Search,
  Filter,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  DollarSign
} from 'lucide-react';
import { ReceiptViewerModal } from '../ReceiptViewerModal';

interface FlujosFinancierosViewProps {
  cuentasPorCobrar: CuentaPorCobrar[];
  combustibles: RegistroCombustible[];
  mantenimientos: RegistroMantenimiento[];
  cajaChica: CajaChicaGasto[];
}

export const FlujosFinancierosView: React.FC<FlujosFinancierosViewProps> = ({
  cuentasPorCobrar,
  combustibles,
  mantenimientos,
  cajaChica
}) => {
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('MES');
  const [tipoFiltro, setTipoFiltro] = useState<'TODOS' | 'INGRESO' | 'GASTO'>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewerDoc, setViewerDoc] = useState<{ title: string; docNum: string; url: string; amount?: string; issuerOrCategory?: string } | null>(null);

  // Compute consolidated financial data
  const { items, resumen } = useMemo(() => {
    return buildConsolidatedFlows(
      cuentasPorCobrar,
      combustibles,
      mantenimientos,
      cajaChica,
      periodo
    );
  }, [cuentasPorCobrar, combustibles, mantenimientos, cajaChica, periodo]);

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesTipo = tipoFiltro === 'TODOS' || item.tipo === tipoFiltro;
    const matchesSearch =
      item.referenciaCodigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.entidad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.categoriaLabel.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTipo && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header and Period Filter Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-sm bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-semibold">
              MÓDULO FINANCIERO
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Flujos Financieros Automatizados & Liquidez
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Auditoría cronológica exacta de fletes cobrados, egresos operativos de flota y posición neta de caja
          </p>
        </div>

        {/* Period Selector: Día, Semana, Mes, Todo */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg shrink-0">
          <Calendar className="w-3.5 h-3.5 text-slate-500 ml-2 mr-1" />
          {(['DIA', 'SEMANA', 'MES', 'TODO'] as PeriodoFiltro[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                periodo === p
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {p === 'DIA' ? 'Día (Hoy)' : p === 'SEMANA' ? 'Semana (7D)' : p === 'MES' ? 'Mes en Curso' : 'Histórico'}
            </button>
          ))}
        </div>
      </div>

      {/* 3 Subcomponents Cards Strip: Flujo Ingresos, Flujo Gastos, Flujo Liquidez */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Subcomponente 1: Flujo de Ingresos */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              1. Flujo de Ingresos (Cobranzas)
            </span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xs text-slate-400">S/</span>
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {resumen.totalIngresos.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Abonos interbancarios BCP/BBVA:</span>
              <span className="font-mono text-slate-200">100% bancarizado</span>
            </div>
            <div className="flex justify-between">
              <span>Transacciones registradas:</span>
              <span className="font-mono text-emerald-400 font-bold">
                {items.filter(i => i.tipo === 'INGRESO').length} abonos
              </span>
            </div>
          </div>
        </div>

        {/* Subcomponente 2: Flujo de Gastos Operativos Categorizados */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              2. Gastos Operativos Categorizados
            </span>
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xs text-slate-400">S/</span>
            <span className="text-2xl font-bold font-mono text-rose-400">
              {resumen.totalGastos.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5">
                <Fuel className="w-3 h-3 text-amber-400" /> Combustible Diesel:
              </span>
              <span className="font-mono text-slate-200">
                S/ {resumen.gastoCombustible.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5">
                <Wrench className="w-3 h-3 text-cyan-400" /> Taller & Repuestos:
              </span>
              <span className="font-mono text-slate-200">
                S/ {resumen.gastoMantenimiento.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5">
                <Wallet className="w-3 h-3 text-purple-400" /> Caja Chica (Viáticos/Peajes):
              </span>
              <span className="font-mono text-slate-200">
                S/ {resumen.gastoCajaChica.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Subcomponente 3: Flujo de Liquidez Neta */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              3. Flujo de Liquidez Neta
            </span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xs text-slate-400">S/</span>
            <span className={`text-2xl font-bold font-mono ${resumen.saldoNeto >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {resumen.saldoNeto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Margen de Liquidez Operativo:</span>
              <span className="font-mono font-bold text-blue-400">
                {resumen.margenOperativoPct.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden mt-1">
              <div
                className="bg-emerald-500 h-1.5 rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, resumen.margenOperativoPct))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por código (F001, COMB, MNT, CCH), entidad, grifo o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500"
          />
        </div>

        {/* Flow Type Filter */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg shrink-0">
          {(['TODOS', 'INGRESO', 'GASTO'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTipoFiltro(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                tipoFiltro === t
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t === 'TODOS' ? 'Todos los Flujos' : t === 'INGRESO' ? 'Solo Ingresos' : 'Solo Gastos'}
            </button>
          ))}
        </div>
      </div>

      {/* Unified Chronological Flow Table with Exact Timestamp */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-xs">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/40">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Libro Diario de Transacciones Financieras con Timestamp Exacto
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {filteredItems.length} transacciones auditadas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-900/60">
                <th className="py-3 px-4">Timestamp Exacto</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Categoría Financiera</th>
                <th className="py-3 px-4">Referencia / Comprobante</th>
                <th className="py-3 px-4">Entidad / Beneficiario</th>
                <th className="py-3 px-4">Descripción Auditada</th>
                <th className="py-3 px-4 text-right">Monto (S/)</th>
                <th className="py-3 px-4 text-center">Sustento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No se registran transacciones en el período seleccionado.
                  </td>
                </tr>
              ) : (
                filteredItems.map((flow) => {
                  const dateObj = new Date(flow.fechaHoraExacta);
                  const formattedDate = dateObj.toLocaleDateString('es-PE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  });
                  const formattedTime = dateObj.toLocaleTimeString('es-PE', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  });

                  const isIngreso = flow.tipo === 'INGRESO';

                  return (
                    <tr key={flow.id} className="hover:bg-slate-900/50 transition-colors">
                      {/* Exact Timestamp */}
                      <td className="py-3 px-4 font-mono whitespace-nowrap">
                        <div className="text-slate-200 font-semibold">{formattedDate}</div>
                        <div className="text-[11px] text-blue-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{formattedTime}</span>
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-bold tracking-wider uppercase ${
                            isIngreso
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {isIngreso ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          <span>{flow.tipo}</span>
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-200">{flow.categoriaLabel}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{flow.categoria}</div>
                      </td>

                      {/* Reference */}
                      <td className="py-3 px-4 font-mono whitespace-nowrap">
                        <div className="font-semibold text-blue-400">{flow.referenciaCodigo}</div>
                        {flow.comprobanteTipo && (
                          <div className="text-[11px] text-slate-500">{flow.comprobanteTipo}</div>
                        )}
                      </td>

                      {/* Entity */}
                      <td className="py-3 px-4 max-w-xs truncate text-slate-300">
                        {flow.entidad}
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 max-w-sm truncate text-slate-400 text-[11px]">
                        {flow.descripcion}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap">
                        <span className={isIngreso ? 'text-emerald-400' : 'text-slate-200'}>
                          {isIngreso ? '+' : '-'} S/ {flow.monto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Documentary Proof */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {flow.sustentoUrl ? (
                          <button
                            onClick={() =>
                              setViewerDoc({
                                title: `Sustento: ${flow.referenciaCodigo}`,
                                docNum: flow.referenciaCodigo,
                                url: flow.sustentoUrl!,
                                issuerOrCategory: flow.categoriaLabel,
                                amount: `S/ ${flow.monto.toFixed(2)}`
                              })
                            }
                            className="p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-900 rounded-md transition-colors"
                            title="Ver Comprobante Escaneado"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-slate-600 text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sustento Modal */}
      {viewerDoc && (
        <ReceiptViewerModal
          isOpen={!!viewerDoc}
          onClose={() => setViewerDoc(null)}
          title={viewerDoc.title}
          documentNumber={viewerDoc.docNum}
          url={viewerDoc.url}
          issuerOrCategory={viewerDoc.issuerOrCategory}
          amount={viewerDoc.amount}
        />
      )}
    </div>
  );
};
