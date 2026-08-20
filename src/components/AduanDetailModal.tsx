import React, { useState, useMemo } from 'react';
import {
  X,
  MapPin,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Send,
  Mail,
  Phone,
  Tag,
  Building2,
  Trash2,
  Camera,
  Upload,
  Image as ImageIcon,
  Edit3,
  ExternalLink,
  ShieldAlert,
  HardDrive,
} from 'lucide-react';
import {
  AduanCase,
  AduanStatus,
  AduanNote,
  SumberAduan,
  TindakanAduan,
  SyorBantuan,
  GambarSiasatan,
} from '../types';

interface AduanDetailModalProps {
  aduan: AduanCase | null;
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: AduanStatus) => void;
  onEditCase?: (aduan: AduanCase) => void;
  onAddNote: (aduanId: string, noteData: any) => Promise<void>;
  onDeleteCase?: (id: string) => void;
}

export const AduanDetailModal: React.FC<AduanDetailModalProps> = ({
  aduan,
  onClose,
  onUpdateStatus,
  onEditCase,
  onAddNote,
  onDeleteCase,
}) => {
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Deduplicate notes by unique note.id or note.createdAt
  const displayedNotes = useMemo(() => {
    if (!aduan || !aduan.catatan) return [];
    const seen = new Set<string>();
    const uniqueList: AduanNote[] = [];
    for (const note of aduan.catatan) {
      const key = note.id || `${note.title}-${note.createdAt}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueList.push(note);
      }
    }
    return uniqueList;
  }, [aduan?.catatan]);

  if (!aduan) return null;

  const handleAddNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingNote) return;
    if (!newNoteTitle.trim() || !newNoteContent.trim()) return;

    setIsSubmittingNote(true);
    try {
      await onAddNote(aduan.id, {
        authorName: 'Sarah Adams',
        authorRole: 'Pentadbir Utama',
        authorAvatar: 'https://api.dicebear.com/7.x/personas/svg?seed=Aisha&clothingColor=3b82f6&hair=hijab',
        formatType: 'Catatan Bebas',
        title: newNoteTitle.trim(),
        content: newNoteContent.trim(),
        isInternal: true,
      });

      setNewNoteTitle('');
      setNewNoteContent('');
    } catch (err) {
      console.error('Error adding note:', err);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // SLA Calculation
  const isClosed = aduan.status === 'Selesai' || aduan.status === 'Ditolak';
  const createdDate = new Date(aduan.tarikhAduan || aduan.updatedAt || Date.now());
  const activeDays = Math.max(0, Math.floor((Date.now() - createdDate.getTime()) / (1000 * 3600 * 24)));

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in overflow-y-auto">
        <div className="bg-white rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col my-auto max-h-[92vh]">
          {/* Header */}
          <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-indigo-300 bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-700">
                  {aduan.noRujukan}
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 text-[11px] font-extrabold border border-indigo-400/30">
                  Sumber: {aduan.sumberAduan}
                </span>
              </div>
              <h3 className="text-base font-extrabold tracking-tight leading-snug line-clamp-1">
                {aduan.namaPengadu}
              </h3>
            </div>

            <div className="flex items-center gap-1.5">
              {onEditCase && (
                <button
                  type="button"
                  onClick={() => onEditCase(aduan)}
                  title="Kemaskini Kes Aduan"
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold transition-colors flex items-center gap-1.5 border border-amber-400/30"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Kemaskini</span>
                </button>
              )}

              {onDeleteCase && (
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(true)}
                  title="Padam Kes Aduan Ini"
                  className="p-2 rounded-xl text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs text-slate-700">
            {/* Top Status & SLA Control Strip */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Aduan</div>
                <div className="mt-1">
                  <select
                    value={aduan.status}
                    onChange={(e) => onUpdateStatus(aduan.id, e.target.value as AduanStatus)}
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 font-bold text-slate-900 shadow-2xs focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Belum Selesai">Belum Selesai</option>
                    <option value="Dalam Siasatan">Dalam Siasatan</option>
                    <option value="Perlu Maklumat (KIV)">Perlu Maklumat (KIV)</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Ditolak">Ditolak</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tindakan</div>
                <div className="font-extrabold text-slate-800 mt-2 text-xs">
                  {aduan.tindakan || 'Belum Di Proses'}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Syor Bantuan</div>
                <div className="mt-1.5">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                    aduan.syorBantuan === 'Ada' ? 'bg-violet-100 text-violet-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {aduan.syorBantuan || 'Tiada'}
                  </span>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SLA Aduan</div>
                <div className="mt-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="font-extrabold text-slate-900">
                    {isClosed ? `Ditutup (${activeDays} hari)` : `${activeDays === 0 ? 'Hari Pertama (0 hari)' : `${activeDays} hari aktif`}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Main Content Grid: Left (Maklumat & Gambar) + Right (Catatan & Minit) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left 7 cols: Complainant Details, Catatan Kes, and Investigation Photos */}
              <div className="lg:col-span-6 space-y-5">
                {/* 1. Maklumat Pengadu & Kes */}
                <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4 text-indigo-600" />
                    <span>Maklumat Kes & Pengadu</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block">1. Nama</span>
                      <span className="font-bold text-slate-900 text-sm">{aduan.namaPengadu}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block">2. No Rujukan</span>
                      <span className="font-mono font-bold text-indigo-700">{aduan.noRujukan}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block">3. No Telefon</span>
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{aduan.telefonPengadu || '-'}</span>
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block">5. Sumber Aduan</span>
                      <span className="font-extrabold text-indigo-800">{aduan.sumberAduan}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block mb-0.5">4. Alamat</span>
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span className="font-medium">{aduan.alamat || aduan.lokasi || 'Tiada maklumat alamat'}</span>
                    </div>
                  </div>
                </div>

                {/* 6. Catatan Kes */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>6. Catatan Kes</span>
                  </h4>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">
                    {aduan.catatanKes || aduan.penerangan || 'Tiada catatan kes diisi.'}
                  </div>
                </div>

                {/* 8. Gambar Siasatan (Maksimum 5 Gambar) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-indigo-600" />
                      <span>8. Gambar Siasatan ({aduan.gambarSiasatan?.length || 0}/5)</span>
                    </h4>
                  </div>

                  {aduan.gambarSiasatan && aduan.gambarSiasatan.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {aduan.gambarSiasatan.map((img, idx) => (
                        <div
                          key={img.id || idx}
                          onClick={() => setPreviewImage(img.url)}
                          className="group relative aspect-4/3 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer shadow-xs hover:shadow-md transition-all"
                        >
                          <img
                            src={img.url}
                            alt={img.name || `Gambar ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />

                          {/* Google Drive Link Badge */}
                          {img.driveUrl && (
                            <div className="absolute top-2 left-2 z-10">
                              <a
                                href={img.driveUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-[10px] font-black flex items-center gap-1 shadow-md transition-all"
                                title="Buka gambar di Google Drive"
                              >
                                <HardDrive className="w-3 h-3" />
                                <span>Google Drive</span>
                                <ExternalLink className="w-2.5 h-2.5 opacity-80" />
                              </a>
                            </div>
                          )}

                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <span className="text-xs font-bold flex items-center gap-1">
                              <ExternalLink className="w-3.5 h-3.5" />
                              Lihat Penuh
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center text-slate-400">
                      Tiada gambar siasatan dilampirkan.
                    </div>
                  )}
                </div>
              </div>

              {/* Right 5 cols: Timeline Format Minit / Catatan Sokongan */}
              <div className="lg:col-span-6 space-y-4">
                <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      <span>Format Catatan & Minit Siasatan ({displayedNotes.length})</span>
                    </h4>
                  </div>

                  {/* Add Note Form */}
                  <form onSubmit={handleAddNoteSubmit} className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2.5 shadow-xs">
                    <span className="font-bold text-slate-900 block text-xs">Tambah Catatan / Minit Siasatan</span>
                    <input
                      type="text"
                      placeholder="Tajuk Catatan..."
                      value={newNoteTitle}
                      onChange={(e) => setNewNoteTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                      required
                    />
                    <textarea
                      rows={3}
                      placeholder="Kandungan siasatan / minit mesyuarat..."
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isSubmittingNote}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5 text-white" />
                      <span>{isSubmittingNote ? 'Menyimpan...' : 'Simpan & Sync Catatan'}</span>
                    </button>
                  </form>

                  {/* Notes List */}
                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {displayedNotes.length === 0 ? (
                      <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-slate-400">
                        Belum ada minit siasatan tambahan.
                      </div>
                    ) : (
                      displayedNotes.map((note) => (
                        <div key={note.id} className="p-3.5 rounded-2xl bg-white border border-indigo-100 shadow-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{note.title}</span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {new Date(note.createdAt).toLocaleString('ms-MY')}
                            </span>
                          </div>
                          <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                          <div className="text-[10px] font-semibold text-slate-500 pt-1 border-t border-indigo-50">
                            Oleh: {note.authorName} ({note.authorRole})
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONFIRM DELETE OVERLAY MODAL */}
      {isConfirmingDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-rose-100 space-y-4 text-left">
            <div className="flex items-center gap-3 text-rose-600 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Padam Rekod Kes Aduan</h3>
                <p className="text-[11px] text-slate-500">Tindakan ini tidak boleh diundurkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Adakah anda pasti mahu memadamkan rekod kes aduan <strong className="text-slate-900 font-bold">[{aduan.noRujukan}] - {aduan.namaPengadu}</strong> secara kekal dari pangkalan data?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onDeleteCase) {
                    onDeleteCase(aduan.id);
                  }
                  setIsConfirmingDelete(false);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Padam Kes Ini</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Preview */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[130] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={previewImage}
              alt="Gambar Bukti Siasatan"
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
