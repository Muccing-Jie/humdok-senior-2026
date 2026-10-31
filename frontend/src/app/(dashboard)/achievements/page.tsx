'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/services/api';
import { Achievement, PaginationMeta } from '@/types';
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
  Trophy,
  Medal,
} from 'lucide-react';

const UNITS = ['BASKET', 'BULUTANGKIS', 'MUSIK', 'TARI', 'TENIS MEJA', 'VOLI'];
const CATEGORIES = ['Juara', 'Finalis', 'Partisipasi'];

export default function AchievementsPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();
  const [loading, setLoading] = useState(true);

  // Filters & Sorting & Pagination
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [unitFilter, setUnitFilter] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('DESC');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState('25');

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeAch, setActiveAch] = useState<Achievement | null>(null);

  // Form inputs
  const [formUnit, setFormUnit] = useState('BASKET');
  const [formEventName, setFormEventName] = useState('');
  const [formRankTitle, setFormRankTitle] = useState('-');
  const [formEventDate, setFormEventDate] = useState('22 Agu 2026');
  const [formCategory, setFormCategory] = useState<string>('Partisipasi');
  const [saving, setSaving] = useState(false);

  const canMutate = user?.role === 'Super Admin' || user?.role === 'Divisi Pubdok';

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
      if (categoryFilter) params.result_category = categoryFilter;
      if (unitFilter) params.unit = unitFilter;

      const res = await api.getAchievements(params);
      setAchievements(res.data || []);
      setMeta(res.meta);
    } catch (err: any) {
      toast.error('Gagal mengambil database prestasi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize, sortField, sortDir, categoryFilter, unitFilter]);

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
    setActiveAch(null);
    setFormUnit('BASKET');
    setFormEventName('');
    setFormRankTitle('-');
    setFormEventDate('22 Agu 2026');
    setFormCategory('Partisipasi');
    setFormModalOpen(true);
  };

  const openEditModal = (a: Achievement) => {
    setActiveAch(a);
    setFormUnit(a.unit);
    setFormEventName(a.event_name);
    setFormRankTitle(a.rank_title || '-');
    setFormEventDate(a.event_date);
    setFormCategory(a.result_category);
    setFormModalOpen(true);
  };

  const openDetailModal = (a: Achievement) => {
    setActiveAch(a);
    setDetailModalOpen(true);
  };

  const openDeleteModal = (a: Achievement) => {
    setActiveAch(a);
    setDeleteDialogOpen(true);
  };

  const handleSaveAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEventName.trim()) {
      toast.error('Mohon lengkapi nama event / kejuaraan.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        unit: formUnit,
        event_name: formEventName.trim(),
        rank_title: formRankTitle.trim() || '-',
        event_date: formEventDate.trim() || '—',
        result_category: formCategory,
        period: '2026',
      };

      if (activeAch) {
        await api.updateAchievement(activeAch.id, payload);
        toast.success(`Prestasi "${formEventName}" berhasil diperbarui.`);
      } else {
        await api.createAchievement(payload);
        toast.success(`Prestasi baru "${formEventName}" berhasil disimpan.`);
      }

      setFormModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan prestasi.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAchievement = async () => {
    if (!activeAch) return;
    try {
      setSaving(true);
      await api.deleteAchievement(activeAch.id);
      toast.success(`Data prestasi "${activeAch.event_name}" berhasil dihapus.`);
      setDeleteDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus prestasi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="pagehead">
        <div>
          <div className="eyebrow">PUBDOK MANAGEMENT</div>
          <h1>Database Prestasi</h1>
          <p>
            <b>{meta?.total || 22} data</b> · Rekap prestasi dan partisipasi per unit kegiatan Periode Kepengurusan 2026
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
              <span>+ Tambah Data</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card flush">
        {/* Quick Category Filter Tabs */}
        <div className="filtertabs">
          <button
            type="button"
            className={`filtertab ${categoryFilter === '' ? 'active' : ''}`}
            onClick={() => {
              setCategoryFilter('');
              setPage(1);
            }}
          >
            <span>Semua kategori</span>
            <span className="badge-count">22</span>
          </button>
          <button
            type="button"
            className={`filtertab ${categoryFilter === 'Juara' ? 'active' : ''}`}
            onClick={() => {
              setCategoryFilter('Juara');
              setPage(1);
            }}
          >
            <span>Juara</span>
            <span className="badge-count">3</span>
          </button>
          <button
            type="button"
            className={`filtertab ${categoryFilter === 'Finalis' ? 'active' : ''}`}
            onClick={() => {
              setCategoryFilter('Finalis');
              setPage(1);
            }}
          >
            <span>Finalis</span>
            <span className="badge-count">1</span>
          </button>
          <button
            type="button"
            className={`filtertab ${categoryFilter === 'Partisipasi' ? 'active' : ''}`}
            onClick={() => {
              setCategoryFilter('Partisipasi');
              setPage(1);
            }}
          >
            <span>Partisipasi</span>
            <span className="badge-count">18</span>
          </button>
        </div>

        <div className="cardhead" style={{ paddingTop: 14 }}>
          <form onSubmit={handleSearchSubmit} className="toolbar" style={{ flex: 1 }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Cari event, lomba, unit..."
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
              value={unitFilter}
              onChange={(e) => {
                setUnitFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter Unit"
            >
              <option value="">Semua Unit Kegiatan</option>
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
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
              <option value="10">10 / hal</option>
              <option value="25">25 (Semua)</option>
            </select>

            {(search || unitFilter || categoryFilter) && (
              <button
                type="button"
                className="btn sm"
                onClick={() => {
                  setSearch('');
                  setUnitFilter('');
                  setCategoryFilter('');
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
                  <button type="button" className="sortlink" onClick={() => handleSort('unit')}>
                    <span>Unit Kegiatan</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th>
                  <button type="button" className="sortlink" onClick={() => handleSort('event_name')}>
                    <span>Event / Lomba</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th>
                  <button type="button" className="sortlink" onClick={() => handleSort('rank_title')}>
                    <span>Juara</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th>
                  <button type="button" className="sortlink" onClick={() => handleSort('event_date')}>
                    <span>Tanggal</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th>
                  <button type="button" className="sortlink" onClick={() => handleSort('result_category')}>
                    <span>Kategori Hasil</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="empty">
                    Memuat data prestasi...
                  </td>
                </tr>
              ) : achievements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty">
                    Belum ada data prestasi yang sesuai filter pencarian.
                  </td>
                </tr>
              ) : (
                achievements.map((a, idx) => {
                  const rowNumber = ((page - 1) * parseInt(pageSize, 10)) + idx + 1;
                  return (
                    <tr key={a.id}>
                      <td style={{ textAlign: 'center', color: 'var(--muted)', fontWeight: 600 }}>
                        {rowNumber}
                      </td>
                      <td>
                        <span className="badge neutral" style={{ fontWeight: 800 }}>
                          {a.unit}
                        </span>
                      </td>
                      <td className="first">
                        <div style={{ fontWeight: 700 }}>{a.event_name}</div>
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        {a.rank_title && a.rank_title !== '-' ? (
                          <span style={{ color: 'var(--accent-ink)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <Trophy size={13} color="var(--accent)" />
                            <span>{a.rank_title}</span>
                          </span>
                        ) : (
                          <span style={{ color: 'var(--dim)' }}>-</span>
                        )}
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
                        {a.event_date}
                      </td>
                      <td>
                        <Badge
                          variant={
                            a.result_category === 'Juara'
                              ? 'ok'
                              : a.result_category === 'Finalis'
                              ? 'warn'
                              : 'neutral'
                          }
                        >
                          {a.result_category}
                        </Badge>
                      </td>
                      <td className="act">
                        <button
                          type="button"
                          className="btn sm icon"
                          onClick={() => openDetailModal(a)}
                          title="Lihat Detail Prestasi"
                          aria-label="Detail"
                        >
                          <Eye size={14} />
                        </button>

                        {canMutate && (
                          <>
                            <button
                              type="button"
                              className="btn sm icon"
                              onClick={() => openEditModal(a)}
                              title="Edit Prestasi"
                              aria-label="Edit"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn sm icon danger"
                              onClick={() => openDeleteModal(a)}
                              title="Hapus Prestasi"
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

      {/* Form Modal: Tambah & Edit Prestasi */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title={activeAch ? 'Edit Data Prestasi' : 'Catat Prestasi Baru'}
        maxWidth="540px"
      >
        <form onSubmit={handleSaveAchievement}>
          <div className="formgrid">
            <div className="field">
              <label>Unit Kegiatan</label>
              <select value={formUnit} onChange={(e) => setFormUnit(e.target.value)}>
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Kategori Hasil</label>
              <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)}>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="field full">
              <label>Nama Event / Lomba</label>
              <input
                type="text"
                placeholder="Contoh: Phinisi Basketball Competition"
                value={formEventName}
                onChange={(e) => setFormEventName(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>Juara / Peringkat (opsional)</label>
              <input
                type="text"
                placeholder="Contoh: Juara 3, Finalis, atau -"
                value={formRankTitle}
                onChange={(e) => setFormRankTitle(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Tanggal Pelaksanaan</label>
              <input
                type="text"
                placeholder="Contoh: 22 Agu 2026 atau —"
                value={formEventDate}
                onChange={(e) => setFormEventDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="formfoot">
            <button type="button" className="btn" onClick={() => setFormModalOpen(false)}>
              Batal
            </button>
            <button type="submit" className="btn primary" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Prestasi'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Detail Prestasi Unit Kegiatan"
        maxWidth="480px"
      >
        {activeAch && (
          <div>
            <div style={{ textAlign: 'center', margin: '10px 0 20px' }}>
              <span className="badge neutral" style={{ fontSize: 13, marginBottom: 8 }}>
                Unit {activeAch.unit}
              </span>
              <h2 style={{ margin: '0 0 6px', fontSize: 20, color: 'var(--text)' }}>
                {activeAch.event_name}
              </h2>
              <Badge
                variant={
                  activeAch.result_category === 'Juara'
                    ? 'ok'
                    : activeAch.result_category === 'Finalis'
                    ? 'warn'
                    : 'neutral'
                }
              >
                {activeAch.result_category}
              </Badge>
            </div>

            <div style={{ display: 'grid', gap: 12, borderTop: '1px solid var(--line)', paddingTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="muted">Gelar / Juara:</span>
                <b>{activeAch.rank_title || '-'}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="muted">Tanggal:</span>
                <b>{activeAch.event_date}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="muted">Periode:</span>
                <b>Tahun {activeAch.period}</b>
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
        onConfirm={handleDeleteAchievement}
        message={`Apakah Anda yakin ingin menghapus data prestasi "${activeAch?.event_name}"?`}
        loading={saving}
      />
    </div>
  );
}
