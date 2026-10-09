import React, { useState } from 'react';
import { COLLYER_SQL_SCHEMA_DDL, DATABASE_TABLES_DOCS } from '../data/sqlSchema';
import { SQL_ANALYTICS_ADDITIONS } from '../data/sqlAnalyticsSchema';
import {
  Database,
  Copy,
  Check,
  Download,
  Table,
  Layers,
  KeyRound,
  ShieldCheck,
  Zap,
  ArrowRight,
  TrendingUp,
  Clock
} from 'lucide-react';

export const SqlSchemaView: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'ddl' | 'analytics_sql' | 'dictionary' | 'erd' | 'triggers'>('ddl');

  const activeSqlToCopy = activeSubTab === 'analytics_sql' ? SQL_ANALYTICS_ADDITIONS : COLLYER_SQL_SCHEMA_DDL;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeSqlToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const isAnalytics = activeSubTab === 'analytics_sql';
    const content = isAnalytics ? SQL_ANALYTICS_ADDITIONS : COLLYER_SQL_SCHEMA_DDL;
    const filename = isAnalytics ? 'collyer_erp_analytics_views.sql' : 'collyer_erp_relational_schema.sql';
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      {/* Header and Download actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-sm bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-mono font-semibold">
              PARTE 1 TÉCNICA
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Esquema de Base de Datos Relacional (PostgreSQL / ANSI SQL)
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Arquitectura normalizada en 3NF con timestamps exactos, auditoría transaccional y vistas analíticas de rentabilidad y rankings
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '¡Copiado!' : 'Copiar SQL'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar .sql</span>
          </button>
        </div>
      </div>

      {/* Sub tabs navigation */}
      <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('ddl')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeSubTab === 'ddl'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Script DDL Base</span>
        </button>

        <button
          onClick={() => setActiveSubTab('analytics_sql')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeSubTab === 'analytics_sql'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Vistas & Auditoría (Extensión)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('dictionary')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeSubTab === 'dictionary'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Table className="w-3.5 h-3.5" />
          <span>Diccionario de Tablas</span>
        </button>

        <button
          onClick={() => setActiveSubTab('erd')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeSubTab === 'erd'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Diagrama ERD</span>
        </button>

        <button
          onClick={() => setActiveSubTab('triggers')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeSubTab === 'triggers'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Triggers & Reglas</span>
        </button>
      </div>

      {/* Content 1: Raw SQL Code */}
      {activeSubTab === 'ddl' && (
        <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-xs">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs text-slate-400 font-mono">
            <span>collyer_erp_relational_schema.sql (PostgreSQL 14+ / Supabase / Cloud SQL)</span>
            <span>ANSI SQL Standard</span>
          </div>
          <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto max-h-[600px] leading-relaxed selection:bg-blue-600 selection:text-white">
            {COLLYER_SQL_SCHEMA_DDL}
          </pre>
        </div>
      )}

      {/* Content 1.1: Extension SQL (Timestamps exactos, Auditoría y Vistas de Rentabilidad) */}
      {activeSubTab === 'analytics_sql' && (
        <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-xs">
          <div className="flex items-center justify-between px-4 py-2.5 bg-purple-950/60 border-b border-purple-900/60 text-xs text-purple-300 font-mono">
            <span>collyer_erp_analytics_views.sql (Auditoría TIMESTAMPTZ, Flujos y Vistas de Rentabilidad)</span>
            <span>PostgreSQL Views & Triggers</span>
          </div>
          <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto max-h-[600px] leading-relaxed selection:bg-purple-600 selection:text-white">
            {SQL_ANALYTICS_ADDITIONS}
          </pre>
        </div>
      )}

      {/* Content 2: Data Dictionary */}
      {activeSubTab === 'dictionary' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DATABASE_TABLES_DOCS.map((table) => (
              <div key={table.name} className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Table className="w-4 h-4 text-blue-400" />
                    <span className="font-mono font-bold text-sm text-white">{table.name}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-sm">
                    {table.module}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {table.description}
                </p>

                <div className="pt-2 border-t border-slate-800/80 space-y-2 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-semibold">Primary Key (PK):</span>
                    <span className="font-mono text-emerald-400 text-[11px]">{table.primaryKey}</span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 block font-semibold">Foreign Keys (FK):</span>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] font-mono text-blue-300">
                      {table.foreignKeys.map((fk, idx) => (
                        <li key={idx}>{fk}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 block font-semibold">Restricciones Lógicas (CHECK & UNIQUE):</span>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] font-mono text-amber-300">
                      {table.constraints.map((c, idx) => (
                        <li key={idx}>{c}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content 3: Visual ERD */}
      {activeSubTab === 'erd' && (
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Diagrama Conceptual de Relaciones Relacionales (ERD)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Visualización de flujo entre tablas maestras y los 5 módulos operativos y financieros.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Maestros */}
            <div className="space-y-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
                1. Tablas Maestras
              </div>

              <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-800 space-y-2">
                <div className="font-mono font-bold text-blue-400 text-xs">vehiculos</div>
                <div className="text-[11px] text-slate-300 space-y-0.5 font-mono">
                  <div>🔑 id (UUID) [PK]</div>
                  <div>· placa (UNIQUE)</div>
                  <div>· kilometraje_actual (INT)</div>
                  <div>· estado (OPERATIVO | MANT)</div>
                </div>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-800 space-y-2">
                <div className="font-mono font-bold text-blue-400 text-xs">conductores</div>
                <div className="text-[11px] text-slate-300 space-y-0.5 font-mono">
                  <div>🔑 id (UUID) [PK]</div>
                  <div>· dni (UNIQUE)</div>
                  <div>· licencia (UNIQUE)</div>
                  <div>· estado (DISPONIBLE | RUTA)</div>
                </div>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-800 space-y-2">
                <div className="font-mono font-bold text-blue-400 text-xs">clientes</div>
                <div className="text-[11px] text-slate-300 space-y-0.5 font-mono">
                  <div>🔑 id (UUID) [PK]</div>
                  <div>· ruc (UNIQUE)</div>
                  <div>· razon_social</div>
                  <div>· linea_credito_pen</div>
                </div>
              </div>
            </div>

            {/* Column 2: Operaciones & Flota */}
            <div className="space-y-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
                2. Operaciones & Mantenimiento
              </div>

              <div className="bg-slate-900/80 p-4 rounded-lg border border-blue-500/40 space-y-2 relative">
                <div className="font-mono font-bold text-amber-400 text-xs">programacion_operaciones</div>
                <div className="text-[11px] text-slate-300 space-y-0.5 font-mono">
                  <div>🔑 id (UUID) [PK]</div>
                  <div>🔗 vehiculo_id → vehiculos</div>
                  <div>🔗 conductor_id → conductores</div>
                  <div>🔗 cliente_id → clientes</div>
                  <div>🔗 ruta_id → rutas</div>
                  <div>· odometro_inicial / final</div>
                  <div>· estado (PROGRAMADO | EN_RUTA...)</div>
                </div>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-800 space-y-2">
                <div className="font-mono font-bold text-cyan-400 text-xs">mantenimientos</div>
                <div className="text-[11px] text-slate-300 space-y-0.5 font-mono">
                  <div>🔑 id (UUID) [PK]</div>
                  <div>🔗 vehiculo_id → vehiculos</div>
                  <div>🔗 taller_id → talleres</div>
                  <div>· costo_repuestos + mano_obra</div>
                  <div>· costo_total (STORED)</div>
                </div>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-800 space-y-2">
                <div className="font-mono font-bold text-purple-400 text-xs">registro_combustible</div>
                <div className="text-[11px] text-slate-300 space-y-0.5 font-mono">
                  <div>🔑 id (UUID) [PK]</div>
                  <div>🔗 vehiculo_id → vehiculos</div>
                  <div>🔗 programacion_id [FK opcional]</div>
                  <div>· galones * precio_por_galon</div>
                  <div>· url_sustento_documentario</div>
                </div>
              </div>
            </div>

            {/* Column 3: Finanzas & Cobranzas */}
            <div className="space-y-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
                3. Finanzas, Gastos & Cartera
              </div>

              <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-800 space-y-2">
                <div className="font-mono font-bold text-amber-400 text-xs">caja_chica_movimientos</div>
                <div className="text-[11px] text-slate-300 space-y-0.5 font-mono">
                  <div>🔑 id (UUID) [PK]</div>
                  <div>🔗 programacion_id → op</div>
                  <div>🔗 vehiculo_id → vehiculos</div>
                  <div>· categoria (VIATICOS | PEAJES...)</div>
                  <div>· sustento_url</div>
                </div>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-lg border border-emerald-500/40 space-y-2">
                <div className="font-mono font-bold text-emerald-400 text-xs">cuentas_por_cobrar</div>
                <div className="text-[11px] text-slate-300 space-y-0.5 font-mono">
                  <div>🔑 id (UUID) [PK]</div>
                  <div>🔗 cliente_id → clientes</div>
                  <div>🔗 programacion_id → op</div>
                  <div>· monto_total / monto_cobrado</div>
                  <div>· saldo_pendiente [CHECK]</div>
                  <div>· estado (EMITIDA | PARCIAL...)</div>
                </div>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-800 space-y-2">
                <div className="font-mono font-bold text-emerald-300 text-xs">cobranzas_detalle</div>
                <div className="text-[11px] text-slate-300 space-y-0.5 font-mono">
                  <div>🔑 id (UUID) [PK]</div>
                  <div>🔗 cuenta_cobrar_id → cuentas_por_cobrar</div>
                  <div>· monto_pago</div>
                  <div>· medio_pago & numero_operacion</div>
                  <div>⚡ Dispara trigger de saldo</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content 4: Triggers */}
      {activeSubTab === 'triggers' && (
        <div className="space-y-4">
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-sm text-white">
                1. Trigger fn_actualizar_saldo_cxc()
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Disparado en <code className="text-amber-300 font-mono">AFTER INSERT OR UPDATE OR DELETE ON cobranzas_detalle</code>.
              Calcula en tiempo real la suma exacta de los abonos recibidos para la factura, actualiza el
              <code className="text-blue-300 font-mono"> monto_cobrado</code>, computa el
              <code className="text-emerald-300 font-mono"> saldo_pendiente</code> y transiciona el estado de la factura automáticamente a:
              <strong className="text-white"> 'COBRADA'</strong> si el saldo llega a 0, o a
              <strong className="text-white"> 'PARCIAL'</strong> si existe un abono previo.
            </p>
          </div>

          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-400" />
              <h3 className="font-bold text-sm text-white">
                2. Trigger fn_actualizar_odometro_unidad()
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Disparado en <code className="text-blue-300 font-mono">AFTER INSERT ON registro_combustible</code>.
              Garantiza que el kilometraje actual en la tabla maestra <code className="text-amber-300 font-mono">vehiculos</code>
              siempre refleje el odómetro más alto auditado en grifo o al culminar la ruta, previniendo discrepancias y adulteración de kilometrajes.
            </p>
          </div>

          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-sm text-white">
                3. Restricciones Lógicas (CHECK CONSTRAINTS)
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Previene errores humanos y de integración a nivel del motor de base de datos:
              <code className="text-slate-200 font-mono block mt-2 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                CHECK (fecha_vencimiento &gt;= fecha_emision)<br />
                CHECK (monto_cobrado &lt;= monto_total)<br />
                CHECK (galones &gt; 0 AND precio_por_galon &gt; 0)<br />
                CHECK (odometro_final &gt;= odometro_inicial)
              </code>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
