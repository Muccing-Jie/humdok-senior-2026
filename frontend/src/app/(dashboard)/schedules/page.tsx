'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/services/api';
import { Schedule, BoardMember, PaginationMeta } from '@/types';
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
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export default function SchedulesPage() {
  const { user, workspace } = useAuth();
  const toast = useToast();

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();
  const [loading, setLoading] = useState(true);

  // Month navigation for visual calendar (Default: January 2026)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(0); // 0 = Januari, 11 = Desember

  // Filter & Search & Pagination
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeSchedule, setActiveSchedule] = useState<Schedule | null>(null);

  // Form inputs
  const [formTitle, setFormTitle] = useState('');
  const [formPicID, setFormPicID] = useState('');
  const [formStage, setFormStage] = useState('');
  const [formDeadline, setFormDeadline] = useState('2026-01-15');
  const [formCategory, setFormCategory] = useState<string>('tugas');
  const [formDivision, setFormDivision] = useState<string>(workspace === 'Humas' ? 'Humas' : 'Pubdok');
  const [formIsDone, setFormIsDone] = useState(false);
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
        page_size: '10',
        period: '2026',
      };
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status = statusFilter;
      if (user?.role !== 'Super Admin') params.division = workspace;

      const res = await api.getSchedules(params);
      setSchedules(res.data || []);
      setMeta(res.meta);
    } catch (err: any) {
      toast.error('Gagal mengambil jadwal: ' + err.message);
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
  }, [page, categoryFilter, statusFilter, workspace]);

  const handleToggle = async (scheduleId: string) => {
    try {
      const res = await api.toggleSchedule(scheduleId);
      toast.success(res.message || 'Status tugas diperbarui.');
      // Update local state immediately
      setSchedules((prev) =>
        prev.map((s) =>
          s.id === scheduleId
            ? {
                ...s,
                is_done: res.data?.is_done ?? !s.is_done,
                status: res.data?.status ?? (s.is_done ? 'Dalam Proses' : 'Selesai'),
              }
            : s
        )
      );
    } catch (err: any) {
      toast.error('Gagal memperbarui status checklist: ' + err.message);
    }
  };

  const openCreateModal = () => {
    setActiveSchedule(null);
    setFormTitle('');
    setFormPicID(boardMembers[0]?.id || '');
    setFormStage('Tahap Awal');
    setFormDeadline(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-15`);
    setFormCategory(workspace === 'Pubdok' ? 'publikasi' : 'rapat');
    setFormDivision(workspace === 'Humas' ? 'Humas' : 'Pubdok');
    setFormIsDone(false);
    setFormModalOpen(true);
  };

  const openEditModal = (s: Schedule) => {
    setActiveSchedule(s);
    setFormTitle(s.title);
    setFormPicID(s.pic_id || '');
    setFormStage(s.stage);
    setFormDeadline(s.deadline_date);
    setFormCategory(s.category);
    setFormDivision(s.division);
    setFormIsDone(s.is_done);
    setFormModalOpen(true);
  };

  const openDetailModal = (s: Schedule) => {
    setActiveSchedule(s);
    setDetailModalOpen(true);
  };

  const openDeleteModal = (s: Schedule) => {
    setActiveSchedule(s);
    setDeleteDialogOpen(true);
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formStage || !formDeadline) {
      toast.error('Mohon lengkapi seluruh formulir jadwal.');
      return;
    }

    try {
      setSaving(true);
      const selectedMember = boardMembers.find((m) => m.id === formPicID);
      const payload = {
        title: formTitle,
        pic_id: formPicID || null,
        pic_name: selectedMember?.name || '',
        stage: formStage,
        deadline_date: formDeadline,
        is_done: formIsDone,
        status: formIsDone ? 'Selesai' : 'Belum Dimulai',
        category: formCategory,
        division: formDivision,
        period: '2026',
      };

      if (activeSchedule) {
        await api.updateSchedule(activeSchedule.id, payload);
        toast.success(`Jadwal "${formTitle}" berhasil diperbarui.`);
      } else {
        await api.createSchedule(payload);
        toast.success(`Jadwal baru "${formTitle}" berhasil disimpan.`);
      }

      setFormModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan jadwal.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSchedule = async () => {
    if (!activeSchedule) return;
    try {
      setSaving(true);
      await api.deleteSchedule(activeSchedule.id);
      toast.success(`Jadwal "${activeSchedule.title}" berhasil dihapus.`);
      setDeleteDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus jadwal.');
    } finally {
      setSaving(false);
    }
  };

  // Calendar days generation
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun, 1 = Mon

  const calendarDays = [];
  // Empty offset days
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push({ dayNumber: null, isOut: true });
  }
  // Month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayEvents = schedules.filter((s) => s.deadline_date === dateStr);
    calendarDays.push({ dayNumber: d, dateStr, dayEvents, isOut: false });
  }

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Progress ring stats
  const totalTasks = schedules.length || 1;
  const completedTasks = schedules.filter((s) => s.is_done).length;
  const completionPercentage = Math.round((completedTasks / totalTasks) * 100);

  return (
    <div>
      {/* Page Header */}
      <div className="pagehead">
        <div>
          <div className="eyebrow">AGENDA & CHECKLIST KERJA</div>
          <h1>Kalender Kegiatan & Time Schedule</h1>
          <p>Pantau tenggat waktu, checklist tugas harian, dan matriks agenda divisi {workspace}.</p>
        </div>

        <div className="actions">
          <button type="button" className="btn" onClick={fetchData} title="Muat ulang">
            <RotateCcw size={15} />
            <span>Muat Ulang</span>
          </button>
          {canMutate && (
            <button type="button" className="btn primary" onClick={openCreateModal}>
              <Plus size={16} />
              <span>+ Tambah Agenda</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Ring Card & Calendar Header */}
      <div className="card" style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div className="ringbox">
            <div
              className="ring"
              style={{
                // @ts-ignore
                '--p': `${completionPercentage}`,
              }}
            >
              <span>{completionPercentage}%</span>
            </div>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: 18 }}>Progres Time Schedule</h3>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>
                <b>{completedTasks}</b> dari <b>{schedules.length}</b> agenda telah diselesaikan pada divisi {workspace}.
              </p>
            </div>
          </div>

          {/* Month Switcher Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button type="button" className="btn sm icon" onClick={prevMonth} aria-label="Bulan sebelumnya">
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontWeight: 800, fontSize: 16, minWidth: 150, textAlign: 'center' }}>
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button type="button" className="btn sm icon" onClick={nextMonth} aria-label="Bulan berikutnya">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Visual Monthly Calendar Grid */}
        <div className="cal" style={{ marginTop: 20 }}>
          <div className="h">MIN</div>
          <div className="h">SEN</div>
          <div className="h">SEL</div>
          <div className="h">RAB</div>
          <div className="h">KAM</div>
          <div className="h">JUM</div>
          <div className="h">SAB</div>

          {calendarDays.map((item, idx) => (
            <div
              key={idx}
              className={`d ${item.isOut ? 'out' : ''}`}
            >
              {item.dayNumber && (
                <>
                  <b style={{ color: 'var(--muted)', fontSize: 11 }}>{item.dayNumber}</b>
                  {item.dayEvents?.map((ev) => (
                    <span
                      key={ev.id}
                      className={`ev ${ev.category} ${ev.is_done ? 'done' : ''}`}
                      title={`${ev.title} (${ev.stage})`}
                      onClick={() => openDetailModal(ev)}
                    >
                      {ev.title}
                    </span>
                  ))}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Checklist Table */}
      <div className="card flush">
        <div className="cardhead">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              fetchData();
            }}
            className="toolbar"
            style={{ flex: 1 }}
          >
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Cari tugas, PIC, tahap..."
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
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter Kategori"
            >
              <option value="">Semua Kategori</option>
              <option value="rapat">Rapat Koordinasi</option>
              <option value="publikasi">Publikasi</option>
              <option value="tugas">Tugas Internal</option>
              <option value="kegiatan">Kegiatan Lapangan</option>
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
              <option value="Selesai">Selesai</option>
              <option value="Dalam Proses">Dalam Proses</option>
              <option value="Belum Dimulai">Belum Dimulai</option>
            </select>
          </form>
        </div>

        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 44, textAlign: 'center' }}>Selesai</th>
                <th>Nama Agenda / Tugas</th>
                <th>PIC</th>
                <th>Tahap Pengerjaan</th>
                <th>Batas Waktu</th>
                <th>Kategori</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="empty">
                    Memuat data jadwal...
                  </td>
                </tr>
              ) : schedules.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty">
                    Tidak ditemukan agenda tugas.
                  </td>
                </tr>
              ) : (
                schedules.map((s) => (
                  <tr key={s.id} className={s.is_done ? 'done' : ''}>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        className="tick"
                        checked={s.is_done}
                        onChange={() => handleToggle(s.id)}
                        aria-label={`Centang tugas ${s.title}`}
                      />
                    </td>
                    <td className="first">
                      <div>{s.title}</div>
                      <small style={{ color: 'var(--muted)' }}>Divisi {s.division}</small>
                    </td>
                    <td><b>{s.pic_name || '-'}</b></td>
                    <td>{s.stage}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={13} color="var(--dim)" />
                        {s.deadline_date}
                      </span>
                    </td>
                    <td>
                      <span className={`ev ${s.category}`} style={{ display: 'inline-block' }}>
                        {s.category.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <Badge status={s.status} />
                    </td>
                    <td className="act">
                      <button
                        type="button"
                        className="btn sm icon"
                        title="Detail"
                        onClick={() => openDetailModal(s)}
                        aria-label={`Detail ${s.title}`}
                      >
                        <Eye size={14} />
                      </button>
                      {canMutate && (
                        <>
                          <button
                            type="button"
                            className="btn sm icon"
                            title="Edit"
                            onClick={() => openEditModal(s)}
                            aria-label={`Edit ${s.title}`}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn sm icon danger"
                            title="Hapus"
                            onClick={() => openDeleteModal(s)}
                            aria-label={`Hapus ${s.title}`}
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

        <Pagination meta={meta} onPageChange={(p) => setPage(p)} />
      </div>

      {/* Form Modal (Create / Edit) */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title={activeSchedule ? 'Edit Agenda Tugas' : 'Tambah Agenda / Time Schedule'}
      >
        <form onSubmit={handleSaveSchedule}>
          <div className="formgrid">
            <div className="field full">
              <label>Judul Agenda / Tugas</label>
              <input
                type="text"
                placeholder="Contoh: FEED Pelantikan & Raker"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
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
              <label>Tahap Pengerjaan</label>
              <input
                type="text"
                placeholder="Contoh: Desain Visual / Publikasi"
                value={formStage}
                onChange={(e) => setFormStage(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>Batas Waktu (Deadline)</label>
              <input
                type="date"
                value={formDeadline}
                onChange={(e) => setFormDeadline(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>Kategori</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as any)}
              >
                <option value="rapat">Rapat Koordinasi</option>
                <option value="publikasi">Publikasi Konten</option>
                <option value="tugas">Tugas Internal</option>
                <option value="kegiatan">Kegiatan Lapangan</option>
              </select>
            </div>

            <div className="field">
              <label>Divisi</label>
              <select
                value={formDivision}
                onChange={(e) => setFormDivision(e.target.value as any)}
              >
                <option value="Humas">Divisi Humas</option>
                <option value="Pubdok">Divisi Pubdok</option>
              </select>
            </div>

            <div className="field" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 24 }}>
              <input
                type="checkbox"
                id="doneCheck"
                checked={formIsDone}
                onChange={(e) => setFormIsDone(e.target.checked)}
                style={{ width: 20, height: 20 }}
              />
              <label htmlFor="doneCheck" style={{ margin: 0, cursor: 'pointer' }}>
                Tandai Sudah Selesai
              </label>
            </div>
          </div>

          <div className="formfoot">
            <button type="button" className="btn" onClick={() => setFormModalOpen(false)}>
              Batal
            </button>
            <button type="submit" className="btn primary" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Agenda'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Detail Agenda & Time Schedule"
        maxWidth="500px"
      >
        {activeSchedule && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <span className={`ev ${activeSchedule.category}`} style={{ display: 'inline-block', marginBottom: 8 }}>
                {activeSchedule.category.toUpperCase()}
              </span>
              <h2 style={{ margin: '4px 0 8px', fontSize: 20 }}>{activeSchedule.title}</h2>
              <Badge status={activeSchedule.status} />
            </div>

            <div style={{ display: 'grid', gap: 12, borderTop: '1px solid var(--line)', paddingTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">PIC:</span>
                <b>{activeSchedule.pic_name || 'Belum Ditentukan'}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Tahap:</span>
                <b>{activeSchedule.stage}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Batas Waktu:</span>
                <b>{activeSchedule.deadline_date}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Divisi:</span>
                <b>{activeSchedule.division}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Status Selesai:</span>
                <b>{activeSchedule.is_done ? 'Sudah Selesai' : 'Belum Selesai'}</b>
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
        onConfirm={handleDeleteSchedule}
        message={`Apakah Anda yakin ingin menghapus agenda "${activeSchedule?.title}"?`}
        loading={saving}
      />
    </div>
  );
}
