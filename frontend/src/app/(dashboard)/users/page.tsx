'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/services/api';
import { User, PaginationMeta } from '@/types';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import Pagination from '@/components/Pagination';
import Badge from '@/components/Badge';
import {
  Plus,
  RotateCcw,
  Search,
  Eye,
  Pencil,
  Trash2,
  ArrowUpDown,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

export default function UsersPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [usersList, setUsersList] = useState<User[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();
  const [loading, setLoading] = useState(true);

  // Filters & Sorting & Pagination
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('DESC');
  const [page, setPage] = useState(1);

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<User | null>(null);

  // Form inputs
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'Super Admin' | 'Divisi Humas' | 'Divisi Pubdok'>('Divisi Humas');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  const [saving, setSaving] = useState(false);

  // Access check
  if (user && user.role !== 'Super Admin') {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2 style={{ color: 'var(--red)' }}>Akses Terbatas</h2>
        <p style={{ color: 'var(--muted)' }}>
          Halaman Pengguna & Akses hanya dapat diakses oleh peran <b>Super Admin</b>.
        </p>
      </div>
    );
  }

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {
        page: page.toString(),
        page_size: '10',
        sort: sortField,
        dir: sortDir,
      };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await api.getUsers(params);
      setUsersList(res.data || []);
      setMeta(res.meta);
    } catch (err: any) {
      toast.error('Gagal mengambil data pengguna: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, sortField, sortDir, roleFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortField(field);
      setSortDir('ASC');
    }
    setPage(1);
  };

  const openCreateModal = () => {
    setActiveUser(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('Divisi Humas');
    setFormStatus('active');
    setFormModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setActiveUser(u);
    setFormName(u.name);
    setFormEmail(u.email);
    setFormPassword('');
    setFormRole(u.role as any);
    setFormStatus(u.status);
    setFormModalOpen(true);
  };

  const openDetailModal = (u: User) => {
    setActiveUser(u);
    setDetailModalOpen(true);
  };

  const openDeleteModal = (u: User) => {
    setActiveUser(u);
    setDeleteDialogOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail) {
      toast.error('Nama dan email wajib diisi.');
      return;
    }
    if (!activeUser && !formPassword) {
      toast.error('Kata sandi wajib diisi untuk pengguna baru.');
      return;
    }

    try {
      setSaving(true);
      const payload: any = {
        name: formName,
        email: formEmail,
        role: formRole,
        status: formStatus,
      };
      if (formPassword) {
        payload.password = formPassword;
      }

      if (activeUser) {
        await api.updateUser(activeUser.id, payload);
        toast.success(`Akun "${formName}" berhasil diperbarui.`);
      } else {
        await api.createUser(payload);
        toast.success(`Pengguna baru "${formName}" berhasil dibuat.`);
      }

      setFormModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan pengguna.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!activeUser) return;
    try {
      setSaving(true);
      await api.deleteUser(activeUser.id);
      toast.success(`Pengguna "${activeUser.name}" berhasil dihapus.`);
      setDeleteDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus pengguna.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="pagehead">
        <div>
          <div className="eyebrow">SISTEM & HAK AKSES</div>
          <h1>Pengguna & Akses Sistem</h1>
          <p>Kelola hak akses modul, peran Super Admin, Divisi Humas, dan Divisi Pubdok.</p>
        </div>

        <div className="actions">
          <button type="button" className="btn" onClick={fetchData} title="Muat ulang">
            <RotateCcw size={15} />
            <span>Muat Ulang</span>
          </button>
          <button type="button" className="btn primary" onClick={openCreateModal}>
            <Plus size={16} />
            <span>+ Tambah Pengguna</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card flush">
        <div className="cardhead">
          <form onSubmit={handleSearchSubmit} className="toolbar" style={{ flex: 1 }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Cari nama atau email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button
                type="submit"
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--accent)',
                }}
                aria-label="Cari"
              >
                <Search size={15} />
              </button>
            </div>

            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter Peran"
            >
              <option value="">Semua Peran</option>
              <option value="Super Admin">Super Admin</option>
              <option value="Divisi Humas">Divisi Humas</option>
              <option value="Divisi Pubdok">Divisi Pubdok</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter Status"
            >
              <option value="">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </form>
        </div>

        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>
                  <button type="button" className="sortlink" onClick={() => handleSort('name')}>
                    <span>Nama Pengguna</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th>
                  <button type="button" className="sortlink" onClick={() => handleSort('email')}>
                    <span>Email Akun</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th>
                  <button type="button" className="sortlink" onClick={() => handleSort('role')}>
                    <span>Peran Akses</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th>Akses Modul</th>
                <th>
                  <button type="button" className="sortlink" onClick={() => handleSort('status')}>
                    <span>Status</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="empty">
                    Memuat data akun pengguna...
                  </td>
                </tr>
              ) : usersList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty">
                    Tidak ditemukan data pengguna.
                  </td>
                </tr>
              ) : (
                usersList.map((u) => (
                  <tr key={u.id}>
                    <td className="first">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ width: 34, height: 34, fontSize: 12 }}>
                          {u.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div>{u.name}</div>
                          {user?.id === u.id && (
                            <small style={{ color: 'var(--green)', fontWeight: 700 }}>
                              (Akun Anda Saat Ini)
                            </small>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span className="badge neutral" style={{ fontWeight: 700 }}>
                        {u.role === 'Super Admin' ? (
                          <ShieldCheck size={13} color="var(--accent)" />
                        ) : (
                          <UserCheck size={13} color="var(--dim)" />
                        )}
                        {u.role}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--muted)', maxWidth: 260, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {u.module_access === 'all' ? 'Seluruh Modul (Akses Penuh)' : u.module_access}
                    </td>
                    <td>
                      <Badge status={u.status === 'active' ? 'active' : 'inactive'} />
                    </td>
                    <td className="act">
                      <button
                        type="button"
                        className="btn sm icon"
                        title="Detail"
                        onClick={() => openDetailModal(u)}
                        aria-label={`Detail ${u.name}`}
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn sm icon"
                        title="Edit"
                        onClick={() => openEditModal(u)}
                        aria-label={`Edit ${u.name}`}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn sm icon danger"
                        title="Hapus"
                        onClick={() => openDeleteModal(u)}
                        disabled={user?.id === u.id}
                        aria-label={`Hapus ${u.name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination meta={meta} onPageChange={(p) => setPage(p)} />
      </div>

      {/* Form Modal (Create / Edit) */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title={activeUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
      >
        <form onSubmit={handleSaveUser}>
          <div className="formgrid">
            <div className="field full">
              <label>Nama Lengkap</label>
              <input
                type="text"
                placeholder="Contoh: Ahsan"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>

            <div className="field full">
              <label>Alamat Email</label>
              <input
                type="email"
                placeholder="nama@humdok.local"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                required
              />
            </div>

            <div className="field full">
              <label>{activeUser ? 'Ubah Kata Sandi (Kosongkan jika tidak ingin diubah)' : 'Kata Sandi Baru (Min. 6 Karakter)'}</label>
              <input
                type="password"
                placeholder="••••••••"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                required={!activeUser}
              />
            </div>

            <div className="field">
              <label>Peran (Role)</label>
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value as any)}
                disabled={activeUser?.id === user?.id}
              >
                <option value="Super Admin">Super Admin</option>
                <option value="Divisi Humas">Divisi Humas</option>
                <option value="Divisi Pubdok">Divisi Pubdok</option>
              </select>
            </div>

            <div className="field">
              <label>Status Akun</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as any)}
                disabled={activeUser?.id === user?.id}
              >
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
            </div>
          </div>

          <div className="formfoot">
            <button type="button" className="btn" onClick={() => setFormModalOpen(false)}>
              Batal
            </button>
            <button type="submit" className="btn primary" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Pengguna'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Detail Akun Pengguna"
        maxWidth="480px"
      >
        {activeUser && (
          <div>
            <div style={{ textAlign: 'center', margin: '10px 0 20px' }}>
              <div className="avatar" style={{ width: 64, height: 64, margin: '0 auto 10px', fontSize: 20 }}>
                {activeUser.name.substring(0, 2).toUpperCase()}
              </div>
              <h2 style={{ margin: '0 0 4px', fontSize: 20 }}>{activeUser.name}</h2>
              <span className="badge ok">{activeUser.role}</span>
            </div>

            <div style={{ display: 'grid', gap: 12, borderTop: '1px solid var(--line)', paddingTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Email:</span>
                <b>{activeUser.email}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Status:</span>
                <Badge status={activeUser.status} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Akses Modul:</span>
                <b>{activeUser.module_access}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Terdaftar Sejak:</span>
                <b>{activeUser.created_at ? new Date(activeUser.created_at).toLocaleDateString('id-ID') : '-'}</b>
              </div>
            </div>

            <div className="formfoot">
              <button type="button" className="btn" onClick={() => setDetailModalOpen(false)}>
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteUser}
        message={`Apakah Anda yakin ingin menghapus akun pengguna "${activeUser?.name}" (${activeUser?.email})?`}
        loading={saving}
      />
    </div>
  );
}
