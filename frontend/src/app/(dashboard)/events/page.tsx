'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/services/api';
import { Event, PaginationMeta } from '@/types';
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
  Camera,
  Phone,
} from 'lucide-react';

const UNITS = ['BASKET', 'VOLI', 'BULUTANGKIS', 'MUSIK', 'TARI', 'TENIS MEJA', '—'];
const STATUSES = ['Belum Terlaksana / Belum Dihadiri', 'Terlaksana', 'Batal'];

export default function EventsPage() {
  const { user, workspace } = useAuth();
  const toast = useToast();

  const [events, setEvents] = useState<Event[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();
  const [loading, setLoading] = useState(true);

  // Filters & Sorting & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [unitFilter, setUnitFilter] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('DESC');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState('20');

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);

  // Form inputs
  const [formName, setFormName] = useState('');
  const [formUnit, setFormUnit] = useState('BASKET');
  const [formType, setFormType] = useState('Lomba / Event');
  const [formDate, setFormDate] = useState('20 Nov 2026');
  const [formContact, setFormContact] = useState('—');
  const [formStatus, setFormStatus] = useState<string>('Belum Terlaksana / Belum Dihadiri');
  const [saving, setSaving] = useState(false);

  // Divisi Humas & Super Admin can mutate events. Divisi Pubdok reads events.
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
      if (statusFilter) params.status = statusFilter;
      if (unitFilter) params.unit = unitFilter;

      const res = await api.getEvents(params);
      setEvents(res.data || []);
      setMeta(res.meta);
    } catch (err: any) {
      toast.error('Gagal mengambil data kegiatan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize, sortField, sortDir, statusFilter, unitFilter]);

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
    setActiveEvent(null);
    setFormName('');
    setFormUnit('BASKET');
    setFormType('Lomba / Event');
    setFormDate('—');
    setFormContact('—');
    setFormStatus('Belum Terlaksana / Belum Dihadiri');
    setFormModalOpen(true);
  };

  const openEditModal = (ev: Event) => {
    setActiveEvent(ev);
    setFormName(ev.name);
    setFormUnit(ev.unit);
    setFormType(ev.event_type);
    setFormDate(ev.event_date);
    setFormContact(ev.contact);
    setFormStatus(ev.status);
    setFormModalOpen(true);
  };

  const openDetailModal = (ev: Event) => {
    setActiveEvent(ev);
    setDetailModalOpen(true);
  };

  const openDeleteModal = (ev: Event) => {
    setActiveEvent(ev);
    setDeleteDialogOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Mohon isi nama kegiatan / event.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: formName.trim(),
        unit: formUnit,
        event_type: formType,
        event_date: formDate.trim() || '—',
        contact: formContact.trim() || '—',
        status: formStatus,
        period: '2026',
      };

      if (activeEvent) {
        await api.updateEvent(activeEvent.id, payload);
        toast.success(`Kegiatan "${formName}" berhasil diperbarui.`);
      } else {
        await api.createEvent(payload);
        toast.success(`Kegiatan baru "${formName}" berhasil disimpan.`);
      }

      setFormModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan kegiatan.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!activeEvent) return;
    try {
      setSaving(true);
      await api.deleteEvent(activeEvent.id);
      toast.success(`Kegiatan "${activeEvent.name}" berhasil dihapus.`);
      setDeleteDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus kegiatan.');
    } finally {
      setSaving(false);
    }
  };

  const cleanPhone = (val: string) => val.replace(/\D/g, '');
  const hasPhone = (val: string) => val && val !== '—' && cleanPhone(val).length >= 8;

  return (
    <div>
      {/* Page Header */}
      <div className="pagehead">
        <div>
          <div className="eyebrow">AGENDA & PELAKSANAAN KEGIATAN</div>
          <h1>Daftar Kegiatan</h1>
          <p>
            <b>{meta?.total || 16} data</b> · Periode Kepengurusan 2026 UKM SENIOR PNUP
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
            <span className="badge-count">16</span>
          </button>
          <button
            type="button"
            className={`filtertab ${statusFilter === 'Belum Terlaksana / Belum Dihadiri' ? 'active' : ''}`}
            onClick={() => {
              setStatusFilter('Belum Terlaksana / Belum Dihadiri');
              setPage(1);
            }}
          >
            <span>Belum Terlaksana / Belum Dihadiri</span>
            <span className="badge-count">6</span>
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
            <span className="badge-count">10</span>
          </button>
          <button
            type="button"
            className={`filtertab ${statusFilter === 'Batal' ? 'active' : ''}`}
            onClick={() => {
              setStatusFilter('Batal');
              setPage(1);
            }}
          >
            <span>Batal</span>
            <span className="badge-count">0</span>
          </button>
        </div>

        {/* Toolbar: Search, Filters */}
        <div className="cardhead" style={{ paddingTop: 14 }}>
          <form onSubmit={handleSearchSubmit} className="toolbar" style={{ flex: 1 }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Cari kegiatan, jenis, kontak..."
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
              <option value="20">20 (Semua)</option>
            </select>

            {(search || unitFilter || statusFilter) && (
              <button
                type="button"
                className="btn sm"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                  setUnitFilter('');
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
                    <span>Nama Kegiatan / Event</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th>
                  <button type="button" className="sortlink" onClick={() => handleSort('unit')}>
                    <span>Unit Kegiatan</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th>Jenis</th>
                <th>
                  <button type="button" className="sortlink" onClick={() => handleSort('event_date')}>
                    <span>Tanggal Pelaksanaan</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th>Kontak Panitia</th>
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
                    Memuat data kegiatan...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty">
                    Tidak ditemukan data kegiatan yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                events.map((ev, idx) => {
                  const rowNumber = ((page - 1) * parseInt(pageSize, 10)) + idx + 1;
                  const isContactPhone = hasPhone(ev.contact);
                  return (
                    <tr key={ev.id}>
                      <td style={{ textAlign: 'center', color: 'var(--muted)', fontWeight: 600 }}>
                        {rowNumber}
                      </td>
                      <td className="first">
                        <div style={{ fontWeight: 700 }}>{ev.name}</div>
                        {ev.documentation_count && ev.documentation_count > 0 ? (
                          <small style={{ color: 'var(--green)', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <Camera size={11} /> {ev.documentation_count} Arsip Dokumentasi
                          </small>
                        ) : null}
                      </td>
                      <td>
                        <span className="badge neutral" style={{ fontWeight: 800 }}>
                          {ev.unit}
                        </span>
                      </td>
                      <td>
                        <span className="pill" style={{ fontWeight: 600 }}>
                          {ev.event_type}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{ev.event_date}</td>
                      <td>
                        {isContactPhone ? (
                          <a
                            href={`https://wa.me/62${cleanPhone(ev.contact).replace(/^0/, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="link"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            title="Hubungi Panitia via WhatsApp"
                          >
                            <Phone size={12} />
                            <span>{ev.contact}</span>
                          </a>
                        ) : (
                          <span style={{ color: 'var(--dim)' }}>—</span>
                        )}
                      </td>
                      <td>
                        <Badge
                          variant={
                            ev.status === 'Terlaksana'
                              ? 'ok'
                              : ev.status === 'Batal'
                              ? 'bad'
                              : 'warn'
                          }
                        >
                          {ev.status}
                        </Badge>
                      </td>
                      <td className="act">
                        <button
                          type="button"
                          className="btn sm icon"
                          onClick={() => openDetailModal(ev)}
                          title="Lihat Detail Kegiatan"
                          aria-label="Detail"
                        >
                          <Eye size={14} />
                        </button>

                        {canMutate && (
                          <>
                            <button
                              type="button"
                              className="btn sm icon"
                              onClick={() => openEditModal(ev)}
                              title="Edit Kegiatan"
                              aria-label="Edit"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn sm icon danger"
                              onClick={() => openDeleteModal(ev)}
                              title="Hapus Kegiatan"
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

      {/* Form Modal: Tambah & Edit Kegiatan */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title={activeEvent ? 'Edit Data Kegiatan' : 'Tambah Kegiatan Baru (Humas 2026)'}
        maxWidth="600px"
      >
        <form onSubmit={handleSaveEvent}>
          <div className="formgrid">
            <div className="field full">
              <label>Nama Kegiatan / Event</label>
              <input
                type="text"
                placeholder="Contoh: Phinisi Basketball Competition 2026"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>

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
              <label>Jenis Kegiatan</label>
              <input
                type="text"
                placeholder="Contoh: Lomba / Event, Bazar, Pelantikan"
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>Tanggal Pelaksanaan</label>
              <input
                type="text"
                placeholder="Contoh: 22 Agu 2026 atau —"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>Kontak Panitia / Hotline (WhatsApp)</label>
              <input
                type="text"
                placeholder="Contoh: 0852-4012-0284 atau —"
                value={formContact}
                onChange={(e) => setFormContact(e.target.value)}
              />
            </div>

            <div className="field full">
              <label>Status Pelaksanaan</label>
              <select value={formStatus} onChange={(e) => setFormStatus(e.target.value)}>
                {STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="formfoot">
            <button type="button" className="btn" onClick={() => setFormModalOpen(false)}>
              Batal
            </button>
            <button type="submit" className="btn primary" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Kegiatan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Detail Kegiatan UKM SENIOR"
        maxWidth="500px"
      >
        {activeEvent && (
          <div>
            <div style={{ textAlign: 'center', margin: '10px 0 20px' }}>
              <span className="badge neutral" style={{ fontSize: 13, marginBottom: 8 }}>
                Unit {activeEvent.unit}
              </span>
              <h2 style={{ margin: '0 0 6px', fontSize: 20, color: 'var(--text)' }}>
                {activeEvent.name}
              </h2>
              <Badge
                variant={
                  activeEvent.status === 'Terlaksana'
                    ? 'ok'
                    : activeEvent.status === 'Batal'
                    ? 'bad'
                    : 'warn'
                }
              >
                {activeEvent.status}
              </Badge>
            </div>

            <div style={{ display: 'grid', gap: 12, borderTop: '1px solid var(--line)', paddingTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="muted">Jenis Kegiatan:</span>
                <b>{activeEvent.event_type}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="muted">Tanggal Pelaksanaan:</span>
                <b>{activeEvent.event_date}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="muted">Kontak Panitia:</span>
                {hasPhone(activeEvent.contact) ? (
                  <a
                    href={`https://wa.me/62${cleanPhone(activeEvent.contact).replace(/^0/, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="link"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <Phone size={12} />
                    <span>{activeEvent.contact}</span>
                  </a>
                ) : (
                  <span style={{ color: 'var(--dim)' }}>—</span>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="muted">Arsip Dokumentasi:</span>
                {activeEvent.documentation_count && activeEvent.documentation_count > 0 ? (
                  <Link href={`/documentations?event_id=${activeEvent.id}`} className="link" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Camera size={12} />
                    <span>{activeEvent.documentation_count} Berkas Tersimpan</span>
                  </Link>
                ) : (
                  <span style={{ color: 'var(--dim)' }}>Belum ada dokumentasi</span>
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
        onConfirm={handleDeleteEvent}
        message={
          activeEvent?.documentation_count && activeEvent.documentation_count > 0
            ? `Peringatan: Kegiatan "${activeEvent?.name}" memiliki ${activeEvent.documentation_count} dokumentasi terhubung. Penghapusan akan ditolak sistem (ON DELETE RESTRICT). Hapus dokumentasinya terlebih dahulu di Divisi Pubdok.`
            : `Apakah Anda yakin ingin menghapus kegiatan "${activeEvent?.name}"?`
        }
        loading={saving}
      />
    </div>
  );
}
