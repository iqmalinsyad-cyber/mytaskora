import React, { useState, useEffect } from 'react';
import {
  X,
  PlusCircle,
  Camera,
  Upload,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  User,
  Phone,
  MapPin,
  FileText,
  Building,
  Tag,
  Clock,
  Sparkles,
  HardDrive,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import {
  AduanStatus,
  SumberAduan,
  TindakanAduan,
  SyorBantuan,
  GambarSiasatan,
  Workspace,
  AduanCategory,
  AduanPriority,
} from '../types';
import { CameraCaptureModal } from './CameraCaptureModal';
import { googleDriveService } from '../services/googleDriveService';

interface NewAduanModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaces?: Workspace[];
  currentWorkspaceId?: string;
  onAddCase: (newCaseData: any) => Promise<any>;
}

export const NewAduanModal: React.FC<NewAduanModalProps> = ({
  isOpen,
  onClose,
  workspaces = [],
  currentWorkspaceId = 'ws-integriti',
  onAddCase,
}) => {
  // Form fields according to requirements
  const [namaPengadu, setNamaPengadu] = useState('');
  const [noRujukan, setNoRujukan] = useState(() => `ADV-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [telefonPengadu, setTelefonPengadu] = useState('');
  const [alamat, setAlamat] = useState('');
  const [sumberAduan, setSumberAduan] = useState<SumberAduan>('Aduan Awam');
  const [catatanKes, setCatatanKes] = useState('');
  const [statusAduan, setStatusAduan] = useState<AduanStatus>('Belum Selesai');
  const [gambarSiasatan, setGambarSiasatan] = useState<GambarSiasatan[]>([]);
  const [tindakan, setTindakan] = useState<TindakanAduan>('Belum Di Proses');
  const [syorBantuan, setSyorBantuan] = useState<SyorBantuan>('Tiada');

  // Secondary/compatibility fields
  const [workspaceId, setWorkspaceId] = useState(currentWorkspaceId && currentWorkspaceId !== 'all' ? currentWorkspaceId : 'ws-integriti');
  const [kategori, setKategori] = useState<AduanCategory>('Infrastruktur & Bangunan');
  const [prioriti, setPrioriti] = useState<AduanPriority>('Sederhana');

  // Reset form when modal opens or active workspace changes
  useEffect(() => {
    if (isOpen) {
      const activeWs = currentWorkspaceId && currentWorkspaceId !== 'all' ? currentWorkspaceId : 'ws-integriti';
      setWorkspaceId(activeWs);
      setNoRujukan(`ADV-2026-${Math.floor(100 + Math.random() * 900)}`);
      setNamaPengadu('');
      setTelefonPengadu('');
      setAlamat('');
      setCatatanKes('');
      setStatusAduan('Belum Selesai');
      setGambarSiasatan([]);
      setTindakan('Belum Di Proses');
      setSyorBantuan('Tiada');
      setSumberAduan('Aduan Awam');
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen, currentWorkspaceId]);

  // UI state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!namaPengadu.trim()) errs.namaPengadu = 'Nama adalah mandatori.';
    if (!noRujukan.trim()) errs.noRujukan = 'No Rujukan adalah mandatori.';
    if (!telefonPengadu.trim()) errs.telefonPengadu = 'No Telefon adalah mandatori.';
    if (!alamat.trim()) errs.alamat = 'Alamat adalah mandatori.';
    if (!sumberAduan) errs.sumberAduan = 'Sumber aduan adalah mandatori.';
    if (!statusAduan) errs.statusAduan = 'Status aduan adalah mandatori.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const uploadToDriveIfConfigured = async (newImg: GambarSiasatan, refNo?: string, complName?: string) => {
    const config = googleDriveService.getConfig();
    if (!config.isEnabled || !config.webhookUrl || config.autoUpload === false) {
      return;
    }

    setGambarSiasatan((prev) =>
      prev.map((item) => (item.id === newImg.id ? { ...item, isUploadingToDrive: true } : item))
    );

    try {
      const cleanRef = (refNo || noRujukan || 'kes').replace(/[^a-zA-Z0-9_-]/g, '_');
      const cleanName = (complName || namaPengadu || 'pengadu').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${cleanRef}_${cleanName}_${Date.now()}.jpg`;

      const uploadResult = await googleDriveService.uploadImageToDrive({
        base64Data: newImg.url,
        filename,
        noRujukan: refNo || noRujukan,
        namaPengadu: complName || namaPengadu,
      });

      if (uploadResult.success && uploadResult.driveUrl) {
        setGambarSiasatan((prev) =>
          prev.map((item) =>
            item.id === newImg.id
              ? {
                  ...item,
                  driveUrl: uploadResult.driveUrl,
                  driveFileId: uploadResult.driveFileId,
                  driveDownloadUrl: uploadResult.driveDownloadUrl,
                  driveFolderName: uploadResult.driveFolderName,
                  isUploadingToDrive: false,
                }
              : item
          )
        );
      } else {
        setGambarSiasatan((prev) =>
          prev.map((item) => (item.id === newImg.id ? { ...item, isUploadingToDrive: false } : item))
        );
      }
    } catch (err) {
      console.warn('Google Drive Auto Upload error:', err);
      setGambarSiasatan((prev) =>
        prev.map((item) => (item.id === newImg.id ? { ...item, isUploadingToDrive: false } : item))
      );
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (gambarSiasatan.length >= 5) {
      alert('Maksimum 5 gambar siasatan sahaja dibenarkan.');
      return;
    }

    const remainingSlots = 5 - gambarSiasatan.length;
    const filesToProcess = (Array.from(files) as File[]).slice(0, remainingSlots);

    filesToProcess.forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const resultUrl = uploadEvent.target?.result as string;
        if (resultUrl) {
          // Compress image to friendly size
          const img = new Image();
          img.src = resultUrl;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxDim = 1200;
            let width = img.width;
            let height = img.height;

            if (width > height && width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            const compressedUrl = canvas.toDataURL('image/jpeg', 0.82);

            const newImg: GambarSiasatan = {
              id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              url: compressedUrl,
              name: file.name || `Gambar Siasatan ${gambarSiasatan.length + 1}`,
              capturedAt: new Date().toISOString(),
            };

            setGambarSiasatan((prev) => (prev.length < 5 ? [...prev, newImg] : prev));
            uploadToDriveIfConfigured(newImg);
          };
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    e.target.value = '';
  };

  const handleCameraCapture = (imageDataUrl: string) => {
    if (gambarSiasatan.length >= 5) {
      alert('Maksimum 5 gambar siasatan sahaja dibenarkan.');
      return;
    }
    const newImg: GambarSiasatan = {
      id: `img-cam-${Date.now()}`,
      url: imageDataUrl,
      name: `Kamera Siasatan ${gambarSiasatan.length + 1}`,
      capturedAt: new Date().toISOString(),
    };
    setGambarSiasatan((prev) => [...prev, newImg]);
    uploadToDriveIfConfigured(newImg);
  };

  const handleRemoveImage = (imgId: string) => {
    setGambarSiasatan((prev) => prev.filter((img) => img.id !== imgId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const now = new Date();
      const slaTarget = new Date(now.getTime() + 3 * 86400000).toISOString();

      await onAddCase({
        workspaceId,
        noRujukan: noRujukan.trim(),
        namaPengadu: namaPengadu.trim(),
        telefonPengadu: telefonPengadu.trim(),
        alamat: alamat.trim(),
        sumberAduan,
        catatanKes: catatanKes.trim(),
        status: statusAduan,
        gambarSiasatan,
        tindakan,
        syorBantuan,
        tajuk: `${sumberAduan}: Aduan daripada ${namaPengadu.trim()}`,
        penerangan: catatanKes.trim() || `Aduan diterima daripada saluran ${sumberAduan}`,
        kategori,
        prioriti,
        emailPengadu: 'pengadu@awam.gov.my',
        lokasi: alamat.trim(),
        assignee: 'Sarah Adams',
        assigneeRole: 'Pegawai Penyiasat Aduan',
        tarikhAduan: now.toISOString(),
        sasaranSLA: slaTarget,
        tarikhSelesai: statusAduan === 'Selesai' || statusAduan === 'Ditolak' ? now.toISOString() : undefined,
      });

      onClose();
    } catch (err) {
      console.error('Error creating complaint:', err);
      alert('Ralat semasa mendaftar kes aduan. Sila cuba sebentar lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in overflow-y-auto">
        <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col my-auto max-h-[92vh]">
          {/* Modal Header */}
          <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-lg shadow-indigo-600/30">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
                  <span>Daftar Aduan Baharu</span>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-400/30">
                    Sistem Kes Aduan
                  </span>
                </h3>
                <p className="text-xs text-slate-300 font-normal">
                  Lengkapkan maklumat mandatori bertanda (<span className="text-rose-400 font-bold">*</span>) & auto-sync ke Firebase
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-700 flex-1">
            {/* Error Notification */}
            {Object.keys(errors).length > 0 && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <p className="font-bold">Sila lengkapkan maklumat mandatori yang diperlukan:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-600">
                    {Object.values(errors).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Section 1: Maklumat Utama & Pengadu */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <User className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  1. Maklumat Utama & Rujukan (Mandatori)
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 1. Nama (Mandatori) */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    1. Nama <span className="text-rose-500 font-extrabold">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={namaPengadu}
                      onChange={(e) => {
                        setNamaPengadu(e.target.value);
                        if (errors.namaPengadu) setErrors((prev) => ({ ...prev, namaPengadu: '' }));
                      }}
                      placeholder="cth. Dato' Hj. Azman Kassim / Siti Fatimah"
                      className={`w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border ${
                        errors.namaPengadu ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                      } font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all`}
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                  {errors.namaPengadu && <p className="text-[11px] text-rose-500 mt-1 font-semibold">{errors.namaPengadu}</p>}
                </div>

                {/* 2. No Rujukan (Mandatori) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-800">
                      2. No Rujukan <span className="text-rose-500 font-extrabold">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setNoRujukan(`ADV-2026-${Math.floor(100 + Math.random() * 900)}`)}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold"
                    >
                      Jana Auto
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={noRujukan}
                      onChange={(e) => {
                        setNoRujukan(e.target.value);
                        if (errors.noRujukan) setErrors((prev) => ({ ...prev, noRujukan: '' }));
                      }}
                      placeholder="ADV-2026-XXX"
                      className={`w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border ${
                        errors.noRujukan ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                      } font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all`}
                    />
                    <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                  {errors.noRujukan && <p className="text-[11px] text-rose-500 mt-1 font-semibold">{errors.noRujukan}</p>}
                </div>

                {/* 3. No Telefon (Mandatori) */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    3. No Telefon <span className="text-rose-500 font-extrabold">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={telefonPengadu}
                      onChange={(e) => {
                        setTelefonPengadu(e.target.value);
                        if (errors.telefonPengadu) setErrors((prev) => ({ ...prev, telefonPengadu: '' }));
                      }}
                      placeholder="cth. 012-3849201 / 03-88881234"
                      className={`w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border ${
                        errors.telefonPengadu ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                      } font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all`}
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                  {errors.telefonPengadu && <p className="text-[11px] text-rose-500 mt-1 font-semibold">{errors.telefonPengadu}</p>}
                </div>

                {/* 5. Sumber Aduan (Mandatori) */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    5. Sumber Aduan <span className="text-rose-500 font-extrabold">*</span>
                  </label>
                  <select
                    value={sumberAduan}
                    onChange={(e) => setSumberAduan(e.target.value as SumberAduan)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="CMU">CMU</option>
                    <option value="Aduan Awam">Aduan Awam</option>
                    <option value="Parlimen">Parlimen</option>
                    <option value="Adun">Adun</option>
                    <option value="HQ">HQ</option>
                    <option value="MAIS">MAIS</option>
                    <option value="JAIS">JAIS</option>
                  </select>
                </div>
              </div>

              {/* 4. Alamat (Mandatori) */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  4. Alamat <span className="text-rose-500 font-extrabold">*</span>
                </label>
                <div className="relative">
                  <textarea
                    rows={2}
                    value={alamat}
                    onChange={(e) => {
                      setAlamat(e.target.value);
                      if (errors.alamat) setErrors((prev) => ({ ...prev, alamat: '' }));
                    }}
                    placeholder="Masukkan alamat lengkap lokasi kejadian atau kediaman..."
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border ${
                      errors.alamat ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                    } font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all resize-none`}
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
                {errors.alamat && <p className="text-[11px] text-rose-500 mt-1 font-semibold">{errors.alamat}</p>}
              </div>
            </div>

            {/* Section 2: Status, Tindakan & Syor Bantuan */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <FileText className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  2. Status, Tindakan & Syor Bantuan
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* 7. Status Aduan (Mandatori) */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    7. Status Aduan <span className="text-rose-500 font-extrabold">*</span>
                  </label>
                  <select
                    value={statusAduan}
                    onChange={(e) => setStatusAduan(e.target.value as AduanStatus)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="Belum Selesai">Belum Selesai</option>
                    <option value="Dalam Siasatan">Dalam Siasatan</option>
                    <option value="Perlu Maklumat (KIV)">Perlu Maklumat (KIV)</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Ditolak">Ditolak</option>
                  </select>
                </div>

                {/* 9. Tindakan (Pilihan) */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    9. Tindakan
                  </label>
                  <select
                    value={tindakan}
                    onChange={(e) => setTindakan(e.target.value as TindakanAduan)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="Belum Di Proses">Belum Di Proses</option>
                    <option value="KIV">KIV</option>
                    <option value="Telah Diproses">Telah Diproses</option>
                  </select>
                </div>

                {/* 10. Syor Bantuan (Pilihan: Ada, Tiada) */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    10. Syor Bantuan
                  </label>
                  <select
                    value={syorBantuan}
                    onChange={(e) => setSyorBantuan(e.target.value as SyorBantuan)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="Tiada">Tiada</option>
                    <option value="Ada">Ada</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Catatan Kes (Tidak mandatori) */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    6. Catatan Kes
                  </h4>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">(Tidak mandatori / Boleh diisi kemudian)</span>
              </div>

              <textarea
                rows={3}
                value={catatanKes}
                onChange={(e) => setCatatanKes(e.target.value)}
                placeholder="Tuliskan butiran ringkas atau fakta awal kes aduan ini jika ada..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>

            {/* Section 4: Gambar Siasatan (Maksimum 5 Gambar) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    8. Gambar Siasatan
                  </h4>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {gambarSiasatan.length} / 5 Gambar
                </span>
              </div>

              {/* Upload / Snap Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  disabled={gambarSiasatan.length >= 5}
                  className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Camera className="w-4 h-4" />
                  <span>Ambil Foto / Snap Gambar</span>
                </button>

                <label
                  className={`px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 flex items-center gap-2 transition-all cursor-pointer ${
                    gambarSiasatan.length >= 5 ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
                  }`}
                >
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span>Pilih Dari Peranti (Upload)</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={gambarSiasatan.length >= 5}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Image Previews Grid */}
              {gambarSiasatan.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
                  {gambarSiasatan.map((img, index) => (
                    <div
                      key={img.id || index}
                      className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-xs"
                    >
                      <img
                        src={img.url}
                        alt={img.name || `Bukti ${index + 1}`}
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => setPreviewImage(img.url)}
                      />

                      {/* Top Badges: Drive status */}
                      <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between gap-1 pointer-events-none">
                        {img.isUploadingToDrive ? (
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-500/90 backdrop-blur-xs text-white text-[9px] font-black flex items-center gap-1 shadow-xs">
                            <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                            <span>Upload...</span>
                          </span>
                        ) : img.driveUrl ? (
                          <a
                            href={img.driveUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="pointer-events-auto px-1.5 py-0.5 rounded-md bg-emerald-600/90 hover:bg-emerald-700 backdrop-blur-xs text-white text-[9px] font-black flex items-center gap-1 shadow-xs transition-colors"
                            title="Buka fail di Google Drive"
                          >
                            <HardDrive className="w-2.5 h-2.5" />
                            <span>Drive ✓</span>
                          </a>
                        ) : null}
                      </div>

                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2">
                        <span className="text-[10px] text-white font-bold truncate pr-1">
                          #{index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(img.id)}
                          className="p-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors"
                          title="Padam Gambar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-center text-slate-400">
                  <ImageIcon className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                  <p className="text-[11px]">Tiada gambar siasatan dimuat naik setakat ini (Pilihan maks 5 gambar)</p>
                </div>
              )}
            </div>
          </form>

          {/* Modal Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-extrabold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan ke Firebase...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Daftar Aduan & Sync Firebase</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />

      {/* Fullscreen Photo Lightbox Preview */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[130] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={previewImage}
              alt="Pratonton Gambar Penuh"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl border border-slate-800"
            />
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 p-2 rounded-full bg-slate-900 text-white hover:bg-rose-600 transition-colors shadow-lg border border-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
