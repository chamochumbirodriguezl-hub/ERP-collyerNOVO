import React, { useState } from 'react';
import {
  RegistroMantenimiento,
  Vehiculo,
  Taller,
  MantenimientoTipo,
  MantenimientoEstado
} from '../types/erp';
import {
  Wrench,
  Plus,
  Search,
  Filter,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  FileText,
  Clock,
  ExternalLink
} from 'lucide-react';
import { ReceiptViewerModal } from './ReceiptViewerModal';

interface MantenimientoViewProps {
  mantenimientos: RegistroMantenimiento[];
  vehiculos: Vehiculo[];
  talleres: Taller[];
  onAddMantenimiento: (mnt: RegistroMantenimiento) => void;
  onUpdateEstadoMantenimiento: (id: string, nuevoEstado: MantenimientoEstado, fechaSalida?: string) => void;
}

export const MantenimientoView: React.FC<MantenimientoViewProps> = ({
  mantenimientos,
  vehiculos,
  talleres,
  onAddMantenimiento,
  onUpdateEstadoMantenimiento
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewerDoc, setViewerDoc] = useState<{ title: string; docNum: string; url: string; amount?: string; issuerOrCategory?: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    vehiculoId: vehiculos[0]?.id || '',
    tipoMantenimiento: 'PREVENTIVO' as MantenimientoTipo,
    fechaIngreso: new Date().toISOString().split('T')[0],
    kilometrajeRegistro: 0,
    tallerId: talleres[0]?.id || '',
    descripcionServicio: '',
    costoRepuestos: 0,
    costoManoObra: 0,
    costoOtros: 0,
    facturaTaller: '',
    sustentoUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80'
  });

  const handleVehiculoChange = (vehId: string) => {
    const v = vehiculos.find(veh => veh.id === vehId);
    setFormData(prev => ({
      ...prev,
      vehiculoId: vehId,
      kilometrajeRegistro: v ? v.kilometrajeActual : 0
    }));
  };

  const totalCalculado = Number(formData.costoRepuestos || 0) + Number(formData.costoManoObra || 0) + Number(formData.costoOtros || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selVeh = vehiculos.find(v => v.id === formData.vehiculoId);
    const selTaller = talleres.find(t => t.id === formData.tallerId);

    const newMnt: RegistroMantenimiento = {
      id: `mnt-${Date.now()}`,
      codigoMantenimiento: `MNT-2026-${String(mantenimientos.length + 1).padStart(4, '0')}`,
      vehiculoId: formData.vehiculoId,
      vehiculoPlaca: selVeh?.placa || 'N/A',
      tipoMantenimiento: formData.tipoMantenimiento,
      fechaIngreso: formData.fechaIngreso,
      kilometrajeRegistro: Number(formData.kilometrajeRegistro) || (selVeh ? selVeh.kilometrajeActual : 0),
      tallerId: formData.tallerId,
      tallerNombre: selTaller?.razonSocial || 'Taller General',
      descripcionServicio: formData.descripcionServicio,
      costoRepuestos: Number(formData.costoRepuestos) || 0,
      costoManoObra: Number(formData.costoManoObra) || 0,
      costoOtros: Number(formData.costoOtros) || 0,
      costoTotal: totalCalculado,
      facturaTaller: formData.facturaTaller || `FAC-${Math.floor(1000 + Math.random() * 9000)}`,
      estado: 'EN_PROCESO',
      sustentoUrl: formData.sustentoUrl,
      createdAt: new Date().toISOString()
    };

    onAddMantenimiento(newMnt);
    setIsModalOpen(false);
  };

  const filtered = mantenimientos.filter(m => {
    const matchesSearch =
      m.codigoMantenimiento.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.vehiculoPlaca && m.vehiculoPlaca.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.tallerNombre && m.tallerNombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      m.descripcionServicio.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTipo = tipoFilter === 'ALL' || m.tipoMantenimiento === tipoFilter;
    return matchesSearch && matchesTipo;
  });

  // KPIs
  const totalGastoRepuestos = mantenimientos.reduce((a, b) => a + b.costoRepuestos, 0);
  const totalGastoManoObra = mantenimientos.reduce((a, b) => a + b.costoManoObra, 0);
  const totalGastoMantenimiento = mantenimientos.reduce((a, b) => a + b.costoTotal, 0);
  const enProcesoCount = mantenimientos.filter(m => m.estado === 'EN_PROCESO').length;

  return (
    <div className="space-y-6">
      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            2. Registro Diario de Mantenimiento Preventivo y Correctivo
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Control discriminado de repuestos, mano de obra, facturas de taller y disponibilidad mecánica
          </p>
        </div>
        <button
          onClick={() => {
            if (vehiculos[0]) {
              setFormData(prev => ({
                ...prev,
                kilometrajeRegistro: vehiculos[0].kilometrajeActual
              }));
            }
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Orden de Taller</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block">Total Mantenimiento</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xs text-slate-400">S/</span>
            <span className="text-2xl font-bold font-mono text-slate-100">
              {totalGastoMantenimiento.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">acumulado del mes</span>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block">Gasto en Repuestos</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xs text-slate-400">S/</span>
            <span className="text-2xl font-bold font-mono text-blue-400">
              {totalGastoRepuestos.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">piezas, aceites y filtros</span>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block">Gasto en Mano de Obra</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xs text-slate-400">S/</span>
            <span className="text-2xl font-bold font-mono text-purple-400">
              {totalGastoManoObra.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">servicios mecánicos</span>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block">Unidades en Taller Ahora</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-amber-400">{enProcesoCount}</span>
            <span className="text-xs text-slate-500">en reparación</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">disponibilidad 80%</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por código MNT, placa de unidad, taller o descripción de falla..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-900 rounded-lg shrink-0">
          {['ALL', 'PREVENTIVO', 'CORRECTIVO'].map((t) => (
            <button
              key={t}
              onClick={() => setTipoFilter(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                tipoFilter === t
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t === 'ALL' ? 'Todos los Tipos' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-900/40">
                <th className="py-3 px-4">Orden / Unidad</th>
                <th className="py-3 px-4">Tipo & Fechas</th>
                <th className="py-3 px-4">Taller & Factura</th>
                <th className="py-3 px-4">Descripción del Trabajo</th>
                <th className="py-3 px-4 text-right">Repuestos</th>
                <th className="py-3 px-4 text-right">Mano Obra</th>
                <th className="py-3 px-4 text-right">Total (S/)</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No se registran órdenes de mantenimiento con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-900/50 transition-colors">
                    {/* Order & Placa */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-semibold text-blue-400">{m.codigoMantenimiento}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="font-semibold text-amber-400 bg-amber-950/40 border border-amber-800/40 px-1.5 py-0.5 rounded-sm text-[11px]">
                          {m.vehiculoPlaca}
                        </span>
                        <span className="text-[11px] text-slate-400">{m.kilometrajeRegistro.toLocaleString()} km</span>
                      </div>
                    </td>

                    {/* Type & Dates */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-xs text-[10px] font-bold tracking-wider uppercase ${
                          m.tipoMantenimiento === 'PREVENTIVO'
                            ? 'text-cyan-400 bg-cyan-950/60 border border-cyan-800/60'
                            : 'text-amber-400 bg-amber-950/60 border border-amber-800/60'
                        }`}
                      >
                        {m.tipoMantenimiento}
                      </span>
                      <div className="text-[11px] text-slate-400 font-mono mt-1">
                        Ingreso: {m.fechaIngreso}
                      </div>
                      {m.fechaSalida && (
                        <div className="text-[11px] text-emerald-400 font-mono">
                          Salida: {m.fechaSalida}
                        </div>
                      )}
                    </td>

                    {/* Workshop */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="text-slate-200 font-medium truncate">{m.tallerNombre}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Comprobante: {m.facturaTaller || 'S/N'}
                      </div>
                    </td>

                    {/* Description */}
                    <td className="py-3.5 px-4 max-w-sm">
                      <p className="text-slate-300 text-xs line-clamp-2 leading-relaxed">
                        {m.descripcionServicio}
                      </p>
                    </td>

                    {/* Spare parts cost */}
                    <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                      S/ {m.costoRepuestos.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Labor cost */}
                    <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                      S/ {m.costoManoObra.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Total cost */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                      S/ {m.costoTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </td>

                    {/* State */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-sm text-[11px] font-semibold tracking-wide ${
                          m.estado === 'EN_PROCESO'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : m.estado === 'FINALIZADO'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {m.estado.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {m.sustentoUrl && (
                          <button
                            onClick={() =>
                              setViewerDoc({
                                title: `Factura Mantenimiento ${m.codigoMantenimiento}`,
                                docNum: m.facturaTaller || m.codigoMantenimiento,
                                url: m.sustentoUrl!,
                                issuerOrCategory: m.tallerNombre,
                                amount: `S/ ${m.costoTotal.toFixed(2)}`
                              })
                            }
                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-900 rounded-md transition-colors"
                            title="Ver sustento / Factura de taller"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        )}
                        {m.estado === 'EN_PROCESO' && (
                          <button
                            onClick={() =>
                              onUpdateEstadoMantenimiento(
                                m.id,
                                'FINALIZADO',
                                new Date().toISOString().split('T')[0]
                              )
                            }
                            className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-600/40 rounded-md text-[11px] font-medium transition-colors"
                          >
                            Dar de Alta
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Nueva Orden de Mantenimiento */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-blue-400" />
                <span>Registrar Entrada a Mantenimiento de Flota</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Cancelar
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Unidad / Vehículo:</label>
                  <select
                    value={formData.vehiculoId}
                    onChange={e => handleVehiculoChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  >
                    {vehiculos.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.placa} · {v.marca} {v.modelo} (Actual: {v.kilometrajeActual.toLocaleString()} km)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Tipo de Mantenimiento:</label>
                  <select
                    value={formData.tipoMantenimiento}
                    onChange={e => setFormData({ ...formData, tipoMantenimiento: e.target.value as MantenimientoTipo })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  >
                    <option value="PREVENTIVO">PREVENTIVO (Cambio fluidos, filtros, engrase)</option>
                    <option value="CORRECTIVO">CORRECTIVO (Reparación de avería o siniestro)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Fecha Ingreso Taller:</label>
                  <input
                    type="date"
                    required
                    value={formData.fechaIngreso}
                    onChange={e => setFormData({ ...formData, fechaIngreso: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Kilometraje al Ingresar (Odómetro):</label>
                  <input
                    type="number"
                    required
                    value={formData.kilometrajeRegistro}
                    onChange={e => setFormData({ ...formData, kilometrajeRegistro: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Taller de Destino:</label>
                  <select
                    value={formData.tallerId}
                    onChange={e => setFormData({ ...formData, tallerId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  >
                    {talleres.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.razonSocial} ({t.tipo})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">N° Factura / Orden de Trabajo del Taller:</label>
                  <input
                    type="text"
                    placeholder="Ej: F001-008412"
                    value={formData.facturaTaller}
                    onChange={e => setFormData({ ...formData, facturaTaller: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Descripción del Trabajo o Falla Mecánica:</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Detallar intervención: cambio de embrague, rectificación de discos, cambio de aceite sintético 15W40..."
                  value={formData.descripcionServicio}
                  onChange={e => setFormData({ ...formData, descripcionServicio: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                />
              </div>

              {/* Cost breakdown */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
                <span className="text-[11px] font-semibold text-slate-300 block uppercase tracking-wider">
                  Desglose Financiero de Costos (Soles PEN)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Costo Repuestos (S/):</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.costoRepuestos}
                      onChange={e => setFormData({ ...formData, costoRepuestos: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Costo Mano de Obra (S/):</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.costoManoObra}
                      onChange={e => setFormData({ ...formData, costoManoObra: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Otros / Insumos (S/):</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.costoOtros}
                      onChange={e => setFormData({ ...formData, costoOtros: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <span className="text-xs text-slate-400">Costo Total Calculado:</span>
                  <span className="text-sm font-bold font-mono text-emerald-400">
                    S/ {totalCalculado.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">URL de Sustento / Factura Escaneada:</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.sustentoUrl}
                  onChange={e => setFormData({ ...formData, sustentoUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg"
                >
                  Guardar Registro de Mantenimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
