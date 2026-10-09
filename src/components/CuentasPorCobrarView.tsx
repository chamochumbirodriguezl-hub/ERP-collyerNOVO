import React, { useState } from 'react';
import {
  CuentaPorCobrar,
  Cliente,
  ProgramacionOperacion,
  CobranzaAbono,
  FacturaEstado
} from '../types/erp';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  Building,
  ArrowUpRight,
  History,
  DollarSign
} from 'lucide-react';

interface CuentasPorCobrarViewProps {
  cuentas: CuentaPorCobrar[];
  clientes: Cliente[];
  operaciones: ProgramacionOperacion[];
  onAddFactura: (factura: CuentaPorCobrar) => void;
  onAddAbono: (cuentaId: string, abono: CobranzaAbono) => void;
}

export const CuentasPorCobrarView: React.FC<CuentasPorCobrarViewProps> = ({
  cuentas,
  clientes,
  operaciones,
  onAddFactura,
  onAddAbono
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('ALL');
  const [isFacturaModalOpen, setIsFacturaModalOpen] = useState(false);
  const [abonoModalData, setAbonoModalData] = useState<CuentaPorCobrar | null>(null);
  const [historialModalData, setHistorialModalData] = useState<CuentaPorCobrar | null>(null);

  // New Invoice Form
  const [facturaForm, setFacturaForm] = useState({
    clienteId: clientes[0]?.id || '',
    programacionId: '',
    tipoComprobante: 'FACTURA' as const,
    fechaEmision: new Date().toISOString().split('T')[0],
    diasCredito: 30,
    subtotal: 10000,
    observaciones: ''
  });

  // New Payment Form
  const [abonoForm, setAbonoForm] = useState({
    montoPago: 0,
    fechaPago: new Date().toISOString().split('T')[0],
    medioPago: 'TRANSFERENCIA' as const,
    numeroOperacion: '',
    banco: 'Banco de Crédito del Perú (BCP)',
    sustentoUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80'
  });

  // Calculate due date based on emission + credit days
  const handleClienteChange = (cliId: string) => {
    const c = clientes.find(item => item.id === cliId);
    setFacturaForm(prev => ({
      ...prev,
      clienteId: cliId,
      diasCredito: c ? c.diasCredito : 30
    }));
  };

  const igvCalculado = Number((Number(facturaForm.subtotal || 0) * 0.18).toFixed(2));
  const totalFacturaCalculado = Number((Number(facturaForm.subtotal || 0) + igvCalculado).toFixed(2));

  const handleCreateFactura = (e: React.FormEvent) => {
    e.preventDefault();
    const selCli = clientes.find(c => c.id === facturaForm.clienteId);
    const selOp = operaciones.find(o => o.id === facturaForm.programacionId);

    // Compute due date
    const emisionDate = new Date(facturaForm.fechaEmision);
    const vencimientoDate = new Date(emisionDate);
    vencimientoDate.setDate(vencimientoDate.getDate() + Number(facturaForm.diasCredito));
    const fechaVencimiento = vencimientoDate.toISOString().split('T')[0];

    const newFactura: CuentaPorCobrar = {
      id: `cxc-${Date.now()}`,
      codigoFactura: `F001-${String(cuentas.length + 500).padStart(6, '0')}`,
      tipoComprobante: facturaForm.tipoComprobante,
      clienteId: facturaForm.clienteId,
      clienteNombre: selCli?.razonSocial || 'Cliente General',
      clienteRuc: selCli?.ruc || '20000000000',
      programacionId: facturaForm.programacionId || undefined,
      operacionCodigo: selOp ? selOp.codigoOperacion : undefined,
      fechaEmision: facturaForm.fechaEmision,
      fechaVencimiento,
      moneda: 'PEN',
      subtotal: Number(facturaForm.subtotal),
      igv: igvCalculado,
      montoTotal: totalFacturaCalculado,
      montoCobrado: 0,
      saldoPendiente: totalFacturaCalculado,
      estado: 'EMITIDA',
      observaciones: facturaForm.observaciones,
      abonos: [],
      createdAt: new Date().toISOString()
    };

    onAddFactura(newFactura);
    setIsFacturaModalOpen(false);
  };

  const handleAbonoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!abonoModalData) return;

    const monto = Number(abonoForm.montoPago);
    if (monto <= 0) return;

    const newAbono: CobranzaAbono = {
      id: `abn-${Date.now()}`,
      cuentaCobrarId: abonoModalData.id,
      fechaPago: abonoForm.fechaPago,
      montoPago: monto,
      medioPago: abonoForm.medioPago,
      numeroOperacion: abonoForm.numeroOperacion || `OP-BCO-${Math.floor(100000 + Math.random() * 900000)}`,
      banco: abonoForm.banco,
      sustentoUrl: abonoForm.sustentoUrl,
      createdAt: new Date().toISOString()
    };

    onAddAbono(abonoModalData.id, newAbono);
    setAbonoModalData(null);
  };

  // Helper for overdue check
  const todayStr = new Date().toISOString().split('T')[0];
  const getDaysDiff = (dueDateStr: string) => {
    const due = new Date(dueDateStr).getTime();
    const today = new Date(todayStr).getTime();
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filtered = cuentas.filter(c => {
    const matchesSearch =
      c.codigoFactura.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.clienteNombre && c.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.clienteRuc && c.clienteRuc.includes(searchTerm)) ||
      (c.operacionCodigo && c.operacionCodigo.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesEstado = estadoFilter === 'ALL' || c.estado === estadoFilter;
    return matchesSearch && matchesEstado;
  });

  // KPIs
  const totalFacturado = cuentas.reduce((a, b) => a + b.montoTotal, 0);
  const totalCobrado = cuentas.reduce((a, b) => a + b.montoCobrado, 0);
  const totalPorCobrar = cuentas.reduce((a, b) => a + b.saldoPendiente, 0);
  const totalVencido = cuentas
    .filter(c => c.estado === 'VENCIDA' || (c.saldoPendiente > 0 && c.fechaVencimiento < todayStr))
    .reduce((a, b) => a + b.saldoPendiente, 0);

  return (
    <div className="space-y-6">
      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            5. Módulo de Cuentas por Cobrar & Facturación de Fletes
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitoreo de facturación electrónica SUNAT, abonos bancarios, saldos pendientes y gestión de cobranzas
          </p>
        </div>
        <button
          onClick={() => setIsFacturaModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Emitir Factura de Flete</span>
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block">Total Cartera Pendiente</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xs text-slate-400">S/</span>
            <span className="text-2xl font-bold font-mono text-amber-400">
              {totalPorCobrar.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">saldo por recuperar</span>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block">Cobranzas Recuperadas</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xs text-slate-400">S/</span>
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {totalCobrado.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {((totalCobrado / (totalFacturado || 1)) * 100).toFixed(1)}% tasa de cobranza
          </span>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block">Facturas en Mora (Vencidas)</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xs text-slate-400">S/</span>
            <span className="text-2xl font-bold font-mono text-rose-400">
              {totalVencido.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">gestión de cobranza activa</span>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block">Facturación Total Emitida</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xs text-slate-400">S/</span>
            <span className="text-2xl font-bold font-mono text-slate-100">
              {totalFacturado.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">acumulado del ciclo</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por factura F001, RUC, cliente o código de operación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-900 rounded-lg shrink-0">
          {['ALL', 'EMITIDA', 'PARCIAL', 'COBRADA', 'VENCIDA'].map((st) => (
            <button
              key={st}
              onClick={() => setEstadoFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                estadoFilter === st
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st === 'ALL' ? 'Todas' : st}
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
                <th className="py-3 px-4">Comprobante / Op</th>
                <th className="py-3 px-4">Cliente & RUC</th>
                <th className="py-3 px-4">Emisión & Vencimiento</th>
                <th className="py-3 px-4 text-right">Monto Total</th>
                <th className="py-3 px-4 text-right">Cobrado</th>
                <th className="py-3 px-4 text-right">Saldo Pendiente</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No se registran comprobantes con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const daysDiff = getDaysDiff(c.fechaVencimiento);
                  const isOverdue = c.saldoPendiente > 0 && (c.estado === 'VENCIDA' || daysDiff < 0);

                  return (
                    <tr key={c.id} className="hover:bg-slate-900/50 transition-colors">
                      {/* Invoice Code */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-semibold text-blue-400">{c.codigoFactura}</div>
                        <div className="text-[11px] text-slate-400">
                          {c.operacionCodigo ? `Flete: ${c.operacionCodigo}` : 'Flete Spot'}
                        </div>
                      </td>

                      {/* Client */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="text-slate-200 font-medium truncate">{c.clienteNombre}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          RUC {c.clienteRuc}
                        </div>
                      </td>

                      {/* Dates & Due Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono">
                        <div className="text-slate-300">Emisión: {c.fechaEmision}</div>
                        <div className="text-[11px] flex items-center gap-1.5 mt-0.5">
                          <span className={isOverdue ? 'text-rose-400 font-semibold' : 'text-slate-400'}>
                            Vence: {c.fechaVencimiento}
                          </span>
                          {c.saldoPendiente > 0 && (
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-sm ${
                                isOverdue
                                  ? 'bg-rose-950 text-rose-400 font-semibold'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {isOverdue ? `${Math.abs(daysDiff)}d mora` : `${daysDiff}d plazo`}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                        S/ {c.montoTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Amount Collected */}
                      <td className="py-3.5 px-4 text-right font-mono text-emerald-400 font-medium">
                        S/ {c.montoCobrado.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Balance Pending */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        <span className={c.saldoPendiente > 0 ? (isOverdue ? 'text-rose-400' : 'text-amber-400') : 'text-slate-500'}>
                          S/ {c.saldoPendiente.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-sm text-[11px] font-semibold tracking-wide ${
                            c.estado === 'COBRADA'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : c.estado === 'PARCIAL'
                              ? 'bg-blue-950 text-blue-400 border border-blue-800'
                              : c.estado === 'VENCIDA' || isOverdue
                              ? 'bg-rose-950 text-rose-400 border border-rose-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {c.estado}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {c.abonos && c.abonos.length > 0 && (
                            <button
                              onClick={() => setHistorialModalData(c)}
                              className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-900 rounded-md transition-colors"
                              title="Ver historial de abonos"
                            >
                              <History className="w-4 h-4" />
                            </button>
                          )}
                          {c.saldoPendiente > 0 && (
                            <button
                              onClick={() => {
                                setAbonoModalData(c);
                                setAbonoForm(prev => ({
                                  ...prev,
                                  montoPago: c.saldoPendiente
                                }));
                              }}
                              className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-600/40 rounded-md text-[11px] font-medium transition-colors"
                            >
                              Registrar Abono
                            </button>
                          )}
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

      {/* Modal: Emitir Factura */}
      {isFacturaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-400" />
                <span>Emitir Factura Electrónica de Transporte</span>
              </h3>
              <button
                onClick={() => setIsFacturaModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Cancelar
              </button>
            </div>

            <form onSubmit={handleCreateFactura} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Cliente Receptor:</label>
                  <select
                    value={facturaForm.clienteId}
                    onChange={e => handleClienteChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  >
                    {clientes.map(cl => (
                      <option key={cl.id} value={cl.id}>
                        {cl.razonSocial} (Crédito: {cl.diasCredito} días)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Operación / Servicio de Flete:</label>
                  <select
                    value={facturaForm.programacionId}
                    onChange={e => setFacturaForm({ ...facturaForm, programacionId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  >
                    <option value="">(Servicio General / Sin vincular a operación específica)</option>
                    {operaciones.map(op => (
                      <option key={op.id} value={op.id}>
                        {op.codigoOperacion} · {op.rutaNombre} ({op.pesoTn} Tn)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Fecha Emisión:</label>
                  <input
                    type="date"
                    required
                    value={facturaForm.fechaEmision}
                    onChange={e => setFacturaForm({ ...facturaForm, fechaEmision: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Días de Crédito Comercial:</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={facturaForm.diasCredito}
                    onChange={e => setFacturaForm({ ...facturaForm, diasCredito: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Tipo de Comprobante:</label>
                  <select
                    value={facturaForm.tipoComprobante}
                    onChange={e => setFacturaForm({ ...facturaForm, tipoComprobante: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  >
                    <option value="FACTURA">FACTURA ELECTRÓNICA (F001)</option>
                    <option value="BOLETA">BOLETA DE VENTA (B001)</option>
                  </select>
                </div>
              </div>

              {/* Amounts and IGV */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
                <span className="text-[11px] font-semibold text-slate-300 block uppercase tracking-wider">
                  Liquidación Tributaria SUNAT (Moneda: Soles PEN)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1">Valor Venta (Subtotal S/):</label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      value={facturaForm.subtotal}
                      onChange={e => setFacturaForm({ ...facturaForm, subtotal: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">IGV (18% S/):</label>
                    <input
                      type="text"
                      disabled
                      value={`S/ ${igvCalculado.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-400 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Importe Total Facturado:</label>
                    <input
                      type="text"
                      disabled
                      value={`S/ ${totalFacturaCalculado.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
                      className="w-full bg-slate-900 border border-emerald-500/40 rounded-lg px-3 py-2 text-emerald-400 font-mono text-sm font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Concepto / Glosa Factura:</label>
                <textarea
                  rows={2}
                  placeholder="Ej: Servicio de transporte terrestre de carga pesada según Guía de Remisión Remitente 001-XXXX..."
                  value={facturaForm.observaciones}
                  onChange={e => setFacturaForm({ ...facturaForm, observaciones: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFacturaModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg"
                >
                  Generar y Registrar Factura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Registrar Abono */}
      {abonoModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <span>Registrar Abono Bancario a Factura</span>
              </h3>
              <button
                onClick={() => setAbonoModalData(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Cancelar
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Factura:</span>
                <span className="font-mono text-blue-400 font-semibold">{abonoModalData.codigoFactura}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cliente:</span>
                <span className="text-slate-200 font-medium">{abonoModalData.clienteNombre}</span>
              </div>
              <div className="flex justify-between border-t border-slate-800/80 pt-1 mt-1">
                <span className="text-slate-400">Saldo Pendiente Actual:</span>
                <span className="font-mono text-amber-400 font-bold">
                  S/ {abonoModalData.saldoPendiente.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <form onSubmit={handleAbonoSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Monto del Abono (S/):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={abonoModalData.saldoPendiente}
                    required
                    value={abonoForm.montoPago}
                    onChange={e => setAbonoForm({ ...abonoForm, montoPago: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-emerald-500/50 rounded-lg px-3 py-2 text-white font-mono text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Fecha de Operación Bancaria:</label>
                  <input
                    type="date"
                    required
                    value={abonoForm.fechaPago}
                    onChange={e => setAbonoForm({ ...abonoForm, fechaPago: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Entidad Bancaria:</label>
                  <select
                    value={abonoForm.banco}
                    onChange={e => setAbonoForm({ ...abonoForm, banco: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  >
                    <option value="Banco de Crédito del Perú (BCP)">Banco de Crédito del Perú (BCP)</option>
                    <option value="BBVA Continental">BBVA Perú</option>
                    <option value="Interbank">Interbank</option>
                    <option value="Scotiabank Perú">Scotiabank</option>
                    <option value="Banco de la Nación">Banco de la Nación</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Medio de Pago:</label>
                  <select
                    value={abonoForm.medioPago}
                    onChange={e => setAbonoForm({ ...abonoForm, medioPago: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  >
                    <option value="TRANSFERENCIA">TRANSFERENCIA INTERBANCARIA / CCI</option>
                    <option value="DEPOSITO">DEPÓSITO EN VENTANILLA</option>
                    <option value="CHEQUE">CHEQUE DE GERENCIA</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">N° Operación Bancaria / Voucher:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: BCP-OP-9948123"
                  value={abonoForm.numeroOperacion}
                  onChange={e => setAbonoForm({ ...abonoForm, numeroOperacion: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">URL Comprobante de Transferencia (Voucher):</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={abonoForm.sustentoUrl}
                  onChange={e => setAbonoForm({ ...abonoForm, sustentoUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAbonoModalData(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg"
                >
                  Confirmar y Aplicar Abono
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Historial de Abonos */}
      {historialModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-blue-400" />
                <span>Historial de Cobranzas y Abonos Registrados</span>
              </h3>
              <button
                onClick={() => setHistorialModalData(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Cerrar
              </button>
            </div>

            <div className="text-xs space-y-1">
              <span className="text-slate-400">Factura:</span>{' '}
              <span className="font-mono text-white font-bold">{historialModalData.codigoFactura}</span> ·{' '}
              <span className="text-slate-300">{historialModalData.clienteNombre}</span>
            </div>

            <div className="divide-y divide-slate-800 max-h-60 overflow-y-auto">
              {historialModalData.abonos.map(abn => (
                <div key={abn.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-mono font-semibold text-emerald-400">
                      S/ {abn.montoPago.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {abn.banco} · {abn.medioPago}
                    </div>
                  </div>
                  <div className="text-right font-mono text-[11px]">
                    <div className="text-slate-300">{abn.numeroOperacion}</div>
                    <div className="text-slate-500">{abn.fechaPago}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setHistorialModalData(null)}
                className="px-4 py-2 bg-slate-800 text-slate-200 rounded-lg text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
