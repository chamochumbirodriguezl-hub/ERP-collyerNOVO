import React from 'react';
import {
  LayoutDashboard,
  Truck,
  Wrench,
  Fuel,
  Wallet,
  Receipt,
  Database,
  Building2,
  CalendarDays,
  TrendingUp,
  BarChart3
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  stats: {
    operacionesActivas: number;
    mantenimientosPendientes: number;
    cajaChicaPendientes: number;
    facturasVencidas: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  stats
}) => {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Panel Ejecutivo',
      subtitle: 'KPIs & Capital Operativo',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'flujos',
      label: 'Flujos Financieros',
      subtitle: 'Ingresos, Gastos & Liquidez',
      icon: TrendingUp,
      badge: 'Caja Real',
      badgeColor: 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/60'
    },
    {
      id: 'analitica',
      label: 'Rentabilidad & Rankings',
      subtitle: 'Servicios, Flota & Choferes',
      icon: BarChart3,
      badge: 'Analítica',
      badgeColor: 'text-purple-400 bg-purple-950/60 border border-purple-800/60'
    },
    {
      id: 'operaciones',
      label: '1. Operaciones Diarias',
      subtitle: 'Rutas, Tractos & Choferes',
      icon: Truck,
      badge: stats.operacionesActivas > 0 ? `${stats.operacionesActivas} en ruta` : null,
      badgeColor: 'text-amber-400 bg-amber-950/60 border border-amber-800/60'
    },
    {
      id: 'mantenimiento',
      label: '2. Mantenimiento',
      subtitle: 'Preventivo & Correctivo',
      icon: Wrench,
      badge: stats.mantenimientosPendientes > 0 ? `${stats.mantenimientosPendientes} en taller` : null,
      badgeColor: 'text-red-400 bg-red-950/60 border border-red-800/60'
    },
    {
      id: 'combustible',
      label: '3. Combustible',
      subtitle: 'Galones, Odómetro & Tickets',
      icon: Fuel,
      badge: null
    },
    {
      id: 'cajachica',
      label: '4. Caja Chica',
      subtitle: 'Viáticos, Peajes & Rendición',
      icon: Wallet,
      badge: stats.cajaChicaPendientes > 0 ? `${stats.cajaChicaPendientes} por rendir` : null,
      badgeColor: 'text-blue-400 bg-blue-950/60 border border-blue-800/60'
    },
    {
      id: 'cuentasporcobrar',
      label: '5. Cuentas por Cobrar',
      subtitle: 'Facturación & Abonos',
      icon: Receipt,
      badge: stats.facturasVencidas > 0 ? `${stats.facturasVencidas} vencidas` : null,
      badgeColor: 'text-rose-400 bg-rose-950/60 border border-rose-800/60'
    },
    {
      id: 'sqlschema',
      label: 'Arquitectura SQL',
      subtitle: 'DDL, Vistas & Triggers',
      icon: Database,
      badge: 'SQL 3NF',
      badgeColor: 'text-cyan-400 bg-cyan-950/60 border border-cyan-800/60'
    }
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 select-none">
      {/* Operating Company Badge */}
      <div className="p-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-700/80 flex items-center justify-center text-blue-400 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <h2 className="text-sm font-semibold text-white truncate">Collyer Logistics</h2>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
              <span>RUC 20601849201</span>
              <span>·</span>
              <span>Callao, PE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation list */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Módulos del Sistema ERP
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors group ${
                isActive
                  ? 'bg-blue-600/15 border border-blue-500/40 text-blue-400'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <div className="truncate">
                  <div className={`text-xs font-semibold truncate ${isActive ? 'text-white' : 'text-slate-200'}`}>
                    {item.label}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {item.subtitle}
                  </div>
                </div>
              </div>
              {item.badge && (
                <span className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-sm shrink-0 ml-1.5 ${item.badgeColor || 'text-slate-400 bg-slate-800'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-xs text-slate-400">
        <div className="flex items-center gap-2 mb-1.5">
          <CalendarDays className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[11px] font-mono text-slate-300">
            {new Date().toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Flota activa: 5 tractocamiones. Sistema auditado bajo normativa SUNAT y MTC.
        </p>
      </div>
    </aside>
  );
};
