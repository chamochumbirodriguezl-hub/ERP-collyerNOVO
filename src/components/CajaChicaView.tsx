import React, { useState } from 'react';
import {
  CajaChicaGasto,
  Vehiculo,
  Conductor,
  ProgramacionOperacion,
  GastoCategoria,
  ComprobanteTipo,
  GastoEstado
} from '../types/erp';
import {
  Wallet,
  Plus,
  Search,
  Filter,
  Receipt,
  FileCheck2,
  DollarSign,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  Truck
} from 'lucide-react';
import { ReceiptViewerModal } from './ReceiptViewerModal';

interface CajaChicaViewProps {
  gastos: CajaChicaGasto[];
  vehiculos: Vehiculo[];
  conductores: Conductor[];
  operaciones: ProgramacionOperacion[];
  onAddGasto: (gasto: CajaChicaGasto) => void;
  onUpdateEstadoGasto: (id: string, nuevoEstado: GastoEstado, aprobadoPor?: string) => void;
}

export const CajaChicaView: React.FC<CajaChicaViewProps> = ({
  gastos,
  vehiculos,
  conductores,
  operaciones,
  onAddGasto,
  onUpdateEstadoGasto
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewerDoc, setViewerDoc] = useState<{ title: string; docNum: string; url: string; amount?: string; issuerOrCategory?: string } | null>(null);

  // Initial assigned petty cash fund
  const FONDO_INICIAL_CAJA_CHICA = 5000.00;

  // Form State
  const [formData, setFormData] = useState({
    fechaGasto: new Date().toISOString().split('T')[0],
    categoriaGasto: 'VIATICOS' as GastoCategoria,
    programacionId: '',
    vehiculoId: vehiculos[0]?.id || '',
    conductorId: conductores[0]?.id || '',
    monto: 150,
    moneda: 'PEN' as const,
    beneficiarioOProveedor: '',
    tipoComprobante: 'TICKET' as ComprobanteTipo,
    numeroComprobante: '',
    sustentoUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
    observaciones: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selVeh = vehiculos.find(v => v.id === formData.vehiculoId);
    const selCond = conductores.find(c => c.id === formData.conductorId);
    const selOp = operaciones.find(o => o.id === formData.programacionId);

    const newGasto: CajaChicaGasto = {
      id: `cch-${Date.now()}`,
      codigoGasto: `CCH-2026-${String(gastos.length + 1).padStart(4, '0')}`,
      fechaGasto: formData.fechaGasto,
      tipoMovimiento: 'EGRESO',
      categoriaGasto: formData.categoriaGasto,
      programacionId: formData.programacionId || undefined,
      operacionCodigo: selOp ? selOp.codigoOperacion : undefined,
      vehiculoId: formData.vehiculoId || undefined,
      vehiculoPlaca: selVeh?.placa,
      conductorId: formData.conductorId || undefined,
      conductorNombre: selCond ? `${selCond.nombres} ${selCond.apellidos}` : undefined,
      monto: Number(formData.monto),
      moneda: formData.moneda,
      beneficiarioOProveedor: formData.beneficiarioOProveedor || (selCond ? `${selCond.nombres} ${selCond.apellidos}` : 'Proveedor General'),
      tipoComprobante: formData.tipoComprobante,
      numeroComprobante: formData.numeroComprobante || `DOC-${Math.floor(1000 + Math.random() * 9000)}`,
      sustentoUrl: formData.sustentoUrl,
      observaciones: formData.observaciones,
      estado: 'PENDIENTE_RENDICION',
      createdAt: new Date().toISOString()
    };

    onAddGasto(newGasto);
    setIsModalOpen(false);
  };

  const filtered = gastos.filter(g => {
    const matchesSearch =
      g.codigoGasto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.numeroComprobante.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.beneficiarioOProveedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.vehiculoPlaca && g.vehiculoPlaca.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (g.conductorNombre && g.conductorNombre.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCat = categoriaFilter === 'ALL' || g.categoriaGasto === categoriaFilter;
    return matchesSearch && matchesCat;
  });

  // Financial calculations
  const totalEgresos = gastos.reduce((a, b) => a + b.monto, 0);
  const saldoDisponibleCaja = Math.max(0, FONDO_INICIAL_CAJA_CHICA - totalEgresos);
  const totalPeajes = gastos.filter(g => g.categoriaGasto === 'PEAJES').reduce((a, b) => a + b.monto, 0);
  const totalViaticos = gastos.filter(g => g.categoriaGasto === 'VIATICOS').reduce((a, b) => a + b.monto, 0);
  const totalEmergencias = gastos.filter(g => g.categoriaGasto === 'REPUESTO_EMERGENCIA').reduce((a, b) => a + b.monto, 0);
  const pendientesRendicionCount = gastos.filter(g => g.estado === 'PENDIENTE_RENDICION').length;

  return (
    <div className="space-y-6">
      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            4. Control de Caja Chica y Gastos Operativos Diarios
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Liquidación de viáticos a choferes, pago de peajes de ruta y repuestos de emergencia en carretera
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Gasto Operativo</span>
        </button>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block">Saldo Disponible en Caja</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xs text-slate-400">S/</span>
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {saldoDisponibleCaja.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            de S/ {FONDO_INICIAL_CAJA_CHICA.toLocaleString()} asignados
          </span>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block">Peajes en Ruta</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xs text-slate-400">S/</span>
            <span className="text-2xl font-bold font-mono text-blue-400">
              {totalPeajes.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">tickets auditados</span>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block">Viáticos a Choferes</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xs text-slate-400">S/</span>
            <span className="text-2xl font-bold font-mono text-amber-400">
              {totalViaticos.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">alimentación y estadías</span>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block">Repuestos de Emergencia</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xs text-slate-400">S/</span>
            <span className="text-2xl font-bold font-mono text-rose-400">
              {totalEmergencias.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {pendientesRendicionCount} por auditar
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por código CCH, beneficiario, comprobante, chofer o placa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-900 rounded-lg shrink-0">
          {['ALL', 'VIATICOS', 'PEAJES', 'REPUESTO_EMERGENCIA'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoriaFilter(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                categoriaFilter === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'Todas las Categorías' : cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Table view */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-900/40">
                <th className="py-3 px-4">Código / Fecha</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Beneficiario / Proveedor</th>
                <th className="py-3 px-4">Unidad & Chofer</th>
                <th className="py-3 px-4">Comprobante</th>
                <th className="py-3 px-4 text-right">Monto (S/)</th>
                <th className="py-3 px-4 text-center">Estado Auditoría</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No se registran gastos de caja chica bajo los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                filtered.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-900/50 transition-colors">
                    {/* Code & Date */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-semibold text-blue-400">{g.codigoGasto}</div>
                      <div className="text-[11px] text-slate-400">{g.fechaGasto}</div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-xs text-[10px] font-bold tracking-wider uppercase ${
                          g.categoriaGasto === 'PEAJES'
                            ? 'text-blue-400 bg-blue-950/60 border border-blue-800/60'
                            : g.categoriaGasto === 'VIATICOS'
                            ? 'text-amber-400 bg-amber-950/60 border border-amber-800/60'
                            : 'text-rose-400 bg-rose-950/60 border border-rose-800/60'
                        }`}
                      >
                        {g.categoriaGasto.replace('_', ' ')}
                      </span>
                      {g.operacionCodigo && (
                        <div className="text-[11px] text-slate-400 font-mono mt-1">
                          Op: {g.operacionCodigo}
                        </div>
                      )}
                    </td>

                    {/* Beneficiary */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="text-slate-200 font-medium truncate">{g.beneficiarioOProveedor}</div>
                      {g.observaciones && (
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {g.observaciones}
                        </div>
                      )}
                    </td>

                    {/* Vehicle & Driver */}
                    <td className="py-3.5 px-4">
                      {g.vehiculoPlaca && (
                        <span className="font-mono font-semibold text-amber-400 bg-amber-950/40 border border-amber-800/40 px-1.5 py-0.5 rounded-sm text-[11px] mr-1">
                          {g.vehiculoPlaca}
                        </span>
                      )}
                      <div className="text-slate-300 text-[11px] mt-1 truncate">
                        {g.conductorNombre || 'Conductor no asignado'}
                      </div>
                    </td>

                    {/* Voucher */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-slate-300">
                      <div>{g.tipoComprobante}</div>
                      <div className="text-slate-500">{g.numeroComprobante}</div>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                      S/ {g.monto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-sm text-[11px] font-semibold tracking-wide ${
                          g.estado === 'APROBADO'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : g.estado === 'PENDIENTE_RENDICION'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {g.estado.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {g.sustentoUrl && (
                          <button
                            onClick={() =>
                              setViewerDoc({
                                title: `Sustento de Gasto ${g.codigoGasto}`,
                                docNum: g.numeroComprobante,
                                url: g.sustentoUrl,
                                issuerOrCategory: `${g.categoriaGasto} - ${g.beneficiarioOProveedor}`,
                                amount: `S/ ${g.monto.toFixed(2)}`
                              })
                            }
                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-900 rounded-md transition-colors"
                            title="Ver sustento digital"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                        )}
                        {g.estado === 'PENDIENTE_RENDICION' && (
                          <button
                            onClick={() =>
                              onUpdateEstadoGasto(g.id, 'APROBADO', 'Tesorería / Administración')
                            }
                            className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-600/40 rounded-md text-[11px] font-medium transition-colors"
                          >
                            Aprobar
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

      {/* Modal: Registrar Gasto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-blue-400" />
                <span>Registrar Desembolso de Caja Chica</span>
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
                  <label className="block text-slate-400 mb-1">Categoría del Gasto:</label>
                  <select
                    value={formData.categoriaGasto}
                    onChange={e => setFormData({ ...formData, categoriaGasto: e.target.value as GastoCategoria })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  >
                    <option value="VIATICOS">VIÁTICOS (Alimentación, estadía chofer en ruta)</option>
                    <option value="PEAJES">PEAJES (Concesionarias viales / Rutas)</option>
                    <option value="REPUESTO_EMERGENCIA">REPUESTO DE EMERGENCIA (Pinchazo, parche, focos)</option>
                    <option value="LAVADO_ENGRASE">LAVADO & ENGRASE DE RUTA</option>
                    <option value="OTRO">OTRO GASTO OPERATIVO</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Fecha del Gasto:</label>
                  <input
                    type="date"
                    required
                    value={formData.fechaGasto}
                    onChange={e => setFormData({ ...formData, fechaGasto: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Monto en Soles (S/):</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    required
                    value={formData.monto}
                    onChange={e => setFormData({ ...formData, monto: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Beneficiario o Proveedor:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Chofer Juan Pérez / Concesionaria Survial"
                    value={formData.beneficiarioOProveedor}
                    onChange={e => setFormData({ ...formData, beneficiarioOProveedor: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Tipo de Comprobante:</label>
                  <select
                    value={formData.tipoComprobante}
                    onChange={e => setFormData({ ...formData, tipoComprobante: e.target.value as ComprobanteTipo })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  >
                    <option value="TICKET">TICKET (Peaje / Grifo / Balanza)</option>
                    <option value="FACTURA">FACTURA SUNAT CON RUC</option>
                    <option value="BOLETA">BOLETA DE VENTA</option>
                    <option value="RECIBO_INTERNO">RECIBO INTERNO DE CAJA (Firma chofer)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">N° Comprobante / Serie:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: TK-84192 o F001-0024"
                    value={formData.numeroComprobante}
                    onChange={e => setFormData({ ...formData, numeroComprobante: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Vehículo (Opcional):</label>
                  <select
                    value={formData.vehiculoId}
                    onChange={e => setFormData({ ...formData, vehiculoId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  >
                    <option value="">(Sin asignar)</option>
                    {vehiculos.map(v => (
                      <option key={v.id} value={v.id}>{v.placa} ({v.marca})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Conductor Asignado:</label>
                  <select
                    value={formData.conductorId}
                    onChange={e => setFormData({ ...formData, conductorId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  >
                    <option value="">(Sin asignar)</option>
                    {conductores.map(c => (
                      <option key={c.id} value={c.id}>{c.nombres} {c.apellidos}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Operación Vinculada:</label>
                  <select
                    value={formData.programacionId}
                    onChange={e => setFormData({ ...formData, programacionId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  >
                    <option value="">(Sin asignar)</option>
                    {operaciones.map(op => (
                      <option key={op.id} value={op.id}>{op.codigoOperacion}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">URL de Sustento / Foto del Ticket:</label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={formData.sustentoUrl}
                  onChange={e => setFormData({ ...formData, sustentoUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Detalle / Justificación:</label>
                <textarea
                  rows={2}
                  placeholder="Motivo del egreso, lugar donde ocurrió el gasto, autorización previa..."
                  value={formData.observaciones}
                  onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
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
                  Guardar Gasto Operativo
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
