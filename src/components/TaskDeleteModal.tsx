import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { TaskItem } from '../types';

interface TaskDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskItem | null;
  onConfirmDelete: (id: string) => Promise<void>;
}

export const TaskDeleteModal: React.FC<TaskDeleteModalProps> = ({
  isOpen,
  onClose,
  task,
  onConfirmDelete,
}) => {
  const [isDeleting, setIsDeleting] = React.useState(false);

  if (!isOpen || !task) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    // Dismiss the delete modal immediately
    onClose();
    try {
      await onConfirmDelete(task.id);
    } catch (e) {
      console.error('Error deleting task:', e);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning Icon */}
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title & Body */}
        <div className="space-y-2">
          <h3 className="text-base font-bold text-slate-900">
            Pengesahan Padam Task
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Adakah anda pasti ingin memadam task ini daripada senarai pengurusan task? Tindakan ini adalah kekal dan akan disinkronkan ke pangkalan data Firebase.
          </p>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nama Task:</span>
            <p className="text-xs font-semibold text-slate-800 break-words">
              {task.namaTask}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <span>Memadam...</span>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Padam Task</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
