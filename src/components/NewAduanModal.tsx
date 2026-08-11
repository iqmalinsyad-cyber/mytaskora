import React, { useState } from 'react';
import { X, PlusCircle, Sparkles, Building2, User, Phone, Mail, MapPin } from 'lucide-react';
import { AduanCategory, AduanPriority, Workspace } from '../types';
import { TEAM_MEMBERS } from '../data/mockData';

interface NewAduanModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaces: Workspace[];
  currentWorkspaceId: string;
  onAddCase: (newCaseData: any) => Promise<any>;
}

export const NewAduanModal: React.FC<NewAduanModalProps> = ({
  isOpen,
  onClose,
  workspaces,
  currentWorkspaceId,
  onAddCase,
}) => {
  const [workspaceId, setWorkspaceId] = useState(currentWorkspaceId);
  const [tajuk, setTajuk] = useState('');
  const [penerangan, setPenerangan] = useState('');
  const [kategori, setKategori] = useState<AduanCategory>('Infrastruktur & Bangunan');
  const [prioriti, setPrioriti] = useState<AduanPriority>('Sederhana');
  const [namaPengadu, setNamaPengadu] = useState('');
  const [emailPengadu, setEmailPengadu] = useState('');
  const [telefonPengadu, setTelefonPengadu] = useState('');
  const [lokasi, setLokasi] = useState('');
  const [assignee, setAssignee] = useState(TEAM_MEMBERS[0].name);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tajuk.trim() || !namaPengadu.trim()) return;

    setIsSubmitting(true);
    try {
      const selectedMember = TEAM_MEMBERS.find(m => m.name === assignee) || TEAM_MEMBERS[0];
      const now = new Date();
      // Calculate SLA target based on priority
      const slaDays = prioriti === 'Kritikal' ? 1 : prioriti === 'Tinggi' ? 2 : 5;
      const slaTarget = new Date(now.getTime() + slaDays * 86400000).toISOString();

      await onAddCase({
        workspaceId,
        tajuk,
        penerangan,
        kategori,
        prioriti,
        status: 'Belum Disahkan',
        namaPengadu,
        emailPengadu: emailPengadu || 'pengadu@awam.gov.my',
        telefonPengadu,
        lokasi,
        assignee: selectedMember.name,
        assigneeRole: selectedMember.role,
        assigneeAvatar: selectedMember.avatar,
        tarikhAduan: now.toISOString(),
        sasaranSLA: slaTarget,
        tags: [kategori.split(' ')[0], prioriti],
      });

      onClose();
    } catch (e) {
      console.error('Error adding new complaint:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col my-auto max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">Daftar Aduan Baharu</h3>
              <p className="text-xs text-slate-300 font-medium">Masukkan maklumat kes aduan awam / organisasi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Pilih Workspace *</label>
              <select
                value={workspaceId}
                onChange={(e) => setWorkspaceId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {workspaces.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Kategori Aduan *</label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value as AduanCategory)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="Infrastruktur & Bangunan">Infrastruktur & Bangunan</option>
                <option value="Perkhidmatan & Layanan">Perkhidmatan & Layanan</option>
                <option value="IT & Sistem">IT & Sistem</option>
                <option value="Kewangan & Pembayaran">Kewangan & Pembayaran</option>
                <option value="Tatatertib & Integriti">Tatatertib & Integriti</option>
                <option value="Lain-lain">Lain-lain</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Tajuk / Subjek Aduan *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Kerosakan Tiang Lampu Jalan Utama..."
              value={tajuk}
              onChange={(e) => setTajuk(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Kandungan / Penerangan Aduan *</label>
            <textarea
              rows={4}
              required
              placeholder="Terangkan perincian kes aduan..."
              value={penerangan}
              onChange={(e) => setPenerangan(e.target.value)}
              className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Tahap Keutamaan / Prioriti *</label>
            <select
              value={prioriti}
              onChange={(e) => setPrioriti(e.target.value as AduanPriority)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="Kritikal">Kritikal (SLA 24 Jam)</option>
              <option value="Tinggi">Tinggi (SLA 48 Jam)</option>
              <option value="Sederhana">Sederhana (SLA 5 Hari)</option>
              <option value="Rendah">Rendah (SLA 7 Hari)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Nama Pengadu *</label>
              <input
                type="text"
                required
                placeholder="Nama Pengadu"
                value={namaPengadu}
                onChange={(e) => setNamaPengadu(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Emel Pengadu</label>
              <input
                type="email"
                placeholder="pengadu@gmail.com"
                value={emailPengadu}
                onChange={(e) => setEmailPengadu(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">No. Telefon / Lokasi</label>
              <input
                type="text"
                placeholder="012-3456789 / Lokasi"
                value={lokasi}
                onChange={(e) => setLokasi(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 flex items-center gap-1.5 shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>{isSubmitting ? 'Mendaftar...' : 'Daftar Aduan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
