'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Email dan kata sandi wajib diisi.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      await login(email, password);
      toast.success('Selamat datang di sistem Humas & Pubdok Management!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Kombinasi email atau kata sandi tidak valid.');
      toast.error(err.message || 'Gagal masuk.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg('');
  };

  return (
    <div className="loginwrap">
      <div className="logincard">
        <div className="brand">
          <div className="logo" aria-hidden="true">
            SNR
          </div>
          <div>
            <b style={{ fontSize: 18 }}>UKM SENIOR PNUP</b>
            <small style={{ color: 'var(--muted)', fontWeight: 700 }}>HUMAS & PUBDOK 2026</small>
          </div>
        </div>

        <h1>Masuk Sistem</h1>
        <p style={{ margin: '0 0 16px', color: 'var(--muted)', fontSize: 13 }}>
          Silakan masukkan kredensial akun kepengurusan Anda untuk mengakses workspace.
        </p>

        {errorMsg && (
          <div
            style={{
              background: '#fff0f2',
              color: 'var(--red)',
              padding: '10px 14px',
              borderRadius: 12,
              marginBottom: 14,
              fontSize: 12.5,
              fontWeight: 600,
              border: '1px solid #ffd6dc',
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email Pengurus</label>
            <div style={{ position: 'relative' }}>
              <input
                id="email"
                type="email"
                placeholder="nama@humdok.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ paddingLeft: 40 }}
              />
              <Mail
                size={16}
                color="var(--dim)"
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="password">Kata Sandi</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingLeft: 40 }}
              />
              <Lock
                size={16}
                color="var(--dim)"
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          <button type="submit" className="btn primary" disabled={loading}>
            {loading ? 'Memproses Masuk...' : 'Masuk ke Dashboard'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        {/* Development Demo Accounts Picker */}
        <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px dashed var(--line2)' }}>
          <small style={{ display: 'block', marginBottom: 10, fontWeight: 800, color: 'var(--blue)', letterSpacing: 0.5 }}>
            AKUN DEMO PENGEMBANGAN:
          </small>
          <div style={{ display: 'grid', gap: 8 }}>
            <button
              type="button"
              className="btn sm"
              style={{ justifyContent: 'flex-start', background: '#fff', fontSize: 12 }}
              onClick={() => fillDemo('admin@humdok.local', 'admin123')}
            >
              <ShieldCheck size={14} color="var(--accent)" />
              <span><b>Super Admin:</b> admin@humdok.local</span>
            </button>
            <button
              type="button"
              className="btn sm"
              style={{ justifyContent: 'flex-start', background: '#fff', fontSize: 12 }}
              onClick={() => fillDemo('div_humas@humdok.local', 'humas123')}
            >
              <UserCheck size={14} color="var(--blue)" />
              <span><b>Divisi Humas:</b> div_humas@humdok.local</span>
            </button>
            <button
              type="button"
              className="btn sm"
              style={{ justifyContent: 'flex-start', background: '#fff', fontSize: 12 }}
              onClick={() => fillDemo('div_pubdok@humdok.local', 'pubdok123')}
            >
              <UserCheck size={14} color="var(--amber)" />
              <span><b>Divisi Pubdok:</b> div_pubdok@humdok.local</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
