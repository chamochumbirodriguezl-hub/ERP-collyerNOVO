import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardOverview } from './components/DashboardOverview';
import { OperacionesView } from './components/OperacionesView';
import { MantenimientoView } from './components/MantenimientoView';
import { CombustibleView } from './components/CombustibleView';
import { CajaChicaView } from './components/CajaChicaView';
import { CuentasPorCobrarView } from './components/CuentasPorCobrarView';
import { SqlSchemaView } from './components/SqlSchemaView';
import { FlujosFinancierosView } from './components/financial/FlujosFinancierosView';
import { AnaliticaRentabilidadView } from './components/analytics/AnaliticaRentabilidadView';

import {
  INITIAL_VEHICULOS,
  INITIAL_CONDUCTORES,
  INITIAL_CLIENTES,
  INITIAL_RUTAS,
  INITIAL_TALLERES,
  INITIAL_OPERACIONES,
  INITIAL_MANTENIMIENTOS,
  INITIAL_COMBUSTIBLE,
  INITIAL_CAJA_CHICA,
  INITIAL_CUENTAS_POR_COBRAR
} from './data/mockData';

import {
  ProgramacionOperacion,
  RegistroMantenimiento,
  RegistroCombustible,
  CajaChicaGasto,
  CuentaPorCobrar,
  CobranzaAbono,
  OperacionEstado,
  MantenimientoEstado,
  GastoEstado
} from './types/erp';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Operational State with localStorage persistence
  const [vehiculos, setVehiculos] = useState(() => {
    const saved = localStorage.getItem('collyer_vehiculos');
    return saved ? JSON.parse(saved) : INITIAL_VEHICULOS;
  });

  const [conductores, setConductores] = useState(() => {
    const saved = localStorage.getItem('collyer_conductores');
    return saved ? JSON.parse(saved) : INITIAL_CONDUCTORES;
  });

  const [clientes] = useState(INITIAL_CLIENTES);
  const [rutas] = useState(INITIAL_RUTAS);
  const [talleres] = useState(INITIAL_TALLERES);

  // Módulo 1: Operaciones
  const [operaciones, setOperaciones] = useState<ProgramacionOperacion[]>(() => {
    const saved = localStorage.getItem('collyer_operaciones');
    return saved ? JSON.parse(saved) : INITIAL_OPERACIONES;
  });

  // Módulo 2: Mantenimientos
  const [mantenimientos, setMantenimientos] = useState<RegistroMantenimiento[]>(() => {
    const saved = localStorage.getItem('collyer_mantenimientos');
    return saved ? JSON.parse(saved) : INITIAL_MANTENIMIENTOS;
  });

  // Módulo 3: Combustible
  const [combustibles, setCombustibles] = useState<RegistroCombustible[]>(() => {
    const saved = localStorage.getItem('collyer_combustibles');
    return saved ? JSON.parse(saved) : INITIAL_COMBUSTIBLE;
  });

  // Módulo 4: Caja Chica
  const [cajaChica, setCajaChica] = useState<CajaChicaGasto[]>(() => {
    const saved = localStorage.getItem('collyer_cajachica');
    return saved ? JSON.parse(saved) : INITIAL_CAJA_CHICA;
  });

  // Módulo 5: Cuentas por Cobrar
  const [cuentasPorCobrar, setCuentasPorCobrar] = useState<CuentaPorCobrar[]>(() => {
    const saved = localStorage.getItem('collyer_cxc');
    return saved ? JSON.parse(saved) : INITIAL_CUENTAS_POR_COBRAR;
  });

  // Save to LocalStorage on updates
  useEffect(() => {
    localStorage.setItem('collyer_operaciones', JSON.stringify(operaciones));
  }, [operaciones]);

  useEffect(() => {
    localStorage.setItem('collyer_mantenimientos', JSON.stringify(mantenimientos));
  }, [mantenimientos]);

  useEffect(() => {
    localStorage.setItem('collyer_combustibles', JSON.stringify(combustibles));
  }, [combustibles]);

  useEffect(() => {
    localStorage.setItem('collyer_cajachica', JSON.stringify(cajaChica));
  }, [cajaChica]);

  useEffect(() => {
    localStorage.setItem('collyer_cxc', JSON.stringify(cuentasPorCobrar));
  }, [cuentasPorCobrar]);

  useEffect(() => {
    localStorage.setItem('collyer_vehiculos', JSON.stringify(vehiculos));
  }, [vehiculos]);

  // Handler: Add Operation
  const handleAddOperacion = (newOp: ProgramacionOperacion) => {
    setOperaciones(prev => [newOp, ...prev]);
  };

  // Handler: Update Operation Status
  const handleUpdateOperacionEstado = (id: string, nuevoEstado: OperacionEstado, odometroFinal?: number) => {
    setOperaciones(prev =>
      prev.map(op => {
        if (op.id === id) {
          return {
            ...op,
            estado: nuevoEstado,
            odometroFinal: odometroFinal !== undefined ? odometroFinal : op.odometroFinal
          };
        }
        return op;
      })
    );

    // If completed and odometer provided, update vehicle
    if (odometroFinal !== undefined) {
      const op = operaciones.find(o => o.id === id);
      if (op) {
        setVehiculos((prev: any[]) =>
          prev.map((v: any) =>
            v.id === op.vehiculoId
              ? { ...v, kilometrajeActual: Math.max(v.kilometrajeActual, odometroFinal) }
              : v
          )
        );
      }
    }
  };

  // Handler: Add Maintenance
  const handleAddMantenimiento = (newMnt: RegistroMantenimiento) => {
    setMantenimientos(prev => [newMnt, ...prev]);
    // Set vehicle status to EN_MANTENIMIENTO
    setVehiculos((prev: any[]) =>
      prev.map((v: any) =>
        v.id === newMnt.vehiculoId ? { ...v, estado: 'EN_MANTENIMIENTO' } : v
      )
    );
  };

  // Handler: Update Maintenance Status
  const handleUpdateEstadoMantenimiento = (
    id: string,
    nuevoEstado: MantenimientoEstado,
    fechaSalida?: string
  ) => {
    const target = mantenimientos.find(m => m.id === id);
    setMantenimientos(prev =>
      prev.map(m =>
        m.id === id
          ? {
              ...m,
              estado: nuevoEstado,
              fechaSalida: fechaSalida || m.fechaSalida
            }
          : m
      )
    );

    // If finalized, return vehicle to OPERATIVO
    if (target && nuevoEstado === 'FINALIZADO') {
      setVehiculos((prev: any[]) =>
        prev.map((v: any) =>
          v.id === target.vehiculoId ? { ...v, estado: 'OPERATIVO' } : v
        )
      );
    }
  };

  // Handler: Add Fuel
  const handleAddCombustible = (newComb: RegistroCombustible) => {
    setCombustibles(prev => [newComb, ...prev]);
    // Update vehicle's odometer
    setVehiculos((prev: any[]) =>
      prev.map((v: any) =>
        v.id === newComb.vehiculoId
          ? { ...v, kilometrajeActual: Math.max(v.kilometrajeActual, newComb.kilometrajeOdometro) }
          : v
      )
    );
  };

  // Handler: Add Petty Cash
  const handleAddGasto = (newGasto: CajaChicaGasto) => {
    setCajaChica(prev => [newGasto, ...prev]);
  };

  // Handler: Update Petty Cash Status
  const handleUpdateEstadoGasto = (id: string, nuevoEstado: GastoEstado, aprobadoPor?: string) => {
    setCajaChica(prev =>
      prev.map(g =>
        g.id === id
          ? {
              ...g,
              estado: nuevoEstado,
              aprobadoPor: aprobadoPor || g.aprobadoPor
            }
          : g
      )
    );
  };

  // Handler: Add Invoice
  const handleAddFactura = (newFactura: CuentaPorCobrar) => {
    setCuentasPorCobrar(prev => [newFactura, ...prev]);
  };

  // Handler: Add Payment to Invoice
  const handleAddAbono = (cuentaId: string, abono: CobranzaAbono) => {
    setCuentasPorCobrar(prev =>
      prev.map(c => {
        if (c.id === cuentaId) {
          const nuevosAbonos = [...c.abonos, abono];
          const totalAbonado = nuevosAbonos.reduce((sum, item) => sum + item.montoPago, 0);
          const nuevoSaldo = Math.max(0, c.montoTotal - totalAbonado);
          const nuevoEstado = nuevoSaldo === 0 ? 'COBRADA' : totalAbonado > 0 ? 'PARCIAL' : c.estado;

          return {
            ...c,
            abonos: nuevosAbonos,
            montoCobrado: totalAbonado,
            saldoPendiente: nuevoSaldo,
            estado: nuevoEstado
          };
        }
        return c;
      })
    );
  };

  // Sidebar counters
  const sidebarStats = {
    operacionesActivas: operaciones.filter(o => o.estado === 'EN_RUTA').length,
    mantenimientosPendientes: mantenimientos.filter(m => m.estado === 'EN_PROCESO').length,
    cajaChicaPendientes: cajaChica.filter(g => g.estado === 'PENDIENTE_RENDICION').length,
    facturasVencidas: cuentasPorCobrar.filter(c => c.estado === 'VENCIDA').length
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Bar Header strictly conforming to 3-zone Top Bar Contract */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Workspace: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          stats={sidebarStats}
        />

        {/* Dynamic Content Viewport */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-900/95">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardOverview
                operaciones={operaciones}
                mantenimientos={mantenimientos}
                combustibles={combustibles}
                cajaChica={cajaChica}
                cuentasPorCobrar={cuentasPorCobrar}
                vehiculos={vehiculos}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === 'flujos' && (
              <FlujosFinancierosView
                cuentasPorCobrar={cuentasPorCobrar}
                combustibles={combustibles}
                mantenimientos={mantenimientos}
                cajaChica={cajaChica}
              />
            )}

            {activeTab === 'analitica' && (
              <AnaliticaRentabilidadView
                operaciones={operaciones}
                cuentasPorCobrar={cuentasPorCobrar}
                combustibles={combustibles}
                mantenimientos={mantenimientos}
                cajaChica={cajaChica}
                vehiculos={vehiculos}
                conductores={conductores}
              />
            )}

            {activeTab === 'operaciones' && (
              <OperacionesView
                operaciones={operaciones}
                vehiculos={vehiculos}
                conductores={conductores}
                clientes={clientes}
                rutas={rutas}
                onAddOperacion={handleAddOperacion}
                onUpdateEstado={handleUpdateOperacionEstado}
              />
            )}

            {activeTab === 'mantenimiento' && (
              <MantenimientoView
                mantenimientos={mantenimientos}
                vehiculos={vehiculos}
                talleres={talleres}
                onAddMantenimiento={handleAddMantenimiento}
                onUpdateEstadoMantenimiento={handleUpdateEstadoMantenimiento}
              />
            )}

            {activeTab === 'combustible' && (
              <CombustibleView
                combustibles={combustibles}
                vehiculos={vehiculos}
                conductores={conductores}
                operaciones={operaciones}
                onAddCombustible={handleAddCombustible}
              />
            )}

            {activeTab === 'cajachica' && (
              <CajaChicaView
                gastos={cajaChica}
                vehiculos={vehiculos}
                conductores={conductores}
                operaciones={operaciones}
                onAddGasto={handleAddGasto}
                onUpdateEstadoGasto={handleUpdateEstadoGasto}
              />
            )}

            {activeTab === 'cuentasporcobrar' && (
              <CuentasPorCobrarView
                cuentas={cuentasPorCobrar}
                clientes={clientes}
                operaciones={operaciones}
                onAddFactura={handleAddFactura}
                onAddAbono={handleAddAbono}
              />
            )}

            {activeTab === 'sqlschema' && (
              <SqlSchemaView />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
