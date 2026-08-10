import { Workspace, AduanCase, FormatTemplate, UserProfile, LinkItem } from '../types';

export const INITIAL_WORKSPACES: Workspace[] = [
  {
    id: 'ws-integriti',
    name: 'Jabatan Integriti & Aduan Utama',
    code: 'JIAU',
    description: 'Pusat kawalan aduan awam, salah guna kuasa & tatatertib.',
    membersCount: 14,
    role: 'Admin',
    isDefault: true,
  },
  {
    id: 'ws-fasiliti',
    name: 'Unit Perkhidmatan & Fasiliti',
    code: 'UPF',
    description: 'Pengurusan aduan berkaitan kerosakan fizikal, jalan & fasiliti awam.',
    membersCount: 8,
    role: 'Pegawai Aduan',
  },
  {
    id: 'ws-it',
    name: 'Bahagian Teknologi Maklumat',
    code: 'BTM',
    description: 'Sokongan sistem, rangkaian internet & perkhidmatan digital.',
    membersCount: 6,
    role: 'Penyiasat',
  },
  {
    id: 'ws-kewangan',
    name: 'Unit Kewangan & Bayaran',
    code: 'UKB',
    description: 'Aduan berkaitan bayaran balik, lesen & bil perkhidmatan.',
    membersCount: 5,
    role: 'Pemerhati',
  }
];

export const CURRENT_USER: UserProfile = {
  id: 'usr-001',
  name: 'Sarah Adams',
  username: 'sarah_adams',
  email: 'sarah.adams@workspace.gov.my',
  password: 'Password123!',
  role: 'Pentadbir Utama',
  avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=Aisha&clothingColor=3b82f6&hair=hijab',
  workspaceId: 'ws-integriti',
  phone: '+60 12-345 6789',
  department: 'Jabatan Integriti & Tatatertib',
};

export const TEAM_MEMBERS = [
  { name: 'Sarah Adams', role: 'Pentadbir Utama', avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=Aisha&clothingColor=3b82f6&hair=hijab' },
  { name: 'Ahmad Khairul', role: 'Pegawai Penyiasat Senior', avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=Ahmad&clothingColor=059669' },
  { name: 'Nurul Huda', role: 'Pegawai Layanan Pelanggan', avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=Fatimah&clothingColor=6366f1&hair=hijab' },
  { name: 'Dr. Razali Omar', role: 'Ketua Unit Integriti', avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=Omar&clothingColor=4f46e5' },
  { name: 'Siti Aminah', role: 'Pegawai Analisis Data', avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=Mariam&clothingColor=8b5cf6&hair=hijab' },
];

export const FORMAT_TEMPLATES: FormatTemplate[] = [
  {
    id: 'fmt-01',
    code: 'FORMAT_BANTUAN_SEWA_RUMAH',
    title: 'Format Catatan Permohonan Bantuan Sewa Rumah',
    category: 'Bantuan Sewa Rumah',
    description: 'Format standard untuk merekodkan pengesahan sewa rumah, pengisian borang, dan dokumen sokongan.',
    iconName: 'ClipboardCheck',
    templateContent: `=== CATATAN PERMOHONAN BANTUAN SEWA RUMAH ===
TARIKH PERMOHONAN: [Tarikh]
NAMA PEMOHON: [Nama Pemohon]
NO. KAD PENGENALAN: [No. KP]
ALAMAT RUMAH SEWA: [Alamat Lengkap]
KADAR SEWA BULANAN: RM [Jumlah]

1. DAPATAN & PEMERIKSAAN TAPAK/DOKUMEN:
- Perjanjian Sewa / Surat Pengesahan Tuan Rumah: [Ada / Tiada]
- Salinan Saluran Utiliti (Air/Elektrik): [Dilampirkan]
- Status Pekerjaan & Pendapatan Pemohon: [Status / Pendapatan]

2. SYOR PEGAWAI KES:
- Syor Permohonan: [Disokong / Tidak Disokong]
- Cadangan Tempoh Bantuan: [Contoh: 6 Bulan / 1 Tahun]

3. ULASAN KELULUSAN:
-------------------------------------------`
  },
  {
    id: 'fmt-02',
    code: 'FORMAT_BANTUAN_DEPOSIT_SEWA',
    title: 'Format Catatan Permohonan Bantuan Deposit Sewa',
    category: 'Bantuan Deposit Sewa',
    description: 'Format merekodkan kelulusan deposit kemasukan rumah sewa baharu.',
    iconName: 'Users',
    templateContent: `=== CATATAN BANTUAN DEPOSIT SEWA RUMAH ===
TARIKH: [Tarikh]
PEMOHON: [Nama Pemohon] | NO. KP: [No. KP]
NAMA TUAN RUMAH / SYARIKAT: [Nama Tuan Rumah]
JUMLAH DEPOSIT DIPERLUKAN: RM [Jumlah Deposit]

RINGKASAN PERMOHONAN:
1. Sebab Pertukaran / Kemasukan Rumah Baharu:
   - 

2. Semakan Kelayakan & Tunggakan:
   - [ ] Borang akuan tuan rumah disahkan
   - [ ] Bukti resit sewa rumah terdahulu

3. KETETAPAN KELULUSAN:
   [ ] Diluluskan bayaran deposit terus kepada Tuan Rumah
   [ ] Bayaran berperingkat melalui perbankan elektronik`
  },
  {
    id: 'fmt-03',
    code: 'FORMAT_BANTUAN_TUNGGAKAN_UTILITI',
    title: 'Format Catatan Bantuan Tunggakan Utiliti',
    category: 'Bantuan Tunggakan Utiliti',
    description: 'Draf penyelesaian dan semakan tunggakan bil elektrik atau air.',
    iconName: 'MailCheck',
    templateContent: `=== SURAT / CATATAN BANTUAN TUNGGAKAN UTILITI ===
RUJUKAN KES: [No. Rujukan]
TARIKH: [Tarikh Hari Ini]
JENIS UTILITI: [Elektrik / Air / Indah Water]

NO. AKAUN UTILITI: [No. Akaun]
JUMLAH TUNGGAKAN SEMASA: RM [Jumlah Tunggakan]

1. HASIL SEMAKAN BIL:
   - Notis Pemotongan Diterima: [Ya / Tidak]
   - Tarikh Akhir Bayaran: [Tarikh]

2. SYOR BAYARAN BANTUAN:
   - Jumlah Bantuan Disetujui: RM [Jumlah]
   - Saluran Bayaran: [Terus ke Penyedia Perkhidmatan]

Sekian, untuk tindakan kelulusan.`
  },
  {
    id: 'fmt-04',
    code: 'FORMAT_BANTUAN_TUNGGAKAN_SEWA',
    title: 'Format Bantuan Tunggakan Sewa / Ansuran Rumah',
    category: 'Bantuan Tunggakan Sewa/Ansuran Rumah',
    description: 'Borang kelulusan permohonan penyelesaian tunggakan sewa atau ansuran bulanan.',
    iconName: 'CheckCircle2',
    templateContent: `=== PERAKUAN BANTUAN TUNGGAKAN SEWA / ANSURAN RUMAH ===
NO. RUJUKAN: [No. Rujukan Kes]
NAMA PEMOHON: [Nama Pemohon]
JUMLAH TUNGGAKAN: RM [Jumlah Tunggakan]
JUMLAH BULAN TUNGGAKAN: [Jumlah Bulan]

PERAKUAN PEGAWAI KES:
Saya dengan ini mengesahkan bahawa semakan pendapatan isi rumah dan keadaan kewangan pemohon telah dilaksanakan.

- Notis Mahkamah / Tuntutan Tuan Rumah: [Ada / Tiada]
- Bantuan Disyorkan: RM [Jumlah Kelulusan]

STATUS KELULUSAN: [DILULUSKAN / DALAM PERTIMBANGAN]
DIPERAKUKAN OLEH: [Nama Pegawai]
TARIKH: [Tarikh]`
  },
  {
    id: 'fmt-05',
    code: 'FORMAT_BANTUAN_KEWANGAN',
    title: 'Format Catatan Permohonan Bantuan Kewangan',
    category: 'Bantuan Kewangan',
    description: 'Format standard bagi permohonan bantuan kewangan am dan saraan asas.',
    iconName: 'ClipboardCheck',
    templateContent: `=== CATATAN PERMOHONAN BANTUAN KEWANGAN ===
TARIKH PERMOHONAN: [Tarikh]
PEMOHON: [Nama Pemohon] | NO. KP: [No. KP]
KATEGORI PERMOHONAN: [Bantuan Kewangan Am / Saraan Hidup]

1. SEMAKAN PENDAPATAN & TANGGUNGAN:
- Pendapatan Isi Rumah: RM [Jumlah]
- Bilangan Tanggungan: [Jumlah Orang]
- Jumlah Bantuan Dipohon: RM [Jumlah]

2. SYOR & KETETAPAN:
-------------------------------------------`
  },
  {
    id: 'fmt-06',
    code: 'FORMAT_BANTUAN_NILAI_ISLAM',
    title: 'Format Bantuan Penerapan Nilai Islam',
    category: 'Bantuan Penerapan Nilai Islam',
    description: 'Format khusus permohonan sokongan pendidikan, kelas bimbitan & bimbingan kerohanian.',
    iconName: 'Users',
    templateContent: `=== PERMOHONAN BANTUAN PENERAPAN NILAI ISLAM ===
TARIKH: [Tarikh]
NAMA PEMOHON / FASILITATOR: [Nama]
PROGRAM / KELAS DIMAHSUDKAN: [Nama Program]

1. BUTIRAN PROGRAM & PENGLIBATAN:
- Lokasi Program: [Lokasi]
- Bilangan Peserta / Pelajar: [Jumlah]

2. PERALATAN & BAHAN BANTUAN DIPERLUKAN:
- [ ] Buku / Kit Pembelajaran
- [ ] Yuran / Elaun Pengajar`
  },
  {
    id: 'fmt-07',
    code: 'FORMAT_TAMBANG_PENGANGKUTAN_SEKOLAH',
    title: 'Format Bantuan Tambang Pengangkutan Sekolah',
    category: 'Tambang Pengangkutan Sekolah',
    description: 'Format permohonan bantuan tambang bas / pengangkutan anak-anak sekolah.',
    iconName: 'MailCheck',
    templateContent: `=== BANTUAN TAMBANG PENGANGKUTAN SEKOLAH ===
NAMA IBU BAPA / PENJAGA: [Nama Penjaga]
SENARAI ANAK / PELAJAR:
1. [Nama Anak 1] - [Sekolah] - RM [Kadar Tambang Bulanan]
2. [Nama Anak 2] - [Sekolah] - RM [Kadar Tambang Bulanan]

NAMA PENGUSAHA BAS / PENGANGKUTAN: [Nama Pengusaha / No. Tel]
JUMLAH BANTUAN BULANAN DIPERTINBANGKAN: RM [Jumlah]

DILULUSKAN UNTUK TEMPOH: [Contoh: Jan - Dis 2026]`
  }
];

export const INITIAL_ADUAN_CASES: AduanCase[] = [
  {
    id: 'adn-101',
    noRujukan: 'ADV-2026-089',
    workspaceId: 'ws-integriti',
    tajuk: 'Kerosakan Lif Utama Blok B & Risiko Keselamatan Penduduk',
    penerangan: 'Lif nombor 2 sering terhenti secara tiba-tiba di antara tingkat 4 dan 5. Kejadian telah berlaku 3 kali minggu ini dan mendedahkan warga emas kepada bahaya.',
    kategori: 'Infrastruktur & Bangunan',
    prioriti: 'Kritikal',
    status: 'Dalam Siasatan',
    namaPengadu: 'Dato\' Hj. Azman Kassim',
    emailPengadu: 'azman.kassim@gmail.com',
    telefonPengadu: '012-3849201',
    lokasi: 'Kompleks Kediaman Seri Perdana, Blok B',
    assignee: 'Ahmad Khairul',
    assigneeRole: 'Pegawai Penyiasat Senior',
    assigneeAvatar: 'https://api.dicebear.com/7.x/personas/svg?seed=Ahmad&clothingColor=059669',
    tarikhAduan: '2026-08-04T09:30:00Z',
    sasaranSLA: '2026-08-07T17:00:00Z',
    tags: ['Lif', 'Keselamatan', 'Kerosakan Physical'],
    updatedAt: '2026-08-05T14:20:00Z',
    catatan: [
      {
        id: 'note-01',
        aduanId: 'adn-101',
        authorName: 'Ahmad Khairul',
        authorRole: 'Pegawai Penyiasat',
        authorAvatar: 'https://api.dicebear.com/7.x/personas/svg?seed=Ahmad&clothingColor=059669',
        formatType: 'Siasatan Awal',
        title: 'Siasatan Tapak Bersama Kontraktor Lif',
        content: 'Pemeriksaan fizikal dijalankan bersama Jurutera Otis Elevators pada 4 Ogos 2026 jam 2.30 petang. Mendapati kerosakan pada sensor pintu dan kabel pengawal utama. Komponen gantian telah dipesan daripada pembekal.',
        isInternal: true,
        createdAt: '2026-08-04T15:00:00Z'
      }
    ]
  },
  {
    id: 'adn-102',
    noRujukan: 'ADV-2026-092',
    workspaceId: 'ws-integriti',
    tajuk: 'Gangguan Capaian Portal Dalaman & Sistem e-Lesen',
    penerangan: 'Sistem e-Lesen mengalami terputus sambungan semasa proses pembayaran bayaran tahunan, menyebabkan resit tidak dapat dijana.',
    kategori: 'IT & Sistem',
    prioriti: 'Tinggi',
    status: 'Perlu Maklumat',
    namaPengadu: 'Siti Zulaikha',
    emailPengadu: 'zulaikha.tech@yahoo.com',
    telefonPengadu: '019-8872310',
    lokasi: 'Portal Dalaman Online',
    assignee: 'Sarah Adams',
    assigneeRole: 'Pentadbir Utama',
    assigneeAvatar: 'https://api.dicebear.com/7.x/personas/svg?seed=Aisha&clothingColor=3b82f6&hair=hijab',
    tarikhAduan: '2026-08-05T11:15:00Z',
    sasaranSLA: '2026-08-08T17:00:00Z',
    tags: ['Portal', 'e-Lesen', 'Pembayaran'],
    updatedAt: '2026-08-05T16:45:00Z',
    catatan: [
      {
        id: 'note-02',
        aduanId: 'adn-102',
        authorName: 'Sarah Adams',
        authorRole: 'Pentadbir',
        authorAvatar: 'https://api.dicebear.com/7.x/personas/svg?seed=Aisha&clothingColor=3b82f6&hair=hijab',
        formatType: 'Catatan Bebas',
        title: 'Memohon No. Transaksi Bank daripada Pengadu',
        content: 'Telah menghubungi pengadu melalui emel untuk mendapatkan salinan penyata transaksi FPX bagi membuat semakan muat naik pangkalan data gateway.',
        isInternal: false,
        createdAt: '2026-08-05T16:45:00Z'
      }
    ]
  },
  {
    id: 'adn-103',
    noRujukan: 'ADV-2026-075',
    workspaceId: 'ws-integriti',
    tajuk: 'Aduan Kelewatan Proses Kelulusan Permit Perniagaan Sementara',
    penerangan: 'Permohonan permit bernombor PRM-9921 masih belum diproses melebihi tempoh standard SLA 14 hari kerja tanpa sebarang jawapan bertulis.',
    kategori: 'Perkhidmatan & Layanan',
    prioriti: 'Sederhana',
    status: 'Selesai',
    namaPengadu: 'Tan Sri Lee Wei Hong',
    emailPengadu: 'lee.weihong@enterprise.my',
    telefonPengadu: '017-2231900',
    lokasi: 'Kaunter Utama Wisma Bandar',
    assignee: 'Nurul Huda',
    assigneeRole: 'Pegawai Layanan Pelanggan',
    assigneeAvatar: 'https://api.dicebear.com/7.x/personas/svg?seed=Fatimah&clothingColor=6366f1&hair=hijab',
    tarikhAduan: '2026-07-28T10:00:00Z',
    sasaranSLA: '2026-08-03T17:00:00Z',
    tarikhSelesai: '2026-08-02T16:30:00Z',
    csatRating: 5,
    tags: ['Permit', 'SLA Kelewatan', 'Perkhidmatan'],
    updatedAt: '2026-08-02T16:30:00Z',
    catatan: [
      {
        id: 'note-03',
        aduanId: 'adn-103',
        authorName: 'Nurul Huda',
        authorRole: 'Pegawai Layanan',
        authorAvatar: 'https://api.dicebear.com/7.x/personas/svg?seed=Fatimah&clothingColor=6366f1&hair=hijab',
        formatType: 'Perakuan Penutupan',
        title: 'Permit Disahkan Kelulusan & Diserahkan',
        content: 'Permit PRM-9921 telah diluluskan selepas semakan dokumen sokongan lengkap. Surat kelulusan rasmi diserahkan kepada pengadu. Pengadu berpuas hati dengan penyelesaian pantas.',
        isInternal: false,
        createdAt: '2026-08-02T16:30:00Z'
      }
    ]
  },
  {
    id: 'adn-104',
    noRujukan: 'ADV-2026-095',
    workspaceId: 'ws-integriti',
    tajuk: 'Tumbuhan Pokok Tua Berisiko Tumbang Menimpa Tiang Elektrik',
    penerangan: 'Dahan pokok dahan besar di persimpangan Jalan Melati 3 melintas garisan tiang elektrik voltan tinggi. Berisiko litar pintas semasa hujan lebat.',
    kategori: 'Infrastruktur & Bangunan',
    prioriti: 'Kritikal',
    status: 'Belum Disahkan',
    namaPengadu: 'Puan Halimah Abdullah',
    emailPengadu: 'halimah.a@gmail.com',
    telefonPengadu: '013-9018274',
    lokasi: 'Persimpangan Jalan Melati 3, Taman Bunga',
    assignee: 'Ahmad Khairul',
    assigneeRole: 'Pegawai Penyiasat Senior',
    assigneeAvatar: 'https://api.dicebear.com/7.x/personas/svg?seed=Ahmad&clothingColor=059669',
    tarikhAduan: '2026-08-06T02:20:00Z',
    sasaranSLA: '2026-08-07T12:00:00Z',
    tags: ['Pokok Tumbang', 'TNB', 'Infrastruktur'],
    updatedAt: '2026-08-06T02:20:00Z',
    catatan: []
  },
  {
    id: 'adn-105',
    noRujukan: 'ADV-2026-080',
    workspaceId: 'ws-integriti',
    tajuk: 'Perselisihan Cukai Pintu & Pertindihan Akaun Pembayaran',
    penerangan: 'Pemilik akaun mendapati resit cukai pintu direkodkan atas nombor hartanah lama walaupun borang penukaran telah dihantar Mac lalu.',
    kategori: 'Kewangan & Pembayaran',
    prioriti: 'Rendah',
    status: 'Selesai',
    namaPengadu: 'Encik Kumar Subramaniam',
    emailPengadu: 'kumar.subra@yahoo.com',
    telefonPengadu: '016-7781203',
    lokasi: 'Jabatan Penilaian & Cukai',
    assignee: 'Siti Aminah',
    assigneeRole: 'Pegawai Analisis Data',
    assigneeAvatar: 'https://api.dicebear.com/7.x/personas/svg?seed=Mariam&clothingColor=8b5cf6&hair=hijab',
    tarikhAduan: '2026-07-30T08:00:00Z',
    sasaranSLA: '2026-08-05T17:00:00Z',
    tarikhSelesai: '2026-08-04T10:15:00Z',
    csatRating: 4,
    tags: ['Cukai Pintu', 'Penyelarasan Rekod'],
    updatedAt: '2026-08-04T10:15:00Z',
    catatan: [
      {
        id: 'note-05',
        aduanId: 'adn-105',
        authorName: 'Siti Aminah',
        authorRole: 'Pegawai Analisis',
        authorAvatar: 'https://api.dicebear.com/7.x/personas/svg?seed=Mariam&clothingColor=8b5cf6&hair=hijab',
        formatType: 'Minit Mesyuarat',
        title: 'Kemaskini Pangkalan Data Hak Milik Hartanah',
        content: 'Penyelarasan nombor akaun baharu ACC-88291 telah disempurnakan. Resit pembetulan dikirimkan melalui portal pelanggan.',
        isInternal: true,
        createdAt: '2026-08-04T10:15:00Z'
      }
    ]
  },
  {
    id: 'adn-106',
    noRujukan: 'ADV-2026-098',
    workspaceId: 'ws-integriti',
    tajuk: 'Tuntutan Yuran Pendaftaran Bertindih Pada Invois Julai',
    penerangan: 'Pengadu dicaj yuran pemprosesan sebanyak RM 150 dua kali dalam penyata bulanan.',
    kategori: 'Kewangan & Pembayaran',
    prioriti: 'Sederhana',
    status: 'Dalam Siasatan',
    namaPengadu: 'Khoo Lay Peng',
    emailPengadu: 'laypeng.khoo@gmail.com',
    telefonPengadu: '011-23991023',
    lokasi: 'Sistem Invois Online',
    assignee: 'Dr. Razali Omar',
    assigneeRole: 'Ketua Unit Integriti',
    assigneeAvatar: 'https://api.dicebear.com/7.x/personas/svg?seed=Omar&clothingColor=4f46e5',
    tarikhAduan: '2026-08-05T14:10:00Z',
    sasaranSLA: '2026-08-09T17:00:00Z',
    tags: ['Kewangan', 'Invois', 'Bayaran Balik'],
    updatedAt: '2026-08-05T14:10:00Z',
    catatan: []
  }
];

export const INITIAL_LINK_HUB_ITEMS: LinkItem[] = [
  {
    id: 'link-1',
    title: 'Portal SiPAB (Sistem Pengurusan Aduan Awam)',
    url: 'https://www.malaysia.gov.my',
    category: 'Sistem Kerajaan',
    description: 'Gerbang rasmi pengurusan aduan, cadangan dan maklum balas perkhidmatan awam.',
    icon: 'Globe',
    isPinned: true,
    createdBy: 'Sarah Adams',
    createdAt: '2026-08-01T08:00:00Z',
    clickCount: 42,
  },
  {
    id: 'link-2',
    title: 'Pekeliling Perkhidmatan & SOP Integriti (JPA)',
    url: 'https://www.jpa.gov.my',
    category: 'Panduan & SOP',
    description: 'Panduan tatatertib, tatacara pengurusan aduan serta etika penjawat awam.',
    icon: 'FileText',
    isPinned: true,
    createdBy: 'Dr. Razali Omar',
    createdAt: '2026-08-02T10:30:00Z',
    clickCount: 28,
  },
  {
    id: 'link-3',
    title: 'Borang Akuan Sumpah & Perakuan Kerahsiaan',
    url: 'https://www.prm.gov.my',
    category: 'Borang & Dokumen',
    description: 'Muat turun borang rasmi akuan kerahsiaan untuk pegawai penyiasat kes.',
    icon: 'FileSpreadsheet',
    isPinned: false,
    createdBy: 'Ahmad Khairul',
    createdAt: '2026-08-03T11:15:00Z',
    clickCount: 19,
  },
  {
    id: 'link-4',
    title: 'Portal Suruhanjaya Pencegahan Rasuah Malaysia (SPRM)',
    url: 'https://www.sprm.gov.my',
    category: 'Pautan Luar',
    description: 'Saluran rujukan pencegahan rasuah, salah guna kuasa dan pematuhan undang-undang.',
    icon: 'Shield',
    isPinned: false,
    createdBy: 'Sarah Adams',
    createdAt: '2026-08-04T09:20:00Z',
    clickCount: 35,
  },
  {
    id: 'link-5',
    title: 'Garis Panduan Pengurusan SLA Aduan 2026',
    url: 'https://www.mampu.gov.my',
    category: 'Rujukan Am',
    description: 'Standard kualiti penyelesaian aduan awam mengikut piagam pelanggan.',
    icon: 'Bookmark',
    isPinned: false,
    createdBy: 'Siti Aminah',
    createdAt: '2026-08-05T14:00:00Z',
    clickCount: 14,
  },
];

export const INITIAL_PROGRAM_EVENTS = [
  {
    id: 'prog-1',
    title: 'Sesi Taklimat & Siasatan Tapak SJK Integriti',
    dateTime: '2026-08-12T09:30',
    endDateTime: '2026-08-12T12:00',
    location: 'Bilik Mesyuarat Utama, Aras 4',
    category: 'SJK' as const,
    status: 'Diteruskan' as const,
    notes: 'Sesi perbincangan awal bersama pegawai penyiasat kes aduan sektor awam.',
    createdBy: 'Sarah Adams',
    createdAt: '2026-08-01T08:00:00Z',
  },
  {
    id: 'prog-2',
    title: 'Kemaskini Data & Sekuriti Sistem Workspace',
    dateTime: '2026-08-15T14:00',
    endDateTime: '2026-08-15T16:30',
    location: 'Secara Maya (Google Meet)',
    category: 'Kemaskini' as const,
    status: 'Diteruskan' as const,
    notes: 'Penyelenggaraan berkala pangkalan data Firebase dan penyemakan audit kualiti.',
    createdBy: 'Ahmad Khairul',
    createdAt: '2026-08-02T10:15:00Z',
  },
  {
    id: 'prog-3',
    title: 'Sesi Semakan Lapangan Kes Aduan Wilayah',
    dateTime: '2026-08-05T10:00',
    endDateTime: '2026-08-05T13:00',
    location: 'Kompleks Pentadbiran Kerajaan',
    category: 'SJK' as const,
    status: 'Diteruskan' as const,
    notes: 'Pemeriksaan fizikal dan verifikasi aduan di lokasi fizikal.',
    createdBy: 'Siti Aminah',
    createdAt: '2026-07-28T09:00:00Z',
  },
  {
    id: 'prog-4',
    title: 'Bengkel Penyediaan Format EOAD',
    dateTime: '2026-08-18T09:00',
    endDateTime: '2026-08-18T17:00',
    location: 'Dewan Auditorium B',
    category: 'Lain-lain' as const,
    status: 'Batal' as const,
    notes: 'Program ditangguhkan ke tarikh baharu berikutan pertindihan jadual mesyuarat utama.',
    createdBy: 'Sarah Adams',
    createdAt: '2026-08-04T11:00:00Z',
  },
];
