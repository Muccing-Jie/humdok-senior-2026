// Penyimpanan offline untuk mode demo (GitHub Pages / backend tidak aktif).
// Data awal diambil dari seedData.json (ekspor penuh database humdok.db),
// lalu setiap perubahan (tambah/ubah/hapus/toggle) disimpan di localStorage browser.
import seed from './seedData.json';

type Row = Record<string, any>;
type Store = Record<string, Row[]>;

const KEY = 'humdok_offline_db_v1';

const USERS: Row[] = [
  { id: 'c56a2610-9b8e-4706-b358-26b94aded795', name: 'Administrator SENIOR', email: 'admin@humdok.local', role: 'Super Admin', module_access: 'all', status: 'active', created_at: '2026-01-01T00:00:00Z' },
  { id: 'user-humas-01', name: 'Staff Divisi Humas', email: 'div_humas@humdok.local', role: 'Divisi Humas', module_access: 'humas', status: 'active', created_at: '2026-01-01T00:00:00Z' },
  { id: 'user-pubdok-01', name: 'Staff Divisi Pubdok', email: 'div_pubdok@humdok.local', role: 'Divisi Pubdok', module_access: 'pubdok', status: 'active', created_at: '2026-01-01T00:00:00Z' },
];

function load(): Store {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        /* reset di bawah */
      }
    }
  }
  const fresh: Store = JSON.parse(JSON.stringify(seed));
  fresh.users = JSON.parse(JSON.stringify(USERS));
  save(fresh);
  return fresh;
}

function save(s: Store) {
  if (typeof window !== 'undefined') localStorage.setItem(KEY, JSON.stringify(s));
}

export function resetOfflineDB() {
  if (typeof window !== 'undefined') localStorage.removeItem(KEY);
}

function currentUser(): Row | null {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem('humdok_user') || 'null');
  } catch {
    return null;
  }
}

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

const DIVISION_OF: Record<string, string> = {
  board_members: 'Humas',
  events: 'Humas',
  publications: 'Pubdok',
  documentations: 'Pubdok',
  achievements: 'Pubdok',
  users: 'Global',
};

function log(s: Store, table: string, id: string, action: string, desc: string, division?: string) {
  const u = currentUser();
  s.activity_logs = s.activity_logs || [];
  s.activity_logs.unshift({
    id: uid('log'),
    actor_user_id: u?.id || null,
    user_name: u?.name || 'Pengguna Demo',
    table_name: table,
    data_id: id,
    action_type: action,
    description: desc,
    division: division || DIVISION_OF[table] || 'Global',
    created_at: new Date().toISOString(),
  });
}

function labelOf(r: Row) {
  return r.name || r.title || r.event_name || r.id;
}

// Melengkapi field turunan (nama PIC, nama kegiatan, jumlah dokumentasi)
function enrich(s: Store, table: string, r: Row): Row {
  const out = { ...r };
  if ((table === 'work_programs' || table === 'schedules') && r.pic_id) {
    const m = s.board_members.find((x) => x.id === r.pic_id);
    if (m) out.pic_name = m.name;
  }
  if (table === 'documentations') {
    const ev = s.events.find((x) => x.id === r.event_id);
    out.event_name = ev?.name || r.event_name || '';
    out.event_unit = ev?.unit || '';
  }
  if (table === 'events') {
    const n = s.documentations.filter((d) => d.event_id === r.id).length;
    out.documentation_count = n;
    out.has_documentation = n > 0;
  }
  return out;
}

const SEARCH_FIELDS: Record<string, string[]> = {
  board_members: ['name', 'position', 'division', 'snr'],
  work_programs: ['name', 'pic_name', 'target_text'],
  events: ['name', 'unit', 'event_type'],
  schedules: ['title', 'pic_name', 'stage'],
  publications: ['title', 'platform'],
  documentations: ['title', 'event_name'],
  achievements: ['event_name', 'unit', 'rank_title'],
  users: ['name', 'email', 'role'],
  activity_logs: ['user_name', 'description', 'table_name'],
};

const FILTER_FIELDS = ['level', 'division', 'status', 'unit', 'category', 'platform', 'file_type', 'event_id', 'role', 'action_type', 'table_name'];

export function offlineList(table: string, params: Record<string, string> = {}) {
  const s = load();
  let list = (s[table] || []).map((r) => enrich(s, table, r));

  for (const f of FILTER_FIELDS) {
    const v = params[f];
    if (!v) continue;
    const field = f === 'category' && table === 'achievements' ? 'result_category' : f;
    list = list.filter((r) => String(r[field] ?? '') === v);
  }

  if (params.search) {
    const q = params.search.toLowerCase();
    const fields = SEARCH_FIELDS[table] || ['name'];
    list = list.filter((r) => fields.some((f) => String(r[f] ?? '').toLowerCase().includes(q)));
  }

  const sort = params.sort;
  if (sort && sort !== 'created_at') {
    const dir = (params.dir || 'ASC').toUpperCase() === 'DESC' ? -1 : 1;
    list.sort((a, b) => {
      const x = a[sort];
      const y = b[sort];
      if (typeof x === 'number' && typeof y === 'number') return (x - y) * dir;
      return String(x ?? '').localeCompare(String(y ?? ''), 'id') * dir;
    });
  }

  const pageSize = Math.max(1, parseInt(params.page_size || '10', 10));
  const page = Math.max(1, parseInt(params.page || '1', 10));
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const data = list.slice((page - 1) * pageSize, page * pageSize);
  return { data, meta: { page, page_size: pageSize, total, total_pages: totalPages } };
}

export function offlineGet(table: string, id: string) {
  const s = load();
  const r = (s[table] || []).find((x) => x.id === id);
  if (!r) throw Object.assign(new Error('Data tidak ditemukan.'), { status: 404 });
  return { data: enrich(s, table, r) };
}

export function offlineCreate(table: string, body: Row) {
  const s = load();
  const now = new Date().toISOString();
  const row: Row = { period: '2026', ...body, id: uid(table.slice(0, 3)), created_at: now, updated_at: now };
  delete row.password;
  if (table === 'schedules') {
    row.is_done = !!row.is_done;
    row.status = row.is_done ? 'Selesai' : row.status || 'Belum Dimulai';
  }
  const full = enrich(s, table, row);
  s[table] = [full, ...(s[table] || [])];
  log(s, table, full.id, 'CREATE', `Menambahkan data ${labelOf(full)}`, full.division);
  save(s);
  return { data: full, message: 'Data berhasil ditambahkan (mode demo).' };
}

export function offlineUpdate(table: string, id: string, body: Row) {
  const s = load();
  const idx = (s[table] || []).findIndex((x) => x.id === id);
  if (idx < 0) throw Object.assign(new Error('Data tidak ditemukan.'), { status: 404 });
  const patch = { ...body };
  delete patch.password;
  const row = enrich(s, table, { ...s[table][idx], ...patch, id, updated_at: new Date().toISOString() });
  if (table === 'schedules' && 'is_done' in patch) row.status = row.is_done ? 'Selesai' : row.status === 'Selesai' ? 'Dalam Proses' : row.status;
  s[table][idx] = row;
  log(s, table, id, 'UPDATE', `Memperbarui data ${labelOf(row)}`, row.division);
  save(s);
  return { data: row, message: 'Data berhasil diperbarui (mode demo).' };
}

export function offlineDelete(table: string, id: string) {
  const s = load();
  const row = (s[table] || []).find((x) => x.id === id);
  if (!row) throw Object.assign(new Error('Data tidak ditemukan.'), { status: 404 });
  if (table === 'events' && s.documentations.some((d) => d.event_id === id)) {
    throw Object.assign(new Error('Kegiatan tidak dapat dihapus karena sudah memiliki dokumentasi Pubdok.'), { status: 409 });
  }
  s[table] = s[table].filter((x) => x.id !== id);
  if (table === 'board_members') {
    for (const t of ['work_programs', 'schedules']) s[t].forEach((r) => r.pic_id === id && (r.pic_id = null));
  }
  log(s, table, id, 'DELETE', `Menghapus data ${labelOf(row)}`, row.division);
  save(s);
  return { message: 'Data berhasil dihapus (mode demo).' };
}

export function offlineToggleSchedule(id: string) {
  const s = load();
  const r = s.schedules.find((x) => x.id === id);
  if (!r) throw Object.assign(new Error('Jadwal tidak ditemukan.'), { status: 404 });
  r.is_done = !r.is_done;
  r.status = r.is_done ? 'Selesai' : 'Dalam Proses';
  r.updated_at = new Date().toISOString();
  log(s, 'schedules', id, 'TOGGLE', `Mengubah status checklist ${r.title}: ${r.status}`, r.division);
  save(s);
  return { data: enrich(s, 'schedules', r) };
}

export function offlineDashboard(params: Record<string, string> = {}) {
  const s = load();
  const div = params.division;
  const progs = s.work_programs.filter((p) => !div || p.division === div);
  const scheds = s.schedules.filter((p) => !div || p.division === div);
  const avg = (arr: Row[]) => (arr.length ? Math.round(arr.reduce((a, b) => a + (Number(b.progress_pct) || 0), 0) / arr.length) : 0);
  const humas = s.work_programs.filter((p) => p.division === 'Humas');
  const pubdok = s.work_programs.filter((p) => p.division === 'Pubdok');
  const completed = s.events.filter((e) => e.status === 'Terlaksana').length;
  const unitSummary: Record<string, number> = {};
  const statusCounts: Record<string, number> = {};
  s.events.forEach((e) => {
    const u = !e.unit || e.unit === '—' ? 'Umum' : e.unit;
    unitSummary[u] = (unitSummary[u] || 0) + 1;
    statusCounts[e.status] = (statusCounts[e.status] || 0) + 1;
  });
  const done = scheds.filter((x) => x.is_done).length;

  return {
    data: {
      scope: div || 'all',
      period: '2026',
      total_work_programs: progs.length,
      humas_work_programs: humas.length,
      pubdok_work_programs: pubdok.length,
      avg_program_achievement: avg(progs),
      humas_avg_achievement: avg(humas),
      pubdok_avg_achievement: avg(pubdok),
      total_events: s.events.length,
      completed_events: completed,
      pending_events: s.events.length - completed,
      event_completion_pct: s.events.length ? Math.round((completed / s.events.length) * 100) : 0,
      total_schedules: scheds.length,
      done_schedules: done,
      pending_schedules: scheds.length - done,
      upcoming_events: s.events.filter((e) => e.status !== 'Terlaksana').slice(0, 5).map((e) => enrich(s, 'events', e)),
      upcoming_tasks: scheds.filter((x) => !x.is_done).slice(0, 5).map((x) => enrich(s, 'schedules', x)),
      program_stats: progs.map((p) => enrich(s, 'work_programs', p)),
      unit_events_summary: unitSummary,
      status_counts: statusCounts,
    },
  };
}
