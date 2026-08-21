import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, FileSpreadsheet, Bot, Megaphone, Edit3, X, Check, Loader2 } from 'lucide-react';
import { UserProfile } from '../types';
import { announcementService } from '../services/announcementService';

interface DailyBriefBannerProps {
  currentUser: UserProfile;
  dateRange: '7d' | '30d' | '90d' | 'all';
  setDateRange: (range: '7d' | '30d' | '90d' | 'all') => void;
  onOpenAiCopilot: () => void;
  onOpenLaporanView: () => void;
  onViewBriefSummary: () => void;
}

export const DailyBriefBanner: React.FC<DailyBriefBannerProps> = ({
  currentUser,
  onOpenAiCopilot,
  onOpenLaporanView,
  onViewBriefSummary,
}) => {
  const [announcementText, setAnnouncementText] = useState<string>('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editText, setEditText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = currentUser.role === 'Admin' || currentUser.isAdmin;

  useEffect(() => {
    const unsub = announcementService.subscribe((text) => {
      setAnnouncementText(text);
    });
    return () => unsub();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return 'Selamat pagi';
    } else if (hour >= 12 && hour < 14) {
      return 'Selamat tengah hari';
    } else if (hour >= 14 && hour < 19) {
      return 'Selamat petang';
    } else {
      return 'Selamat malam';
    }
  };

  const handleOpenEdit = () => {
    setEditText(announcementText);
    setIsEditModalOpen(true);
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editText.trim()) return;

    try {
      setIsSaving(true);
      await announcementService.updateAnnouncement(editText.trim(), currentUser.name);
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Failed to update announcement:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Greeting Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          {getGreeting()}, {currentUser.name.split(' ')[0]} <span className="animate-bounce">👋</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">
          Berikut adalah status perkembangan kes aduan dan prestasi SLA merentas workspace anda hari ini.
        </p>

        {/* Moving Ticker Announcement Banner (Right Below Greeting Text) */}
        <div className="mt-3 relative bg-amber-500/10 border border-amber-500/20 rounded-2xl p-2.5 sm:p-3 overflow-hidden flex items-center gap-3 shadow-xs group">
          {/* Static Left Badge */}
          <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-xs z-10">
            <Megaphone className="w-3.5 h-3.5 fill-slate-950 animate-pulse" />
            <span>PERMAKLUMAN</span>
          </div>

          {/* Marquee Container with smooth rightward moving animation */}
          <div className="flex-1 overflow-hidden relative h-6 flex items-center">
            <div className="animate-marquee-right text-xs font-extrabold text-amber-900 tracking-wide">
              {announcementText || 'Gagal itu biasa. Tanpa kegagalan kita tidak akan merasa kemanisan dalam kejayaan.'}
            </div>
          </div>

          {/* Special Discrete Edit Button (ADMIN ONLY) */}
          {isAdmin && (
            <button
              onClick={handleOpenEdit}
              className="shrink-0 z-10 p-1.5 rounded-xl bg-amber-200/60 hover:bg-amber-300 text-amber-900 opacity-40 hover:opacity-100 group-hover:opacity-100 transition-all cursor-pointer border border-amber-300/50"
              title="Sunting Permakluman Dashboard (Admin Sahaja)"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ADMIN EDIT ANNOUNCEMENT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-bold">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Kemaskini Permakluman Dashboard</h3>
                <p className="text-xs text-slate-500 font-medium">Tetapkan teks bergerak untuk paparan semua pengguna (Admin sahaja)</p>
              </div>
            </div>

            <form onSubmit={handleSaveAnnouncement} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Teks Permakluman (Bergerak)
                </label>
                <textarea
                  rows={3}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  placeholder="Masukkan teks permakluman bergerak..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold transition-all shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Simpan Permakluman</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

