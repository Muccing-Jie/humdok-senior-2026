'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Menu, RotateCcw } from 'lucide-react';

interface TopbarProps {
  onToggleSidebar?: () => void;
  onRefresh?: () => void;
}

export default function Topbar({ onToggleSidebar, onRefresh }: TopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, workspace, switchWorkspace } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const isLocked = user?.role === 'Divisi Humas' || user?.role === 'Divisi Pubdok';

  // Menu list for search
  const allRoutes = [
    { label: 'Dashboard', path: '/dashboard', keywords: ['dashboard', 'utama', 'statistik', 'ringkasan'] },
    { label: 'Pengurus', path: '/board-members', keywords: ['pengurus', 'anggota', 'staf', 'bph', 'snr'] },
    { label: 'Program Kerja', path: '/work-programs', keywords: ['program kerja', 'proker', 'capaian', 'target'] },
    { label: 'Kegiatan', path: '/events', keywords: ['kegiatan', 'event', 'acara', 'lomba', 'turnamen'] },
    { label: 'Kalender Kegiatan', path: '/schedules', keywords: ['kalender', 'jadwal', 'time schedule', 'agenda', 'tugas', 'checklist'] },
    { label: 'Jadwal & Hasil Publikasi', path: '/publications', keywords: ['publikasi', 'instagram', 'tiktok', 'konten', 'medsos', 'views'] },
    { label: 'Dokumentasi', path: '/documentations', keywords: ['dokumentasi', 'drive', 'foto', 'video', 'arsip'] },
    { label: 'Database Prestasi', path: '/achievements', keywords: ['prestasi', 'juara', 'lomba', 'piala', 'atlet', 'rekap'] },
    { label: 'Pengguna & Akses', path: '/users', keywords: ['pengguna', 'users', 'akses', 'admin', 'role', 'akun'] },
    { label: 'Log Aktivitas', path: '/activity-logs', keywords: ['log', 'aktivitas', 'riwayat', 'audit', 'histori'] },
  ];

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return;

      const match = allRoutes.find(
        (r) =>
          r.label.toLowerCase().includes(q) ||
          r.keywords.some((k) => k.includes(q))
      );

      if (match) {
        // Check if pubdok only and user is Humas
        if (['/publications', '/documentations', '/achievements'].includes(match.path) && user?.role === 'Divisi Humas') {
          return;
        }
        // Check if users module and user is not Super Admin
        if (match.path === '/users' && user?.role !== 'Super Admin') {
          return;
        }

        router.push(match.path);
        setSearchQuery('');
      }
    }
  };

  const getPageTitle = () => {
    if (pathname.includes('/dashboard')) return 'Dashboard';
    if (pathname.includes('/board-members')) return 'Pengurus Organisasi';
    if (pathname.includes('/work-programs')) return 'Program Kerja';
    if (pathname.includes('/events')) return 'Daftar Kegiatan';
    if (pathname.includes('/schedules')) return 'Kalender & Time Schedule';
    if (pathname.includes('/publications')) return 'Jadwal & Publikasi';
    if (pathname.includes('/documentations')) return 'Dokumentasi & Arsip';
    if (pathname.includes('/achievements')) return 'Database Prestasi';
    if (pathname.includes('/users')) return 'Pengguna & Hak Akses';
    if (pathname.includes('/activity-logs')) return 'Log Aktivitas';
    return 'Manajemen Organisasi';
  };

  const getInitials = (name?: string) => {
    if (!name) return 'SR';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="topbar">
      <button
        type="button"
        className="iconbtn"
        onClick={onToggleSidebar}
        aria-label="Buka menu navigasi"
      >
        <Menu size={18} />
      </button>

      <div className="crumb">
        UKM SENIOR / <b>{getPageTitle()}</b>
      </div>

      <div className="search">
        <input
          type="text"
          placeholder="Cari menu... (Tekan Enter)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          aria-label="Cari menu halaman"
        />
      </div>

      <div className="spacer" />

      {/* Muat Ulang Button */}
      <button
        type="button"
        className="iconbtn"
        onClick={() => {
          if (onRefresh) onRefresh();
          else router.refresh();
        }}
        title="Muat ulang data"
        aria-label="Muat ulang data halaman"
      >
        <RotateCcw size={16} />
      </button>

      {/* Dual Workspace Switcher */}
      <div className={`divswitch ${isLocked ? 'locked' : ''}`} role="group" aria-label="Sakelar Divisi">
        <button
          type="button"
          className={workspace === 'Humas' ? 'on' : ''}
          onClick={() => switchWorkspace('Humas')}
          title={isLocked && user?.role === 'Divisi Pubdok' ? 'Terkunci di Divisi Pubdok' : 'Beralih ke Humas'}
        >
          Humas
        </button>
        <button
          type="button"
          className={workspace === 'Pubdok' ? 'on' : ''}
          onClick={() => switchWorkspace('Pubdok')}
          title={isLocked && user?.role === 'Divisi Humas' ? 'Terkunci di Divisi Humas' : 'Beralih ke Pubdok'}
        >
          Pubdok
        </button>
      </div>

      {/* User profile avatar */}
      <div className="usr">
        <div className="avatar" title={user?.name}>
          {getInitials(user?.name)}
        </div>
        <div>
          <b>{user?.name || 'Administrator'}</b>
          <small>{user?.role || 'Super Admin'}</small>
        </div>
      </div>
    </header>
  );
}
