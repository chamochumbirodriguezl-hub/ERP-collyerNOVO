export type OperacionEstado = 'PROGRAMADO' | 'EN_RUTA' | 'ENTREGADO' | 'LIQUIDADO' | 'ANULADO';

export type MantenimientoTipo = 'PREVENTIVO' | 'CORRECTIVO';
export type MantenimientoEstado = 'EN_PROCESO' | 'FINALIZADO' | 'OBSERVADO';

export type CombustibleTipo = 'DIESEL_B5' | 'GNV' | 'GLP';

export type GastoCategoria = 'VIATICOS' | 'PEAJES' | 'REPUESTO_EMERGENCIA' | 'ALIMENTACION' | 'HOSPEDAJE' | 'LAVADO_ENGRASE' | 'OTRO';
export type GastoEstado = 'PENDIENTE_RENDICION' | 'APROBADO' | 'RECHAZADO';
export type ComprobanteTipo = 'FACTURA' | 'BOLETA' | 'TICKET' | 'RECIBO_INTERNO';

export type FacturaEstado = 'EMITIDA' | 'PARCIAL' | 'COBRADA' | 'VENCIDA' | 'ANULADA';
export type MonedaTipo = 'PEN' | 'USD';

export interface Vehiculo {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  configuracion: string; // Ej: T3S3, C3, etc.
  kilometrajeActual: number;
  capacidadCargaTn: number;
  estado: 'OPERATIVO' | 'EN_MANTENIMIENTO' | 'INACTIVO';
  soatVencimiento: string;
  revTecnicaVencimiento: string;
}

export interface Conductor {
  id: string;
  nombres: string;
  apellidos: string;
  dni: string;
  licencia: string;
  categoria: string;
  telefono: string;
  estado: 'DISPONIBLE' | 'EN_RUTA' | 'VACACIONES' | 'SUSPENDIDO';
  licenciaVencimiento: string;
}

export interface Cliente {
  id: string;
  ruc: string;
  razonSocial: string;
  contacto: string;
  telefono: string;
  email: string;
  diasCredito: number;
  lineaCreditoPEN: number;
}

export interface Ruta {
  id: string;
  origen: string;
  destino: string;
  distanciaKm: number;
  peajesEstimadosPEN: number;
  tiempoEstimadoHoras: number;
}

export interface Taller {
  id: string;
  razonSocial: string;
  ruc: string;
  tipo: 'INTERNO' | 'EXTERNO';
  contacto: string;
  telefono: string;
  direccion: string;
}

// 1. Programación de operaciones diarias
export interface ProgramacionOperacion {
  id: string;
  codigoOperacion: string; // Ej: OP-2026-0842
  ordenServicioRef: string; // Ej: OS-9912
  fechaProgramada: string;
  rutaId: string;
  rutaNombre?: string;
  vehiculoId: string;
  vehiculoPlaca?: string;
  conductorId: string;
  conductorNombre?: string;
  clienteId: string;
  clienteNombre?: string;
  cargaDescripcion: string;
  pesoTn: number;
  origenDetalle: string;
  destinoDetalle: string;
  estado: OperacionEstado;
  odometroInicial: number;
  odometroFinal?: number;
  observaciones?: string;
  createdAt: string;
}

// 2. Registro diario de mantenimiento preventivo y correctivo
export interface RegistroMantenimiento {
  id: string;
  codigoMantenimiento: string; // Ej: MNT-2026-0154
  vehiculoId: string;
  vehiculoPlaca?: string;
  tipoMantenimiento: MantenimientoTipo;
  fechaIngreso: string;
  fechaSalida?: string;
  kilometrajeRegistro: number;
  tallerId: string;
  tallerNombre?: string;
  descripcionServicio: string;
  costoRepuestos: number;
  costoManoObra: number;
  costoOtros: number;
  costoTotal: number; // repuestos + mano de obra + otros
  facturaTaller?: string;
  estado: MantenimientoEstado;
  sustentoUrl?: string;
  createdAt: string;
}

// 3. Registro de combustible y abastecimiento diario
export interface RegistroCombustible {
  id: string;
  codigoVale: string; // Ej: COMB-2026-0521
  vehiculoId: string;
  vehiculoPlaca?: string;
  conductorId: string;
  conductorNombre?: string;
  programacionId?: string;
  operacionCodigo?: string;
  fechaAbastecimiento: string;
  estacionServicio: string;
  tipoCombustible: CombustibleTipo;
  galones: number;
  precioPorGalon: number;
  costoTotal: number; // galones * precioPorGalon
  kilometrajeOdometro: number;
  rendimientoKmGalon?: number;
  numeroComprobante: string;
  urlSustentoDocumentario: string; // URL de ticket, factura o comprobante
  observaciones?: string;
  createdAt: string;
}

// 4. Control de Caja Chica y gastos operativos diarios
export interface CajaChicaGasto {
  id: string;
  codigoGasto: string; // Ej: CCH-2026-0319
  fechaGasto: string;
  tipoMovimiento: 'EGRESO' | 'REEMBOLSO_INGRESO';
  categoriaGasto: GastoCategoria;
  programacionId?: string;
  operacionCodigo?: string;
  vehiculoId?: string;
  vehiculoPlaca?: string;
  conductorId?: string;
  conductorNombre?: string;
  monto: number;
  moneda: MonedaTipo;
  beneficiarioOProveedor: string;
  tipoComprobante: ComprobanteTipo;
  numeroComprobante: string;
  sustentoUrl: string;
  observaciones?: string;
  estado: GastoEstado;
  aprobadoPor?: string;
  createdAt: string;
}

// 5. Módulo de Cuentas por Cobrar
export interface CobranzaAbono {
  id: string;
  cuentaCobrarId: string;
  fechaPago: string;
  montoPago: number;
  medioPago: 'TRANSFERENCIA' | 'CHEQUE' | 'DEPOSITO' | 'EFECTIVO';
  numeroOperacion: string;
  banco: string;
  sustentoUrl?: string;
  createdAt: string;
}

export interface CuentaPorCobrar {
  id: string;
  codigoFactura: string; // Ej: F001-000452
  tipoComprobante: 'FACTURA' | 'BOLETA';
  clienteId: string;
  clienteNombre?: string;
  clienteRuc?: string;
  programacionId?: string;
  operacionCodigo?: string;
  fechaEmision: string;
  fechaVencimiento: string;
  moneda: MonedaTipo;
  subtotal: number;
  igv: number;
  montoTotal: number;
  montoCobrado: number;
  saldoPendiente: number; // montoTotal - montoCobrado
  estado: FacturaEstado;
  observaciones?: string;
  abonos: CobranzaAbono[];
  createdAt: string;
}

export interface ResumenFinanciero {
  totalPorCobrarPEN: number;
  totalVencidoPEN: number;
  totalCobradoMesPEN: number;
  totalGastoCombustibleMesPEN: number;
  totalGastoMantenimientoMesPEN: number;
  totalCajaChicaGastosMesPEN: number;
  operacionesActivas: number;
  unidadesEnMantenimiento: number;
}
