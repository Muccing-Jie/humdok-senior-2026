'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/services/api';
import { ActivityLog, PaginationMeta } from '@/types';
import Modal from '@/components/Modal';
import Pagination from '@/components/Pagination';
import {
  RotateCcw,
  Search,
  Eye,
  History,
  ShieldAlert,
  Clock,
  Layers,
} from 'lucide-react';

export default function ActivityLogsPage() {
  const { user, workspace } = useAuth();
  const toast = useToast();

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();
  const [loading, setLoading] = useState(true);

  // Filters & Search & Pagination
  const [search, setSearch] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('');
  const [tableFilter, setTableFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);

  // Detail Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [activeLog, setActiveLog] = useState<ActivityLog | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {
        page: page.toString(),
        page_size: '12',
      };
      if (search) params.search = search;
      if (divisionFilter) params.division = divisionFilter;
      else if (user?.role !== 'Super Admin') params.division = workspace;
      if (tableFilter) params.table_name = tableFilter;
      if (actionFilter) params.action_type = actionFilter;

      const res = await api.getActivityLogs(params);
      setLogs(res.data || []);
      setMeta(res.meta);
    } catch (err: any) {
      toast.error('Gagal memuat log aktivitas: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, divisionFilter, tableFilter, actionFilter, workspace]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const openDetail = (l: ActivityLog) => {
    setActiveLog(l);
    setDetailModalOpen(true);
  };

  const formatWITA = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Makassar',
      }).format(d) + ' WITA';
    } catch {
      return isoStr;
    }
  };

  const getActionBadgeClass = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'badge ok';
      case 'UPDATE':
      case 'TOGGLE':
        return 'badge warn';
      case 'DELETE':
        return 'badge bad';
      case 'LOGIN':
      case 'LOGOUT':
        return 'badge neutral';
      default:
        return 'badge neutral';
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="pagehead">
        <div>
          <div className="eyebrow">AUDIT & KEAMANAN SISTEM</div>
          <h1>Log Aktivitas Sistem</h1>
          <p>
            Rekam jejak otomatis perubahan data, penambahan, pembaruan, dan penghapusan (Append-Only Audit Trail).
          </p>
        </div>

        <div className="actions">
          <button type="button" className="btn" onClick={fetchData} title="Muat ulang">
            <RotateCcw size={15} />
            <span>Muat Ulang</span>
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
                placeholder="Cari user, keterangan, tabel..."
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
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter Aktivitas"
            >
              <option value="">Semua Tindakan</option>
              <option value="CREATE">CREATE (Tambah)</option>
              <option value="UPDATE">UPDATE (Ubah)</option>
              <option value="DELETE">DELETE (Hapus)</option>
              <option value="TOGGLE">TOGGLE (Centang Selesai)</option>
              <option value="LOGIN">LOGIN</option>
              <option value="LOGOUT">LOGOUT</option>
            </select>

            <select
              value={tableFilter}
              onChange={(e) => {
                setTableFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter Tabel"
            >
              <option value="">Semua Modul Tabel</option>
              <option value="board_members">Pengurus (board_members)</option>
              <option value="work_programs">Program Kerja (work_programs)</option>
              <option value="events">Kegiatan (events)</option>
              <option value="schedules">Jadwal (schedules)</option>
              <option value="publications">Publikasi (publications)</option>
              <option value="documentations">Dokumentasi (documentations)</option>
              <option value="achievements">Prestasi (achievements)</option>
              <option value="users">Pengguna (users)</option>
            </select>

            {user?.role === 'Super Admin' && (
              <select
                value={divisionFilter}
                onChange={(e) => {
                  setDivisionFilter(e.target.value);
                  setPage(1);
                }}
                aria-label="Filter Divisi"
              >
                <option value="">Semua Divisi</option>
                <option value="Humas">Humas</option>
                <option value="Pubdok">Pubdok</option>
                <option value="Global">Global</option>
              </select>
            )}
          </form>
        </div>

        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Waktu Kejadian (WITA)</th>
                <th>Pengguna Pelaku</th>
                <th>Aktivitas</th>
                <th>Tabel Target</th>
                <th>ID Data</th>
                <th>Keterangan Perubahan</th>
                <th>Divisi</th>
                <th style={{ textAlign: 'right' }}>Detail</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="empty">
                    Memuat riwayat log aktivitas...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty">
                    Tidak ditemukan catatan aktivitas.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={13} color="var(--dim)" />
                        {formatWITA(l.created_at)}
                      </span>
                    </td>
                    <td className="first">
                      <div>{l.user_name}</div>
                    </td>
                    <td>
                      <span className={getActionBadgeClass(l.action_type)}>
                        {l.action_type}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{l.table_name}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--muted)', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {l.data_id}
                    </td>
                    <td style={{ maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {l.description}
                    </td>
                    <td>
                      <span className="badge neutral">{l.division}</span>
                    </td>
                    <td className="act">
                      <button
                        type="button"
                        className="btn sm icon"
                        title="Lihat Detail Log"
                        onClick={() => openDetail(l)}
                        aria-label="Detail Log"
                      >
                        <Eye size={14} />
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

      {/* Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Detail Audit Log Aktivitas"
        maxWidth="540px"
      >
        {activeLog && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <span className={getActionBadgeClass(activeLog.action_type)} style={{ marginBottom: 6 }}>
                Aksi: {activeLog.action_type}
              </span>
              <h2 style={{ margin: '4px 0 8px', fontSize: 18 }}>{activeLog.description}</h2>
              <small style={{ color: 'var(--muted)' }}>Log ID: {activeLog.id}</small>
            </div>

            <div style={{ display: 'grid', gap: 12, borderTop: '1px solid var(--line)', paddingTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Waktu Transaksi:</span>
                <b>{formatWITA(activeLog.created_at)}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Pelaku Aksi:</span>
                <b>{activeLog.user_name}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Tabel Basis Data:</span>
                <b style={{ fontFamily: 'monospace' }}>{activeLog.table_name}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">ID Entitas Data:</span>
                <b style={{ fontFamily: 'monospace' }}>{activeLog.data_id}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Ruang Lingkup Divisi:</span>
                <b>Divisi {activeLog.division}</b>
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
    </div>
  );
}
