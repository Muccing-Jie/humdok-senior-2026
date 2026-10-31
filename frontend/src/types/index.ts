export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface APIResponse<T> {
  data?: T;
  meta?: PaginationMeta;
  message?: string;
  error?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'Divisi Humas' | 'Divisi Pubdok';
  module_access: string;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface BoardMember {
  id: string;
  name: string;
  snr: string;
  position: string;
  level: string;
  division: string;
  contact: string;
  period: string;
  created_at?: string;
  updated_at?: string;
}

export interface WorkProgram {
  id: string;
  name: string;
  pic_id?: string;
  pic_name: string;
  target_text: string;
  progress_pct: number;
  status: 'Terlaksana' | 'Berjalan' | 'Belum' | 'Belum Terlaksana' | string;
  division: 'Humas' | 'Pubdok' | string;
  period: string;
  created_at?: string;
  updated_at?: string;
}

export interface Event {
  id: string;
  name: string;
  unit: string;
  event_type: string;
  event_date: string;
  contact: string;
  status: 'Terlaksana' | 'Belum Terlaksana / Belum Dihadiri' | 'Belum Terlaksana' | 'Batal' | string;
  period: string;
  has_documentation?: boolean;
  documentation_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Schedule {
  id: string;
  title: string;
  pic_id?: string;
  pic_name: string;
  stage: string;
  deadline_date: string;
  is_done: boolean;
  status: 'Selesai' | 'Dalam Proses' | 'Belum Dimulai' | string;
  category: 'rapat' | 'publikasi' | 'tugas' | 'kegiatan' | string;
  division: 'Humas' | 'Pubdok' | string;
  period: string;
  created_at?: string;
  updated_at?: string;
}

export interface Publication {
  id: string;
  title: string;
  platform: string;
  publish_date: string;
  post_url: string;
  status: 'Tayang' | 'Terbit' | 'Terjadwal' | 'Produksi' | 'Ide Konten' | string;
  views: number;
  likes: number;
  period: string;
  created_at?: string;
  updated_at?: string;
}

export interface Documentation {
  id: string;
  title: string;
  event_id: string;
  event_name?: string;
  event_unit?: string;
  file_type: 'Foto' | 'Video' | 'Foto & Video' | string;
  doc_date: string;
  drive_url: string;
  status: 'Tersimpan' | 'Dalam Proses' | 'Lengkap' | 'Proses Upload' | 'Arsip' | string;
  period: string;
  created_at?: string;
  updated_at?: string;
}

export interface Achievement {
  id: string;
  unit: string;
  event_name: string;
  rank_title: string;
  event_date: string;
  result_category: 'Juara' | 'Finalis' | 'Partisipasi' | string;
  period: string;
  created_at?: string;
  updated_at?: string;
}

export interface ActivityLog {
  id: string;
  actor_user_id?: string;
  user_name: string;
  table_name: string;
  data_id: string;
  action_type: 'CREATE' | 'UPDATE' | 'DELETE' | 'TOGGLE' | 'LOGIN' | 'LOGOUT';
  description: string;
  division: string;
  created_at: string;
}

export interface DashboardSummary {
  scope: string;
  period: string;
  total_work_programs: number;
  humas_work_programs: number;
  pubdok_work_programs: number;
  avg_program_achievement: number;
  humas_avg_achievement: number;
  pubdok_avg_achievement: number;
  total_events: number;
  completed_events: number;
  pending_events: number;
  event_completion_pct: number;
  total_schedules: number;
  done_schedules: number;
  pending_schedules: number;
  upcoming_events: Event[];
  upcoming_tasks: Schedule[];
  program_stats: WorkProgram[];
  unit_events_summary: Record<string, number>;
  status_counts: Record<string, number>;
}
