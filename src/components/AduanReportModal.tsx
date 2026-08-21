import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Copy, 
  Check, 
  FileText, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle,
  Filter,
  Layers,
  Sparkles,
  User,
  Phone,
  Tag,
  Building2,
  Loader2
} from 'lucide-react';
import { AduanCase, AduanStatus, TindakanAduan } from '../types';
import { printAduanCasesReport } from '../utils/printUtils';
import { calculateCaseSLA, calculateSlaPerformanceSummary } from '../utils/slaUtils';

interface AduanReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  cases: AduanCase[];
  workspaceName?: string;
}

export const AduanReportModal: React.FC<AduanReportModalProps> = ({
  isOpen,
  onClose,
  cases,
  workspaceName = 'Semua Ruang Kerja',
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTindakan, setFilterTindakan] = useState<string>('all');
  const [filterSumber, setFilterSumber] = useState<string>('all');
  const [copied, setCopied] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  if (!isOpen) return null;

  // Filter cases according to selections
  const filteredCases = cases.filter((c) => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (filterTindakan !== 'all' && (c.tindakan || 'Belum Di Proses') !== filterTindakan) return false;
    if (filterSumber !== 'all' && c.sumberAduan !== filterSumber) return false;
    return true;
  });

  // KPI Calculations
  const total = filteredCases.length;
  const selesaiCount = filteredCases.filter((c) => c.status === 'Selesai').length;
  const dalamSiasatanCount = filteredCases.filter((c) => c.status === 'Dalam Siasatan').length;
  const belumSelesaiCount = filteredCases.filter((c) => c.status === 'Belum Selesai' || c.status === 'Belum Disahkan').length;
  const kivCount = filteredCases.filter((c) => c.status === 'Perlu Maklumat (KIV)' || c.status === 'Perlu Maklumat').length;
  const ditolakCount = filteredCases.filter((c) => c.status === 'Ditolak').length;

  const telahDiprosesCount = filteredCases.filter((c) => c.tindakan === 'Telah Diproses').length;
  const kivTindakanCount = filteredCases.filter((c) => c.tindakan === 'KIV').length;
  const belumDiprosesCount = filteredCases.filter((c) => c.tindakan === 'Belum Di Proses' || !c.tindakan).length;

  const completionRate = total > 0 ? Math.round((selesaiCount / total) * 100) : 0;
  
  // SLA Performance Calculation
  const slaSummary = calculateSlaPerformanceSummary(filteredCases);

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
      await printAduanCasesReport(filteredCases, workspaceName);
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
      'No Rujukan',
      'Nama Pengadu',
      'No Kad Pengenalan',
      'No Telefon',
      'Alamat',
      'Kategori',
      'Sumber Aduan',
      'Status Kes',
      'Tindakan',
      'Syor Bantuan',
      'Prestasi SLA',
      'Jumlah Jam SLA',
      'Kepatuhan SLA',
      'Tarikh Aduan',
      'Tarikh Selesai',
      'Catatan Kes'
    ];

    const rows = filteredCases.map((c) => {
      const sla = calculateCaseSLA(c);
      return [
        `"${c.noRujukan || ''}"`,
        `"${(c.namaPengadu || '').replace(/"/g, '""')}"`,
        `"${c.noKadPengenalan || ''}"`,
        `"${c.telefonPengadu || ''}"`,
        `"${(c.alamat || '').replace(/"/g, '""')}"`,
        `"${c.kategori || ''}"`,
        `"${c.sumberAduan || ''}"`,
        `"${c.status || ''}"`,
        `"${c.tindakan || 'Belum Di Proses'}"`,
        `"${c.syorBantuan || 'Tiada'}"`,
        `"${sla.tierLabel}"`,
        `"${sla.elapsedHours}"`,
        `"${sla.isCompliant ? 'PATUH' : 'TIDAK PATUH'}"`,
        `"${c.tarikhAduan || ''}"`,
        `"${c.tarikhSelesai || ''}"`,
        `"${(c.catatanKes || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Kes_Aduan_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Copy Summary
  const handleCopySummary = () => {
    const text = `📊 LAPORAN TERKINI KES ADUAN
Dijana pada: ${reportGeneratedAt}
Ruang Kerja: ${workspaceName}

RINGKASAN STATUS KES:
• Jumlah Kes: ${total}
• Selesai: ${selesaiCount} (${completionRate}%)
• Dalam Siasatan: ${dalamSiasatanCount}
• Belum Selesai: ${belumSelesaiCount}
• Perlu Maklumat (KIV): ${kivCount}
• Ditolak: ${ditolakCount}

PRESTASI SLA ADUAN (Piawaian Baharu 4 Peringkat - Maksimum 96 Jam):
• < 48 Jam (STRETCH): ${slaSummary.under48hCount} kes (${total > 0 ? Math.round((slaSummary.under48hCount/total)*100) : 0}%)
• < 72 Jam (TARGET): ${slaSummary.under72hCount} kes (${total > 0 ? Math.round((slaSummary.under72hCount/total)*100) : 0}%)
• < 96 Jam (THRESHOLD): ${slaSummary.under96hCount} kes (${total > 0 ? Math.round((slaSummary.under96hCount/total)*100) : 0}%)
• > 96 Jam (Tidak Patuh yang ditetapkan): ${slaSummary.over96hCount} kes (${total > 0 ? Math.round((slaSummary.over96hCount/total)*100) : 0}%)
• Kadar Pematuhan SLA: ${slaSummary.complianceRate}%

PECAHAN TINDAKAN:
• Telah Diproses: ${telahDiprosesCount}
• KIV: ${kivTindakanCount}
• Belum Di Proses: ${belumDiprosesCount}

SENARAI RINGKAS (${filteredCases.length} rekod):
${filteredCases.slice(0, 15).map((c, i) => {
  const sla = calculateCaseSLA(c);
  return `${i + 1}. [${c.noRujukan}] ${c.namaPengadu} | Sumber: ${c.sumberAduan || 'Awam'} | Status: ${c.status} | Tindakan: ${c.tindakan || 'Belum Di Proses'} | SLA: ${sla.tierLabel} (${sla.elapsedHours}j)`;
}).join('\n')}
${filteredCases.length > 15 ? `...dan ${filteredCases.length - 15} rekod lagi.` : ''}
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
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center print:border-slate-800 print:text-slate-900">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight">
                  Laporan Terkini Kes Aduan
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 print:text-slate-800 print:border-slate-400">
                  {total} Rekod
                </span>
              </div>
              <p className="text-xs text-slate-400 print:text-slate-600 mt-0.5">
                Tarikh Jana: {reportGeneratedAt} · Ruang Kerja: {workspaceName}
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
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 print:hidden shrink-0">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block mb-1">
              Tapis Mengikut Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Semua Status ({cases.length})</option>
              <option value="Belum Selesai">Belum Selesai</option>
              <option value="Dalam Siasatan">Dalam Siasatan</option>
              <option value="Perlu Maklumat (KIV)">Perlu Maklumat (KIV)</option>
              <option value="Selesai">Selesai</option>
              <option value="Ditolak">Ditolak</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block mb-1">
              Tapis Mengikut Tindakan
            </label>
            <select
              value={filterTindakan}
              onChange={(e) => setFilterTindakan(e.target.value)}
              className="w-full px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Semua Tindakan</option>
              <option value="Telah Diproses">Telah Diproses</option>
              <option value="KIV">KIV</option>
              <option value="Belum Di Proses">Belum Di Proses</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block mb-1">
              Tapis Mengikut Sumber
            </label>
            <select
              value={filterSumber}
              onChange={(e) => setFilterSumber(e.target.value)}
              className="w-full px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Semua Sumber Aduan</option>
              <option value="CMU">CMU</option>
              <option value="Aduan Awam">Aduan Awam</option>
              <option value="Parlimen">Parlimen</option>
              <option value="Adun">Adun</option>
              <option value="HQ">HQ</option>
              <option value="MAIS">MAIS</option>
              <option value="JAIS">JAIS</option>
            </select>
          </div>
        </div>

        {/* Scrollable Report Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 print:p-2 print:overflow-visible">
          {/* Executive Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Jumlah Kes</span>
              <div className="text-xl font-black text-slate-900 font-mono mt-0.5">{total}</div>
              <span className="text-[10px] text-slate-500">100% data aktif</span>
            </div>

            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200">
              <span className="text-[10px] font-bold text-emerald-700 uppercase">Selesai</span>
              <div className="text-xl font-black text-emerald-800 font-mono mt-0.5">{selesaiCount}</div>
              <span className="text-[10px] text-emerald-600 font-bold">{completionRate}% kadar selesai</span>
            </div>

            <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-200">
              <span className="text-[10px] font-bold text-blue-700 uppercase">Dalam Siasatan</span>
              <div className="text-xl font-black text-blue-800 font-mono mt-0.5">{dalamSiasatanCount}</div>
              <span className="text-[10px] text-blue-600 font-medium">Sedang diproses</span>
            </div>

            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200">
              <span className="text-[10px] font-bold text-amber-700 uppercase">Belum Selesai / KIV</span>
              <div className="text-xl font-black text-amber-800 font-mono mt-0.5">{belumSelesaiCount + kivCount}</div>
              <span className="text-[10px] text-amber-600 font-medium">{telahDiprosesCount} telah diproses</span>
            </div>
          </div>

          {/* PRESTASI SLA ADUAN SECTION */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/30 border border-emerald-200/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Prestasi SLA Aduan
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Penilaian tempoh masa aduan (Piawaian maksimum patuh: ≤ 96 Jam)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {slaSummary.complianceRate}% Kadar Pematuhan SLA
                </span>
              </div>
            </div>

            {/* 4 SLA Tier KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="p-3 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                <span className="text-[10px] font-extrabold text-emerald-700 uppercase block">1. &lt; 48 Jam (STRETCH)</span>
                <div className="text-lg font-black text-emerald-900 font-mono mt-0.5">{slaSummary.under48hCount}</div>
                <span className="text-[10px] text-emerald-600 font-medium">
                  STRETCH ({total > 0 ? Math.round((slaSummary.under48hCount/total)*100) : 0}%)
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-blue-200 shadow-2xs">
                <span className="text-[10px] font-extrabold text-blue-700 uppercase block">2. &lt; 72 Jam (TARGET)</span>
                <div className="text-lg font-black text-blue-900 font-mono mt-0.5">{slaSummary.under72hCount}</div>
                <span className="text-[10px] text-blue-600 font-medium">
                  TARGET ({total > 0 ? Math.round((slaSummary.under72hCount/total)*100) : 0}%)
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-amber-200 shadow-2xs">
                <span className="text-[10px] font-extrabold text-amber-700 uppercase block">3. &lt; 96 Jam (THRESHOLD)</span>
                <div className="text-lg font-black text-amber-900 font-mono mt-0.5">{slaSummary.under96hCount}</div>
                <span className="text-[10px] text-amber-600 font-medium">
                  THRESHOLD ({total > 0 ? Math.round((slaSummary.under96hCount/total)*100) : 0}%)
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-rose-200 shadow-2xs">
                <span className="text-[10px] font-extrabold text-rose-700 uppercase block">4. &gt; 96 Jam (Tidak Patuh)</span>
                <div className="text-lg font-black text-rose-900 font-mono mt-0.5">{slaSummary.over96hCount}</div>
                <span className="text-[10px] text-rose-600 font-bold">
                  Tidak Patuh SLA ({total > 0 ? Math.round((slaSummary.over96hCount/total)*100) : 0}%)
                </span>
              </div>
            </div>
          </div>

          {/* Breakdown Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Breakdown Box */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Pecahan Mengikut Status Kes
              </h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-emerald-50/70 text-emerald-900 font-medium">
                  <span>✓ Selesai</span>
                  <span className="font-mono font-bold">{selesaiCount} ({total > 0 ? Math.round((selesaiCount/total)*100) : 0}%)</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-blue-50/70 text-blue-900 font-medium">
                  <span>↻ Dalam Siasatan</span>
                  <span className="font-mono font-bold">{dalamSiasatanCount} ({total > 0 ? Math.round((dalamSiasatanCount/total)*100) : 0}%)</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-amber-50/70 text-amber-900 font-medium">
                  <span>⏳ Belum Selesai</span>
                  <span className="font-mono font-bold">{belumSelesaiCount} ({total > 0 ? Math.round((belumSelesaiCount/total)*100) : 0}%)</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-purple-50/70 text-purple-900 font-medium">
                  <span>ℹ️ Perlu Maklumat (KIV)</span>
                  <span className="font-mono font-bold">{kivCount} ({total > 0 ? Math.round((kivCount/total)*100) : 0}%)</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-rose-50/70 text-rose-900 font-medium">
                  <span>✕ Ditolak</span>
                  <span className="font-mono font-bold">{ditolakCount} ({total > 0 ? Math.round((ditolakCount/total)*100) : 0}%)</span>
                </div>
              </div>
            </div>

            {/* Tindakan Breakdown Box */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Pecahan Mengikut Status Tindakan
              </h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-teal-50/70 text-teal-900 font-medium">
                  <span>✓ Telah Diproses</span>
                  <span className="font-mono font-bold">{telahDiprosesCount} ({total > 0 ? Math.round((telahDiprosesCount/total)*100) : 0}%)</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-amber-50/70 text-amber-900 font-medium">
                  <span>⏳ KIV (Tangguh / Tunggu Info)</span>
                  <span className="font-mono font-bold">{kivTindakanCount} ({total > 0 ? Math.round((kivTindakanCount/total)*100) : 0}%)</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-100 text-slate-800 font-medium">
                  <span>• Belum Di Proses</span>
                  <span className="font-mono font-bold">{belumDiprosesCount} ({total > 0 ? Math.round((belumDiprosesCount/total)*100) : 0}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Formatted Data Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Senarai Terperinci Kes Aduan ({filteredCases.length})
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
                    <th className="py-3 px-3">No. Rujukan</th>
                    <th className="py-3 px-3">NAMA</th>
                    <th className="py-3 px-3">Sumber Aduan</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Tindakan</th>
                    <th className="py-3 px-3">Prestasi SLA</th>
                    <th className="py-3 px-3">Tarikh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {filteredCases.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 font-bold">
                        Tiada rekod aduan mengikut kriteria tapisan ini.
                      </td>
                    </tr>
                  ) : (
                    filteredCases.map((c, idx) => {
                      const sla = calculateCaseSLA(c);
                      return (
                        <tr key={c.id || idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 px-3">
                            <span className="font-mono font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                              {c.noRujukan}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900">{c.namaPengadu}</div>
                            {c.telefonPengadu && (
                              <div className="text-[10px] text-slate-400">{c.telefonPengadu}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold border bg-indigo-50 text-indigo-700 border-indigo-200">
                              {c.sumberAduan || 'Aduan Awam'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              c.status === 'Selesai'
                                ? 'bg-emerald-100 text-emerald-800'
                                : c.status === 'Ditolak'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-[11px] font-bold text-slate-700">
                              {c.tindakan || 'Belum Di Proses'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex flex-col">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-extrabold border ${sla.badgeBg} ${sla.badgeText} ${sla.badgeBorder}`}>
                                <Clock className="w-3 h-3" />
                                <span>{sla.tierLabel}</span>
                              </span>
                              <span className={`text-[9.5px] font-bold mt-0.5 ${sla.isCompliant ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {sla.elapsedHours} Jam · {sla.isCompliant ? 'Patuh SLA' : 'Tidak Patuh'}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-slate-500 whitespace-nowrap">
                            {c.tarikhAduan ? new Date(c.tarikhAduan).toLocaleDateString('ms-MY') : '-'}
                          </td>
                        </tr>
                      );
                    })
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
