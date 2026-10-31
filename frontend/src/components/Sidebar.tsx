'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Users2,
  Briefcase,
  CalendarDays,
  CalendarCheck2,
  Share2,
  Image as ImageIcon,
  Trophy,
  History,
  ShieldCheck,
  LogOut,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, workspace, logout } = useAuth();

  const isSuperAdmin = user?.role === 'Super Admin';

  const humasMenus = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/board-members', label: 'Pengurus', icon: Users2 },
    { href: '/work-programs', label: 'Program Kerja', icon: Briefcase },
    { href: '/events', label: 'Kegiatan', icon: CalendarDays },
    { href: '/schedules', label: 'Kalender Kegiatan', icon: CalendarCheck2 },
    { href: '/activity-logs', label: 'Log Aktivitas', icon: History },
    ...(isSuperAdmin ? [{ href: '/users', label: 'Pengguna & Akses', icon: ShieldCheck }] : []),
  ];

  const pubdokMenus = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/work-programs', label: 'Program Kerja', icon: Briefcase },
    { href: '/publications', label: 'Jadwal & Hasil Publikasi', icon: Share2 },
    { href: '/documentations', label: 'Dokumentasi', icon: ImageIcon },
    { href: '/achievements', label: 'Database Prestasi', icon: Trophy },
    { href: '/schedules', label: 'Kalender Kegiatan', icon: CalendarCheck2 },
    { href: '/activity-logs', label: 'Log Aktivitas', icon: History },
    ...(isSuperAdmin ? [{ href: '/users', label: 'Pengguna & Akses', icon: ShieldCheck }] : []),
  ];

  const activeMenus = workspace === 'Humas' ? humasMenus : pubdokMenus;
  const sectionTitle = workspace === 'Humas' ? 'HUMAS MANAGEMENT' : 'PUBDOK MANAGEMENT';

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="brand">
        <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end' }}>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--accent-ink)',
                display: 'none',
              }}
              className="mobile-close-btn"
              aria-label="Tutup menu samping"
            >
              <X size={20} />
            </button>
          )}
        </div>
        <div className="logo" aria-hidden="true">
          SNR
        </div>
        <b>UKM SENIOR PNUP</b>
        <small>HUMAS & PUBDOK 2026</small>
      </div>

      <nav className="nav">
        <h6>{sectionTitle}</h6>
        {activeMenus.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={isActive ? 'active' : ''}
              onClick={() => onClose && onClose()}
            >
              <i>
                <Icon size={17} />
              </i>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="logout-wrap">
        <button type="button" className="logout" onClick={logout} aria-label="Keluar dari akun">
          <i>
            <LogOut size={17} />
          </i>
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}
