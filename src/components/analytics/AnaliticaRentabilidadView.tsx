import React, { useState, useMemo } from 'react';
import {
  ProgramacionOperacion,
  CuentaPorCobrar,
  RegistroCombustible,
  RegistroMantenimiento,
  CajaChicaGasto,
  Vehiculo,
  Conductor
} from '../../types/erp';
import { PeriodoFiltro } from '../../types/financialAnalytics';
import {
  computeServiceProfitability,
  computeVehicleRankings,
  computeDriverRankings
} from '../../utils/analyticsCalculations';
import {
  TrendingUp,
  Award,
  Truck,
  UserCheck,
  Calendar,
  Search,
  Filter,
  DollarSign,
  Fuel,
  ArrowUpRight,
  ShieldCheck,
  BarChart3,
  Percent
} from 'lucide-react';

interface AnaliticaRentabilidadViewProps {
  operaciones: ProgramacionOperacion[];
  cuentasPorCobrar: CuentaPorCobrar[];
  combustibles: RegistroCombustible[];
  mantenimientos: RegistroMantenimiento[];
  cajaChica: CajaChicaGasto[];
  vehiculos: Vehiculo[];
  conductores: Conductor[];
}

export const AnaliticaRentabilidadView: React.FC<AnaliticaRentabilidadViewProps> = ({
  operaciones,
  cuentasPorCobrar,
  combustibles,
  mantenimientos,
  cajaChica,
  vehiculos,
  conductores
}) => {
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('MES');
  const [activeTab, setActiveTab] = useState<'servicios' | 'vehiculos' | 'conductores'>('servicios');
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Profitability per service
  const rentabilidadServicios = useMemo(() => {
    return computeServiceProfitability(
      operaciones,
      cuentasPorCobrar,
      combustibles,
      cajaChica,
      periodo
    );
  }, [operaciones, cuentasPorCobrar, combustibles, cajaChica, periodo]);

  // 2. Vehicle rankings
  const rankingVehiculos = useMemo(() => {
    return computeVehicleRankings(
      vehiculos,
      operaciones,
      cuentasPorCobrar,
      combustibles,
      mantenimientos,
      periodo
    );
  }, [vehiculos, operaciones, cuentasPorCobrar, combustibles, mantenimientos, periodo]);

  // 3. Driver rankings
  const rankingConductores = useMemo(() => {
    return computeDriverRankings(
      conductores,
      operaciones,
      cuentasPorCobrar,
      cajaChica,
      periodo
    );
  }, [conductores, operaciones, cuentasPorCobrar, cajaChica, periodo]);

  // Filtered Services
  const filteredServicios = rentabilidadServicios.filter(s =>
    s.codigoOperacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.rutaNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.vehiculoPlaca.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filtered Vehicles
  const filteredVehiculos = rankingVehiculos.filter(v =>
    v.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.marcaModelo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filtered Drivers
  const filteredConductores = rankingConductores.filter(c =>
    `${c.nombres} ${c.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.licencia.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Summary Metrics
  const totalUtilidadNeta = rentabilidadServicios.reduce((sum, item) => sum + item.utilidadNeta, 0);
  const totalFacturadoServicios = rentabilidadServicios.reduce((sum, item) => sum + item.ingresoFlete, 0);
  const margenPromedioPct = totalFacturadoServicios > 0 ? (totalUtilidadNeta / totalFacturadoServicios) * 100 : 0;
  const servicioMasRentable = rentabilidadServicios[0];

  return (
    <div className="space-y-6">
      {/* Header and Period Filter Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-sm bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[10px] font-mono font-semibold">
              INTELIGENCIA DE NEGOCIO
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Analítica de Rentabilidad & Rankings Operativos
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Márgenes netos por servicio de flete, ranking de productividad de tractocamiones y desempeño de choferes
          </p>
        </div>

        {/* Period Selector (Día, Semana, Mes, Todo) */}
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
              {p === 'DIA' ? 'Día' : p === 'SEMANA' ? 'Semana' : p === 'MES' ? 'Mes' : 'Histórico'}
            </button>
          ))}
        </div>
      </div>

      {/* Top Analytics KPI Quad */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block">Utilidad Neta de Servicios</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xs text-slate-400">S/</span>
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {totalUtilidadNeta.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            descontando combustible, peajes y viáticos
          </span>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block">Margen Neto Promedio</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono text-blue-400">
              {margenPromedioPct.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400">%</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">sobre facturación de fletes</span>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block">Flete Más Rentable</span>
          <div className="text-sm font-bold font-mono text-white truncate mt-1">
            {servicioMasRentable ? servicioMasRentable.codigoOperacion : 'N/A'}
          </div>
          <span className="text-[11px] text-emerald-400 mt-0.5 block font-mono">
            {servicioMasRentable ? `S/ ${servicioMasRentable.utilidadNeta.toLocaleString()} (+${servicioMasRentable.margenRentabilidadPct.toFixed(1)}%)` : '—'}
          </span>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block">Vehículo Líder en Facturación</span>
          <div className="text-sm font-bold font-mono text-amber-400 truncate mt-1">
            {rankingVehiculos[0] ? rankingVehiculos[0].placa : 'N/A'}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block font-mono">
            {rankingVehiculos[0] ? `S/ ${rankingVehiculos[0].facturacionGenerada.toLocaleString()} facturados` : '—'}
          </span>
        </div>
      </div>

      {/* Tabs navigation: 1. Rentabilidad Servicios, 2. Ranking Vehículos, 3. Ranking Conductores */}
      <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg">
        <button
          onClick={() => setActiveTab('servicios')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'servicios'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>1. Rentabilidad por Servicios (Fletes)</span>
        </button>

        <button
          onClick={() => setActiveTab('vehiculos')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'vehiculos'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>2. Ranking de Vehículos (Productividad Flota)</span>
        </button>

        <button
          onClick={() => setActiveTab('conductores')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'conductores'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>3. Ranking de Conductores (Choferes)</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar en reportes por placa, chofer, ruta o cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500"
        />
      </div>

      {/* TAB 1: RENTABILIDAD POR SERVICIO */}
      {activeTab === 'servicios' && (
        <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-900/60">
                  <th className="py-3 px-4">Operación / Timestamp</th>
                  <th className="py-3 px-4">Cliente & Ruta</th>
                  <th className="py-3 px-4">Unidad & Chofer</th>
                  <th className="py-3 px-4 text-right">Ingreso Flete</th>
                  <th className="py-3 px-4 text-right">Combustible</th>
                  <th className="py-3 px-4 text-right">Peajes + Viáticos</th>
                  <th className="py-3 px-4 text-right">Costo Total</th>
                  <th className="py-3 px-4 text-right">Utilidad Neta</th>
                  <th className="py-3 px-4 text-center">Margen %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredServicios.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      No se encontraron servicios de flete en este período.
                    </td>
                  </tr>
                ) : (
                  filteredServicios.map((s, idx) => {
                    const isPositive = s.utilidadNeta > 0;
                    return (
                      <tr key={s.operacionId} className="hover:bg-slate-900/50 transition-colors">
                        {/* Operation & Timestamp */}
                        <td className="py-3.5 px-4 font-mono">
                          <div className="flex items-center gap-1.5 font-bold text-blue-400">
                            <span>{s.codigoOperacion}</span>
                            {idx === 0 && (
                              <span className="text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-1 rounded-sm">
                                TOP 1
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {new Date(s.fechaHoraExacta).toLocaleString('es-PE', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </td>

                        {/* Client & Route */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-medium text-slate-200 truncate">{s.clienteNombre}</div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            {s.rutaNombre} ({s.pesoTn} Tn)
                          </div>
                        </td>

                        {/* Vehicle & Driver */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-semibold text-amber-400 bg-amber-950/40 border border-amber-800/40 px-1.5 py-0.5 rounded-sm text-[11px]">
                            {s.vehiculoPlaca}
                          </span>
                          <div className="text-slate-300 text-[11px] mt-1 truncate">
                            {s.conductorNombre}
                          </div>
                        </td>

                        {/* Income */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-100">
                          S/ {s.ingresoFlete.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Fuel Cost */}
                        <td className="py-3.5 px-4 text-right font-mono text-amber-400">
                          S/ {s.costoCombustible.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Tolls and Per diems */}
                        <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                          S/ {(s.costoPeajes + s.costoViaticos).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Total Direct Cost */}
                        <td className="py-3.5 px-4 text-right font-mono text-rose-400">
                          S/ {s.costoTotalDirecto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Net Profit */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold whitespace-nowrap">
                          <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                            S/ {s.utilidadNeta.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                          </span>
                        </td>

                        {/* Margin % */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-sm font-mono text-[11px] font-bold ${
                              s.margenRentabilidadPct >= 35
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : s.margenRentabilidadPct >= 15
                                ? 'bg-blue-950 text-blue-400 border border-blue-800'
                                : 'bg-rose-950 text-rose-400 border border-rose-800'
                            }`}
                          >
                            {s.margenRentabilidadPct.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: RANKING INTERACTIVO DE VEHÍCULOS */}
      {activeTab === 'vehiculos' && (
        <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-900/60">
                  <th className="py-3 px-4 text-center">Posición</th>
                  <th className="py-3 px-4">Placa & Modelo</th>
                  <th className="py-3 px-4 text-center">Servicios Concluidos</th>
                  <th className="py-3 px-4 text-right">Tn Transportadas</th>
                  <th className="py-3 px-4 text-right">Facturación Generada</th>
                  <th className="py-3 px-4 text-right">Gasto Combustible</th>
                  <th className="py-3 px-4 text-right">Gasto Taller</th>
                  <th className="py-3 px-4 text-right">Margen Neto Aportado</th>
                  <th className="py-3 px-4 text-center">Score Eficiencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredVehiculos.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      No se encontraron vehículos registrados.
                    </td>
                  </tr>
                ) : (
                  filteredVehiculos.map((v, idx) => {
                    const isTop1 = idx === 0;
                    return (
                      <tr key={v.vehiculoId} className="hover:bg-slate-900/50 transition-colors">
                        {/* Position badge */}
                        <td className="py-3.5 px-4 text-center font-mono">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${
                              isTop1
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                : idx === 1
                                ? 'bg-slate-300/20 text-slate-200 border border-slate-400/40'
                                : 'text-slate-500'
                            }`}
                          >
                            {idx + 1}
                          </span>
                        </td>

                        {/* Placa & Model */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded-sm">
                              {v.placa}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-300 mt-1">{v.marcaModelo}</div>
                        </td>

                        {/* Services count */}
                        <td className="py-3.5 px-4 text-center font-mono text-slate-200">
                          <span className="font-bold text-sm">{v.serviciosCompletados}</span>
                          {v.serviciosEnRuta > 0 && (
                            <span className="text-[10px] text-blue-400 block">
                              +{v.serviciosEnRuta} en ruta
                            </span>
                          )}
                        </td>

                        {/* Tons moved */}
                        <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                          {v.toneladasTransportadas.toFixed(1)} Tn
                        </td>

                        {/* Billing generated */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-100">
                          S/ {v.facturacionGenerada.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Fuel */}
                        <td className="py-3.5 px-4 text-right font-mono text-amber-400">
                          S/ {v.gastoCombustible.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Maintenance */}
                        <td className="py-3.5 px-4 text-right font-mono text-cyan-400">
                          S/ {v.gastoMantenimiento.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Net Margin */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                          S/ {v.margenNetoAportado.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Efficiency score */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-blue-400">
                            <Percent className="w-3 h-3 text-blue-400" />
                            <span>{v.eficienciaScore} pts</span>
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
      )}

      {/* TAB 3: RANKING INTERACTIVO DE CONDUCTORES */}
      {activeTab === 'conductores' && (
        <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-900/60">
                  <th className="py-3 px-4 text-center">Posición</th>
                  <th className="py-3 px-4">Conductor (Chofer)</th>
                  <th className="py-3 px-4">Licencia & Categoría</th>
                  <th className="py-3 px-4 text-center">Servicios Realizados</th>
                  <th className="py-3 px-4 text-right">Volumen Movilizado</th>
                  <th className="py-3 px-4 text-right">Facturación Operada</th>
                  <th className="py-3 px-4 text-right">Viáticos Asignados</th>
                  <th className="py-3 px-4 text-right">Horas en Carretera</th>
                  <th className="py-3 px-4 text-center">Puntualidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredConductores.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      No se encontraron conductores con los criterios de búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredConductores.map((c, idx) => {
                    const isTop1 = idx === 0;
                    return (
                      <tr key={c.conductorId} className="hover:bg-slate-900/50 transition-colors">
                        {/* Position */}
                        <td className="py-3.5 px-4 text-center font-mono">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${
                              isTop1
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                : idx === 1
                                ? 'bg-slate-300/20 text-slate-200 border border-slate-400/40'
                                : 'text-slate-500'
                            }`}
                          >
                            {idx + 1}
                          </span>
                        </td>

                        {/* Driver */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">
                            {c.nombres} {c.apellidos}
                          </div>
                          {isTop1 && (
                            <span className="text-[10px] text-amber-400 flex items-center gap-1 mt-0.5">
                              <Award className="w-3 h-3" /> Chofer del Mes
                            </span>
                          )}
                        </td>

                        {/* License */}
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                          <div>{c.licencia}</div>
                          <span className="text-blue-400 text-[10px] bg-blue-950/40 px-1 rounded-xs">
                            {c.categoriaLicencia}
                          </span>
                        </td>

                        {/* Completed services */}
                        <td className="py-3.5 px-4 text-center font-mono">
                          <span className="text-sm font-bold text-slate-100">{c.serviciosRealizados}</span>
                          {c.serviciosEnRuta > 0 && (
                            <span className="text-[10px] text-amber-400 block">
                              +{c.serviciosEnRuta} en ruta
                            </span>
                          )}
                        </td>

                        {/* Tons moved */}
                        <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                          {c.toneladasMovilizadas.toFixed(1)} Tn
                        </td>

                        {/* Billing operated */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-100">
                          S/ {c.facturacionOperada.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Per diems */}
                        <td className="py-3.5 px-4 text-right font-mono text-amber-400">
                          S/ {c.totalViaticosAsignados.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Hours in route */}
                        <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                          {c.horasEnCarretera.toFixed(0)} hrs
                        </td>

                        {/* Compliance rate */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className="inline-block px-2.5 py-1 rounded-sm bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono text-[11px] font-bold">
                            {c.tasaPuntualidadPct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
