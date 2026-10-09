import React from 'react';
import { Truck, Database, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenQuickNew?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
      {/* Zone 1: Single text element wordmark */}
      <div 
        onClick={() => setActiveTab('dashboard')}
        className="flex items-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0 group"
      >
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs group-hover:bg-blue-500 transition-colors">
          <Truck className="w-4 h-4" />
        </div>
        <div>
          <span className="text-base font-bold tracking-tight text-white block leading-tight">
            Collyer Transport
          </span>
          <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
            ERP Logístico
          </span>
        </div>
      </div>

      {/* Zone 2: 4–5 concise single-line nav links */}
      <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
        <button
          onClick={() => setActiveTab('operaciones')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 ${
            activeTab === 'operaciones' ? 'text-blue-400 font-semibold border-b-2 border-blue-500' : ''
          }`}
        >
          Operaciones
        </button>
        <button
          onClick={() => setActiveTab('flujos')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 ${
            activeTab === 'flujos' ? 'text-blue-400 font-semibold border-b-2 border-blue-500' : ''
          }`}
        >
          Flujos & Liquidez
        </button>
        <button
          onClick={() => setActiveTab('analitica')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 ${
            activeTab === 'analitica' ? 'text-blue-400 font-semibold border-b-2 border-blue-500' : ''
          }`}
        >
          Rentabilidad & Rankings
        </button>
        <button
          onClick={() => setActiveTab('combustible')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 ${
            activeTab === 'combustible' ? 'text-blue-400 font-semibold border-b-2 border-blue-500' : ''
          }`}
        >
          Combustible
        </button>
        <button
          onClick={() => setActiveTab('cuentasporcobrar')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 ${
            activeTab === 'cuentasporcobrar' ? 'text-blue-400 font-semibold border-b-2 border-blue-500' : ''
          }`}
        >
          Cuentas por Cobrar
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => setActiveTab('sqlschema')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'sqlschema'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-blue-400" />
          <span>Esquema SQL (Parte 1)</span>
        </button>
      </div>
    </header>
  );
};
