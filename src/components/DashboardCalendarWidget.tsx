import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, ArrowRight, CheckCircle2, Sparkles, Plus } from 'lucide-react';
import { ProgramEvent } from '../types';
import { calendarService } from '../services/calendarService';

interface DashboardCalendarWidgetProps {
  onOpenCalendar: () => void;
}

export const DashboardCalendarWidget: React.FC<DashboardCalendarWidgetProps> = ({ onOpenCalendar }) => {
  const [upcomingEvents, setUpcomingEvents] = useState<ProgramEvent[]>([]);

  useEffect(() => {
    const unsubscribe = calendarService.subscribe((events) => {
      const now = new Date();
      // Filter ONLY upcoming or ongoing programs
      const filtered = events.filter((ev) => {
        if (ev.status !== 'Diteruskan') return false;
        const eventEndOrStart = ev.endDateTime ? new Date(ev.endDateTime) : new Date(ev.dateTime);
        return eventEndOrStart >= now;
      });

      // Sort by start date ascending (earliest upcoming first)
      filtered.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

      setUpcomingEvents(filtered);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Program Akan Datang & Sedang Berjalan
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                {upcomingEvents.length} Program
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Senarai program rasmi, SJK, dan kemaskini sistem yang akan berlangsung.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenCalendar}
          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0"
        >
          <span>Buka Kalendar</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {upcomingEvents.length === 0 ? (
        <div className="text-center py-8 px-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 space-y-2">
          <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs font-extrabold text-slate-700">Tiada program yang sedang atau bakal berlangsung buat masa ini.</p>
          <p className="text-[11px] text-slate-400 max-w-md mx-auto">
            Semua program terdahulu telah selesai atau dibatalkan.
          </p>
          <button
            onClick={onOpenCalendar}
            className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Program Baharu</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {upcomingEvents.slice(0, 6).map((ev) => (
            <div
              key={ev.id}
              onClick={onOpenCalendar}
              className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-white border border-emerald-200/80 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      ev.category === 'SJK'
                        ? 'bg-indigo-600 text-white'
                        : ev.category === 'Kemaskini'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-700 text-white'
                    }`}
                  >
                    {ev.category}
                  </span>

                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-600 text-white shadow-2xs">
                    <CheckCircle2 className="w-3 h-3 text-emerald-200" />
                    <span>Akan Datang</span>
                  </span>
                </div>

                <h4 className="text-sm font-black text-slate-900 tracking-tight group-hover:text-emerald-700 transition-colors line-clamp-2">
                  {ev.title}
                </h4>

                <div className="space-y-1 text-xs text-slate-600 font-semibold pt-1 border-t border-emerald-100">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      {new Date(ev.dateTime).toLocaleDateString('ms-MY', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      {new Date(ev.dateTime).toLocaleTimeString('ms-MY', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {ev.endDateTime &&
                        ` - ${new Date(ev.endDateTime).toLocaleTimeString('ms-MY', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{ev.location}</span>
                  </div>
                </div>

                {ev.notes && (
                  <p className="text-[11px] text-slate-500 bg-white/80 p-2 rounded-xl border border-slate-200/60 line-clamp-2">
                    {ev.notes}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-emerald-100/60 flex items-center justify-between text-[11px] font-bold text-emerald-700 group-hover:translate-x-0.5 transition-transform">
                <span>Diuruskan oleh {ev.createdBy || 'Pentadbir'}</span>
                <span className="flex items-center gap-1">
                  <span>Butiran</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
