import React from 'react';
import { X, ExternalLink, FileText, CheckCircle2 } from 'lucide-react';

interface ReceiptViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  documentNumber: string;
  url: string;
  issuerOrCategory?: string;
  amount?: string;
}

export const ReceiptViewerModal: React.FC<ReceiptViewerModalProps> = ({
  isOpen,
  onClose,
  title,
  documentNumber,
  url,
  issuerOrCategory,
  amount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">{title}</h3>
              <p className="text-xs text-slate-400">
                Comprobante: <span className="font-mono text-slate-200">{documentNumber}</span>
                {issuerOrCategory && ` · ${issuerOrCategory}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Preview */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Sustento digital verificado en repositorio de auditoría</span>
            </div>
            {amount && (
              <div className="text-right">
                <span className="text-slate-400 mr-2">Monto auditado:</span>
                <span className="font-mono font-semibold text-slate-100">{amount}</span>
              </div>
            )}
          </div>

          <div className="bg-slate-950 rounded-lg border border-slate-800 p-2 min-h-[300px] flex flex-col items-center justify-center">
            {url.startsWith('http') ? (
              <img
                src={url}
                alt={`Sustento ${documentNumber}`}
                className="max-h-[380px] w-auto object-contain rounded-md shadow-md"
                onError={(e) => {
                  // Fallback container if URL fails
                  (e.target as HTMLElement).style.display = 'none';
                  const fallback = document.getElementById('receipt-fallback');
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              id="receipt-fallback"
              className="hidden flex-col items-center justify-center p-8 text-center text-slate-400"
            >
              <FileText className="w-12 h-12 text-slate-500 mb-3" />
              <p className="text-sm font-medium text-slate-300">Documento electrónico registrado</p>
              <p className="text-xs text-slate-500 mt-1 font-mono break-all">{url}</p>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400">Enlace directo al comprobante electrónico:</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={url}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 focus:outline-hidden"
              />
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir enlace</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors"
          >
            Cerrar visor
          </button>
        </div>
      </div>
    </div>
  );
};
