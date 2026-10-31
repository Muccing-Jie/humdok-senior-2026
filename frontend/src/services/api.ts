import { APIResponse } from '@/types';
import { MOCK_SUMMARY, MOCK_BOARD_MEMBERS, MOCK_EVENTS, MOCK_ACHIEVEMENTS } from './mockData';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<APIResponse<T>> {
  const url = `${API_BASE}${endpoint}`;
  
  let token: string | null = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('token');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data?.error || data?.message || `Request failed with status ${res.status}`;
      throw new ApiError(errorMsg, res.status);
    }

    return data;
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(err.message || 'Gagal terhubung ke backend server.', 0);
  }
}

export const api = {
  // Auth
  login: (body: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request<any>('/auth/me'),
  logout: () => request<any>('/auth/logout', { method: 'POST' }),

  // Dashboard
  getDashboard: async (params?: Record<string, string>) => {
    try {
      const qs = new URLSearchParams(params).toString();
      return await request<any>(`/dashboard${qs ? `?${qs}` : ''}`);
    } catch (err: any) {
      if (err.status === 0) {
        return { data: MOCK_SUMMARY };
      }
      throw err;
    }
  },

  // Board Members
  getBoardMembers: async (params?: Record<string, string>) => {
    try {
      const qs = new URLSearchParams(params).toString();
      return await request<any>(`/board-members${qs ? `?${qs}` : ''}`);
    } catch (err: any) {
      if (err.status === 0) {
        let list = [...MOCK_BOARD_MEMBERS];
        if (params?.level) {
          list = list.filter((m) => m.level === params.level);
        }
        if (params?.search) {
          const q = params.search.toLowerCase();
          list = list.filter((m) => m.name.toLowerCase().includes(q) || m.position.toLowerCase().includes(q));
        }
        return {
          data: list,
          meta: {
            page: 1,
            page_size: list.length,
            total: list.length,
            total_pages: 1,
          },
        };
      }
      throw err;
    }
  },
  getBoardMember: (id: string) => request<any>(`/board-members/${id}`),
  createBoardMember: (body: any) => request<any>('/board-members', { method: 'POST', body: JSON.stringify(body) }),
  updateBoardMember: (id: string, body: any) => request<any>(`/board-members/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteBoardMember: (id: string) => request<any>(`/board-members/${id}`, { method: 'DELETE' }),

  // Work Programs
  getWorkPrograms: async (params?: Record<string, string>) => {
    try {
      const qs = new URLSearchParams(params).toString();
      return await request<any>(`/work-programs${qs ? `?${qs}` : ''}`);
    } catch (err: any) {
      if (err.status === 0) {
        let list = [...MOCK_SUMMARY.program_stats];
        if (params?.division) {
          list = list.filter((p) => p.division === params.division);
        }
        return {
          data: list,
          meta: {
            page: 1,
            page_size: list.length,
            total: list.length,
            total_pages: 1,
          },
        };
      }
      throw err;
    }
  },
  getWorkProgram: (id: string) => request<any>(`/work-programs/${id}`),
  createWorkProgram: (body: any) => request<any>('/work-programs', { method: 'POST', body: JSON.stringify(body) }),
  updateWorkProgram: (id: string, body: any) => request<any>(`/work-programs/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteWorkProgram: (id: string) => request<any>(`/work-programs/${id}`, { method: 'DELETE' }),

  // Events
  getEvents: async (params?: Record<string, string>) => {
    try {
      const qs = new URLSearchParams(params).toString();
      return await request<any>(`/events${qs ? `?${qs}` : ''}`);
    } catch (err: any) {
      if (err.status === 0) {
        let list = [...MOCK_EVENTS];
        if (params?.status) {
          list = list.filter((e) => e.status === params.status);
        }
        if (params?.unit) {
          list = list.filter((e) => e.unit === params.unit);
        }
        if (params?.search) {
          const q = params.search.toLowerCase();
          list = list.filter((e) => e.name.toLowerCase().includes(q));
        }
        return {
          data: list,
          meta: {
            page: 1,
            page_size: list.length,
            total: list.length,
            total_pages: 1,
          },
        };
      }
      throw err;
    }
  },
  getEvent: (id: string) => request<any>(`/events/${id}`),
  createEvent: (body: any) => request<any>('/events', { method: 'POST', body: JSON.stringify(body) }),
  updateEvent: (id: string, body: any) => request<any>(`/events/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteEvent: (id: string) => request<any>(`/events/${id}`, { method: 'DELETE' }),

  // Schedules
  getSchedules: async (params?: Record<string, string>) => {
    try {
      const qs = new URLSearchParams(params).toString();
      return await request<any>(`/schedules${qs ? `?${qs}` : ''}`);
    } catch (err: any) {
      if (err.status === 0) {
        let list = [...MOCK_SUMMARY.upcoming_tasks];
        return {
          data: list,
          meta: {
            page: 1,
            page_size: list.length,
            total: list.length,
            total_pages: 1,
          },
        };
      }
      throw err;
    }
  },
  getSchedule: (id: string) => request<any>(`/schedules/${id}`),
  createSchedule: (body: any) => request<any>('/schedules', { method: 'POST', body: JSON.stringify(body) }),
  updateSchedule: (id: string, body: any) => request<any>(`/schedules/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  toggleSchedule: (id: string) => request<any>(`/schedules/${id}/toggle`, { method: 'PATCH' }),
  deleteSchedule: (id: string) => request<any>(`/schedules/${id}`, { method: 'DELETE' }),

  // Publications
  getPublications: async (params?: Record<string, string>) => {
    try {
      const qs = new URLSearchParams(params).toString();
      return await request<any>(`/publications${qs ? `?${qs}` : ''}`);
    } catch (err: any) {
      if (err.status === 0) {
        const list = [
          { id: 'pub-001', title: '[Contoh] Teaser Bazar Kampus', platform: 'TikTok', publish_date: '18 Nov 2026', post_url: '—', status: 'Ide Konten', views: 0, likes: 0, period: '2026' },
          { id: 'pub-002', title: '[Contoh] Rekap Prestasi UKM 2026', platform: 'Instagram', publish_date: '15 Nov 2026', post_url: '—', status: 'Produksi', views: 0, likes: 0, period: '2026' },
          { id: 'pub-003', title: '[Contoh] Highlight Unhas Cup 2026', platform: 'TikTok', publish_date: '1 Okt 2026', post_url: '—', status: 'Terbit', views: 5200, likes: 610, period: '2026' },
          { id: 'pub-004', title: '[Contoh] Recap Phinisi Basketball', platform: 'Instagram', publish_date: '25 Agu 2026', post_url: '—', status: 'Terbit', views: 1850, likes: 240, period: '2026' },
        ];
        return { data: list, meta: { page: 1, page_size: list.length, total: list.length, total_pages: 1 } };
      }
      throw err;
    }
  },
  getPublication: (id: string) => request<any>(`/publications/${id}`),
  createPublication: (body: any) => request<any>('/publications', { method: 'POST', body: JSON.stringify(body) }),
  updatePublication: (id: string, body: any) => request<any>(`/publications/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deletePublication: (id: string) => request<any>(`/publications/${id}`, { method: 'DELETE' }),

  // Documentations
  getDocumentations: async (params?: Record<string, string>) => {
    try {
      const qs = new URLSearchParams(params).toString();
      return await request<any>(`/documentations${qs ? `?${qs}` : ''}`);
    } catch (err: any) {
      if (err.status === 0) {
        const list = [
          { id: 'doc-001', title: '[Contoh] Dokumentasi Phinisi Basketball', event_id: 'ev-004', event_name: 'Phinisi Basketball Competition 2026', file_type: 'Video', doc_date: '22 Agu 2026', drive_url: 'https://drive.google.com/', status: 'Tersimpan', period: '2026' },
          { id: 'doc-002', title: '[Contoh] Dokumentasi Pelantikan Pengurus 2026', event_id: 'ev-007', event_name: '[Contoh] Pelantikan Pengurus 2026', file_type: 'Foto', doc_date: '14 Feb 2026', drive_url: 'https://drive.google.com/', status: 'Tersimpan', period: '2026' },
          { id: 'doc-003', title: '[Contoh] Dokumentasi UIN Cup 2025', event_id: 'ev-010', event_name: 'UIN Cup 2025', file_type: 'Foto', doc_date: '13 Okt 2025', drive_url: 'https://drive.google.com/', status: 'Tersimpan', period: '2026' },
        ];
        return { data: list, meta: { page: 1, page_size: list.length, total: list.length, total_pages: 1 } };
      }
      throw err;
    }
  },
  getDocumentation: (id: string) => request<any>(`/documentations/${id}`),
  createDocumentation: (body: any) => request<any>('/documentations', { method: 'POST', body: JSON.stringify(body) }),
  updateDocumentation: (id: string, body: any) => request<any>(`/documentations/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteDocumentation: (id: string) => request<any>(`/documentations/${id}`, { method: 'DELETE' }),

  // Achievements
  getAchievements: async (params?: Record<string, string>) => {
    try {
      const qs = new URLSearchParams(params).toString();
      return await request<any>(`/achievements${qs ? `?${qs}` : ''}`);
    } catch (err: any) {
      if (err.status === 0) {
        let list = [...MOCK_ACHIEVEMENTS];
        if (params?.category) {
          list = list.filter((a) => a.result_category === params.category);
        }
        if (params?.unit) {
          list = list.filter((a) => a.unit === params.unit);
        }
        if (params?.search) {
          const q = params.search.toLowerCase();
          list = list.filter((a) => a.event_name.toLowerCase().includes(q) || a.rank_title.toLowerCase().includes(q));
        }
        return {
          data: list,
          meta: {
            page: 1,
            page_size: list.length,
            total: list.length,
            total_pages: 1,
          },
        };
      }
      throw err;
    }
  },
  getAchievement: (id: string) => request<any>(`/achievements/${id}`),
  createAchievement: (body: any) => request<any>('/achievements', { method: 'POST', body: JSON.stringify(body) }),
  updateAchievement: (id: string, body: any) => request<any>(`/achievements/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteAchievement: (id: string) => request<any>(`/achievements/${id}`, { method: 'DELETE' }),

  // Users
  getUsers: async (params?: Record<string, string>) => {
    try {
      const qs = new URLSearchParams(params).toString();
      return await request<any>(`/users${qs ? `?${qs}` : ''}`);
    } catch (err: any) {
      if (err.status === 0) {
        const list = [
          { id: 'c56a2610-9b8e-4706-b358-26b94aded795', name: 'Administrator SENIOR', email: 'admin@humdok.local', role: 'Super Admin', module_access: 'all', status: 'active', created_at: '2026-01-01' },
          { id: 'user-humas-01', name: 'Staff Divisi Humas', email: 'div_humas@humdok.local', role: 'Divisi Humas', module_access: 'humas', status: 'active', created_at: '2026-01-01' },
          { id: 'user-pubdok-01', name: 'Staff Divisi Pubdok', email: 'div_pubdok@humdok.local', role: 'Divisi Pubdok', module_access: 'pubdok', status: 'active', created_at: '2026-01-01' },
        ];
        return { data: list, meta: { page: 1, page_size: list.length, total: list.length, total_pages: 1 } };
      }
      throw err;
    }
  },
  getUser: (id: string) => request<any>(`/users/${id}`),
  createUser: (body: any) => request<any>('/users', { method: 'POST', body: JSON.stringify(body) }),
  updateUser: (id: string, body: any) => request<any>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteUser: (id: string) => request<any>(`/users/${id}`, { method: 'DELETE' }),

  // Activity Logs
  getActivityLogs: async (params?: Record<string, string>) => {
    try {
      const qs = new URLSearchParams(params).toString();
      return await request<any>(`/activity-logs${qs ? `?${qs}` : ''}`);
    } catch (err: any) {
      if (err.status === 0) {
        const list = [
          { id: 'log-01', user_name: 'Administrator SENIOR', table_name: 'users', data_id: 'c56a', action_type: 'LOGIN', description: 'Pengguna berhasil masuk ke sistem', division: 'Global', created_at: '2026-10-31 21:00:00' },
          { id: 'log-02', user_name: 'Staff Divisi Humas', table_name: 'events', data_id: 'ev-004', action_type: 'UPDATE', description: 'Pembaruan data Kegiatan Phinisi Basketball', division: 'Humas', created_at: '2026-10-31 20:30:00' },
          { id: 'log-03', user_name: 'Staff Divisi Pubdok', table_name: 'publications', data_id: 'pub-003', action_type: 'CREATE', description: 'Input data publikasi Highlight Unhas Cup 2026', division: 'Pubdok', created_at: '2026-10-31 19:45:00' },
        ];
        return { data: list, meta: { page: 1, page_size: list.length, total: list.length, total_pages: 1 } };
      }
      throw err;
    }
  },
};
