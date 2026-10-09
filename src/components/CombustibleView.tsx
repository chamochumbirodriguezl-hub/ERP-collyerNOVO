import React, { useState } from 'react';
import {
  RegistroCombustible,
  Vehiculo,
  Conductor,
  ProgramacionOperacion,
  CombustibleTipo
} from '../types/erp';
import {
  Fuel,
  Plus,
  Search,
  Filter,
  FileText,
  Gauge,
  DollarSign,
  TrendingUp,
  ExternalLink,
  Receipt
} from 'lucide-react';
import { ReceiptViewerModal } from './ReceiptViewerModal';

interface CombustibleViewProps {
  combustibles: RegistroCombustible[];
  vehiculos: Vehiculo[];
  conductores: Conductor[];
  operaciones: ProgramacionOperacion[];
  onAddCombustible: (comb: RegistroCombustible) => void;
}

export const CombustibleView: React.FC<CombustibleViewProps> = ({
  combustibles,
  vehiculos,
  conductores,
  operaciones,
  onAddCombustible
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [vehiculoFilter, setVehiculoFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewerDoc, setViewerDoc] = useState<{ title: string; docNum: string; url: string; amount?: string; issuerOrCategory?: string } | null>(null);

  // Form
  const [formData, setFormData] = useState({
    vehiculoId: vehiculos[0]?.id || '',
    conductorId: conductores[0]?.id || '',
    programacionId: '',
    fechaAbastecimiento: new Date().toISOString().split('T')[0],
    estacionServicio: 'Primax Estación Panamericana Sur Km 130',
    tipoCombustible: 'DIESEL_B5' as CombustibleTipo,
    galones: 120,
    precioPorGalon: 18.20,
    kilometrajeOdometro: 0,
    numeroComprobante: '',
    urlSustentoDocumentario: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
    observaciones: ''
  });

  const handleVehiculoSelect = (vId: string) => {
    const v = vehiculos.find(item => item.id === vId);
    setFormData(prev => ({
      ...prev,
      vehiculoId: vId,
      kilometrajeOdometro: v ? v.kilometrajeActual + 350 : 0
    }));
  };

  const costoTotalCalculado = Number(formData.galones || 0) * Number(formData.precioPorGalon || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selVeh = vehiculos.find(v => v.id === formData.vehiculoId);
    const selCond = conductores.find(c => c.id === formData.conductorId);
    const selOp = operaciones.find(o => o.id === formData.programacionId);

    // Estimate km per gallon based on last refuel
    const prevFuel = combustibles.find(c => c.vehiculoId === formData.vehiculoId);
    let rendimiento = 3.8;
    if (prevFuel && formData.kilometrajeOdometro > prevFuel.kilometrajeOdometro && formData.galones > 0) {
      rendimiento = Number(((formData.kilometrajeOdometro - prevFuel.kilometrajeOdometro) / formData.galones).toFixed(2));
    }

    const newComb: RegistroCombustible = {
      id: `comb-${Date.now()}`,
      codigoVale: `COMB-2026-${String(combustibles.length + 1).padStart(4, '0')}`,
      vehiculoId: formData.vehiculoId,
      vehiculoPlaca: selVeh?.placa || 'N/A',
      conductorId: formData.conductorId,
      conductorNombre: selCond ? `${selCond.nombres} ${selCond.apellidos}` : 'Conductor',
      programacionId: formData.programacionId || undefined,
      operacionCodigo: selOp ? selOp.codigoOperacion : undefined,
      fechaAbastecimiento: formData.fechaAbastecimiento,
      estacionServicio: formData.estacionServicio,
      tipoCombustible: formData.tipoCombustible,
      galones: Number(formData.galones),
      precioPorGalon: Number(formData.precioPorGalon),
      costoTotal: Number(costoTotalCalculado.toFixed(2)),
      kilometrajeOdometro: Number(formData.kilometrajeOdometro),
      rendimientoKmGalon: rendimiento,
      numeroComprobante: formData.numeroComprobante || `F001-${Math.floor(10000 + Math.random() * 90000)}`,
      urlSustentoDocumentario: formData.urlSustentoDocumentario,
      observaciones: formData.observaciones,
      createdAt: new Date().toISOString()
    };

    onAddCombustible(newComb);
    setIsModalOpen(false);
  };

  const filtered = combustibles.filter(c => {
    const matchesSearch =
      c.codigoVale.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.numeroComprobante.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.vehiculoPlaca && c.vehiculoPlaca.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.conductorNombre && c.conductorNombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.estacionServicio.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesVeh = vehiculoFilter === 'ALL' || c.vehiculoId === vehiculoFilter;
    return matchesSearch && matchesVeh;
  });

  // KPIs
  const totalGalones = combustibles.reduce((a, b) => a + b.galones, 0);
  const totalInversionCombustible = combustibles.reduce((a, b) => a + b.costoTotal, 0);
  const avgRendimiento = combustibles.length > 0
    ? (combustibles.reduce((a, b) => a + (b.rendimientoKmGalon || 3.7), 0) / combustibles.length).toFixed(2)
    : '3.75';
  const avgPrecioGalon = totalGalones > 0 ? (totalInversionCombustible / totalGalones).toFixed(2) : '18.25';

  return (
    <div className="space-y-6">
      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            3. Registro de Combustible y Abastecimiento Diario
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Control métrico de galones, kilometraje de odómetro, auditoría de tickets y rendimiento de flota
          </p>
        </div>
        <button
          onClick={() => {
            if (vehiculos[0]) {
              setFormData(prev => ({
                ...prev,
                kilometrajeOdometro: vehiculos[0].kilometrajeActual + 250
              }));
            }
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Vale de Abastecimiento</span>
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block">Total Inversión Combustible</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xs text-slate-400">S/</span>
            <span className="text-2xl font-bold font-mono text-slate-100">
              {totalInversionCombustible.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">acumulado registrado</span>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block">Galones Despachados</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-blue-400">
              {totalGalones.toLocaleString('es-PE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </span>
            <span className="text-xs text-slate-500">Gal</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Diesel B5 S-50</span>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block">Rendimiento Promedio</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-emerald-400">{avgRendimiento}</span>
            <span className="text-xs text-slate-500">Km / Gal</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">rango óptimo de carga</span>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block">Precio Promedio por Galón</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xs text-slate-400">S/</span>
            <span className="text-2xl font-bold font-mono text-amber-400">{avgPrecioGalon}</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">estaciones Panamericana</span>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por vale COMB, comprobante SUNAT, estación o chofer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500"
          />
        </div>

        {/* Filter by vehicle */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Filtrar Unidad:</span>
          <select
            value={vehiculoFilter}
            onChange={(e) => setVehiculoFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg px-3 py-2"
          >
            <option value="ALL">Todas las Placas</option>
            {vehiculos.map(v => (
              <option key={v.id} value={v.id}>{v.placa} ({v.marca})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table view */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-900/40">
                <th className="py-3 px-4">Vale / Fecha</th>
                <th className="py-3 px-4">Placa & Odómetro</th>
                <th className="py-3 px-4">Chofer & Operación</th>
                <th className="py-3 px-4">Estación de Servicio</th>
                <th className="py-3 px-4 text-right">Galones</th>
                <th className="py-3 px-4 text-right">Precio/Gal</th>
                <th className="py-3 px-4 text-right">Costo Total</th>
                <th className="py-3 px-4 text-right">Rendimiento</th>
                <th className="py-3 px-4 text-center">Sustento Digital</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No se registran vales de combustible con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-900/50 transition-colors">
                    {/* Voucher & Date */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-semibold text-blue-400">{c.codigoVale}</div>
                      <div className="text-[11px] text-slate-400">{c.fechaAbastecimiento}</div>
                    </td>

                    {/* Vehicle & Odometer */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-amber-400 bg-amber-950/40 border border-amber-800/40 px-1.5 py-0.5 rounded-sm text-[11px]">
                          {c.vehiculoPlaca}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 font-mono mt-1">
                        {c.kilometrajeOdometro.toLocaleString()} km
                      </div>
                    </td>

                    {/* Driver & Op */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="text-slate-200 font-medium truncate">{c.conductorNombre}</div>
                      <div className="text-[11px] text-blue-400 font-mono mt-0.5">
                        {c.operacionCodigo || 'Despacho Libre'}
                      </div>
                    </td>

                    {/* Gas Station & Invoice */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="text-slate-300 truncate">{c.estacionServicio}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Comp: {c.numeroComprobante}
                      </div>
                    </td>

                    {/* Gallons */}
                    <td className="py-3.5 px-4 text-right font-mono text-slate-200">
                      {c.galones.toFixed(2)} gal
                    </td>

                    {/* Price per Gallon */}
                    <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                      S/ {c.precioPorGalon.toFixed(2)}
                    </td>

                    {/* Total cost */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                      S/ {c.costoTotal.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Efficiency */}
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-400">
                      {c.rendimientoKmGalon ? `${c.rendimientoKmGalon} km/gal` : '—'}
                    </td>

                    {/* Documentary Proof */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() =>
                          setViewerDoc({
                            title: `Ticket de Abastecimiento ${c.codigoVale}`,
                            docNum: c.numeroComprobante,
                            url: c.urlSustentoDocumentario,
                            issuerOrCategory: c.estacionServicio,
                            amount: `S/ ${c.costoTotal.toFixed(2)} (${c.galones} gal)`
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 rounded-md text-[11px] font-medium transition-colors"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Ver Ticket</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Registrar Abastecimiento */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Fuel className="w-5 h-5 text-blue-400" />
                <span>Registrar Abastecimiento de Combustible Diario</span>
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
                  <label className="block text-slate-400 mb-1">Vehículo / Placa:</label>
                  <select
                    value={formData.vehiculoId}
                    onChange={e => handleVehiculoSelect(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  >
                    {vehiculos.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.placa} ({v.marca} {v.modelo} - Odómetro: {v.kilometrajeActual.toLocaleString()} km)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Conductor Responsable:</label>
                  <select
                    value={formData.conductorId}
                    onChange={e => setFormData({ ...formData, conductorId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  >
                    {conductores.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nombres} {c.apellidos}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Operación Vinculada (Opcional):</label>
                  <select
                    value={formData.programacionId}
                    onChange={e => setFormData({ ...formData, programacionId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  >
                    <option value="">(Sin asignar - abastecimiento en base)</option>
                    {operaciones.map(op => (
                      <option key={op.id} value={op.id}>
                        {op.codigoOperacion} · {op.rutaNombre} ({op.vehiculoPlaca})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Fecha de Abastecimiento:</label>
                  <input
                    type="date"
                    required
                    value={formData.fechaAbastecimiento}
                    onChange={e => setFormData({ ...formData, fechaAbastecimiento: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Estación de Servicio / Grifo:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Primax Panamericana Sur Km 130"
                    value={formData.estacionServicio}
                    onChange={e => setFormData({ ...formData, estacionServicio: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">N° Comprobante / Ticket Grifo:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: F045-0089123"
                    value={formData.numeroComprobante}
                    onChange={e => setFormData({ ...formData, numeroComprobante: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono"
                  />
                </div>
              </div>

              {/* Gallons, Price, Odometer */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
                <span className="text-[11px] font-semibold text-slate-300 block uppercase tracking-wider">
                  Medición Volumétrica & Cálculo de Inversión
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Galones Despachados:</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.1"
                      required
                      value={formData.galones}
                      onChange={e => setFormData({ ...formData, galones: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Precio por Galón (S/):</label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      value={formData.precioPorGalon}
                      onChange={e => setFormData({ ...formData, precioPorGalon: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Odómetro al Abastecer (km):</label>
                    <input
                      type="number"
                      required
                      value={formData.kilometrajeOdometro}
                      onChange={e => setFormData({ ...formData, kilometrajeOdometro: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <span className="text-xs text-slate-400">Inversión Total en Soles:</span>
                  <span className="text-sm font-bold font-mono text-emerald-400">
                    S/ {costoTotalCalculado.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Documentary Proof URL */}
              <div>
                <label className="block text-slate-400 mb-1">
                  URL de Sustento Documentario (Foto de Ticket o Factura SUNAT del Grifo):
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={formData.urlSustentoDocumentario}
                  onChange={e => setFormData({ ...formData, urlSustentoDocumentario: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Requisito indispensable para liquidación de fletes y crédito fiscal IGV ante SUNAT.
                </span>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Observaciones:</label>
                <input
                  type="text"
                  placeholder="Ej: Tanqueo full antes de ingresar a zona de sierra"
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
                  Guardar Vale de Combustible
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
