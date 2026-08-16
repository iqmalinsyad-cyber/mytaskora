export type AduanStatus = 
  | 'Belum Disahkan' 
  | 'Dalam Siasatan' 
  | 'Perlu Maklumat' 
  | 'Selesai' 
  | 'Ditolak';

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
  noRujukan: string;
  workspaceId: string;
  tajuk: string;
  penerangan: string;
  kategori: AduanCategory;
  prioriti: AduanPriority;
  status: AduanStatus;
  namaPengadu: string;
  emailPengadu: string;
  telefonPengadu?: string;
  lokasi?: string;
  assignee: string;
  assigneeRole?: string;
  assigneeAvatar?: string;
  tarikhAduan: string;
  sasaranSLA: string; // ISO date string or YYYY-MM-DD
  tarikhSelesai?: string;
  csatRating?: number; // 1-5
  catatan: AduanNote[];
  tags: string[];
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
  { id: 'templates', label: 'Format / Template Catatan', category: 'Utama' },
  { id: 'linkhub', label: 'Linkhub Pautan Rujukan', category: 'Rujukan' },
  { id: 'admin', label: 'Pentadbiran & Audit User (Admin)', category: 'Sistem' },
  { id: 'settings', label: 'Tetapan Akaun', category: 'Sistem' },
];

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
