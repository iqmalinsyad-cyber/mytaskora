import React, { useState } from 'react';
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Activity, 
  ShieldAlert, 
  ChevronRight, 
  ArrowUpRight,
  TrendingUp,
  Filter,
  Eye,
  CheckCircle,
  HelpCircle,
  ClockAlert
} from 'lucide-react';
import { AduanCase, AduanStatus, TindakanAduan } from '../types';
import { calculateCaseSLA, calculateSlaPerformanceSummary } from '../utils/slaUtils';

interface AduanDashboardWidgetProps {
  cases: AduanCase[];
  onSelectCase: (aduan: AduanCase) => void;
  onFilterByStatus?: (status: AduanStatus | 'all') => void;
  onFilterByTindakan?: (tindakan: TindakanAduan | 'all') => void;
  onOpenAduanList?: () => void;
}

export const AduanDashboardWidget: React.FC<AduanDashboardWidgetProps> = ({
  cases,
  onSelectCase,
  onFilterByStatus,
  onFilterByTindakan,
  onOpenAduanList,
}) => {
  const [slaFilter, setSlaFilter] = useState<'all' | 'dalam_sla' | 'hampir_sla' | 'lebih_sla'>('all');

  // Total
  const totalCases = cases.length;

  // 1. Status Aduan breakdown
  const statusCounts = {
    belumSelesai: cases.filter(c => c.status === 'Belum Selesai').length,
    dalamSiasatan: cases.filter(c => c.status === 'Dalam Siasatan').length,
    kiv: cases.filter(c => c.status === 'Perlu Maklumat (KIV)' || c.status === 'Perlu Maklumat').length,
    selesai: cases.filter(c => c.status === 'Selesai').length,
    ditolak: cases.filter(c => c.status === 'Ditolak').length,
  };

  // 2. Tindakan Aduan breakdown
  const tindakanCounts = {
    telahDiproses: cases.filter(c => c.tindakan === 'Telah Diproses').length,
    kiv: cases.filter(c => c.tindakan === 'KIV').length,
    belumDiproses: cases.filter(c => c.tindakan === 'Belum Di Proses' || !c.tindakan).length,
  };

  // 3. SLA Aduan calculations using SLA utils
  const slaSummary = calculateSlaPerformanceSummary(cases);
  const casesWithSla = cases.map(c => {
    const sla = calculateCaseSLA(c);
    return {
      ...c,
      slaResult: sla,
      isOverdue: !sla.isCompliant,
    };
  });

  const activeOverdueCases = casesWithSla.filter(c => c.status !== 'Selesai' && c.status !== 'Ditolak' && c.isOverdue);
  const activeOverdueCount = activeOverdueCases.length;

  // Filtered list for urgent SLA display (sorted by elapsed hours descending)
  const urgentCases = casesWithSla
    .filter(c => c.status !== 'Selesai' && c.status !== 'Ditolak')
    .sort((a, b) => b.slaResult.elapsedHours - a.slaResult.elapsedHours)
    .slice(0, 4);

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 lg:p-6 border border-slate-200 shadow-xs space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Dashboard Kes Aduan
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {totalCases} Jumlah Kes
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Analisis terperinci mengikut Status Aduan, Tindakan Semasa, dan Prestasi SLA.
            </p>
          </div>
        </div>

        {onOpenAduanList && (
          <button
            onClick={onOpenAduanList}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all flex items-center gap-1.5 border border-indigo-200/80 shadow-2xs"
          >
            <span>Lihat Senarai Penuh</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 3 Main Grid Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ======================================================== */}
        {/* 1. STATUS ADUAN */}
        {/* ======================================================== */}
        <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                  1. Status Aduan
                </h4>
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                {totalCases} Kes
              </span>
            </div>

            {/* Stacked Progress Bar */}
            {totalCases > 0 && (
              <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden flex mb-3 shadow-inner">
                <div 
                  style={{ width: `${(statusCounts.belumSelesai / totalCases) * 100}%` }} 
                  className="bg-amber-500 transition-all" 
                  title={`Belum Selesai: ${statusCounts.belumSelesai}`} 
                />
                <div 
                  style={{ width: `${(statusCounts.dalamSiasatan / totalCases) * 100}%` }} 
                  className="bg-blue-600 transition-all" 
                  title={`Dalam Siasatan: ${statusCounts.dalamSiasatan}`} 
                />
                <div 
                  style={{ width: `${(statusCounts.kiv / totalCases) * 100}%` }} 
                  className="bg-purple-500 transition-all" 
                  title={`Perlu Maklumat: ${statusCounts.kiv}`} 
                />
                <div 
                  style={{ width: `${(statusCounts.selesai / totalCases) * 100}%` }} 
                  className="bg-emerald-500 transition-all" 
                  title={`Selesai: ${statusCounts.selesai}`} 
                />
                <div 
                  style={{ width: `${(statusCounts.ditolak / totalCases) * 100}%` }} 
                  className="bg-rose-500 transition-all" 
                  title={`Ditolak: ${statusCounts.ditolak}`} 
                />
              </div>
            )}

            {/* Status Breakdown List */}
            <div className="space-y-2">
              <div 
                onClick={() => onFilterByStatus && onFilterByStatus('Belum Selesai')}
                className="flex items-center justify-between p-2 rounded-xl bg-white border border-amber-200/80 hover:border-amber-400 hover:shadow-xs transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <span className="text-xs font-bold text-slate-700 group-hover:text-amber-800">Belum Selesai</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-amber-700 font-mono">{statusCounts.belumSelesai}</span>
                  <span className="text-[10px] text-slate-400">
                    ({totalCases > 0 ? Math.round((statusCounts.belumSelesai / totalCases) * 100) : 0}%)
                  </span>
                </div>
              </div>

              <div 
                onClick={() => onFilterByStatus && onFilterByStatus('Dalam Siasatan')}
                className="flex items-center justify-between p-2 rounded-xl bg-white border border-blue-200/80 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                  <span className="text-xs font-bold text-slate-700 group-hover:text-blue-800">Dalam Siasatan</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-blue-700 font-mono">{statusCounts.dalamSiasatan}</span>
                  <span className="text-[10px] text-slate-400">
                    ({totalCases > 0 ? Math.round((statusCounts.dalamSiasatan / totalCases) * 100) : 0}%)
                  </span>
                </div>
              </div>

              <div 
                onClick={() => onFilterByStatus && onFilterByStatus('Perlu Maklumat (KIV)')}
                className="flex items-center justify-between p-2 rounded-xl bg-white border border-purple-200/80 hover:border-purple-400 hover:shadow-xs transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  <span className="text-xs font-bold text-slate-700 group-hover:text-purple-800">Perlu Maklumat (KIV)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-purple-700 font-mono">{statusCounts.kiv}</span>
                  <span className="text-[10px] text-slate-400">
                    ({totalCases > 0 ? Math.round((statusCounts.kiv / totalCases) * 100) : 0}%)
                  </span>
                </div>
              </div>

              <div 
                onClick={() => onFilterByStatus && onFilterByStatus('Selesai')}
                className="flex items-center justify-between p-2 rounded-xl bg-white border border-emerald-200/80 hover:border-emerald-400 hover:shadow-xs transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-xs font-bold text-slate-700 group-hover:text-emerald-800">Selesai</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-emerald-700 font-mono">{statusCounts.selesai}</span>
                  <span className="text-[10px] text-slate-400">
                    ({totalCases > 0 ? Math.round((statusCounts.selesai / totalCases) * 100) : 0}%)
                  </span>
                </div>
              </div>

              <div 
                onClick={() => onFilterByStatus && onFilterByStatus('Ditolak')}
                className="flex items-center justify-between p-2 rounded-xl bg-white border border-rose-200/80 hover:border-rose-400 hover:shadow-xs transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                  <span className="text-xs font-bold text-slate-700 group-hover:text-rose-800">Ditolak</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-rose-700 font-mono">{statusCounts.ditolak}</span>
                  <span className="text-[10px] text-slate-400">
                    ({totalCases > 0 ? Math.round((statusCounts.ditolak / totalCases) * 100) : 0}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. TINDAKAN ADUAN */}
        {/* ======================================================== */}
        <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                  2. Tindakan Aduan
                </h4>
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                Peringkat Proses
              </span>
            </div>

            {/* 3 Tindakan Cards */}
            <div className="space-y-2.5">
              {/* Telah Diproses */}
              <div 
                onClick={() => onFilterByTindakan && onFilterByTindakan('Telah Diproses')}
                className="p-3 bg-white rounded-xl border border-teal-200/80 hover:border-teal-400 hover:shadow-xs transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-teal-600" />
                    <span className="text-xs font-bold text-slate-800 group-hover:text-teal-700">Telah Diproses</span>
                  </div>
                  <span className="text-sm font-black text-teal-700 font-mono">{tindakanCounts.telahDiproses}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${totalCases > 0 ? (tindakanCounts.telahDiproses / totalCases) * 100 : 0}%` }}
                    className="h-full bg-teal-500 rounded-full"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">
                  Kes yang telah selesai disiasat dan tindakan susulan selesai dilaksanakan.
                </p>
              </div>

              {/* KIV */}
              <div 
                onClick={() => onFilterByTindakan && onFilterByTindakan('KIV')}
                className="p-3 bg-white rounded-xl border border-amber-200/80 hover:border-amber-400 hover:shadow-xs transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-slate-800 group-hover:text-amber-700">KIV (Tangguh / Info)</span>
                  </div>
                  <span className="text-sm font-black text-amber-700 font-mono">{tindakanCounts.kiv}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${totalCases > 0 ? (tindakanCounts.kiv / totalCases) * 100 : 0}%` }}
                    className="h-full bg-amber-500 rounded-full"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">
                  Menunggu dokumen tambahan dari pengadu atau maklum balas agensi berkaitan.
                </p>
              </div>

              {/* Belum Di Proses */}
              <div 
                onClick={() => onFilterByTindakan && onFilterByTindakan('Belum Di Proses')}
                className="p-3 bg-white rounded-xl border border-slate-300 hover:border-slate-400 hover:shadow-xs transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-bold text-slate-800 group-hover:text-slate-900">Belum Di Proses</span>
                  </div>
                  <span className="text-sm font-black text-slate-700 font-mono">{tindakanCounts.belumDiproses}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${totalCases > 0 ? (tindakanCounts.belumDiproses / totalCases) * 100 : 0}%` }}
                    className="h-full bg-slate-400 rounded-full"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">
                  Aduan baharu didaftarkan dan menunggu agihan penyiasat bertugas.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. SLA ADUAN (WARNA PENUH / FULL RICH COLOR) */}
        {/* ======================================================== */}
        <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse"></span>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  3. Prestasi SLA Aduan
                </h4>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black shadow-xs ${
                slaSummary.complianceRate >= 85 ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
              }`}>
                {slaSummary.complianceRate}% Pematuhan (≤96j)
              </span>
            </div>

            {/* SLA 4 Grid Metrics - DESAIN WARNA PENUH (FULL COLOR SOLID GRADIENTS) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-2.5">
              {/* 1. STRETCH (< 48 Jam) */}
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white text-center shadow-md shadow-emerald-600/20 border border-emerald-500/40 relative overflow-hidden group hover:scale-[1.02] transition-transform">
                <div className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-100">&lt; 48 Jam</div>
                <div className="text-base sm:text-lg font-black text-white font-mono my-0.5">{slaSummary.under48hCount}</div>
                <div className="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-white/20 backdrop-blur-xs text-white uppercase tracking-wider inline-block">
                  STRETCH
                </div>
              </div>

              {/* 2. TARGET (< 72 Jam) */}
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-center shadow-md shadow-blue-600/20 border border-blue-500/40 relative overflow-hidden group hover:scale-[1.02] transition-transform">
                <div className="text-[9px] font-extrabold uppercase tracking-wider text-blue-100">&lt; 72 Jam</div>
                <div className="text-base sm:text-lg font-black text-white font-mono my-0.5">{slaSummary.under72hCount}</div>
                <div className="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-white/20 backdrop-blur-xs text-white uppercase tracking-wider inline-block">
                  TARGET
                </div>
              </div>

              {/* 3. THRESHOLD (< 96 Jam) */}
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white text-center shadow-md shadow-amber-500/20 border border-amber-400/40 relative overflow-hidden group hover:scale-[1.02] transition-transform">
                <div className="text-[9px] font-extrabold uppercase tracking-wider text-amber-100">&lt; 96 Jam</div>
                <div className="text-base sm:text-lg font-black text-white font-mono my-0.5">{slaSummary.under96hCount}</div>
                <div className="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-white/20 backdrop-blur-xs text-white uppercase tracking-wider inline-block">
                  THRESHOLD
                </div>
              </div>

              {/* 4. TIDAK PATUH (> 96 Jam) */}
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-600 to-red-700 text-white text-center shadow-md shadow-rose-600/20 border border-rose-500/40 relative overflow-hidden group hover:scale-[1.02] transition-transform">
                <div className="text-[9px] font-extrabold uppercase tracking-wider text-rose-100">&gt; 96 Jam</div>
                <div className="text-base sm:text-lg font-black text-white font-mono my-0.5">{slaSummary.over96hCount}</div>
                <div className="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-white/20 backdrop-blur-xs text-white uppercase tracking-wider inline-block">
                  TIDAK PATUH
                </div>
              </div>
            </div>

            {/* Urgent SLA Cases Alert List */}
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider">
                <span>Perhatian Segera (SLA Aduan)</span>
                {activeOverdueCount > 0 && (
                  <span className="text-rose-600 flex items-center gap-1 font-bold">
                    <ClockAlert className="w-3 h-3" />
                    {activeOverdueCount} Tidak Patuh (&gt;96j)
                  </span>
                )}
              </div>

              {urgentCases.length === 0 ? (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 text-center text-xs font-semibold text-emerald-800">
                  Tahniah! Tiada kes aduan aktif yang memerlukan tindakan segera.
                </div>
              ) : (
                urgentCases.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => onSelectCase(c)}
                    className="p-2 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer flex items-center justify-between gap-2 shadow-2xs group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                          {c.noRujukan}
                        </span>
                        <span className="text-[11px] font-bold text-slate-800 truncate group-hover:text-indigo-600">
                          {c.namaPengadu}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        {c.sumberAduan} · {c.kategori}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {c.isOverdue ? (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-600 text-white shadow-2xs">
                          <AlertTriangle className="w-2.5 h-2.5 text-rose-200" />
                          &gt;96j (Tidak Patuh)
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-black border ${c.slaResult.badgeBg} ${c.slaResult.badgeText} ${c.slaResult.badgeBorder}`}>
                          <Clock className="w-2.5 h-2.5" />
                          {c.slaResult.tierLabel} ({c.slaResult.elapsedHours}j)
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
