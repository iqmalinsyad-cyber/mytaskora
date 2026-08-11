import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { LaporanAduanItem } from '../types';

const LAPORAN_STORAGE_KEY = 'WORKSPACE_LAPORAN_SIASATAN_V1';

type LaporanListener = (reports: LaporanAduanItem[]) => void;

const DEFAULT_LAPORAN_LIST: LaporanAduanItem[] = [
  {
    id: 'lap-1',
    tarikhTerima: new Date().toISOString().split('T')[0],
    tarikhSiasatan: new Date().toISOString().split('T')[0],
    sumber: 'Aduan Awam / Telefon',
    nama: 'AHMAD BIN MAT DAHAN',
    noKp: '800512-10-5432',
    noTel: '012-3456789',
    alamat: 'NO 12, JALAN MERBAU, TAMAN HULU LANGAT, 43100 HULU LANGAT',
    kariah: 'MASJID KHADIJAH HULU LANGAT',
    ringkasanPoints: [
      'Pemohon memohon bantuan sara hidup dan bantuan sewa rumah.',
      'Ketua keluarga tidak bekerja akibat kemalangan baru-baru ini.'
    ],
    hasilPoints: [
      'Hasil siasatan mendapati pemohon benar-benar memerlukan bantuan kewangan asas.',
      'Menanggung 3 orang anak yang masih bersekolah.'
    ],
    rekodBantuanPoints: [
      'Bantuan Kewangan Bulanan RM300 (Sehingga Disember 2025)',
      'Bantuan Makanan Kecemasan (Januari 2026)'
    ],
    cadanganBantuan: 'Dicadangkan diluluskan Bantuan Kewangan Bulanan RM400 dan Bantuan Persekolahan Anak.',
    tindakanLzsPoints: [
      'Permohonan telah disemak dan direkodkan dalam sistem.',
      'Memajukan dokumen ke Jawatankuasa Bantuan LZS Hulu Langat.'
    ],
    namaPegawai: 'MUHAMMAD HAFIZ BIN ABDULLAH',
    eoad: 'EOAD Hulu Langat',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

class LaporanAduanService {
  private reports: LaporanAduanItem[] = [];
  private listeners: Set<LaporanListener> = new Set();
  private isFirebaseSubscribed = false;

  constructor() {
    this.initLocal();
    this.setupFirebaseSubscription();
  }

  private initLocal() {
    try {
      const saved = localStorage.getItem(LAPORAN_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.reports = parsed;
          return;
        }
      }
    } catch (e) {
      console.error('Error reading local laporan storage:', e);
    }
    this.reports = DEFAULT_LAPORAN_LIST;
    this.saveLocal();
  }

  private saveLocal() {
    try {
      localStorage.setItem(LAPORAN_STORAGE_KEY, JSON.stringify(this.reports));
    } catch (e) {
      console.error('Error saving local laporan:', e);
    }
  }

  public subscribe(listener: LaporanListener): () => void {
    this.listeners.add(listener);
    listener(this.getReportsList());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.saveLocal();
    const current = this.getReportsList();
    this.listeners.forEach((fn) => fn(current));
  }

  public getReportsList(): LaporanAduanItem[] {
    return [...this.reports].sort((a, b) => {
      const timeA = new Date(b.updatedAt || b.createdAt || 0).getTime();
      const timeB = new Date(a.updatedAt || a.createdAt || 0).getTime();
      return timeA - timeB;
    });
  }

  private setupFirebaseSubscription() {
    if (!db || this.isFirebaseSubscribed) return;

    try {
      const colRef = collection(db, 'laporan_siasatan');
      this.isFirebaseSubscribed = true;

      onSnapshot(
        colRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteList: LaporanAduanItem[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              remoteList.push({
                id: docSnap.id,
                aduanId: data.aduanId || '',
                tarikhTerima: data.tarikhTerima || '',
                tarikhSiasatan: data.tarikhSiasatan || '',
                sumber: data.sumber || '',
                nama: data.nama || '',
                noKp: data.noKp || '',
                noTel: data.noTel || '',
                alamat: data.alamat || '',
                kariah: data.kariah || '',
                ringkasanPoints: Array.isArray(data.ringkasanPoints) ? data.ringkasanPoints : [],
                hasilPoints: Array.isArray(data.hasilPoints) ? data.hasilPoints : [],
                rekodBantuanPoints: Array.isArray(data.rekodBantuanPoints) ? data.rekodBantuanPoints : [],
                cadanganBantuan: data.cadanganBantuan || '',
                tindakanLzsPoints: Array.isArray(data.tindakanLzsPoints) ? data.tindakanLzsPoints : [],
                namaPegawai: data.namaPegawai || '',
                eoad: data.eoad || '',
                createdBy: data.createdBy || '',
                createdAt: data.createdAt || new Date().toISOString(),
                updatedAt: data.updatedAt || new Date().toISOString(),
              });
            });

            this.reports = remoteList;
            this.notify();
          } else {
            // Seed Firestore with default initial reports if empty
            DEFAULT_LAPORAN_LIST.forEach((item) => {
              const docRef = doc(db!, 'laporan_siasatan', item.id);
              setDoc(docRef, item, { merge: true }).catch(console.error);
            });
          }
        },
        (error) => {
          console.warn('Firebase Laporan subscription warning:', error.message);
        }
      );
    } catch (e) {
      console.error('Firebase setup failed for laporan_siasatan:', e);
    }
  }

  public async saveLaporan(item: LaporanAduanItem): Promise<void> {
    const existingIdx = this.reports.findIndex((r) => r.id === item.id);
    const updatedItem = {
      ...item,
      updatedAt: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      this.reports[existingIdx] = updatedItem;
    } else {
      this.reports.unshift(updatedItem);
    }

    this.notify();

    if (db) {
      try {
        const docRef = doc(db, 'laporan_siasatan', item.id);
        await setDoc(docRef, updatedItem, { merge: true });
      } catch (err) {
        console.error('Failed to sync Laporan to Firebase:', err);
      }
    }
  }

  public async deleteLaporan(id: string): Promise<void> {
    this.reports = this.reports.filter((r) => r.id !== id);
    this.notify();

    if (db) {
      try {
        const docRef = doc(db, 'laporan_siasatan', id);
        await deleteDoc(docRef);
      } catch (err) {
        console.error('Failed to delete Laporan from Firebase:', err);
      }
    }
  }
}

export const laporanAduanService = new LaporanAduanService();
