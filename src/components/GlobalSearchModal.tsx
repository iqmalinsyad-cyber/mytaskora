import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  FileText, 
  CheckSquare, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  User, 
  Tag, 
  Layers, 
  AlertTriangle,
  ArrowRight,
  ListFilter
} from 'lucide-react';
import { AduanCase, TaskItem } from '../types';
import { taskService } from '../services/taskService';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  cases: AduanCase[];
  tasks?: TaskItem[];
  onSelectCase: (aduan: AduanCase) => void;
  onSelectTask: (task: TaskItem) => void;
  initialQuery?: string;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  cases,
  tasks: propTasks,
  onSelectCase,
  onSelectTask,
  initialQuery = '',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<'all' | 'aduan' | 'tasks'>('all');
  const [tasks, setTasks] = useState<TaskItem[]>(propTasks || taskService.getTasks());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery || '');
      setTasks(taskService.getTasks());
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, initialQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const trimmedQuery = query.trim().toLowerCase();

  // Search in Aduan
  const matchedCases = trimmedQuery
    ? cases.filter((c) => {
        return (
          c.noRujukan.toLowerCase().includes(trimmedQuery) ||
          c.namaPengadu.toLowerCase().includes(trimmedQuery) ||
          (c.telefonPengadu && c.telefonPengadu.toLowerCase().includes(trimmedQuery)) ||
          (c.alamat && c.alamat.toLowerCase().includes(trimmedQuery)) ||
          (c.tajuk && c.tajuk.toLowerCase().includes(trimmedQuery)) ||
          (c.kategori && c.kategori.toLowerCase().includes(trimmedQuery)) ||
          (c.penerangan && c.penerangan.toLowerCase().includes(trimmedQuery)) ||
          (c.catatanKes && c.catatanKes.toLowerCase().includes(trimmedQuery)) ||
          (c.status && c.status.toLowerCase().includes(trimmedQuery)) ||
          (c.tindakan && c.tindakan.toLowerCase().includes(trimmedQuery)) ||
          (c.sumberAduan && c.sumberAduan.toLowerCase().includes(trimmedQuery))
        );
      })
    : cases.slice(0, 6);

  // Search in Tasks
  const matchedTasks = trimmedQuery
    ? tasks.filter((t) => {
        return (
          t.namaTask.toLowerCase().includes(trimmedQuery) ||
          (t.keterangan && t.keterangan.toLowerCase().includes(trimmedQuery)) ||
          (t.catatan && t.catatan.toLowerCase().includes(trimmedQuery)) ||
          (t.status && t.status.toLowerCase().includes(trimmedQuery)) ||
          (t.tempoh && t.tempoh.toLowerCase().includes(trimmedQuery)) ||
          (t.createdBy && t.createdBy.toLowerCase().includes(trimmedQuery))
        );
      })
    : tasks.slice(0, 6);

  const totalResults = matchedCases.length + matchedTasks.length;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-8 sm:pt-16 p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div 
        className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col my-auto sm:my-0 max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <Search className="w-5 h-5" />
          </div>
          
          <input
            ref={inputRef}
            type="text"
            placeholder="Cari no. rujukan aduan, nama pengadu, task, penerangan..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-sm sm:text-base font-semibold text-slate-900 focus:outline-none placeholder:text-slate-400 bg-transparent"
          />

          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-500 shadow-2xs">
            <span>ESC</span>
          </div>

          <button 
            onClick={onClose} 
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Category Tabs */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-slate-100 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>Semua Hasil</span>
            <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px]">
              {trimmedQuery ? totalResults : cases.length + tasks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('aduan')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'aduan'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Kes Aduan</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
              activeTab === 'aduan' ? 'bg-white/20 text-white' : 'bg-indigo-200/60 text-indigo-900'
            }`}>
              {matchedCases.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'tasks'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Pengurusan Task</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
              activeTab === 'tasks' ? 'bg-white/20 text-white' : 'bg-emerald-200/60 text-emerald-950'
            }`}>
              {matchedTasks.length}
            </span>
          </button>
        </div>

        {/* Results Container */}
        <div className="p-3 sm:p-4 max-h-[60vh] overflow-y-auto space-y-4">
          {totalResults === 0 && trimmedQuery ? (
            <div className="py-12 px-4 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-700">Tiada rekod dijumpai</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Tiada padanan untuk carian "<strong>{query}</strong>" dalam Kes Aduan mahupun Pengurusan Task.
              </p>
            </div>
          ) : (
            <>
              {/* SECTION: KES ADUAN */}
              {(activeTab === 'all' || activeTab === 'aduan') && matchedCases.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-2 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 text-indigo-700">
                      <FileText className="w-3.5 h-3.5" />
                      Kes Aduan ({matchedCases.length})
                    </span>
                    <span className="text-[10px] text-slate-400">Klik untuk buka maklumat kes</span>
                  </div>

                  <div className="space-y-1.5">
                    {matchedCases.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          onSelectCase(c);
                          onClose();
                        }}
                        className="w-full p-3 rounded-2xl bg-white hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-300 flex items-center justify-between text-left transition-all cursor-pointer group shadow-2xs"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[11px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                              {c.noRujukan}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                              c.status === 'Selesai'
                                ? 'bg-emerald-100 text-emerald-800'
                                : c.status === 'Ditolak'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {c.status}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              {c.kategori || c.sumberAduan}
                            </span>
                          </div>

                          <div className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                            {c.namaPengadu} — {c.tajuk || c.penerangan || 'Tiada butiran tajuk'}
                          </div>

                          <div className="flex items-center gap-3 text-[10px] text-slate-400">
                            {c.telefonPengadu && <span>Tel: {c.telefonPengadu}</span>}
                            {c.tindakan && <span>Tindakan: {c.tindakan}</span>}
                            <span>Tarikh: {new Date(c.tarikhAduan).toLocaleDateString('ms-MY')}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pl-3">
                          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                            <span>Buka Kes</span>
                            <ArrowRight className="w-3 h-3" />
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION: PENGURUSAN TASK */}
              {(activeTab === 'all' || activeTab === 'tasks') && matchedTasks.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between px-2 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 text-emerald-700">
                      <CheckSquare className="w-3.5 h-3.5" />
                      Pengurusan Task ({matchedTasks.length})
                    </span>
                    <span className="text-[10px] text-slate-400">Klik untuk lihat / kemaskini task</span>
                  </div>

                  <div className="space-y-1.5">
                    {matchedTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => {
                          onSelectTask(t);
                          onClose();
                        }}
                        className="w-full p-3 rounded-2xl bg-white hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 flex items-center justify-between text-left transition-all cursor-pointer group shadow-2xs"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                              t.status === 'Selesai'
                                ? 'bg-emerald-100 text-emerald-800'
                                : t.status === 'Batal'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {t.status === 'Selesai' && <CheckCircle2 className="w-3 h-3" />}
                              {t.status === 'Dalam Proses' && <Clock className="w-3 h-3" />}
                              {t.status === 'Batal' && <XCircle className="w-3 h-3" />}
                              <span>{t.status}</span>
                            </span>

                            {t.adaTempoh === 'Ada' && t.tempoh && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                <Calendar className="w-2.5 h-2.5" />
                                <span>{t.tempoh}</span>
                              </span>
                            )}

                            {t.createdBy && (
                              <span className="text-[10px] text-slate-400 font-medium">
                                Dicipta oleh: {t.createdBy}
                              </span>
                            )}
                          </div>

                          <div className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                            {t.namaTask}
                          </div>

                          {t.keterangan && (
                            <p className="text-[11px] text-slate-500 line-clamp-1">
                              {t.keterangan}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 pl-3">
                          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                            <span>Urus Task</span>
                            <ArrowRight className="w-3 h-3" />
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer tip */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium px-4">
          <span>Gunakan carian pantas untuk mencari sebarang fail aduan atau pengurusan tugasan.</span>
          <span className="hidden sm:inline text-[10px] text-slate-400">Tekan ⌘K / Carian Header</span>
        </div>
      </div>
    </div>
  );
};
