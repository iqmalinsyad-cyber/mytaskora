import React from 'react';
import { AduanCase, AduanStatus, SumberAduan } from '../types';
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Plus, 
  ChevronRight,
  User,
  MapPin,
  Calendar,
  Tag,
  Phone,
  FileText
} from 'lucide-react';

interface AduanKanbanProps {
  cases: AduanCase[];
  onSelectCase: (aduan: AduanCase) => void;
  onUpdateStatus: (id: string, newStatus: AduanStatus) => void;
  onOpenNewAduanModal: () => void;
}

export const AduanKanban: React.FC<AduanKanbanProps> = ({
  cases,
  onSelectCase,
  onUpdateStatus,
  onOpenNewAduanModal,
}) => {
  const columns: { status: AduanStatus; title: string; color: string; headerBg: string; badgeBg: string }[] = [
    { 
      status: 'Belum Selesai', 
      title: 'Belum Selesai', 
      color: 'border-rose-200 text-rose-800', 
      headerBg: 'bg-rose-50',
      badgeBg: 'bg-rose-100 text-rose-700 border-rose-200'
    },
    { 
      status: 'Dalam Siasatan', 
      title: 'Dalam Siasatan', 
      color: 'border-blue-200 text-blue-800', 
      headerBg: 'bg-blue-50',
      badgeBg: 'bg-blue-100 text-blue-700 border-blue-200'
    },
    { 
      status: 'Perlu Maklumat (KIV)', 
      title: 'Perlu Maklumat (KIV)', 
      color: 'border-amber-200 text-amber-800', 
      headerBg: 'bg-amber-50',
      badgeBg: 'bg-amber-100 text-amber-700 border-amber-200'
    },
    { 
      status: 'Selesai', 
      title: 'Selesai', 
      color: 'border-emerald-200 text-emerald-800', 
      headerBg: 'bg-emerald-50',
      badgeBg: 'bg-emerald-100 text-emerald-700 border-emerald-200'
    },
    { 
      status: 'Ditolak', 
      title: 'Ditolak', 
      color: 'border-slate-300 text-slate-700', 
      headerBg: 'bg-slate-100',
      badgeBg: 'bg-slate-200 text-slate-700 border-slate-300'
    },
  ];

  // Sumber badge styling
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
      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${colorMap[sumber] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
        {sumber}
      </span>
    );
  };

  // SLA Calculation
  const getSlaInfo = (aduan: AduanCase) => {
    const isClosed = aduan.status === 'Selesai' || aduan.status === 'Ditolak';
    const createdDate = new Date(aduan.tarikhAduan || aduan.updatedAt || Date.now());

    if (isClosed) {
      const endDate = aduan.tarikhSelesai ? new Date(aduan.tarikhSelesai) : new Date(aduan.updatedAt || Date.now());
      const totalDays = Math.max(0, Math.round((endDate.getTime() - createdDate.getTime()) / (1000 * 3600 * 24)));
      return {
        label: `Selesai (${totalDays}h)`,
        style: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    }

    const now = new Date();
    const activeDays = Math.max(0, Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24)));

    if (activeDays >= 7) {
      return { label: `${activeDays} Hari`, style: 'bg-rose-50 text-rose-700 border-rose-200 font-extrabold' };
    } else if (activeDays >= 3) {
      return { label: `${activeDays} Hari`, style: 'bg-amber-50 text-amber-700 border-amber-200 font-extrabold' };
    }
    return { label: activeDays === 0 ? 'Hari Pertama' : `${activeDays} Hari`, style: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Paparan Aduan (Papan Fasa)</span>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
              {cases.length} Kes
            </span>
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Susun atur fasa kes aduan dari status Belum Selesai hingga Selesai dengan penyegerakan automatik ke Firebase.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenNewAduanModal}
          className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-xs font-extrabold shadow-md shadow-indigo-600/20 flex items-center gap-2 self-start sm:self-auto transition-all"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Daftar Aduan Baharu</span>
        </button>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3 lg:gap-4 overflow-x-auto pb-4">
        {columns.map((col) => {
          const colCases = cases.filter((c) => {
            if (col.status === 'Belum Selesai') {
              return c.status === 'Belum Selesai' || c.status === 'Belum Disahkan';
            }
            if (col.status === 'Perlu Maklumat (KIV)') {
              return c.status === 'Perlu Maklumat (KIV)' || c.status === 'Perlu Maklumat';
            }
            return c.status === col.status;
          });

          return (
            <div
              key={col.status}
              className="bg-slate-50/80 rounded-3xl p-3 border border-slate-200/80 min-w-[270px] flex flex-col h-[74vh]"
            >
              {/* Column Header */}
              <div
                className={`p-3 rounded-2xl ${col.headerBg} border ${col.color} flex items-center justify-between mb-3 shadow-2xs`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-slate-900">{col.title}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-black border ${col.badgeBg}`}
                >
                  {colCases.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {colCases.length === 0 ? (
                  <div className="h-28 rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-center p-3 text-slate-400">
                    <span className="text-xs font-medium">Tiada kes dalam fasa ini</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">0 kes</span>
                  </div>
                ) : (
                  colCases.map((aduan) => {
                    const sla = getSlaInfo(aduan);
                    return (
                      <div
                        key={aduan.id}
                        onClick={() => onSelectCase(aduan)}
                        className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group space-y-2.5"
                      >
                        {/* Top: No Rujukan & Sumber */}
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {aduan.noRujukan}
                          </span>
                          {getSumberBadge(aduan.sumberAduan)}
                        </div>

                        {/* Pengadu & Tajuk / Catatan Kes */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                            {aduan.namaPengadu}
                          </h4>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                            {aduan.catatanKes || aduan.penerangan || aduan.tajuk}
                          </p>
                        </div>

                        {/* Lokasi / Alamat */}
                        {aduan.alamat && (
                          <div className="text-[10px] text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{aduan.alamat}</span>
                          </div>
                        )}

                        {/* SLA & Tindakan Row */}
                        <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-slate-100">
                          <div className="flex items-center gap-1">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${sla.style}`}>
                              <Clock className="w-2.5 h-2.5" />
                              <span>{sla.label}</span>
                            </span>
                          </div>

                          {aduan.tindakan && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              aduan.tindakan === 'Telah Diproses' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              aduan.tindakan === 'KIV' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              {aduan.tindakan}
                            </span>
                          )}
                        </div>

                        {/* Footer: Quick Status Switcher & Catatan Count */}
                        <div
                          className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <select
                            value={
                              aduan.status === 'Belum Disahkan' ? 'Belum Selesai' :
                              aduan.status === 'Perlu Maklumat' ? 'Perlu Maklumat (KIV)' :
                              aduan.status
                            }
                            onChange={(e) => onUpdateStatus(aduan.id, e.target.value as AduanStatus)}
                            className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer max-w-[145px]"
                          >
                            <option value="Belum Selesai">Belum Selesai</option>
                            <option value="Dalam Siasatan">Dalam Siasatan</option>
                            <option value="Perlu Maklumat (KIV)">Perlu Maklumat (KIV)</option>
                            <option value="Selesai">Selesai</option>
                            <option value="Ditolak">Ditolak</option>
                          </select>

                          {aduan.catatan && aduan.catatan.length > 0 && (
                            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100 flex items-center gap-1 shrink-0">
                              <FileText className="w-2.5 h-2.5" />
                              <span>{aduan.catatan.length}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

