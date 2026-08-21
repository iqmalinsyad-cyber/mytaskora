export type SumberAduan = 
  | 'CMU' 
  | 'Aduan Awam' 
  | 'Parlimen' 
  | 'Adun' 
  | 'HQ' 
  | 'MAIS' 
  | 'JAIS';

export type AduanStatus = 
  | 'Belum Selesai' 
  | 'Dalam Siasatan' 
  | 'Perlu Maklumat (KIV)' 
  | 'Selesai' 
  | 'Ditolak'
  | 'Belum Disahkan' // legacy compatibility
  | 'Perlu Maklumat'; // legacy compatibility

export type TindakanAduan = 'Telah Diproses' | 'KIV' | 'Belum Di Proses';

export type SyorBantuan = 'Ada' | 'Tiada';

export interface GambarSiasatan {
  id: string;
  url: string;
  name?: string;
  capturedAt?: string;
  driveUrl?: string; // Pautan fail di Google Drive
  driveFileId?: string; // ID Fail di Google Drive
  driveDownloadUrl?: string; // Pautan muat turun Google Drive
  driveFolderName?: string; // Nama folder simpanan Google Drive
  isUploadingToDrive?: boolean;
}

export interface GoogleDriveConfig {
  webhookUrl: string; // Apps Script Web App URL
  folderId?: string; // Google Drive Folder ID
  folderName?: string; // Default 'Sistem Aduan - Bukti Siasatan'
  autoUpload: boolean;
  isEnabled: boolean;
  lastTestedAt?: string;
  lastTestStatus?: 'success' | 'error';
  lastTestMessage?: string;
}

export type AduanPriority = 'Rendah' | 'Sederhana' | 'Tinggi' | 'Kritikal';

export type AduanCategory = 
  | 'Infrastruktur & Bangunan'
  | 'Perkhidmatan & Layanan'
  | 'IT & Sistem'
  | 'Kewangan & Pembayaran'
  | 'Tatatertib & Integriti'
  | 'Lain-lain';

export interface Workspace {
  id: string;
  name: string;
  code: string;
  icon?: string;
  description: string;
  membersCount: number;
  role: 'Admin' | 'Pegawai Aduan' | 'Penyiasat' | 'Pemerhati';
  isDefault?: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  size: string;
  type: string;
  url: string;
}

export interface AduanNote {
  id: string;
  aduanId: string;
  authorName: string;
  authorRole: string;
  authorAvatar?: string;
  formatType?: 'Siasatan Awal' | 'Minit Mesyuarat' | 'Maklum Balas' | 'Perakuan Penutupan' | 'Catatan Bebas';
  title: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  attachments?: Attachment[];
}

export interface AduanCase {
  id: string;
  noRujukan: string; // 2. No Rujukan
  namaPengadu: string; // 1. Nama
  telefonPengadu: string; // 3. No Telefon
  alamat: string; // 4. Alamat
  sumberAduan: SumberAduan; // 5. Sumber Aduan
  catatanKes?: string; // 6. Catatan Kes
  status: AduanStatus; // 7. Status Aduan
  gambarSiasatan?: GambarSiasatan[]; // 8. Gambar Siasatan (Maksimum 5 Gambar)
  tindakan: TindakanAduan; // 9. Tindakan
  syorBantuan: SyorBantuan; // 10. Syor Bantuan

  workspaceId?: string;
  tajuk?: string;
  penerangan?: string;
  kategori?: AduanCategory;
  prioriti?: AduanPriority;
  emailPengadu?: string;
  lokasi?: string;
  assignee?: string;
  assigneeRole?: string;
  assigneeAvatar?: string;
  tarikhAduan: string;
  sasaranSLA?: string; // ISO date string or YYYY-MM-DD
  tarikhSelesai?: string;
  csatRating?: number; // 1-5
  catatan?: AduanNote[];
  tags?: string[];
  updatedAt: string;
}

export interface FormatTemplate {
  id: string;
  code: string;
  title: string;
  category: string;
  description: string;
  iconName: string;
  templateContent: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  lastConnectedAt?: string;
}

export interface FilterOptions {
  status: string; // 'all' or AduanStatus
  priority: string; // 'all' or AduanPriority
  category: string; // 'all' or AduanCategory
  sumberAduan?: string; // 'all' or SumberAduan
  tindakan?: string; // 'all' or TindakanAduan
  syorBantuan?: string; // 'all' or SyorBantuan
  searchQuery: string;
  dateRange: '7d' | '30d' | '90d' | 'all';
  workspaceId: string;
  onlyOverdue?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  password?: string;
  role: string;
  avatar: string;
  workspaceId: string;
  phone?: string;
  department?: string;
  allowedViews?: string[];
  sessionToken?: string;
}

export interface LaporanAduanItem {
  id: string;
  aduanId?: string;
  tarikhTerima: string;
  tarikhSiasatan: string;
  sumber: string;
  nama: string;
  noKp: string;
  noTel: string;
  alamat: string;
  kariah: string;
  ringkasanPoints: string[];
  hasilPoints: string[];
  rekodBantuanPoints: string[];
  cadanganBantuan: string;
  tindakanLzsPoints: string[];
  namaPegawai: string;
  eoad: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const ALL_SYSTEM_VIEWS = [
  { id: 'dashboard', label: 'Dashboard & KPI Utama', category: 'Utama' },
  { id: 'calendar', label: 'Kalendar Program', category: 'Utama' },
  { id: 'aduan', label: 'Senarai Aduan', category: 'Utama' },
  { id: 'laporan_aduan', label: 'Laporan Aduan', category: 'Utama' },
  { id: 'kanban', label: 'Paparan Aduan (Kanban)', category: 'Utama' },
  { id: 'tasks', label: 'Pengurusan Task (Task Management)', category: 'Utama' },
  { id: 'templates', label: 'Format / Template Catatan', category: 'Utama' },
  { id: 'linkhub', label: 'Linkhub Pautan Rujukan', category: 'Rujukan' },
  { id: 'admin', label: 'Pentadbiran & Audit User (Admin)', category: 'Sistem' },
  { id: 'settings', label: 'Tetapan Akaun', category: 'Sistem' },
];

export type TaskStatus = 'Dalam Proses' | 'Batal' | 'Selesai';
export type TaskDurationChoice = 'Ada' | 'Tiada';
export type TaskDurationPeriod = 
  | '1 Hari' 
  | '2 Hari' 
  | '3 Hari' 
  | '4 Hari' 
  | '5 Hari' 
  | '1 Minggu' 
  | '2 Minggu' 
  | '3 Minggu' 
  | '1 Bulan' 
  | '2 Bulan';

export interface TaskItem {
  id: string;
  namaTask: string; // 1. Nama task
  adaTempoh: TaskDurationChoice; // 2. Ada Tempoh (Pilihan: Ada, Tiada)
  tempoh?: TaskDurationPeriod; // Pilihan tempoh jika Ada (1 Hari, 2 Hari, ...)
  status: TaskStatus; // 3. Status (Dalam Proses, Batal, Selesai)
  keterangan: string; // 4. Keterangan Berkenaan Task
  catatan?: string; // 5. Catatan
  tarikhDicipta: string;
  tarikhKemaskini: string;
  createdBy?: string;
  creatorAvatar?: string;
  workspaceId?: string;
}

export type ProgramCategory = 'SJK' | 'Kemaskini' | 'Lain-lain';
export type ProgramStatus = 'Diteruskan' | 'Batal';

export interface ProgramEvent {
  id: string;
  title: string;
  dateTime: string;
  endDateTime?: string;
  location: string;
  category: ProgramCategory;
  status: ProgramStatus;
  notes?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ActivityLog {
  id: string;
  aduanId?: string;
  aduanRujukan?: string;
  action: string;
  userName: string;
  timestamp: string;
  type: 'status_change' | 'note_added' | 'aduan_created' | 'assignee_changed' | 'supabase_sync';
}

export interface LinkItem {
  id: string;
  title: string;
  url: string;
  category: string;
  description?: string;
  icon?: string;
  faviconUrl?: string;
  isPinned?: boolean;
  createdBy: string;
  createdAt: string;
  clickCount?: number;
}
