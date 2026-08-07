import React, { useState, useEffect } from 'react';
import { 
  X, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  RefreshCw, 
  Radio, 
  Zap,
  Code
} from 'lucide-react';
import { SupabaseConfig } from '../types';
import { getSavedSupabaseConfig, saveSupabaseConfig, testSupabaseConnection, SUPABASE_SQL_SCHEMA } from '../lib/supabase';
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
  const [config, setConfig] = useState<SupabaseConfig>({
    url: '',
    anonKey: '',
    isConnected: false,
  });

  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const saved = getSavedSupabaseConfig();
      setConfig(saved);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSyncDataToSupabase = async () => {
    setIsSyncing(true);
    setStatusMessage({ type: 'info', text: 'Mula memuat naik & menyelaraskan semua rekod tempatan ke pangkalan data Supabase...' });
    
    const result = await aduanService.syncAllLocalToSupabase();
    setIsSyncing(false);

    if (result.success) {
      setStatusMessage({
        type: 'success',
        text: `Berjaya! ${result.count} rekod kes aduan & data berkaitan telah disimpan kekal di Supabase!`,
      });
      aduanService.fetchFromSupabase();
    } else {
      setStatusMessage({
        type: 'error',
        text: `Penyelewengan Sync: ${result.error}. Sila pastikan anda telah menjalankan Skrip SQL di bawah pada SQL Editor Supabase anda.`,
      });
    }
  };

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setStatusMessage(null);

    const isOk = await testSupabaseConnection(config.url.trim(), config.anonKey.trim());
    setIsTesting(false);

    if (isOk) {
      const newConfig: SupabaseConfig = {
        url: config.url.trim(),
        anonKey: config.anonKey.trim(),
        isConnected: true,
        lastConnectedAt: new Date().toISOString(),
      };
      saveSupabaseConfig(newConfig);
      setConfig(newConfig);
      aduanService.setupSupabaseSubscription();

      const syncRes = await aduanService.syncAllLocalToSupabase();

      setStatusMessage({
        type: 'success',
        text: syncRes.success
          ? `Tahniah! Sambungan Supabase & Realtime aktif. ${syncRes.count} rekod tempatan telah disegerakkan secara kekal ke Supabase.`
          : 'Tahniah! Sambungan Supabase berjaya. Sila pastikan skrip SQL di bawah dipasang di Supabase SQL Editor.',
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: 'Sambungan gagal. Sila semak URL Supabase & Anon Key anda.',
      });
    }
  };

  const handleDisconnect = () => {
    const emptyConfig = { url: '', anonKey: '', isConnected: false };
    saveSupabaseConfig(emptyConfig);
    setConfig(emptyConfig);
    setStatusMessage({
      type: 'info',
      text: 'Supabase diputuskan. Sistem beralih ke mod LocalStorage Realtime Simulation.',
    });
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">Integrasi Supabase & Realtime</h3>
              <p className="text-xs text-slate-300 font-medium">Sambungkan pangkalan data Supabase secara langsung</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Status Badge */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${
            config.isConnected
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <div className="flex items-center gap-3">
              <Radio className={`w-5 h-5 ${config.isConnected ? 'text-emerald-600 animate-pulse' : 'text-amber-600'}`} />
              <div>
                <div className="font-bold">
                  {config.isConnected ? 'Status: Bersambung ke Supabase (Realtime Sync Active)' : 'Status: Mod Simpanan Tempatan LocalStorage (Realtime Simulated)'}
                </div>
                <div className="text-[11px] opacity-80 mt-0.5">
                  {config.isConnected ? `URL: ${config.url}` : 'Anda boleh memasukkan kelayakan Supabase anda di bawah.'}
                </div>
              </div>
            </div>

            {config.isConnected && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSyncDataToSupabase}
                  disabled={isSyncing}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Menyegerak...' : 'Segerak Data ke Supabase'}</span>
                </button>
                <button
                  onClick={handleDisconnect}
                  className="px-3 py-1.5 rounded-xl bg-rose-100 text-rose-700 font-bold hover:bg-rose-200 text-[11px]"
                >
                  Putuskan
                </button>
              </div>
            )}
          </div>

          {statusMessage && (
            <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              statusMessage.type === 'success' ? 'bg-emerald-100 text-emerald-800' :
              statusMessage.type === 'error' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Form Credentials */}
          <form onSubmit={handleTestAndSave} className="space-y-4">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Supabase Project URL (https://xyz.supabase.co)
              </label>
              <input
                type="url"
                required
                placeholder="https://your-project.supabase.co"
                value={config.url}
                onChange={(e) => setConfig({ ...config, url: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Supabase Anon / Public Key (eyJhbGci...)
              </label>
              <input
                type="text"
                required
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={config.anonKey}
                onChange={(e) => setConfig({ ...config, anonKey: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={onSimulateRealtime}
                className="px-3.5 py-2 rounded-lg bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 hover:bg-indigo-100 flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-indigo-600" />
                <span>Simulasi Peristiwa Realtime</span>
              </button>

              <button
                type="submit"
                disabled={isTesting}
                className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-xs"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Mengesahkan...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Uji & Sambung Supabase</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* SQL Schema Generator */}
          <div className="pt-4 border-t border-gray-100 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-gray-900">
                <Code className="w-4 h-4 text-[#0d3b2e]" />
                <span>Skrip SQL Penataan Jadual Supabase</span>
              </div>
              <button
                onClick={handleCopySql}
                className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 font-bold text-gray-700 flex items-center gap-1"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Disalin!' : 'Salin Skrip SQL'}</span>
              </button>
            </div>
            <p className="text-[11px] text-gray-400">
              Salin skrip ini dan tampal di SQL Editor projek Supabase anda untuk membina jadual <code>aduan</code>, <code>catatan_aduan</code>, dan <code>workspaces</code> secara automatik.
            </p>
            <pre className="bg-gray-900 text-emerald-300 p-3.5 rounded-2xl overflow-x-auto text-[10px] font-mono max-h-36 leading-relaxed">
              {SUPABASE_SQL_SCHEMA}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
