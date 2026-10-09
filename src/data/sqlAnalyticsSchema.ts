/**
 * Collyer Transport ERP - PARTE 1: SENTENCIAS SQL ADICIONALES
 * Auditoría Temporal Exacta, Flujos Financieros Automatizados y Vistas de Rentabilidad
 * Motor: PostgreSQL 14+ / Supabase / Cloud SQL / ANSI SQL
 */

export const SQL_ANALYTICS_ADDITIONS = `-- =====================================================================
-- COLLYER TRANSPORT ERP: EXTENSIÓN DE AUDITORÍA Y ANALÍTICA FINANCIERA
-- Módulo Complementario: Timestamps Exactos, Flujos y Vistas de Ranking
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. AUDITORÍA TEMPORAL EXACTA: COLUMNAS DE TIMESTAMP EXACTO (TIMESTAMPTZ)
-- ---------------------------------------------------------------------

-- Operaciones Diarias: Registro de fecha y hora exacta de creación, despacho y entrega
ALTER TABLE programacion_operaciones 
  ADD COLUMN IF NOT EXISTS fecha_hora_exacta TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS fecha_hora_salida TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fecha_hora_entrega TIMESTAMPTZ;

-- Mantenimiento: Timestamp exacto de ingreso a taller y liberación mecánica
ALTER TABLE mantenimientos 
  ADD COLUMN IF NOT EXISTS fecha_hora_exacta TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS fecha_hora_liberacion TIMESTAMPTZ;

-- Combustible: Timestamp exacto del abastecimiento en surtidor
ALTER TABLE registro_combustible 
  ADD COLUMN IF NOT EXISTS fecha_hora_exacta TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Caja Chica: Timestamp exacto del desembolso y aprobación
ALTER TABLE caja_chica_movimientos 
  ADD COLUMN IF NOT EXISTS fecha_hora_exacta TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS fecha_hora_aprobacion TIMESTAMPTZ;

-- Cuentas por Cobrar & Abonos: Timestamp exacto de facturación y transacción bancaria
ALTER TABLE cuentas_por_cobrar 
  ADD COLUMN IF NOT EXISTS fecha_hora_exacta TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE cobranzas_detalle 
  ADD COLUMN IF NOT EXISTS fecha_hora_exacta TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ---------------------------------------------------------------------
-- 2. TABLA MAESTRA DE AUDITORÍA TRANSACCIONAL UNIFICADA (EVENT SOURCING)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auditoria_transacciones_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tabla_afectada VARCHAR(50) NOT NULL,
    registro_id UUID NOT NULL,
    codigo_referencia VARCHAR(40) NOT NULL,
    accion VARCHAR(20) NOT NULL CHECK (accion IN ('INSERT', 'UPDATE', 'DELETE', 'DESPACHO', 'CIERRE')),
    usuario_responsable VARCHAR(100) NOT NULL DEFAULT 'SISTEMA_ERP',
    fecha_hora_exacta TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    ip_origen VARCHAR(45) DEFAULT '127.0.0.1'
);

CREATE INDEX IF NOT EXISTS idx_audit_fecha_hora ON auditoria_transacciones_log(fecha_hora_exacta DESC);
CREATE INDEX IF NOT EXISTS idx_audit_tabla ON auditoria_transacciones_log(tabla_afectada, registro_id);

-- ---------------------------------------------------------------------
-- 3. VISTA CONSOLIDADA: FLUJO DE CAJA Y LIQUIDEZ UNIFICADO
-- (Ingresos por cobranzas vs Egresos por Combustible, Taller y Caja Chica)
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_flujo_caja_consolidado AS
-- A. Ingresos por Cobranzas y Abonos Bancarios recibidos
SELECT 
    c.id AS movimiento_id,
    c.fecha_hora_exacta,
    DATE(c.fecha_hora_exacta) AS fecha_corte,
    'INGRESO' AS tipo_flujo,
    'COBRANZA_FLETE' AS categoria,
    'Cobranza Factura ' || f.codigo_factura AS descripcion,
    f.codigo_factura AS codigo_referencia,
    cli.razon_social AS entidad_relacionada,
    c.monto_pago AS monto,
    f.moneda,
    c.medio_pago || ' - Op: ' || c.numero_operacion AS metodo_pago,
    'CONFIRMADO' AS estado_flujo,
    c.sustento_url
FROM cobranzas_detalle c
JOIN cuentas_por_cobrar f ON c.cuenta_cobrar_id = f.id
JOIN clientes cli ON f.cliente_id = cli.id

UNION ALL

-- B. Egresos por Abastecimiento de Combustible (Diesel B5)
SELECT 
    comb.id AS movimiento_id,
    comb.fecha_hora_exacta,
    DATE(comb.fecha_hora_exacta) AS fecha_corte,
    'GASTO' AS tipo_flujo,
    'COMBUSTIBLE_DIESEL' AS categoria,
    'Diesel B5 (' || comb.galones || ' gal) - Unidad ' || v.placa AS descripcion,
    comb.codigo_vale AS codigo_referencia,
    comb.estacion_servicio AS entidad_relacionada,
    comb.costo_total AS monto,
    'PEN' AS moneda,
    'VALE_COMBUSTIBLE' AS metodo_pago,
    'AUDITADO' AS estado_flujo,
    comb.url_sustento_documentario AS sustento_url
FROM registro_combustible comb
JOIN vehiculos v ON comb.vehiculo_id = v.id

UNION ALL

-- C. Egresos por Mantenimiento y Repuestos de Flota
SELECT 
    m.id AS movimiento_id,
    m.fecha_hora_exacta,
    DATE(m.fecha_hora_exacta) AS fecha_corte,
    'GASTO' AS tipo_flujo,
    'MANTENIMIENTO_FLOTA' AS categoria,
    'Mantenimiento ' || m.tipo_mantenimiento || ' - ' || v.placa AS descripcion,
    m.codigo_mantenimiento AS codigo_referencia,
    t.razon_social AS entidad_relacionada,
    m.costo_total AS monto,
    'PEN' AS moneda,
    'FACTURA_TALLER' AS metodo_pago,
    m.estado AS estado_flujo,
    m.sustento_url
FROM mantenimientos m
JOIN vehiculos v ON m.vehiculo_id = v.id
JOIN talleres t ON m.taller_id = t.id

UNION ALL

-- D. Egresos por Caja Chica Operativa (Viáticos, Peajes, Emergencias)
SELECT 
    cch.id AS movimiento_id,
    cch.fecha_hora_exacta,
    DATE(cch.fecha_hora_exacta) AS fecha_corte,
    'GASTO' AS tipo_flujo,
    'CAJA_CHICA_' || cch.categoria_gasto AS categoria,
    cch.categoria_gasto || ' - ' || cch.beneficiario_o_proveedor AS descripcion,
    cch.codigo_gasto AS codigo_referencia,
    cch.beneficiario_o_proveedor AS entidad_relacionada,
    cch.monto,
    cch.moneda,
    cch.tipo_comprobante AS metodo_pago,
    cch.estado AS estado_flujo,
    cch.sustento_url
FROM caja_chica_movimientos cch
WHERE cch.tipo_movimiento = 'EGRESO';

-- ---------------------------------------------------------------------
-- 4. VISTA: REPORTE DE RENTABILIDAD DETALLADA POR SERVICIOS DE FLETE
-- (Compara el ingreso bruto facturado contra costos asignados)
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_rentabilidad_servicios AS
SELECT 
    op.id AS operacion_id,
    op.codigo_operacion,
    op.orden_servicio_ref,
    op.fecha_hora_exacta,
    cli.razon_social AS cliente_nombre,
    r.origen || ' → ' || r.destino AS ruta_nombre,
    v.placa AS vehiculo_placa,
    c.nombres || ' ' || c.apellidos AS conductor_nombre,
    op.peso_tn,
    op.estado AS estado_operacion,
    
    -- Ingreso facturado por el servicio
    COALESCE(cxc.monto_total, 0.00) AS ingreso_flete,
    
    -- Costo de Combustible registrado para esta operación
    COALESCE(comb.total_combustible, 0.00) AS costo_combustible,
    
    -- Costos de Peajes asignados en caja chica
    COALESCE(peajes.total_peajes, 0.00) AS costo_peajes,
    
    -- Costos de Viáticos del chofer
    COALESCE(viaticos.total_viaticos, 0.00) AS costo_viaticos,
    
    -- Otros gastos operativos de emergencia en ruta
    COALESCE(emergencias.total_emergencias, 0.00) AS costo_emergencias,
    
    -- Costo Directo Total
    (COALESCE(comb.total_combustible, 0.00) +
     COALESCE(peajes.total_peajes, 0.00) +
     COALESCE(viaticos.total_viaticos, 0.00) +
     COALESCE(emergencias.total_emergencias, 0.00)) AS costo_directo_total,
     
    -- Utilidad Neta en Soles
    (COALESCE(cxc.monto_total, 0.00) - 
     (COALESCE(comb.total_combustible, 0.00) +
      COALESCE(peajes.total_peajes, 0.00) +
      COALESCE(viaticos.total_viaticos, 0.00) +
      COALESCE(emergencias.total_emergencias, 0.00))) AS utilidad_neta_servicio,
      
    -- Margen de Rentabilidad %
    CASE 
      WHEN COALESCE(cxc.monto_total, 0.00) > 0 THEN
        ROUND(
          ((COALESCE(cxc.monto_total, 0.00) - 
            (COALESCE(comb.total_combustible, 0.00) +
             COALESCE(peajes.total_peajes, 0.00) +
             COALESCE(viaticos.total_viaticos, 0.00) +
             COALESCE(emergencias.total_emergencias, 0.00))) / cxc.monto_total * 100)::numeric, 2)
      ELSE 0.00
    END AS margen_rentabilidad_pct

FROM programacion_operaciones op
JOIN clientes cli ON op.cliente_id = cli.id
JOIN rutas r ON op.ruta_id = r.id
JOIN vehiculos v ON op.vehiculo_id = v.id
JOIN conductores c ON op.conductor_id = c.id
LEFT JOIN cuentas_por_cobrar cxc ON cxc.programacion_id = op.id

-- Subconsulta combustible por operación
LEFT JOIN (
    SELECT programacion_id, SUM(costo_total) AS total_combustible
    FROM registro_combustible
    WHERE programacion_id IS NOT NULL
    GROUP BY programacion_id
) comb ON comb.programacion_id = op.id

-- Subconsulta peajes por operación
LEFT JOIN (
    SELECT programacion_id, SUM(monto) AS total_peajes
    FROM caja_chica_movimientos
    WHERE categoria_gasto = 'PEAJES' AND programacion_id IS NOT NULL
    GROUP BY programacion_id
) peajes ON peajes.programacion_id = op.id

-- Subconsulta viáticos por operación
LEFT JOIN (
    SELECT programacion_id, SUM(monto) AS total_viaticos
    FROM caja_chica_movimientos
    WHERE categoria_gasto = 'VIATICOS' AND programacion_id IS NOT NULL
    GROUP BY programacion_id
) viaticos ON viaticos.programacion_id = op.id

-- Subconsulta repuestos/emergencias
LEFT JOIN (
    SELECT programacion_id, SUM(monto) AS total_emergencias
    FROM caja_chica_movimientos
    WHERE categoria_gasto = 'REPUESTO_EMERGENCIA' AND programacion_id IS NOT NULL
    GROUP BY programacion_id
) emergencias ON emergencias.programacion_id = op.id;

-- ---------------------------------------------------------------------
-- 5. VISTA: RANKING PRODUCTIVO Y FINANCIERO DE VEHÍCULOS
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_ranking_vehiculos AS
SELECT 
    v.id AS vehiculo_id,
    v.placa,
    v.marca || ' ' || v.modelo AS marca_modelo,
    v.estado,
    v.kilometraje_actual,
    COUNT(DISTINCT op.id) AS viajes_totales,
    COUNT(DISTINCT CASE WHEN op.estado = 'ENTREGADO' OR op.estado = 'LIQUIDADO' THEN op.id END) AS viajes_completados,
    COUNT(DISTINCT CASE WHEN op.estado = 'EN_RUTA' THEN op.id END) AS viajes_en_ruta,
    COALESCE(SUM(op.peso_tn), 0.00) AS toneladas_transportadas,
    COALESCE(SUM(cxc.monto_total), 0.00) AS facturacion_generada,
    COALESCE(comb.total_combustible, 0.00) AS gasto_combustible,
    COALESCE(mnt.total_mantenimiento, 0.00) AS gasto_mantenimiento,
    (COALESCE(comb.total_combustible, 0.00) + COALESCE(mnt.total_mantenimiento, 0.00)) AS costo_operativo_total,
    (COALESCE(SUM(cxc.monto_total), 0.00) - (COALESCE(comb.total_combustible, 0.00) + COALESCE(mnt.total_mantenimiento, 0.00))) AS margen_neto_aportado
FROM vehiculos v
LEFT JOIN programacion_operaciones op ON op.vehiculo_id = v.id
LEFT JOIN cuentas_por_cobrar cxc ON cxc.programacion_id = op.id
LEFT JOIN (
    SELECT vehiculo_id, SUM(costo_total) AS total_combustible
    FROM registro_combustible
    GROUP BY vehiculo_id
) comb ON comb.vehiculo_id = v.id
LEFT JOIN (
    SELECT vehiculo_id, SUM(costo_total) AS total_mantenimiento
    FROM mantenimientos
    GROUP BY vehiculo_id
) mnt ON mnt.vehiculo_id = v.id
GROUP BY v.id, v.placa, v.marca, v.modelo, v.estado, v.kilometraje_actual, comb.total_combustible, mnt.total_mantenimiento
ORDER BY facturacion_generada DESC;

-- ---------------------------------------------------------------------
-- 6. VISTA: RANKING OPERATIVO DE CONDUCTORES (CHOFERES)
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_ranking_conductores AS
SELECT 
    c.id AS conductor_id,
    c.nombres || ' ' || c.apellidos AS conductor_completo,
    c.dni,
    c.numero_licencia,
    c.categoria_licencia,
    c.estado AS estado_actual,
    COUNT(DISTINCT op.id) AS viajes_totales,
    COUNT(DISTINCT CASE WHEN op.estado = 'ENTREGADO' OR op.estado = 'LIQUIDADO' THEN op.id END) AS viajes_completados,
    COUNT(DISTINCT CASE WHEN op.estado = 'EN_RUTA' THEN op.id END) AS viajes_en_ruta,
    COALESCE(SUM(op.peso_tn), 0.00) AS toneladas_movilizadas,
    COALESCE(SUM(cxc.monto_total), 0.00) AS facturacion_operada,
    COALESCE(SUM(cch.monto), 0.00) AS viaticos_recibidos,
    CASE 
      WHEN COUNT(DISTINCT op.id) > 0 THEN 
        ROUND((COUNT(DISTINCT CASE WHEN op.estado IN ('ENTREGADO', 'LIQUIDADO') THEN op.id END)::numeric / COUNT(DISTINCT op.id) * 100), 1)
      ELSE 100.0
    END AS tasa_cumplimiento_pct
FROM conductores c
LEFT JOIN programacion_operaciones op ON op.conductor_id = c.id
LEFT JOIN cuentas_por_cobrar cxc ON cxc.programacion_id = op.id
LEFT JOIN caja_chica_movimientos cch ON cch.conductor_id = c.id AND cch.categoria_gasto = 'VIATICOS'
GROUP BY c.id, c.nombres, c.apellidos, c.dni, c.numero_licencia, c.categoria_licencia, c.estado
ORDER BY viajes_totales DESC, facturacion_operada DESC;
`;
