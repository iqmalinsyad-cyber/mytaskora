import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  FileText, 
  FileSpreadsheet, 
  Archive, 
  Image as ImageIcon, 
  File, 
  ExternalLink, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  Eye, 
  X, 
  RefreshCw,
  FolderDown,
  Layers,
  Info
} from 'lucide-react';
import { UserProfile } from '../types';
import { downloadService, DownloadFileItem } from '../services/downloadService';

interface DownloadCenterViewProps {
  currentUser?: UserProfile;
}

const CATEGORIES = [
  'Semua',
  'Borang & Format',
  'Garis Panduan',
  'Templat / Format',
  'Pek Maklumat',
];

const PRESET_IMAGES = [
  { label: 'Borang / Dokumen', url: 'https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&q=80&w=600' },
  { label: 'Garis Panduan / Buku', url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=600' },
  { label: 'Excel / Data', url: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=600' },
  { label: 'Infografik / Design', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600' },
  { label: 'Pelekat / Folder', url: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=600' },
  { label: 'Aplikasi / Sistem', url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600' },
];

export const DownloadCenterView: React.FC<DownloadCenterViewProps> = ({ currentUser }) => {
  const [items, setItems] = useState<DownloadFileItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Admin File Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DownloadFileItem | null>(null);

  // Admin Category Management States
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');
  const [editingCat, setEditingCat] = useState<{ oldName: string; newName: string } | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Borang & Format',
    downloadUrl: '',
    imageUrl: '',
    fileType: 'PDF',
    fileSize: '1.5 MB',
  });

  const roleLower = (currentUser?.role || '').toLowerCase();
  const isAdmin = roleLower.includes('pentadbir') || roleLower.includes('admin') || roleLower.includes('editor');

  useEffect(() => {
    downloadService.setupFirebaseSubscription();
    const unsubItems = downloadService.subscribe((updatedItems) => {
      setItems(updatedItems);
    });
    const unsubCats = downloadService.subscribeCategories((updatedCats) => {
      setCategories(updatedCats);
      if (updatedCats.length > 0 && !updatedCats.includes(formData.category)) {
        setFormData((prev) => ({ ...prev, category: updatedCats[0] }));
      }
    });
    return () => {
      unsubItems();
      unsubCats();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      description: '',
      category: 'Borang & Format',
      downloadUrl: '',
      imageUrl: PRESET_IMAGES[0].url,
      fileType: 'PDF',
      fileSize: '1.5 MB',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: DownloadFileItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description,
      category: item.category,
      downloadUrl: item.downloadUrl,
      imageUrl: item.imageUrl,
      fileType: item.fileType,
      fileSize: item.fileSize,
    });
    setIsModalOpen(true);
  };

  const handleSaveFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.downloadUrl.trim()) {
      showToast('⚠️ Sila isi tajuk dan pautan muat turun fail!');
      return;
    }

    if (editingItem) {
      await downloadService.updateFile(editingItem.id, {
        ...formData,
        updatedBy: currentUser?.name || 'Pentadbir Sistem',
      });
      showToast('✅ Fail berjaya dikemaskini dan disinkronkan ke Firebase!');
    } else {
      await downloadService.addFile({
        ...formData,
        updatedBy: currentUser?.name || 'Pentadbir Sistem',
      });
      showToast('🎉 Fail muat turun baharu berjaya ditambah dan disinkronkan ke Firebase!');
    }

    setIsModalOpen(false);
  };

  const handleDeleteFile = async (id: string, title: string) => {
    if (window.confirm(`Adakah anda pasti untuk memadam fail "${title}"?`)) {
      await downloadService.deleteFile(id);
      showToast('🗑️ Fail telah dipadam daripada koleksi.');
    }
  };

  const handleDownload = async (item: DownloadFileItem) => {
    await downloadService.recordDownload(item.id);
    showToast(`⏬ Memulakan muat turun untuk "${item.title}"...`);
    window.open(item.downloadUrl, '_blank', 'noopener,noreferrer');
  };

  // Category CRUD Handlers
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatInput.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      showToast(`⚠️ Kategori "${trimmed}" sudah wujud!`);
      return;
    }
    await downloadService.addCategory(trimmed);
    showToast(`✅ Kategori "${trimmed}" berjaya ditambah & disinkronkan ke Firebase!`);
    setNewCatInput('');
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat || !editingCat.newName.trim()) return;
    const trimmed = editingCat.newName.trim();
    await downloadService.updateCategory(editingCat.oldName, trimmed);
    if (selectedCategory === editingCat.oldName) {
      setSelectedCategory(trimmed);
    }
    showToast(`✅ Kategori dikemaskini daripada "${editingCat.oldName}" kepada "${trimmed}"!`);
    setEditingCat(null);
  };

  const handleDeleteCategory = async (catName: string) => {
    if (window.confirm(`Adakah anda pasti untuk memadam kategori "${catName}"?\n(Aksi ini akan dipautkan dan disinkronkan terus ke Firebase)`)) {
      await downloadService.deleteCategory(catName);
      if (selectedCategory === catName) {
        setSelectedCategory('Semua');
      }
      showToast(`🗑️ Kategori "${catName}" telah dipadam.`);
    }
  };

  const allCategoryTabs = ['Semua', ...categories];

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.fileType.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'Semua' || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const totalDownloads = items.reduce((acc, curr) => acc + (curr.downloadCount || 0), 0);

  const getFileBadgeColor = (type: string) => {
    const t = type.toUpperCase();
    if (t === 'PDF') return 'bg-rose-500 text-white';
    if (t === 'XLSX' || t === 'XLS') return 'bg-emerald-600 text-white';
    if (t === 'DOCX' || t === 'DOC') return 'bg-blue-600 text-white';
    if (t === 'ZIP' || t === 'RAR') return 'bg-amber-600 text-white';
    return 'bg-indigo-600 text-white';
  };

  const getFileTypeIcon = (type: string) => {
    const t = type.toUpperCase();
    if (t === 'PDF') return FileText;
    if (t === 'XLSX' || t === 'XLS') return FileSpreadsheet;
    if (t === 'ZIP' || t === 'RAR') return Archive;
    if (t === 'PNG' || t === 'JPG' || t === 'JPEG') return ImageIcon;
    return File;
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-800 animate-bounce">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Hero Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-900/50">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
              <FolderDown className="w-3.5 h-3.5" />
              <span>Pusat Perkongsian Fail & Koleksi Muat Turun</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              MyDownload - Muat Turun fail
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed font-medium">
              Sebarang fail yang dikongsi dalam sistem ini dan fail yang dimuat turun, dilarang untuk dipasarkan atau dijual kepada pihak luar
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {isAdmin && (
              <>
                <button
                  onClick={() => setIsCatModalOpen(true)}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
                  title="Urus, Tambah, Edit, atau Padam Kategori Fail"
                >
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>Urus Kategori (Admin)</span>
                </button>
                <button
                  onClick={handleOpenAddModal}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all shadow-lg flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Tambah Fail Baharu (Admin)</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Quick Stats bar */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Jumlah Fail</span>
              <span className="text-base font-bold text-white">{items.length} Dokumen</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Jumlah Muat Turun</span>
              <span className="text-base font-bold text-white">{totalDownloads} Kali</span>
            </div>
          </div>

          <div className="flex items-center gap-3 col-span-2 sm:col-span-1">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Status Pengasahan</span>
              <span className="text-xs font-bold text-emerald-400">Pautan Terkawal Firebase</span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Information Bar */}
      {isAdmin && (
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-950 text-xs font-medium flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Akses Pentadbir / Admin:</strong> Anda boleh menukar pautan muat turun, imej muka depan, tajuk, dan penerangan fail. Setiap kemaskini disinkronkan secara automatik ke Firebase.
            </span>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="px-3 py-1.5 rounded-xl bg-amber-600 text-white font-bold text-[11px] hover:bg-amber-700 transition-all shrink-0 cursor-pointer shadow-2xs"
          >
            + Tambah Fail
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari fail, borang, jenis..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
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

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {allCategoryTabs.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Download Items Collection Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <FolderDown className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Tiada Fail Ditemui</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Tiada dokumen atau fail muat turun yang sepadan dengan carian atau kategori ini.
          </p>
          {isAdmin && (
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all cursor-pointer"
            >
              + Tambah Fail Baharu
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredItems.map((item) => {
            const IconComponent = getFileTypeIcon(item.fileType);

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden group"
              >
                {/* Image Cover & Thumbnail Header */}
                <div className="relative h-44 bg-slate-100 overflow-hidden">
                  <img
                    src={item.imageUrl || PRESET_IMAGES[0].url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      // Fallback image if custom image URL fails
                      (e.target as HTMLImageElement).src = PRESET_IMAGES[0].url;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

                  {/* Badges on image */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wide shadow-xs ${getFileBadgeColor(item.fileType)}`}>
                      {item.fileType}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur-xs">
                      {item.fileSize}
                    </span>
                  </div>

                  {/* Admin quick buttons on top right */}
                  {isAdmin && (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 rounded-lg bg-white/90 text-slate-800 hover:bg-amber-500 hover:text-white transition-colors shadow-xs cursor-pointer"
                        title="Kemaskini Fail & Link (Admin)"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteFile(item.id, item.title)}
                        className="p-1.5 rounded-lg bg-white/90 text-slate-800 hover:bg-rose-600 hover:text-white transition-colors shadow-xs cursor-pointer"
                        title="Padam Fail"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Bottom category badge inside image */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-[11px] font-semibold">
                    <span className="truncate px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md">
                      {item.category}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-slate-200">
                      <Download className="w-3 h-3 text-amber-400" />
                      {item.downloadCount || 0}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-extrabold text-slate-900 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Card Footer Metadata & Action */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                      <span className="flex items-center gap-1 truncate">
                        <Clock className="w-3 h-3 shrink-0" />
                        {new Date(item.updatedAt).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      {item.updatedBy && (
                        <span className="truncate max-w-[110px]" title={item.updatedBy}>
                          Oleh: {item.updatedBy}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleDownload(item)}
                      className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Muat Turun Fail</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Add/Edit Download Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold">
                    {editingItem ? 'Kemaskini Fail Muat Turun (Admin)' : 'Tambah Fail Muat Turun Baharu (Admin)'}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Sediakan pautan muat turun, gambar muka depan, dan metadata fail.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveFile} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tajuk Fail / Nama Dokumen <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="cth: Borang Permohonan Aduan Integriti v2.1"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori Fail
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jenis Fail & Saiz
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={formData.fileType}
                      onChange={(e) => setFormData({ ...formData, fileType: e.target.value })}
                      className="w-1/2 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    >
                      <option value="PDF">PDF</option>
                      <option value="DOCX">DOCX</option>
                      <option value="XLSX">XLSX</option>
                      <option value="ZIP">ZIP</option>
                      <option value="PNG">PNG</option>
                      <option value="JPG">JPG</option>
                    </select>
                    <input
                      type="text"
                      value={formData.fileSize}
                      onChange={(e) => setFormData({ ...formData, fileSize: e.target.value })}
                      placeholder="cth: 2.4 MB"
                      className="w-1/2 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pautan Muat Turun (Download URL) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={formData.downloadUrl}
                  onChange={(e) => setFormData({ ...formData, downloadUrl: e.target.value })}
                  placeholder="https://drive.google.com/file/... atau pautan PDF direct"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Masukkan pautan langsung, Google Drive share link, atau fail web server.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pautan Gambar Muka Depan / Thumbnail (Gambar Fail)
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />

                {/* Preset image buttons */}
                <div className="mt-2 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 block">Pilih Gambar Praset Sedia Ada:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_IMAGES.map((img) => (
                      <button
                        key={img.label}
                        type="button"
                        onClick={() => setFormData({ ...formData, imageUrl: img.url })}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                          formData.imageUrl === img.url
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {img.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Penerangan Ringkas Fail
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Jelaskan secara ringkas kandungan fail ini untuk maklumat pengguna..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden resize-none"
                />
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Simpan & Sync Firebase</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Admin Category Management Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold">Pengurusan Kategori Fail (Admin)</h3>
                  <p className="text-[11px] text-slate-300">
                    Tambah, kemaskini, atau padam kategori fail. Semua tindakan disinkronkan ke Firebase.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsCatModalOpen(false);
                  setEditingCat(null);
                }}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Add New Category Form */}
              <form onSubmit={handleAddCategory} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <label className="block text-xs font-extrabold text-slate-800">
                  + Tambah Kategori Baharu
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={newCatInput}
                    onChange={(e) => setNewCatInput(e.target.value)}
                    placeholder="cth: Perkeliling & Arahan"
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
                  >
                    Tambah
                  </button>
                </div>
              </form>

              {/* Existing Categories List */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                  <span>Senarai Kategori Sedia Ada ({categories.length})</span>
                  <span className="text-[10px] text-slate-400 font-normal">Disinkronkan ke Firestore</span>
                </h4>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                  {categories.map((cat) => {
                    const isEditingThis = editingCat?.oldName === cat;

                    return (
                      <div key={cat} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors">
                        {isEditingThis ? (
                          <form onSubmit={handleUpdateCategory} className="flex-1 flex items-center gap-2">
                            <input
                              type="text"
                              required
                              autoFocus
                              value={editingCat.newName}
                              onChange={(e) => setEditingCat({ ...editingCat, newName: e.target.value })}
                              className="flex-1 px-3 py-1.5 rounded-lg border border-indigo-400 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                            />
                            <button
                              type="submit"
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg cursor-pointer"
                            >
                              Simpan
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCat(null)}
                              className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-semibold rounded-lg cursor-pointer"
                            >
                              Batal
                            </button>
                          </form>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-indigo-500" />
                              <span className="text-xs font-bold text-slate-800">{cat}</span>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setEditingCat({ oldName: cat, newName: cat })}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                                title="Edit Nama Kategori"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(cat)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Padam Kategori"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsCatModalOpen(false);
                  setEditingCat(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
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
