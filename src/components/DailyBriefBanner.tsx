import React, { useState } from 'react';
import { Sparkles, ArrowRight, FileSpreadsheet, Bot, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '../types';

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
  dateRange,
  setDateRange,
  onOpenAiCopilot,
  onOpenLaporanView,
  onViewBriefSummary,
}) => {
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

  return (
    <div className="space-y-5 mb-6">
      {/* Greeting Header & Date Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            {getGreeting()}, {currentUser.name.split(' ')[0]} <span className="animate-bounce">👋</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Berikut adalah status perkembangan kes aduan dan prestasi SLA merentas workspace anda hari ini.
          </p>
        </div>

        {/* Date Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-200/60 p-1 rounded-lg border border-slate-200 self-start md:self-auto">
          {(['7d', '30d', '90d', 'all'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                dateRange === r
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {r === 'all' ? 'Semua' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Featured AI Daily Brief Banner in Clean Minimalism style */}
      <div className="relative overflow-hidden rounded-2xl bg-indigo-600 text-white p-6 shadow-md border border-indigo-500/30">
        {/* Subtle background glow */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          {/* Top Badge */}
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-800/80 text-indigo-100 text-[10px] font-extrabold tracking-wider uppercase border border-indigo-400/30">
              <Sparkles className="w-3 h-3 fill-current text-indigo-200" />
              AI DAILY BRIEF · 9:14 AM
            </span>
          </div>

          {/* Headline */}
          <h3 className="text-lg md:text-xl font-bold tracking-tight text-white leading-snug max-w-3xl">
            Kadar penyelesaian aduan pacing <span className="underline underline-offset-4 decoration-indigo-200">18% melepasi sasaran SLA</span>. 2 kes aduan kritikal memerlukan perhatian segera hari ini.
          </h3>

          {/* Banner Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <button
              onClick={onViewBriefSummary}
              className="px-4 py-2 rounded-lg bg-white text-indigo-600 text-xs font-bold hover:bg-indigo-50 transition-all shadow-xs flex items-center gap-1.5"
            >
              <span>Lihat ringkasan penuh</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onOpenLaporanView}
              className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md transition-all border border-white/20 flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-200" />
              <span>Jana laporan</span>
            </button>

            <button
              onClick={onOpenAiCopilot}
              className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md transition-all border border-white/20 flex items-center gap-1.5"
            >
              <Bot className="w-3.5 h-3.5 text-indigo-200" />
              <span>Tanya Copilot</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
