import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Copy, 
  Check, 
  Award, 
  Calendar, 
  User, 
  MapPin, 
  Search, 
  Layers, 
  ListFilter,
  FileSpreadsheet
} from 'lucide-react';
import { ProgramAgihanKPI } from '../types';
import { printProgramAgihanReport } from '../utils/printUtils';

interface ProgramAgihanReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ProgramAgihanKPI[];
}

export const ProgramAgihanReportModal: React.FC<ProgramAgihanReportModalProps> = ({
  isOpen,
  onClose,
  items,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPic, setFilterPic] = useState('all');
  const [copied, setCopied] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  if (!isOpen) return null;

  // Extract unique PIC list
  const picList = Array.from(new Set(items.map((i) => i.namaPic.trim()).filter(Boolean))).sort();

  // Filter list
  const filteredItems = items.filter((item) => {
    if (filterPic !== 'all' && item.namaPic.trim() !== filterPic) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = 
        item.namaProgram.toLowerCase().includes(q) ||
        item.namaPic.toLowerCase().includes(q) ||
        item.lokasi.toLowerCase().includes(q) ||
        (item.catatan && item.catatan.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // KPI Calculations
  const total = filteredItems.length;
  const uniquePics = new Set(filteredItems.map((i) => i.namaPic.trim()).filter(Boolean)).size;
  const uniqueLocations = new Set(filteredItems.map((i) => i.lokasi.trim()).filter(Boolean)).size;

  const reportGeneratedAt = new Date().toLocaleDateString('ms-MY', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Handle Print (Official PDF / Paper)
  const handlePrint = async () => {
    try {
      setIsPrinting(true);
      await printProgramAgihanReport(
        filteredItems,
        'Bilangan Program / Aktiviti Agihan Yang Berjaya Dilaksanakan (KPI)'
      );
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
      'Nama Program / Aktiviti',
      'Nama PIC',
      'Lokasi Program',
      'Tarikh Program',
      'Catatan',
      'Didaftarkan Oleh',
      'Tarikh Dicipta'
    ];

    const rows = filteredItems.map((item, idx) => [
      idx + 1,
      `"${(item.namaProgram || '').replace(/"/g, '""')}"`,
      `"${(item.namaPic || '').replace(/"/g, '""')}"`,
      `"${(item.lokasi || '').replace(/"/g, '""')}"`,
      `"${item.tarikh || ''}"`,
      `"${(item.catatan || '').replace(/"/g, '""')}"`,
      `"${(item.createdBy || '').replace(/"/g, '""')}"`,
      `"${item.createdAt || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Program_Agihan_KPI_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Copy Text Summary
  const handleCopySummary = () => {
    const text = `🏆 LAPORAN PENCAPAIAN PROGRAM / AKTIVITI AGIHAN (KPI)
Dijana pada: ${reportGeneratedAt}
Lembaga Zakat Selangor (LZS) - Daerah Hulu Langat

PENCAPAIAN KPI:
• Jumlah Program / Aktiviti Berjaya: ${total} Program
• Jumlah Pegawai / PIC Terlibat: ${uniquePics} Orang
• Jumlah Lokasi Agihan: ${uniqueLocations} Lokasi

SENARAI PROGRAM (${filteredItems.length} rekod):
${filteredItems.map((item, i) => `${i + 1}. ${item.namaProgram}\n   - PIC: ${item.namaPic}\n   - Lokasi: ${item.lokasi}\n   - Tarikh: ${item.tarikh}${item.catatan ? `\n   - Catatan: ${item.catatan}` : ''}`).join('\n\n')}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between gap-4 shrink-0 print:bg-white print:text-slate-900 print:border-b-2 print:border-slate-800 print:p-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center print:border-slate-800 print:text-slate-900">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Laporan Bilangan Program / Aktiviti Agihan Yang Berjaya Dilaksanakan (KPI)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {total} Program Berjaya
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 print:text-slate-600">
                Pencapaian KPI Program Agihan LZS Daerah Hulu Langat · Dijana: {reportGeneratedAt}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all print:hidden"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search filter */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari program, lokasi, PIC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            {/* PIC filter */}
            {picList.length > 0 && (
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={filterPic}
                  onChange={(e) => setFilterPic(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="all">Semua PIC ({picList.length})</option>
                  {picList.map((pic) => (
                    <option key={pic} value={pic}>
                      {pic}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Disalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Salin Teks Ringkasan</span>
                </>
              )}
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Eksport CSV</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
          </div>
        </div>

        {/* Modal Body / Report Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-600/20 border border-emerald-500/40">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-100">
                  Jumlah Program Berjaya (KPI)
                </span>
                <Award className="w-5 h-5 text-emerald-200" />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono my-1">{total}</div>
              <p className="text-[11px] text-emerald-100 font-medium">
                100% Berjaya Selesai Dilaksanakan
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-600/20 border border-blue-500/40">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-100">
                  Pegawai PIC Terlibat
                </span>
                <User className="w-5 h-5 text-blue-200" />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono my-1">{uniquePics}</div>
              <p className="text-[11px] text-blue-100 font-medium">
                Pegawai Penggerak Program Agihan
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-md border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  Lokasi / Kawasan Agihan
                </span>
                <MapPin className="w-5 h-5 text-slate-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono my-1">{uniqueLocations}</div>
              <p className="text-[11px] text-slate-400 font-medium">
                Kawasan Liputan Daerah Hulu Langat
              </p>
            </div>
          </div>

          {/* Table Details */}
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                Senarai Terperinci Program & Aktiviti Agihan ({total} Rekod)
              </h3>
              <span className="text-[11px] font-bold text-slate-500">
                Pencapaian KPI Rasmi
              </span>
            </div>

            {filteredItems.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl p-6 text-slate-400 text-xs">
                Tiada rekod program agihan yang sepadan dengan penapis.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-black uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-3 text-center w-12">Bil.</th>
                      <th className="py-3 px-4 min-w-[220px]">Nama Program / Aktiviti</th>
                      <th className="py-3 px-4 min-w-[160px]">Nama PIC</th>
                      <th className="py-3 px-4 min-w-[180px]">Lokasi Program</th>
                      <th className="py-3 px-4 min-w-[130px]">Tarikh Program</th>
                      <th className="py-3 px-4 min-w-[120px]">Didaftarkan Oleh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredItems.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-emerald-50/30 transition-colors">
                        <td className="py-3 px-3 text-center font-bold text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                            {item.namaProgram}
                          </div>
                          {item.catatan && (
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Catatan: {item.catatan}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-200 font-bold text-xs">
                            <User className="w-3 h-3 text-indigo-600" />
                            {item.namaPic}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{item.lokasi}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                            <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>
                              {new Date(item.tarikh).toLocaleDateString('ms-MY', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-medium text-[11px]">
                          {item.createdBy || 'Pentadbir'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="text-[11px] text-slate-500">
            Jumlah rekod: <span className="font-bold text-slate-800">{filteredItems.length}</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
