'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/services/api';
import { Publication, PaginationMeta } from '@/types';
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
  ExternalLink,
  Share2,
  Heart,
  Eye as ViewIcon,
} from 'lucide-react';

const STATUSES = ['Ide Konten', 'Produksi', 'Terjadwal', 'Terbit'];
const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'Website'];

export default function PublicationsPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [publications, setPublications] = useState<Publication[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();
  const [loading, setLoading] = useState(true);

  // Filters & Sorting & Pagination
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('DESC');
  const [page, setPage] = useState(1);

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activePub, setActivePub] = useState<Publication | null>(null);

  // Form inputs
  const [formTitle, setFormTitle] = useState('');
  const [formPlatform, setFormPlatform] = useState('Instagram');
  const [formPublishDate, setFormPublishDate] = useState('18 Nov 2026');
  const [formURL, setFormURL] = useState('—');
  const [formStatus, setFormStatus] = useState<string>('Ide Konten');
  const [formViews, setFormViews] = useState(0);
  const [formLikes, setFormLikes] = useState(0);
  const [saving, setSaving] = useState(false);

  const canMutate = user?.role === 'Super Admin' || user?.role === 'Divisi Pubdok';

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
      if (platformFilter) params.platform = platformFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await api.getPublications(params);
      setPublications(res.data || []);
      setMeta(res.meta);
    } catch (err: any) {
      toast.error('Gagal memuat data publikasi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, sortField, sortDir, platformFilter, statusFilter]);

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
    setActivePub(null);
    setFormTitle('');
    setFormPlatform('Instagram');
    setFormPublishDate('18 Nov 2026');
    setFormURL('—');
    setFormStatus('Ide Konten');
    setFormViews(0);
    setFormLikes(0);
    setFormModalOpen(true);
  };

  const openEditModal = (p: Publication) => {
    setActivePub(p);
    setFormTitle(p.title);
    setFormPlatform(p.platform);
    setFormPublishDate(p.publish_date);
    setFormURL(p.post_url || '—');
    setFormStatus(p.status);
    setFormViews(p.views);
    setFormLikes(p.likes);
    setFormModalOpen(true);
  };

  const openDetailModal = (p: Publication) => {
    setActivePub(p);
    setDetailModalOpen(true);
  };

  const openDeleteModal = (p: Publication) => {
    setActivePub(p);
    setDeleteDialogOpen(true);
  };

  const handleSavePub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formPublishDate.trim()) {
      toast.error('Mohon lengkapi judul dan tanggal rilis.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: formTitle.trim(),
        platform: formPlatform,
        publish_date: formPublishDate.trim(),
        post_url: formURL.trim() || '—',
        status: formStatus,
        views: Number(formViews) || 0,
        likes: Number(formLikes) || 0,
        period: '2026',
      };

      if (activePub) {
        await api.updatePublication(activePub.id, payload);
        toast.success(`Publikasi "${formTitle}" berhasil diperbarui.`);
      } else {
        await api.createPublication(payload);
        toast.success(`Publikasi baru "${formTitle}" berhasil dijadwalkan.`);
      }

      setFormModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan publikasi.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePub = async () => {
    if (!activePub) return;
    try {
      setSaving(true);
      await api.deletePublication(activePub.id);
      toast.success(`Publikasi "${activePub.title}" berhasil dihapus.`);
      setDeleteDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus publikasi.');
    } finally {
      setSaving(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="pagehead">
        <div>
          <div className="eyebrow">PUBDOK MANAGEMENT</div>
          <h1>Jadwal & Hasil Publikasi</h1>
          <p>Kelola publikasi Instagram dan TikTok beserta performanya.</p>
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
        {/* Quick Status Filter Tabs */}
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
            <span className="badge-count">{publications.length}</span>
          </button>
          <button
            type="button"
            className={`filtertab ${statusFilter === 'Ide Konten' ? 'active' : ''}`}
            onClick={() => {
              setStatusFilter('Ide Konten');
              setPage(1);
            }}
          >
            <span>Ide Konten</span>
            <span className="badge-count">1</span>
          </button>
          <button
            type="button"
            className={`filtertab ${statusFilter === 'Produksi' ? 'active' : ''}`}
            onClick={() => {
              setStatusFilter('Produksi');
              setPage(1);
            }}
          >
            <span>Produksi</span>
            <span className="badge-count">1</span>
          </button>
          <button
            type="button"
            className={`filtertab ${statusFilter === 'Terjadwal' ? 'active' : ''}`}
            onClick={() => {
              setStatusFilter('Terjadwal');
              setPage(1);
            }}
          >
            <span>Terjadwal</span>
            <span className="badge-count">0</span>
          </button>
          <button
            type="button"
            className={`filtertab ${statusFilter === 'Terbit' || statusFilter === 'Tayang' ? 'active' : ''}`}
            onClick={() => {
              setStatusFilter('Terbit');
              setPage(1);
            }}
          >
            <span>Terbit</span>
            <span className="badge-count">2</span>
          </button>
        </div>

        {/* Toolbar: Search, Filters */}
        <div className="cardhead" style={{ paddingTop: 14 }}>
          <form onSubmit={handleSearchSubmit} className="toolbar" style={{ flex: 1 }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Cari judul konten atau platform..."
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
              value={platformFilter}
              onChange={(e) => {
                setPlatformFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter Platform"
            >
              <option value="">Semua Platform</option>
              {PLATFORMS.map((pl) => (
                <option key={pl} value={pl}>
                  {pl}
                </option>
              ))}
            </select>

            {(search || platformFilter || statusFilter) && (
              <button
                type="button"
                className="btn sm"
                onClick={() => {
                  setSearch('');
                  setPlatformFilter('');
                  setStatusFilter('');
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
                  <button type="button" className="sortlink" onClick={() => handleSort('title')}>
                    <span>Judul Konten</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th>
                  <button type="button" className="sortlink" onClick={() => handleSort('platform')}>
                    <span>Platform</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th>
                  <button type="button" className="sortlink" onClick={() => handleSort('publish_date')}>
                    <span>Tanggal Tayang</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th>URL Postingan</th>
                <th>
                  <button type="button" className="sortlink" onClick={() => handleSort('status')}>
                    <span>Status</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th style={{ textAlign: 'right' }}>
                  <button type="button" className="sortlink" onClick={() => handleSort('views')}>
                    <span>Views</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th style={{ textAlign: 'right' }}>
                  <button type="button" className="sortlink" onClick={() => handleSort('likes')}>
                    <span>Likes</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="empty">
                    Memuat data jadwal publikasi...
                  </td>
                </tr>
              ) : publications.length === 0 ? (
                <tr>
                  <td colSpan={9} className="empty">
                    Tidak ditemukan data publikasi yang sesuai.
                  </td>
                </tr>
              ) : (
                publications.map((p, idx) => {
                  const hasLink = p.post_url && p.post_url !== '—' && p.post_url.startsWith('http');
                  return (
                    <tr key={p.id}>
                      <td style={{ textAlign: 'center', color: 'var(--muted)', fontWeight: 600 }}>
                        {idx + 1}
                      </td>
                      <td className="first">
                        <div style={{ fontWeight: 700 }}>{p.title}</div>
                      </td>
                      <td>
                        <span className="pill" style={{ fontWeight: 800 }}>
                          {p.platform}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
                        {p.publish_date}
                      </td>
                      <td>
                        {hasLink ? (
                          <a
                            href={p.post_url}
                            target="_blank"
                            rel="noreferrer"
                            className="link"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <span>Buka Konten</span>
                            <ExternalLink size={12} />
                          </a>
                        ) : (
                          <span style={{ color: 'var(--dim)' }}>—</span>
                        )}
                      </td>
                      <td>
                        <Badge
                          variant={
                            p.status === 'Terbit' || p.status === 'Tayang'
                              ? 'ok'
                              : p.status === 'Produksi'
                              ? 'warn'
                              : 'neutral'
                          }
                        >
                          {p.status}
                        </Badge>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>
                        {p.views > 0 ? (
                          <span style={{ color: 'var(--accent-ink)' }}>{formatNumber(p.views)}</span>
                        ) : (
                          <span style={{ color: 'var(--dim)' }}>0</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>
                        {p.likes > 0 ? (
                          <span style={{ color: 'var(--red)' }}>{formatNumber(p.likes)}</span>
                        ) : (
                          <span style={{ color: 'var(--dim)' }}>0</span>
                        )}
                      </td>
                      <td className="act">
                        <button
                          type="button"
                          className="btn sm icon"
                          onClick={() => openDetailModal(p)}
                          title="Lihat Detail Publikasi"
                          aria-label="Detail"
                        >
                          <Eye size={14} />
                        </button>

                        {canMutate && (
                          <>
                            <button
                              type="button"
                              className="btn sm icon"
                              onClick={() => openEditModal(p)}
                              title="Edit Publikasi"
                              aria-label="Edit"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn sm icon danger"
                              onClick={() => openDeleteModal(p)}
                              title="Hapus Publikasi"
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

      {/* Form Modal: Tambah & Edit Publikasi */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title={activePub ? 'Edit Data Publikasi' : 'Jadwalkan Publikasi Baru'}
        maxWidth="560px"
      >
        <form onSubmit={handleSavePub}>
          <div className="formgrid">
            <div className="field full">
              <label>Judul Konten</label>
              <input
                type="text"
                placeholder="Contoh: [Contoh] Teaser Bazar Kampus"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>Platform Media</label>
              <select value={formPlatform} onChange={(e) => setFormPlatform(e.target.value)}>
                {PLATFORMS.map((pl) => (
                  <option key={pl} value={pl}>
                    {pl}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Status Publikasi</label>
              <select value={formStatus} onChange={(e) => setFormStatus(e.target.value)}>
                {STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Tanggal Tayang</label>
              <input
                type="text"
                placeholder="Contoh: 18 Nov 2026"
                value={formPublishDate}
                onChange={(e) => setFormPublishDate(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>Tautan URL Postingan (opsional)</label>
              <input
                type="text"
                placeholder="https://tiktok.com/@seniormedia atau —"
                value={formURL}
                onChange={(e) => setFormURL(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Views / Impresi</label>
              <input
                type="number"
                min="0"
                value={formViews}
                onChange={(e) => setFormViews(Number(e.target.value))}
              />
            </div>

            <div className="field">
              <label>Likes / Reaksi</label>
              <input
                type="number"
                min="0"
                value={formLikes}
                onChange={(e) => setFormLikes(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="formfoot">
            <button type="button" className="btn" onClick={() => setFormModalOpen(false)}>
              Batal
            </button>
            <button type="submit" className="btn primary" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Publikasi'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Detail Hasil Publikasi"
        maxWidth="500px"
      >
        {activePub && (
          <div>
            <div style={{ textAlign: 'center', margin: '10px 0 20px' }}>
              <span className="badge neutral" style={{ fontSize: 13, marginBottom: 8 }}>
                {activePub.platform}
              </span>
              <h2 style={{ margin: '0 0 6px', fontSize: 20, color: 'var(--text)' }}>
                {activePub.title}
              </h2>
              <Badge
                variant={
                  activePub.status === 'Terbit' || activePub.status === 'Tayang'
                    ? 'ok'
                    : activePub.status === 'Produksi'
                    ? 'warn'
                    : 'neutral'
                }
              >
                {activePub.status}
              </Badge>
            </div>

            <div style={{ display: 'grid', gap: 12, borderTop: '1px solid var(--line)', paddingTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="muted">Tanggal Tayang:</span>
                <b>{activePub.publish_date}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="muted">Total Views:</span>
                <b style={{ color: 'var(--accent-ink)' }}>{formatNumber(activePub.views)} tayangan</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="muted">Total Likes:</span>
                <b style={{ color: 'var(--red)' }}>{formatNumber(activePub.likes)} suka</b>
              </div>
              <div>
                <span className="muted" style={{ display: 'block', marginBottom: 4 }}>URL Postingan:</span>
                {activePub.post_url && activePub.post_url.startsWith('http') ? (
                  <a
                    href={activePub.post_url}
                    target="_blank"
                    rel="noreferrer"
                    className="link"
                    style={{ wordBreak: 'break-all' }}
                  >
                    {activePub.post_url}
                  </a>
                ) : (
                  <span style={{ color: 'var(--dim)' }}>— (Belum dirilis)</span>
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
        onConfirm={handleDeletePub}
        message={`Apakah Anda yakin ingin menghapus jadwal publikasi "${activePub?.title}"?`}
        loading={saving}
      />
    </div>
  );
}
