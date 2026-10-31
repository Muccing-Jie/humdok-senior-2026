'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: 'var(--muted)' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="avatar" style={{ width: 56, height: 56, margin: '0 auto 12px', fontSize: 18 }}>
          SNR
        </div>
        <b>Memuat HUMAS & PUBDOK MANAGEMENT...</b>
      </div>
    </div>
  );
}
