'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/services/api';
import { WorkProgram, BoardMember, PaginationMeta } from '@/types';
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
  Briefcase,
} from 'lucide-react';

export default function WorkProgramsPage() {
  const { user, workspace } = useAuth();
  const toast = useToast();

  const [programs, setPrograms] = useState<WorkProgram[]>([]);
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();
  const [loading, setLoading] = useState(true);

  // Filters & Sorting & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('ASC');
  const [page, setPage] = useState(1);

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeProgram, setActiveProgram] = useState<WorkProgram | null>(null);

  // Form inputs
  const [formName, setFormName] = useState('');
  const [formPicID, setFormPicID] = useState('');
  const [formTarget, setFormTarget] = useState('');
  const [formProgress, setFormProgress] = useState(0);
  const [formStatus, setFormStatus] = useState<string>('Belum');
  const [formDivision, setFormDivision] = useState<string>(workspace === 'Humas' ? 'Humas' : 'Pubdok');
  const [saving, setSaving] = useState(false);

  const canMutate =
    user?.role === 'Super Admin' ||
    (user?.role === 'Divisi Humas' && workspace === 'Humas') ||
    (user?.role === 'Divisi Pubdok' && workspace === 'Pubdok');

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {
        page: page.toString(),
        page_size: '20',
        sort: sortField,
        dir: sortDir,
        period: '2026',
      };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (divisionFilter) params.division = divisionFilter;
      else if (user?.role !== 'Super Admin') params.division = workspace;

      const res = await api.getWorkPrograms(params);
      setPrograms(res.data || []);
      setMeta(res.meta);
    } catch (err: any) {
      toast.error('Gagal memuat program kerja: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await api.getBoardMembers({ page_size: '100', period: '2026' });
      setBoardMembers(res.data || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    fetchData();
  }, [page, sortField, sortDir, statusFilter, divisionFilter, workspace]);

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
    setActiveProgram(null);
    setFormName('');
    setFormPicID(boardMembers[0]?.id || '');
    setFormTarget('');
    setFormProgress(0);
    setFormStatus('Belum');
    setFormDivision(workspace === 'Humas' ? 'Humas' : 'Pubdok');
    setFormModalOpen(true);
  };

  const openEditModal = (wp: WorkProgram) => {
    setActiveProgram(wp);
    setFormName(wp.name);
    setFormPicID(wp.pic_id || '');
    setFormTarget(wp.target_text);
    setFormProgress(wp.progress_pct);
    setFormStatus(wp.status);
    setFormDivision(wp.division);
    setFormModalOpen(true);
  };

  const openDetailModal = (wp: WorkProgram) => {
    setActiveProgram(wp);
    setDetailModalOpen(true);
  };

  const openDeleteModal = (wp: WorkProgram) => {
    setActiveProgram(wp);
    setDeleteDialogOpen(true);
  };

  const handleProgressChange = (val: number) => {
    setFormProgress(val);
    if (val === 100) setFormStatus('Terlaksana');
    else if (val > 0) setFormStatus('Berjalan');
    else setFormStatus('Belum');
  };

  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formTarget.trim()) {
      toast.error('Mohon lengkapi judul dan target program kerja.');
      return;
    }

    try {
      setSaving(true);
      const selectedMember = boardMembers.find((m) => m.id === formPicID);
      const payload = {
        name: formName.trim(),
        pic_id: formPicID || null,
        pic_name: selectedMember?.name || '',
        target_text: formTarget.trim(),
        progress_pct: Number(formProgress),
        status: formStatus,
        division: formDivision,
        period: '2026',
      };

      if (activeProgram) {
        await api.updateWorkProgram(activeProgram.id, payload);
        toast.success(`Program kerja "${formName}" berhasil diperbarui.`);
      } else {
        await api.createWorkProgram(payload);
        toast.success(`Program kerja baru "${formName}" berhasil disimpan.`);
      }

      setFormModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan program kerja.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProgram = async () => {
    if (!activeProgram) return;
    try {
      setSaving(true);
      await api.deleteWorkProgram(activeProgram.id);
      toast.success(`Program kerja "${activeProgram.name}" berhasil dihapus.`);
      setDeleteDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus program kerja.');
    } finally {
      setSaving(false);
    }
  };

  // Stats calculation for visual charts on top
  const totalCount = programs.length || 1;
  const terlaksanaCount = programs.filter((p) => p.status === 'Terlaksana').length;
  const berjalanCount = programs.filter((p) => p.status === 'Berjalan').length;
  const belumCount = programs.filter((p) => p.status === 'Belum' || p.status === 'Belum Terlaksana').length;
  const sumProgress = programs.reduce((acc, curr) => acc + curr.progress_pct, 0);
  const avgAchievement = programs.length > 0 ? Math.round(sumProgress / programs.length) : 0;

  const degA = Math.round((terlaksanaCount / totalCount) * 100);
  const degB = degA + Math.round((berjalanCount / totalCount) * 100);

  return (
    <div>
      {/* Page Header */}
      <div className="pagehead">
        <div>
          <div className="eyebrow">{workspace.toUpperCase()} UKM SENIOR · WORKSPACE</div>
          <h1>Program Kerja</h1>
          <p>Rencanakan dan pantau program kerja divisi beserta kegiatan dan capaiannya.</p>
        </div>

        <div className="actions">
          <button type="button" className="btn" onClick={fetchData} title="Muat ulang">
            <RotateCcw size={15} />
            <span>Muat Ulang</span>
          </button>
          {canMutate && (
            <button type="button" className="btn primary" onClick={openCreateModal}>
              <Plus size={16} />
              <span>+ Tambah Data</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Visual Cards: Bar Progress on Left & Donut Status on Right */}
      <div className="grid g21" style={{ marginBottom: 22 }}>
        <div className="card">
          <div className="cardhead" style={{ padding: '0 0 16px' }}>
            <div>
              <h3>Grafik Capaian Program Kerja</h3>
              <div className="sub">
                Rata-rata capaian <b>{avgAchievement}%</b> · {programs.length} program kerja
              </div>
            </div>
          </div>

          <div>
            {programs.length === 0 ? (
              <div className="empty">Belum ada program kerja untuk ditampilkan.</div>
            ) : (
              programs.map((p) => (
                <div key={p.id} className="rowbar">
                  <div>
                    <span className="t" title={p.name}>
                      {p.name}
                    </span>
                    <small style={{ color: 'var(--muted)', display: 'block', fontSize: 11 }}>
                      PIC: {p.pic_name} • Divisi {p.division}
                    </small>
                  </div>
                  <div className="bar">
                    <span style={{ width: `${p.progress_pct}%` }} />
                  </div>
                  <b>{p.progress_pct}%</b>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3>Status Program Kerja</h3>
          <div className="sub">Komposisi seluruh program</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 10 }}>
            <div
              className="donut"
              style={{
                // @ts-ignore
                '--a': `${degA}%`,
                // @ts-ignore
                '--b': `${degB}%`,
              }}
            >
              <span>
                {programs.length}
                <small>PROKER</small>
              </span>
            </div>

            <div className="legend">
              <div>
                <i style={{ background: '#2fa05a' }} />
                <span>Terlaksana: <b>{terlaksanaCount}</b></span>
              </div>
              <div>
                <i style={{ background: 'var(--accent)' }} />
                <span>Berjalan: <b>{berjalanCount}</b></span>
              </div>
              <div>
                <i style={{ background: '#f1e6c8' }} />
                <span>Belum: <b>{belumCount}</b></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card flush">
        {/* Quick Filter Tabs */}
        <div className="filtertabs">
          <button
            type="button"
            className={`filtertab ${statusFilter === '' ? 'active' : ''}`}
            onClick={() => {
              setStatusFilter('');
              setPage(1);
            }}
          >
            <span>Semua status</span>
            <span className="badge-count">{programs.length}</span>
          </button>
          <button
            type="button"
            className={`filtertab ${statusFilter === 'Belum' || statusFilter === 'Belum Terlaksana' ? 'active' : ''}`}
            onClick={() => {
              setStatusFilter('Belum');
              setPage(1);
            }}
          >
            <span>Belum</span>
            <span className="badge-count">{belumCount}</span>
          </button>
          <button
            type="button"
            className={`filtertab ${statusFilter === 'Berjalan' ? 'active' : ''}`}
            onClick={() => {
              setStatusFilter('Berjalan');
              setPage(1);
            }}
          >
            <span>Berjalan</span>
            <span className="badge-count">{berjalanCount}</span>
          </button>
          <button
            type="button"
            className={`filtertab ${statusFilter === 'Terlaksana' ? 'active' : ''}`}
            onClick={() => {
              setStatusFilter('Terlaksana');
              setPage(1);
            }}
          >
            <span>Terlaksana</span>
            <span className="badge-count">{terlaksanaCount}</span>
          </button>
        </div>

        <div className="cardhead" style={{ paddingTop: 14 }}>
          <form onSubmit={handleSearchSubmit} className="toolbar" style={{ flex: 1 }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Cari program kerja, PIC, target..."
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

            {user?.role === 'Super Admin' && (
              <select
                value={divisionFilter}
                onChange={(e) => {
                  setDivisionFilter(e.target.value);
                  setPage(1);
                }}
                aria-label="Filter Divisi"
              >
                <option value="">Semua Divisi Proker</option>
                <option value="Humas">Divisi Humas</option>
                <option value="Pubdok">Divisi Pubdok</option>
              </select>
            )}

            {(search || statusFilter || divisionFilter) && (
              <button
                type="button"
                className="btn sm"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                  setDivisionFilter('');
                  setPage(1);
                }}
              >
                Reset Filter
              </button>
            )}
          </form>
        </div>

        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 44, textAlign: 'center' }}>No</th>
                <th>
                  <button type="button" className="sortlink" onClick={() => handleSort('name')}>
                    <span>Program Kerja</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th>
                  <button type="button" className="sortlink" onClick={() => handleSort('pic_name')}>
                    <span>Penanggung Jawab</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th>Target</th>
                <th>
                  <button type="button" className="sortlink" onClick={() => handleSort('progress_pct')}>
                    <span>Capaian (%)</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th>
                  <button type="button" className="sortlink" onClick={() => handleSort('status')}>
                    <span>Status</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th>Kegiatan</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="empty">
                    Memuat program kerja...
                  </td>
                </tr>
              ) : programs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty">
                    Tidak ditemukan program kerja yang sesuai.
                  </td>
                </tr>
              ) : (
                programs.map((wp, idx) => {
                  return (
                    <tr key={wp.id}>
                      <td style={{ textAlign: 'center', color: 'var(--muted)', fontWeight: 600 }}>
                        {idx + 1}
                      </td>
                      <td className="first">
                        <div style={{ fontWeight: 700 }}>{wp.name}</div>
                        <small style={{ color: 'var(--muted)' }}>Divisi {wp.division}</small>
                      </td>
                      <td>
                        <span className="pill" style={{ fontWeight: 600 }}>
                          {wp.pic_name || 'Koordinator Publikasi & Dokumentasi'}
                        </span>
                      </td>
                      <td style={{ maxWidth: 260, fontSize: 13, color: 'var(--text)' }}>
                        {wp.target_text}
                      </td>
                      <td>
                        <div className="progress-cell">
                          <div className="bar">
                            <span style={{ width: `${wp.progress_pct}%` }} />
                          </div>
                          <b>{wp.progress_pct}%</b>
                        </div>
                      </td>
                      <td>
                        <Badge
                          variant={
                            wp.status === 'Terlaksana'
                              ? 'ok'
                              : wp.status === 'Berjalan'
                              ? 'warn'
                              : 'neutral'
                          }
                        >
                          {wp.status}
                        </Badge>
                      </td>
                      <td style={{ color: 'var(--muted)', fontWeight: 600 }}>
                        0 / 0
                      </td>
                      <td className="act">
                        <button
                          type="button"
                          className="btn sm icon"
                          onClick={() => openDetailModal(wp)}
                          title="Lihat Detail Program Kerja"
                          aria-label="Detail"
                        >
                          <Eye size={14} />
                        </button>

                        {canMutate && (
                          <>
                            <button
                              type="button"
                              className="btn sm icon"
                              onClick={() => openEditModal(wp)}
                              title="Edit Program Kerja"
                              aria-label="Edit"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn sm icon danger"
                              onClick={() => openDeleteModal(wp)}
                              title="Hapus Program Kerja"
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

        {meta && (
          <Pagination
            meta={meta}
            onPageChange={(newPage) => setPage(newPage)}
          />
        )}
      </div>

      {/* Form Modal: Tambah & Edit Program Kerja */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title={activeProgram ? 'Edit Program Kerja' : 'Tambah Program Kerja Baru'}
        maxWidth="600px"
      >
        <form onSubmit={handleSaveProgram}>
          <div className="formgrid">
            <div className="field full">
              <label>Nama Program Kerja</label>
              <input
                type="text"
                placeholder="Contoh: Mengelola media sosial UKM SENIOR PNUP secara berkala"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>Penanggung Jawab (PIC)</label>
              <select value={formPicID} onChange={(e) => setFormPicID(e.target.value)}>
                <option value="">Pilih Pengurus</option>
                {boardMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.position})
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Divisi</label>
              <select
                value={formDivision}
                onChange={(e) => setFormDivision(e.target.value as any)}
                disabled={user?.role !== 'Super Admin'}
              >
                <option value="Humas">Divisi Humas</option>
                <option value="Pubdok">Divisi Pubdok</option>
              </select>
            </div>

            <div className="field full">
              <label>Target Kuantitatif / Kualitatif</label>
              <textarea
                placeholder="Contoh: 98% kegiatan Terdokumentasi di Sosial Media"
                value={formTarget}
                onChange={(e) => setFormTarget(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>Progres Capaian: {formProgress}%</label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={formProgress}
                onChange={(e) => handleProgressChange(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
            </div>

            <div className="field">
              <label>Status Proker</label>
              <select value={formStatus} onChange={(e) => setFormStatus(e.target.value)}>
                <option value="Belum">Belum</option>
                <option value="Berjalan">Berjalan</option>
                <option value="Terlaksana">Terlaksana</option>
              </select>
            </div>
          </div>

          <div className="formfoot">
            <button type="button" className="btn" onClick={() => setFormModalOpen(false)}>
              Batal
            </button>
            <button type="submit" className="btn primary" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Proker'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Detail Program Kerja"
        maxWidth="500px"
      >
        {activeProgram && (
          <div>
            <div style={{ textAlign: 'center', margin: '10px 0 20px' }}>
              <span className="badge neutral" style={{ fontSize: 13, marginBottom: 8 }}>
                Divisi {activeProgram.division}
              </span>
              <h2 style={{ margin: '0 0 6px', fontSize: 20, color: 'var(--text)' }}>
                {activeProgram.name}
              </h2>
              <Badge
                variant={
                  activeProgram.status === 'Terlaksana'
                    ? 'ok'
                    : activeProgram.status === 'Berjalan'
                    ? 'warn'
                    : 'neutral'
                }
              >
                {activeProgram.status}
              </Badge>
            </div>

            <div style={{ display: 'grid', gap: 12, borderTop: '1px solid var(--line)', paddingTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="muted">Penanggung Jawab:</span>
                <b>{activeProgram.pic_name}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="muted">Capaian:</span>
                <b style={{ color: 'var(--accent-ink)', fontSize: 16 }}>{activeProgram.progress_pct}%</b>
              </div>
              <div>
                <span className="muted" style={{ display: 'block', marginBottom: 4 }}>Target Program:</span>
                <div style={{ background: 'var(--bg)', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--line2)' }}>
                  {activeProgram.target_text}
                </div>
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
        onConfirm={handleDeleteProgram}
        message={`Apakah Anda yakin ingin menghapus program kerja "${activeProgram?.name}"?`}
        loading={saving}
      />
    </div>
  );
}
