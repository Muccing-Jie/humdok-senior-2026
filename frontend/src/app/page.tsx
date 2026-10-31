'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--page)', color: 'var(--text)', padding: 20 }}>
      <div style={{ textAlign: 'center', background: '#fff', padding: '36px 32px', borderRadius: 24, boxShadow: '0 12px 30px rgba(180,120,0,0.15)', maxWidth: 420, width: '100%' }}>
        <div style={{ width: 64, height: 64, margin: '0 auto 16px', background: 'linear-gradient(135deg, #f9c73d, #e8a90c)', borderRadius: 20, display: 'grid', placeItems: 'center', color: '#2b2110', fontWeight: 800, fontSize: 20, boxShadow: '0 8px 16px rgba(232,169,12,0.35)' }}>
          SNR
        </div>
        <h2 style={{ margin: '0 0 6px', fontSize: 18, color: 'var(--text)' }}>HUMAS &amp; PUBDOK MANAGEMENT</h2>
        <p style={{ margin: '0 0 20px', color: 'var(--muted)', fontSize: 13 }}>UKM SENIOR Politeknik Negeri Ujung Pandang</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--dim)' }}>Memuat sesi dan mengalihkan halaman...</p>
          <Link
            href="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 22px',
              borderRadius: 14,
              background: 'var(--accent)',
              color: 'var(--accent-ink)',
              fontWeight: 700,
              fontSize: 13,
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(232,169,12,0.4)',
              transition: 'all 0.2s ease',
            }}
          >
            Buka Halaman Masuk &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
