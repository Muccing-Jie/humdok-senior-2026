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
      const res = await api.me();
      if (res.data) {
        setUser(res.data);
        // Synchronize default workspace according to role
        if (res.data.role === 'Divisi Humas') {
          setWorkspace('Humas');
        } else if (res.data.role === 'Divisi Pubdok') {
          setWorkspace('Pubdok');
        } else {
          // Super Admin can keep saved preference or default to Humas
          const savedWs = localStorage.getItem('humdok_workspace');
          if (savedWs === 'Humas' || savedWs === 'Pubdok') {
            setWorkspace(savedWs);
          }
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
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
    localStorage.setItem('humdok_workspace', newWs);
  };

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    if (res.data?.token && res.data?.user) {
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);

      if (res.data.user.role === 'Divisi Humas') {
        setWorkspace('Humas');
      } else if (res.data.user.role === 'Divisi Pubdok') {
        setWorkspace('Pubdok');
      } else {
        setWorkspace('Humas');
      }
      router.push('/dashboard');
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('token');
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
