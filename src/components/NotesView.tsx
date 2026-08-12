import React, { useState, useEffect } from 'react';
import { 
  StickyNote, 
  Plus, 
  Search, 
  Pin, 
  Trash2, 
  Edit3, 
  Copy, 
  Check, 
  Tag, 
  FolderPlus, 
  X, 
  Clock, 
  User, 
  Sparkles,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { NoteItem, notesService } from '../services/notesService';
import { UserProfile } from '../types';

interface NotesViewProps {
  currentUser?: UserProfile;
}

const COLOR_THEMES: Record<string, { bg: string; border: string; badge: string; text: string; pin: string }> = {
  amber: {
    bg: 'bg-amber-50/70 hover:bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    text: 'text-amber-900',
    pin: 'text-amber-600 fill-amber-500',
  },
  emerald: {
    bg: 'bg-emerald-50/70 hover:bg-emerald-50',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    text: 'text-emerald-900',
    pin: 'text-emerald-600 fill-emerald-500',
  },
  sky: {
    bg: 'bg-sky-50/70 hover:bg-sky-50',
    border: 'border-sky-200',
    badge: 'bg-sky-100 text-sky-800 border-sky-200',
    text: 'text-sky-900',
    pin: 'text-sky-600 fill-sky-500',
  },
  indigo: {
    bg: 'bg-indigo-50/70 hover:bg-indigo-50',
    border: 'border-indigo-200',
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    text: 'text-indigo-900',
    pin: 'text-indigo-600 fill-indigo-500',
  },
  purple: {
    bg: 'bg-purple-50/70 hover:bg-purple-50',
    border: 'border-purple-200',
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
    text: 'text-purple-900',
    pin: 'text-purple-600 fill-purple-500',
  },
  rose: {
    bg: 'bg-rose-50/70 hover:bg-rose-50',
    border: 'border-rose-200',
    badge: 'bg-rose-100 text-rose-800 border-rose-200',
    text: 'text-rose-900',
    pin: 'text-rose-600 fill-rose-500',
  },
  slate: {
    bg: 'bg-slate-50/70 hover:bg-slate-50',
    border: 'border-slate-200',
    badge: 'bg-slate-100 text-slate-800 border-slate-200',
    text: 'text-slate-900',
    pin: 'text-slate-600 fill-slate-500',
  },
};

export const NotesView: React.FC<NotesViewProps> = ({ currentUser }) => {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState('Umum');
  const [formColor, setFormColor] = useState('amber');
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [formTags, setFormTags] = useState('');

  // Category Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Confirm Delete Modals
  const [noteToDeleteConfirm, setNoteToDeleteConfirm] = useState<{ id: string; title: string } | null>(null);
  const [categoryToDeleteConfirm, setCategoryToDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    const unsubNotes = notesService.subscribe((updatedNotes) => {
      setNotes(updatedNotes);
    });
    const unsubCats = notesService.subscribeCategories((updatedCats) => {
      setCategories(updatedCats);
    });
    return () => {
      unsubNotes();
      unsubCats();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const resetFormState = () => {
    setEditingNote(null);
    setFormTitle('');
    setFormContent('');
    setFormCategory(categories[0] || 'Umum');
    setFormColor('amber');
    setFormIsPinned(false);
    setFormTags('');
  };

  const handleOpenCreateModal = () => {
    resetFormState();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (note: NoteItem) => {
    setEditingNote(note);
    setFormTitle(note.title);
    setFormContent(note.content);
    setFormCategory(note.category);
    setFormColor(note.color || 'amber');
    setFormIsPinned(!!note.isPinned);
    setFormTags(note.tags ? note.tags.join(', ') : '');
    setIsModalOpen(true);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      alert('Sila isi Tajuk dan Kandungan Nota!');
      return;
    }

    try {
      setIsSaving(true);
      const tagsArray = formTags
        ? formTags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

      await notesService.saveNote({
        id: editingNote?.id,
        title: formTitle,
        content: formContent,
        category: formCategory,
        color: formColor,
        isPinned: formIsPinned,
        tags: tagsArray,
        authorName: currentUser?.name || 'Pengguna Workspace',
        authorId: currentUser?.id || 'usr-guest',
      });

      // Close modal cleanly
      setIsModalOpen(false);
      resetFormState();
      showToast('Nota berjaya disimpan & disinkronkan!');
    } catch (err) {
      console.error('Failed to save note:', err);
      alert('Ralat semasa menyimpan nota. Sila cuba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestDeleteNote = (id: string, title: string) => {
    setNoteToDeleteConfirm({ id, title });
  };

  const executeDeleteNote = async () => {
    if (!noteToDeleteConfirm) return;
    const { id, title } = noteToDeleteConfirm;
    setNoteToDeleteConfirm(null);
    try {
      await notesService.deleteNote(id);
      showToast(`Nota "${title}" berjaya dipadam.`);
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  const handleTogglePin = async (id: string) => {
    await notesService.togglePinNote(id);
  };

  const handleCopyNote = (id: string, title: string, content: string) => {
    const textToCopy = `${title}\n\n${content}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    await notesService.addCategory(newCategoryName);
    setNewCategoryName('');
    showToast(`Kategori "${newCategoryName.trim()}" berjaya ditambah.`);
  };

  const handleRequestDeleteCategory = (catName: string) => {
    setCategoryToDeleteConfirm(catName);
  };

  const executeDeleteCategory = async () => {
    if (!categoryToDeleteConfirm) return;
    const catName = categoryToDeleteConfirm;
    setCategoryToDeleteConfirm(null);
    try {
      await notesService.deleteCategory(catName);
      if (selectedCategory === catName) setSelectedCategory('Semua');
      showToast(`Kategori "${catName}" berjaya dipadam.`);
    } catch (err) {
      console.error('Failed to delete category:', err);
    }
  };

  // Filtered Notes
  const filteredNotes = notes.filter((note) => {
    const matchCategory = selectedCategory === 'Semua' || note.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      note.title.toLowerCase().includes(q) ||
      note.content.toLowerCase().includes(q) ||
      (note.tags && note.tags.some((t) => t.toLowerCase().includes(q)));
    return matchCategory && matchQuery;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-amber-50 border border-white/30">
              <StickyNote className="w-3.5 h-3.5 text-amber-200" />
              <span>Modul Nota & Rujukan Workspace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Nota & Catatan Rujukan</h1>
            <p className="text-amber-100 text-sm max-w-xl">
              Simpan, susun dan kongsi nota rujukan penting, SOP tugasan, serta maklumat kerja secara masa nyata (Realtime Sync to Firebase).
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/30 font-bold text-xs transition-all flex items-center gap-2 backdrop-blur-sm cursor-pointer shadow-xs"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Urus Kategori</span>
            </button>
            <button
              onClick={handleOpenCreateModal}
              className="px-5 py-2.5 rounded-xl bg-white text-amber-900 hover:bg-amber-50 font-bold text-xs transition-all flex items-center gap-2 shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 text-amber-600" />
              <span>Tambah Nota Baharu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nota, tajuk, atau tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Stats Badge */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 self-end md:self-auto">
            <span>Jumlah Nota:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
              {filteredNotes.length} / {notes.length}
            </span>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1 shrink-0 mr-1">
            <Filter className="w-3.5 h-3.5" /> Kategori:
          </span>
          <button
            onClick={() => setSelectedCategory('Semua')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
              selectedCategory === 'Semua'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            Semua ({notes.length})
          </button>

          {categories.map((cat) => {
            const count = notes.filter((n) => n.category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-amber-700/50 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes Grid Display */}
      {filteredNotes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <StickyNote className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Tiada Nota Dijumpai</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery || selectedCategory !== 'Semua'
              ? 'Tiada nota yang sepadan dengan carian atau tapisan kategori pilihan anda.'
              : 'Belum ada nota dicipta. Klik butang "Tambah Nota Baharu" di atas untuk memulakan.'}
          </p>
          {(searchQuery || selectedCategory !== 'Semua') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('Semua');
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
            >
              Kosongkan Tapisan
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredNotes.map((note) => {
            const theme = COLOR_THEMES[note.color || 'amber'] || COLOR_THEMES['amber'];
            const isCopied = copiedId === note.id;

            return (
              <div
                key={note.id}
                className={`group relative rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between shadow-xs hover:shadow-md ${theme.bg} ${theme.border}`}
              >
                {/* Top Row: Category & Pin */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${theme.badge}`}>
                      {note.category}
                    </span>

                    <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleTogglePin(note.id)}
                        className={`p-1.5 rounded-lg hover:bg-black/5 transition-colors cursor-pointer ${
                          note.isPinned ? theme.pin : 'text-slate-400 hover:text-slate-600'
                        }`}
                        title={note.isPinned ? 'Sahut Pin' : 'Pinkan ke atas'}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleCopyNote(note.id, note.title, note.content)}
                        className="p-1.5 rounded-lg hover:bg-black/5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                        title="Salin Isi Nota"
                      >
                        {isCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(note)}
                        className="p-1.5 rounded-lg hover:bg-black/5 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                        title="Sunting Nota"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleRequestDeleteNote(note.id, note.title)}
                        className="p-1.5 rounded-lg hover:bg-black/5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Padam Nota"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Pinned Indicator */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`font-extrabold text-sm sm:text-base leading-snug ${theme.text}`}>
                      {note.title}
                    </h3>
                  </div>

                  {/* Content Body */}
                  <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed font-sans line-clamp-6">
                    {note.content}
                  </div>
                </div>

                {/* Bottom Metadata & Tags */}
                <div className="mt-4 pt-3 border-t border-black/5 space-y-2">
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1">
                      <Tag className="w-3 h-3 text-slate-400 shrink-0" />
                      {note.tags.map((tag) => (
                        <span key={tag} className="text-[10px] font-semibold text-slate-500 bg-white/60 px-1.5 py-0.2 rounded border border-black/5">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {note.authorName || 'Pengguna'}
                    </span>
                    <span className="flex items-center gap-1" title={new Date(note.updatedAt).toLocaleString()}>
                      <Clock className="w-3 h-3" />
                      {new Date(note.updatedAt).toLocaleDateString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT NOTE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <StickyNote className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  {editingNote ? 'Sunting Nota Rujukan' : 'Tambah Nota Baharu'}
                </h2>
                <p className="text-xs text-slate-500">Nota disinkronkan secara automatik ke pengkalan data Firebase.</p>
              </div>
            </div>

            <form onSubmit={handleSaveNote} className="space-y-4 text-xs">
              {/* Title Input */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Tajuk Nota <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: SOP Tindakan Aduan Integriti..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 font-semibold text-slate-900"
                />
              </div>

              {/* Category & Color Picker Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Kategori</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 font-semibold text-slate-800 bg-white"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Warna Tema Nota</label>
                  <div className="flex items-center gap-2 pt-1">
                    {Object.keys(COLOR_THEMES).map((colKey) => (
                      <button
                        type="button"
                        key={colKey}
                        onClick={() => setFormColor(colKey)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                          colKey === 'amber'
                            ? 'bg-amber-400 border-amber-600'
                            : colKey === 'emerald'
                            ? 'bg-emerald-400 border-emerald-600'
                            : colKey === 'sky'
                            ? 'bg-sky-400 border-sky-600'
                            : colKey === 'indigo'
                            ? 'bg-indigo-400 border-indigo-600'
                            : colKey === 'purple'
                            ? 'bg-purple-400 border-purple-600'
                            : colKey === 'rose'
                            ? 'bg-rose-400 border-rose-600'
                            : 'bg-slate-400 border-slate-600'
                        } ${formColor === colKey ? 'scale-125 ring-2 ring-slate-900/20 shadow-xs' : 'hover:scale-110'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Pin Checkbox & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-1">
                <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsPinned}
                    onChange={(e) => setFormIsPinned(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                  />
                  <span>Pinkan Nota ke Teratas</span>
                </label>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Tag (Dipisahkan koma)</label>
                  <input
                    type="text"
                    placeholder="Contoh: SOP, Hotline, Minit"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-slate-800"
                  />
                </div>
              </div>

              {/* Content Textarea */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Kandungan / Teks Nota <span className="text-rose-500">*</span></label>
                <textarea
                  required
                  rows={6}
                  placeholder="Tuliskan arahan, nota rujukan, atau maklumat lanjut di sini..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 font-sans text-slate-800 text-xs leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition-all shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Simpan Nota</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE CATEGORIES MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsCategoryModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <FolderPlus className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-extrabold text-slate-900">Urus Kategori Nota</h2>
            </div>

            {/* Add Category Form */}
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input
                type="text"
                placeholder="Nama kategori baharu..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 font-semibold"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-all shadow-xs shrink-0 cursor-pointer"
              >
                Tambah
              </button>
            </form>

            {/* Category List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {categories.map((cat) => (
                <div key={cat} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                  <span className="font-bold text-slate-800">{cat}</span>
                  <button
                    type="button"
                    onClick={() => handleRequestDeleteCategory(cat)}
                    className="p-1 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Padam Kategori"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-800 flex items-center gap-3 text-xs font-semibold animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Confirm Delete Note Modal */}
      {noteToDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-center relative animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">Padam Nota Ini?</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Adakah anda pasti ingin memadam nota <span className="font-bold text-slate-800">"{noteToDeleteConfirm.title}"</span>? Tindakan ini tidak boleh dibatalkan dan akan disinkronkan ke Firebase.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setNoteToDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeDeleteNote}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
              >
                Ya, Padam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Category Modal */}
      {categoryToDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-center relative animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">Padam Kategori Ini?</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Adakah anda pasti ingin memadam kategori <span className="font-bold text-slate-800">"{categoryToDeleteConfirm}"</span>?
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCategoryToDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeDeleteCategory}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
              >
                Ya, Padam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
