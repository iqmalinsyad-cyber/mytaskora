import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  ChevronRight, 
  Plus, 
  MoreHorizontal,
  UserCheck,
  FileText,
  MapPin,
  Calendar,
  Sparkles,
  Trash2
} from 'lucide-react';
import { AduanCase, AduanStatus, AduanPriority, AduanCategory, FilterOptions } from '../types';

interface AduanListProps {
  cases: AduanCase[];
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  onSelectCase: (aduan: AduanCase) => void;
  onUpdateStatus: (id: string, newStatus: AduanStatus) => void;
  onOpenNewAduanModal: () => void;
  onOpenNoteModal: (aduan: AduanCase) => void;
  onDeleteCase?: (id: string) => void;
}

export const AduanList: React.FC<AduanListProps> = ({
  cases,
  filters,
  setFilters,
  onSelectCase,
  onUpdateStatus,
  onOpenNewAduanModal,
  onOpenNoteModal,
  onDeleteCase,
}) => {
  const [activeTab, setActiveTab] = useState<string>(filters.status || 'all');
  const [caseToDeleteConfirm, setCaseToDeleteConfirm] = useState<{ id: string; noRujukan: string; tajuk: string } | null>(null);

  const handleTabChange = (status: string) => {
    setActiveTab(status);
    setFilters(prev => ({ ...prev, status }));
  };

  const getPriorityBadge = (p: AduanPriority) => {
    switch (p) {
      case 'Kritikal':
        return <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">Kritikal</span>;
      case 'Tinggi':
        return <span className="px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 text-[10px] font-bold border border-orange-200">Tinggi</span>;
      case 'Sederhana':
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">Sederhana</span>;
      case 'Rendah':
        return <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">Rendah</span>;
    }
  };

  const getStatusBadge = (s: AduanStatus) => {
    switch (s) {
      case 'Selesai':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Selesai
          </span>
        );
      case 'Dalam Siasatan':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-800 text-xs font-semibold border border-blue-200">
            <Clock className="w-3.5 h-3.5 text-blue-600 animate-spin-slow" />
            Dalam Siasatan
          </span>
        );
      case 'Perlu Maklumat':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Perlu Maklumat
          </span>
        );
      case 'Belum Disahkan':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-50 text-purple-800 text-xs font-semibold border border-purple-200">
            <Clock className="w-3.5 h-3.5 text-purple-600" />
            Belum Disahkan
          </span>
        );
      case 'Ditolak':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold border border-gray-200">
            <XCircle className="w-3.5 h-3.5 text-gray-500" />
            Ditolak
          </span>
        );
    }
  };

  const getSlaIndicator = (slaDateStr: string, status: AduanStatus) => {
    if (status === 'Selesai' || status === 'Ditolak') {
      return <span className="text-[11px] text-gray-400 font-medium">SLA Ditutup</span>;
    }

    const sla = new Date(slaDateStr);
    const now = new Date();
    const diffHours = Math.round((sla.getTime() - now.getTime()) / (1000 * 3600));

    if (diffHours < 0) {
      return (
        <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-300 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-rose-600" />
          LEWAT SLA ({Math.abs(Math.round(diffHours / 24))} hari)
        </span>
      );
    } else if (diffHours < 24) {
      return (
        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300">
          Tamat dlm {diffHours} jam
        </span>
      );
    } else {
      const days = Math.round(diffHours / 24);
      return (
        <span className="text-[11px] text-emerald-700 font-medium">
          Berbaki {days} hari
        </span>
      );
    }
  };

  const tabs = [
    { id: 'all', label: 'Semua Aduan' },
    { id: 'Belum Selesai', label: 'Belum Selesai' },
    { id: 'Dalam Siasatan', label: 'Dalam Siasatan' },
    { id: 'Perlu Maklumat', label: 'Perlu Maklumat' },
    { id: 'Selesai', label: 'Selesai' },
    { id: 'Ditolak', label: 'Ditolak' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-5 space-y-4">
      {/* Top Header & New Complaint Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <span>Senarai Aduan</span>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
              {cases.length} Rekod
            </span>
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Pantau status tindakan kes aduan awam, catatan siasatan, dan pematuhan SLA.
          </p>
        </div>

        <button
          onClick={onOpenNewAduanModal}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all shadow-xs flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Daftar Aduan Baharu</span>
        </button>
      </div>

      {/* Status Tabs Navigation */}
      <div className="flex items-center gap-1.5 border-b border-slate-100 overflow-x-auto pb-2 scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Search Field */}
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari rujukan, tajuk, nama pengadu..."
            value={filters.searchQuery}
            onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>

        {/* Category Dropdown Filter */}
        <select
          value={filters.category}
          onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
          className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="all">Semua Kategori</option>
          <option value="Infrastruktur & Bangunan">Infrastruktur & Bangunan</option>
          <option value="Perkhidmatan & Layanan">Perkhidmatan & Layanan</option>
          <option value="IT & Sistem">IT & Sistem</option>
          <option value="Kewangan & Pembayaran">Kewangan & Pembayaran</option>
          <option value="Tatatertib & Integriti">Tatatertib & Integriti</option>
          <option value="Lain-lain">Lain-lain</option>
        </select>

        {/* Priority Dropdown Filter */}
        <select
          value={filters.priority}
          onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
          className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="all">Semua Prioriti</option>
          <option value="Kritikal">Kritikal</option>
          <option value="Tinggi">Tinggi</option>
          <option value="Sederhana">Sederhana</option>
          <option value="Rendah">Rendah</option>
        </select>
      </div>

      {/* Main Complaints Data Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="p-3.5">No. Rujukan & Tajuk</th>
              <th className="p-3.5">Pengadu & Lokasi</th>
              <th className="p-3.5">Kategori & Prioriti</th>
              <th className="p-3.5">Status & Tindakan</th>
              <th className="p-3.5">SLA Count</th>
              <th className="p-3.5 text-right">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {cases.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">
                  Tiada kes aduan ditemui untuk carian atau penapis ini.
                </td>
              </tr>
            ) : (
              cases.map((aduan) => (
                <tr key={aduan.id} className="hover:bg-indigo-50/30 transition-colors group">
                  {/* No Rujukan & Tajuk */}
                  <td className="p-3.5">
                    <button
                      onClick={() => onSelectCase(aduan)}
                      className="text-left group-hover:text-indigo-600 transition-colors"
                    >
                      <div className="font-mono text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                        <span>{aduan.noRujukan}</span>
                        {aduan.catatan && aduan.catatan.length > 0 && (
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 text-[9px] font-semibold text-slate-600">
                            {aduan.catatan.length} Catatan
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-slate-900 line-clamp-1 max-w-xs mt-0.5">
                        {aduan.tajuk}
                      </div>
                    </button>
                  </td>

                  {/* Pengadu & Lokasi */}
                  <td className="p-3.5">
                    <div className="font-semibold text-slate-900">{aduan.namaPengadu}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate max-w-[140px]">{aduan.lokasi || 'Dalam Talian'}</span>
                    </div>
                  </td>

                  {/* Kategori & Prioriti */}
                  <td className="p-3.5">
                    <div className="font-medium text-slate-800">{aduan.kategori}</div>
                    <div className="mt-1">{getPriorityBadge(aduan.prioriti)}</div>
                  </td>

                  {/* Status Switcher */}
                  <td className="p-3.5">
                    <select
                      value={aduan.status}
                      onChange={(e) => onUpdateStatus(aduan.id, e.target.value as AduanStatus)}
                      className="text-xs font-bold rounded-lg border border-slate-200 bg-white py-1 px-2 text-slate-800 shadow-2xs focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                    >
                      <option value="Belum Disahkan">Belum Disahkan</option>
                      <option value="Dalam Siasatan">Dalam Siasatan</option>
                      <option value="Perlu Maklumat">Perlu Maklumat</option>
                      <option value="Selesai">Selesai</option>
                      <option value="Ditolak">Ditolak</option>
                    </select>
                  </td>

                  {/* SLA Count */}
                  <td className="p-3.5">
                    {getSlaIndicator(aduan.sasaranSLA, aduan.status)}
                  </td>

                  {/* Actions */}
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onOpenNoteModal(aduan)}
                        title="Tambah Catatan Siasatan / Format Minit"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onSelectCase(aduan)}
                        title="Lihat Butiran Penuh"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      {onDeleteCase && (
                        <button
                          onClick={() => {
                            setCaseToDeleteConfirm({
                              id: aduan.id,
                              noRujukan: aduan.noRujukan,
                              tajuk: aduan.tajuk,
                            });
                          }}
                          title="Padam Rekod Kes Aduan"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL PENGESAHAN PADAM KES ADUAN (Custom iframe-friendly modal) */}
      {caseToDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-rose-100 space-y-4 text-left">
            <div className="flex items-center gap-3 text-rose-600 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Padam Rekod Kes Aduan</h3>
                <p className="text-[11px] text-slate-500">Tindakan ini tidak boleh diundurkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Adakah anda pasti mahu memadamkan rekod kes aduan <strong className="text-slate-900 font-bold">[{caseToDeleteConfirm.noRujukan}] - {caseToDeleteConfirm.tajuk}</strong> secara kekal dari pangkalan data?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCaseToDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onDeleteCase) {
                    onDeleteCase(caseToDeleteConfirm.id);
                  }
                  setCaseToDeleteConfirm(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Padam Kes Ini</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
