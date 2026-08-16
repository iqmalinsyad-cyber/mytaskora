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
  RefreshCw,
  Calculator,
  ArrowLeft
} from 'lucide-react';
import { FormatTemplate, AduanCase, UserProfile } from '../types';
import { FORMAT_TEMPLATES } from '../data/mockData';
import { catatanTemplateService } from '../services/catatanTemplateService';

interface CatatanFormatViewProps {
  cases: AduanCase[];
  onAddNote: (aduanId: string, noteData: any) => Promise<void>;
  preselectedCaseId?: string;
  currentUser?: UserProfile;
}

export const CatatanFormatView: React.FC<CatatanFormatViewProps> = ({
  cases,
  preselectedCaseId,
  currentUser,
}) => {
  const [templates, setTemplates] = useState<FormatTemplate[]>(() => catatanTemplateService.getTemplates());
  const [categories, setCategories] = useState<string[]>(() => catatanTemplateService.getCategories());

  const roleLower = (currentUser?.role || '').toLowerCase();
  const isAdmin = roleLower.includes('pentadbir') || roleLower.includes('admin');

  useEffect(() => {
    const unsubTemplates = catatanTemplateService.subscribeTemplates((ts) => {
      setTemplates(ts);
    });
    const unsubCategories = catatanTemplateService.subscribeCategories((cs) => {
      setCategories(cs);
    });
    return () => {
      unsubTemplates();
      unsubCategories();
    };
  }, []);

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

  // Calculator Popup State
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcFormula, setCalcFormula] = useState('');
  const [calcCopyToast, setCalcCopyToast] = useState('');

  const safeEvalCalc = (expr: string): string => {
    try {
      const cleanExpr = expr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/%/g, '/100')
        .replace(/[^0-9+\-*/.]/g, '');
      if (!cleanExpr) return '0';
      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${cleanExpr})`)();
      if (isNaN(result) || !isFinite(result)) return 'Ralat';
      return Number.isInteger(result) ? result.toString() : parseFloat(result.toFixed(6)).toString();
    } catch (err) {
      return 'Ralat';
    }
  };

  const handleCalcClick = (val: string) => {
    if (val === 'C') {
      setCalcDisplay('0');
      setCalcFormula('');
      return;
    }

    if (val === 'DEL') {
      if (calcDisplay.length <= 1 || calcDisplay === 'Ralat') {
        setCalcDisplay('0');
      } else {
        setCalcDisplay(calcDisplay.slice(0, -1).trim());
      }
      return;
    }

    if (val === '=') {
      if (calcDisplay === 'Ralat') return;
      const res = safeEvalCalc(calcDisplay);
      setCalcFormula(`${calcDisplay} =`);
      setCalcDisplay(res);
      return;
    }

    if (['+', '-', '×', '÷'].includes(val)) {
      if (calcDisplay === 'Ralat') {
        setCalcDisplay(`0 ${val} `);
        return;
      }
      const lastChar = calcDisplay.trim().slice(-1);
      if (['+', '-', '×', '÷'].includes(lastChar)) {
        setCalcDisplay(calcDisplay.trim().slice(0, -1) + ` ${val} `);
      } else {
        setCalcDisplay(`${calcDisplay} ${val} `);
      }
      return;
    }

    if (calcDisplay === '0' && val !== '.') {
      setCalcDisplay(val);
    } else if (calcDisplay === 'Ralat') {
      setCalcDisplay(val);
    } else {
      setCalcDisplay(calcDisplay + val);
    }
  };

  const handleCopyCalcResult = () => {
    navigator.clipboard.writeText(calcDisplay);
    setCalcCopyToast('Hasil disalin ke clipboard!');
    setTimeout(() => setCalcCopyToast(''), 2000);
  };

  const handleInsertCalcToContent = () => {
    setContent((prev) => (prev ? `${prev}\n\n[Hasil Kiraan: ${calcDisplay}]` : `[Hasil Kiraan: ${calcDisplay}]`));
    setCalcCopyToast('Dimasukkan ke dalam catatan!');
    setTimeout(() => setCalcCopyToast(''), 2000);
  };

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

  // Text Case Transformation Helpers
  const toSentenceCase = (str: string): string => {
    if (!str) return '';
    return str
      .toLowerCase()
      .replace(/(^\s*|[.!?\n]\s*|[-•*\[]\s*|\d+\.\s*)([a-z\u00C0-\u017F])/g, (match, prefix, char) => {
        return prefix + char.toUpperCase();
      });
  };

  // Copy Catatan from Main Textarea Editor
  const handleCopyMainContent = () => {
    if (!content.trim()) return;
    navigator.clipboard.writeText(content);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  const handleCreateCategory = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customCategoryInput.trim();
    if (!trimmed) return;

    catatanTemplateService.addCategory(trimmed);
    setNewFormatCategory(trimmed);
    setCategorySuccessMsg(`Kategori Bantuan "${trimmed}" berjaya ditambah!`);
    setTimeout(() => setCategorySuccessMsg(''), 3000);
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

  const handleConfirmDelete = async () => {
    if (!deleteConfirmFmt) return;
    const targetId = deleteConfirmFmt.id;
    await catatanTemplateService.deleteTemplate(targetId);

    if (selectedFormat.id === targetId) {
      const remaining = templates.filter(t => t.id !== targetId);
      if (remaining.length > 0) {
        setSelectedFormat(remaining[0]);
      }
    }
    setDeleteConfirmFmt(null);
  };

  const handleSaveFormatModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormatTitle.trim() || !newFormatContent.trim()) return;

    if (editingFormatId) {
      const existing = templates.find(t => t.id === editingFormatId);
      if (existing) {
        const updatedItem: FormatTemplate = {
          ...existing,
          title: newFormatTitle.trim(),
          category: newFormatCategory,
          description: newFormatDesc.trim() || 'Format khusus catatan siasatan & bantuan.',
          templateContent: newFormatContent.trim(),
        };
        await catatanTemplateService.saveTemplate(updatedItem);
        setSelectedFormat(updatedItem);
        setTitle(updatedItem.title);
        setContent(updatedItem.templateContent);
      }
    } else {
      const newFmt: FormatTemplate = {
        id: `fmt-custom-${Date.now()}`,
        code: `FORMAT_${newFormatCategory.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_${Date.now()}`,
        title: newFormatTitle.trim(),
        category: newFormatCategory,
        description: newFormatDesc.trim() || 'Format khusus catatan siasatan & bantuan.',
        iconName: 'ClipboardCheck',
        templateContent: newFormatContent.trim(),
      };

      await catatanTemplateService.saveTemplate(newFmt);
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
    <div className="space-y-4 lg:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">
            Format / Template Catatan
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Pusat rujukan dan penjanaan template  sokongan permohonan EOAD
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Tambah Format (Admin)</span>
          </button>
        )}
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
                    {isAdmin && (
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
                    )}
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
              Pratonton Catatan & Format Sokongan
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Kandungan Format Catatan <span className="text-rose-500">*</span>
              </label>
              
              {/* Text Case Formatting Controls */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-400 mr-1 hidden sm:inline">Format Huruf:</span>
                <button
                  type="button"
                  onClick={() => setContent((prev) => prev.toUpperCase())}
                  disabled={!content}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 text-[11px] font-extrabold text-slate-700 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
                  title="CAPSLOCK (Tukar semua huruf kepada huruf besar)"
                >
                  <span className="font-mono font-black text-xs text-indigo-600">AA</span>
                  <span>CAPSLOCK</span>
                </button>
                <button
                  type="button"
                  onClick={() => setContent((prev) => prev.toLowerCase())}
                  disabled={!content}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 text-[11px] font-semibold text-slate-700 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
                  title="Huruf kecil (Tukar semua huruf kepada huruf kecil)"
                >
                  <span className="font-mono font-black text-xs text-indigo-600">aa</span>
                  <span>Huruf Kecil</span>
                </button>
                <button
                  type="button"
                  onClick={() => setContent((prev) => toSentenceCase(prev))}
                  disabled={!content}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 text-[11px] font-semibold text-slate-700 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
                  title="Huruf besar di hadapan setiap ayat (Sentence case)"
                >
                  <span className="font-mono font-black text-xs text-indigo-600">Aa</span>
                  <span>Huruf Besar Awal Ayat</span>
                </button>
              </div>
            </div>
            <textarea
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Pilih format di atas atau tulis catatan rasmi..."
              className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 leading-relaxed"
            />
            <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
              <span>Sila kemaskini medan bertanda [ ] mengikut maklumat siasatan sebenar.</span>
              <span>{content.length} aksara</span>
            </div>
          </div>

          {/* Action Row: Kalkulator & Copy Catatan Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsCalculatorOpen(true)}
              className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              title="Buka Kalkulator"
            >
              <Calculator className="w-4 h-4 text-white" />
              <span>Kalkulator</span>
            </button>
            <button
              type="button"
              onClick={handleCopyMainContent}
              disabled={!content.trim()}
              className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Copy className="w-4 h-4 text-white" />
              <span>{copySuccess ? 'Disalin!' : 'Copy Catatan'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Tambah / Kemaskini Format & Kategori Bantuan */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col my-auto max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
                  <label className="block font-bold text-slate-800">
                    Kandungan Format Ayat / Templat *
                  </label>
                  <div className="flex items-center gap-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setNewFormatContent((prev) => prev.toUpperCase())}
                      disabled={!newFormatContent}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 text-[10px] font-extrabold text-slate-700 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
                      title="CAPSLOCK semua huruf"
                    >
                      <span className="font-mono font-black text-indigo-600">AA</span>
                      <span>CAPSLOCK</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewFormatContent((prev) => prev.toLowerCase())}
                      disabled={!newFormatContent}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 text-[10px] font-semibold text-slate-700 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
                      title="Semua huruf kecil"
                    >
                      <span className="font-mono font-black text-indigo-600">aa</span>
                      <span>Huruf Kecil</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewFormatContent((prev) => toSentenceCase(prev))}
                      disabled={!newFormatContent}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 text-[10px] font-semibold text-slate-700 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
                      title="Huruf besar di hadapan setiap ayat"
                    >
                      <span className="font-mono font-black text-indigo-600">Aa</span>
                      <span>Huruf Besar Awal Ayat</span>
                    </button>
                  </div>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 p-5 sm:p-6 space-y-4 my-auto max-h-[90vh]">
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

      {/* Modal Popup Kalkulator */}
      {isCalculatorOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in zoom-in-95 duration-150">
          <div className="bg-slate-900 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-800 p-5 space-y-4 relative text-white my-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white tracking-tight">Kalkulator Catatan</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Kiraan pantas semasa mencatat</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCalculatorOpen(false)}
                className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Tutup Kalkulator"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Display Screen */}
            <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800/80 space-y-1 text-right min-h-[80px] flex flex-col justify-end">
              <div className="text-[11px] font-mono text-emerald-400/80 h-4 overflow-hidden truncate">
                {calcFormula || '\u00A0'}
              </div>
              <div className="text-2xl font-black font-mono tracking-tight text-white overflow-x-auto whitespace-nowrap scrollbar-none">
                {calcDisplay}
              </div>
            </div>

            {/* Toast Feedback */}
            {calcCopyToast && (
              <div className="text-[11px] font-bold text-center text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 py-1.5 px-3 rounded-xl animate-fade-in">
                ✓ {calcCopyToast}
              </div>
            )}

            {/* Keypad Buttons Grid */}
            <div className="grid grid-cols-4 gap-2 text-sm font-extrabold font-mono">
              {/* Row 1 */}
              <button
                type="button"
                onClick={() => handleCalcClick('C')}
                className="p-3 rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-all cursor-pointer"
              >
                C
              </button>
              <button
                type="button"
                onClick={() => handleCalcClick('DEL')}
                className="p-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all cursor-pointer flex items-center justify-center"
                title="Padam 1 Aksara"
              >
                ⌫
              </button>
              <button
                type="button"
                onClick={() => handleCalcClick('%')}
                className="p-3 rounded-xl bg-slate-800 text-emerald-400 hover:bg-slate-700 transition-all cursor-pointer"
              >
                %
              </button>
              <button
                type="button"
                onClick={() => handleCalcClick('÷')}
                className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all cursor-pointer"
              >
                ÷
              </button>

              {/* Row 2 */}
              {['7', '8', '9'].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleCalcClick(n)}
                  className="p-3 rounded-xl bg-slate-800/80 text-white hover:bg-slate-700 transition-all cursor-pointer"
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleCalcClick('×')}
                className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all cursor-pointer"
              >
                ×
              </button>

              {/* Row 3 */}
              {['4', '5', '6'].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleCalcClick(n)}
                  className="p-3 rounded-xl bg-slate-800/80 text-white hover:bg-slate-700 transition-all cursor-pointer"
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleCalcClick('-')}
                className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all cursor-pointer"
              >
                -
              </button>

              {/* Row 4 */}
              {['1', '2', '3'].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleCalcClick(n)}
                  className="p-3 rounded-xl bg-slate-800/80 text-white hover:bg-slate-700 transition-all cursor-pointer"
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleCalcClick('+')}
                className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all cursor-pointer"
              >
                +
              </button>

              {/* Row 5 */}
              <button
                type="button"
                onClick={() => handleCalcClick('0')}
                className="p-3 rounded-xl bg-slate-800/80 text-white hover:bg-slate-700 transition-all cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleCalcClick('.')}
                className="p-3 rounded-xl bg-slate-800/80 text-white hover:bg-slate-700 transition-all cursor-pointer"
              >
                .
              </button>
              <button
                type="button"
                onClick={() => handleCalcClick('=')}
                className="col-span-2 p-3 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-black transition-all cursor-pointer"
              >
                =
              </button>
            </div>

            {/* Extra Actions Footer */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleInsertCalcToContent}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-black transition-all cursor-pointer"
              >
                Masuk Dalam Catatan
              </button>
              <button
                type="button"
                onClick={handleCopyCalcResult}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Salin
              </button>
              <button
                type="button"
                onClick={() => setIsCalculatorOpen(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
