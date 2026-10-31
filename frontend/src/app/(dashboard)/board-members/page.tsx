'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/services/api';
import { BoardMember, PaginationMeta } from '@/types';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import Pagination from '@/components/Pagination';
import {
  Plus,
  RotateCcw,
  Search,
  Eye,
  Pencil,
  Trash2,
  ArrowUpDown,
  Phone,
  Sparkles,
} from 'lucide-react';

const DIVISIONS = [
  'Presidium',
  'Bidang Divisi',
  'Bidang Olahraga',
  'Bidang Seni',
  'Divisi Danus',
  'Divisi Humas',
  'Divisi Kesekretariatan',
  'Divisi Pubdok',
  'Divisi SDM',
  'UK Bola Basket',
  'UK Bola Voli',
  'UK Bulutangkis',
  'UK Musik',
  'UK Tari',
  'UK Tenis Meja',
  'Staf Ahli',
];

const LEVELS = [
  'Staf Ahli',
  'Pengurus Harian',
  'Anggota Pengurus Harian',
];

export default function BoardMembersPage() {
  const { user, workspace } = useAuth();
  const toast = useToast();

  const [members, setMembers] = useState<BoardMember[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();
  const [loading, setLoading] = useState(true);

  // Filters & Sorting & Pagination
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('ASC');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState('10');

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeMember, setActiveMember] = useState<BoardMember | null>(null);

  // Form input state
  const [formName, setFormName] = useState('');
  const [formSNR, setFormSNR] = useState('');
  const [formPosition, setFormPosition] = useState('');
  const [formLevel, setFormLevel] = useState('Anggota Pengurus Harian');
  const [formDivision, setFormDivision] = useState(workspace === 'Pubdok' ? 'Divisi Pubdok' : 'Divisi Humas');
  const [formContact, setFormContact] = useState('');
  const [saving, setSaving] = useState(false);

  const canMutate = user?.role === 'Super Admin' || user?.role === 'Divisi Humas';

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {
        page: page.toString(),
        page_size: pageSize,
        sort: sortField,
        dir: sortDir,
        period: '2026',
      };
      if (search) params.search = search;
      if (levelFilter) params.level = levelFilter;
      if (divisionFilter) params.division = divisionFilter;

      const res = await api.getBoardMembers(params);
      setMembers(res.data || []);
      setMeta(res.meta);
    } catch (err: any) {
      toast.error('Gagal mengambil data pengurus: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize, sortField, sortDir, levelFilter, divisionFilter]);

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
    setActiveMember(null);
    setFormName('');
    setFormSNR('—');
    setFormPosition('');
    setFormLevel('Anggota Pengurus Harian');
    setFormDivision(workspace === 'Pubdok' ? 'Divisi Pubdok' : 'Divisi Humas');
    setFormContact('—');
    setFormModalOpen(true);
  };

  const openEditModal = (m: BoardMember) => {
    setActiveMember(m);
    setFormName(m.name);
    setFormSNR(m.snr || '—');
    setFormPosition(m.position);
    setFormLevel(m.level);
    setFormDivision(m.division);
    setFormContact(m.contact || '—');
    setFormModalOpen(true);
  };

  const openDetailModal = (m: BoardMember) => {
    setActiveMember(m);
    setDetailModalOpen(true);
  };

  const openDeleteModal = (m: BoardMember) => {
    setActiveMember(m);
    setDeleteDialogOpen(true);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPosition.trim()) {
      toast.error('Mohon lengkapi nama dan jabatan pengurus.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: formName.trim(),
        snr: formSNR.trim() || '—',
        position: formPosition.trim(),
        level: formLevel,
        division: formDivision,
        contact: formContact.trim() || '—',
        period: '2026',
      };

      if (activeMember) {
        await api.updateBoardMember(activeMember.id, payload);
        toast.success(`Data pengurus ${formName} berhasil diperbarui.`);
      } else {
        await api.createBoardMember(payload);
        toast.success(`Pengurus baru ${formName} berhasil ditambahkan.`);
      }

      setFormModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan data pengurus.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!activeMember) return;
    try {
      setSaving(true);
      await api.deleteBoardMember(activeMember.id);
      toast.success(`Pengurus ${activeMember.name} berhasil dihapus.`);
      setDeleteDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus pengurus.');
    } finally {
      setSaving(false);
    }
  };

  const cleanPhone = (val: string) => {
    return val.replace(/\D/g, '');
  };

  const hasPhone = (val: string) => {
    return val && val !== '—' && cleanPhone(val).length >= 8;
  };

  return (
    <div>
      {/* Page Header */}
      <div className="pagehead">
        <div>
          <div className="eyebrow">STRUKTUR ORGANISASI</div>
          <h1>Daftar Data Pengurus</h1>
          <p>
            <b>{meta?.total || 55} data</b> · Periode Kepengurusan 2026 UKM SENIOR PNUP
          </p>
        </div>

        <div className="actions">
          <button type="button" className="btn" onClick={fetchData} title="Muat ulang">
            <RotateCcw size={15} />
            <span>Muat Ulang</span>
          </button>
          {canMutate && (
            <button type="button" className="btn primary" onClick={openCreateModal}>
              <Plus size={16} />
              <span>+ Tambah Pengurus</span>
            </button>
          )}
        </div>
      </div>

      {/* Card Table Container */}
      <div className="card flush">
        {/* Quick Filter Tabs by Level */}
        <div className="filtertabs">
          <button
            type="button"
            className={`filtertab ${levelFilter === '' ? 'active' : ''}`}
            onClick={() => {
              setLevelFilter('');
              setPage(1);
            }}
          >
            <span>Semua Tingkat</span>
            <span className="badge-count">55</span>
          </button>
          <button
            type="button"
            className={`filtertab ${levelFilter === 'Staf Ahli' ? 'active' : ''}`}
            onClick={() => {
              setLevelFilter('Staf Ahli');
              setPage(1);
            }}
          >
            <span>Staf Ahli</span>
            <span className="badge-count">9</span>
          </button>
          <button
            type="button"
            className={`filtertab ${levelFilter === 'Pengurus Harian' ? 'active' : ''}`}
            onClick={() => {
              setLevelFilter('Pengurus Harian');
              setPage(1);
            }}
          >
            <span>Pengurus Harian</span>
            <span className="badge-count">17</span>
          </button>
          <button
            type="button"
            className={`filtertab ${levelFilter === 'Anggota Pengurus Harian' ? 'active' : ''}`}
            onClick={() => {
              setLevelFilter('Anggota Pengurus Harian');
              setPage(1);
            }}
          >
            <span>Anggota Pengurus Harian</span>
            <span className="badge-count">29</span>
          </button>
        </div>

        {/* Toolbar: Search, Filters */}
        <div className="cardhead" style={{ paddingTop: 14 }}>
          <form onSubmit={handleSearchSubmit} className="toolbar" style={{ flex: 1 }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Cari nama, SNR, jabatan, no kontak..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: 280 }}
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
              value={divisionFilter}
              onChange={(e) => {
                setDivisionFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter Divisi"
            >
              <option value="">Semua Divisi ({DIVISIONS.length})</option>
              {DIVISIONS.map((div) => (
                <option key={div} value={div}>
                  {div}
                </option>
              ))}
            </select>

            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(e.target.value);
                setPage(1);
              }}
              aria-label="Baris per halaman"
              style={{ minWidth: 110 }}
            >
              <option value="10">10 data / hal</option>
              <option value="20">20 data / hal</option>
              <option value="55">55 data (Semua)</option>
            </select>

            {(search || divisionFilter || levelFilter) && (
              <button
                type="button"
                className="btn sm"
                onClick={() => {
                  setSearch('');
                  setLevelFilter('');
                  setDivisionFilter('');
                  setPage(1);
                }}
              >
                Reset Filter
              </button>
            )}
          </form>
        </div>

        {/* Table Content */}
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 44, textAlign: 'center' }}>No</th>
                <th>
                  <button type="button" className="sortlink" onClick={() => handleSort('name')}>
                    <span>Nama Pengurus</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th>
                  <button type="button" className="sortlink" onClick={() => handleSort('position')}>
                    <span>Jabatan</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th>
                  <button type="button" className="sortlink" onClick={() => handleSort('level')}>
                    <span>Tingkat</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th>
                  <button type="button" className="sortlink" onClick={() => handleSort('division')}>
                    <span>Divisi</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th>
                  <button type="button" className="sortlink" onClick={() => handleSort('snr')}>
                    <span>SNR</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th>Kontak</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="empty">
                    Memuat data pengurus...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty">
                    Tidak ditemukan data pengurus yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                members.map((m, idx) => {
                  const rowNumber = ((page - 1) * parseInt(pageSize, 10)) + idx + 1;
                  const isContactPhone = hasPhone(m.contact);
                  return (
                    <tr key={m.id}>
                      <td style={{ textAlign: 'center', color: 'var(--muted)', fontWeight: 600 }}>
                        {rowNumber}
                      </td>
                      <td className="first">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="avatar" style={{ width: 34, height: 34, fontSize: 12 }}>
                            {m.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700 }}>{m.name}</div>
                            <small style={{ color: 'var(--muted)' }}>Periode 2026</small>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{m.position}</td>
                      <td>
                        <span className="pill" style={{ fontWeight: 700 }}>
                          {m.level}
                        </span>
                      </td>
                      <td>
                        <span className="badge neutral">{m.division}</span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        {m.snr && m.snr !== '—' ? (
                          <span style={{ color: 'var(--text)' }}>{m.snr}</span>
                        ) : (
                          <span style={{ color: 'var(--dim)' }}>—</span>
                        )}
                      </td>
                      <td>
                        {isContactPhone ? (
                          <a
                            href={`https://wa.me/62${cleanPhone(m.contact).replace(/^0/, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="link"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                            title="Hubungi via WhatsApp"
                          >
                            <Phone size={12} />
                            <span>{m.contact}</span>
                          </a>
                        ) : (
                          <span style={{ color: 'var(--dim)' }}>—</span>
                        )}
                      </td>
                      <td className="act">
                        <button
                          type="button"
                          className="btn sm icon"
                          onClick={() => openDetailModal(m)}
                          title="Lihat Detail Pengurus"
                          aria-label="Detail"
                        >
                          <Eye size={14} />
                        </button>

                        {canMutate && (
                          <>
                            <button
                              type="button"
                              className="btn sm icon"
                              onClick={() => openEditModal(m)}
                              title="Edit Pengurus"
                              aria-label="Edit"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn sm icon danger"
                              onClick={() => openDeleteModal(m)}
                              title="Hapus Pengurus"
                              aria-label="Hapus"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {meta && (
          <Pagination
            meta={meta}
            onPageChange={(newPage) => setPage(newPage)}
          />
        )}
      </div>

      {/* Form Modal: Tambah & Edit Pengurus */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title={activeMember ? 'Edit Data Pengurus' : 'Tambah Pengurus Baru (Periode 2026)'}
        maxWidth="600px"
      >
        <form onSubmit={handleSaveMember}>
          <div className="formgrid">
            <div className="field full">
              <label>Nama Lengkap Pengurus</label>
              <input
                type="text"
                placeholder="Contoh: Ahsan"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>Nomor Induk SNR (opsional)</label>
              <input
                type="text"
                placeholder="Contoh: SNR.24.24.056 atau —"
                value={formSNR}
                onChange={(e) => setFormSNR(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Jabatan Organisasi</label>
              <input
                type="text"
                placeholder="Contoh: KOORDINATOR DIVISI HUMAS"
                value={formPosition}
                onChange={(e) => setFormPosition(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>Tingkat Kepengurusan</label>
              <select value={formLevel} onChange={(e) => setFormLevel(e.target.value)}>
                {LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Divisi / Unit</label>
              <select value={formDivision} onChange={(e) => setFormDivision(e.target.value)}>
                {DIVISIONS.map((div) => (
                  <option key={div} value={div}>
                    {div}
                  </option>
                ))}
              </select>
            </div>

            <div className="field full">
              <label>Nomor Kontak / WhatsApp (opsional)</label>
              <input
                type="text"
                placeholder="Contoh: 082190857122 atau —"
                value={formContact}
                onChange={(e) => setFormContact(e.target.value)}
              />
            </div>
          </div>

          <div className="formfoot">
            <button type="button" className="btn" onClick={() => setFormModalOpen(false)}>
              Batal
            </button>
            <button type="submit" className="btn primary" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Pengurus'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Detail Pengurus UKM SENIOR"
        maxWidth="500px"
      >
        {activeMember && (
          <div>
            <div style={{ textAlign: 'center', margin: '10px 0 20px' }}>
              <div className="avatar" style={{ width: 68, height: 68, margin: '0 auto 10px', fontSize: 24 }}>
                {activeMember.name.substring(0, 2).toUpperCase()}
              </div>
              <h2 style={{ margin: '0 0 6px', fontSize: 22, color: 'var(--text)' }}>{activeMember.name}</h2>
              <span className="badge ok" style={{ fontSize: 13, padding: '4px 14px' }}>
                {activeMember.position}
              </span>
            </div>

            <div style={{ display: 'grid', gap: 12, borderTop: '1px solid var(--line)', paddingTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="muted">Tingkat:</span>
                <span className="pill" style={{ fontWeight: 800 }}>{activeMember.level}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="muted">Divisi:</span>
                <b>{activeMember.division}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="muted">SNR:</span>
                <b style={{ fontFamily: 'monospace' }}>{activeMember.snr || '—'}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="muted">Periode:</span>
                <b>Tahun {activeMember.period}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="muted">Kontak:</span>
                {hasPhone(activeMember.contact) ? (
                  <a
                    href={`https://wa.me/62${cleanPhone(activeMember.contact).replace(/^0/, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="link"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <Phone size={13} />
                    <span>{activeMember.contact}</span>
                  </a>
                ) : (
                  <span style={{ color: 'var(--dim)' }}>—</span>
                )}
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteMember}
        message={`Apakah Anda yakin ingin menghapus data pengurus "${activeMember?.name}"?`}
        loading={saving}
      />
    </div>
  );
}
