/**
 * Collyer Transport ERP - Tipos para Flujos Financieros, Auditoría Temporal y Analítica de Rentabilidad
 */

export type PeriodoFiltro = 'DIA' | 'SEMANA' | 'MES' | 'TODO';

export type TipoFlujo = 'INGRESO' | 'GASTO';

export type CategoriaFlujo = 
  | 'FLETE_COBRADO' 
  | 'FACTURA_EMITIDA'
  | 'COMBUSTIBLE_DIESEL'
  | 'MANTENIMIENTO_FLOTA'
  | 'CAJA_CHICA_VIATICOS'
  | 'CAJA_CHICA_PEAJES'
  | 'CAJA_CHICA_EMERGENCIA'
  | 'CAJA_CHICA_OTROS';

export interface ItemFlujoFinanciero {
  id: string;
  fechaHoraExacta: string; // ISO 8601 con hora:minuto:segundo
  tipo: TipoFlujo;
  categoria: CategoriaFlujo;
  categoriaLabel: string;
  referenciaCodigo: string; // F001-XXXX, COMB-XXXX, MNT-XXXX, CCH-XXXX
  entidad: string; // Cliente, Chofer, Grifo o Taller
  descripcion: string;
  monto: number;
  moneda: 'PEN' | 'USD';
  sustentoUrl?: string;
  comprobanteTipo?: string;
  estado: string;
}

export interface ResumenLiquidez {
  totalIngresos: number;
  totalGastos: number;
  saldoNeto: number;
  margenOperativoPct: number;
  gastoCombustible: number;
  gastoMantenimiento: number;
  gastoCajaChica: number;
}

export interface RentabilidadServicioItem {
  operacionId: string;
  codigoOperacion: string;
  ordenServicioRef: string;
  fechaHoraExacta: string;
  clienteNombre: string;
  rutaNombre: string;
  vehiculoPlaca: string;
  conductorNombre: string;
  pesoTn: number;
  // Finanzas
  ingresoFlete: number;
  costoCombustible: number;
  costoPeajes: number;
  costoViaticos: number;
  costoMantenimientoAsignado: number;
  costoTotalDirecto: number;
  utilidadNeta: number;
  margenRentabilidadPct: number;
  estado: string;
}

export interface RankingVehiculoItem {
  vehiculoId: string;
  placa: string;
  marcaModelo: string;
  serviciosCompletados: number;
  serviciosEnRuta: number;
  toneladasTransportadas: number;
  facturacionGenerada: number;
  gastoCombustible: number;
  gastoMantenimiento: number;
  costoOperativoTotal: number;
  margenNetoAportado: number;
  kilometrosRecorridos: number;
  rendimientoKmGalon: number;
  eficienciaScore: number;
}

export interface RankingConductorItem {
  conductorId: string;
  nombres: string;
  apellidos: string;
  licencia: string;
  categoriaLicencia: string;
  serviciosRealizados: number;
  serviciosEnRuta: number;
  toneladasMovilizadas: number;
  facturacionOperada: number;
  totalViaticosAsignados: number;
  tasaPuntualidadPct: number;
  horasEnCarretera: number;
}
