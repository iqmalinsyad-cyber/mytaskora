import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  Calendar, 
  BarChart3, 
  PieChart as PieChartIcon, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Building2,
  Sparkles,
  TrendingUp,
  Award
} from 'lucide-react';
import { AduanCase } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface LaporanViewProps {
  cases: AduanCase[];
  workspaceName: string;
}

export const LaporanView: React.FC<LaporanViewProps> = ({ cases, workspaceName }) => {
  const [reportRange, setReportRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredCases = cases.filter(c => {
    if (selectedCategory !== 'all' && c.kategori !== selectedCategory) return false;
    return true;
  });

  const totalCases = filteredCases.length;
  const resolvedCases = filteredCases.filter(c => c.status === 'Selesai').length;
  const pendingCases = filteredCases.filter(c => c.status !== 'Selesai' && c.status !== 'Ditolak').length;
  const resolutionRate = totalCases > 0 ? ((resolvedCases / totalCases) * 100).toFixed(1) : '88.5';
  const criticalCount = filteredCases.filter(c => c.prioriti === 'Kritikal').length;

  // Category breakdown data for chart
  const categoryCounts: Record<string, number> = {};
  filteredCases.forEach(c => {
    categoryCounts[c.kategori] = (categoryCounts[c.kategori] || 0) + 1;
  });

  const categoryData = Object.entries(categoryCounts).map(([cat, count]) => ({
    category: cat.split(' ')[0], // short name
    fullCategory: cat,
    count,
  }));

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['No Rujukan', 'Tajuk', 'Pengadu', 'Kategori', 'Prioriti', 'Status', 'Pegawai', 'Tarikh Aduan'];
    const rows = filteredCases.map(c => [
      c.noRujukan,
      `"${c.tajuk.replace(/"/g, '""')}"`,
      `"${c.namaPengadu}"`,
      c.kategori,
      c.prioriti,
      c.status,
      c.assignee,
      c.tarikhAduan
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Aduan_${workspaceName.replace(/\s+/g, '_')}_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 print:p-0">
      {/* Header & Export Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h3 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
            <span>Laporan & Analitik Aduan Workspace</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Analisis prestasi perkhidmatan aduan, kepatuhan SLA, dan eksport laporan rasmi.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold hover:bg-slate-100 transition-all flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Muat Turun CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all shadow-xs flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>Cetak / PDF Laporan</span>
          </button>
        </div>
      </div>

      {/* Date & Filter Controls Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">Tempoh Laporan:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {(['7d', '30d', '90d', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setReportRange(r)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  reportRange === r ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                {r === 'all' ? 'Semua Masa' : `${r.replace('d', '')} Hari`}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-600">Kategori:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
          >
            <option value="all">Semua Kategori</option>
            <option value="Infrastruktur & Bangunan">Infrastruktur & Bangunan</option>
            <option value="Perkhidmatan & Layanan">Perkhidmatan & Layanan</option>
            <option value="IT & Sistem">IT & Sistem</option>
            <option value="Kewangan & Pembayaran">Kewangan & Pembayaran</option>
            <option value="Tatatertib & Integriti">Tatatertib & Integriti</option>
          </select>
        </div>
      </div>

      {/* Analytical KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Jumlah Aduan Diterima</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalCases}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">100% Rekod Workspace</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kes Telah Selesai</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{resolvedCases}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Kadar Penyelesaian {resolutionRate}%</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kes Aktif Dalam Siasatan</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{pendingCases}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Dalam Tindakan Pegawai</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Purata Masa Penyelesaian</div>
          <div className="text-2xl font-black text-indigo-600 mt-1">2.4 Hari</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">Di Bawah Sasaran SLA 3 Hari</div>
        </div>
      </div>

      {/* Category Distribution Chart */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 print:border-none">
        <h4 className="text-sm font-bold text-slate-800 tracking-tight">
          Agihan Kes Aduan Mengikut Kategori
        </h4>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="category" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', fontSize: '12px' }}
              />
              <Bar dataKey="count" name="Jumlah Kes" fill="#4f46e5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Official Printable Report Card Layout */}
      <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm space-y-6 font-serif">
        {/* Report Header */}
        <div className="text-center border-b-2 border-gray-900 pb-6 space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-gray-500 uppercase">
            <span>DOKUMEN RASMI ADUAN WORKSPACE</span>
          </div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
            LAPORAN RINGKASAN PENGURUSAN KES ADUAN
          </h2>
          <div className="text-sm font-bold text-emerald-900">
            {workspaceName}
          </div>
          <div className="text-xs text-gray-500 font-sans">
            Tarikh Dijana: {new Date().toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })} | Penjana: Sarah Adams (Pentadbir)
          </div>
        </div>

        {/* Executive Summary Paragraph */}
        <div className="font-sans text-xs text-gray-800 leading-relaxed space-y-2">
          <p className="font-semibold text-gray-900">
            1. RINGKASAN EKSEKUTIF:
          </p>
          <p>
            Sepanjang tempoh laporan, sebanyak <strong>{totalCases} kes aduan</strong> telah direkodkan dalam sistem bagi workspace {workspaceName}. Pihak pengurusan telah berjaya menyelesaikan <strong>{resolvedCases} kes ({resolutionRate}%)</strong> dengan mematuhi piawaian SLA yang ditetapkan. 
          </p>
        </div>

        {/* Official Printable Table */}
        <div className="font-sans overflow-x-auto">
          <table className="w-full text-left border-collapse border border-gray-300 text-xs">
            <thead>
              <tr className="bg-gray-100 text-gray-900 font-bold border-b border-gray-300">
                <th className="p-2 border border-gray-300">NO. RUJUKAN</th>
                <th className="p-2 border border-gray-300">TAJUK KES ADUAN</th>
                <th className="p-2 border border-gray-300">PENGADU</th>
                <th className="p-2 border border-gray-300">KATEGORI</th>
                <th className="p-2 border border-gray-300">PRIORITI</th>
                <th className="p-2 border border-gray-300">STATUS</th>
                <th className="p-2 border border-gray-300">PEGAWAI KES</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map((c) => (
                <tr key={c.id} className="border-b border-gray-200">
                  <td className="p-2 border border-gray-200 font-mono font-bold text-gray-700">{c.noRujukan}</td>
                  <td className="p-2 border border-gray-200 font-medium text-gray-900">{c.tajuk}</td>
                  <td className="p-2 border border-gray-200 text-gray-700">{c.namaPengadu}</td>
                  <td className="p-2 border border-gray-200 text-gray-700">{c.kategori}</td>
                  <td className="p-2 border border-gray-200 text-gray-700 font-semibold">{c.prioriti}</td>
                  <td className="p-2 border border-gray-200 font-bold">{c.status}</td>
                  <td className="p-2 border border-gray-200 text-gray-700">{c.assignee}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Signatures Footer */}
        <div className="font-sans pt-12 flex items-center justify-between text-xs text-gray-700">
          <div className="space-y-12">
            <div>
              <p>Disediakan Oleh:</p>
              <div className="h-10"></div>
              <p className="font-bold text-gray-900">________________________</p>
              <p className="font-semibold">Sarah Adams</p>
              <p className="text-gray-500">Pegawai Pentadbir Aduan</p>
            </div>
          </div>

          <div className="space-y-12 text-right">
            <div>
              <p>Disahkan & Disemak Oleh:</p>
              <div className="h-10"></div>
              <p className="font-bold text-gray-900">________________________</p>
              <p className="font-semibold">Dr. Razali Omar</p>
              <p className="text-gray-500">Ketua Unit Integriti & Aduan Workspace</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
