import { APIResponse } from '@/types';
import {
  offlineList,
  offlineGet,
  offlineCreate,
  offlineUpdate,
  offlineDelete,
  offlineToggleSchedule,
  offlineDashboard,
} from './offlineStore';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** True bila aplikasi berjalan tanpa backend (mode demo, mis. GitHub Pages). */
export function isOfflineMode(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('token') === 'demo-token-senior-2026';
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

/**
 * Jalankan request ke backend; jika sedang mode demo atau backend tidak
 * terjangkau (status 0), gunakan penyimpanan offline di browser.
 */
async function withFallback<T = any>(online: () => Promise<APIResponse<T>>, offline: () => any): Promise<APIResponse<T>> {
  const run = () => {
    try {
      return Promise.resolve(offline() as APIResponse<T>);
    } catch (e: any) {
      return Promise.reject(new ApiError(e.message, e.status || 400));
    }
  };
  if (isOfflineMode()) return run();
  try {
    return await online();
  } catch (err: any) {
    if (err instanceof ApiError && err.status === 0) return run();
    throw err;
  }
}

const qs = (params?: Record<string, string>) => {
  const s = new URLSearchParams(params).toString();
  return s ? `?${s}` : '';
};

/** Membuat fungsi CRUD standar untuk satu resource. */
function resource(path: string, table: string) {
  return {
    list: (params?: Record<string, string>) =>
      withFallback(() => request<any>(`/${path}${qs(params)}`), () => offlineList(table, params)),
    get: (id: string) => withFallback(() => request<any>(`/${path}/${id}`), () => offlineGet(table, id)),
    create: (body: any) =>
      withFallback(() => request<any>(`/${path}`, { method: 'POST', body: JSON.stringify(body) }), () => offlineCreate(table, body)),
    update: (id: string, body: any) =>
      withFallback(() => request<any>(`/${path}/${id}`, { method: 'PUT', body: JSON.stringify(body) }), () => offlineUpdate(table, id, body)),
    remove: (id: string) =>
      withFallback(() => request<any>(`/${path}/${id}`, { method: 'DELETE' }), () => offlineDelete(table, id)),
  };
}

const boardMembers = resource('board-members', 'board_members');
const workPrograms = resource('work-programs', 'work_programs');
const events = resource('events', 'events');
const schedules = resource('schedules', 'schedules');
const publications = resource('publications', 'publications');
const documentations = resource('documentations', 'documentations');
const achievements = resource('achievements', 'achievements');
const users = resource('users', 'users');

export const api = {
  // Auth
  login: (body: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => {
    if (isOfflineMode()) {
      const u = typeof window !== 'undefined' ? localStorage.getItem('humdok_user') : null;
      return Promise.resolve({ data: u ? JSON.parse(u) : undefined } as APIResponse<any>);
    }
    return request<any>('/auth/me');
  },
  logout: () => (isOfflineMode() ? Promise.resolve({} as APIResponse<any>) : request<any>('/auth/logout', { method: 'POST' })),

  // Dashboard
  getDashboard: (params?: Record<string, string>) =>
    withFallback(() => request<any>(`/dashboard${qs(params)}`), () => offlineDashboard(params)),

  // Board Members
  getBoardMembers: boardMembers.list,
  getBoardMember: boardMembers.get,
  createBoardMember: boardMembers.create,
  updateBoardMember: boardMembers.update,
  deleteBoardMember: boardMembers.remove,

  // Work Programs
  getWorkPrograms: workPrograms.list,
  getWorkProgram: workPrograms.get,
  createWorkProgram: workPrograms.create,
  updateWorkProgram: workPrograms.update,
  deleteWorkProgram: workPrograms.remove,

  // Events
  getEvents: events.list,
  getEvent: events.get,
  createEvent: events.create,
  updateEvent: events.update,
  deleteEvent: events.remove,

  // Schedules
  getSchedules: schedules.list,
  getSchedule: schedules.get,
  createSchedule: schedules.create,
  updateSchedule: schedules.update,
  toggleSchedule: (id: string) =>
    withFallback(() => request<any>(`/schedules/${id}/toggle`, { method: 'PATCH' }), () => offlineToggleSchedule(id)),
  deleteSchedule: schedules.remove,

  // Publications
  getPublications: publications.list,
  getPublication: publications.get,
  createPublication: publications.create,
  updatePublication: publications.update,
  deletePublication: publications.remove,

  // Documentations
  getDocumentations: documentations.list,
  getDocumentation: documentations.get,
  createDocumentation: documentations.create,
  updateDocumentation: documentations.update,
  deleteDocumentation: documentations.remove,

  // Achievements
  getAchievements: achievements.list,
  getAchievement: achievements.get,
  createAchievement: achievements.create,
  updateAchievement: achievements.update,
  deleteAchievement: achievements.remove,

  // Users
  getUsers: users.list,
  getUser: users.get,
  createUser: users.create,
  updateUser: users.update,
  deleteUser: users.remove,

  // Activity Logs
  getActivityLogs: (params?: Record<string, string>) =>
    withFallback(() => request<any>(`/activity-logs${qs(params)}`), () => offlineList('activity_logs', params)),
};
