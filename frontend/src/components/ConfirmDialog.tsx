'use client';

import React from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi Penghapusan',
  message,
  confirmLabel = 'Ya, Hapus Data',
  cancelLabel = 'Batalkan',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="460px">
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', margin: '10px 0 20px' }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: 'var(--accent-d)',
            color: 'var(--red)',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <AlertTriangle size={24} />
        </div>
        <div>
          <p style={{ margin: '0 0 6px', fontWeight: 600, color: 'var(--text)' }}>
            {message}
          </p>
          <small style={{ color: 'var(--muted)' }}>
            Tindakan ini tidak dapat dibatalkan. Riwayat penghapusan akan secara otomatis dicatat dalam log aktivitas sistem.
          </small>
        </div>
      </div>

      <div className="formfoot">
        <button type="button" className="btn" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </button>
        <button
          type="button"
          className="btn primary danger"
          style={{ background: 'var(--red)', color: '#fff' }}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? 'Menghapus...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
