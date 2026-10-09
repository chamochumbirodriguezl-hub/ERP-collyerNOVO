import React, { useState } from 'react';
import {
  ProgramacionOperacion,
  Vehiculo,
  Conductor,
  Cliente,
  Ruta,
  OperacionEstado
} from '../types/erp';
import {
  Plus,
  Search,
  Filter,
  Truck,
  MapPin,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  FileCheck,
  ChevronDown
} from 'lucide-react';

interface OperacionesViewProps {
  operaciones: ProgramacionOperacion[];
  vehiculos: Vehiculo[];
  conductores: Conductor[];
  clientes: Cliente[];
  rutas: Ruta[];
  onAddOperacion: (op: ProgramacionOperacion) => void;
  onUpdateEstado: (id: string, nuevoEstado: OperacionEstado, odometroFinal?: number) => void;
}

export const OperacionesView: React.FC<OperacionesViewProps> = ({
  operaciones,
  vehiculos,
  conductores,
  clientes,
  rutas,
  onAddOperacion,
  onUpdateEstado
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [finalizarModalData, setFinalizarModalData] = useState<{ id: string; odometroInicial: number } | null>(null);
  const [odometroFinalInput, setOdometroFinalInput] = useState<number>(0);

  // Form state
  const [formData, setFormData] = useState({
    ordenServicioRef: '',
    fechaProgramada: new Date().toISOString().split('T')[0],
    rutaId: rutas[0]?.id || '',
    vehiculoId: vehiculos.find(v => v.estado === 'OPERATIVO')?.id || vehiculos[0]?.id || '',
    conductorId: conductores.find(c => c.estado === 'DISPONIBLE')?.id || conductores[0]?.id || '',
    clienteId: clientes[0]?.id || '',
    cargaDescripcion: '',
    pesoTn: 30,
    origenDetalle: '',
    destinoDetalle: '',
    odometroInicial: 0,
    observaciones: ''
  });

  // Pre-fill initial odometer when selecting vehicle
  const handleVehiculoChange = (vehId: string) => {
    const v = vehiculos.find(veh => veh.id === vehId);
    setFormData(prev => ({
      ...prev,
      vehiculoId: vehId,
      odometroInicial: v ? v.kilometrajeActual : 0
    }));
  };

  const filteredOperaciones = operaciones.filter(op => {
    const matchesSearch =
      op.codigoOperacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (op.ordenServicioRef && op.ordenServicioRef.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (op.clienteNombre && op.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (op.conductorNombre && op.conductorNombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (op.vehiculoPlaca && op.vehiculoPlaca.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesEstado = estadoFilter === 'ALL' || op.estado === estadoFilter;
    return matchesSearch && matchesEstado;
  });

  const handleSubmitNew = (e: React.FormEvent) => {
    e.preventDefault();
    const selRuta = rutas.find(r => r.id === formData.rutaId);
    const selVeh = vehiculos.find(v => v.id === formData.vehiculoId);
    const selCond = conductores.find(c => c.id === formData.conductorId);
    const selCli = clientes.find(cl => cl.id === formData.clienteId);

    const newOp: ProgramacionOperacion = {
      id: `op-${Date.now()}`,
      codigoOperacion: `OP-2026-${String(operaciones.length + 1).padStart(4, '0')}`,
      ordenServicioRef: formData.ordenServicioRef || `OS-${Math.floor(1000 + Math.random() * 9000)}`,
      fechaProgramada: formData.fechaProgramada,
      rutaId: formData.rutaId,
      rutaNombre: selRuta ? `${selRuta.origen} → ${selRuta.destino}` : 'Ruta Asignada',
      vehiculoId: formData.vehiculoId,
      vehiculoPlaca: selVeh?.placa || 'N/A',
      conductorId: formData.conductorId,
      conductorNombre: selCond ? `${selCond.nombres} ${selCond.apellidos}` : 'Conductor Asignado',
      clienteId: formData.clienteId,
      clienteNombre: selCli?.razonSocial || 'Cliente General',
      cargaDescripcion: formData.cargaDescripcion,
      pesoTn: Number(formData.pesoTn),
      origenDetalle: formData.origenDetalle || selRuta?.origen || 'Punto de Carga',
      destinoDetalle: formData.destinoDetalle || selRuta?.destino || 'Punto de Descarga',
      estado: 'PROGRAMADO',
      odometroInicial: Number(formData.odometroInicial) || (selVeh ? selVeh.kilometrajeActual : 0),
      observaciones: formData.observaciones,
      createdAt: new Date().toISOString()
    };

    onAddOperacion(newOp);
    setIsModalOpen(false);
  };

  const handleFinalizarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (finalizarModalData) {
      onUpdateEstado(finalizarModalData.id, 'ENTREGADO', odometroFinalInput);
      setFinalizarModalData(null);
    }
  };

  // KPIs
  const enRutaCount = operaciones.filter(o => o.estado === 'EN_RUTA').length;
  const programadasCount = operaciones.filter(o => o.estado === 'PROGRAMADO').length;
  const entregadasCount = operaciones.filter(o => o.estado === 'ENTREGADO' || o.estado === 'LIQUIDADO').length;
  const totalPesoTn = operaciones.reduce((acc, curr) => acc + curr.pesoTn, 0);

  return (
    <div className="space-y-6">
      {/* Header section with KPIs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            1. Programación de Operaciones Diarias
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Asignación y despacho de flota, choferes profesionales, rutas y trazabilidad de odómetro
          </p>
        </div>
        <button
          onClick={() => {
            if (vehiculos[0]) {
              setFormData(prev => ({
                ...prev,
                odometroInicial: vehiculos[0].kilometrajeActual
              }));
            }
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Programación</span>
        </button>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block">En Ruta Activas</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-amber-400">{enRutaCount}</span>
            <span className="text-xs text-slate-500">unidades despachadas</span>
          </div>
        </div>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block">Programadas para Salida</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-blue-400">{programadasCount}</span>
            <span className="text-xs text-slate-500">listas en patio</span>
          </div>
        </div>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block">Entregas Cumplidas</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-emerald-400">{entregadasCount}</span>
            <span className="text-xs text-slate-500">conformes</span>
          </div>
        </div>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block">Volumen Transportado</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-slate-100">{totalPesoTn.toFixed(1)}</span>
            <span className="text-xs text-slate-500">Tn métricas</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por código, O.S., placa, conductor o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500"
          />
        </div>

        {/* State filters */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-900 rounded-lg shrink-0">
          {['ALL', 'PROGRAMADO', 'EN_RUTA', 'ENTREGADO', 'LIQUIDADO'].map((st) => (
            <button
              key={st}
              onClick={() => setEstadoFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                estadoFilter === st
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st === 'ALL' ? 'Todas' : st.replace('_', ' ')}
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
                <th className="py-3 px-4">Operación / O.S.</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Ruta & Itinerario</th>
                <th className="py-3 px-4">Unidad & Chofer</th>
                <th className="py-3 px-4">Cliente & Carga</th>
                <th className="py-3 px-4 text-right">Odómetro</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredOperaciones.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No se encontraron operaciones con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                filteredOperaciones.map((op) => {
                  return (
                    <tr key={op.id} className="hover:bg-slate-900/50 transition-colors">
                      {/* Operation code */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-semibold text-blue-400">{op.codigoOperacion}</div>
                        <div className="text-[11px] text-slate-500">{op.ordenServicioRef}</div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-300 font-mono">
                        {op.fechaProgramada}
                      </td>

                      {/* Route */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-medium text-slate-200 truncate">{op.rutaNombre}</div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {op.origenDetalle} → {op.destinoDetalle}
                        </div>
                      </td>

                      {/* Vehicle & Driver */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-amber-400 bg-amber-950/40 border border-amber-800/40 px-1.5 py-0.5 rounded-sm text-[11px]">
                            {op.vehiculoPlaca}
                          </span>
                        </div>
                        <div className="text-slate-300 text-[11px] mt-1 truncate">
                          {op.conductorNombre}
                        </div>
                      </td>

                      {/* Client & Cargo */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="text-slate-200 font-medium truncate">{op.clienteNombre}</div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {op.cargaDescripcion} ({op.pesoTn} Tn)
                        </div>
                      </td>

                      {/* Odometers */}
                      <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                        <div>{op.odometroInicial.toLocaleString()} km</div>
                        {op.odometroFinal ? (
                          <div className="text-[11px] text-emerald-400">
                            Fin: {op.odometroFinal.toLocaleString()} km
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-600">Pendiente fin</div>
                        )}
                      </td>

                      {/* State */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-sm text-[11px] font-semibold tracking-wide ${
                            op.estado === 'EN_RUTA'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : op.estado === 'PROGRAMADO'
                              ? 'bg-blue-950 text-blue-400 border border-blue-800'
                              : op.estado === 'ENTREGADO'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : op.estado === 'LIQUIDADO'
                              ? 'bg-purple-950 text-purple-400 border border-purple-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {op.estado.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Action workflow */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {op.estado === 'PROGRAMADO' && (
                          <button
                            onClick={() => onUpdateEstado(op.id, 'EN_RUTA')}
                            className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-600/40 rounded-md text-[11px] font-medium transition-colors"
                          >
                            Despachar Ruta
                          </button>
                        )}
                        {op.estado === 'EN_RUTA' && (
                          <button
                            onClick={() => {
                              setFinalizarModalData({
                                id: op.id,
                                odometroInicial: op.odometroInicial
                              });
                              setOdometroFinalInput(op.odometroInicial + 500);
                            }}
                            className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-600/40 rounded-md text-[11px] font-medium transition-colors"
                          >
                            Finalizar Entrega
                          </button>
                        )}
                        {op.estado === 'ENTREGADO' && (
                          <button
                            onClick={() => onUpdateEstado(op.id, 'LIQUIDADO')}
                            className="px-2.5 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-600/40 rounded-md text-[11px] font-medium transition-colors"
                          >
                            Liquidar
                          </button>
                        )}
                        {op.estado === 'LIQUIDADO' && (
                          <span className="text-[11px] text-slate-500 font-mono">Completada</span>
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

      {/* Modal: Nueva Programación */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-400" />
                <span>Programar Nueva Operación de Transporte</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Cancelar
              </button>
            </div>

            <form onSubmit={handleSubmitNew} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Orden de Servicio / Ref:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: OS-9014-ACEROS"
                    value={formData.ordenServicioRef}
                    onChange={e => setFormData({ ...formData, ordenServicioRef: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Fecha Programada:</label>
                  <input
                    type="date"
                    required
                    value={formData.fechaProgramada}
                    onChange={e => setFormData({ ...formData, fechaProgramada: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Ruta Maestro:</label>
                  <select
                    value={formData.rutaId}
                    onChange={e => setFormData({ ...formData, rutaId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  >
                    {rutas.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.origen} → {r.destino} ({r.distanciaKm} km)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Cliente Generador de Carga:</label>
                  <select
                    value={formData.clienteId}
                    onChange={e => setFormData({ ...formData, clienteId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  >
                    {clientes.map(cl => (
                      <option key={cl.id} value={cl.id}>
                        {cl.razonSocial} (RUC {cl.ruc})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Vehículo / Tracto:</label>
                  <select
                    value={formData.vehiculoId}
                    onChange={e => handleVehiculoChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  >
                    {vehiculos.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.placa} · {v.marca} {v.modelo} ({v.estado})
                      </option>
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
                    {conductores.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nombres} {c.apellidos} ({c.categoria} - {c.estado})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Descripción de la Carga:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Bobinas de acero corrugado / Pallets lácteos"
                    value={formData.cargaDescripcion}
                    onChange={e => setFormData({ ...formData, cargaDescripcion: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Peso en Toneladas (Tn):</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    required
                    value={formData.pesoTn}
                    onChange={e => setFormData({ ...formData, pesoTn: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Detalle Origen (Punto de Carga):</label>
                  <input
                    type="text"
                    placeholder="Ej: Muelle DP World Callao Almacén 4"
                    value={formData.origenDetalle}
                    onChange={e => setFormData({ ...formData, origenDetalle: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Detalle Destino (Punto Descarga):</label>
                  <input
                    type="text"
                    placeholder="Ej: Planta Siderúrgica Pisco Km 240"
                    value={formData.destinoDetalle}
                    onChange={e => setFormData({ ...formData, destinoDetalle: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Odómetro Inicial (Kilometraje de salida):</label>
                <input
                  type="number"
                  required
                  value={formData.odometroInicial}
                  onChange={e => setFormData({ ...formData, odometroInicial: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Observaciones / Instrucciones de Seguridad:</label>
                <textarea
                  rows={2}
                  placeholder="Instrucciones para escolta, paradas obligatorias, precintos de seguridad..."
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
                  Registrar Programación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Finalizar Entrega con Odómetro Final */}
      {finalizarModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-400" />
              <span>Confirmar Entrega de Operación</span>
            </h3>
            <p className="text-xs text-slate-400">
              Ingrese el kilometraje final del odómetro del vehículo al llegar a destino para calcular el recorrido exacto.
            </p>
            <form onSubmit={handleFinalizarSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Odómetro Inicial:</label>
                <input
                  type="text"
                  disabled
                  value={`${finalizarModalData.odometroInicial.toLocaleString()} km`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Odómetro Final al Entregar (km):</label>
                <input
                  type="number"
                  min={finalizarModalData.odometroInicial}
                  required
                  value={odometroFinalInput}
                  onChange={e => setOdometroFinalInput(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-blue-500/50 rounded-lg px-3 py-2 text-white font-mono text-sm"
                />
                <span className="text-[11px] text-emerald-400 mt-1 block">
                  Distancia recorrida calculada: {(odometroFinalInput - finalizarModalData.odometroInicial).toLocaleString()} km
                </span>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFinalizarModalData(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg"
                >
                  Confirmar Entrega
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
