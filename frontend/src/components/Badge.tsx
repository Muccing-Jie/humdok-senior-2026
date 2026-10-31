'use client';

import React from 'react';

interface BadgeProps {
  status?: string;
  variant?: 'ok' | 'warn' | 'bad' | 'neutral';
  children?: React.ReactNode;
}

export default function Badge({ status, variant, children }: BadgeProps) {
  const content = children !== undefined ? children : status;
  const textStr = String(content || '');
  const s = textStr.toLowerCase();

  let badgeClass = 'badge neutral';
  if (variant) {
    badgeClass = `badge ${variant}`;
  } else if (
    s === 'terlaksana' ||
    s === 'selesai' ||
    s === 'lengkap' ||
    s === 'active' ||
    s === 'tayang' ||
    s === 'terbit' ||
    s === 'tersimpan' ||
    s === 'juara'
  ) {
    badgeClass = 'badge ok';
  } else if (
    s === 'berjalan' ||
    s === 'dalam proses' ||
    s === 'produksi' ||
    s === 'proses upload' ||
    s === 'finalis' ||
    s.includes('belum')
  ) {
    badgeClass = 'badge warn';
  } else if (s === 'inactive' || s === 'batal') {
    badgeClass = 'badge bad';
  }

  return <span className={badgeClass}>{content}</span>;
}
