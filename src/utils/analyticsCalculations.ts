import {
  ProgramacionOperacion,
  RegistroMantenimiento,
  RegistroCombustible,
  CajaChicaGasto,
  CuentaPorCobrar,
  Vehiculo,
  Conductor
} from '../types/erp';
import {
  ItemFlujoFinanciero,
  ResumenLiquidez,
  RentabilidadServicioItem,
  RankingVehiculoItem,
  RankingConductorItem,
  PeriodoFiltro
} from '../types/financialAnalytics';

// Helper: Filter by period ('DIA' | 'SEMANA' | 'MES' | 'TODO')
export function matchesPeriod(isoString: string, period: PeriodoFiltro): boolean {
  if (period === 'TODO') return true;

  const itemDate = new Date(isoString);
  const now = new Date(); // Current local/system date
  
  if (period === 'DIA') {
    return (
      itemDate.getFullYear() === now.getFullYear() &&
      itemDate.getMonth() === now.getMonth() &&
      itemDate.getDate() === now.getDate()
    );
  }

  if (period === 'SEMANA') {
    const diffTime = Math.abs(now.getTime() - itemDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }

  if (period === 'MES') {
    return (
      itemDate.getFullYear() === now.getFullYear() &&
      itemDate.getMonth() === now.getMonth()
    );
  }

  return true;
}

// 1. Build Consolidated Financial Flows with Exact Timestamps
export function buildConsolidatedFlows(
  cuentasPorCobrar: CuentaPorCobrar[],
  combustibles: RegistroCombustible[],
  mantenimientos: RegistroMantenimiento[],
  cajaChica: CajaChicaGasto[],
  period: PeriodoFiltro = 'TODO'
): { items: ItemFlujoFinanciero[]; resumen: ResumenLiquidez } {
  const items: ItemFlujoFinanciero[] = [];

  // A. Ingresos por Cobranzas y Abonos Bancarios recibidos
  cuentasPorCobrar.forEach(cxc => {
    cxc.abonos.forEach(abn => {
      const fechaHora = abn.createdAt || `${abn.fechaPago}T15:30:00Z`;
      if (matchesPeriod(fechaHora, period)) {
        items.push({
          id: `flow-ing-${abn.id}`,
          fechaHoraExacta: fechaHora,
          tipo: 'INGRESO',
          categoria: 'FLETE_COBRADO',
          categoriaLabel: 'Cobranza Flete Bancario',
          referenciaCodigo: cxc.codigoFactura,
          entidad: cxc.clienteNombre || 'Cliente',
          descripcion: `Abono ${abn.banco} (${abn.medioPago}) - Op: ${abn.numeroOperacion}`,
          monto: abn.montoPago,
          moneda: 'PEN',
          sustentoUrl: abn.sustentoUrl,
          comprobanteTipo: 'TRANSFERENCIA',
          estado: 'COBRADO'
        });
      }
    });
  });

  // B. Egresos por Combustible Diesel B5
  combustibles.forEach(comb => {
    const fechaHora = comb.createdAt || `${comb.fechaAbastecimiento}T10:00:00Z`;
    if (matchesPeriod(fechaHora, period)) {
      items.push({
        id: `flow-comb-${comb.id}`,
        fechaHoraExacta: fechaHora,
        tipo: 'GASTO',
        categoria: 'COMBUSTIBLE_DIESEL',
        categoriaLabel: 'Combustible Diesel B5',
        referenciaCodigo: comb.codigoVale,
        entidad: `${comb.estacionServicio} (Unidad: ${comb.vehiculoPlaca})`,
        descripcion: `Consumo ${comb.galones} gal @ S/ ${comb.precioPorGalon} - Odómetro: ${comb.kilometrajeOdometro} km`,
        monto: comb.costoTotal,
        moneda: 'PEN',
        sustentoUrl: comb.urlSustentoDocumentario,
        comprobanteTipo: comb.numeroComprobante,
        estado: 'AUDITADO'
      });
    }
  });

  // C. Egresos por Mantenimiento y Repuestos
  mantenimientos.forEach(mnt => {
    const fechaHora = mnt.createdAt || `${mnt.fechaIngreso}T09:00:00Z`;
    if (matchesPeriod(fechaHora, period)) {
      items.push({
        id: `flow-mnt-${mnt.id}`,
        fechaHoraExacta: fechaHora,
        tipo: 'GASTO',
        categoria: 'MANTENIMIENTO_FLOTA',
        categoriaLabel: 'Mantenimiento & Repuestos',
        referenciaCodigo: mnt.codigoMantenimiento,
        entidad: `${mnt.tallerNombre} (${mnt.vehiculoPlaca})`,
        descripcion: `${mnt.tipoMantenimiento}: ${mnt.descripcionServicio} (Repuestos S/ ${mnt.costoRepuestos} + M.O. S/ ${mnt.costoManoObra})`,
        monto: mnt.costoTotal,
        moneda: 'PEN',
        sustentoUrl: mnt.sustentoUrl,
        comprobanteTipo: mnt.facturaTaller,
        estado: mnt.estado
      });
    }
  });

  // D. Egresos por Caja Chica (Viáticos, Peajes, Emergencias)
  cajaChica.forEach(g => {
    const fechaHora = g.createdAt || `${g.fechaGasto}T12:00:00Z`;
    if (matchesPeriod(fechaHora, period)) {
      let catLabel = 'Caja Chica';
      if (g.categoriaGasto === 'PEAJES') catLabel = 'Peajes de Ruta';
      else if (g.categoriaGasto === 'VIATICOS') catLabel = 'Viáticos Chofer';
      else if (g.categoriaGasto === 'REPUESTO_EMERGENCIA') catLabel = 'Repuesto Emergencia';

      items.push({
        id: `flow-cch-${g.id}`,
        fechaHoraExacta: fechaHora,
        tipo: 'GASTO',
        categoria: `CAJA_CHICA_${g.categoriaGasto}` as any,
        categoriaLabel: catLabel,
        referenciaCodigo: g.codigoGasto,
        entidad: g.beneficiarioOProveedor,
        descripcion: `${g.observaciones || g.categoriaGasto} (${g.tipoComprobante}: ${g.numeroComprobante})`,
        monto: g.monto,
        moneda: g.moneda,
        sustentoUrl: g.sustentoUrl,
        comprobanteTipo: g.tipoComprobante,
        estado: g.estado
      });
    }
  });

  // Sort chronological descending
  items.sort((a, b) => new Date(b.fechaHoraExacta).getTime() - new Date(a.fechaHoraExacta).getTime());

  // Aggregate liquidity numbers
  const totalIngresos = items.filter(i => i.tipo === 'INGRESO').reduce((acc, curr) => acc + curr.monto, 0);
  const totalGastos = items.filter(i => i.tipo === 'GASTO').reduce((acc, curr) => acc + curr.monto, 0);
  const saldoNeto = totalIngresos - totalGastos;
  const margenOperativoPct = totalIngresos > 0 ? (saldoNeto / totalIngresos) * 100 : 0;

  const gastoCombustible = items
    .filter(i => i.categoria === 'COMBUSTIBLE_DIESEL')
    .reduce((acc, curr) => acc + curr.monto, 0);

  const gastoMantenimiento = items
    .filter(i => i.categoria === 'MANTENIMIENTO_FLOTA')
    .reduce((acc, curr) => acc + curr.monto, 0);

  const gastoCajaChica = items
    .filter(i => i.categoria.startsWith('CAJA_CHICA_'))
    .reduce((acc, curr) => acc + curr.monto, 0);

  return {
    items,
    resumen: {
      totalIngresos,
      totalGastos,
      saldoNeto,
      margenOperativoPct,
      gastoCombustible,
      gastoMantenimiento,
      gastoCajaChica
    }
  };
}

// 2. Service Profitability Report (Income vs Direct costs)
export function computeServiceProfitability(
  operaciones: ProgramacionOperacion[],
  cuentasPorCobrar: CuentaPorCobrar[],
  combustibles: RegistroCombustible[],
  cajaChica: CajaChicaGasto[],
  period: PeriodoFiltro = 'TODO'
): RentabilidadServicioItem[] {
  return operaciones
    .filter(op => matchesPeriod(op.createdAt || op.fechaProgramada, period))
    .map(op => {
      // Find matching invoice for freight income
      const invoice = cuentasPorCobrar.find(c => c.programacionId === op.id);
      // Fallback: estimate proportional invoice based on tonnage (approx 550 PEN per ton) if not invoiced yet
      const ingresoFlete = invoice ? invoice.montoTotal : (op.pesoTn * 560);

      // Match fuel logs for this operation
      const opCombustibles = combustibles.filter(
        c => c.programacionId === op.id || (c.vehiculoId === op.vehiculoId && c.fechaAbastecimiento === op.fechaProgramada)
      );
      const costoCombustible = opCombustibles.reduce((sum, item) => sum + item.costoTotal, 0);

      // Match tolls in petty cash
      const opPeajes = cajaChica.filter(
        g => (g.programacionId === op.id || g.vehiculoId === op.vehiculoId) && g.categoriaGasto === 'PEAJES'
      );
      const costoPeajes = opPeajes.reduce((sum, item) => sum + item.monto, 0);

      // Match per diems
      const opViaticos = cajaChica.filter(
        g => (g.programacionId === op.id || g.conductorId === op.conductorId) && g.categoriaGasto === 'VIATICOS'
      );
      const costoViaticos = opViaticos.reduce((sum, item) => sum + item.monto, 0);

      // Other emergency costs in route
      const opEmergencias = cajaChica.filter(
        g => (g.programacionId === op.id || g.vehiculoId === op.vehiculoId) && g.categoriaGasto === 'REPUESTO_EMERGENCIA'
      );
      const costoMantenimientoAsignado = opEmergencias.reduce((sum, item) => sum + item.monto, 0);

      const costoTotalDirecto = costoCombustible + costoPeajes + costoViaticos + costoMantenimientoAsignado;
      const utilidadNeta = ingresoFlete - costoTotalDirecto;
      const margenRentabilidadPct = ingresoFlete > 0 ? (utilidadNeta / ingresoFlete) * 100 : 0;

      return {
        operacionId: op.id,
        codigoOperacion: op.codigoOperacion,
        ordenServicioRef: op.ordenServicioRef,
        fechaHoraExacta: op.createdAt || `${op.fechaProgramada}T08:00:00Z`,
        clienteNombre: op.clienteNombre || 'Cliente General',
        rutaNombre: op.rutaNombre || 'Ruta General',
        vehiculoPlaca: op.vehiculoPlaca || 'N/A',
        conductorNombre: op.conductorNombre || 'Conductor',
        pesoTn: op.pesoTn,
        ingresoFlete,
        costoCombustible,
        costoPeajes,
        costoViaticos,
        costoMantenimientoAsignado,
        costoTotalDirecto,
        utilidadNeta,
        margenRentabilidadPct,
        estado: op.estado
      };
    })
    .sort((a, b) => b.utilidadNeta - a.utilidadNeta);
}

// 3. Vehicle Productive & Financial Rankings
export function computeVehicleRankings(
  vehiculos: Vehiculo[],
  operaciones: ProgramacionOperacion[],
  cuentasPorCobrar: CuentaPorCobrar[],
  combustibles: RegistroCombustible[],
  mantenimientos: RegistroMantenimiento[],
  period: PeriodoFiltro = 'TODO'
): RankingVehiculoItem[] {
  return vehiculos.map(veh => {
    const vehOps = operaciones.filter(
      op => op.vehiculoId === veh.id && matchesPeriod(op.createdAt || op.fechaProgramada, period)
    );
    const serviciosCompletados = vehOps.filter(o => o.estado === 'ENTREGADO' || o.estado === 'LIQUIDADO').length;
    const serviciosEnRuta = vehOps.filter(o => o.estado === 'EN_RUTA').length;
    const toneladasTransportadas = vehOps.reduce((sum, o) => sum + o.pesoTn, 0);

    // Facturación generada
    const facturacionGenerada = vehOps.reduce((sum, op) => {
      const inv = cuentasPorCobrar.find(c => c.programacionId === op.id);
      return sum + (inv ? inv.montoTotal : (op.pesoTn * 560));
    }, 0);

    // Combustible gastado por esta unidad
    const vehComb = combustibles.filter(
      c => c.vehiculoId === veh.id && matchesPeriod(c.createdAt || c.fechaAbastecimiento, period)
    );
    const gastoCombustible = vehComb.reduce((sum, item) => sum + item.costoTotal, 0);
    const galonesTotales = vehComb.reduce((sum, item) => sum + item.galones, 0);

    // Mantenimiento gastado por esta unidad
    const vehMnt = mantenimientos.filter(
      m => m.vehiculoId === veh.id && matchesPeriod(m.createdAt || m.fechaIngreso, period)
    );
    const gastoMantenimiento = vehMnt.reduce((sum, item) => sum + item.costoTotal, 0);

    const costoOperativoTotal = gastoCombustible + gastoMantenimiento;
    const margenNetoAportado = facturacionGenerada - costoOperativoTotal;

    // Kilometraje y rendimiento
    const kilometrosRecorridos = vehOps.reduce((sum, o) => {
      if (o.odometroFinal && o.odometroInicial) {
        return sum + (o.odometroFinal - o.odometroInicial);
      }
      return sum + 650;
    }, 0);

    const rendimientoKmGalon = galonesTotales > 0 ? Number((kilometrosRecorridos / galonesTotales).toFixed(2)) : 3.8;

    // Score de eficiencia compuesto (0 a 100)
    const eficienciaScore = Math.min(100, Math.max(10, Math.round(
      (serviciosCompletados * 15) + (toneladasTransportadas * 0.8) + (margenNetoAportado > 0 ? 30 : 0)
    )));

    return {
      vehiculoId: veh.id,
      placa: veh.placa,
      marcaModelo: `${veh.marca} ${veh.modelo}`,
      serviciosCompletados,
      serviciosEnRuta,
      toneladasTransportadas,
      facturacionGenerada,
      gastoCombustible,
      gastoMantenimiento,
      costoOperativoTotal,
      margenNetoAportado,
      kilometrosRecorridos,
      rendimientoKmGalon,
      eficienciaScore
    };
  }).sort((a, b) => b.facturacionGenerada - a.facturacionGenerada);
}

// 4. Driver Operational Ranking
export function computeDriverRankings(
  conductores: Conductor[],
  operaciones: ProgramacionOperacion[],
  cuentasPorCobrar: CuentaPorCobrar[],
  cajaChica: CajaChicaGasto[],
  period: PeriodoFiltro = 'TODO'
): RankingConductorItem[] {
  return conductores.map(cond => {
    const condOps = operaciones.filter(
      op => op.conductorId === cond.id && matchesPeriod(op.createdAt || op.fechaProgramada, period)
    );
    const serviciosRealizados = condOps.filter(o => o.estado === 'ENTREGADO' || o.estado === 'LIQUIDADO').length;
    const serviciosEnRuta = condOps.filter(o => o.estado === 'EN_RUTA').length;
    const toneladasMovilizadas = condOps.reduce((sum, o) => sum + o.pesoTn, 0);

    const facturacionOperada = condOps.reduce((sum, op) => {
      const inv = cuentasPorCobrar.find(c => c.programacionId === op.id);
      return sum + (inv ? inv.montoTotal : (op.pesoTn * 560));
    }, 0);

    const totalViaticosAsignados = cajaChica
      .filter(g => g.conductorId === cond.id && g.categoriaGasto === 'VIATICOS' && matchesPeriod(g.createdAt || g.fechaGasto, period))
      .reduce((sum, item) => sum + item.monto, 0);

    const tasaPuntualidadPct = condOps.length > 0 ? (serviciosRealizados / condOps.length) * 100 : 100;
    const horasEnCarretera = condOps.length * 16.5;

    return {
      conductorId: cond.id,
      nombres: cond.nombres,
      apellidos: cond.apellidos,
      licencia: cond.licencia,
      categoriaLicencia: cond.categoria,
      serviciosRealizados,
      serviciosEnRuta,
      toneladasMovilizadas,
      facturacionOperada,
      totalViaticosAsignados,
      tasaPuntualidadPct: Number(tasaPuntualidadPct.toFixed(1)),
      horasEnCarretera
    };
  }).sort((a, b) => (b.serviciosRealizados + b.serviciosEnRuta) - (a.serviciosRealizados + a.serviciosEnRuta));
}
