'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types';
import { api } from '@/services/api';

interface AuthContextType {
  user: User | null;
  workspace: 'Humas' | 'Pubdok';
  loading: boolean;
  switchWorkspace: (ws: 'Humas' | 'Pubdok') => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<'Humas' | 'Pubdok'>('Humas');
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  const reloadUser = async () => {
    try {
      const cached = typeof window !== 'undefined' ? localStorage.getItem('humdok_user') : null;
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setUser(parsed);
          const savedWs = localStorage.getItem('humdok_workspace');
          if (savedWs === 'Humas' || savedWs === 'Pubdok') {
            setWorkspace(savedWs);
          } else if (parsed.role === 'Divisi Humas') {
            setWorkspace('Humas');
          } else if (parsed.role === 'Divisi Pubdok') {
            setWorkspace('Pubdok');
          }
        } catch {
          // ignore
        }
      }

      const res = await api.me();
      if (res.data) {
        setUser(res.data);
        if (typeof window !== 'undefined') {
          localStorage.setItem('humdok_user', JSON.stringify(res.data));
        }
        if (res.data.role === 'Divisi Humas') {
          setWorkspace('Humas');
        } else if (res.data.role === 'Divisi Pubdok') {
          setWorkspace('Pubdok');
        } else {
          const savedWs = typeof window !== 'undefined' ? localStorage.getItem('humdok_workspace') : null;
          if (savedWs === 'Humas' || savedWs === 'Pubdok') {
            setWorkspace(savedWs);
          }
        }
      }
    } catch {
      // If backend offline but cached user exists, keep it
      if (typeof window !== 'undefined' && !localStorage.getItem('humdok_user')) {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadUser();
  }, []);

  const switchWorkspace = (newWs: 'Humas' | 'Pubdok') => {
    if (!user) return;
    if (user.role === 'Divisi Humas' && newWs !== 'Humas') return;
    if (user.role === 'Divisi Pubdok' && newWs !== 'Pubdok') return;

    setWorkspace(newWs);
    if (typeof window !== 'undefined') {
      localStorage.setItem('humdok_workspace', newWs);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await api.login({ email, password });
      if (res.data?.token && res.data?.user) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('humdok_user', JSON.stringify(res.data.user));
        }
        setUser(res.data.user);

        if (res.data.user.role === 'Divisi Humas') {
          setWorkspace('Humas');
        } else if (res.data.user.role === 'Divisi Pubdok') {
          setWorkspace('Pubdok');
        } else {
          setWorkspace('Humas');
        }
        router.push('/dashboard');
        return;
      }
    } catch (err: any) {
      // Graceful demo login fallback for GitHub Pages when backend is offline
      const normalizedEmail = (email || '').toLowerCase().trim();
      let demoUser: User | null = null;
      if (normalizedEmail === 'admin@humdok.local' && password === 'admin123') {
        demoUser = {
          id: 'c56a2610-9b8e-4706-b358-26b94aded795',
          name: 'Administrator SENIOR',
          email: 'admin@humdok.local',
          role: 'Super Admin',
          module_access: 'all',
          status: 'active',
        };
      } else if (normalizedEmail === 'div_humas@humdok.local' && password === 'humas123') {
        demoUser = {
          id: 'user-humas-01',
          name: 'Staff Divisi Humas',
          email: 'div_humas@humdok.local',
          role: 'Divisi Humas',
          module_access: 'humas',
          status: 'active',
        };
      } else if (normalizedEmail === 'div_pubdok@humdok.local' && password === 'pubdok123') {
        demoUser = {
          id: 'user-pubdok-01',
          name: 'Staff Divisi Pubdok',
          email: 'div_pubdok@humdok.local',
          role: 'Divisi Pubdok',
          module_access: 'pubdok',
          status: 'active',
        };
      }

      if (demoUser) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', 'demo-token-senior-2026');
          localStorage.setItem('humdok_user', JSON.stringify(demoUser));
        }
        setUser(demoUser);
        if (demoUser.role === 'Divisi Humas') setWorkspace('Humas');
        else if (demoUser.role === 'Divisi Pubdok') setWorkspace('Pubdok');
        else setWorkspace('Humas');
        router.push('/dashboard');
        return;
      }

      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('humdok_user');
      }
      setUser(null);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        workspace,
        loading,
        switchWorkspace,
        login,
        logout,
        reloadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
