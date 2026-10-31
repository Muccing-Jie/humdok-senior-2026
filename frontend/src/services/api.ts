import { APIResponse } from '@/types';

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
  getDashboard: (params?: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return request<any>(`/dashboard${qs ? `?${qs}` : ''}`);
  },

  // Board Members
  getBoardMembers: (params?: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return request<any>(`/board-members${qs ? `?${qs}` : ''}`);
  },
  getBoardMember: (id: string) => request<any>(`/board-members/${id}`),
  createBoardMember: (body: any) => request<any>('/board-members', { method: 'POST', body: JSON.stringify(body) }),
  updateBoardMember: (id: string, body: any) => request<any>(`/board-members/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteBoardMember: (id: string) => request<any>(`/board-members/${id}`, { method: 'DELETE' }),

  // Work Programs
  getWorkPrograms: (params?: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return request<any>(`/work-programs${qs ? `?${qs}` : ''}`);
  },
  getWorkProgram: (id: string) => request<any>(`/work-programs/${id}`),
  createWorkProgram: (body: any) => request<any>('/work-programs', { method: 'POST', body: JSON.stringify(body) }),
  updateWorkProgram: (id: string, body: any) => request<any>(`/work-programs/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteWorkProgram: (id: string) => request<any>(`/work-programs/${id}`, { method: 'DELETE' }),

  // Events
  getEvents: (params?: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return request<any>(`/events${qs ? `?${qs}` : ''}`);
  },
  getEvent: (id: string) => request<any>(`/events/${id}`),
  createEvent: (body: any) => request<any>('/events', { method: 'POST', body: JSON.stringify(body) }),
  updateEvent: (id: string, body: any) => request<any>(`/events/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteEvent: (id: string) => request<any>(`/events/${id}`, { method: 'DELETE' }),

  // Schedules
  getSchedules: (params?: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return request<any>(`/schedules${qs ? `?${qs}` : ''}`);
  },
  getSchedule: (id: string) => request<any>(`/schedules/${id}`),
  createSchedule: (body: any) => request<any>('/schedules', { method: 'POST', body: JSON.stringify(body) }),
  updateSchedule: (id: string, body: any) => request<any>(`/schedules/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  toggleSchedule: (id: string) => request<any>(`/schedules/${id}/toggle`, { method: 'PATCH' }),
  deleteSchedule: (id: string) => request<any>(`/schedules/${id}`, { method: 'DELETE' }),

  // Publications
  getPublications: (params?: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return request<any>(`/publications${qs ? `?${qs}` : ''}`);
  },
  getPublication: (id: string) => request<any>(`/publications/${id}`),
  createPublication: (body: any) => request<any>('/publications', { method: 'POST', body: JSON.stringify(body) }),
  updatePublication: (id: string, body: any) => request<any>(`/publications/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deletePublication: (id: string) => request<any>(`/publications/${id}`, { method: 'DELETE' }),

  // Documentations
  getDocumentations: (params?: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return request<any>(`/documentations${qs ? `?${qs}` : ''}`);
  },
  getDocumentation: (id: string) => request<any>(`/documentations/${id}`),
  createDocumentation: (body: any) => request<any>('/documentations', { method: 'POST', body: JSON.stringify(body) }),
  updateDocumentation: (id: string, body: any) => request<any>(`/documentations/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteDocumentation: (id: string) => request<any>(`/documentations/${id}`, { method: 'DELETE' }),

  // Achievements
  getAchievements: (params?: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return request<any>(`/achievements${qs ? `?${qs}` : ''}`);
  },
  getAchievement: (id: string) => request<any>(`/achievements/${id}`),
  createAchievement: (body: any) => request<any>('/achievements', { method: 'POST', body: JSON.stringify(body) }),
  updateAchievement: (id: string, body: any) => request<any>(`/achievements/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteAchievement: (id: string) => request<any>(`/achievements/${id}`, { method: 'DELETE' }),

  // Users
  getUsers: (params?: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return request<any>(`/users${qs ? `?${qs}` : ''}`);
  },
  getUser: (id: string) => request<any>(`/users/${id}`),
  createUser: (body: any) => request<any>('/users', { method: 'POST', body: JSON.stringify(body) }),
  updateUser: (id: string, body: any) => request<any>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteUser: (id: string) => request<any>(`/users/${id}`, { method: 'DELETE' }),

  // Activity Logs
  getActivityLogs: (params?: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return request<any>(`/activity-logs${qs ? `?${qs}` : ''}`);
  },
};
