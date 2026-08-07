import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Copy, 
  Check, 
  Plus, 
  ClipboardCheck, 
  Users, 
  MailCheck, 
  CheckCircle2, 
  BookOpen,
  X,
  PlusCircle,
  FolderPlus,
  Pencil,
  Trash2,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';
import { FormatTemplate, AduanCase } from '../types';
import { FORMAT_TEMPLATES } from '../data/mockData';

interface CatatanFormatViewProps {
  cases: AduanCase[];
  onAddNote: (aduanId: string, noteData: any) => Promise<void>;
  preselectedCaseId?: string;
}

const DEFAULT_CATEGORIES = [
  'Bantuan Sewa Rumah',
  'Bantuan Deposit Sewa',
  'Bantuan Tunggakan Utiliti',
  'Bantuan Tunggakan Sewa/Ansuran Rumah',
  'Bantuan Kewangan',
  'Bantuan Penerapan Nilai Islam',
  'Tambang Pengangkutan Sekolah'
];

export const CatatanFormatView: React.FC<CatatanFormatViewProps> = ({
  cases,
  preselectedCaseId,
}) => {
  // Load initial formats from localStorage or mockData
  const [templates, setTemplates] = useState<FormatTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('WORKSPACE_CATATAN_FORMATS_V2');
      return saved ? JSON.parse(saved) : FORMAT_TEMPLATES;
    } catch {
      return FORMAT_TEMPLATES;
    }
  });

  // Load categories from localStorage or DEFAULT_CATEGORIES
  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('WORKSPACE_CATATAN_CATEGORIES_V2');
      return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  });

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('Semua');

  const [selectedFormat, setSelectedFormat] = useState<FormatTemplate>(templates[0] || FORMAT_TEMPLATES[0]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Form states for active content editor
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFormatId, setEditingFormatId] = useState<string | null>(null);

  // Delete Confirm Modal State
  const [deleteConfirmFmt, setDeleteConfirmFmt] = useState<FormatTemplate | null>(null);

  // Modal Form States
  const [newFormatTitle, setNewFormatTitle] = useState('');
  const [newFormatCategory, setNewFormatCategory] = useState(categories[0] || 'Bantuan Sewa Rumah');
  const [newFormatDesc, setNewFormatDesc] = useState('');
  const [newFormatContent, setNewFormatContent] = useState('');

  // Inline Add New Category State inside Modal
  const [showAddCategoryInput, setShowAddCategoryInput] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [categorySuccessMsg, setCategorySuccessMsg] = useState('');

  // Save formats & categories to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('WORKSPACE_CATATAN_FORMATS_V2', JSON.stringify(templates));
    } catch (e) {
      console.error(e);
    }
  }, [templates]);

  useEffect(() => {
    try {
      localStorage.setItem('WORKSPACE_CATATAN_CATEGORIES_V2', JSON.stringify(categories));
    } catch (e) {
      console.error(e);
    }
  }, [categories]);

  // Multi-keyword Search & Filter Logic
  const filteredTemplates = templates.filter((fmt) => {
    // 1. Category Filter
    if (selectedCategoryFilter !== 'Semua' && fmt.category !== selectedCategoryFilter) {
      return false;
    }

    // 2. Keyword Search
    if (!searchQuery.trim()) return true;

    const keywords = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const searchableText = `${fmt.title} ${fmt.category} ${fmt.description} ${fmt.code} ${fmt.templateContent}`.toLowerCase();

    // Check if every keyword matches somewhere in the searchable text
    return keywords.every((kw) => searchableText.includes(kw));
  });

  const handleApplyTemplate = (fmt: FormatTemplate) => {
    setSelectedFormat(fmt);
    setTitle(fmt.title);
    
    // Auto-populate placeholders if case selected
    const targetCase = cases.find(c => c.id === preselectedCaseId) || cases[0];
    let populated = fmt.templateContent;
    if (targetCase) {
      populated = populated
        .replace(/\[No\. Rujukan\]|\[No\. Rujukan Kes\]/g, targetCase.noRujukan)
        .replace(/\[Tajuk Aduan\]|\[Tajuk\]/g, targetCase.tajuk)
        .replace(/\[Nama Pengadu\]/g, targetCase.namaPengadu)
        .replace(/\[Kategori Aduan\]/g, targetCase.kategori)
        .replace(/\[Lokasi Terperinci\]/g, targetCase.lokasi || 'Lokasi Tapak')
        .replace(/\[Nama Pegawai\]/g, targetCase.assignee);
    }
    setContent(populated);
  };

  const handleCopyCardTemplate = (fmt: FormatTemplate) => {
    navigator.clipboard.writeText(fmt.templateContent);
    setCopiedId(fmt.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Copy Catatan from Main Textarea Editor
  const handleCopyMainContent = () => {
    if (!content.trim()) return;
    const fullTextToCopy = title.trim() ? `[${title}]\n\n${content}` : content;
    navigator.clipboard.writeText(fullTextToCopy);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  const handleCreateCategory = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customCategoryInput.trim();
    if (!trimmed) return;

    if (!categories.includes(trimmed)) {
      const updated = [...categories, trimmed];
      setCategories(updated);
      setNewFormatCategory(trimmed);
      setCategorySuccessMsg(`Kategori Bantuan "${trimmed}" berjaya ditambah!`);
      setTimeout(() => setCategorySuccessMsg(''), 3000);
    } else {
      setNewFormatCategory(trimmed);
    }
    setCustomCategoryInput('');
    setShowAddCategoryInput(false);
  };

  const handleOpenAddModal = () => {
    setEditingFormatId(null);
    setNewFormatTitle('');
    setNewFormatCategory(categories[0] || 'Bantuan Sewa Rumah');
    setNewFormatDesc('');
    setNewFormatContent('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (fmt: FormatTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFormatId(fmt.id);
    setNewFormatTitle(fmt.title);
    setNewFormatCategory(fmt.category);
    setNewFormatDesc(fmt.description);
    setNewFormatContent(fmt.templateContent);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmFmt) return;
    const targetId = deleteConfirmFmt.id;
    const updated = templates.filter(t => t.id !== targetId);
    setTemplates(updated);

    if (selectedFormat.id === targetId) {
      if (updated.length > 0) {
        setSelectedFormat(updated[0]);
      }
    }
    setDeleteConfirmFmt(null);
  };

  const handleSaveFormatModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormatTitle.trim() || !newFormatContent.trim()) return;

    if (editingFormatId) {
      // Update existing format
      const updated = templates.map(t => {
        if (t.id === editingFormatId) {
          return {
            ...t,
            title: newFormatTitle.trim(),
            category: newFormatCategory,
            description: newFormatDesc.trim() || 'Format khusus catatan siasatan & bantuan.',
            templateContent: newFormatContent.trim(),
          };
        }
        return t;
      });
      setTemplates(updated);
      
      const editedItem = updated.find(t => t.id === editingFormatId);
      if (editedItem) {
        setSelectedFormat(editedItem);
        setTitle(editedItem.title);
        setContent(editedItem.templateContent);
      }
    } else {
      // Create new format
      const newFmt: FormatTemplate = {
        id: `fmt-custom-${Date.now()}`,
        code: `FORMAT_${newFormatCategory.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_${Date.now()}`,
        title: newFormatTitle.trim(),
        category: newFormatCategory,
        description: newFormatDesc.trim() || 'Format khusus catatan siasatan & bantuan.',
        iconName: 'ClipboardCheck',
        templateContent: newFormatContent.trim(),
      };

      setTemplates([newFmt, ...templates]);
      setSelectedFormat(newFmt);
      setTitle(newFmt.title);
      setContent(newFmt.templateContent);
    }

    // Reset Modal
    setNewFormatTitle('');
    setNewFormatDesc('');
    setNewFormatContent('');
    setIsModalOpen(false);
  };

  const getFormatIcon = (name: string) => {
    switch (name) {
      case 'ClipboardCheck': return <ClipboardCheck className="w-5 h-5 text-emerald-700" />;
      case 'Users': return <Users className="w-5 h-5 text-blue-700" />;
      case 'MailCheck': return <MailCheck className="w-5 h-5 text-purple-700" />;
      default: return <CheckCircle2 className="w-5 h-5 text-indigo-700" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">
            Format / Template Catatan
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Pusat rujukan dan penjanaan template minit mesyuarat, format catatan siasatan tapak, serta draf surat rasmi maklum balas kes aduan.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Tambah Format</span>
        </button>
      </div>

      {/* Carian & Penapis Format Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Bar with Multi-keyword support */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari format catatan (taip pelbagai kata kunci / tajuk / kategori)..."
            className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-md"
              title="Padam carian"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Filter Dropdown */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold shrink-0">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            <span>Penapis:</span>
          </div>
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option value="Semua">Semua Kategori ({templates.length})</option>
            {categories.map((cat) => {
              const count = templates.filter((t) => t.category === cat).length;
              return (
                <option key={cat} value={cat}>
                  {cat} ({count})
                </option>
              );
            })}
          </select>

          {(searchQuery || selectedCategoryFilter !== 'Semua') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategoryFilter('Semua');
              }}
              className="px-2.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors flex items-center gap-1"
              title="Reset Carian & Penapis"
            >
              <RefreshCw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Result Counter Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-slate-600">
          Senarai Format {filteredTemplates.length} daripada {templates.length}
        </span>
        {searchQuery && (
          <span className="text-[11px] text-indigo-600 font-semibold bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
            Hasil carian kata kunci: "{searchQuery}"
          </span>
        )}
      </div>

      {/* Preset Format Cards Grid */}
      {filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {filteredTemplates.map((fmt) => (
            <div
              key={fmt.id}
              className={`bg-white rounded-2xl p-4 border transition-all shadow-sm hover:shadow-md space-y-3 flex flex-col justify-between relative group ${
                selectedFormat.id === fmt.id ? 'border-indigo-600 ring-2 ring-indigo-500/10' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                    {getFormatIcon(fmt.iconName)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {fmt.category}
                    </span>
                    
                    {/* Action Edit & Delete Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => handleOpenEditModal(fmt, e)}
                        title="Kemaskini Format"
                        className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmFmt(fmt);
                        }}
                        title="Padam Format"
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
                <h4 className="text-xs font-bold text-slate-800 leading-snug">{fmt.title}</h4>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{fmt.description}</p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleApplyTemplate(fmt)}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5 text-white" />
                  <span>Guna Format</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyCardTemplate(fmt)}
                  title="Salin Teks Template"
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                >
                  {copiedId === fmt.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Tiada format ditemui</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Tiada template format yang sepadan dengan carian kata kunci "{searchQuery}". Sila cuba kata kunci lain atau reset penapis.
            </p>
          </div>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategoryFilter('Semua');
            }}
            className="px-4 py-2 bg-indigo-50 text-indigo-600 font-bold text-xs rounded-xl hover:bg-indigo-100 transition-colors inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Carian & Penapis</span>
          </button>
        </div>
      )}

      {/* Editor & Copy Catatan Panel */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <h4 className="text-sm font-bold text-slate-800">
              Penyedia Catatan & Format Minit Aduan
            </h4>
          </div>
          {copySuccess && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 animate-fade-in flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>✓ Catatan Berjaya Disalin ke Clipboard!</span>
            </span>
          )}
        </div>

        <div className="space-y-4">
          {/* Note Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tajuk / Subjek Catatan
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Minit Siasatan Tapak / Catatan Bantuan Kebajikan..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Text Area Content */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Kandungan Format Catatan *
              </label>
              <span className="text-[10px] text-slate-400 font-medium">
                Sila kemaskini medan bertanda [ ] mengikut maklumat siasatan sebenar.
              </span>
            </div>
            <textarea
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Pilih format di atas atau tulis catatan rasmi..."
              className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 leading-relaxed"
            />
          </div>

          {/* Action Row: Copy Catatan Button */}
          <div className="flex items-center justify-end pt-2">
            <button
              type="button"
              onClick={handleCopyMainContent}
              disabled={!content.trim()}
              className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Copy className="w-4 h-4 text-white" />
              <span>{copySuccess ? 'Disalin!' : 'Copy Catatan'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Tambah / Kemaskini Format & Kategori Bantuan */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold tracking-tight">
                    {editingFormatId ? 'Kemaskini Format Catatan' : 'Tambah Format Catatan Baharu'}
                  </h3>
                  <p className="text-xs text-slate-300 font-medium">
                    Bina templat ayat catatan dan tentukan Kategori Bantuan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveFormatModal} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              
              {/* Kategori Bantuan Selection & Creation */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-800">
                    Kategori Bantuan *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddCategoryInput(!showAddCategoryInput)}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>+ Kategori Baharu</span>
                  </button>
                </div>

                <select
                  value={newFormatCategory}
                  onChange={(e) => {
                    if (e.target.value === '__NEW__') {
                      setShowAddCategoryInput(true);
                    } else {
                      setNewFormatCategory(e.target.value);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="__NEW__">+ Cipta Jenis Kategori Bantuan Baharu...</option>
                </select>

                {categorySuccessMsg && (
                  <p className="text-[11px] font-bold text-emerald-600 mt-1">
                    {categorySuccessMsg}
                  </p>
                )}

                {/* Inline Add Category Input */}
                {showAddCategoryInput && (
                  <div className="mt-2 p-3 rounded-xl bg-indigo-50/80 border border-indigo-100 space-y-2 animate-fade-in">
                    <span className="text-[11px] font-bold text-indigo-900 block">
                      Masukkan Nama Kategori Bantuan Baharu:
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={customCategoryInput}
                        onChange={(e) => setCustomCategoryInput(e.target.value)}
                        placeholder="Contoh: Bantuan Bencana / Bantuan Kebajikan"
                        className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-indigo-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={handleCreateCategory}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 shrink-0"
                      >
                        Tambah
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddCategoryInput(false)}
                        className="px-2 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 text-xs"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Tajuk Format */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Tajuk Format / Template *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Format Catatan Semakan Bantuan Kewangan"
                  value={newFormatTitle}
                  onChange={(e) => setNewFormatTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Penerangan Ringkas */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Penerangan Ringkas
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Templat minit permohonan dan sokongan bantuan bagi kelulusan..."
                  value={newFormatDesc}
                  onChange={(e) => setNewFormatDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Kandungan Format Ayat / Template */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-800">
                    Kandungan Format Ayat / Templat *
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Gunakan tanda [ ] untuk pembolehubah
                  </span>
                </div>
                <textarea
                  rows={6}
                  required
                  placeholder={`Minit Cadangan Bantuan:\n- Kategori: [Jenis Bantuan]\n- Nama Pemohon: [Nama Pengadu]\n- Status Semakan: [Lulus / Ditolak]\n- Catatan Siasatan: [Tulis perincian kat sini...]`}
                  value={newFormatContent}
                  onChange={(e) => setNewFormatContent(e.target.value)}
                  className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 flex items-center gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>{editingFormatId ? 'Kemaskini Format' : 'Simpan Format'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pengesahan Padam */}
      {deleteConfirmFmt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center font-bold shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Padam Format Catatan</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak boleh dibatalkan.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
              Adakah anda pasti mahu memadam format <strong className="text-slate-900">"{deleteConfirmFmt.title}"</strong>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmFmt(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Padam</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
