import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  Tag, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Edit3, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  CalendarDays, 
  ListFilter, 
  Sparkles, 
  RefreshCw,
  User,
  X,
  FileSpreadsheet,
  Award,
  Users,
  Target,
  FileCheck2,
  CalendarCheck,
  FileText,
  Printer
} from 'lucide-react';
import { ProgramEvent, ProgramCategory, ProgramStatus, UserProfile, ProgramAgihanKPI } from '../types';
import { calendarService } from '../services/calendarService';
import { programAgihanService } from '../services/programAgihanService';
import { ProgramAgihanReportModal } from './ProgramAgihanReportModal';

interface CalendarViewProps {
  currentUser?: UserProfile;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ currentUser }) => {
  const [events, setEvents] = useState<ProgramEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // Month navigation for Calendar Grid View
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());

  // Modal States for Program Events
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ProgramEvent | null>(null);
  const [eventToDelete, setEventToDelete] = useState<ProgramEvent | null>(null);

  // Form Fields for Program Events
  const [formData, setFormData] = useState<{
    title: string;
    dateTime: string;
    endDateTime: string;
    location: string;
    category: ProgramCategory;
    status: ProgramStatus;
    notes: string;
  }>({
    title: '',
    dateTime: new Date().toISOString().slice(0, 16),
    endDateTime: '',
    location: '',
    category: 'SJK',
    status: 'Diteruskan',
    notes: '',
  });

  // State for Bilangan Program / Aktiviti Agihan (KPI)
  const [programAgihanList, setProgramAgihanList] = useState<ProgramAgihanKPI[]>([]);
  const [agihanSearchQuery, setAgihanSearchQuery] = useState('');
  const [isAgihanModalOpen, setIsAgihanModalOpen] = useState(false);
  const [isAgihanReportModalOpen, setIsAgihanReportModalOpen] = useState(false);
  const [editingAgihan, setEditingAgihan] = useState<ProgramAgihanKPI | null>(null);
  const [agihanToDelete, setAgihanToDelete] = useState<ProgramAgihanKPI | null>(null);
  const [agihanFormData, setAgihanFormData] = useState<{
    namaProgram: string;
    namaPic: string;
    lokasi: string;
    tarikh: string;
    catatan: string;
  }>({
    namaProgram: '',
    namaPic: '',
    lokasi: '',
    tarikh: new Date().toISOString().slice(0, 10),
    catatan: '',
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    const unsubscribeEvents = calendarService.subscribe((updatedEvents) => {
      setEvents(updatedEvents);
    });

    const unsubscribeAgihan = programAgihanService.subscribe((updatedAgihan) => {
      setProgramAgihanList(updatedAgihan);
    });

    return () => {
      unsubscribeEvents();
      unsubscribeAgihan();
    };
  }, []);

  // Time Comparison Helper: Has current date/time exceeded program date/time?
  const isPastEvent = (event: ProgramEvent): boolean => {
    const targetDate = event.endDateTime ? new Date(event.endDateTime) : new Date(event.dateTime);
    return new Date() > targetDate;
  };

  // Open modal for NEW event
  const handleOpenAddModal = (defaultDate?: Date) => {
    let initialDateTime = new Date().toISOString().slice(0, 16);
    if (defaultDate) {
      const year = defaultDate.getFullYear();
      const month = String(defaultDate.getMonth() + 1).padStart(2, '0');
      const day = String(defaultDate.getDate()).padStart(2, '0');
      initialDateTime = `${year}-${month}-${day}T09:00`;
    }

    setEditingEvent(null);
    setFormData({
      title: '',
      dateTime: initialDateTime,
      endDateTime: '',
      location: '',
      category: 'SJK',
      status: 'Diteruskan',
      notes: '',
    });
    setIsModalOpen(true);
  };

  // Open modal for EDIT event
  const handleOpenEditModal = (event: ProgramEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      dateTime: event.dateTime ? event.dateTime.slice(0, 16) : new Date().toISOString().slice(0, 16),
      endDateTime: event.endDateTime ? event.endDateTime.slice(0, 16) : '',
      location: event.location,
      category: event.category,
      status: event.status,
      notes: event.notes || '',
    });
    setIsModalOpen(true);
  };

  // Toggle Status directly (Diteruskan vs Batal)
  const handleToggleStatus = async (event: ProgramEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus: ProgramStatus = event.status === 'Diteruskan' ? 'Batal' : 'Diteruskan';
    await calendarService.updateStatus(event.id, newStatus);
    showToast(`Status program "${event.title}" dikemaskini kepada: ${newStatus}`);
  };

  // Save Event (Create or Edit)
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.dateTime || !formData.location.trim()) {
      alert('Sila lengkapkan Nama Program, Tarikh & Masa, dan Tempat Program.');
      return;
    }

    const isEdit = !!editingEvent;

    const payload: ProgramEvent = {
      id: editingEvent ? editingEvent.id : `prog-${Date.now()}`,
      title: formData.title.trim(),
      dateTime: formData.dateTime,
      endDateTime: formData.endDateTime || undefined,
      location: formData.location.trim(),
      category: formData.category,
      status: formData.status,
      notes: formData.notes.trim() || undefined,
      createdBy: editingEvent ? editingEvent.createdBy : (currentUser?.name || 'Pentadbir Sistem'),
      createdAt: editingEvent ? editingEvent.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Close modal immediately so popup disappears without waiting or blocking
    setIsModalOpen(false);
    setEditingEvent(null);

    try {
      await calendarService.saveEvent(payload);
      showToast(isEdit ? '✅ Program berjaya dikemaskini!' : '🎉 Program baharu berjaya dicipta!');
    } catch (err) {
      console.error('Error saving program event:', err);
      showToast('❌ Gagal menyimpan program.');
    }
  };

  // Delete Event Trigger & Execution
  const handleTriggerDeleteEvent = (event: ProgramEvent) => {
    setEventToDelete(event);
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    const targetId = eventToDelete.id;
    const targetTitle = eventToDelete.title;
    setEventToDelete(null);
    try {
      await calendarService.deleteEvent(targetId);
      showToast(`🗑️ Program "${targetTitle}" telah dipadam.`);
    } catch (err) {
      console.error('Error deleting event:', err);
      showToast('❌ Gagal memadam program.');
    }
  };

  // Handlers for Bilangan Program / Aktiviti Agihan (KPI)
  const handleOpenAddAgihanModal = () => {
    setEditingAgihan(null);
    setAgihanFormData({
      namaProgram: '',
      namaPic: '',
      lokasi: '',
      tarikh: new Date().toISOString().slice(0, 10),
      catatan: '',
    });
    setIsAgihanModalOpen(true);
  };

  const handleOpenEditAgihanModal = (item: ProgramAgihanKPI) => {
    setEditingAgihan(item);
    setAgihanFormData({
      namaProgram: item.namaProgram,
      namaPic: item.namaPic,
      lokasi: item.lokasi,
      tarikh: item.tarikh ? item.tarikh.slice(0, 10) : new Date().toISOString().slice(0, 10),
      catatan: item.catatan || '',
    });
    setIsAgihanModalOpen(true);
  };

  const handleSaveAgihan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agihanFormData.namaProgram.trim() || !agihanFormData.namaPic.trim() || !agihanFormData.lokasi.trim() || !agihanFormData.tarikh) {
      showToast('⚠️ Sila lengkapkan semua maklumat: Nama Program, Nama PIC, Lokasi, dan Tarikh.');
      return;
    }

    const isEdit = !!editingAgihan;
    const payload: ProgramAgihanKPI = {
      id: editingAgihan ? editingAgihan.id : `agihan-${Date.now()}`,
      namaProgram: agihanFormData.namaProgram.trim(),
      namaPic: agihanFormData.namaPic.trim(),
      lokasi: agihanFormData.lokasi.trim(),
      tarikh: agihanFormData.tarikh,
      catatan: agihanFormData.catatan.trim() || undefined,
      createdBy: editingAgihan ? editingAgihan.createdBy : (currentUser?.name || 'Pentadbir Sistem'),
      createdAt: editingAgihan ? editingAgihan.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setIsAgihanModalOpen(false);
    setEditingAgihan(null);

    try {
      await programAgihanService.saveItem(payload);
      showToast(isEdit ? '✅ Rekod Program Agihan (KPI) berjaya dikemaskini!' : '🎉 Rekod Program Agihan (KPI) baharu berjaya didaftarkan!');
    } catch (err) {
      console.error('Error saving program agihan:', err);
      showToast('❌ Gagal menyimpan maklumat Program Agihan (KPI).');
    }
  };

  // Trigger Delete Agihan Modal
  const handleTriggerDeleteAgihan = (item: ProgramAgihanKPI) => {
    setAgihanToDelete(item);
  };

  // Confirm Delete Agihan from Firestore and local storage
  const confirmDeleteAgihan = async () => {
    if (!agihanToDelete) return;
    const targetId = agihanToDelete.id;
    const targetName = agihanToDelete.namaProgram;
    setAgihanToDelete(null);

    try {
      await programAgihanService.deleteItem(targetId);
      showToast(`🗑️ Rekod "${targetName}" telah berjaya dipadam.`);
    } catch (err) {
      console.error('Error deleting program agihan:', err);
      showToast('❌ Gagal memadam rekod program agihan.');
    }
  };

  // Filtered Agihan KPI List
  const filteredAgihanList = programAgihanList.filter((item) => {
    const q = agihanSearchQuery.toLowerCase();
    return (
      item.namaProgram.toLowerCase().includes(q) ||
      item.namaPic.toLowerCase().includes(q) ||
      item.lokasi.toLowerCase().includes(q) ||
      (item.catatan && item.catatan.toLowerCase().includes(q))
    );
  });

  // Filtered Events
  const filteredEvents = events.filter((item) => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;

    let matchesStatus = true;
    if (statusFilter === 'running') {
      matchesStatus = item.status === 'Diteruskan' && !isPastEvent(item);
    } else if (statusFilter === 'past') {
      matchesStatus = item.status === 'Diteruskan' && isPastEvent(item);
    } else if (statusFilter === 'batal') {
      matchesStatus = item.status === 'Batal';
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Analytics Stats
  const totalPrograms = events.length;
  const activeUpcomingPrograms = events.filter((e) => e.status === 'Diteruskan' && !isPastEvent(e)).length;
  const pastPrograms = events.filter((e) => e.status === 'Diteruskan' && isPastEvent(e)).length;
  const cancelledPrograms = events.filter((e) => e.status === 'Batal').length;

  // Calendar Month Computation
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: (Date | null)[] = [];
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

    // Padding for previous month days
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }

    return days;
  };

  const monthNames = [
    'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
    'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
  ];

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const jumpToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDay(now);
  };

  const daysInMonth = getDaysInMonth(currentDate);

  // Events on selected day
  const selectedDayEvents = selectedDay ? events.filter((e) => {
    const eDate = new Date(e.dateTime);
    return (
      eDate.getFullYear() === selectedDay.getFullYear() &&
      eDate.getMonth() === selectedDay.getMonth() &&
      eDate.getDate() === selectedDay.getDate()
    );
  }) : [];

  return (
    <div className="space-y-4 lg:space-y-5 animate-fade-in pb-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3 text-xs font-bold animate-fade-in">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 lg:p-6 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold tracking-tight">Kalendar & Jadual Program</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                  {totalPrograms} Program
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                Pengurusan jadual program SJK, Kemaskini, dan aktiviti rasmi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => handleOpenAddModal()}
              className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/25 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Cipta Program Baharu</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Jumlah Program</div>
            <div className="text-xl font-black text-white mt-0.5">{totalPrograms}</div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Berjalan / Akan Datang</div>
            <div className="text-xl font-black text-emerald-400 mt-0.5">{activeUpcomingPrograms}</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selesai / Past</div>
            <div className="text-xl font-black text-slate-400 mt-0.5">{pastPrograms}</div>
          </div>
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
            <div className="text-[10px] font-bold text-rose-300 uppercase tracking-wider">Dibatalkan</div>
            <div className="text-xl font-black text-rose-400 mt-0.5">{cancelledPrograms}</div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar & View Mode Toggle */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama program, tempat, atau catatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Jenis Program Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="all">Jenis: Semua</option>
              <option value="SJK">SJK</option>
              <option value="Kemaskini">Kemaskini</option>
              <option value="Lain-lain">Lain-lain</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="all">Status: Semua</option>
              <option value="running">🟢 Berjalan / Akan Datang</option>
              <option value="past">🩶 Selesai / Melebihi Masa</option>
              <option value="batal">🔴 Dibatalkan</option>
            </select>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'calendar'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Kalendar</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Senarai</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
          {/* Calendar Grid Box (2 Cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            {/* Month Header Navigation */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>
                <button
                  onClick={jumpToToday}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-[11px] font-bold transition-all"
                >
                  Hari Ini
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={prevMonth}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-all border border-slate-200"
                  title="Bulan Lepas"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-all border border-slate-200"
                  title="Bulan Depan"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days of Week */}
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
              <div>Aha</div>
              <div>Isn</div>
              <div>Sel</div>
              <div>Rab</div>
              <div>Kha</div>
              <div>Jum</div>
              <div>Sab</div>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1.5 flex-1 min-h-[320px]">
              {daysInMonth.map((day, idx) => {
                if (!day) {
                  return <div key={`empty-${idx}`} className="bg-slate-50/50 rounded-xl p-1 min-h-[50px]"></div>;
                }

                const isToday =
                  day.getDate() === new Date().getDate() &&
                  day.getMonth() === new Date().getMonth() &&
                  day.getFullYear() === new Date().getFullYear();

                const isSelected =
                  selectedDay &&
                  day.getDate() === selectedDay.getDate() &&
                  day.getMonth() === selectedDay.getMonth() &&
                  day.getFullYear() === selectedDay.getFullYear();

                // Events on this day
                const dayEvents = events.filter((e) => {
                  const eDate = new Date(e.dateTime);
                  return (
                    eDate.getDate() === day.getDate() &&
                    eDate.getMonth() === day.getMonth() &&
                    eDate.getFullYear() === day.getFullYear()
                  );
                });

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDay(day)}
                    className={`p-1.5 rounded-xl border text-left transition-all flex flex-col justify-between min-h-[64px] relative group ${
                      isSelected
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/40'
                        : isToday
                        ? 'border-indigo-400 bg-indigo-50/30'
                        : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-black ${
                          isToday
                            ? 'w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]'
                            : isSelected
                            ? 'text-emerald-700 font-extrabold'
                            : 'text-slate-700'
                        }`}
                      >
                        {day.getDate()}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-slate-900 text-white">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    {/* Event indicators */}
                    <div className="space-y-1 w-full mt-1">
                      {dayEvents.slice(0, 2).map((ev) => {
                        const past = isPastEvent(ev);
                        const isBatal = ev.status === 'Batal';

                        let badgeColor = 'bg-emerald-600 text-white';
                        if (isBatal) badgeColor = 'bg-rose-100 text-rose-700 border border-rose-200 line-through';
                        else if (past) badgeColor = 'bg-slate-200 text-slate-600 border border-slate-300 line-through';

                        return (
                          <div
                            key={ev.id}
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md truncate w-full ${badgeColor}`}
                            title={`${ev.title} (${ev.category})`}
                          >
                            {ev.title}
                          </div>
                        );
                      })}
                      {dayEvents.length > 2 && (
                        <div className="text-[8px] font-bold text-slate-400 px-1">+ {dayEvents.length - 2} lagi</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Status Color Guide Legend */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] gap-2 text-slate-600">
              <span className="font-extrabold text-slate-700">Petunjuk Status Program:</span>
              <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1.5 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                  <span className="text-emerald-700 font-extrabold">Hijau Solid:</span> Sedang Berjalan / Akan Datang
                </span>
                <span className="flex items-center gap-1.5 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block"></span>
                  <span className="text-slate-500 line-through font-extrabold">Kelabu Strikethrough:</span> Melebihi Masa / Selesai
                </span>
                <span className="flex items-center gap-1.5 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                  <span className="text-rose-600 font-extrabold">Merah:</span> Dibatalkan
                </span>
              </div>
            </div>
          </div>

          {/* Selected Day Agenda Sidebar (1 Col) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Jadual Program Pada</h4>
                  <div className="text-base font-extrabold text-slate-900 mt-0.5">
                    {selectedDay
                      ? selectedDay.toLocaleDateString('ms-MY', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : 'Pilih Tarikh'}
                  </div>
                </div>

                {selectedDay && (
                  <button
                    onClick={() => handleOpenAddModal(selectedDay)}
                    className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold flex items-center gap-1 transition-all"
                    title="Tambah Program Pada Tarikh Ini"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah</span>
                  </button>
                )}
              </div>

              {/* Event Cards List for Selected Day */}
              <div className="space-y-3 mt-4 max-h-[480px] overflow-y-auto pr-1">
                {selectedDayEvents.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl p-4 space-y-2">
                    <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-extrabold text-slate-600">Tiada program didaftarkan pada tarikh ini.</p>
                    <p className="text-[11px] text-slate-400">Klik butang "Tambah" di atas untuk mendaftar program baharu.</p>
                  </div>
                ) : (
                  selectedDayEvents.map((ev) => {
                    const past = isPastEvent(ev);
                    const isBatal = ev.status === 'Batal';

                    return (
                      <div
                        key={ev.id}
                        className={`p-4 rounded-2xl border transition-all space-y-2.5 relative group ${
                          isBatal
                            ? 'bg-rose-50/40 border-rose-200 text-slate-500'
                            : past
                            ? 'bg-slate-100/80 border-slate-200 text-slate-500 opacity-80'
                            : 'bg-emerald-50/80 border-emerald-300 shadow-sm ring-1 ring-emerald-400/20'
                        }`}
                      >
                        {/* Header Badge & Actions */}
                        <div className="flex items-center justify-between gap-2">
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

                          <div className="flex items-center gap-1">
                            {/* Toggle Status Button */}
                            <button
                              onClick={(e) => handleToggleStatus(ev, e)}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold transition-all border ${
                                ev.status === 'Diteruskan'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                                  : 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200'
                              }`}
                              title="Klik untuk ubah status Diteruskan / Batal"
                            >
                              {ev.status === 'Diteruskan' ? 'Status: Diteruskan' : 'Status: Batal'}
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => handleOpenEditModal(ev)}
                              className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-2xs"
                              title="Edit Program"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleTriggerDeleteEvent(ev)}
                              className="p-1.5 rounded-lg bg-white/80 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 shadow-2xs"
                              title="Padam Program"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Title */}
                        <div>
                          <h5
                            className={`text-sm font-black tracking-tight ${
                              isBatal
                                ? 'line-through text-rose-700'
                                : past
                                ? 'line-through text-slate-500'
                                : 'text-slate-900'
                            }`}
                          >
                            {ev.title}
                          </h5>

                          {/* Status Badge Tag */}
                          <div className="mt-1">
                            {isBatal ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-300">
                                <XCircle className="w-3 h-3 text-rose-600" />
                                <span>Dibatalkan</span>
                              </span>
                            ) : past ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 border border-slate-300 line-through">
                                <Clock className="w-3 h-3 text-slate-500" />
                                <span>Selesai / Melebihi Masa</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-600 text-white shadow-xs">
                                <CheckCircle2 className="w-3 h-3 text-emerald-200" />
                                <span>Sedang Berjalan / Akan Datang</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Time & Location */}
                        <div className="space-y-1 text-xs text-slate-600 font-semibold pt-1 border-t border-slate-200/60">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className={past || isBatal ? 'line-through' : ''}>
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
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className={`truncate ${past || isBatal ? 'line-through' : ''}`}>{ev.location}</span>
                          </div>
                        </div>

                        {ev.notes && (
                          <p className={`text-[11px] text-slate-500 bg-white/60 p-2 rounded-xl border border-slate-200/50 ${past || isBatal ? 'line-through' : ''}`}>
                            {ev.notes}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Full List / Grid View */
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-800">Senarai Keseluruhan Program ({filteredEvents.length})</h3>
              <p className="text-xs text-slate-400">Paparan terperinci mengikut susunan masa program.</p>
            </div>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl space-y-3">
              <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-extrabold text-slate-700">Tiada program dijumpai mengikut tapisan semasa.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                  setStatusFilter('all');
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
              >
                Reset Tapisan
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEvents.map((ev) => {
                const past = isPastEvent(ev);
                const isBatal = ev.status === 'Batal';

                return (
                  <div
                    key={ev.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 relative group ${
                      isBatal
                        ? 'bg-rose-50/40 border-rose-200 text-slate-500'
                        : past
                        ? 'bg-slate-100/80 border-slate-200 text-slate-500 opacity-80'
                        : 'bg-emerald-50/80 border-emerald-300 shadow-sm ring-1 ring-emerald-400/20'
                    }`}
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

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(ev)}
                            className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 shadow-2xs"
                            title="Edit Program"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleTriggerDeleteEvent(ev)}
                            className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 shadow-2xs"
                            title="Padam Program"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4
                        className={`text-base font-black tracking-tight ${
                          isBatal
                            ? 'line-through text-rose-700'
                            : past
                            ? 'line-through text-slate-500'
                            : 'text-slate-900'
                        }`}
                      >
                        {ev.title}
                      </h4>

                      {/* Status Tag */}
                      <div>
                        {isBatal ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-300">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>Dibatalkan</span>
                          </span>
                        ) : past ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-md bg-slate-200 text-slate-700 border border-slate-300 line-through">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>Selesai / Melebihi Masa</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-md bg-emerald-600 text-white shadow-xs">
                            <CheckCircle2 className="w-3 h-3 text-emerald-200" />
                            <span>Sedang Berjalan / Akan Datang</span>
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600 font-semibold pt-2 border-t border-slate-200/60">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className={past || isBatal ? 'line-through' : ''}>
                            {new Date(ev.dateTime).toLocaleDateString('ms-MY', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className={past || isBatal ? 'line-through' : ''}>
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
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className={`truncate ${past || isBatal ? 'line-through' : ''}`}>{ev.location}</span>
                        </div>
                      </div>

                      {ev.notes && (
                        <p className={`text-[11px] text-slate-500 bg-white/70 p-2.5 rounded-xl border border-slate-200/50 mt-2 ${past || isBatal ? 'line-through' : ''}`}>
                          {ev.notes}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">Oleh: {ev.createdBy || 'Pentadbir'}</span>
                      <button
                        onClick={(e) => handleToggleStatus(ev, e)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border transition-all ${
                          ev.status === 'Diteruskan'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200'
                        }`}
                      >
                        {ev.status === 'Diteruskan' ? 'Tukar ke Batal' : 'Aktifkan Semula'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAPARAN KHAS: BILANGAN PROGRAM / AKTIVITI AGIHAN YANG BERJAYA DILAKSANAKAN (KPI) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-5">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Bilangan Program / Aktiviti Agihan Yang Berjaya Dilaksanakan (KPI)
                </h3>
                <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {programAgihanList.length} Program Berjaya
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Senarai rekod program dan aktiviti agihan rasmi yang telah berjaya disempurnakan mengikut sasaran KPI.
              </p>
            </div>
          </div>

          {/* Button Khas Tambah Maklumat & Jana Laporan */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={() => setIsAgihanReportModalOpen(true)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white border-2 border-emerald-600/30 hover:border-emerald-600 hover:bg-emerald-50 active:scale-95 text-emerald-800 text-xs font-black transition-all shadow-xs flex items-center justify-center gap-2"
              title="Jana Laporan Rasmi KPI Agihan (Cetak/PDF, CSV, Salin Teks)"
            >
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Jana Laporan (KPI)</span>
            </button>

            <button
              onClick={handleOpenAddAgihanModal}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white text-xs font-black transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Tambah Program / Aktiviti</span>
            </button>
          </div>
        </div>

        {/* Search / Filter bar for Agihan KPI */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari program, PIC, lokasi..."
              value={agihanSearchQuery}
              onChange={(e) => setAgihanSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 placeholder-slate-400"
            />
            {agihanSearchQuery && (
              <button
                onClick={() => setAgihanSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="text-[11px] font-bold text-slate-500 self-end sm:self-center">
            Menunjukkan <span className="font-extrabold text-emerald-700">{filteredAgihanList.length}</span> daripada <span className="font-extrabold text-slate-800">{programAgihanList.length}</span> rekod agihan
          </div>
        </div>

        {/* Data Table / Cards */}
        {filteredAgihanList.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-3xl p-6 space-y-3 bg-slate-50/50">
            <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-400 mx-auto flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-700">
              {agihanSearchQuery ? 'Tiada rekod program agihan ditemui padanan carian.' : 'Belum ada rekod program agihan didaftarkan.'}
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {agihanSearchQuery
                ? 'Cuba semak ejaan nama program, nama PIC atau lokasi carian anda.'
                : 'Klik butang "Tambah Program / Aktiviti" di atas untuk mendaftarkan maklumat program agihan yang berjaya dilaksanakan.'}
            </p>
            {!agihanSearchQuery && (
              <button
                onClick={handleOpenAddAgihanModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Program Sekarang</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-black uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3.5 text-center w-12">Bil.</th>
                  <th className="py-3 px-4 min-w-[200px]">Nama Program / Aktiviti</th>
                  <th className="py-3 px-4 min-w-[160px]">Nama PIC</th>
                  <th className="py-3 px-4 min-w-[180px]">Lokasi Program / Aktiviti</th>
                  <th className="py-3 px-4 min-w-[140px]">Tarikh Program / Aktiviti</th>
                  <th className="py-3 px-4 text-center w-24">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredAgihanList.map((item, index) => (
                  <tr key={item.id} className="hover:bg-emerald-50/40 transition-colors group">
                    {/* Bilangan */}
                    <td className="py-3.5 px-3.5 text-center font-extrabold text-slate-500">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 group-hover:bg-emerald-100 group-hover:text-emerald-800 text-slate-700 inline-flex items-center justify-center font-mono text-xs font-black">
                        {index + 1}
                      </span>
                    </td>

                    {/* Nama Program / Aktiviti */}
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-slate-900 text-xs sm:text-sm group-hover:text-emerald-900">
                        {item.namaProgram}
                      </div>
                      {item.catatan && (
                        <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-sm">
                          {item.catatan}
                        </div>
                      )}
                    </td>

                    {/* Nama PIC */}
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 font-bold text-xs border border-slate-200 group-hover:bg-indigo-50 group-hover:text-indigo-900 group-hover:border-indigo-200 transition-colors">
                        <User className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-600" />
                        <span>{item.namaPic}</span>
                      </div>
                    </td>

                    {/* Lokasi Program / Aktiviti */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{item.lokasi}</span>
                      </div>
                    </td>

                    {/* Tarikh Program / Aktiviti */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <CalendarIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {new Date(item.tarikh).toLocaleDateString('ms-MY', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </td>

                    {/* Tindakan (Edit & Delete) */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditAgihanModal(item)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 transition-all shadow-2xs"
                          title="Edit Maklumat Program Agihan"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleTriggerDeleteAgihan(item)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-700 border border-slate-200 hover:border-rose-300 transition-all shadow-2xs"
                          title="Padam Maklumat Program Agihan"
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
        )}
      </div>

      {/* MODAL: TAMBAH / KEMASKINI PROGRAM AGIHAN KPI */}
      {isAgihanModalOpen && (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-auto max-h-[90vh] overflow-y-auto relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingAgihan ? 'Kemaskini Program Agihan (KPI)' : 'Tambah Program / Aktiviti Agihan (KPI)'}
                  </h3>
                  <p className="text-xs text-slate-400">Sila isikan 4 maklumat program yang berjaya dilaksanakan.</p>
                </div>
              </div>
              <button
                onClick={() => setIsAgihanModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAgihan} className="space-y-4 text-xs">
              {/* 1. Nama Program / Aktiviti */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  1. Nama Program / Aktiviti <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Program Agihan Sumbangan Bakul Makanan Ramadhan"
                  value={agihanFormData.namaProgram}
                  onChange={(e) => setAgihanFormData({ ...agihanFormData, namaProgram: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              {/* 2. Nama PIC */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  2. Nama PIC (Person-In-Charge) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: En. Ahmad Razak / Pn. Siti Sarah"
                  value={agihanFormData.namaPic}
                  onChange={(e) => setAgihanFormData({ ...agihanFormData, namaPic: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              {/* 3. Lokasi Program / Aktiviti */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  3. Lokasi Program / Aktiviti <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dewan Komuniti Presint 9, Putrajaya"
                  value={agihanFormData.lokasi}
                  onChange={(e) => setAgihanFormData({ ...agihanFormData, lokasi: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              {/* 4. Tarikh Program / Aktiviti */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  4. Tarikh Program / Aktiviti <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={agihanFormData.tarikh}
                  onChange={(e) => setAgihanFormData({ ...agihanFormData, tarikh: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              {/* Catatan Tambahan (Optional) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Catatan Tambahan (Pilihan)
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan ringkas status kejayaan agihan atau penerima..."
                  value={agihanFormData.catatan}
                  onChange={(e) => setAgihanFormData({ ...agihanFormData, catatan: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                ></textarea>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                {editingAgihan ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAgihanModalOpen(false);
                      handleTriggerDeleteAgihan(editingAgihan);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Padam</span>
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAgihanModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white text-xs font-black transition-all shadow-md shadow-emerald-500/20"
                  >
                    {editingAgihan ? 'Simpan Kemaskini' : 'Daftar Program KPI'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT PROGRAM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-auto max-h-[90vh] overflow-y-auto relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {editingEvent ? 'Edit Maklumat Program' : 'Daftar Program Baharu'}
                  </h3>
                  <p className="text-xs text-slate-400">Sila masukkan maklumat program rasmi.</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4 text-xs">
              {/* Nama Program */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Program *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sesi Taklimat & Siasatan Tapak SJK"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              {/* Jenis Program & Status Program */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Program *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ProgramCategory })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  >
                    <option value="SJK">SJK</option>
                    <option value="Kemaskini">Kemaskini</option>
                    <option value="Lain-lain">Lain-lain</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Program *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ProgramStatus })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  >
                    <option value="Diteruskan">🟢 Diteruskan (Aktif)</option>
                    <option value="Batal">🔴 Dibatalkan (Batal)</option>
                  </select>
                </div>
              </div>

              {/* Tarikh & Masa Mula & Tamat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tarikh & Masa Mula *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.dateTime}
                    onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tarikh & Masa Tamat (Pilihan)</label>
                  <input
                    type="datetime-local"
                    value={formData.endDateTime}
                    onChange={(e) => setFormData({ ...formData, endDateTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Tempat Program */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tempat Program *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bilik Mesyuarat Utama, Aras 4 / Google Meet"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              {/* Catatan / Keterangan */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan / Ringkasan Program</label>
                <textarea
                  rows={3}
                  placeholder="Ringkasan atau maklumat tambahan berkaitan program..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                ></textarea>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                {editingEvent ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      handleTriggerDeleteEvent(editingEvent);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Padam Program</span>
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
                  >
                    {editingEvent ? 'Simpan Kemaskini' : 'Cipta Program'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL JANA LAPORAN PROGRAM AGIHAN (KPI) */}
      <ProgramAgihanReportModal
        isOpen={isAgihanReportModalOpen}
        onClose={() => setIsAgihanReportModalOpen(false)}
        items={programAgihanList}
      />

      {/* MODAL PENGESAHAN PADAM REKOD PROGRAM AGIHAN (KPI) */}
      {agihanToDelete && (
        <div className="fixed inset-0 z-[130] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-auto relative">
            <div className="flex items-center gap-3.5 pb-3 border-b border-slate-100">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Padam Rekod Program Agihan (KPI)?
                </h3>
                <p className="text-xs text-slate-500">
                  Tindakan ini akan memadam rekod ini secara kekal daripada sistem dan Firebase.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Nama Program / Aktiviti:</span>
                <span className="font-extrabold text-slate-800 text-sm">{agihanToDelete.namaProgram}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Nama PIC:</span>
                  <span className="font-bold text-slate-700">{agihanToDelete.namaPic}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Tarikh:</span>
                  <span className="font-bold text-slate-700">
                    {new Date(agihanToDelete.tarikh).toLocaleDateString('ms-MY', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Lokasi:</span>
                <span className="font-medium text-slate-700">{agihanToDelete.lokasi}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setAgihanToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteAgihan}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-black transition-all shadow-md shadow-rose-600/20 flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Padam Rekod</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PENGESAHAN PADAM PROGRAM / AKTIVITI BIASA */}
      {eventToDelete && (
        <div className="fixed inset-0 z-[130] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-auto relative">
            <div className="flex items-center gap-3.5 pb-3 border-b border-slate-100">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Padam Program Ini?
                </h3>
                <p className="text-xs text-slate-500">
                  Adakah anda pasti untuk memadam rekod program ini daripada takwim?
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Nama Program:</span>
                <span className="font-extrabold text-slate-800 text-sm">{eventToDelete.title}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Kategori:</span>
                  <span className="font-bold text-slate-700">{eventToDelete.category}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Status:</span>
                  <span className="font-bold text-slate-700">{eventToDelete.status}</span>
                </div>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Lokasi:</span>
                <span className="font-medium text-slate-700">{eventToDelete.location}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setEventToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteEvent}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-black transition-all shadow-md shadow-rose-600/20 flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Padam Program</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
