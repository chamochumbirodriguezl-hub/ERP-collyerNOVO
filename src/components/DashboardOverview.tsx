import React from 'react';
import {
  ProgramacionOperacion,
  RegistroMantenimiento,
  RegistroCombustible,
  CajaChicaGasto,
  CuentaPorCobrar,
  Vehiculo
} from '../types/erp';
import {
  Truck,
  Wrench,
  Fuel,
  Wallet,
  Receipt,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  DollarSign,
  BarChart3
} from 'lucide-react';

interface DashboardOverviewProps {
  operaciones: ProgramacionOperacion[];
  mantenimientos: RegistroMantenimiento[];
  combustibles: RegistroCombustible[];
  cajaChica: CajaChicaGasto[];
  cuentasPorCobrar: CuentaPorCobrar[];
  vehiculos: Vehiculo[];
  setActiveTab: (tab: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  operaciones,
  mantenimientos,
  combustibles,
  cajaChica,
  cuentasPorCobrar,
  vehiculos,
  setActiveTab
}) => {
  // Financial computations
  const totalGastoCombustible = combustibles.reduce((a, b) => a + b.costoTotal, 0);
  const totalGastoMantenimiento = mantenimientos.reduce((a, b) => a + b.costoTotal, 0);
  const totalGastoCajaChica = cajaChica.reduce((a, b) => a + b.monto, 0);
  const costoOperativoTotal = totalGastoCombustible + totalGastoMantenimiento + totalGastoCajaChica;

  const totalFacturado = cuentasPorCobrar.reduce((a, b) => a + b.montoTotal, 0);
  const totalCobrado = cuentasPorCobrar.reduce((a, b) => a + b.montoCobrado, 0);
  const totalPorCobrar = cuentasPorCobrar.reduce((a, b) => a + b.saldoPendiente, 0);

  const facturasVencidas = cuentasPorCobrar.filter(c => c.estado === 'VENCIDA');
  const operacionesEnRuta = operaciones.filter(o => o.estado === 'EN_RUTA');
  const unidadesEnTaller = vehiculos.filter(v => v.estado === 'EN_MANTENIMIENTO');

  return (
    <div className="space-y-6">
      {/* Executive Welcome & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Panel Ejecutivo & Capital Operativo
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitoreo en tiempo real de operaciones, costos de flota, rendición de cuentas y flujo de cobranzas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('operaciones')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Despachar Operación</span>
          </button>
          <button
            onClick={() => setActiveTab('sqlschema')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            <span>Ver Arquitectura SQL</span>
          </button>
        </div>
      </div>

      {/* Main KPI Quad */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Operaciones */}
        <div
          onClick={() => setActiveTab('operaciones')}
          className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-blue-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Flota en Tránsito</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg group-hover:bg-blue-500/20">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold font-mono text-white">{operacionesEnRuta.length}</span>
            <span className="text-xs text-slate-400">de {vehiculos.length} tractos</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
            <span>{operaciones.filter(o => o.estado === 'PROGRAMADO').length} listos para despacho</span>
            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Metric 2: Costo Operativo del Mes */}
        <div
          onClick={() => setActiveTab('combustible')}
          className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Costos Operativos Flota</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg group-hover:bg-amber-500/20">
              <Fuel className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-xs text-slate-400">S/</span>
            <span className="text-2xl font-bold font-mono text-amber-400">
              {costoOperativoTotal.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
            <span>Combustible + Mnt + Caja</span>
            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Metric 3: Saldo por Cobrar */}
        <div
          onClick={() => setActiveTab('cuentasporcobrar')}
          className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-rose-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Cartera por Cobrar</span>
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg group-hover:bg-rose-500/20">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-xs text-slate-400">S/</span>
            <span className="text-2xl font-bold font-mono text-slate-100">
              {totalPorCobrar.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
            <span className="text-rose-400 font-semibold">{facturasVencidas.length} facturas vencidas</span>
            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Metric 4: Cobranza Efectiva */}
        <div
          onClick={() => setActiveTab('cuentasporcobrar')}
          className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Cobranza Realizada</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg group-hover:bg-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-xs text-slate-400">S/</span>
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {totalCobrado.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
            <span>{((totalCobrado / (totalFacturado || 1)) * 100).toFixed(0)}% cobrado de la emisión</span>
            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Two-Column Operational Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Block A: Desglose de Gastos Operativos & Capital */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-400" />
              <span>Desglose de Costos de Operación y Capital Operativo</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Total S/ {costoOperativoTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="space-y-3">
            {/* Combustible */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">1. Combustible (Diesel B5):</span>
                <span className="font-mono text-slate-100 font-bold">
                  S/ {totalGastoCombustible.toLocaleString('es-PE', { minimumFractionDigits: 2 })} ({((totalGastoCombustible / (costoOperativoTotal || 1)) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-2 rounded-full"
                  style={{ width: `${(totalGastoCombustible / (costoOperativoTotal || 1)) * 100}%` }}
                />
              </div>
            </div>

            {/* Mantenimiento */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">2. Mantenimiento Mecánico (Repuestos + M.O.):</span>
                <span className="font-mono text-slate-100 font-bold">
                  S/ {totalGastoMantenimiento.toLocaleString('es-PE', { minimumFractionDigits: 2 })} ({((totalGastoMantenimiento / (costoOperativoTotal || 1)) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${(totalGastoMantenimiento / (costoOperativoTotal || 1)) * 100}%` }}
                />
              </div>
            </div>

            {/* Caja Chica */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">3. Caja Chica (Viáticos & Peajes en Carretera):</span>
                <span className="font-mono text-slate-100 font-bold">
                  S/ {totalGastoCajaChica.toLocaleString('es-PE', { minimumFractionDigits: 2 })} ({((totalGastoCajaChica / (costoOperativoTotal || 1)) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-purple-500 h-2 rounded-full"
                  style={{ width: `${(totalGastoCajaChica / (costoOperativoTotal || 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
            <span>Margen Operativo Bruto Estimado:</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">
              S/ {(totalFacturado - costoOperativoTotal).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Block B: Alertas Operativas y de Cartera */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Alertas Críticas de Operación y Cobranzas</span>
            </h3>
            <span className="text-[11px] text-slate-500">Auditoría automática</span>
          </div>

          <div className="space-y-2.5 text-xs">
            {facturasVencidas.map(f => (
              <div
                key={f.id}
                onClick={() => setActiveTab('cuentasporcobrar')}
                className="p-3 bg-rose-950/30 border border-rose-800/40 rounded-lg flex items-center justify-between cursor-pointer hover:bg-rose-950/50 transition-colors"
              >
                <div>
                  <div className="font-semibold text-rose-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Factura en Mora: {f.codigoFactura}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {f.clienteNombre} · Venció el {f.fechaVencimiento}
                  </div>
                </div>
                <div className="text-right font-mono font-bold text-rose-400">
                  S/ {f.saldoPendiente.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </div>
              </div>
            ))}

            {unidadesEnTaller.map(v => (
              <div
                key={v.id}
                onClick={() => setActiveTab('mantenimiento')}
                className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-lg flex items-center justify-between cursor-pointer hover:bg-amber-950/50 transition-colors"
              >
                <div>
                  <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Unidad en Taller: {v.placa}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {v.marca} {v.modelo} · Mantenimiento Correctivo en curso
                  </div>
                </div>
                <span className="text-[11px] font-mono text-amber-400 bg-amber-900/40 px-2 py-0.5 rounded-sm">
                  Fuera de Servicio
                </span>
              </div>
            ))}

            {cajaChica.filter(g => g.estado === 'PENDIENTE_RENDICION').length > 0 && (
              <div
                onClick={() => setActiveTab('cajachica')}
                className="p-3 bg-blue-950/30 border border-blue-800/40 rounded-lg flex items-center justify-between cursor-pointer hover:bg-blue-950/50 transition-colors"
              >
                <div>
                  <div className="font-semibold text-blue-300 flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5" />
                    <span>Rendición de Caja Chica Pendiente</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {cajaChica.filter(g => g.estado === 'PENDIENTE_RENDICION').length} gastos operativos requieren aprobación de Tesorería
                  </div>
                </div>
                <span className="text-[11px] font-mono text-blue-400 bg-blue-900/40 px-2 py-0.5 rounded-sm">
                  Pendiente
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Access to the 5 modules */}
      <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Acceso Rápido a Módulos del Sistema
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          <button
            onClick={() => setActiveTab('flujos')}
            className="p-3 bg-emerald-950/40 hover:bg-emerald-950/60 border border-emerald-800/60 rounded-lg text-left transition-colors"
          >
            <div className="text-emerald-400 font-semibold text-xs flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Flujos & Caja</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Ingresos vs Gastos</div>
          </button>

          <button
            onClick={() => setActiveTab('analitica')}
            className="p-3 bg-purple-950/40 hover:bg-purple-950/60 border border-purple-800/60 rounded-lg text-left transition-colors"
          >
            <div className="text-purple-400 font-semibold text-xs flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Rentabilidad</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Rankings flota & chofer</div>
          </button>

          <button
            onClick={() => setActiveTab('operaciones')}
            className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-left transition-colors"
          >
            <div className="text-blue-400 font-semibold text-xs flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5" />
              <span>1. Operaciones</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Programación diaria</div>
          </button>

          <button
            onClick={() => setActiveTab('mantenimiento')}
            className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-left transition-colors"
          >
            <div className="text-cyan-400 font-semibold text-xs flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5" />
              <span>2. Mantenimiento</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Preventivo y taller</div>
          </button>

          <button
            onClick={() => setActiveTab('combustible')}
            className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-left transition-colors"
          >
            <div className="text-amber-400 font-semibold text-xs flex items-center gap-1.5">
              <Fuel className="w-3.5 h-3.5" />
              <span>3. Combustible</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Galones y vales</div>
          </button>

          <button
            onClick={() => setActiveTab('cajachica')}
            className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-left transition-colors"
          >
            <div className="text-purple-400 font-semibold text-xs flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5" />
              <span>4. Caja Chica</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Viáticos y peajes</div>
          </button>

          <button
            onClick={() => setActiveTab('cuentasporcobrar')}
            className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-left transition-colors"
          >
            <div className="text-emerald-400 font-semibold text-xs flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5" />
              <span>5. Cuentas Cobrar</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Facturas y abonos</div>
          </button>
        </div>
      </div>
    </div>
  );
};
