import React from 'react';
import { AduanCase, AduanStatus } from '../types';
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Plus, 
  ChevronRight,
  User,
  MapPin,
  Calendar
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
  const columns: { status: AduanStatus; title: string; color: string; headerBg: string }[] = [
    { status: 'Belum Disahkan', title: 'Belum Disahkan', color: 'border-purple-300 text-purple-800', headerBg: 'bg-purple-50' },
    { status: 'Dalam Siasatan', title: 'Dalam Siasatan', color: 'border-blue-300 text-blue-800', headerBg: 'bg-blue-50' },
    { status: 'Perlu Maklumat', title: 'Perlu Maklumat', color: 'border-amber-300 text-amber-800', headerBg: 'bg-amber-50' },
    { status: 'Selesai', title: 'Selesai', color: 'border-emerald-300 text-emerald-800', headerBg: 'bg-emerald-50' },
    { status: 'Ditolak', title: 'Ditolak', color: 'border-gray-300 text-gray-700', headerBg: 'bg-gray-100' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">
            Paparan Aduan
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Atur dan alih status kes aduan mengikut fasa siasatan & tindakan.
          </p>
        </div>
        <button
          onClick={onOpenNewAduanModal}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all shadow-xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Tambah Aduan</span>
        </button>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3 lg:gap-4 overflow-x-auto pb-4">
        {columns.map((col) => {
          const colCases = cases.filter(c => c.status === col.status);
          return (
            <div key={col.status} className="bg-gray-50/80 rounded-2xl p-3 border border-gray-200/60 min-w-[260px] flex flex-col h-[70vh]">
              {/* Column Header */}
              <div className={`p-3 rounded-xl ${col.headerBg} border ${col.color} flex items-center justify-between mb-3 shadow-2xs`}>
                <span className="text-xs font-bold">{col.title}</span>
                <span className="w-5 h-5 rounded-full bg-white/80 text-gray-900 text-[10px] font-black flex items-center justify-center border border-gray-200">
                  {colCases.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {colCases.length === 0 ? (
                  <div className="h-24 rounded-xl border border-dashed border-gray-300 flex items-center justify-center text-[11px] text-gray-400">
                    Tiada kes
                  </div>
                ) : (
                  colCases.map((aduan) => (
                    <div
                      key={aduan.id}
                      onClick={() => onSelectCase(aduan)}
                      className="bg-white rounded-xl p-3.5 border border-gray-200/80 shadow-2xs hover:shadow-md transition-all cursor-pointer group space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-gray-400">
                          {aduan.noRujukan}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          aduan.prioriti === 'Kritikal' ? 'bg-rose-100 text-rose-800' :
                          aduan.prioriti === 'Tinggi' ? 'bg-orange-100 text-orange-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {aduan.prioriti}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-[#0d3b2e] transition-colors">
                        {aduan.tajuk}
                      </h4>

                      <div className="text-[11px] text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="truncate">{aduan.lokasi || 'Dalam Talian'}</span>
                      </div>

                      {/* Footer: Assignee & Action notes count */}
                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <img
                            src={aduan.assigneeAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(aduan.assignee || 'Officer')}&backgroundColor=3b82f6`}
                            alt={aduan.assignee}
                            onError={(e) => {
                              e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(aduan.assignee || 'Officer')}&backgroundColor=3b82f6`;
                            }}
                            className="w-5 h-5 rounded-full object-cover border border-gray-200 bg-gray-100"
                          />
                          <span className="text-[10px] font-semibold text-gray-700">{aduan.assignee.split(' ')[0]}</span>
                        </div>

                        {aduan.catatan && aduan.catatan.length > 0 && (
                          <span className="text-[9px] font-bold bg-[#e6f4ea] text-[#0d3b2e] px-1.5 py-0.5 rounded-md">
                            {aduan.catatan.length} Catatan
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
