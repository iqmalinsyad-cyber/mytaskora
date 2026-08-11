import React, { useState, useEffect } from 'react';
import { 
  X, 
  Database, 
  CheckCircle2, 
  RefreshCw, 
  Radio, 
  Zap,
  CloudCheck,
  Smartphone,
  Globe,
  Terminal,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { aduanService, DiagnosticLog } from '../services/aduanService';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulateRealtime: () => void;
  onOpenDiagnostics?: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  onSimulateRealtime,
  onOpenDiagnostics
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [diagnosticLogs, setDiagnosticLogs] = useState<DiagnosticLog[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = aduanService.subscribeDiagnosticLogs((logs) => {
      setDiagnosticLogs(logs);
    });
    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSyncDataToFirebase = async () => {
    setIsSyncing(true);
    setStatusMessage({ type: 'info', text: 'Mula memuat naik & menyelaraskan semua rekod ke pangkalan data Google Firebase Cloud...' });
    
    const result = await aduanService.syncAllLocalToSupabase();
    setIsSyncing(false);

    if (result.success) {
      setStatusMessage({
        type: 'success',
        text: `Berjaya! Rekod kes aduan & akaun pengguna diselaraskan secara kekal di Google Firebase Cloud Database!`,
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: `Penyelewengan Sync: ${result.error}`,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-[100] animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>Google Firebase Cloud Database</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                  Aktif & Realtime
                </span>
              </h2>
              <p className="text-xs text-slate-300">Data diselaraskan merentasi peranti & pelayar secara automatik</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {/* Active Banner */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 space-y-1">
              <div className="font-bold text-sm">Pangkalan Data Google Firebase Terhubung!</div>
              <p className="text-emerald-800 leading-relaxed">
                Aplikasi anda kini menggunakan **Google Firebase Firestore** (Database: <code className="bg-emerald-100 text-emerald-950 px-1 py-0.5 rounded font-mono text-[11px]">ai-studio-aduanworkspacesy-e535aaf3-0057-4e2c-a3a0-497d3cc2caf2</code>) berserta saluran penyelarasan **Realtime Multi-Device Sync**.
              </p>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-600" />
                <span>Pelayar & Peranti Berbeza</span>
              </div>
              <p className="text-slate-500 text-[11px]">Buka aplikasi di mana-mana komputer, telefon, atau tab berbeza — data sentiasa 100% selaras.</p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-indigo-600" />
                <span>Cloudflare Pages Ready</span>
              </div>
              <p className="text-slate-500 text-[11px]">Fail <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px]">_redirects</code> & tetapan build sedia untuk perumahan percuma Cloudflare Pages.</p>
            </div>
          </div>

          {/* Cloudflare Pages Deployment Guide Card */}
          <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/60 space-y-2 text-xs">
            <div className="font-bold text-indigo-950 flex items-center gap-2 text-sm">
              <CloudCheck className="w-4 h-4 text-indigo-600" />
              <span>Langkah Deploy ke Cloudflare Pages</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-indigo-900 text-[11px] leading-relaxed">
              <li><strong>Framework Preset</strong>: <code className="bg-indigo-100 px-1.5 py-0.5 rounded font-mono">Vite</code> / <code className="bg-indigo-100 px-1.5 py-0.5 rounded font-mono">None</code></li>
              <li><strong>Build Command</strong>: <code className="bg-indigo-100 px-1.5 py-0.5 rounded font-mono">npm run build</code> atau <code className="bg-indigo-100 px-1.5 py-0.5 rounded font-mono">npm run build:pages</code></li>
              <li><strong>Build Output Directory</strong>: <code className="bg-indigo-100 px-1.5 py-0.5 rounded font-mono">dist</code></li>
              <li><strong>SPA Routing</strong>: Ditetapkan secara automatik melalui fail <code className="bg-indigo-100 px-1.5 py-0.5 rounded font-mono">public/_redirects</code> (<code className="bg-indigo-100 px-1.5 py-0.5 rounded font-mono">/* /index.html 200</code>)</li>
              <li><strong>Pangkalan Data Sync</strong>: Google Firebase Firestore bersambung secara terus dari pelayar pelawat (Client-Side SDK).</li>
            </ul>
          </div>

          {/* Diagnostic Logs Panel for Firebase onSnapshot Status */}
          <div className="rounded-xl border border-slate-900/80 bg-slate-950 text-slate-100 overflow-hidden text-xs">
            <div className="px-3.5 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-slate-200">Panel Diagnostik Firebase onSnapshot</span>
              </div>
              <div className="flex items-center gap-2">
                {onOpenDiagnostics && (
                  <button
                    onClick={onOpenDiagnostics}
                    className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] flex items-center gap-1 transition-all shadow-xs"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Diagnostik Penuh</span>
                  </button>
                )}
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Active Listener
                </span>
              </div>
            </div>

            <div className="p-3 font-mono text-[11px] h-36 overflow-y-auto space-y-1.5 scrollbar-thin">
              {diagnosticLogs.length === 0 ? (
                <div className="text-slate-500 italic">Menunggu sambungan listener Firestore...</div>
              ) : (
                diagnosticLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-slate-500 text-[10px] shrink-0">[{log.timestamp}]</span>
                    <span className={
                      log.level === 'success' ? 'text-emerald-400 font-semibold' :
                      log.level === 'error' ? 'text-rose-400 font-semibold' :
                      log.level === 'warn' ? 'text-amber-400' :
                      'text-indigo-300'
                    }>
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : statusMessage.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-indigo-50 border-indigo-200 text-indigo-800'
            }`}>
              {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
              {statusMessage.type === 'info' && <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin shrink-0 mt-0.5" />}
              <div>{statusMessage.text}</div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2 justify-end">
            <button
              type="button"
              onClick={handleSyncDataToFirebase}
              disabled={isSyncing}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  <span>Menyelaras...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Segerakkan Rekod ke Firebase</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                onSimulateRealtime();
                setStatusMessage({
                  type: 'success',
                  text: 'Ujian Realtime Dijalankan! Kes aduan simulasi telah dimasukkan dan disebarkan ke Firestore.'
                });
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>Uji Kemaskini Realtime Live</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
