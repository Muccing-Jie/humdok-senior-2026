'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/services/api';
import { DashboardSummary } from '@/types';
import StatCard from '@/components/StatCard';
import Badge from '@/components/Badge';
import {
  Briefcase,
  CheckCircle,
  TrendingUp,
  CalendarCheck,
  PlusCircle,
  Calendar,
  Layers,
  Sparkles,
  BarChart3,
  LineChart as LineChartIcon,
  ChevronRight,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function DashboardPage() {
  const { user, workspace } = useAuth();
  const toast = useToast();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState<'area' | 'bar'>('area');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboard({ division: workspace, period: '2026' });
      if (res.data) {
        setData(res.data);
      }
    } catch (err: any) {
      toast.error('Gagal memuat ringkasan dashboard: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [workspace]);

  const handleToggleTask = async (taskId: string) => {
    try {
      const res = await api.toggleSchedule(taskId);
      toast.success(res.message || 'Status tugas diperbarui.');
      fetchDashboardData();
    } catch (err: any) {
      toast.error('Gagal memperbarui status tugas: ' + err.message);
    }
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 19) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const formatDateWITA = () => {
    const now = new Date();
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Makassar',
    }).format(now);
  };

  if (loading && !data) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center', color: 'var(--muted)' }}>
        <div className="avatar" style={{ width: 52, height: 52, margin: '0 auto 14px', fontSize: 18 }}>
          SNR
        </div>
        <b style={{ fontSize: 16 }}>Memuat data statistik dari database...</b>
        <p style={{ fontSize: 13, color: 'var(--dim)', margin: '4px 0 0' }}>Mengagregasi indikator proker, kegiatan, dan jadwal divisi {workspace}</p>
      </div>
    );
  }

  const summary = data || {
    scope: workspace,
    period: '2026',
    total_work_programs: 7,
    humas_work_programs: 2,
    pubdok_work_programs: 5,
    avg_program_achievement: 48,
    humas_avg_achievement: 55,
    pubdok_avg_achievement: 45,
    total_events: 16,
    completed_events: 10,
    pending_events: 6,
    event_completion_pct: 63,
    total_schedules: 8,
    done_schedules: 6,
    pending_schedules: 2,
    upcoming_events: [],
    upcoming_tasks: [],
    program_stats: [],
    unit_events_summary: {},
    status_counts: {},
  };

  const isHumas = workspace === 'Humas';
  const displayCapaian = isHumas
    ? summary.humas_avg_achievement
    : summary.pubdok_avg_achievement;
  const displayCapaianLabel = isHumas
    ? 'Capaian Proker Humas'
    : 'Capaian Proker Pubdok';

  // Prepare chart data for Recharts Area/Bar Chart
  const prokerChartData = summary.program_stats.map((wp) => ({
    name: wp.name.length > 18 ? wp.name.substring(0, 16) + '...' : wp.name,
    fullName: wp.name,
    progress: wp.progress_pct,
    pic: wp.pic_name,
    status: wp.status,
  }));

  // Prepare Donut Chart Data
  const terlaksanaCount = summary.status_counts['Terlaksana'] || 0;
  const berjalanCount = summary.status_counts['Berjalan'] || 0;
  const belumCount = summary.status_counts['Belum Terlaksana'] || 0;
  const totalStatus = terlaksanaCount + berjalanCount + belumCount || 1;

  const donutData = [
    { name: 'Terlaksana', value: terlaksanaCount, color: '#1d7a3a' },
    { name: 'Berjalan', value: berjalanCount, color: '#e8a90c' },
    { name: 'Belum Terlaksana', value: belumCount, color: '#f1e6c8' },
  ];

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div
          style={{
            background: '#fff',
            border: '1px solid var(--line2)',
            borderRadius: 14,
            padding: '10px 14px',
            boxShadow: '0 8px 24px -6px rgba(160,110,10,0.35)',
            fontSize: 12,
          }}
        >
          <div style={{ fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
            {d.fullName || d.name}
          </div>
          <div style={{ color: 'var(--muted)' }}>
            Capaian: <b style={{ color: 'var(--blue)' }}>{d.progress}%</b>
          </div>
          {d.pic && (
            <div style={{ color: 'var(--muted)', fontSize: 11 }}>
              PIC: {d.pic}
            </div>
          )}
          <div style={{ marginTop: 4 }}>
            <span className="badge ok" style={{ fontSize: 10, padding: '2px 8px' }}>
              {d.status}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      {/* 1. Hero Welcome Banner (Executive Gold Ambient) */}
      <section className="hero">
        <div>
          <div className="datechip">
            <Sparkles size={14} />
            <span>{formatDateWITA()} (WITA)</span>
          </div>
          <h1>
            {getTimeGreeting()}, {user?.name?.split(' ')[0] || 'Pengurus'}!
          </h1>
          <p>
            Selamat datang di Workspace <b>Divisi {workspace}</b> UKM SENIOR PNUP. Pantau seluruh program kerja, kegiatan unit, publikasi, dan agenda secara real-time.
          </p>
        </div>

        <div className="heroactions">
          <Link href="/events" className="btn sm">
            <PlusCircle size={15} />
            <span>+ Kegiatan</span>
          </Link>
          <Link href="/schedules" className="btn sm">
            <Calendar size={15} />
            <span>+ Agenda</span>
          </Link>
          <Link href="/work-programs" className="btn sm">
            <Layers size={15} />
            <span>Program Kerja</span>
          </Link>
        </div>
      </section>

      {/* 2. Empat Kartu Statistik Utama (White Cards + Gold Accent) */}
      <div className="grid g4">
        <StatCard
          label="TOTAL PROGRAM KERJA"
          value={summary.total_work_programs}
          unit="Proker"
          sub="Organisasi UKM SENIOR"
          tagIcon={<Briefcase size={18} />}
          theme="blue"
          pills={[
            { label: 'Humas', value: summary.humas_work_programs },
            { label: 'Pubdok', value: summary.pubdok_work_programs },
          ]}
        />

        <StatCard
          label="KEGIATAN TERLAKSANA"
          value={`${summary.event_completion_pct}%`}
          sub={`${summary.completed_events} dari ${summary.total_events} Kegiatan Selesai`}
          tagIcon={<CheckCircle size={18} />}
          theme="default"
          pills={[
            { label: 'Selesai', value: summary.completed_events },
            { label: 'Belum', value: summary.pending_events },
          ]}
        />

        <StatCard
          label={displayCapaianLabel.toUpperCase()}
          value={`${displayCapaian}%`}
          sub={`Rata-rata total UKM: ${summary.avg_program_achievement}%`}
          tagIcon={<TrendingUp size={18} />}
          theme="amber"
          pills={[
            { label: 'Target', value: '100%' },
            { label: 'Divisi', value: workspace },
          ]}
        />

        <StatCard
          label="TIME SCHEDULE & AGENDA"
          value={summary.total_schedules}
          unit="Agenda"
          sub={`${summary.done_schedules} Tugas Selesai Dikerjakan`}
          tagIcon={<CalendarCheck size={18} />}
          theme="violet"
          pills={[
            { label: 'Selesai', value: summary.done_schedules },
            { label: 'Pending', value: summary.pending_schedules },
          ]}
        />
      </div>

      {/* 3. Visual Charts Section: Recharts Area/Bar on Left & Recharts Donut on Right */}
      <div className="grid g21 mt">
        {/* Left Card: Recharts Visual Capaian Proker */}
        <div className="card">
          <div className="cardhead" style={{ padding: '0 0 16px' }}>
            <div>
              <h3>Grafik Capaian Program Kerja</h3>
              <div className="sub">Visualisasi progres capaian program divisi {workspace}</div>
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                className={`btn sm icon ${chartView === 'area' ? 'primary' : ''}`}
                onClick={() => setChartView('area')}
                title="Tampilan Grafik Garis & Area"
                aria-label="Tampilan Area"
              >
                <LineChartIcon size={14} />
              </button>
              <button
                type="button"
                className={`btn sm icon ${chartView === 'bar' ? 'primary' : ''}`}
                onClick={() => setChartView('bar')}
                title="Tampilan Diagram Batang"
                aria-label="Tampilan Bar"
              >
                <BarChart3 size={14} />
              </button>
              <Link href="/work-programs" className="btn sm" style={{ marginLeft: 8 }}>
                <span>Kelola</span>
                <ChevronRight size={13} />
              </Link>
            </div>
          </div>

          {prokerChartData.length === 0 ? (
            <div className="empty">Belum ada data program kerja untuk ditampilkan dalam grafik.</div>
          ) : (
            <div style={{ width: '100%', height: 230 }}>
              <ResponsiveContainer width="100%" height="100%">
                {chartView === 'area' ? (
                  <AreaChart data={prokerChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#e8a90c" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#f7cf55" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#7d6d4a', fontSize: 11, fontWeight: 600 }}
                      axisLine={{ stroke: '#f1e6c8' }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: '#7d6d4a', fontSize: 11 }}
                      axisLine={{ stroke: '#f1e6c8' }}
                      tickLine={false}
                      unit="%"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="progress"
                      stroke="#e8a90c"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#goldGradient)"
                      activeDot={{ r: 6, fill: '#3b2a05', stroke: '#e8a90c', strokeWidth: 2 }}
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={prokerChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#7d6d4a', fontSize: 11, fontWeight: 600 }}
                      axisLine={{ stroke: '#f1e6c8' }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: '#7d6d4a', fontSize: 11 }}
                      axisLine={{ stroke: '#f1e6c8' }}
                      tickLine={false}
                      unit="%"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="progress"
                      fill="#e8a90c"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}

          {/* Micro Progress Rows */}
          <div style={{ marginTop: 14, borderTop: '1px dashed var(--line)', paddingTop: 10 }}>
            {summary.program_stats.slice(0, 3).map((wp) => (
              <div key={wp.id} className="rowbar">
                <div>
                  <span className="t" title={wp.name}>
                    {wp.name}
                  </span>
                  <small style={{ color: 'var(--muted)', display: 'block', fontSize: 11 }}>
                    PIC: {wp.pic_name || '-'} • {wp.status}
                  </small>
                </div>
                <div className="bar">
                  <span style={{ width: `${wp.progress_pct}%` }} />
                </div>
                <b>{wp.progress_pct}%</b>
              </div>
            ))}
          </div>
        </div>

        {/* Right Card: Recharts Donut Status Proker */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3>Status Program Kerja</h3>
            <div className="sub">Rasio distribusi status divisi {workspace}</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any) => [`${val} Proker`, name]}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Inner Donut Text */}
            <div
              style={{
                position: 'absolute',
                textAlign: 'center',
                pointerEvents: 'none',
              }}
            >
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>
                {totalStatus}
              </div>
              <small style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: 1 }}>
                PROKER
              </small>
            </div>
          </div>

          <div className="legend" style={{ borderTop: '1px solid var(--line)', paddingTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <i style={{ background: '#1d7a3a' }} />
                <span>Terlaksana</span>
              </div>
              <b>{terlaksanaCount}</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <i style={{ background: '#e8a90c' }} />
                <span>Berjalan</span>
              </div>
              <b>{berjalanCount}</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <i style={{ background: '#f1e6c8' }} />
                <span>Belum Terlaksana</span>
              </div>
              <b>{belumCount}</b>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Agenda Kegiatan Terdekat & Tugas Terdekat (Double Card Row) */}
      <div className="grid g2 mt">
        {/* Left: Agenda Kegiatan Terdekat */}
        <div className="card">
          <div className="cardhead" style={{ padding: '0 0 14px' }}>
            <div>
              <h3>Agenda Kegiatan Terdekat</h3>
              <div className="sub">Event, turnamen, dan seremoni UKM SENIOR</div>
            </div>
            <Link href="/events" className="link" style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span>Daftar Lengkap</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>

          <ul className="list">
            {summary.upcoming_events.length === 0 ? (
              <li className="empty">Tidak ada kegiatan terdekat.</li>
            ) : (
              summary.upcoming_events.map((ev) => (
                <li key={ev.id}>
                  <div className="datebox">
                    <b>{ev.event_date.split(' ')[0]}</b>
                    <small>{ev.event_date.split(' ')[1]?.substring(0, 3)}</small>
                  </div>
                  <div className="body">
                    <b>{ev.name}</b>
                    <small>
                      Unit: {ev.unit} • {ev.event_type} • Kontak: {ev.contact}
                    </small>
                  </div>
                  <div>
                    <Badge status={ev.status} />
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Right: Tugas & Time Schedule Terdekat */}
        <div className="card">
          <div className="cardhead" style={{ padding: '0 0 14px' }}>
            <div>
              <h3>Tugas & Checklist Terdekat</h3>
              <div className="sub">Centang langsung untuk memperbarui status di database</div>
            </div>
            <Link href="/schedules" className="link" style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span>Kalender</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>

          <ul className="list">
            {summary.upcoming_tasks.length === 0 ? (
              <li className="empty">Tidak ada tugas terdekat.</li>
            ) : (
              summary.upcoming_tasks.map((task) => (
                <li key={task.id} className={task.is_done ? 'done' : ''}>
                  <input
                    type="checkbox"
                    className="tick"
                    checked={task.is_done}
                    onChange={() => handleToggleTask(task.id)}
                    aria-label={`Tandai selesai tugas ${task.title}`}
                  />
                  <div className="body">
                    <b style={{ textDecoration: task.is_done ? 'line-through' : 'none', color: task.is_done ? 'var(--muted)' : 'inherit' }}>
                      {task.title}
                    </b>
                    <small>
                      {task.stage} • PIC: {task.pic_name} • Deadline: {task.deadline_date}
                    </small>
                  </div>
                  <div>
                    <Badge status={task.status} />
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {/* 5. Unit Events Distribution Strip */}
      <div className="card mt">
        <div className="cardhead" style={{ padding: '0 0 12px' }}>
          <div>
            <h3>Distribusi Kegiatan per Unit</h3>
            <div className="sub">Jumlah partisipasi dan agenda lomba olahraga & seni UKM SENIOR</div>
          </div>
        </div>

        <div className="split">
          {Object.entries(summary.unit_events_summary).map(([unit, count]) => (
            <span key={unit} className="pill" style={{ fontSize: 13, padding: '7px 16px', background: 'var(--panel2)' }}>
              Unit {unit}: <b>{count} Acara</b>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
