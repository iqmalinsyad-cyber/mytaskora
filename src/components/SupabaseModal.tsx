import React, { useState } from 'react';
import { 
  X, 
  Database, 
  CheckCircle2, 
  RefreshCw, 
  Radio, 
  Zap,
  CloudCheck,
  Smartphone,
  Globe
} from 'lucide-react';
import { aduanService } from '../services/aduanService';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulateRealtime: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  onSimulateRealtime
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        
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
                Aplikasi anda kini menggunakan **Google Firebase Firestore** berserta saluran penyelarasan **Realtime Multi-Device Sync**. Setiap pendaftaran, perubahan status, catatan, atau aduan baharu akan dikemaskini **secara langsung (live)** di semua peranti dan pelayar lain tanpa perlu *refresh*.
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
                <span>Tanpa Kehilangan Data</span>
              </div>
              <p className="text-slate-500 text-[11px]">Segala rekod disimpan dengan selamat dalam storan Google Firebase Awan secara berterusan.</p>
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
