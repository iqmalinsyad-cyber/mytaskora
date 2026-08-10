import React, { useState, useEffect } from 'react';
import { 
  ExternalLink, 
  Search, 
  Plus, 
  Bookmark, 
  Pin, 
  Edit3, 
  Trash2, 
  Globe, 
  FileText, 
  FileSpreadsheet, 
  Shield, 
  Link as LinkIcon, 
  Copy, 
  Check, 
  MousePointerClick, 
  Sparkles, 
  FolderGit2
} from 'lucide-react';
import { LinkItem, UserProfile } from '../types';
import { linkhubService } from '../services/linkhubService';

interface LinkHubViewProps {
  currentUser: UserProfile;
}

const DEFAULT_CATEGORIES = [
  'Sistem Kerajaan',
  'Panduan & SOP',
  'Borang & Dokumen',
  'Pautan Luar',
  'Rujukan Am'
];

const DEFAULT_ICONS = [
  { value: 'Globe', label: '🌐 Portal' },
  { value: 'FileText', label: '📄 Pekeliling' },
  { value: 'FileSpreadsheet', label: '📊 Borang / Dokumen' },
  { value: 'Shield', label: '🛡️ Penting' },
  { value: 'Bookmark', label: '🔖 Rujukan' },
  { value: 'Link', label: '🔗 Pautan Umum' }
];

export const LinkHubView: React.FC<LinkHubViewProps> = ({ currentUser }) => {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Category List State
  const [categoryList, setCategoryList] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('WORKSPACE_LINK_HUB_CATEGORIES_V3');
      return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  });

  // Icon Options State
  const [iconOptions, setIconOptions] = useState<{ value: string; label: string }[]>(() => {
    try {
      const saved = localStorage.getItem('WORKSPACE_LINK_HUB_ICONS_V3');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((item: { value: string; label: string }) => {
          if (item.label === '🌐 Globe / Portal') return { ...item, label: '🌐 Portal' };
          if (item.label === '📄 Pekeliling / SOP') return { ...item, label: '📄 Pekeliling' };
          if (item.label === '🛡️ Integriti / SPRM') return { ...item, label: '🛡️ Penting' };
          if (item.label === '🔖 Bookmark / Rujukan') return { ...item, label: '🔖 Rujukan' };
          return item;
        });
      }
      return DEFAULT_ICONS;
    } catch {
      return DEFAULT_ICONS;
    }
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formCategory, setFormCategory] = useState<string>('Sistem Kerajaan');
  const [formDescription, setFormDescription] = useState('');
  const [formIcon, setFormIcon] = useState('Globe');
  const [formIsPinned, setFormIsPinned] = useState(false);

  // Inline Creation UI States
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  const [isCreatingIcon, setIsCreatingIcon] = useState(false);
  const [newIconLabel, setNewIconLabel] = useState('');

  // Feedback Toast & Copied State
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Delete Confirmation State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const unsub = linkhubService.subscribe((data) => {
      setLinks(data);
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  // Sync categoryList & iconOptions to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('WORKSPACE_LINK_HUB_CATEGORIES_V3', JSON.stringify(categoryList));
    } catch (e) {
      console.error(e);
    }
  }, [categoryList]);

  useEffect(() => {
    try {
      localStorage.setItem('WORKSPACE_LINK_HUB_ICONS_V3', JSON.stringify(iconOptions));
    } catch (e) {
      console.error(e);
    }
  }, [iconOptions]);

  const loadLinks = async () => {
    setIsLoading(true);
    const data = await linkhubService.getLinks();
    setLinks(data);
    setIsLoading(false);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getFaviconUrl = (urlStr: string) => {
    if (!urlStr || !urlStr.trim()) return '';
    try {
      const cleanUrl = urlStr.trim().startsWith('http') ? urlStr.trim() : `https://${urlStr.trim()}`;
      const hostname = new URL(cleanUrl).hostname;
      if (!hostname || !hostname.includes('.')) return '';
      return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=64`;
    } catch {
      return '';
    }
  };

  const handleOpenAddModal = () => {
    setEditingLink(null);
    setFormTitle('');
    setFormUrl('');
    setFormCategory(categoryList[0] || 'Sistem Kerajaan');
    setFormDescription('');
    setFormIcon(iconOptions[0]?.value || 'Globe');
    setFormIsPinned(false);
    setIsCreatingCategory(false);
    setIsCreatingIcon(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (link: LinkItem) => {
    setEditingLink(link);
    setFormTitle(link.title);
    setFormUrl(link.url);
    setFormCategory(link.category || categoryList[0]);
    setFormDescription(link.description || '');
    setFormIcon(link.icon || 'Globe');
    setFormIsPinned(!!link.isPinned);
    setIsCreatingCategory(false);
    setIsCreatingIcon(false);
    setIsModalOpen(true);
  };

  // Category Handlers
  const handleAddCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    if (categoryList.includes(trimmed)) {
      showToast(`Kategori "${trimmed}" sudah sedia ada.`);
      return;
    }
    const updated = [...categoryList, trimmed];
    setCategoryList(updated);
    setFormCategory(trimmed);
    setNewCategoryInput('');
    setIsCreatingCategory(false);
    showToast(`Kategori baharu "${trimmed}" berjaya dicipta!`);
  };

  const handleDeleteCategory = (catToDelete: string) => {
    if (categoryList.length <= 1) {
      showToast('Sistem memerlukan sekurang-kurangnya 1 kategori.');
      return;
    }
    const updated = categoryList.filter((c) => c !== catToDelete);
    setCategoryList(updated);
    if (formCategory === catToDelete) {
      setFormCategory(updated[0]);
    }
    showToast(`Kategori "${catToDelete}" telah dipadam.`);
  };

  // Icon Handlers
  const handleAddIcon = () => {
    const trimmed = newIconLabel.trim();
    if (!trimmed) return;
    if (iconOptions.some((i) => i.value === trimmed || i.label === trimmed)) {
      showToast(`Pilihan ikon "${trimmed}" sudah wujud.`);
      return;
    }
    const newOpt = { value: trimmed, label: trimmed };
    const updated = [...iconOptions, newOpt];
    setIconOptions(updated);
    setFormIcon(trimmed);
    setNewIconLabel('');
    setIsCreatingIcon(false);
    showToast(`Ikon baharu "${trimmed}" berjaya dicipta!`);
  };

  const handleDeleteIcon = (iconValToDelete: string) => {
    if (iconOptions.length <= 1) {
      showToast('Sistem memerlukan sekurang-kurangnya 1 pilihan ikon.');
      return;
    }
    const updated = iconOptions.filter((i) => i.value !== iconValToDelete);
    setIconOptions(updated);
    if (formIcon === iconValToDelete) {
      setFormIcon(updated[0].value);
    }
    showToast(`Pilihan ikon "${iconValToDelete}" telah dipadam.`);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formUrl.trim()) return;

    let formattedUrl = formUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const calculatedFavicon = getFaviconUrl(formattedUrl);

    const itemToSave: LinkItem = {
      id: editingLink ? editingLink.id : `link-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: formTitle.trim(),
      url: formattedUrl,
      category: formCategory,
      description: formDescription.trim(),
      icon: formIcon,
      faviconUrl: calculatedFavicon,
      isPinned: formIsPinned,
      createdBy: editingLink ? editingLink.createdBy : currentUser.name,
      createdAt: editingLink ? editingLink.createdAt : new Date().toISOString(),
      clickCount: editingLink ? editingLink.clickCount : 0,
    };

    const updated = await linkhubService.saveLink(itemToSave);
    setLinks(updated);
    setIsModalOpen(false);

    showToast(
      editingLink
        ? `Pautan "${formTitle.trim()}" & Favicon Web berjaya dikemaskini!`
        : `Pautan baharu "${formTitle.trim()}" & Favicon Web berjaya disimpan!`
    );
  };

  const handleDeleteConfirm = async (id: string) => {
    const updated = await linkhubService.deleteLink(id);
    setLinks(updated);
    setDeletingId(null);
    showToast('Pautan telah dipadam daripada Linkhub.');
  };

  const handleTogglePin = async (id: string) => {
    const updated = await linkhubService.togglePin(id);
    setLinks(updated);
    const item = updated.find((l) => l.id === id);
    if (item) {
      showToast(item.isPinned ? 'Pautan telah disemat (Pinned).' : 'Disyahsemat daripada senarai pautan utama.');
    }
  };

  const handleOpenLink = async (link: LinkItem) => {
    const updated = await linkhubService.incrementClick(link.id);
    setLinks(updated);
    window.open(link.url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyUrl = (link: LinkItem, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(link.url);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast('Pautan URL telah disalin ke papan klip!');
  };

  const renderIcon = (iconName?: string) => {
    switch (iconName) {
      case 'FileText':
        return <FileText className="w-5 h-5 text-indigo-600" />;
      case 'FileSpreadsheet':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
      case 'Shield':
        return <Shield className="w-5 h-5 text-amber-600" />;
      case 'Bookmark':
        return <Bookmark className="w-5 h-5 text-purple-600" />;
      case 'Link':
        return <LinkIcon className="w-5 h-5 text-sky-600" />;
      case 'Globe':
        return <Globe className="w-5 h-5 text-blue-600" />;
      default:
        if (iconName && iconName.trim().length > 0) {
          return <span className="text-sm font-extrabold leading-none">{iconName}</span>;
        }
        return <Globe className="w-5 h-5 text-blue-600" />;
    }
  };

  const renderFaviconAndIcon = (link: LinkItem, isPinned?: boolean) => {
    const favUrl = link.faviconUrl || getFaviconUrl(link.url);
    return (
      <div className={`p-2 rounded-xl border shrink-0 flex items-center justify-center w-10 h-10 overflow-hidden relative ${
        isPinned ? 'bg-indigo-100/90 border-indigo-200' : 'bg-slate-100 border-slate-200/80'
      }`}>
        {favUrl ? (
          <img
            src={favUrl}
            alt={link.title}
            className="w-6 h-6 object-contain rounded-md bg-white p-0.5 border border-slate-200/80 shadow-2xs"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              const fallback = parent?.querySelector('.fallback-icon-box');
              if (fallback) (fallback as HTMLElement).style.display = 'flex';
            }}
          />
        ) : null}
        <div className={`fallback-icon-box items-center justify-center ${favUrl ? 'hidden' : 'flex'}`}>
          {renderIcon(link.icon)}
        </div>
      </div>
    );
  };

  // Filter links
  const filteredLinks = links.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.url.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const pinnedLinks = filteredLinks.filter((l) => l.isPinned);
  const otherLinks = filteredLinks.filter((l) => !l.isPinned);

  const filterCategories = [
    { id: 'all', label: 'Semua Kategori' },
    ...categoryList.map((cat) => ({ id: cat, label: cat }))
  ];

  return (
    <div className="space-y-4 lg:space-y-5 animate-fade-in pb-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3 text-xs font-bold animate-fade-in">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 rounded-3xl p-5 lg:p-6 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-lg ring-4 ring-indigo-500/20 shrink-0">
              <FolderGit2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold tracking-tight">Linkhub Pusat Rujukan & Pautan</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  {links.length} Pautan Tersimpan
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                Himpunan pautan / Link
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs transition-all flex items-center gap-2 shadow-lg hover:shadow-indigo-500/25 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pautan Baharu</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari tajuk pautan, URL, rujukan..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Category Selector Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {filterCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all border ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* PINNED LINKS SECTION */}
      {pinnedLinks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-900 uppercase tracking-wider">
            <Pin className="w-4 h-4 text-indigo-600 fill-indigo-600" />
            <span>Pautan Utama Disemat ({pinnedLinks.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pinnedLinks.map((link) => (
              <div
                key={link.id}
                className="bg-gradient-to-br from-indigo-50/60 via-white to-white rounded-2xl p-4 border-2 border-indigo-200 shadow-xs hover:shadow-md transition-all relative flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    {renderFaviconAndIcon(link, true)}

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleTogglePin(link.id)}
                        className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-100 transition-colors"
                        title="Nyahsemat pautan"
                      >
                        <Pin className="w-3.5 h-3.5 fill-indigo-600" />
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(link)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Edit Pautan"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setDeletingId(link.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Padam Pautan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-sm line-clamp-1 group-hover:text-indigo-600 transition-colors">
                    {link.title}
                  </h3>

                  {link.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {link.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-3 text-[10px] font-bold">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 border border-indigo-200">
                      {link.category}
                    </span>
                    <span className="text-slate-400 flex items-center gap-1 font-mono">
                      <MousePointerClick className="w-3 h-3 text-indigo-500" />
                      {link.clickCount || 0} Klik
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={(e) => handleCopyUrl(link, e)}
                    className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 text-xs font-bold transition-all flex items-center gap-1.5"
                    title="Salin Pautan"
                  >
                    {copiedId === link.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span className="text-[11px]">{copiedId === link.id ? 'Disalin' : 'Salin'}</span>
                  </button>

                  <button
                    onClick={() => handleOpenLink(link)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-2xs"
                  >
                    <span>Buka Pautan</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ALL OTHER LINKS SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700 uppercase tracking-wider">
            <Globe className="w-4 h-4 text-indigo-600" />
            <span>Semua Pautan Rujukan ({otherLinks.length})</span>
          </div>
        </div>

        {filteredLinks.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">Tiada Pautan Dijumpai</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Sila cuba tukar kata kunci carian atau tambah pautan rujukan baharu ke dalam sistem.
            </p>

            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs inline-flex items-center gap-2 mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Pautan Baharu</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherLinks.map((link) => (
              <div
                key={link.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    {renderFaviconAndIcon(link, false)}

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleTogglePin(link.id)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Semat pautan"
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(link)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Edit Pautan"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setDeletingId(link.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Padam Pautan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-sm line-clamp-1 group-hover:text-indigo-600 transition-colors">
                    {link.title}
                  </h3>

                  {link.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {link.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-3 text-[10px] font-bold">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      {link.category}
                    </span>
                    <span className="text-slate-400 flex items-center gap-1 font-mono">
                      <MousePointerClick className="w-3 h-3 text-slate-400" />
                      {link.clickCount || 0} Klik
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={(e) => handleCopyUrl(link, e)}
                    className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 text-xs font-bold transition-all flex items-center gap-1.5"
                    title="Salin Pautan"
                  >
                    {copiedId === link.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span className="text-[11px]">{copiedId === link.id ? 'Disalin' : 'Salin'}</span>
                  </button>

                  <button
                    onClick={() => handleOpenLink(link)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-2xs"
                  >
                    <span>Buka Pautan</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: ADD / EDIT LINK */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-slate-200 space-y-4 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <LinkIcon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  {editingLink ? 'Edit Pautan Linkhub' : 'Tambah Pautan Baharu'}
                </h3>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-extrabold px-2 py-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4">
              {/* Tajuk Pautan */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Tajuk Pautan *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Cth: Portal SiPAB / Portal SPRM"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* URL Pautan */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Alamat Web (URL) *</label>
                <input
                  type="text"
                  required
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://www.malaysia.gov.my"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />

                {/* Live Favicon Preview */}
                {formUrl.trim() && getFaviconUrl(formUrl) ? (
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-900 font-medium mt-1">
                    <Globe className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Favicon Web Automatik:</span>
                    <img
                      src={getFaviconUrl(formUrl)}
                      alt="Favicon Web"
                      className="w-4 h-4 object-contain rounded-sm bg-white p-0.5 border border-slate-200"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <span className="font-mono text-[10px] text-indigo-700 font-bold truncate">
                      {(() => {
                        try {
                          const clean = formUrl.trim().startsWith('http') ? formUrl.trim() : `https://${formUrl.trim()}`;
                          return new URL(clean).hostname;
                        } catch {
                          return formUrl;
                        }
                      })()}
                    </span>
                  </div>
                ) : null}
              </div>

              {/* Kategori Pautan (With Cipta & Padam) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">Kategori Pautan *</label>
                  <div className="flex items-center gap-1">
                    {!isCreatingCategory ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setIsCreatingCategory(true)}
                          className="text-[11px] font-extrabold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Cipta Kategori</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(formCategory)}
                          className="text-[11px] font-extrabold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-lg transition-colors flex items-center gap-1"
                          title="Padam Kategori yang dipilih"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Padam</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsCreatingCategory(false)}
                        className="text-[11px] font-extrabold text-slate-500 hover:text-slate-700"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </div>

                {isCreatingCategory ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      autoFocus
                      value={newCategoryInput}
                      onChange={(e) => setNewCategoryInput(e.target.value)}
                      placeholder="Taip Nama Kategori Baharu..."
                      className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCategory();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-extrabold hover:bg-indigo-700 shadow-2xs"
                    >
                      Simpan
                    </button>
                  </div>
                ) : (
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {categoryList.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Pilih Ikon (With Cipta & Padam) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">Pilih Ikon *</label>
                  <div className="flex items-center gap-1">
                    {!isCreatingIcon ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setIsCreatingIcon(true)}
                          className="text-[11px] font-extrabold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Cipta Ikon</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteIcon(formIcon)}
                          className="text-[11px] font-extrabold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-lg transition-colors flex items-center gap-1"
                          title="Padam Ikon yang dipilih"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Padam</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsCreatingIcon(false)}
                        className="text-[11px] font-extrabold text-slate-500 hover:text-slate-700"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </div>

                {isCreatingIcon ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      autoFocus
                      value={newIconLabel}
                      onChange={(e) => setNewIconLabel(e.target.value)}
                      placeholder="Cth: ⚡ Kilat / 🏛️ Mahkamah..."
                      className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddIcon();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddIcon}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-extrabold hover:bg-indigo-700 shadow-2xs"
                    >
                      Simpan
                    </button>
                  </div>
                ) : (
                  <select
                    value={formIcon}
                    onChange={(e) => setFormIcon(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {iconOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Penerangan Ringkas */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Penerangan Ringkas (Opsional)</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Catat kegunaan pautan ini..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                ></textarea>
              </div>

              {/* Checkbox Semat */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pinCheckbox"
                  checked={formIsPinned}
                  onChange={(e) => setFormIsPinned(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <label htmlFor="pinCheckbox" className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5 cursor-pointer">
                  <Pin className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Sematkan pautan ini di bahagian atas (Pinned)</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-sm"
                >
                  {editingLink ? 'Kemaskini Pautan' : 'Simpan Pautan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: DELETE */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-200 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Padam Pautan Ini?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Adakah anda pasti mahu memadam rekod pautan ini daripada Linkhub?
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
              >
                Batal
              </button>

              <button
                onClick={() => handleDeleteConfirm(deletingId)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-sm"
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
