import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Edit3, 
  Trash2, 
  Calendar, 
  FileText, 
  CheckSquare, 
  Layers, 
  Sparkles,
  ChevronDown,
  Tag,
  AlertCircle,
  FolderPlus,
  RefreshCw,
  LayoutGrid,
  List
} from 'lucide-react';
import { TaskItem, TaskStatus, TaskDurationChoice, TaskDurationPeriod, UserProfile } from '../types';
import { taskService } from '../services/taskService';
import { TaskModal } from './TaskModal';
import { TaskDeleteModal } from './TaskDeleteModal';
import { TaskReportModal } from './TaskReportModal';

interface TaskManagementViewProps {
  currentUser?: UserProfile;
}

export const TaskManagementView: React.FC<TaskManagementViewProps> = ({ currentUser }) => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tempohFilter, setTempohFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskItem | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<TaskItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = taskService.subscribe((updatedTasks) => {
      setTasks(updatedTasks);
    });
    return () => unsubscribe();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter calculations
  const filteredTasks = tasks.filter((task) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match =
        task.namaTask.toLowerCase().includes(q) ||
        task.keterangan.toLowerCase().includes(q) ||
        (task.catatan && task.catatan.toLowerCase().includes(q)) ||
        (task.tempoh && task.tempoh.toLowerCase().includes(q));
      if (!match) return false;
    }

    // Status filter
    if (statusFilter !== 'all' && task.status !== statusFilter) {
      return false;
    }

    // Tempoh filter
    if (tempohFilter === 'ada' && task.adaTempoh !== 'Ada') return false;
    if (tempohFilter === 'tiada' && task.adaTempoh !== 'Tiada') return false;

    return true;
  });

  // KPI Statistics
  const totalTasks = tasks.length;
  const dalamProsesTasks = tasks.filter((t) => t.status === 'Dalam Proses').length;
  const selesaiTasks = tasks.filter((t) => t.status === 'Selesai').length;
  const batalTasks = tasks.filter((t) => t.status === 'Batal').length;
  const completionRate = totalTasks > 0 ? Math.round((selesaiTasks / totalTasks) * 100) : 0;

  // Handle Save Task (Create or Edit)
  const handleSaveTask = async (taskData: {
    id?: string;
    namaTask: string;
    adaTempoh: TaskDurationChoice;
    tempoh?: TaskDurationPeriod;
    status: TaskStatus;
    keterangan: string;
    catatan?: string;
    workspaceId?: string;
    createdBy?: string;
    creatorAvatar?: string;
  }) => {
    // Immediately close modal to prevent stuck popups
    setIsTaskModalOpen(false);
    setTaskToEdit(null);

    try {
      if (taskData.id) {
        await taskService.updateTask(taskData.id, taskData);
        showToast(`Task "${taskData.namaTask}" berjaya dikemaskini & disinkronkan ke Firebase!`);
      } else {
        await taskService.addTask({
          namaTask: taskData.namaTask,
          adaTempoh: taskData.adaTempoh,
          tempoh: taskData.tempoh,
          status: taskData.status,
          keterangan: taskData.keterangan,
          catatan: taskData.catatan,
          workspaceId: taskData.workspaceId,
          createdBy: taskData.createdBy,
          creatorAvatar: taskData.creatorAvatar,
        });
        showToast(`Task baharu "${taskData.namaTask}" berjaya dicipta & disinkronkan ke Firebase!`);
      }
    } catch (err) {
      console.error('Error saving task:', err);
      showToast('Ralat semasa menyimpan task. Sila cuba lagi.');
    }
  };

  // Handle Delete Confirmation
  const handleConfirmDelete = async (id: string) => {
    const target = tasks.find((t) => t.id === id);
    // Immediately close delete modal
    setTaskToDelete(null);

    try {
      await taskService.deleteTask(id);
      showToast(`Task "${target?.namaTask || id}" berjaya dipadam secara kekal dari pangkalan data.`);
    } catch (err) {
      console.error('Error deleting task:', err);
      showToast('Ralat semasa memadam task.');
    }
  };

  // Handle Quick Status Switch
  const handleQuickStatusChange = async (id: string, newStatus: TaskStatus) => {
    await taskService.updateTaskStatus(id, newStatus);
    showToast(`Status task dikemaskini kepada "${newStatus}".`);
  };

  // Distinct status styling helpers
  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'Dalam Proses':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Dalam Proses
          </span>
        );
      case 'Selesai':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Selesai
          </span>
        );
      case 'Batal':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Batal
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            {status}
          </span>
        );
    }
  };

  const getCardBorderColor = (status: TaskStatus) => {
    switch (status) {
      case 'Dalam Proses':
        return 'border-l-4 border-l-amber-500 hover:border-amber-300';
      case 'Selesai':
        return 'border-l-4 border-l-emerald-500 hover:border-emerald-300';
      case 'Batal':
        return 'border-l-4 border-l-rose-500 hover:border-rose-300';
      default:
        return 'border-l-4 border-l-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Realtime Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[10px] font-extrabold uppercase tracking-wider">
                Ruang Kerja
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Firebase Realtime Synced
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <CheckSquare className="w-7 h-7 text-indigo-400" />
              Pengurusan Task
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Cipta, pantau, kemaskini dan selaras tugasan tindakan anda secara masa nyata dengan pangkalan data Firebase.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-98 text-white text-xs font-bold shadow-sm backdrop-blur-xs flex items-center gap-2 transition-all cursor-pointer border border-white/20"
              title="Jana Laporan Terkini Pengurusan Task"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Jana Laporan Task</span>
            </button>

            <button
              onClick={() => {
                setTaskToEdit(null);
                setIsTaskModalOpen(true);
              }}
              className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer border border-indigo-400/30"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Cipta Task Baharu</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Bar (Distinct Color Schemes) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Tasks */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Jumlah Task</span>
            <span className="text-xl font-extrabold text-slate-900">{totalTasks}</span>
          </div>
        </div>

        {/* Dalam Proses (Amber Theme) */}
        <div className="bg-gradient-to-br from-amber-50/70 to-white rounded-2xl p-4 border border-amber-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Dalam Proses</span>
            <span className="text-xl font-extrabold text-amber-950">{dalamProsesTasks}</span>
          </div>
        </div>

        {/* Selesai (Emerald Theme) */}
        <div className="bg-gradient-to-br from-emerald-50/70 to-white rounded-2xl p-4 border border-emerald-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Selesai</span>
            <span className="text-xl font-extrabold text-emerald-950">{selesaiTasks}</span>
          </div>
        </div>

        {/* Batal (Rose Theme) */}
        <div className="bg-gradient-to-br from-rose-50/70 to-white rounded-2xl p-4 border border-rose-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-700 border border-rose-200 flex items-center justify-center font-bold">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">Batal</span>
            <span className="text-xl font-extrabold text-rose-950">{batalTasks}</span>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="col-span-2 sm:col-span-2 lg:col-span-1 bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-center space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <span>Kadar Siap</span>
            <span className="text-indigo-600 font-extrabold">{completionRate}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
              style={{ width: `${completionRate}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari mengikut nama task, keterangan, atau catatan..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 bg-slate-50/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Tempoh filter dropdown */}
            <select
              value={tempohFilter}
              onChange={(e) => setTempohFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50/80 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="all">Semua Tempoh</option>
              <option value="ada">Hanya Ada Tempoh</option>
              <option value="tiada">Hanya Tiada Tempoh</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Paparan Grid Kad"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'table' ? 'bg-white text-indigo-600 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Paparan Senarai Jadual"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 scrollbar-none">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Status ({totalTasks})
          </button>

          <button
            onClick={() => setStatusFilter('Dalam Proses')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'Dalam Proses'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Dalam Proses ({dalamProsesTasks})</span>
          </button>

          <button
            onClick={() => setStatusFilter('Selesai')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'Selesai'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Selesai ({selesaiTasks})</span>
          </button>

          <button
            onClick={() => setStatusFilter('Batal')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'Batal'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Batal ({batalTasks})</span>
          </button>
        </div>
      </div>

      {/* Task List / Grid Display */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <CheckSquare className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">Tiada Task Ditemui</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              {searchQuery || statusFilter !== 'all' || tempohFilter !== 'all'
                ? 'Tiada task yang sepadan dengan kriteria carian dan penapis anda. Cuba tukar atau set semula penapis.'
                : 'Belum ada task yang dicipta. Mulakan dengan mencipta task pertama anda.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            {(searchQuery || statusFilter !== 'all' || tempohFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setTempohFilter('all');
                }}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
              >
                Reset Penapis
              </button>
            )}
            <button
              onClick={() => {
                setTaskToEdit(null);
                setIsTaskModalOpen(true);
              }}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Cipta Task Baharu</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden ${getCardBorderColor(
                task.status
              )}`}
            >
              {/* Card Header */}
              <div className="p-5 space-y-3 flex-1">
                <div className="flex items-start justify-between gap-2">
                  {getStatusBadge(task.status)}

                  {/* Tempoh Badge */}
                  {task.adaTempoh === 'Ada' && task.tempoh ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      <Clock className="w-3 h-3 text-indigo-500" />
                      {task.tempoh}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                      Tiada Tempoh
                    </span>
                  )}
                </div>

                {/* 1. Nama Task */}
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug tracking-tight">
                  {task.namaTask}
                </h3>

                {/* 4. Keterangan Berkenaan Task */}
                <p className="text-xs text-slate-600 leading-relaxed font-normal whitespace-pre-line line-clamp-4">
                  {task.keterangan}
                </p>

                {/* 5. Catatan (if any) */}
                {task.catatan && (
                  <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-200/70 text-amber-950 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      Catatan:
                    </span>
                    <p className="text-xs text-amber-900/90 font-medium leading-relaxed">
                      {task.catatan}
                    </p>
                  </div>
                )}
              </div>

              {/* Card Footer: Metadata & Actions */}
              <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {task.creatorAvatar && (
                    <img
                      src={task.creatorAvatar}
                      alt={task.createdBy}
                      className="w-6 h-6 rounded-full border border-slate-200 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="text-[10px] text-slate-500 font-medium leading-tight">
                    <span className="font-semibold text-slate-700 block">{task.createdBy || 'Pegawai'}</span>
                    <span>{new Date(task.tarikhKemaskini).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' })}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5">
                  {/* Status Quick Switch Dropdown */}
                  <select
                    value={task.status}
                    onChange={(e) => handleQuickStatusChange(task.id, e.target.value as TaskStatus)}
                    className="text-[11px] font-bold py-1 px-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-300 cursor-pointer"
                    title="Tukar Status"
                  >
                    <option value="Dalam Proses">Dalam Proses</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Batal">Batal</option>
                  </select>

                  {/* Edit Button */}
                  <button
                    onClick={() => {
                      setTaskToEdit(task);
                      setIsTaskModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors border border-slate-200 bg-white"
                    title="Edit Task"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => setTaskToDelete(task)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors border border-slate-200 bg-white"
                    title="Padam Task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE LIST VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Nama Task</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Tempoh</th>
                  <th className="py-3.5 px-4">Keterangan</th>
                  <th className="py-3.5 px-4">Catatan</th>
                  <th className="py-3.5 px-4">Pegawai / Tarikh</th>
                  <th className="py-3.5 px-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 max-w-[220px]">
                      {task.namaTask}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(task.status)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {task.adaTempoh === 'Ada' && task.tempoh ? (
                        <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md text-[11px]">
                          {task.tempoh}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Tiada</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-[260px] truncate" title={task.keterangan}>
                      {task.keterangan}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-[180px] truncate" title={task.catatan || ''}>
                      {task.catatan || '-'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                      <span className="font-semibold text-slate-700 block">{task.createdBy}</span>
                      <span>{new Date(task.tarikhKemaskini).toLocaleDateString('ms-MY')}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setTaskToEdit(task);
                            setIsTaskModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Edit Task"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setTaskToDelete(task)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Padam Task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create & Edit Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        taskToEdit={taskToEdit}
        currentUser={currentUser}
        onSaveTask={handleSaveTask}
      />

      {/* Delete Confirmation Popup */}
      <TaskDeleteModal
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        task={taskToDelete}
        onConfirmDelete={handleConfirmDelete}
      />

      {/* Task Report Modal */}
      <TaskReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        tasks={tasks}
      />
    </div>
  );
};
