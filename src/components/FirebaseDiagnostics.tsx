import React, { useState, useEffect } from 'react';
import { 
  X, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Terminal, 
  ShieldAlert, 
  Database, 
  Wifi, 
  WifiOff, 
  Copy, 
  Check, 
  Play, 
  Key, 
  Globe, 
  Server, 
  Info,
  Flame
} from 'lucide-react';
import { db, isFirebaseConnected, getFirebaseConfigInfo } from '../lib/firebase';
import { aduanService, DiagnosticLog } from '../services/aduanService';
import { collection, getDocs, limit, query, doc, setDoc, deleteDoc } from 'firebase/firestore';

interface FirebaseDiagnosticsProps {
  isOpen: boolean;
  onClose: () => void;
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'testing' | 'error';

interface ParameterValidation {
  name: string;
  value: string;
  isValid: boolean;
  message: string;
}

export const FirebaseDiagnostics: React.FC<FirebaseDiagnosticsProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<DiagnosticLog[]>([]);
  const [logFilter, setLogFilter] = useState<'all' | 'error' | 'warn' | 'success' | 'info'>('all');
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [lastTestedAt, setLastTestedAt] = useState<string | null>(null);
  const [lastErrorCode, setLastErrorCode] = useState<string | null>(null);
  const [lastErrorMessage, setLastErrorMessage] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isPinging, setIsPinging] = useState(false);

  const configInfo = getFirebaseConfigInfo();

  // Validate parameters
  const validations: ParameterValidation[] = [
    {
      name: 'Project ID',
      value: configInfo.projectId || 'N/A',
      isValid: Boolean(configInfo.projectId && configInfo.projectId.length > 3),
      message: configInfo.projectId ? 'Project ID Firebase wujud' : 'Project ID tidak dijumpai',
    },
    {
      name: 'Firestore Database ID',
      value: configInfo.firestoreDatabaseId || '(default)',
      isValid: Boolean(configInfo.firestoreDatabaseId),
      message: configInfo.firestoreDatabaseId ? 'Database ID Firestore sah' : 'Menggunakan pengkalan data lalai',
    },
    {
      name: 'Firestore Instance (SDK)',
      value: configInfo.isConnected ? 'Initialized' : 'Null / Disconnected',
      isValid: configInfo.isConnected,
      message: configInfo.isConnected ? 'SDK Firestore sedia untuk permintaan' : 'Firestore gagal diinisialisasi',
    },
    {
      name: 'Realtime Listener Status',
      value: aduanService.getIsFirebaseSubscribed() ? 'Active onSnapshot' : 'Inactive',
      isValid: aduanService.getIsFirebaseSubscribed(),
      message: aduanService.getIsFirebaseSubscribed() ? 'onSnapshot sedang mendengar perubahan' : 'Subskripsi belum dimulakan',
    }
  ];

  useEffect(() => {
    if (!isOpen) return;

    // Initial check
    if (isFirebaseConnected()) {
      setStatus('connected');
    } else {
      setStatus('disconnected');
    }

    // Subscribe to diagnostic logs from aduanService
    const unsubscribe = aduanService.subscribeDiagnosticLogs((updatedLogs) => {
      setLogs(updatedLogs);
      // Auto-detect error state from logs if recent
      const recentError = updatedLogs.find(l => l.level === 'error');
      if (recentError) {
        setLastErrorMessage(recentError.message);
      }
    });

    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  // Run real-time diagnostic probe
  const runDiagnosticPing = async () => {
    setIsPinging(true);
    setStatus('testing');
    setLastErrorCode(null);
    setLastErrorMessage(null);
    const startTime = performance.now();

    aduanService.addDiagnosticLog('info', '🔬 Mula menjalankan ujian Diagnostik Realtime Firestore Ping...');

    if (!db) {
      const duration = Math.round(performance.now() - startTime);
      setLatencyMs(duration);
      setStatus('error');
      setLastErrorCode('no-firestore-instance');
      setLastErrorMessage('Firestore instance (db) is null. Sila semak konfigurasi firebase-applet-config.json.');
      aduanService.addDiagnosticLog('error', 'Ping Gagal: Instans Firestore (db) adalah null');
      setIsPinging(false);
      return;
    }

    try {
      // 1. Test Query Read
      const q = query(collection(db, 'aduan'), limit(1));
      const querySnap = await getDocs(q);
      const readLatency = Math.round(performance.now() - startTime);

      // 2. Test Write Ping Document
      const pingDocRef = doc(db, '_diagnostics', 'probe');
      const testTimestamp = new Date().toISOString();
      await setDoc(pingDocRef, { pingAt: testTimestamp, client: 'web-diagnostics' });
      const fullLatency = Math.round(performance.now() - startTime);

      // Clean up ping doc
      await deleteDoc(pingDocRef).catch(() => {});

      setLatencyMs(fullLatency);
      setStatus('connected');
      setLastTestedAt(new Date().toLocaleTimeString('ms-MY'));
      
      aduanService.addDiagnosticLog('success', `✅ Diagnostic Ping Berjaya! Read (${readLatency}ms) / Write (${fullLatency}ms). ${querySnap.size} rekod dijumpai.`);
    } catch (err: any) {
      const fullLatency = Math.round(performance.now() - startTime);
      setLatencyMs(fullLatency);
      setStatus('error');
      
      const errorCode = err?.code || 'unknown-error';
      const errorMsg = err?.message || String(err);
      
      setLastErrorCode(errorCode);
      setLastErrorMessage(errorMsg);

      aduanService.addDiagnosticLog('error', `❌ Diagnostic Ping Gagal [${errorCode}]: ${errorMsg}`);
    } finally {
      setIsPinging(false);
    }
  };

  const filteredLogs = logs.filter((l) => {
    if (logFilter === 'all') return true;
    return l.level === logFilter;
  });

  const handleCopyReport = () => {
    const reportText = `=== FIREBASE DIAGNOSTICS REPORT ===
Timestamp: ${new Date().toISOString()}
Project ID: ${configInfo.projectId}
Database ID: ${configInfo.firestoreDatabaseId}
Connected: ${status}
Latency: ${latencyMs ? `${latencyMs}ms` : 'N/A'}
Error Code: ${lastErrorCode || 'None'}
Error Message: ${lastErrorMessage || 'None'}

--- DIAGNOSTIC LOGS (${logs.length}) ---
${logs.map(l => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`).join('\n')}
`;

    navigator.clipboard.writeText(reportText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getErrorCodeDescription = (code: string | null) => {
    if (!code) return null;
    switch (code) {
      case 'permission-denied':
        return 'Hak akses ditolak oleh Firestore Security Rules (firestore.rules). Sila pastikan rule membenarkan baca/tulis.';
      case 'not-found':
        return 'Pengkalan data atau koleksi tidak dijumpai. Semak jika Database ID tersilap.';
      case 'unavailable':
        return 'Perkhidmatan Firestore tidak dapat dihubungi. Semak talian internet atau tetapan firewall/CORS.';
      case 'unauthenticated':
        return 'Pengguna tidak mempunyai sesi log masuk yang sah (Firebase Auth).';
      case 'failed-precondition':
        return 'Urusan query memerlukan Firestore Index atau mod offline berada dalam konflik.';
      case 'resource-exhausted':
        return 'Kuota Firebase Firestore telah melebihi had harian.';
      default:
        return 'Ralat spesifik Firestore ditemui. Sila semak mesej ralat penuh di panel log.';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              status === 'connected' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
              status === 'error' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
              'bg-amber-500/20 text-amber-400 border-amber-500/30'
            }`}>
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>Firebase Firestore Diagnostics</span>
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                  status === 'connected' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                  status === 'error' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                  'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {status === 'connected' ? 'Connected & Active' : status === 'error' ? 'Connection Error' : 'Testing...'}
                </span>
              </h2>
              <p className="text-xs text-slate-300">Pengesahan parameter, status penyelarasan real-time & pengesan ralat sync</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto scrollbar-thin">
          
          {/* Status Bar */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            status === 'connected' ? 'bg-emerald-50/80 border-emerald-200' :
            status === 'error' ? 'bg-rose-50/80 border-rose-200' :
            'bg-amber-50/80 border-amber-200'
          }`}>
            <div className="flex items-center gap-3">
              {status === 'connected' ? (
                <Wifi className="w-6 h-6 text-emerald-600 shrink-0" />
              ) : status === 'error' ? (
                <WifiOff className="w-6 h-6 text-rose-600 shrink-0" />
              ) : (
                <RefreshCw className="w-6 h-6 text-amber-600 animate-spin shrink-0" />
              )}
              <div>
                <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <span>
                    {status === 'connected' ? 'Sambungan Realtime Firestore Aktif' :
                     status === 'error' ? 'Sambungan Firestore Terputus / Mengalami Ralat' :
                     'Menguji Sambungan Firestore...'}
                  </span>
                  {latencyMs !== null && (
                    <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-white/80 border border-slate-200 text-slate-700">
                      ⚡ {latencyMs} ms
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  {lastTestedAt ? `Ujian terakhir dijalankan pada ${lastTestedAt}` : 'Tekan "Jalankan Ujian Diagnostic" untuk menguji sambungan live'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={runDiagnosticPing}
                disabled={isPinging}
                className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
              >
                <Play className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
                <span>{isPinging ? 'Menguji...' : 'Uji Sambungan (Ping)'}</span>
              </button>
            </div>
          </div>

          {/* Specific Error Box if present */}
          {lastErrorCode && (
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/90 text-rose-950 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-rose-900 text-sm">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                <span>Ralat Firestore Dikesan: <code className="bg-rose-100 px-1.5 py-0.5 rounded font-mono text-xs">{lastErrorCode}</code></span>
              </div>
              <p className="text-rose-800 font-mono text-[11px] bg-white/70 p-2 rounded border border-rose-200/80 break-all">
                {lastErrorMessage}
              </p>
              <div className="text-rose-900 pt-1 border-t border-rose-200/60 font-medium">
                💡 <strong>Cadangan Penyelesaian:</strong> {getErrorCodeDescription(lastErrorCode)}
              </div>
            </div>
          )}

          {/* Parameter Validation Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-indigo-500" />
              <span>Pengesahan Parameter Konfigurasi (Real-Time)</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {validations.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-start justify-between gap-2">
                  <div className="space-y-0.5 min-w-0">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-tight">{item.name}</div>
                    <div className="text-xs font-mono font-bold text-slate-800 truncate" title={item.value}>{item.value}</div>
                    <div className="text-[10px] text-slate-500">{item.message}</div>
                  </div>
                  <div className="shrink-0 mt-0.5">
                    {item.isValid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Diagnostic Logs Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-emerald-500" />
                <span>Log Diagnostik Firestore Realtime (`onSnapshot`)</span>
              </h3>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyReport}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium flex items-center gap-1 transition-colors"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{isCopied ? 'Tercopy!' : 'Salin Laporan'}</span>
                </button>
              </div>
            </div>

            {/* Log Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {(['all', 'error', 'warn', 'success', 'info'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setLogFilter(filter)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition-all ${
                    logFilter === filter
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {filter === 'all' ? 'Semua Log' : filter}
                </button>
              ))}
            </div>

            {/* Terminal Window */}
            <div className="rounded-xl border border-slate-900 bg-slate-950 text-slate-100 overflow-hidden font-mono text-[11px]">
              <div className="px-3.5 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-slate-400 text-[10px]">
                <span>firestore_listener.log</span>
                <span>{filteredLogs.length} entri</span>
              </div>

              <div className="p-3.5 h-44 overflow-y-auto space-y-1.5 scrollbar-thin">
                {filteredLogs.length === 0 ? (
                  <div className="text-slate-500 italic">Tiada log diagnostik direkodkan untuk penapis ini.</div>
                ) : (
                  filteredLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-2 leading-relaxed border-b border-slate-900/60 pb-1 last:border-0">
                      <span className="text-slate-500 text-[10px] shrink-0">[{log.timestamp}]</span>
                      <span className={`text-[10px] font-bold uppercase px-1 rounded shrink-0 ${
                        log.level === 'error' ? 'bg-rose-500/20 text-rose-400' :
                        log.level === 'warn' ? 'bg-amber-500/20 text-amber-400' :
                        log.level === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                        'bg-indigo-500/20 text-indigo-300'
                      }`}>
                        {log.level}
                      </span>
                      <span className={
                        log.level === 'success' ? 'text-emerald-300' :
                        log.level === 'error' ? 'text-rose-300' :
                        log.level === 'warn' ? 'text-amber-300' :
                        'text-slate-300'
                      }>
                        {log.message}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Quick Troubleshooting Guide */}
          <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 space-y-2 text-xs">
            <div className="font-bold text-indigo-950 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-indigo-600" />
              <span>Garis Panduan Menyelesaikan Masalah Sync:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-indigo-900 text-[11px] leading-relaxed">
              <li>Jika status menunjukkan <strong className="text-rose-700">permission-denied</strong>: Firestore Rules perlu disemak untuk membenarkan `allow read, write: if true;` semasa fasa pembangunan.</li>
              <li>Jika data tidak muncul di pelayar kedua: Pastikan kedua-dua peranti menggunakan Database ID yang sama (<code className="bg-indigo-100 text-indigo-950 px-1 rounded font-mono">{configInfo.firestoreDatabaseId}</code>).</li>
              <li>Jika menggunakan perumahan Cloudflare Pages / Static Hosting: `onSnapshot` berkomunikasi secara terus melalui Firebase Web WebSocket Client SDK tanpa bergantung pada backend node.js.</li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span>Firebase SDK v10.x Web Channel</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition-colors"
          >
            Tutup Panel Diagnostik
          </button>
        </div>

      </div>
    </div>
  );
};
