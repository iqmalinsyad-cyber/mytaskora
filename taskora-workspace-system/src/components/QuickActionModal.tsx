import React from 'react';
import { X, PlusCircle, FileText, Database, FileSpreadsheet, ChevronRight, Sparkles } from 'lucide-react';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewAduan: () => void;
  onOpenCatatanFormat: () => void;
  onOpenSupabase: () => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  isOpen,
  onClose,
  onOpenNewAduan,
  onOpenCatatanFormat,
  onOpenSupabase,
}) => {
  if (!isOpen) return null;

  const actions = [
    {
      title: 'Daftar Aduan Baharu',
      desc: 'Daftar kes aduan awam atau kerosakan fasiliti baharu',
      icon: PlusCircle,
      action: () => { onClose(); onOpenNewAduan(); }
    },
    {
      title: 'Format / Template Catatan',
      desc: 'Gunakan template minit perbincangan, surat rasmi atau laporan siasatan tapak',
      icon: FileText,
      action: () => { onClose(); onOpenCatatanFormat(); }
    },
    {
      title: 'Integrasi Supabase Realtime',
      desc: 'Sambung atau urus tetapan pangkalan data Supabase',
      icon: Database,
      action: () => { onClose(); onOpenSupabase(); }
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-extrabold text-slate-800">Pilihan Tindakan Pantas</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {actions.map((act, idx) => {
            const Icon = act.icon;
            return (
              <button
                key={idx}
                onClick={act.action}
                className="w-full p-4 rounded-xl border border-slate-200 hover:border-indigo-600 hover:bg-indigo-50/40 transition-all text-left flex items-center justify-between group shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white flex items-center justify-center transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900 group-hover:text-indigo-600">{act.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{act.desc}</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
