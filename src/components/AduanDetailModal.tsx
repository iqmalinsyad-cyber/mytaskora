import React, { useState } from 'react';
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
  Sparkles, 
  Mail, 
  Phone, 
  Tag, 
  Building2,
  Copy,
  Check,
  Trash2
} from 'lucide-react';
import { AduanCase, AduanStatus, AduanNote } from '../types';

interface AduanDetailModalProps {
  aduan: AduanCase | null;
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: AduanStatus) => void;
  onAddNote: (aduanId: string, noteData: any) => Promise<void>;
  onGenerateAiDraftResponse: (aduan: AduanCase) => Promise<string>;
  onDeleteCase?: (id: string) => void;
}

export const AduanDetailModal: React.FC<AduanDetailModalProps> = ({
  aduan,
  onClose,
  onUpdateStatus,
  onAddNote,
  onGenerateAiDraftResponse,
  onDeleteCase,
}) => {
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // AI Response Generator state
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiDraft, setAiDraft] = useState<string | null>(null);
  const [copiedDraft, setCopiedDraft] = useState(false);

  if (!aduan) return null;

  const handleAddNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || !newNoteContent.trim()) return;

    setIsSubmittingNote(true);
    try {
      await onAddNote(aduan.id, {
        authorName: 'Sarah Adams',
        authorRole: 'Pentadbir Utama',
        authorAvatar: 'https://api.dicebear.com/7.x/personas/svg?seed=Aisha&clothingColor=3b82f6&hair=hijab',
        formatType: 'Catatan Bebas',
        title: newNoteTitle,
        content: newNoteContent,
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

  const handleGenerateAiReply = async () => {
    setIsGeneratingAi(true);
    setAiDraft(null);
    try {
      const draftText = await onGenerateAiDraftResponse(aduan);
      setAiDraft(draftText);
    } catch (e) {
      console.error('AI draft error:', e);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleCopyDraft = () => {
    if (!aiDraft) return;
    navigator.clipboard.writeText(aiDraft);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col my-auto max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-indigo-300 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                {aduan.noRujukan}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                aduan.prioriti === 'Kritikal' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-200'
              }`}>
                {aduan.prioriti}
              </span>
            </div>
            <h3 className="text-base font-extrabold tracking-tight leading-snug line-clamp-1">{aduan.tajuk}</h3>
          </div>

          <div className="flex items-center gap-1">
            {onDeleteCase && (
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                title="Padam Kes Aduan Ini"
                className="p-2 rounded-lg text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Top Status & SLA Control Strip */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status Semasa Aduan</div>
              <div className="mt-1 flex items-center gap-2">
                <select
                  value={aduan.status}
                  onChange={(e) => onUpdateStatus(aduan.id, e.target.value as AduanStatus)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 font-bold text-gray-900 shadow-2xs focus:ring-2 focus:ring-[#0d3b2e]"
                >
                  <option value="Belum Disahkan">Belum Disahkan</option>
                  <option value="Dalam Siasatan">Dalam Siasatan</option>
                  <option value="Perlu Maklumat">Perlu Maklumat</option>
                  <option value="Selesai">Selesai</option>
                  <option value="Ditolak">Ditolak</option>
                </select>
              </div>
            </div>

            <div className="sm:text-right">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sasaran SLA Selesai</div>
              <div className="font-bold text-gray-900 mt-1 flex items-center gap-1 sm:justify-end">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>{new Date(aduan.sasaranSLA).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          </div>

          {/* Details & Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Left 2 cols: Main Description & Notes */}
            <div className="md:col-span-2 space-y-5">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Kandungan Aduan Terperinci
                </h4>
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-gray-800 leading-relaxed font-normal">
                  {aduan.penerangan}
                </div>
              </div>

              {/* Action Notes Timeline */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#0d3b2e]" />
                    <span>Catatan & Minit Siasatan ({aduan.catatan?.length || 0})</span>
                  </h4>
                </div>

                <div className="space-y-2.5">
                  {(!aduan.catatan || aduan.catatan.length === 0) ? (
                    <div className="p-4 rounded-xl border border-dashed border-gray-200 text-center text-gray-400">
                      Belum ada catatan siasatan. Tambah di bawah.
                    </div>
                  ) : (
                    aduan.catatan.map((note) => (
                      <div key={note.id} className="p-3.5 rounded-2xl bg-emerald-50/30 border border-emerald-100/80 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900">{note.title}</span>
                          <span className="text-[10px] text-gray-400 font-medium">
                            {new Date(note.createdAt).toLocaleString('ms-MY')}
                          </span>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed font-sans">{note.content}</p>
                        <div className="text-[10px] font-semibold text-gray-500 pt-1 border-t border-emerald-100 flex items-center gap-1">
                          <span>Oleh: {note.authorName} ({note.authorRole})</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* New Note Form */}
                <form onSubmit={handleAddNoteSubmit} className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3 pt-3">
                  <span className="font-bold text-gray-900 block">Tambah Catatan Baharu</span>
                  <input
                    type="text"
                    placeholder="Tajuk Catatan..."
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs focus:ring-2 focus:ring-[#0d3b2e]"
                    required
                  />
                  <textarea
                    rows={3}
                    placeholder="Kandungan siasatan / dapatan tapak..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white border border-gray-200 text-xs focus:ring-2 focus:ring-[#0d3b2e]"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingNote}
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5 text-white" />
                    <span>Simpan Catatan</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Right 1 col: Complainant Metadata & AI Draft Response Generator */}
            <div className="space-y-4">
              {/* Complainant Card */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5">
                <span className="font-bold text-slate-800 text-xs block border-b border-slate-200 pb-1.5">
                  Maklumat Pengadu
                </span>
                <div>
                  <div className="font-bold text-slate-900">{aduan.namaPengadu}</div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span>{aduan.emailPengadu}</span>
                  </div>
                  {aduan.telefonPengadu && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{aduan.telefonPengadu}</span>
                    </div>
                  )}
                  {aduan.lokasi && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{aduan.lokasi}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Draft Formal Reply Generator */}
              <div className="bg-indigo-600 text-white rounded-xl p-4 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-indigo-100 font-bold text-xs">
                  <Sparkles className="w-4 h-4 fill-current text-indigo-200" />
                  <span>Jana Draf Balasan Rasmi AI</span>
                </div>
                <p className="text-[11px] text-indigo-100/90 leading-tight">
                  Jana surat maklum balas rasmi kepada pengadu berasaskan status terkini & dapatan siasatan.
                </p>
                <button
                  type="button"
                  onClick={handleGenerateAiReply}
                  disabled={isGeneratingAi}
                  className="w-full py-2 px-3 rounded-lg bg-white text-indigo-700 text-xs font-bold hover:bg-indigo-50 transition-all flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isGeneratingAi ? 'Penjana AI Sedang Draf...' : 'Jana Surat Maklum Balas'}</span>
                </button>

                {aiDraft && (
                  <div className="space-y-2 pt-2 border-t border-indigo-500">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-indigo-200">Draf Surat Rasmi:</span>
                      <button
                        type="button"
                        onClick={handleCopyDraft}
                        className="text-[10px] font-bold text-white hover:underline flex items-center gap-1"
                      >
                        {copiedDraft ? <Check className="w-3 h-3 text-indigo-200" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedDraft ? 'Disalin!' : 'Salin Draf'}</span>
                      </button>
                    </div>
                    <pre className="bg-indigo-900/60 p-3 rounded-lg text-[10px] text-indigo-100 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed border border-indigo-500">
                      {aiDraft}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONFIRM DELETE OVERLAY MODAL */}
      {isConfirmingDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
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
              Adakah anda pasti mahu memadamkan rekod kes aduan <strong className="text-slate-900 font-bold">[{aduan.noRujukan}] - {aduan.tajuk}</strong> secara kekal dari pangkalan data?
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
    </div>
  );
};
