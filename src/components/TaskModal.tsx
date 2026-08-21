import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  FileText, 
  Calendar, 
  Sparkles, 
  AlertCircle,
  Tag,
  AlignLeft,
  Hourglass
} from 'lucide-react';
import { TaskItem, TaskStatus, TaskDurationChoice, TaskDurationPeriod, UserProfile } from '../types';
import { DURATION_OPTIONS } from '../services/taskService';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: TaskItem | null;
  currentUser?: UserProfile;
  currentWorkspaceId?: string;
  onSaveTask: (taskData: {
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
  }) => Promise<void>;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  currentUser,
  currentWorkspaceId,
  onSaveTask,
}) => {
  const isEditing = !!taskToEdit;

  // Form State
  const [namaTask, setNamaTask] = useState('');
  const [adaTempoh, setAdaTempoh] = useState<TaskDurationChoice>('Ada');
  const [tempoh, setTempoh] = useState<TaskDurationPeriod>('3 Hari');
  const [status, setStatus] = useState<TaskStatus>('Dalam Proses');
  const [keterangan, setKeterangan] = useState('');
  const [catatan, setCatatan] = useState('');

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or reset form data
  useEffect(() => {
    if (isOpen) {
      if (taskToEdit) {
        setNamaTask(taskToEdit.namaTask || '');
        setAdaTempoh(taskToEdit.adaTempoh || 'Ada');
        setTempoh(taskToEdit.tempoh || '3 Hari');
        setStatus(taskToEdit.status || 'Dalam Proses');
        setKeterangan(taskToEdit.keterangan || '');
        setCatatan(taskToEdit.catatan || '');
      } else {
        setNamaTask('');
        setAdaTempoh('Ada');
        setTempoh('3 Hari');
        setStatus('Dalam Proses');
        setKeterangan('');
        setCatatan('');
      }
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen, taskToEdit]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!namaTask.trim()) {
      errs.namaTask = 'Nama task wajib diisi!';
    }
    if (!keterangan.trim()) {
      errs.keterangan = 'Keterangan berkenaan task wajib diisi!';
    }
    if (adaTempoh === 'Ada' && !tempoh) {
      errs.tempoh = 'Sila pilih tempoh jangka masa task!';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    // Dismiss the modal cleanly right away
    onClose();

    try {
      await onSaveTask({
        id: taskToEdit?.id,
        namaTask: namaTask.trim(),
        adaTempoh: adaTempoh,
        tempoh: adaTempoh === 'Ada' ? tempoh : undefined,
        status: status,
        keterangan: keterangan.trim(),
        catatan: catatan.trim(),
        workspaceId: taskToEdit?.workspaceId || currentWorkspaceId || 'ws-integriti',
        createdBy: taskToEdit?.createdBy || currentUser?.name || 'Pengguna Workspace',
        creatorAvatar:
          taskToEdit?.creatorAvatar ||
          currentUser?.avatar ||
          'https://api.dicebear.com/7.x/personas/svg?seed=Aisha&clothingColor=3b82f6',
      });
    } catch (err) {
      console.error('Error saving task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                {isEditing ? 'Kemaskini Task' : 'Cipta Task Baharu'}
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  Firebase Synced
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                {isEditing ? 'Kemaskini butiran dan status task anda' : 'Isi borang di bawah untuk mendaftarkan task tugasan baharu'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* 1. Nama Task */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-600" />
                1. Nama Task <span className="text-rose-500">*</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">cth: Siasatan Lapangan Aduan Awam</span>
            </label>
            <input
              type="text"
              value={namaTask}
              onChange={(e) => {
                setNamaTask(e.target.value);
                if (errors.namaTask) setErrors((prev) => ({ ...prev, namaTask: '' }));
              }}
              placeholder="Masukkan tajuk atau nama task..."
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                errors.namaTask 
                  ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/30' 
                  : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100 bg-slate-50/50 focus:bg-white'
              }`}
            />
            {errors.namaTask && (
              <p className="text-xs text-rose-500 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.namaTask}
              </p>
            )}
          </div>

          {/* 2. Ada Tempoh (Pilihan: Ada, Tiada) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3.5">
            <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                2. Ada Tempoh? <span className="text-rose-500">*</span>
              </span>
              <span className="text-[11px] text-slate-500">Pilih jika task mempunyai sasaran masa</span>
            </label>

            {/* Radio Selection for Ada / Tiada */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setAdaTempoh('Ada');
                  if (!tempoh) setTempoh('3 Hari');
                }}
                className={`py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  adaTempoh === 'Ada'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Ada (Ya)</span>
              </button>

              <button
                type="button"
                onClick={() => setAdaTempoh('Tiada')}
                className={`py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  adaTempoh === 'Tiada'
                    ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Hourglass className="w-4 h-4" />
                <span>Tiada (Tidak)</span>
              </button>
            </div>

            {/* Dynamic Tempoh Selector if Ada */}
            {adaTempoh === 'Ada' && (
              <div className="pt-2 border-t border-slate-200/80 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  Pilih Tempoh Masa Task:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setTempoh(opt)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                        tempoh === opt
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-200'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. Status (Dalam Proses, Batal, Selesai) with Distinct Color-Coding */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                3. Status Task <span className="text-rose-500">*</span>
              </span>
              <span className="text-[11px] text-slate-400">Pilih status terkini</span>
            </label>

            <div className="grid grid-cols-3 gap-2.5">
              {/* Dalam Proses (Amber/Yellow) */}
              <button
                type="button"
                onClick={() => setStatus('Dalam Proses')}
                className={`py-3 px-3 rounded-2xl font-bold text-xs flex flex-col items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  status === 'Dalam Proses'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-300'
                    : 'bg-amber-50/70 hover:bg-amber-100/80 text-amber-900 border-amber-200'
                }`}
              >
                <Clock className={`w-4 h-4 ${status === 'Dalam Proses' ? 'text-white' : 'text-amber-600'}`} />
                <span>Dalam Proses</span>
              </button>

              {/* Selesai (Emerald/Green) */}
              <button
                type="button"
                onClick={() => setStatus('Selesai')}
                className={`py-3 px-3 rounded-2xl font-bold text-xs flex flex-col items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  status === 'Selesai'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-300'
                    : 'bg-emerald-50/70 hover:bg-emerald-100/80 text-emerald-900 border-emerald-200'
                }`}
              >
                <CheckCircle2 className={`w-4 h-4 ${status === 'Selesai' ? 'text-white' : 'text-emerald-600'}`} />
                <span>Selesai</span>
              </button>

              {/* Batal (Rose/Red) */}
              <button
                type="button"
                onClick={() => setStatus('Batal')}
                className={`py-3 px-3 rounded-2xl font-bold text-xs flex flex-col items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  status === 'Batal'
                    ? 'bg-rose-600 text-white border-rose-700 shadow-md ring-2 ring-rose-300'
                    : 'bg-rose-50/70 hover:bg-rose-100/80 text-rose-900 border-rose-200'
                }`}
              >
                <XCircle className={`w-4 h-4 ${status === 'Batal' ? 'text-white' : 'text-rose-600'}`} />
                <span>Batal</span>
              </button>
            </div>
          </div>

          {/* 4. Keterangan Berkenaan Task */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <AlignLeft className="w-3.5 h-3.5 text-indigo-600" />
                4. Keterangan Berkenaan Task <span className="text-rose-500">*</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">Objektif atau skop tindakan</span>
            </label>
            <textarea
              rows={3}
              value={keterangan}
              onChange={(e) => {
                setKeterangan(e.target.value);
                if (errors.keterangan) setErrors((prev) => ({ ...prev, keterangan: '' }));
              }}
              placeholder="Terangkan secara terperinci apa yang perlu dilakukan untuk task ini..."
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                errors.keterangan 
                  ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/30' 
                  : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100 bg-slate-50/50 focus:bg-white'
              }`}
            />
            {errors.keterangan && (
              <p className="text-xs text-rose-500 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.keterangan}
              </p>
            )}
          </div>

          {/* 5. Catatan */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                5. Catatan Tambahan (Pilihan)
              </span>
              <span className="text-[11px] text-slate-400 font-normal">Maklumat sokongan / nota pegawai</span>
            </label>
            <textarea
              rows={2}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Sebarang nota tambahan, rujukan fail, atau peringatan penting..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-indigo-500 focus:ring-indigo-100 bg-slate-50/50 focus:bg-white transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md hover:shadow-indigo-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Menyimpan...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isEditing ? 'Kemaskini Task' : 'Simpan Task'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
