import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Eye,
  Edit3,
  Plus,
  Trash2,
  User,
  Tag,
  Phone,
  MapPin,
  Image as ImageIcon,
  HelpCircle,
  FileText,
  Sparkles,
  FileSpreadsheet,
  Printer,
  Download
} from 'lucide-react';
import { AduanReportModal } from './AduanReportModal';
import { calculateCaseSLA } from '../utils/slaUtils';
import {
  AduanCase,
  AduanStatus,
  SumberAduan,
  TindakanAduan,
  SyorBantuan,
  FilterOptions,
} from '../types';

interface AduanListProps {
  cases: AduanCase[];
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  onSelectCase: (aduan: AduanCase) => void;
  onEditCase: (aduan: AduanCase) => void;
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
  onEditCase,
  onUpdateStatus,
  onOpenNewAduanModal,
  onOpenNoteModal,
  onDeleteCase,
}) => {
  const [activeTab, setActiveTab] = useState<string>(filters.status || 'all');
  const [caseToDeleteConfirm, setCaseToDeleteConfirm] = useState<{ id: string; noRujukan: string; namaPengadu: string } | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    setActiveTab(filters.status || 'all');
  }, [filters.status]);

  const handleTabChange = (status: string) => {
    setActiveTab(status);
    setFilters((prev) => ({ ...prev, status }));
  };

  // Status Badge UI
  const getStatusBadge = (s: AduanStatus) => {
    switch (s) {
      case 'Belum Selesai':
      case 'Belum Disahkan':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-[11px] font-bold border border-rose-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            Belum Selesai
          </span>
        );
      case 'Dalam Siasatan':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Dalam Siasatan
          </span>
        );
      case 'Perlu Maklumat (KIV)':
      case 'Perlu Maklumat':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Perlu Maklumat (KIV)
          </span>
        );
      case 'Selesai':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Selesai
          </span>
        );
      case 'Ditolak':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-300 shadow-2xs">
            <XCircle className="w-3.5 h-3.5 text-slate-500" />
            Ditolak
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold">
            {s}
          </span>
        );
    }
  };

  // Sumber Aduan Badge
  const getSumberBadge = (sumber: SumberAduan) => {
    const colorMap: Record<SumberAduan, string> = {
      CMU: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'Aduan Awam': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      Parlimen: 'bg-purple-50 text-purple-700 border-purple-200',
      Adun: 'bg-sky-50 text-sky-700 border-sky-200',
      HQ: 'bg-amber-50 text-amber-800 border-amber-200',
      MAIS: 'bg-teal-50 text-teal-700 border-teal-200',
      JAIS: 'bg-blue-50 text-blue-700 border-blue-200',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold border ${colorMap[sumber] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
        {sumber}
      </span>
    );
  };

  // Tindakan Badge
  const getTindakanBadge = (t: TindakanAduan) => {
    switch (t) {
      case 'Telah Diproses':
        return <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[11px]">Telah Diproses</span>;
      case 'KIV':
        return <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-700 font-bold border border-amber-200 text-[11px]">KIV</span>;
      case 'Belum Di Proses':
      default:
        return <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-bold border border-slate-200 text-[11px]">Belum Di Proses</span>;
    }
  };

  // Syor Bantuan Badge
  const getSyorBadge = (s: SyorBantuan) => {
    if (s === 'Ada') {
      return <span className="px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700 font-bold border border-violet-200 text-[11px]">Ada</span>;
    }
    return <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium border border-slate-200 text-[11px]">Tiada</span>;
  };

  // SLA Calculation: Mengikut 4 peringkat SLA (<48j, <72j, <96j, >96j Tidak Patuh)
  const getSlaDisplay = (aduan: AduanCase) => {
    const sla = calculateCaseSLA(aduan);
    const isClosed = aduan.status === 'Selesai' || aduan.status === 'Ditolak';

    return (
      <div className="flex flex-col">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-extrabold border ${sla.badgeBg} ${sla.badgeText} ${sla.badgeBorder}`}>
          <Clock className="w-3 h-3" />
          <span>{sla.tierLabel}</span>
        </span>
        <span className={`text-[10px] font-bold mt-0.5 ${sla.isCompliant ? 'text-emerald-700' : 'text-rose-700'}`}>
          {sla.elapsedHours}j · {isClosed ? (sla.isCompliant ? 'Selesai (Patuh)' : 'Selesai (>96j)') : (sla.isCompliant ? 'Patuh SLA' : 'Tidak Patuh')}
        </span>
      </div>
    );
  };

  const tabs = [
    { id: 'all', label: 'Semua Aduan' },
    { id: 'Belum Selesai', label: 'Belum Selesai' },
    { id: 'Dalam Siasatan', label: 'Dalam Siasatan' },
    { id: 'Perlu Maklumat (KIV)', label: 'Perlu Maklumat (KIV)' },
    { id: 'Selesai', label: 'Selesai' },
    { id: 'Ditolak', label: 'Ditolak' },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-6 space-y-5">
      {/* Top Header & New Complaint Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Senarai Kes Aduan</span>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-extrabold border border-indigo-100">
              {cases.length} Kes Ditemui
            </span>
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Sistem pengurusan aduan berpusat dengan pengesanan SLA automatik & auto-sync Firestore Firebase.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => setIsReportModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-700 text-xs font-extrabold border border-slate-200 hover:border-indigo-300 shadow-2xs flex items-center gap-2 transition-all cursor-pointer"
            title="Jana Laporan Terkini Kes Aduan"
          >
            <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
            <span>Jana Laporan</span>
          </button>

          <button
            type="button"
            onClick={onOpenNewAduanModal}
            className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Daftar Aduan Baharu</span>
          </button>
        </div>
      </div>

      {/* Status Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-100 overflow-x-auto pb-2 scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Search Field (Nama & No Rujukan) */}
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari mengikut Nama atau No Rujukan..."
            value={filters.searchQuery}
            onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        {/* Filter: Sumber Aduan */}
        <div>
          <select
            value={filters.sumberAduan || 'all'}
            onChange={(e) => setFilters((prev) => ({ ...prev, sumberAduan: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all cursor-pointer"
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

        {/* Filter: Tindakan */}
        <div>
          <select
            value={filters.tindakan || 'all'}
            onChange={(e) => setFilters((prev) => ({ ...prev, tindakan: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all cursor-pointer"
          >
            <option value="all">Semua Tindakan</option>
            <option value="Belum Di Proses">Belum Di Proses</option>
            <option value="KIV">KIV</option>
            <option value="Telah Diproses">Telah Diproses</option>
          </select>
        </div>
      </div>

      {/* Main Complaints Data Table (Exact required fields in main table) */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs">
        <table className="w-full text-left border-collapse min-w-[760px]">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
              <th className="p-3.5">Nama & Rujukan</th>
              <th className="p-3.5">Sumber Aduan</th>
              <th className="p-3.5">Status Aduan</th>
              <th className="p-3.5">Tindakan</th>
              <th className="p-3.5">Syor Bantuan</th>
              <th className="p-3.5">SLA Aduan</th>
              <th className="p-3.5 text-right">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {cases.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-10 text-center text-slate-400">
                  <div className="max-w-xs mx-auto space-y-2">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-600">Tiada kes aduan ditemui</p>
                    <p className="text-[11px] text-slate-400">Cuba ubah kata kunci carian atau tetapan penapis di atas.</p>
                  </div>
                </td>
              </tr>
            ) : (
              cases.map((aduan) => (
                <tr key={aduan.id} className="hover:bg-slate-50/70 transition-colors group">
                  {/* 1. Nama & No Rujukan */}
                  <td className="p-3.5">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold shrink-0 mt-0.5">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-900 line-clamp-1">
                          {aduan.namaPengadu}
                        </div>
                        <div className="font-mono text-[11px] font-semibold text-indigo-600 flex items-center gap-1.5 mt-0.5">
                          <span>{aduan.noRujukan}</span>
                          {aduan.gambarSiasatan && aduan.gambarSiasatan.length > 0 && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-50 text-[10px] font-bold text-amber-700 border border-amber-200">
                              <ImageIcon className="w-2.5 h-2.5" />
                              <span>{aduan.gambarSiasatan.length}</span>
                            </span>
                          )}
                          {aduan.catatan && aduan.catatan.length > 0 && (
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-[10px] font-semibold text-slate-600">
                              {aduan.catatan.length} Catatan
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 2. Sumber Aduan */}
                  <td className="p-3.5">
                    {getSumberBadge(aduan.sumberAduan)}
                  </td>

                  {/* 3. Status Aduan */}
                  <td className="p-3.5">
                    {getStatusBadge(aduan.status)}
                  </td>

                  {/* 4. Tindakan */}
                  <td className="p-3.5">
                    {getTindakanBadge(aduan.tindakan)}
                  </td>

                  {/* 5. Syor Bantuan */}
                  <td className="p-3.5">
                    {getSyorBadge(aduan.syorBantuan)}
                  </td>

                  {/* 6. SLA (Auto nyatakan sudah berapa hari) */}
                  <td className="p-3.5">
                    {getSlaDisplay(aduan)}
                  </td>

                  {/* 7. Butang View & Butang Kemaskini */}
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Butang View */}
                      <button
                        type="button"
                        onClick={() => onSelectCase(aduan)}
                        title="Lihat Butiran Aduan (View)"
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-bold text-[11px] transition-all flex items-center gap-1 border border-slate-200 hover:border-indigo-200"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>

                      {/* Butang Kemaskini */}
                      <button
                        type="button"
                        onClick={() => onEditCase(aduan)}
                        title="Kemaskini Kes Aduan"
                        className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] transition-all flex items-center gap-1 border border-amber-200"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Kemaskini</span>
                      </button>

                      {/* Optional: Delete Case */}
                      {onDeleteCase && (
                        <button
                          type="button"
                          onClick={() => {
                            setCaseToDeleteConfirm({
                              id: aduan.id,
                              noRujukan: aduan.noRujukan,
                              namaPengadu: aduan.namaPengadu,
                            });
                          }}
                          title="Padam Rekod Kes"
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* MODAL PENGESAHAN PADAM KES ADUAN */}
      {caseToDeleteConfirm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-rose-100 space-y-4 text-left">
            <div className="flex items-center gap-3 text-rose-600 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Padam Rekod Kes Aduan</h3>
                <p className="text-[11px] text-slate-500">Tindakan ini kekal & auto-delete di Firebase</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Adakah anda pasti mahu memadamkan rekod aduan <strong className="text-slate-900 font-bold">[{caseToDeleteConfirm.noRujukan}] - {caseToDeleteConfirm.namaPengadu}</strong>?
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
                <span>Ya, Padam Kekal</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Laporan Aduan Terkini */}
      <AduanReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        cases={cases}
      />
    </div>
  );
};
