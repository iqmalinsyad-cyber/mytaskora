import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Copy, 
  Check, 
  CheckSquare, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Layers, 
  Sparkles, 
  User, 
  Tag, 
  ListFilter,
  FileText,
  Loader2
} from 'lucide-react';
import { TaskItem, TaskStatus } from '../types';
import { printTaskReport } from '../utils/printUtils';

interface TaskReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  workspaceName?: string;
}

export const TaskReportModal: React.FC<TaskReportModalProps> = ({
  isOpen,
  onClose,
  tasks,
  workspaceName = 'Pengurusan Task',
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTempoh, setFilterTempoh] = useState<string>('all');
  const [copied, setCopied] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  if (!isOpen) return null;

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterTempoh === 'Ada' && t.adaTempoh !== 'Ada') return false;
    if (filterTempoh === 'Tiada' && t.adaTempoh !== 'Tiada') return false;
    return true;
  });

  // KPI Calculations
  const total = filteredTasks.length;
  const dalamProsesCount = filteredTasks.filter((t) => t.status === 'Dalam Proses').length;
  const selesaiCount = filteredTasks.filter((t) => t.status === 'Selesai').length;
  const batalCount = filteredTasks.filter((t) => t.status === 'Batal').length;

  const adaTempohCount = filteredTasks.filter((t) => t.adaTempoh === 'Ada').length;
  const tiadaTempohCount = filteredTasks.filter((t) => t.adaTempoh === 'Tiada').length;

  const completionRate = total > 0 ? Math.round((selesaiCount / total) * 100) : 0;

  const reportGeneratedAt = new Date().toLocaleDateString('ms-MY', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Handle Print (Clean Printable Report & Save as PDF)
  const handlePrint = async () => {
    try {
      setIsPrinting(true);
      await printTaskReport(filteredTasks, workspaceName);
    } catch (e) {
      console.error('Print error:', e);
      window.print();
    } finally {
      setTimeout(() => setIsPrinting(false), 500);
    }
  };


  // Handle Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Bil',
      'Nama Task',
      'Status',
      'Ada Tempoh',
      'Tempoh',
      'Keterangan',
      'Catatan',
      'Dicipta Oleh',
      'Tarikh Dicipta',
      'Tarikh Kemaskini'
    ];

    const rows = filteredTasks.map((t, idx) => [
      idx + 1,
      `"${(t.namaTask || '').replace(/"/g, '""')}"`,
      `"${t.status || ''}"`,
      `"${t.adaTempoh || ''}"`,
      `"${t.tempoh || '-'}"`,
      `"${(t.keterangan || '').replace(/"/g, '""')}"`,
      `"${(t.catatan || '').replace(/"/g, '""')}"`,
      `"${(t.createdBy || '').replace(/"/g, '""')}"`,
      `"${t.tarikhDicipta || ''}"`,
      `"${t.tarikhKemaskini || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Pengurusan_Task_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Copy Summary
  const handleCopySummary = () => {
    const text = `📋 LAPORAN TERKINI PENGURUSAN TASK
Dijana pada: ${reportGeneratedAt}
Ruang Kerja: ${workspaceName}

RINGKASAN STATISTIK:
• Jumlah Task: ${total}
• Selesai: ${selesaiCount} (${completionRate}%)
• Dalam Proses: ${dalamProsesCount}
• Batal: ${batalCount}
• Task Ada Tempoh: ${adaTempohCount} | Tiada Tempoh: ${tiadaTempohCount}

SENARAI TUGASAN (${filteredTasks.length} rekod):
${filteredTasks.slice(0, 15).map((t, i) => `${i + 1}. ${t.namaTask} | Status: ${t.status} | Tempoh: ${t.adaTempoh === 'Ada' ? t.tempoh : 'Tiada'} | Dicipta oleh: ${t.createdBy || 'Staf'}`).join('\n')}
${filteredTasks.length > 15 ? `...dan ${filteredTasks.length - 15} task lagi.` : ''}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between gap-4 shrink-0 print:bg-white print:text-slate-900 print:border-b-2 print:border-slate-800 print:p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center print:border-slate-800 print:text-slate-900">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight">
                  Laporan Terkini Pengurusan Task
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 print:text-slate-800 print:border-slate-400">
                  {total} Task
                </span>
              </div>
              <p className="text-xs text-slate-400 print:text-slate-600 mt-0.5">
                Tarikh Jana: {reportGeneratedAt} · Penyelarasan Masa Nyata Firebase
              </p>
            </div>
          </div>

          {/* Action Buttons & Close */}
          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handleCopySummary}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700 cursor-pointer"
              title="Salin Ringkasan Teks"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Disalin!' : 'Salin Ringkasan'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Muat Turun Fail CSV / Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Eksport CSV</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Cetak Laporan / Simpan Sebagai PDF"
            >
              {isPrinting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isPrinting ? 'Menjana...' : 'Cetak / PDF'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls (Hidden in Print) */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 print:hidden shrink-0">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block mb-1">
              Tapis Mengikut Status Task
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Status ({tasks.length})</option>
              <option value="Dalam Proses">Dalam Proses</option>
              <option value="Selesai">Selesai</option>
              <option value="Batal">Batal</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block mb-1">
              Tapis Mengikut Tempoh Masa
            </label>
            <select
              value={filterTempoh}
              onChange={(e) => setFilterTempoh(e.target.value)}
              className="w-full px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Task (Ada & Tiada Tempoh)</option>
              <option value="Ada">Ada Tempoh (Pagi / Petang / Malam / dsb)</option>
              <option value="Tiada">Tiada Tempoh</option>
            </select>
          </div>
        </div>

        {/* Scrollable Report Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 print:p-2 print:overflow-visible">
          {/* Executive Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Jumlah Task</span>
              <div className="text-xl font-black text-slate-900 font-mono mt-0.5">{total}</div>
              <span className="text-[10px] text-slate-500">100% data aktif</span>
            </div>

            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200">
              <span className="text-[10px] font-bold text-emerald-700 uppercase">Selesai</span>
              <div className="text-xl font-black text-emerald-800 font-mono mt-0.5">{selesaiCount}</div>
              <span className="text-[10px] text-emerald-600 font-bold">{completionRate}% kadar siap</span>
            </div>

            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200">
              <span className="text-[10px] font-bold text-amber-700 uppercase">Dalam Proses</span>
              <div className="text-xl font-black text-amber-800 font-mono mt-0.5">{dalamProsesCount}</div>
              <span className="text-[10px] text-amber-600 font-medium">Sedang berjalan</span>
            </div>

            <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200">
              <span className="text-[10px] font-bold text-rose-700 uppercase">Batal</span>
              <div className="text-xl font-black text-rose-800 font-mono mt-0.5">{batalCount}</div>
              <span className="text-[10px] text-rose-600 font-medium">{total > 0 ? Math.round((batalCount/total)*100) : 0}% dibatalkan</span>
            </div>
          </div>

          {/* Breakdown Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Pecahan Tempoh Tugasan
              </h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-indigo-50/70 text-indigo-900 font-medium">
                  <span>📅 Ada Tempoh Khusus</span>
                  <span className="font-mono font-bold">{adaTempohCount} ({total > 0 ? Math.round((adaTempohCount/total)*100) : 0}%)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-100 text-slate-800 font-medium">
                  <span>📂 Tiada Tempoh Khusus</span>
                  <span className="font-mono font-bold">{tiadaTempohCount} ({total > 0 ? Math.round((tiadaTempohCount/total)*100) : 0}%)</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Prestasi Penyelesaian
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600">Kadar Siap ({completionRate}%)</span>
                  <span className="text-emerald-700 font-mono">{selesaiCount} / {total} Task</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  <div 
                    style={{ width: `${total > 0 ? (selesaiCount / total) * 100 : 0}%` }}
                    className="bg-emerald-500" 
                  />
                  <div 
                    style={{ width: `${total > 0 ? (dalamProsesCount / total) * 100 : 0}%` }}
                    className="bg-amber-500" 
                  />
                  <div 
                    style={{ width: `${total > 0 ? (batalCount / total) * 100 : 0}%` }}
                    className="bg-rose-500" 
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold pt-1">
                  <span>✓ Selesai ({selesaiCount})</span>
                  <span>⏳ Proses ({dalamProsesCount})</span>
                  <span>✕ Batal ({batalCount})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Formatted Data Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Senarai Terperinci Pengurusan Task ({filteredTasks.length})
              </h4>
              <span className="text-[11px] text-slate-400">
                Penyelarasan pangkalan data Firebase Firestore
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-black">
                    <th className="py-3 px-3">Bil</th>
                    <th className="py-3 px-3">Nama Task & Keterangan</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Tempoh</th>
                    <th className="py-3 px-3">Dicipta Oleh</th>
                    <th className="py-3 px-3">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-bold">
                        Tiada rekod task mengikut kriteria tapisan ini.
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((t, idx) => (
                      <tr key={t.id || idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{t.namaTask}</div>
                          {t.keterangan && (
                            <div className="text-[11px] text-slate-500 line-clamp-1">{t.keterangan}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === 'Selesai'
                              ? 'bg-emerald-100 text-emerald-800'
                              : t.status === 'Batal'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {t.status === 'Selesai' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            {t.status === 'Dalam Proses' && <Clock className="w-3 h-3 text-amber-600" />}
                            {t.status === 'Batal' && <XCircle className="w-3 h-3 text-rose-600" />}
                            <span>{t.status}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {t.adaTempoh === 'Ada' && t.tempoh ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                              <Calendar className="w-2.5 h-2.5" />
                              <span>{t.tempoh}</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Tiada Tempoh</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-slate-600 font-medium">
                          {t.createdBy || 'Staf'}
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-slate-500">
                          {t.catatan || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Disinkronkan secara masa nyata dengan Firebase Firestore</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all cursor-pointer"
          >
            Tutup Laporan
          </button>
        </div>
      </div>
    </div>
  );
};
