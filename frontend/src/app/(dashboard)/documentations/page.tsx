'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/services/api';
import { Documentation, Event, PaginationMeta } from '@/types';
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
  FolderArchive,
} from 'lucide-react';

const STATUSES = ['Tersimpan', 'Dalam Proses'];
const FILE_TYPES = ['Foto', 'Video', 'Foto & Video'];

export default function DocumentationsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const searchParams = useSearchParams();
  const prefilteredEventID = searchParams.get('event_id') || '';

  const [documentations, setDocumentations] = useState<Documentation[]>([]);
  const [eventsList, setEventsList] = useState<Event[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();
  const [loading, setLoading] = useState(true);

  // Filters & Sorting & Pagination
  const [search, setSearch] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [eventFilter, setEventFilter] = useState(prefilteredEventID);
  const [sortField, setSortField] = useState('created_at');
  const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('DESC');
  const [page, setPage] = useState(1);

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeDoc, setActiveDoc] = useState<Documentation | null>(null);

  // Form inputs
  const [formTitle, setFormTitle] = useState('');
  const [formEventID, setFormEventID] = useState('');
  const [formFileType, setFormFileType] = useState<string>('Foto');
  const [formDocDate, setFormDocDate] = useState('22 Agu 2026');
  const [formDriveURL, setFormDriveURL] = useState('https://drive.google.com/');
  const [formStatus, setFormStatus] = useState<string>('Tersimpan');
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
      if (fileTypeFilter) params.file_type = fileTypeFilter;
      if (statusFilter) params.status = statusFilter;
      if (eventFilter) params.event_id = eventFilter;

      const res = await api.getDocumentations(params);
      setDocumentations(res.data || []);
      setMeta(res.meta);
    } catch (err: any) {
      toast.error('Gagal memuat dokumentasi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await api.getEvents({ page_size: '100', period: '2026' });
      setEventsList(res.data || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    fetchData();
  }, [page, sortField, sortDir, fileTypeFilter, statusFilter, eventFilter]);

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
    setActiveDoc(null);
    setFormTitle('');
    setFormEventID(eventsList[0]?.id || '');
    setFormFileType('Video');
    setFormDocDate('22 Agu 2026');
    setFormDriveURL('https://drive.google.com/');
    setFormStatus('Tersimpan');
    setFormModalOpen(true);
  };

  const openEditModal = (d: Documentation) => {
    setActiveDoc(d);
    setFormTitle(d.title);
    setFormEventID(d.event_id);
    setFormFileType(d.file_type);
    setFormDocDate(d.doc_date);
    setFormDriveURL(d.drive_url);
    setFormStatus(d.status);
    setFormModalOpen(true);
  };

  const openDetailModal = (d: Documentation) => {
    setActiveDoc(d);
    setDetailModalOpen(true);
  };

  const openDeleteModal = (d: Documentation) => {
    setActiveDoc(d);
    setDeleteDialogOpen(true);
  };

  const handleSaveDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formEventID || !formDriveURL.trim()) {
      toast.error('Mohon lengkapi judul, kegiatan terkait, dan tautan drive.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: formTitle.trim(),
        event_id: formEventID,
        file_type: formFileType,
        doc_date: formDocDate.trim(),
        drive_url: formDriveURL.trim(),
        status: formStatus,
        period: '2026',
      };

      if (activeDoc) {
        await api.updateDocumentation(activeDoc.id, payload);
        toast.success(`Dokumentasi "${formTitle}" berhasil diperbarui.`);
      } else {
        await api.createDocumentation(payload);
        toast.success(`Dokumentasi baru "${formTitle}" berhasil disimpan.`);
      }

      setFormModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan dokumentasi.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDoc = async () => {
    if (!activeDoc) return;
    try {
      setSaving(true);
      await api.deleteDocumentation(activeDoc.id);
      toast.success(`Dokumentasi "${activeDoc.title}" berhasil dihapus.`);
      setDeleteDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus dokumentasi.');
    } finally {
      setSaving(false);
    }
  };

  const getEventName = (eventId: string) => {
    const ev = eventsList.find((e) => e.id === eventId);
    if (!ev) return eventId;
    return `${ev.unit} - ${ev.name}`;
  };

  return (
    <div>
      {/* Page Header */}
      <div className="pagehead">
        <div>
          <div className="eyebrow">PUBDOK UKM SENIOR · WORKSPACE</div>
          <h1>Dokumentasi</h1>
          <p>Arsipkan foto, video, dan file kegiatan.</p>
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
            <span className="badge-count">{documentations.length}</span>
          </button>
          <button
            type="button"
            className={`filtertab ${statusFilter === 'Tersimpan' || statusFilter === 'Lengkap' ? 'active' : ''}`}
            onClick={() => {
              setStatusFilter('Tersimpan');
              setPage(1);
            }}
          >
            <span>Tersimpan</span>
            <span className="badge-count">{documentations.filter((d) => d.status === 'Tersimpan' || d.status === 'Lengkap').length}</span>
          </button>
          <button
            type="button"
            className={`filtertab ${statusFilter === 'Dalam Proses' ? 'active' : ''}`}
            onClick={() => {
              setStatusFilter('Dalam Proses');
              setPage(1);
            }}
          >
            <span>Dalam Proses</span>
            <span className="badge-count">0</span>
          </button>
        </div>

        {/* Toolbar: Search, Filters */}
        <div className="cardhead" style={{ paddingTop: 14 }}>
          <form onSubmit={handleSearchSubmit} className="toolbar" style={{ flex: 1 }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Cari dokumentasi, kegiatan..."
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
              value={fileTypeFilter}
              onChange={(e) => {
                setFileTypeFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter Jenis File"
            >
              <option value="">Semua Jenis File</option>
              {FILE_TYPES.map((ft) => (
                <option key={ft} value={ft}>
                  {ft}
                </option>
              ))}
            </select>

            <select
              value={eventFilter}
              onChange={(e) => {
                setEventFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter Kegiatan Humas"
            >
              <option value="">Semua Kegiatan Terkait</option>
              {eventsList.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.unit} - {ev.name}
                </option>
              ))}
            </select>

            {(search || fileTypeFilter || statusFilter || eventFilter) && (
              <button
                type="button"
                className="btn sm"
                onClick={() => {
                  setSearch('');
                  setFileTypeFilter('');
                  setStatusFilter('');
                  setEventFilter('');
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
                    <span>Judul</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th>Kegiatan (dari Humas)</th>
                <th>
                  <button type="button" className="sortlink" onClick={() => handleSort('file_type')}>
                    <span>Jenis File</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th>
                  <button type="button" className="sortlink" onClick={() => handleSort('doc_date')}>
                    <span>Tanggal</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th>Link Drive</th>
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
                  <td colSpan={8} className="empty">
                    Memuat data arsip dokumentasi...
                  </td>
                </tr>
              ) : documentations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty">
                    Belum ada arsip dokumentasi yang sesuai kriteria.
                  </td>
                </tr>
              ) : (
                documentations.map((d, idx) => (
                  <tr key={d.id}>
                    <td style={{ textAlign: 'center', color: 'var(--muted)', fontWeight: 600 }}>
                      {idx + 1}
                    </td>
                    <td className="first">
                      <div style={{ fontWeight: 700 }}>{d.title}</div>
                    </td>
                    <td>
                      <span className="pill" style={{ fontWeight: 600 }}>
                        {d.event_name ? `${d.event_unit ? d.event_unit + ' - ' : ''}${d.event_name}` : getEventName(d.event_id)}
                      </span>
                    </td>
                    <td>
                      <span className="badge neutral" style={{ fontWeight: 700 }}>
                        {d.file_type}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
                      {d.doc_date}
                    </td>
                    <td>
                      <a
                        href={d.drive_url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', height: 28 }}
                        title="Buka Tautan Google Drive"
                      >
                        <span>Buka</span>
                        <ExternalLink size={12} />
                      </a>
                    </td>
                    <td>
                      <Badge
                        variant={
                          d.status === 'Tersimpan' || d.status === 'Lengkap'
                            ? 'ok'
                            : 'warn'
                        }
                      >
                        {d.status}
                      </Badge>
                    </td>
                    <td className="act">
                      <button
                        type="button"
                        className="btn sm icon"
                        onClick={() => openDetailModal(d)}
                        title="Lihat Detail Dokumentasi"
                        aria-label="Detail"
                      >
                        <Eye size={14} />
                      </button>

                      {canMutate && (
                        <>
                          <button
                            type="button"
                            className="btn sm icon"
                            onClick={() => openEditModal(d)}
                            title="Edit Dokumentasi"
                            aria-label="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn sm icon danger"
                            onClick={() => openDeleteModal(d)}
                            title="Hapus Dokumentasi"
                            aria-label="Hapus"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
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

      {/* Form Modal: Tambah & Edit Dokumentasi */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title={activeDoc ? 'Edit Data Dokumentasi' : 'Tambah Arsip Dokumentasi Baru'}
        maxWidth="560px"
      >
        <form onSubmit={handleSaveDoc}>
          <div className="formgrid">
            <div className="field full">
              <label>Judul Dokumentasi</label>
              <input
                type="text"
                placeholder="Contoh: [Contoh] Dokumentasi Phinisi Basketball"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                required
              />
            </div>

            <div className="field full">
              <label>Pilih Kegiatan (dari Humas) *Foreign Key</label>
              <select value={formEventID} onChange={(e) => setFormEventID(e.target.value)} required>
                <option value="">Pilih Kegiatan Organisasi</option>
                {eventsList.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.unit} - {ev.name} ({ev.event_date})
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Jenis File</label>
              <select value={formFileType} onChange={(e) => setFormFileType(e.target.value)}>
                {FILE_TYPES.map((ft) => (
                  <option key={ft} value={ft}>
                    {ft}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Status</label>
              <select value={formStatus} onChange={(e) => setFormStatus(e.target.value)}>
                {STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Tanggal Pelaksanaan</label>
              <input
                type="text"
                placeholder="Contoh: 22 Agu 2026"
                value={formDocDate}
                onChange={(e) => setFormDocDate(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>Tautan Google Drive Folder</label>
              <input
                type="text"
                placeholder="https://drive.google.com/..."
                value={formDriveURL}
                onChange={(e) => setFormDriveURL(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="formfoot">
            <button type="button" className="btn" onClick={() => setFormModalOpen(false)}>
              Batal
            </button>
            <button type="submit" className="btn primary" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Dokumentasi'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Detail Arsip Dokumentasi"
        maxWidth="500px"
      >
        {activeDoc && (
          <div>
            <div style={{ textAlign: 'center', margin: '10px 0 20px' }}>
              <span className="badge neutral" style={{ fontSize: 13, marginBottom: 8 }}>
                {activeDoc.file_type}
              </span>
              <h2 style={{ margin: '0 0 6px', fontSize: 20, color: 'var(--text)' }}>
                {activeDoc.title}
              </h2>
              <Badge
                variant={
                  activeDoc.status === 'Tersimpan' || activeDoc.status === 'Lengkap'
                    ? 'ok'
                    : 'warn'
                }
              >
                {activeDoc.status}
              </Badge>
            </div>

            <div style={{ display: 'grid', gap: 12, borderTop: '1px solid var(--line)', paddingTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="muted">Kegiatan Terkait:</span>
                <b>{activeDoc.event_name ? `${activeDoc.event_unit} - ${activeDoc.event_name}` : getEventName(activeDoc.event_id)}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="muted">Tanggal:</span>
                <b>{activeDoc.doc_date}</b>
              </div>
              <div>
                <span className="muted" style={{ display: 'block', marginBottom: 4 }}>Tautan Berkas:</span>
                <a
                  href={activeDoc.drive_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn primary sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <ExternalLink size={13} />
                  <span>Buka di Google Drive</span>
                </a>
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
        onConfirm={handleDeleteDoc}
        message={`Apakah Anda yakin ingin menghapus dokumentasi "${activeDoc?.title}"?`}
        loading={saving}
      />
    </div>
  );
}
