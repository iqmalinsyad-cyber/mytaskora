import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  ArrowRight, 
  Calendar, 
  ChevronRight,
  TrendingUp,
  Tag,
  ListTodo,
  Layers,
  Sparkles,
  User
} from 'lucide-react';
import { TaskItem, TaskStatus, UserProfile } from '../types';
import { taskService } from '../services/taskService';

interface TaskDashboardWidgetProps {
  currentUser?: UserProfile;
  onOpenTaskManagement: () => void;
  onOpenNewTaskModal?: () => void;
  onSelectTask?: (task: TaskItem) => void;
}

export const TaskDashboardWidget: React.FC<TaskDashboardWidgetProps> = ({
  currentUser,
  onOpenTaskManagement,
  onOpenNewTaskModal,
  onSelectTask,
}) => {
  const [tasks, setTasks] = useState<TaskItem[]>(taskService.getTasks());
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    const unsub = taskService.subscribe((updatedTasks) => {
      setTasks([...updatedTasks]);
    });
    return () => unsub();
  }, []);

  // Metrics
  const totalTasks = tasks.length;
  const dalamProsesTasks = tasks.filter(t => t.status === 'Dalam Proses');
  const selesaiTasks = tasks.filter(t => t.status === 'Selesai');
  const batalTasks = tasks.filter(t => t.status === 'Batal');

  const adaTempohTasks = tasks.filter(t => t.adaTempoh === 'Ada');
  const tiadaTempohTasks = tasks.filter(t => t.adaTempoh === 'Tiada');

  const completionRate = totalTasks > 0 ? Math.round((selesaiTasks.length / totalTasks) * 100) : 0;

  // Quick switch status
  const handleQuickStatus = async (e: React.MouseEvent, task: TaskItem, newStatus: TaskStatus) => {
    e.stopPropagation();
    try {
      setIsUpdatingStatus(task.id);
      await taskService.updateTask(task.id, { status: newStatus });
    } catch (err) {
      console.error('Failed to update task status:', err);
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  // Recent 5 active or newest tasks
  const recentTasks = [...tasks]
    .sort((a, b) => {
      // Prioritize 'Dalam Proses' tasks first, then by date
      if (a.status === 'Dalam Proses' && b.status !== 'Dalam Proses') return -1;
      if (a.status !== 'Dalam Proses' && b.status === 'Dalam Proses') return 1;
      return new Date(b.tarikhKemaskini || b.tarikhDicipta || 0).getTime() - new Date(a.tarikhKemaskini || a.tarikhDicipta || 0).getTime();
    })
    .slice(0, 5);

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 lg:p-6 border border-slate-200 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <ListTodo className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Dashboard Pengurusan Task
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                {totalTasks} Jumlah Task
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Pemantauan status tugasan berpasukan, pecahan tempoh kerja & sasaran penyelesaian.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onOpenNewTaskModal && (
            <button
              onClick={onOpenNewTaskModal}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cipta Task</span>
            </button>
          )}

          <button
            onClick={onOpenTaskManagement}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <span>Urus Semua Task</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid: 2 Columns (Left: Task Status & Metrics, Right: Active Task List) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Col (5 cols): Metrics & Status */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          {/* Status Breakdown Cards */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* Dalam Proses */}
            <div 
              onClick={onOpenTaskManagement}
              className="p-3 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/40 border border-amber-200/80 hover:border-amber-400 hover:shadow-xs transition-all cursor-pointer text-center group"
            >
              <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-amber-800 mb-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Dalam Proses</span>
              </div>
              <div className="text-2xl font-black text-amber-700 font-mono">
                {dalamProsesTasks.length}
              </div>
              <div className="text-[10px] text-amber-700/80 font-semibold mt-0.5">
                {totalTasks > 0 ? Math.round((dalamProsesTasks.length / totalTasks) * 100) : 0}% daripada total
              </div>
            </div>

            {/* Selesai */}
            <div 
              onClick={onOpenTaskManagement}
              className="p-3 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/40 border border-emerald-200/80 hover:border-emerald-400 hover:shadow-xs transition-all cursor-pointer text-center group"
            >
              <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-emerald-800 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Selesai</span>
              </div>
              <div className="text-2xl font-black text-emerald-700 font-mono">
                {selesaiTasks.length}
              </div>
              <div className="text-[10px] text-emerald-700/80 font-semibold mt-0.5">
                {completionRate}% kadar siap
              </div>
            </div>

            {/* Batal */}
            <div 
              onClick={onOpenTaskManagement}
              className="p-3 rounded-2xl bg-gradient-to-br from-rose-50 to-rose-100/40 border border-rose-200/80 hover:border-rose-400 hover:shadow-xs transition-all cursor-pointer text-center group"
            >
              <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-rose-800 mb-1">
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Batal</span>
              </div>
              <div className="text-2xl font-black text-rose-700 font-mono">
                {batalTasks.length}
              </div>
              <div className="text-[10px] text-rose-700/80 font-semibold mt-0.5">
                {totalTasks > 0 ? Math.round((batalTasks.length / totalTasks) * 100) : 0}% dibatalkan
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">Kadar Kejayaan & Status Task</span>
              <span className="font-mono font-black text-emerald-700">{completionRate}% Selesai</span>
            </div>
            
            <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
              <div 
                style={{ width: `${totalTasks > 0 ? (selesaiTasks.length / totalTasks) * 100 : 0}%` }}
                className="bg-emerald-500 transition-all"
                title={`Selesai: ${selesaiTasks.length}`}
              />
              <div 
                style={{ width: `${totalTasks > 0 ? (dalamProsesTasks.length / totalTasks) * 100 : 0}%` }}
                className="bg-amber-500 transition-all"
                title={`Dalam Proses: ${dalamProsesTasks.length}`}
              />
              <div 
                style={{ width: `${totalTasks > 0 ? (batalTasks.length / totalTasks) * 100 : 0}%` }}
                className="bg-rose-500 transition-all"
                title={`Batal: ${batalTasks.length}`}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 font-semibold">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Selesai ({selesaiTasks.length})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> Dalam Proses ({dalamProsesTasks.length})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span> Batal ({batalTasks.length})
              </span>
            </div>
          </div>

          {/* Tempoh Breakdown */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 bg-white rounded-2xl border border-indigo-200/80 flex items-center justify-between shadow-2xs">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Ada Tempoh</div>
                <div className="text-lg font-black text-indigo-700 font-mono mt-0.5">{adaTempohTasks.length} Task</div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Calendar className="w-4 h-4" />
              </div>
            </div>

            <div className="p-3 bg-white rounded-2xl border border-slate-200 flex items-center justify-between shadow-2xs">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Tiada Tempoh</div>
                <div className="text-lg font-black text-slate-700 font-mono mt-0.5">{tiadaTempohTasks.length} Task</div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                <Layers className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Col (7 cols): Active / Recent Tasks List */}
        <div className="lg:col-span-7 bg-slate-50/70 rounded-2xl p-4 border border-slate-200 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Senarai Task Terkini & Tindakan
                </h4>
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                {recentTasks.length} daripada {totalTasks} Task
              </span>
            </div>

            {recentTasks.length === 0 ? (
              <div className="py-8 px-4 text-center rounded-2xl border border-dashed border-slate-200 bg-white space-y-2">
                <Sparkles className="w-6 h-6 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600">Tiada task berdaftar buat masa ini.</p>
                <p className="text-[10px] text-slate-400">Cipta task baharu untuk mula mengurus tugasan berpasukan.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      if (onSelectTask) {
                        onSelectTask(t);
                      } else {
                        onOpenTaskManagement();
                      }
                    }}
                    className="p-3 bg-white rounded-xl border border-slate-200 hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 group"
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
                            Oleh: {t.createdBy}
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                        {t.namaTask}
                      </div>

                      {t.keterangan && (
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {t.keterangan}
                        </p>
                      )}
                    </div>

                    {/* Quick Status Buttons */}
                    <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                      {t.status !== 'Selesai' && (
                        <button
                          disabled={isUpdatingStatus === t.id}
                          onClick={(e) => handleQuickStatus(e, t, 'Selesai')}
                          className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-200 transition-colors cursor-pointer"
                          title="Tandakan Selesai (Sync ke Firebase)"
                        >
                          ✓ Selesai
                        </button>
                      )}

                      {t.status !== 'Dalam Proses' && (
                        <button
                          disabled={isUpdatingStatus === t.id}
                          onClick={(e) => handleQuickStatus(e, t, 'Dalam Proses')}
                          className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-bold border border-amber-200 transition-colors cursor-pointer"
                          title="Tukar ke Dalam Proses"
                        >
                          ↻ Proses
                        </button>
                      )}

                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
