import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  Printer, 
  Save, 
  FolderOpen, 
  RotateCcw, 
  FileText, 
  Sparkles,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Download,
  X,
  Maximize2,
  Settings,
  ShieldCheck
} from 'lucide-react';
import { AduanCase, UserProfile, LaporanAduanItem } from '../types';
import { laporanAduanService } from '../services/laporanAduanService';
import { printSiasatanReport } from '../utils/printUtils';

interface LaporanAduanViewProps {
  currentUser?: UserProfile | null;
  cases?: AduanCase[];
}

export type SectionKey = 
  | 'sec_tarikh' 
  | 'sec_pemohon' 
  | 'sec_ringkasan' 
  | 'sec_hasil' 
  | 'sec_rekod' 
  | 'sec_cadangan' 
  | 'sec_tindakan' 
  | 'sec_pegawai';

interface SectionMeta {
  key: SectionKey;
  defaultNum: number;
  label: string;
}

const SECTION_METAS: Record<SectionKey, SectionMeta> = {
  sec_tarikh: { key: 'sec_tarikh', defaultNum: 1, label: 'Maklumat Tarikh & Sumber' },
  sec_pemohon: { key: 'sec_pemohon', defaultNum: 2, label: 'Maklumat Kes (Pemohon / Pengadu)' },
  sec_ringkasan: { key: 'sec_ringkasan', defaultNum: 3, label: 'Ringkasan Kes (📌)' },
  sec_hasil: { key: 'sec_hasil', defaultNum: 4, label: 'Hasil Siasatan (🔖)' },
  sec_rekod: { key: 'sec_rekod', defaultNum: 5, label: 'Rekod Bantuan Yang Diterima 2026 (🔖)' },
  sec_cadangan: { key: 'sec_cadangan', defaultNum: 6, label: 'Cadangan Bantuan' },
  sec_tindakan: { key: 'sec_tindakan', defaultNum: 7, label: 'Tindakan LZS (📋)' },
  sec_pegawai: { key: 'sec_pegawai', defaultNum: 8, label: 'Pegawai Penandatangan' },
};

const DEFAULT_SECTION_ORDER: SectionKey[] = [
  'sec_tarikh',
  'sec_pemohon',
  'sec_ringkasan',
  'sec_hasil',
  'sec_rekod',
  'sec_cadangan',
  'sec_tindakan',
  'sec_pegawai',
];

// Date helper: Convert YYYY-MM-DD to Hari/Bulan/Tahun (DD/MM/YYYY)
const formatDateMY = (dateStr: string): string => {
  if (!dateStr) return '';
  const clean = dateStr.trim();
  const ymdMatch = clean.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymdMatch) {
    const [, yyyy, mm, dd] = ymdMatch;
    return `${dd}/${mm}/${yyyy}`;
  }
  return clean;
};

export const LaporanAduanView: React.FC<LaporanAduanViewProps> = ({
  currentUser,
  cases = [],
}) => {
  // Saved Reports state from Firebase / Local Storage
  const [savedReports, setSavedReports] = useState<LaporanAduanItem[]>([]);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  // Form Fields
  const [tarikhTerima, setTarikhTerima] = useState<string>(new Date().toISOString().split('T')[0]);
  const [tarikhSiasatan, setTarikhSiasatan] = useState<string>(new Date().toISOString().split('T')[0]);
  const [sumber, setSumber] = useState<string>('Aduan Awam / Telefon');

  // Maklumat Kes
  const [nama, setNama] = useState<string>('');
  const [noKp, setNoKp] = useState<string>('');
  const [noTel, setNoTel] = useState<string>('');
  const [alamat, setAlamat] = useState<string>('');
  const [kariah, setKariah] = useState<string>('');

  // Point Lists
  const [ringkasanPoints, setRingkasanPoints] = useState<string[]>(['']);
  const [hasilPoints, setHasilPoints] = useState<string[]>(['']);
  const [rekodBantuanPoints, setRekodBantuanPoints] = useState<string[]>(['']);
  const [cadanganBantuan, setCadanganBantuan] = useState<string>('');
  const [tindakanLzsPoints, setTindakanLzsPoints] = useState<string[]>(['']);

  // Pegawai
  const [namaPegawai, setNamaPegawai] = useState<string>(currentUser?.name || 'MUHAMMAD HAFIZ BIN ABDULLAH');
  const [eoad, setEoad] = useState<string>('EOAD Hulu Langat');

  // Admin Section Reordering
  const [sectionOrder, setSectionOrder] = useState<SectionKey[]>(() => {
    try {
      const saved = localStorage.getItem('LAPORAN_SECTION_ORDER');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === DEFAULT_SECTION_ORDER.length) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse saved section order:', e);
    }
    return DEFAULT_SECTION_ORDER;
  });
  const [isReorderMode, setIsReorderMode] = useState<boolean>(false);

  // UI state
  const [copied, setCopied] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [reportToDeleteConfirm, setReportToDeleteConfirm] = useState<LaporanAduanItem | null>(null);

  // Subscribe to Firebase real-time updates for Laporan
  useEffect(() => {
    const unsubscribe = laporanAduanService.subscribe((reports) => {
      setSavedReports(reports);
    });
    return () => unsubscribe();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Section movement handler for Admin
  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sectionOrder.length) return;

    const newOrder = [...sectionOrder];
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    setSectionOrder(newOrder);
    try {
      localStorage.setItem('LAPORAN_SECTION_ORDER', JSON.stringify(newOrder));
    } catch (e) {
      console.error('Failed to save section order:', e);
    }
    showToast('⚡ Kedudukan panel berjaya dikemaskini!');
  };

  const handleResetSectionOrder = () => {
    setSectionOrder(DEFAULT_SECTION_ORDER);
    localStorage.removeItem('LAPORAN_SECTION_ORDER');
    showToast('🔄 Susunan panel dikembalikan ke susunan asal.');
  };

  // Auto-fill from an existing Aduan case
  const handleSelectCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    if (!caseId) return;

    const found = cases.find((c) => c.id === caseId);
    if (found) {
      if (found.tarikhAduan) setTarikhTerima(found.tarikhAduan.split('T')[0]);
      setTarikhSiasatan(new Date().toISOString().split('T')[0]);
      setSumber(`Aduan No Rujukan: ${found.noRujukan}`);
      setNama(found.namaPengadu || '');
      setNoTel(found.telefonPengadu || '');
      setAlamat(found.lokasi || '');
      
      if (found.tajuk || found.penerangan) {
        setRingkasanPoints([found.tajuk, found.penerangan].filter(Boolean));
      }
      showToast(`✅ Maklumat kes ${found.noRujukan} telah dimasukkan!`);
    }
  };

  // Clear Form
  const handleResetForm = () => {
    setActiveReportId(null);
    setSelectedCaseId('');
    setTarikhTerima(new Date().toISOString().split('T')[0]);
    setTarikhSiasatan(new Date().toISOString().split('T')[0]);
    setSumber('Aduan Awam / Telefon');
    setNama('');
    setNoKp('');
    setNoTel('');
    setAlamat('');
    setKariah('');
    setRingkasanPoints(['']);
    setHasilPoints(['']);
    setRekodBantuanPoints(['']);
    setCadanganBantuan('');
    setTindakanLzsPoints(['']);
    setNamaPegawai(currentUser?.name || 'MUHAMMAD HAFIZ BIN ABDULLAH');
    setEoad('EOAD Hulu Langat');
    showToast('🔄 Borang laporan telah disemula (reset).');
  };

  // Helper to manage dynamic points list
  const handlePointChange = (setter: React.Dispatch<React.SetStateAction<string[]>>, index: number, value: string) => {
    setter((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleAddPoint = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev) => [...prev, '']);
  };

  const handleRemovePoint = (setter: React.Dispatch<React.SetStateAction<string[]>>, index: number) => {
    setter((prev) => {
      if (prev.length <= 1) return [''];
      return prev.filter((_, i) => i !== index);
    });
  };

  // Generate exact report text formatted with WhatsApp / Markdown asterisks & Hari/Bulan/Tahun dates
  const generateFormattedReportText = (): string => {
    const cleanRingkasan = ringkasanPoints.map(p => p.trim()).filter(Boolean);
    const cleanHasil = hasilPoints.map(p => p.trim()).filter(Boolean);
    const cleanRekod = rekodBantuanPoints.map(p => p.trim()).filter(Boolean);
    const cleanTindakan = tindakanLzsPoints.map(p => p.trim()).filter(Boolean);

    const ringkasanText = cleanRingkasan.length > 0 
      ? cleanRingkasan.map(p => `📌 ${p}`).join('\n')
      : '📌 ';

    const hasilText = cleanHasil.length > 0 
      ? cleanHasil.map(p => `🔖  ${p}`).join('\n')
      : '🔖  ';

    const rekodText = cleanRekod.length > 0 
      ? cleanRekod.map(p => `🔖  ${p}`).join('\n')
      : '🔖  ';

    const tindakanText = cleanTindakan.length > 0 
      ? cleanTindakan.map(p => `📋   ${p}`).join('\n')
      : '📋   ';

    return `*LAPORAN SIASATAN DAERAH HULU LANGAT*

*Tarikh Terima Aduan:*  ${formatDateMY(tarikhTerima)}
*Tarikh Siasatan:*  ${formatDateMY(tarikhSiasatan)}
*Sumber:* ${sumber || ''}

*MAKLUMAT KES*
*Nama:*  ${nama || ''}
*No KP:*  ${noKp || ''}
*No Tel:*  ${noTel || ''}
*Alamat:* ${alamat || ''}
*Kariah:* ${kariah || ''}

*RINGKASAN KES*
${ringkasanText}

*HASIL SIASATAN*

${hasilText}


*REKOD BANTUAN YANG DITERIMA 2026*

${rekodText}

*CADANGAN BANTUAN*
${cadanganBantuan || ''}

*TINDAKAN LZS*

${tindakanText}


Sekian laporan

${namaPegawai || ''}
EOAD ${eoad || ''}
LZS Daerah Hulu Langat

CC :
KOAD Hulu Langat
*RIDZUAN AHMAD SHUHAIMI*`;
  };

  // Copy to Clipboard
  const handleCopyReport = async () => {
    const reportText = generateFormattedReportText();
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      showToast('📋 Laporan berjaya disalin ke papan keratan (clipboard)!');
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      console.error('Failed to copy report text:', e);
      showToast('❌ Gagal menyalin laporan.');
    }
  };

  // Save Report to Firebase / Local Storage
  const handleSaveReport = async () => {
    if (!nama.trim()) {
      showToast('⚠️ Sila isikan Nama Pemohon / Maklumat Kes terlebih dahulu.');
      return;
    }

    const payload: LaporanAduanItem = {
      id: activeReportId || `lap-${Date.now()}`,
      aduanId: selectedCaseId || '',
      tarikhTerima,
      tarikhSiasatan,
      sumber,
      nama,
      noKp,
      noTel,
      alamat,
      kariah,
      ringkasanPoints: ringkasanPoints.filter(Boolean),
      hasilPoints: hasilPoints.filter(Boolean),
      rekodBantuanPoints: rekodBantuanPoints.filter(Boolean),
      cadanganBantuan,
      tindakanLzsPoints: tindakanLzsPoints.filter(Boolean),
      namaPegawai,
      eoad,
      createdBy: currentUser?.name || 'Pegawai Aduan',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await laporanAduanService.saveLaporan(payload);
      setActiveReportId(payload.id);
      showToast('🔥 Laporan berjaya disimpan dan disegerakkan ke Firebase!');
    } catch (err) {
      console.error('Error saving laporan:', err);
      showToast('❌ Gagal menyimpan laporan.');
    }
  };

  // Load a Saved Report
  const handleLoadReport = (item: LaporanAduanItem) => {
    setActiveReportId(item.id);
    setSelectedCaseId(item.aduanId || '');
    setTarikhTerima(item.tarikhTerima || '');
    setTarikhSiasatan(item.tarikhSiasatan || '');
    setSumber(item.sumber || '');
    setNama(item.nama || '');
    setNoKp(item.noKp || '');
    setNoTel(item.noTel || '');
    setAlamat(item.alamat || '');
    setKariah(item.kariah || '');
    setRingkasanPoints(item.ringkasanPoints && item.ringkasanPoints.length > 0 ? item.ringkasanPoints : ['']);
    setHasilPoints(item.hasilPoints && item.hasilPoints.length > 0 ? item.hasilPoints : ['']);
    setRekodBantuanPoints(item.rekodBantuanPoints && item.rekodBantuanPoints.length > 0 ? item.rekodBantuanPoints : ['']);
    setCadanganBantuan(item.cadanganBantuan || '');
    setTindakanLzsPoints(item.tindakanLzsPoints && item.tindakanLzsPoints.length > 0 ? item.tindakanLzsPoints : ['']);
    setNamaPegawai(item.namaPegawai || '');
    setEoad(item.eoad || '');
    setIsSavedDrawerOpen(false);
    showToast(`📂 Laporan "${item.nama}" dibuka.`);
  };

  // Delete a Saved Report
  const handleDeleteReport = (item: LaporanAduanItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setReportToDeleteConfirm(item);
  };

  // Trigger Printable window / document
  const triggerSystemPrint = async () => {
    const reportText = generateFormattedReportText();
    try {
      await printSiasatanReport(nama || 'Daerah Hulu Langat', reportText);
    } catch (e) {
      console.error('Print error, fallback to window.print():', e);
      window.print();
    }
  };

  // Download Report as Text File
  const handleDownloadTxt = () => {
    const reportText = generateFormattedReportText();
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_Siasatan_${(nama || 'Hulu_Langat').replace(/\s+/g, '_')}_${tarikhSiasatan || '2026'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('📥 Fail Laporan berjaya dimuat turun!');
  };

  // Render individual form sections according to SectionKey
  const renderSectionBlock = (key: SectionKey, displayNum: number, isFirst: boolean, isLast: boolean, index: number) => {
    const meta = SECTION_METAS[key];

    return (
      <div 
        key={key} 
        className={`space-y-4 p-4 sm:p-5 rounded-2xl transition-all border ${
          isReorderMode 
            ? 'bg-amber-50/40 border-amber-300 ring-2 ring-amber-200/60 shadow-xs' 
            : 'bg-white border-slate-100'
        }`}
      >
        {/* Section Header with Admin Reorder Controls */}
        <div className="flex items-center justify-between gap-3 bg-indigo-50/60 px-3 py-2 rounded-xl border border-indigo-100/80">
          <div className="flex items-center gap-2 min-w-0">
            {isReorderMode && (
              <GripVertical className="w-4 h-4 text-amber-600 shrink-0 cursor-grab" />
            )}
            <h3 className="text-xs font-extrabold text-indigo-900 uppercase tracking-wide truncate">
              {displayNum}. {meta.label}
            </h3>
          </div>

          {/* Controls for Admin Reordering */}
          {isReorderMode ? (
            <div className="flex items-center gap-1 shrink-0 bg-white px-2 py-1 rounded-lg border border-amber-200 shadow-2xs">
              <span className="text-[10px] font-black text-amber-700 mr-1">
                #{displayNum}
              </span>
              <button
                type="button"
                onClick={() => handleMoveSection(index, 'up')}
                disabled={isFirst}
                className="p-1 rounded-md text-slate-700 hover:bg-amber-100 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                title="Alih ke atas"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleMoveSection(index, 'down')}
                disabled={isLast}
                className="p-1 rounded-md text-slate-700 hover:bg-amber-100 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                title="Alih ke bawah"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            key === 'sec_ringkasan' ? (
              <button
                type="button"
                onClick={() => handleAddPoint(setRingkasanPoints)}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Point</span>
              </button>
            ) : key === 'sec_hasil' ? (
              <button
                type="button"
                onClick={() => handleAddPoint(setHasilPoints)}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Point</span>
              </button>
            ) : key === 'sec_rekod' ? (
              <button
                type="button"
                onClick={() => handleAddPoint(setRekodBantuanPoints)}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Point</span>
              </button>
            ) : key === 'sec_tindakan' ? (
              <button
                type="button"
                onClick={() => handleAddPoint(setTindakanLzsPoints)}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Point</span>
              </button>
            ) : null
          )}
        </div>

        {/* Section Body Fields */}
        {key === 'sec_tarikh' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Tarikh Terima Aduan <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={tarikhTerima}
                onChange={(e) => setTarikhTerima(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Tarikh Siasatan <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={tarikhSiasatan}
                onChange={(e) => setTarikhSiasatan(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Sumber Aduan
              </label>
              <input
                type="text"
                value={sumber}
                onChange={(e) => setSumber(e.target.value)}
                placeholder="cth: Aduan Awam / Telefon / Surat / Email"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>
        )}

        {key === 'sec_pemohon' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Nama Penuh Pemohon <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Masukkan nama pemohon"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                No KP (Kad Pengenalan)
              </label>
              <input
                type="text"
                value={noKp}
                onChange={(e) => setNoKp(e.target.value)}
                placeholder="cth: 800101-10-1234"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                No Telefon
              </label>
              <input
                type="text"
                value={noTel}
                onChange={(e) => setNoTel(e.target.value)}
                placeholder="cth: 012-3456789"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Alamat Kediaman
              </label>
              <input
                type="text"
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                placeholder="Masukkan alamat lengkap"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Kariah Masjid / Kawasan
              </label>
              <input
                type="text"
                value={kariah}
                onChange={(e) => setKariah(e.target.value)}
                placeholder="cth: MASJID KHADIJAH HULU LANGAT"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>
        )}

        {key === 'sec_ringkasan' && (
          <div className="space-y-2">
            {ringkasanPoints.map((pt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-xs shrink-0 font-bold text-amber-600">📌</span>
                <input
                  type="text"
                  value={pt}
                  onChange={(e) => handlePointChange(setRingkasanPoints, idx, e.target.value)}
                  placeholder={`Point Ringkasan Kes ${idx + 1}`}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                {ringkasanPoints.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePoint(setRingkasanPoints, idx)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {key === 'sec_hasil' && (
          <div className="space-y-2">
            {hasilPoints.map((pt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-xs shrink-0 font-bold text-indigo-600">🔖</span>
                <input
                  type="text"
                  value={pt}
                  onChange={(e) => handlePointChange(setHasilPoints, idx, e.target.value)}
                  placeholder={`Point Hasil Siasatan ${idx + 1}`}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                {hasilPoints.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePoint(setHasilPoints, idx)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {key === 'sec_rekod' && (
          <div className="space-y-2">
            {rekodBantuanPoints.map((pt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-xs shrink-0 font-bold text-indigo-600">🔖</span>
                <input
                  type="text"
                  value={pt}
                  onChange={(e) => handlePointChange(setRekodBantuanPoints, idx, e.target.value)}
                  placeholder={`Rekod Bantuan ${idx + 1}`}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                {rekodBantuanPoints.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePoint(setRekodBantuanPoints, idx)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {key === 'sec_cadangan' && (
          <div className="space-y-2">
            <textarea
              rows={3}
              value={cadanganBantuan}
              onChange={(e) => setCadanganBantuan(e.target.value)}
              placeholder="Masukkan cadangan bantuan..."
              className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden resize-none"
            />
          </div>
        )}

        {key === 'sec_tindakan' && (
          <div className="space-y-2">
            {tindakanLzsPoints.map((pt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-xs shrink-0 font-bold text-emerald-600">📋</span>
                <input
                  type="text"
                  value={pt}
                  onChange={(e) => handlePointChange(setTindakanLzsPoints, idx, e.target.value)}
                  placeholder={`Tindakan LZS ${idx + 1}`}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                {tindakanLzsPoints.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePoint(setTindakanLzsPoints, idx)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {key === 'sec_pegawai' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Nama EOAD
              </label>
              <input
                type="text"
                value={namaPegawai}
                onChange={(e) => setNamaPegawai(e.target.value)}
                placeholder="cth: MUHAMMAD HAFIZ BIN ABDULLAH"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Nama ZON
              </label>
              <input
                type="text"
                value={eoad}
                onChange={(e) => setEoad(e.target.value)}
                placeholder="cth: EOAD Hulu Langat"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[120] bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-fade-in text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER BAR */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 font-bold">
              <ClipboardList className="w-6 h-6" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Penjana Laporan Aduan & Siasatan
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Format Laporan Siasatan Daerah Hulu Langat. Isikan maklumat di bawah untuk menjana laporan
          </p>
        </div>

        {/* Top Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsSavedDrawerOpen(!isSavedDrawerOpen)}
            className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-2 border border-slate-200/80 cursor-pointer"
          >
            <FolderOpen className="w-4 h-4 text-slate-600" />
            <span>Laporan Tersimpan ({savedReports.length})</span>
          </button>

          <button
            onClick={handleResetForm}
            className="px-3.5 py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-200/60 cursor-pointer"
            title="Sifar semula borang"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            onClick={handleSaveReport}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan (Firebase)</span>
          </button>

          <button
            onClick={handleCopyReport}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Disalin!' : 'Salin Laporan'}</span>
          </button>

          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Cetak / PDF</span>
          </button>
        </div>
      </div>

      {/* AUTO-FILL SELECTOR BAR */}
      {cases.length > 0 && (
        <div className="bg-indigo-50/60 rounded-2xl p-4 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-indigo-900 font-bold">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Pilih & Auto-Isi dari Senarai Aduan Kes:</span>
          </div>
          <div className="relative flex-1 max-w-md">
            <select
              value={selectedCaseId}
              onChange={(e) => handleSelectCase(e.target.value)}
              className="w-full pl-3 pr-8 py-2 rounded-xl bg-white border border-indigo-200 text-slate-800 font-medium text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
            >
              <option value="">-- Pilih kes aduan untuk dimasukkan secara automatik --</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.noRujukan}] {c.namaPengadu} - {c.tajuk}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* SAVED REPORTS MODAL / DRAWER */}
      {isSavedDrawerOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-auto max-h-[85vh] overflow-y-auto relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">Senarai Laporan Siasatan Tersimpan</h3>
              </div>
              <button
                onClick={() => setIsSavedDrawerOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>

            {savedReports.length === 0 ? (
              <div className="text-center py-10 space-y-2 text-slate-400">
                <FileText className="w-10 h-10 mx-auto stroke-1" />
                <p className="text-xs font-medium">Tiada laporan disimpan lagi.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1">
                {savedReports.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleLoadReport(item)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                      activeReportId === item.id
                        ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-300'
                        : 'bg-slate-50/50 hover:bg-slate-100 border-slate-200/80'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-900 truncate">
                          {item.nama || 'Tanpa Nama'}
                        </span>
                        {item.noKp && (
                          <span className="text-[10px] font-mono bg-slate-200/60 px-2 py-0.5 rounded-md text-slate-600">
                            {item.noKp}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium truncate">
                        Siasatan: {formatDateMY(item.tarikhSiasatan) || 'N/A'} | Sumber: {item.sumber || 'N/A'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleLoadReport(item)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-[11px] font-bold hover:bg-indigo-700 transition-all cursor-pointer"
                      >
                        Buka
                      </button>
                      <button
                        onClick={(e) => handleDeleteReport(item, e)}
                        className="p-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all cursor-pointer"
                        title="Padam"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PRINT & PDF EXPORT MODAL */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-[130] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-auto max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600">
                  <Printer className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Mod Cetakan & Export PDF</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Pratonton bersih cetakan rasmi Lembaga Zakat Selangor (LZS)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Actions Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 shrink-0 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={triggerSystemPrint}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / Simpan PDF</span>
                </button>

                <button
                  onClick={handleDownloadTxt}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Muat Turun Fail (.txt)</span>
                </button>

                <button
                  onClick={handleCopyReport}
                  className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold transition-all border border-slate-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-4 h-4 text-indigo-600" />
                  <span>Salin Teks</span>
                </button>
              </div>

              <span className="text-[11px] font-semibold text-slate-500">
                A4 Document Ready
              </span>
            </div>

            {/* Document Printable View */}
            <div className="flex-1 overflow-y-auto bg-slate-100 p-4 sm:p-8 rounded-2xl border border-slate-200">
              <div className="printable-document bg-white p-6 sm:p-10 shadow-lg border border-slate-200 rounded-xl font-mono text-xs leading-relaxed text-slate-900 whitespace-pre-wrap select-all">
                <div className="text-center font-bold font-sans text-sm border-b-2 border-slate-900 pb-3 mb-6 tracking-wide">
                  LEMBAGA ZAKAT SELANGOR (LZS) - DAERAH HULU LANGAT<br/>
                  LAPORAN SIASATAN KES ADUAN
                </div>
                {generateFormattedReportText()}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 shrink-0">
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION MODAL FOR DELETING REPORT */}
      {reportToDeleteConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-5 bg-slate-900/80 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl border border-rose-100 space-y-4 text-left my-auto">
            <div className="flex items-center gap-3 text-rose-600 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Sahkan Padam Laporan</h3>
                <p className="text-xs text-slate-500 font-medium">Tindakan ini tidak boleh diundurkan.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Adakah anda pasti untuk memadam laporan siasatan bagi <strong className="text-slate-900">{reportToDeleteConfirm.nama || 'Tanpa Nama'}</strong>?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setReportToDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  const targetId = reportToDeleteConfirm.id;
                  setReportToDeleteConfirm(null);
                  await laporanAduanService.deleteLaporan(targetId);
                  if (activeReportId === targetId) {
                    handleResetForm();
                  }
                  showToast('🗑️ Laporan berjaya dipadam daripada sistem.');
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Padam Laporan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT GRID: FORM ON LEFT, LIVE PREVIEW ON RIGHT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: INPUT FORM WITH DYNAMIC REORDERABLE SECTIONS */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-xs space-y-6">
          
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                Borang Isian Maklumat Siasatan
              </h2>
            </div>

            {/* ADMIN REORDER TOOLBAR */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsReorderMode(!isReorderMode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                  isReorderMode
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs ring-2 ring-amber-300'
                    : 'bg-slate-100 hover:bg-amber-50 text-slate-700 border-slate-200 hover:border-amber-300'
                }`}
                title="Tukar kedudukan seksyen borang laporan"
              >
                <Settings className="w-3.5 h-3.5 text-amber-600" />
                <span>{isReorderMode ? 'Tutup Mod Susunan' : 'Susun Seksyen Borang'}</span>
              </button>

              {isReorderMode && (
                <button
                  type="button"
                  onClick={handleResetSectionOrder}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold transition-all border border-slate-200 cursor-pointer"
                  title="Kembalikan susunan asal"
                >
                  Reset Susunan
                </button>
              )}
            </div>
          </div>

          {isReorderMode && (
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-amber-900 text-xs font-medium flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Mod Susunan Seksyen Borang:</strong> Gunakan butang anak panah <ArrowUp className="w-3 h-3 inline text-amber-800" /> <ArrowDown className="w-3 h-3 inline text-amber-800" /> pada setiap header seksyen untuk menukar kedudukan.
              </span>
            </div>
          )}

          {/* DYNAMICALLY ORDERED FORM SECTIONS */}
          <div className="space-y-4">
            {sectionOrder.map((key, index) => renderSectionBlock(
              key, 
              index + 1, 
              index === 0, 
              index === sectionOrder.length - 1, 
              index
            ))}
          </div>

        </div>

        {/* RIGHT COLUMN: LIVE PREVIEW & FORMATTED OUTPUT */}
        <div className="lg:col-span-5 space-y-4 sticky top-6">
          <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 text-slate-100 shadow-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                  Pratonton Laporan Format Rasmi
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyReport}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Disalin' : 'Salin Teks'}</span>
                </button>

                <button
                  onClick={() => setIsPrintModalOpen(true)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 transition-all cursor-pointer"
                  title="Buka Mod Cetakan / PDF"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* PREVIEW CONTAINER PRINTABLE */}
            <div className="bg-slate-950/80 rounded-2xl p-4 sm:p-5 border border-slate-800/80 font-mono text-xs leading-relaxed whitespace-pre-wrap select-all text-emerald-300/90 max-h-[70vh] overflow-y-auto">
              {generateFormattedReportText()}
            </div>

            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 font-medium border-t border-slate-800">
              <span>Format disesuaikan untuk WhatsApp & Telegram</span>
              <span className="text-emerald-400 font-bold">Daerah Hulu Langat</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
