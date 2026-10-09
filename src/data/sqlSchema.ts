/**
 * Collyer Transport App - ERP Logístico
 * PARTE 1: ESQUEMA DE BASE DE DATOS RELACIONAL (POSTGRESQL / ANSI SQL)
 * 
 * Diseñado y normalizado en 3NF para operaciones de transporte de carga pesada,
 * control de flota, rendición de cuentas, abastecimiento y cobranzas.
 */

export const COLLYER_SQL_SCHEMA_DDL = `-- =====================================================================
-- COLLYER TRANSPORT ERP - ESQUEMA DE BASE DE DATOS RELACIONAL
-- Motor Objetivo: PostgreSQL 14+ / Supabase / Cloud SQL / ANSI SQL
-- Autor: Arquitectura de Software & Logística ERP
-- =====================================================================

-- Habilitar extensión UUID para identificadores seguros
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------
-- 1. TABLAS MAESTRAS (Flota, Personal, Clientes, Rutas y Talleres)
-- ---------------------------------------------------------------------

-- 1.1 Tabla: Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ruc VARCHAR(11) NOT NULL UNIQUE,
    razon_social VARCHAR(200) NOT NULL,
    nombre_contacto VARCHAR(150),
    telefono VARCHAR(20),
    email VARCHAR(120),
    direccion_fiscal TEXT,
    dias_credito INT NOT NULL DEFAULT 30 CHECK (dias_credito >= 0),
    linea_credito_pen NUMERIC(14,2) NOT NULL DEFAULT 50000.00 CHECK (linea_credito_pen >= 0),
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'BLOQUEADO', 'INACTIVO')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 1.2 Tabla: Vehículos (Tractos, Semirremolques, Furgones)
CREATE TABLE IF NOT EXISTS vehiculos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    placa VARCHAR(10) NOT NULL UNIQUE,
    marca VARCHAR(60) NOT NULL,
    modelo VARCHAR(60) NOT NULL,
    anio_fabricacion INT NOT NULL CHECK (anio_fabricacion BETWEEN 1990 AND 2035),
    configuracion_vehicular VARCHAR(10) NOT NULL DEFAULT 'T3S3', -- T3S3, C3, C2, etc.
    kilometraje_actual INT NOT NULL DEFAULT 0 CHECK (kilometraje_actual >= 0),
    capacidad_carga_tn NUMERIC(6,2) NOT NULL CHECK (capacidad_carga_tn > 0),
    estado VARCHAR(25) NOT NULL DEFAULT 'OPERATIVO' CHECK (estado IN ('OPERATIVO', 'EN_MANTENIMIENTO', 'INACTIVO')),
    soat_vencimiento DATE NOT NULL,
    rev_tecnica_vencimiento DATE NOT NULL,
    poliza_seguro VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 1.3 Tabla: Conductores / Choferes
CREATE TABLE IF NOT EXISTS conductores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dni VARCHAR(12) NOT NULL UNIQUE,
    nombres VARCHAR(80) NOT NULL,
    apellidos VARCHAR(80) NOT NULL,
    numero_licencia VARCHAR(20) NOT NULL UNIQUE,
    categoria_licencia VARCHAR(10) NOT NULL DEFAULT 'A-IIIc',
    telefono VARCHAR(20) NOT NULL,
    licencia_vencimiento DATE NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'DISPONIBLE' CHECK (estado IN ('DISPONIBLE', 'EN_RUTA', 'VACACIONES', 'SUSPENDIDO')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 1.4 Tabla: Rutas Frecuentes
CREATE TABLE IF NOT EXISTS rutas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    origen VARCHAR(100) NOT NULL,
    destino VARCHAR(100) NOT NULL,
    distancia_km INT NOT NULL CHECK (distancia_km > 0),
    peajes_estimados_pen NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (peajes_estimados_pen >= 0),
    tiempo_estimado_horas NUMERIC(5,2) NOT NULL CHECK (tiempo_estimado_horas > 0),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 1.5 Tabla: Talleres de Mantenimiento
CREATE TABLE IF NOT EXISTS talleres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ruc VARCHAR(11) NOT NULL UNIQUE,
    razon_social VARCHAR(180) NOT NULL,
    tipo VARCHAR(15) NOT NULL DEFAULT 'EXTERNO' CHECK (tipo IN ('INTERNO', 'EXTERNO')),
    contacto VARCHAR(100),
    telefono VARCHAR(20),
    direccion TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 2. MÓDULO 1: PROGRAMACIÓN DE OPERACIONES DIARIAS
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS programacion_operaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_operacion VARCHAR(30) NOT NULL UNIQUE, -- Ej: OP-2026-00102
    orden_servicio_ref VARCHAR(30),              -- Guía / O.S. de cliente
    fecha_programada DATE NOT NULL,
    hora_salida_estimada TIME,
    ruta_id UUID NOT NULL REFERENCES rutas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    vehiculo_id UUID NOT NULL REFERENCES vehiculos(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    conductor_id UUID NOT NULL REFERENCES conductores(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    carga_descripcion VARCHAR(255) NOT NULL,
    peso_tn NUMERIC(6,2) NOT NULL CHECK (peso_tn > 0),
    origen_detalle TEXT NOT NULL,
    destino_detalle TEXT NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'PROGRAMADO' 
        CHECK (estado IN ('PROGRAMADO', 'EN_RUTA', 'ENTREGADO', 'LIQUIDADO', 'ANULADO')),
    odometro_inicial INT NOT NULL CHECK (odometro_inicial >= 0),
    odometro_final INT CHECK (odometro_final IS NULL OR odometro_final >= odometro_inicial),
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 3. MÓDULO 2: REGISTRO DE MANTENIMIENTO PREVENTIVO Y CORRECTIVO
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS mantenimientos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_mantenimiento VARCHAR(30) NOT NULL UNIQUE, -- Ej: MNT-2026-0045
    vehiculo_id UUID NOT NULL REFERENCES vehiculos(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    tipo_mantenimiento VARCHAR(20) NOT NULL CHECK (tipo_mantenimiento IN ('PREVENTIVO', 'CORRECTIVO')),
    fecha_ingreso DATE NOT NULL,
    fecha_salida DATE CHECK (fecha_salida IS NULL OR fecha_salida >= fecha_ingreso),
    kilometraje_registro INT NOT NULL CHECK (kilometraje_registro >= 0),
    taller_id UUID NOT NULL REFERENCES talleres(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    descripcion_servicio TEXT NOT NULL,
    costo_repuestos NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (costo_repuestos >= 0),
    costo_mano_obra NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (costo_mano_obra >= 0),
    costo_otros NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (costo_otros >= 0),
    -- Campo calculado o garantizado por trigger/restricción
    costo_total NUMERIC(12,2) GENERATED ALWAYS AS (costo_repuestos + costo_mano_obra + costo_otros) STORED,
    factura_taller VARCHAR(50),
    sustento_url TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'EN_PROCESO' 
        CHECK (estado IN ('EN_PROCESO', 'FINALIZADO', 'OBSERVADO')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 4. MÓDULO 3: REGISTRO DE COMBUSTIBLE Y ABASTECIMIENTO DIARIO
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS registro_combustible (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_vale VARCHAR(30) NOT NULL UNIQUE, -- Ej: COMB-2026-0812
    vehiculo_id UUID NOT NULL REFERENCES vehiculos(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    conductor_id UUID NOT NULL REFERENCES conductores(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    programacion_id UUID REFERENCES programacion_operaciones(id) ON UPDATE CASCADE ON DELETE SET NULL,
    fecha_abastecimiento DATE NOT NULL,
    estacion_servicio VARCHAR(120) NOT NULL,
    tipo_combustible VARCHAR(20) NOT NULL DEFAULT 'DIESEL_B5' 
        CHECK (tipo_combustible IN ('DIESEL_B5', 'GNV', 'GLP')),
    galones NUMERIC(8,3) NOT NULL CHECK (galones > 0),
    precio_por_galon NUMERIC(8,2) NOT NULL CHECK (precio_por_galon > 0),
    -- Costo total validado
    costo_total NUMERIC(12,2) NOT NULL CHECK (costo_total > 0),
    kilometraje_odometro INT NOT NULL CHECK (kilometraje_odometro >= 0),
    rendimiento_km_galon NUMERIC(8,2) CHECK (rendimiento_km_galon IS NULL OR rendimiento_km_galon >= 0),
    numero_comprobante VARCHAR(50) NOT NULL,
    -- URL de sustento documentario (factura o ticket escaneado / PDF / S3 / Cloud Storage)
    url_sustento_documentario TEXT NOT NULL,
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 5. MÓDULO 4: CONTROL DE CAJA CHICA Y GASTOS OPERATIVOS DIARIOS
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS caja_chica_movimientos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_gasto VARCHAR(30) NOT NULL UNIQUE, -- Ej: CCH-2026-0189
    fecha_gasto DATE NOT NULL,
    tipo_movimiento VARCHAR(20) NOT NULL DEFAULT 'EGRESO' 
        CHECK (tipo_movimiento IN ('EGRESO', 'REEMBOLSO_INGRESO')),
    categoria_gasto VARCHAR(30) NOT NULL 
        CHECK (categoria_gasto IN ('VIATICOS', 'PEAJES', 'REPUESTO_EMERGENCIA', 'ALIMENTACION', 'HOSPEDAJE', 'LAVADO_ENGRASE', 'OTRO')),
    programacion_id UUID REFERENCES programacion_operaciones(id) ON UPDATE CASCADE ON DELETE SET NULL,
    vehiculo_id UUID REFERENCES vehiculos(id) ON UPDATE CASCADE ON DELETE SET NULL,
    conductor_id UUID REFERENCES conductores(id) ON UPDATE CASCADE ON DELETE SET NULL,
    monto NUMERIC(12,2) NOT NULL CHECK (monto > 0),
    moneda VARCHAR(3) NOT NULL DEFAULT 'PEN' CHECK (moneda IN ('PEN', 'USD')),
    beneficiario_o_proveedor VARCHAR(150) NOT NULL,
    tipo_comprobante VARCHAR(20) NOT NULL 
        CHECK (tipo_comprobante IN ('FACTURA', 'BOLETA', 'TICKET', 'RECIBO_INTERNO')),
    numero_comprobante VARCHAR(50) NOT NULL,
    sustento_url TEXT NOT NULL,
    observaciones TEXT,
    estado VARCHAR(25) NOT NULL DEFAULT 'PENDIENTE_RENDICION' 
        CHECK (estado IN ('PENDIENTE_RENDICION', 'APROBADO', 'RECHAZADO')),
    aprobado_por VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 6. MÓDULO 5: CUENTAS POR COBRAR (FACTURACIÓN Y COBRANZAS)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS cuentas_por_cobrar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_factura VARCHAR(30) NOT NULL UNIQUE, -- Ej: F001-000492
    tipo_comprobante VARCHAR(10) NOT NULL DEFAULT 'FACTURA' CHECK (tipo_comprobante IN ('FACTURA', 'BOLETA')),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    programacion_id UUID REFERENCES programacion_operaciones(id) ON UPDATE CASCADE ON DELETE SET NULL,
    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL CHECK (fecha_vencimiento >= fecha_emision),
    moneda VARCHAR(3) NOT NULL DEFAULT 'PEN' CHECK (moneda IN ('PEN', 'USD')),
    subtotal NUMERIC(14,2) NOT NULL CHECK (subtotal >= 0),
    igv NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (igv >= 0),
    monto_total NUMERIC(14,2) NOT NULL CHECK (monto_total > 0),
    monto_cobrado NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (monto_cobrado >= 0 AND monto_cobrado <= monto_total),
    saldo_pendiente NUMERIC(14,2) NOT NULL CHECK (saldo_pendiente >= 0),
    estado VARCHAR(15) NOT NULL DEFAULT 'EMITIDA' 
        CHECK (estado IN ('EMITIDA', 'PARCIAL', 'COBRADA', 'VENCIDA', 'ANULADA')),
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6.1 Detalle de Cobranzas / Abonos Bancarios recibidos
CREATE TABLE IF NOT EXISTS cobranzas_detalle (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cuenta_cobrar_id UUID NOT NULL REFERENCES cuentas_por_cobrar(id) ON UPDATE CASCADE ON DELETE CASCADE,
    fecha_pago DATE NOT NULL,
    monto_pago NUMERIC(14,2) NOT NULL CHECK (monto_pago > 0),
    medio_pago VARCHAR(25) NOT NULL DEFAULT 'TRANSFERENCIA' 
        CHECK (medio_pago IN ('TRANSFERENCIA', 'CHEQUE', 'DEPOSITO', 'EFECTIVO')),
    numero_operacion VARCHAR(60) NOT NULL,
    banco VARCHAR(80) NOT NULL,
    sustento_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 7. ÍNDICES DE RENDIMIENTO (Performance & Query Optimization)
-- ---------------------------------------------------------------------

-- Operaciones
CREATE INDEX idx_prog_op_fecha ON programacion_operaciones(fecha_programada DESC);
CREATE INDEX idx_prog_op_vehiculo ON programacion_operaciones(vehiculo_id);
CREATE INDEX idx_prog_op_conductor ON programacion_operaciones(conductor_id);
CREATE INDEX idx_prog_op_estado ON programacion_operaciones(estado);

-- Mantenimientos
CREATE INDEX idx_mantenimientos_vehiculo ON mantenimientos(vehiculo_id);
CREATE INDEX idx_mantenimientos_fecha ON mantenimientos(fecha_ingreso DESC);
CREATE INDEX idx_mantenimientos_estado ON mantenimientos(estado);

-- Combustible
CREATE INDEX idx_combustible_vehiculo ON registro_combustible(vehiculo_id);
CREATE INDEX idx_combustible_fecha ON registro_combustible(fecha_abastecimiento DESC);
CREATE INDEX idx_combustible_programacion ON registro_combustible(programacion_id);

-- Caja Chica
CREATE INDEX idx_caja_chica_fecha ON caja_chica_movimientos(fecha_gasto DESC);
CREATE INDEX idx_caja_chica_cat ON caja_chica_movimientos(categoria_gasto);
CREATE INDEX idx_caja_chica_prog ON caja_chica_movimientos(programacion_id);
CREATE INDEX idx_caja_chica_estado ON caja_chica_movimientos(estado);

-- Cuentas por Cobrar
CREATE INDEX idx_cxc_cliente ON cuentas_por_cobrar(cliente_id);
CREATE INDEX idx_cxc_estado ON cuentas_por_cobrar(estado);
CREATE INDEX idx_cxc_vencimiento ON cuentas_por_cobrar(fecha_vencimiento);
CREATE INDEX idx_cobranzas_cxc ON cobranzas_detalle(cuenta_cobrar_id);

-- ---------------------------------------------------------------------
-- 8. TRIGGERS Y FUNCIONES DE AUTOMATIZACIÓN DE NEGOCIO
-- ---------------------------------------------------------------------

-- Trigger 1: Actualización automática de saldo y estado en Cuentas por Cobrar al registrar un abono
CREATE OR REPLACE FUNCTION fn_actualizar_saldo_cxc()
RETURNS TRIGGER AS $$
DECLARE
    v_total_cobrado NUMERIC(14,2);
    v_monto_total NUMERIC(14,2);
    v_nuevo_saldo NUMERIC(14,2);
    v_nuevo_estado VARCHAR(15);
BEGIN
    -- Sumar todos los abonos registrados para la factura
    SELECT COALESCE(SUM(monto_pago), 0)
    INTO v_total_cobrado
    FROM cobranzas_detalle
    WHERE cuenta_cobrar_id = NEW.cuenta_cobrar_id;

    -- Obtener monto total de la factura
    SELECT monto_total
    INTO v_monto_total
    FROM cuentas_por_cobrar
    WHERE id = NEW.cuenta_cobrar_id;

    v_nuevo_saldo := v_monto_total - v_total_cobrado;

    IF v_nuevo_saldo <= 0 THEN
        v_nuevo_saldo := 0.00;
        v_nuevo_estado := 'COBRADA';
    ELSIF v_total_cobrado > 0 THEN
        v_nuevo_estado := 'PARCIAL';
    ELSE
        v_nuevo_estado := 'EMITIDA';
    END IF;

    -- Actualizar cabecera de cuenta por cobrar
    UPDATE cuentas_por_cobrar
    SET monto_cobrado = v_total_cobrado,
        saldo_pendiente = v_nuevo_saldo,
        estado = v_nuevo_estado,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.cuenta_cobrar_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actualizar_saldo_cxc
AFTER INSERT OR UPDATE OR DELETE ON cobranzas_detalle
FOR EACH ROW
EXECUTE FUNCTION fn_actualizar_saldo_cxc();

-- Trigger 2: Actualización de odómetro/kilometraje en la unidad al registrar combustible o liquidar operación
CREATE OR REPLACE FUNCTION fn_actualizar_odometro_unidad()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE vehiculos
    SET kilometraje_actual = GREATEST(kilometraje_actual, NEW.kilometraje_odometro),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.vehiculo_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actualizar_odometro_combustible
AFTER INSERT ON registro_combustible
FOR EACH ROW
EXECUTE FUNCTION fn_actualizar_odometro_unidad();
`;

export interface TableDoc {
  name: string;
  description: string;
  module: string;
  primaryKey: string;
  foreignKeys: string[];
  constraints: string[];
}

export const DATABASE_TABLES_DOCS: TableDoc[] = [
  {
    name: 'programacion_operaciones',
    module: '1. Operaciones Diarias',
    description: 'Gestión de asignaciones diarias de ruta, camión, chofer y orden de servicio con trazabilidad de odómetro inicial y final.',
    primaryKey: 'id (UUID)',
    foreignKeys: ['ruta_id -> rutas(id)', 'vehiculo_id -> vehiculos(id)', 'conductor_id -> conductores(id)', 'cliente_id -> clientes(id)'],
    constraints: ['UNIQUE(codigo_operacion)', 'CHECK (peso_tn > 0)', 'CHECK (odometro_final >= odometro_inicial)', 'CHECK (estado IN (...))']
  },
  {
    name: 'mantenimientos',
    module: '2. Mantenimiento de Flota',
    description: 'Registro de mantenimientos preventivos y correctivos discriminando costos de repuestos, mano de obra, taller y factura.',
    primaryKey: 'id (UUID)',
    foreignKeys: ['vehiculo_id -> vehiculos(id)', 'taller_id -> talleres(id)'],
    constraints: ['UNIQUE(codigo_mantenimiento)', 'GENERATED STORED costo_total', 'CHECK (costos >= 0)', 'CHECK (fecha_salida >= fecha_ingreso)']
  },
  {
    name: 'registro_combustible',
    module: '3. Combustible & Vales',
    description: 'Abastecimiento diario de combustible, galones, precio, odómetro, cálculo de rendimiento y URL obligatoria de sustento digital.',
    primaryKey: 'id (UUID)',
    foreignKeys: ['vehiculo_id -> vehiculos(id)', 'conductor_id -> conductores(id)', 'programacion_id -> programacion_operaciones(id) [opcional]'],
    constraints: ['UNIQUE(codigo_vale)', 'CHECK (galones > 0)', 'CHECK (costo_total > 0)', 'CHECK (kilometraje_odometro >= 0)']
  },
  {
    name: 'caja_chica_movimientos',
    module: '4. Caja Chica & Gastos Operativos',
    description: 'Control de egresos diarios para viáticos de choferes, peajes de ruta y repuestos de emergencia con sustento y aprobación.',
    primaryKey: 'id (UUID)',
    foreignKeys: ['programacion_id -> programacion_operaciones(id)', 'vehiculo_id -> vehiculos(id)', 'conductor_id -> conductores(id)'],
    constraints: ['UNIQUE(codigo_gasto)', 'CHECK (monto > 0)', 'CHECK (categoria_gasto IN (...))', 'CHECK (estado IN (...))']
  },
  {
    name: 'cuentas_por_cobrar',
    module: '5. Cuentas por Cobrar & Facturación',
    description: 'Facturación por servicios de flete, monitoreo de montos cobrados, saldo pendiente, vencimiento y días de mora.',
    primaryKey: 'id (UUID)',
    foreignKeys: ['cliente_id -> clientes(id)', 'programacion_id -> programacion_operaciones(id)'],
    constraints: ['UNIQUE(codigo_factura)', 'CHECK (saldo_pendiente = monto_total - monto_cobrado)', 'CHECK (fecha_vencimiento >= fecha_emision)']
  },
  {
    name: 'cobranzas_detalle',
    module: '5. Cobranzas & Abonos',
    description: 'Registro histórico de abonos bancarios (transferencias, depósitos, cheques) vinculados a la factura con recálculo automático.',
    primaryKey: 'id (UUID)',
    foreignKeys: ['cuenta_cobrar_id -> cuentas_por_cobrar(id) ON DELETE CASCADE'],
    constraints: ['CHECK (monto_pago > 0)', 'CHECK (medio_pago IN (...))']
  }
];
