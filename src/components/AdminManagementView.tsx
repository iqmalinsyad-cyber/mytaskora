import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldCheck, 
  Key, 
  Search, 
  Filter, 
  Clock, 
  Activity, 
  UserCheck, 
  UserPlus, 
  Lock, 
  RefreshCw, 
  Database, 
  Calendar, 
  FileSpreadsheet, 
  ShieldAlert, 
  CheckCircle2, 
  UserX, 
  Sparkles,
  Laptop,
  Globe,
  Download,
  Building2,
  SlidersHorizontal,
  Trash2
} from 'lucide-react';
import { UserProfile, ALL_SYSTEM_VIEWS } from '../types';
import { 
  getStoredUserAccounts, 
  saveUserAccounts, 
  UserAccount, 
  fetchAuditLogs, 
  AuditLogEntry, 
  hashPassword,
  recordAuditLog,
  deleteUserAccount
} from '../lib/auth';
import { getSupabaseClient } from '../lib/supabase';

interface AdminManagementViewProps {
  currentUser: UserProfile;
  onOpenSupabaseModal: () => void;
  onUpdateUserProfile?: (updated: UserProfile) => void;
}

export const AdminManagementView: React.FC<AdminManagementViewProps> = ({
  currentUser,
  onOpenSupabaseModal,
  onUpdateUserProfile,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'audit_logs'>('users');
  
  // Accounts state
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [logSearch, setLogSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Edit user role / password modal
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const [selectedUserViews, setSelectedUserViews] = useState<string[]>([]);
  const [resetPasswordInput, setResetPasswordInput] = useState<string>('');
  const [modalMessage, setModalMessage] = useState<string | null>(null);

  // Delete user confirmation state (bypasses iframe window.confirm blocking)
  const [userToDeleteConfirm, setUserToDeleteConfirm] = useState<{ id: string; name: string; username: string } | null>(null);

  const isSupabaseConnected = !!getSupabaseClient();

  useEffect(() => {
    loadAccountsData();
    loadAuditLogsData();
  }, []);

  const loadAccountsData = async () => {
    const accs = await getStoredUserAccounts();
    
    // Check if Supabase client has extra users
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('users').select('*');
        if (!error && data) {
          const supabaseUsers: UserAccount[] = data.map((d: any) => ({
            id: d.id,
            name: d.name,
            username: d.username,
            email: d.email,
            role: d.role || 'Pegawai Aduan',
            avatar: d.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            workspaceId: d.workspace_id || 'ws-integriti',
            department: d.department || 'Unit Aduan',
            phone: d.phone,
            passwordHash: d.password_hash || '',
            createdAt: d.created_at || new Date().toISOString(),
            lastLogin: d.last_login || new Date().toISOString(),
          }));

          // Merge without duplicate IDs
          const mergedMap = new Map<string, UserAccount>();
          accs.forEach(a => mergedMap.set(a.id, a));
          supabaseUsers.forEach(s => mergedMap.set(s.id, s));
          setUsers(Array.from(mergedMap.values()));
          return;
        }
      } catch (e) {
        console.warn('Supabase fetch users warning:', e);
      }
    }

    setUsers(accs);
  };

  const loadAuditLogsData = async () => {
    setIsLoadingLogs(true);
    const logs = await fetchAuditLogs();
    setAuditLogs(logs);
    setIsLoadingLogs(false);
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(userSearch.toLowerCase()));
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Filtered Audit Logs
  const filteredLogs = auditLogs.filter((l) => {
    const matchesSearch = 
      l.userName.toLowerCase().includes(logSearch.toLowerCase()) ||
      l.username.toLowerCase().includes(logSearch.toLowerCase()) ||
      (l.details && l.details.toLowerCase().includes(logSearch.toLowerCase()));
    const matchesAction = actionFilter === 'all' || l.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const handleUpdateRole = async () => {
    if (!selectedUser || !newRole) return;
    
    const updatedUsers = users.map((u) => {
      if (u.id === selectedUser.id) {
        return { ...u, role: newRole };
      }
      return u;
    });

    setUsers(updatedUsers);
    saveUserAccounts(updatedUsers);

    // Sync to Supabase
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('users').upsert({
          id: selectedUser.id,
          username: selectedUser.username,
          email: selectedUser.email,
          password_hash: selectedUser.passwordHash,
          name: selectedUser.name,
          role: newRole,
          avatar: selectedUser.avatar,
          department: selectedUser.department,
          phone: selectedUser.phone,
          workspace_id: selectedUser.workspaceId || 'ws-integriti',
          allowed_views: selectedUser.allowedViews,
        });
      } catch (e) {
        console.error(e);
      }
    }

    await recordAuditLog({
      userId: currentUser.id,
      username: currentUser.username || 'admin',
      userName: currentUser.name,
      role: currentUser.role || 'Pentadbir Utama',
      action: 'KEMASKINI_PROFIL',
      ipAddress: '127.0.0.1 (Admin Console)',
      deviceInfo: 'Admin Console Dashboard',
      details: `Peranan user @${selectedUser.username} ditukar kepada ${newRole}`
    });

    setModalMessage(`Peranan @${selectedUser.username} telah ditukar kepada ${newRole}.`);
    setTimeout(() => {
      setSelectedUser(null);
      setModalMessage(null);
      loadAuditLogsData();
    }, 1200);
  };

  const handleAdminResetPassword = async () => {
    if (!selectedUser || !resetPasswordInput) return;
    const newHash = await hashPassword(resetPasswordInput);

    const updatedUsers = users.map((u) => {
      if (u.id === selectedUser.id) {
        return { ...u, passwordHash: newHash };
      }
      return u;
    });

    setUsers(updatedUsers);
    saveUserAccounts(updatedUsers);

    // Sync to Supabase
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('users').upsert({
          id: selectedUser.id,
          username: selectedUser.username,
          email: selectedUser.email,
          password_hash: newHash,
          name: selectedUser.name,
          role: selectedUser.role,
          avatar: selectedUser.avatar,
          department: selectedUser.department,
          phone: selectedUser.phone,
          workspace_id: selectedUser.workspaceId || 'ws-integriti',
          allowed_views: selectedUser.allowedViews,
        });
      } catch (e) {
        console.error(e);
      }
    }

    await recordAuditLog({
      userId: currentUser.id,
      username: currentUser.username || 'admin',
      userName: currentUser.name,
      role: currentUser.role || 'Pentadbir Utama',
      action: 'TUKAR_KATA_LALUAN',
      ipAddress: '127.0.0.1 (Admin Console)',
      deviceInfo: 'Admin Console Dashboard',
      details: `Kata laluan user @${selectedUser.username} telah di-reset oleh Pentadbir`
    });

    setModalMessage(`Kata laluan baharu terenkripsi untuk @${selectedUser.username} telah disimpan!`);
    setTimeout(() => {
      setSelectedUser(null);
      setResetPasswordInput('');
      setModalMessage(null);
      loadAuditLogsData();
    }, 1200);
  };

  const handleSaveViewPermissions = async () => {
    if (!selectedUser) return;

    const updatedUsers = users.map((u) => {
      if (u.id === selectedUser.id) {
        return { ...u, allowedViews: selectedUserViews };
      }
      return u;
    });

    setUsers(updatedUsers);
    saveUserAccounts(updatedUsers);

    // Sync to Supabase if connected
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('users').upsert({
          id: selectedUser.id,
          username: selectedUser.username,
          email: selectedUser.email,
          password_hash: selectedUser.passwordHash,
          name: selectedUser.name,
          role: selectedUser.role,
          avatar: selectedUser.avatar,
          department: selectedUser.department,
          phone: selectedUser.phone,
          workspace_id: selectedUser.workspaceId || 'ws-integriti',
          allowed_views: selectedUserViews,
        });
      } catch (e) {
        console.error('Supabase update allowed_views error:', e);
      }
    }

    if (selectedUser.id === currentUser.id && onUpdateUserProfile) {
      onUpdateUserProfile({ ...currentUser, allowedViews: selectedUserViews });
    }

    await recordAuditLog({
      userId: currentUser.id,
      username: currentUser.username || 'admin',
      userName: currentUser.name,
      role: currentUser.role || 'Pentadbir Utama',
      action: 'KEMASKINI_PROFIL',
      ipAddress: '127.0.0.1 (Admin Console)',
      deviceInfo: 'Admin Console Dashboard',
      details: `Tetapan paparan user @${selectedUser.username} dikemaskini (${selectedUserViews.length} fungsi dibenarkan)`
    });

    setModalMessage(`Tetapan paparan & kebenaran fungsi untuk @${selectedUser.username} telah disimpan!`);
    setTimeout(() => {
      setModalMessage(null);
      loadAuditLogsData();
    }, 1200);
  };

  const handleDeleteUser = (u: { id: string; name: string; username: string }) => {
    setUserToDeleteConfirm({
      id: u.id,
      name: u.name,
      username: u.username,
    });
  };

  const confirmAndExecuteUserDelete = async () => {
    if (!userToDeleteConfirm) return;
    const target = userToDeleteConfirm;

    await deleteUserAccount(target.id);
    if (target.username) {
      await deleteUserAccount(target.username);
    }

    setUsers((prev) => prev.filter((user) => user.id !== target.id && user.username !== target.username));
    if (selectedUser && (selectedUser.id === target.id || selectedUser.username === target.username)) {
      setSelectedUser(null);
    }

    await recordAuditLog({
      userId: currentUser.id,
      username: currentUser.username || 'admin',
      userName: currentUser.name,
      role: currentUser.role || 'Pentadbir Utama',
      action: 'PADAM_USER',
      ipAddress: '127.0.0.1 (Admin Console)',
      deviceInfo: 'Admin Console Dashboard',
      details: `Profil user @${target.username} (${target.name}) telah dipadamkan secara kekal oleh Pentadbir`
    });

    setUserToDeleteConfirm(null);
    loadAuditLogsData();
  };

  const exportLogsCSV = () => {
    const headers = ['ID Log', 'Masa', 'Tindakan', 'Username', 'Nama Pengguna', 'Peranan', 'IP Address', 'Butiran'];
    const rows = auditLogs.map(l => [
      l.id,
      new Date(l.timestamp).toLocaleString('ms-MY'),
      l.action,
      l.username,
      l.userName,
      l.role,
      l.ipAddress,
      `"${l.details || ''}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Banner & Statistics */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/90 flex items-center justify-center text-white font-extrabold shadow-lg ring-4 ring-indigo-500/20">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold tracking-tight">Konsol Pentadbiran & Audit Log Sesi</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  SHA-256 Encrypted
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                Pantau rekod pendaftaran pengguna, status log masuk/keluar, serta kawalan keselamatan terpusat.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={loadAuditLogsData}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-2 border border-white/10"
              title="Kemaskini Semula"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingLogs ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Realtime</span>
            </button>

            <button
              onClick={onOpenSupabaseModal}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                isSupabaseConnected
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>{isSupabaseConnected ? 'Supabase DB Active' : 'Local Storage Mode'}</span>
            </button>
          </div>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Jumlah Pengguna</span>
            </div>
            <div className="text-2xl font-black text-white mt-1">{users.length}</div>
            <div className="text-[10px] text-emerald-400 mt-0.5">Akaun Terdaftar</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Rekod Audit Log</span>
            </div>
            <div className="text-2xl font-black text-white mt-1">{auditLogs.length}</div>
            <div className="text-[10px] text-indigo-300 mt-0.5">Masa Nyata (Realtime)</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Log Masuk Hari Ini</span>
            </div>
            <div className="text-2xl font-black text-white mt-1">
              {auditLogs.filter(l => l.action === 'LOG_MASUK').length}
            </div>
            <div className="text-[10px] text-amber-300 mt-0.5">Sesi Divalidasi</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span>Pendaftaran Baharu</span>
            </div>
            <div className="text-2xl font-black text-white mt-1">
              {auditLogs.filter(l => l.action === 'PENDAFTARAN_AKAUN').length}
            </div>
            <div className="text-[10px] text-slate-300 mt-0.5">SHA-256 Protected</div>
          </div>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
          <button
            onClick={() => setActiveSubTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
              activeSubTab === 'users'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Senarai User Terdaftar ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('audit_logs')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
              activeSubTab === 'audit_logs'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>Audit Log Masuk / Keluar ({auditLogs.length})</span>
          </button>
        </div>

        {activeSubTab === 'audit_logs' && (
          <button
            onClick={exportLogsCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all flex items-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Eksport CSV Log</span>
          </button>
        )}
      </div>

      {/* TAB 1: SENARAI USER TERDAFTAR */}
      {activeSubTab === 'users' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Cari nama, username, e-mel..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="all">Semua Peranan User</option>
                <option value="Pentadbir Utama">Pentadbir Utama</option>
                <option value="Pengarah Integriti">Pengarah Integriti</option>
                <option value="Pegawai Aduan">Pegawai Aduan</option>
              </select>
            </div>
          </div>

          {/* User Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 font-extrabold text-slate-700">
                  <th className="p-3.5">Pengguna & Avatar</th>
                  <th className="p-3.5">Username & E-mel</th>
                  <th className="p-3.5">Peranan</th>
                  <th className="p-3.5">Jabatan / Unit</th>
                  <th className="p-3.5">Log Masuk Terakhir</th>
                  <th className="p-3.5 text-right">Tindakan Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 font-bold">
                      Tiada pengguna dijumpai berdasarkan carian.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-xs shrink-0"
                          />
                          <div>
                            <div className="font-extrabold text-slate-900">{u.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">ID: {u.id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-indigo-600 font-mono">@{u.username}</div>
                        <div className="text-[11px] text-slate-500">{u.email}</div>
                      </td>

                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-block ${
                          u.role.includes('Pentadbir') || u.role.includes('Pengarah')
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {u.role}
                        </span>
                      </td>

                      <td className="p-3.5 text-slate-600 font-medium">
                        {u.department || 'Unit Aduan & Integriti'}
                      </td>

                      <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleString('ms-MY') : 'Belum pernah log masuk'}
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              const initialViews = u.allowedViews && u.allowedViews.length > 0
                                ? u.allowedViews
                                : (u.role === 'Pentadbir Utama'
                                    ? ALL_SYSTEM_VIEWS.map(v => v.id)
                                    : ALL_SYSTEM_VIEWS.filter(v => v.id !== 'admin').map(v => v.id));

                              setSelectedUser(u);
                              setNewRole(u.role);
                              setSelectedUserViews(initialViews);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-all border border-slate-200"
                          >
                            Urus & Tetapan
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            title="Padam Profil User"
                            className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs transition-all border border-rose-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT LOG MASUK & KELUAR */}
      {activeSubTab === 'audit_logs' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Cari log mengikut username, nama..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="all">Semua Tindakan Sesi</option>
                <option value="LOG_MASUK">Log Masuk</option>
                <option value="LOG_KELUAR">Log Keluar</option>
                <option value="PENDAFTARAN_AKAUN">Pendaftaran Akaun</option>
                <option value="TUKAR_KATA_LALUAN">Tukar Kata Laluan</option>
                <option value="KEMASKINI_PROFIL">Kemaskini Profil</option>
              </select>
            </div>
          </div>

          {/* Audit Trail List Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 font-extrabold text-slate-700">
                  <th className="p-3.5">Masa & Tarikh Log</th>
                  <th className="p-3.5">Jenis Aktiviti / Sesi</th>
                  <th className="p-3.5">Pengguna</th>
                  <th className="p-3.5">IP Address & Protokol</th>
                  <th className="p-3.5">Peranti & Maklumat Sesi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 font-bold">
                      Tiada rekod log aktiviti dijumpai.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        <div className="font-bold text-slate-900">
                          {new Date(l.timestamp).toLocaleDateString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(l.timestamp).toLocaleTimeString('ms-MY')}
                        </div>
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide inline-flex items-center gap-1.5 ${
                          l.action === 'LOG_MASUK'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : l.action === 'LOG_KELUAR'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : l.action === 'PENDAFTARAN_AKAUN'
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            l.action === 'LOG_MASUK' ? 'bg-emerald-500' : l.action === 'LOG_KELUAR' ? 'bg-rose-500' : 'bg-indigo-500'
                          }`}></span>
                          <span>{l.action.replace('_', ' ')}</span>
                        </span>
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="font-extrabold text-slate-900">{l.userName}</div>
                            <div className="text-[10px] text-indigo-600 font-mono">@{l.username} ({l.role})</div>
                          </div>
                          {l.username && (
                            <button
                              onClick={() => handleDeleteUser({ id: l.userId || l.username, name: l.userName, username: l.username })}
                              title="Padam Profil Pengguna Ini"
                              className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[10px] border border-rose-200 transition-all flex items-center gap-1 shrink-0"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Padam</span>
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5 whitespace-nowrap font-mono text-[11px] text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>{l.ipAddress}</span>
                        </div>
                      </td>

                      <td className="p-3.5 text-slate-600 text-[11px]">
                        <div className="font-semibold text-slate-800">{l.details || l.deviceInfo}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{l.deviceInfo}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADMIN EDIT USER / RESET PASSWORD */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200 space-y-4 relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <img
                  src={selectedUser.avatar}
                  alt={selectedUser.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                />
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">{selectedUser.name}</h3>
                  <div className="text-[11px] text-indigo-600 font-mono">@{selectedUser.username}</div>
                </div>
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-extrabold px-2 py-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {modalMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{modalMessage}</span>
              </div>
            )}

            {/* Change Role Section */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-bold text-slate-700">Tukar Peranan Pengguna</label>
              <div className="flex items-center gap-2">
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold focus:outline-none"
                >
                  <option value="Pegawai Aduan">Pegawai Aduan</option>
                  <option value="Pengarah Integriti">Pengarah Integriti</option>
                  <option value="Pentadbir Utama">Pentadbir Utama</option>
                </select>

                <button
                  onClick={handleUpdateRole}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs"
                >
                  Simpan Peranan
                </button>
              </div>
            </div>

            {/* Tetapan Kebenaran Paparan User (Tick / Untick) */}
            <div className="space-y-2.5 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Kebenaran Paparan & Fungsi User</span>
                </label>
                <div className="flex items-center gap-2 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setSelectedUserViews(ALL_SYSTEM_VIEWS.map(v => v.id))}
                    className="text-indigo-600 hover:underline font-bold"
                  >
                    Pilih Semua
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setSelectedUserViews([])}
                    className="text-slate-500 hover:underline font-bold"
                  >
                    Nyahpilih
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 font-medium">
                Tandakan (tick) fungsi & bahagian paparan yang dibenarkan untuk diakses oleh pengguna ini:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1.5 bg-slate-50 rounded-xl border border-slate-200">
                {ALL_SYSTEM_VIEWS.map((view) => {
                  const isChecked = selectedUserViews.includes(view.id);
                  return (
                    <label
                      key={view.id}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-[11px] font-semibold cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-indigo-50/80 border-indigo-200 text-indigo-900 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedUserViews(prev => prev.filter(v => v !== view.id));
                          } else {
                            setSelectedUserViews(prev => [...prev, view.id]);
                          }
                        }}
                        className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 shrink-0 cursor-pointer"
                      />
                      <span className="truncate">{view.label}</span>
                    </label>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleSaveViewPermissions}
                className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Simpan Kebenaran Paparan ({selectedUserViews.length} Dibenarkan)</span>
              </button>
            </div>

            {/* Admin Reset Password Section */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-indigo-600" />
                <span>Reset Kata Laluan Terenkripsi</span>
              </label>
              <input
                type="password"
                value={resetPasswordInput}
                onChange={(e) => setResetPasswordInput(e.target.value)}
                placeholder="Masukkan kata laluan baharu..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none"
              />
              <button
                onClick={handleAdminResetPassword}
                disabled={!resetPasswordInput}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-40"
              >
                Reset Kata Laluan User (SHA-256)
              </button>
            </div>

            {/* Padam Profil User Section */}
            <div className="pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleDeleteUser(selectedUser)}
                className="w-full py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all border border-rose-200 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Padam Profil Pengguna Ini Secara Kekal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PENGESAHAN PADAM PROFIL PENGGUNA (Custom iframe-friendly modal) */}
      {userToDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-rose-100 space-y-4 text-left">
            <div className="flex items-center gap-3 text-rose-600 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Padam Profil Pengguna</h3>
                <p className="text-[11px] text-slate-500">Tindakan ini adalah kekal dan tidak boleh diundurkan</p>
              </div>
            </div>

            {(userToDeleteConfirm.id === currentUser.id || userToDeleteConfirm.username === currentUser.username) ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-bold">
                Akaun ini merupakan akaun utama yang sedang anda gunakan untuk log masuk. Anda tidak boleh memadam profil pengguna anda sendiri!
              </div>
            ) : (
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Adakah anda pasti mahu memadamkan profil pengguna <strong className="text-slate-900">@{userToDeleteConfirm.username} ({userToDeleteConfirm.name})</strong> secara kekal dari pangkalan data dan sistem?
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setUserToDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
              >
                Batal
              </button>

              {!(userToDeleteConfirm.id === currentUser.id || userToDeleteConfirm.username === currentUser.username) && (
                <button
                  type="button"
                  onClick={confirmAndExecuteUserDelete}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Ya, Padam Profil Ini</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
