'use client';
import '../../globals.css';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';

export default function TeamProgressPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [teamProgress, setTeamProgress] = useState([]);
    const [portcoGroups, setPortcoGroups] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedPortco, setSelectedPortco] = useState('All');
    const [search, setSearch] = useState('');
    const [expandedMember, setExpandedMember] = useState(null);
    const [memberEnrollments, setMemberEnrollments] = useState({});

    useEffect(() => {
        const u = api.getUser();
        if (!u) { router.push('/login'); return; }
        if (u.role !== 'MANAGER' && !['ADMIN', 'HR_ADMIN'].includes(u.role)) {
            router.push('/dashboard');
            return;
        }
        setUser(u);
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [teamData, portcoData] = await Promise.all([
                api.get('/manager/team-progress'),
                api.get('/manager/portco-employees'),
            ]);
            setTeamProgress(teamData);
            setPortcoGroups(portcoData);
        } finally {
            setLoading(false);
        }
    };

    const toggleMember = async (memberId) => {
        if (expandedMember === memberId) {
            setExpandedMember(null);
            return;
        }
        setExpandedMember(memberId);
        if (!memberEnrollments[memberId]) {
            try {
                const enrollments = await api.get(`/manager/employee/${memberId}/enrollments`);
                setMemberEnrollments(prev => ({ ...prev, [memberId]: enrollments }));
            } catch {
                setMemberEnrollments(prev => ({ ...prev, [memberId]: [] }));
            }
        }
    };

    if (!user || loading) {
        return <div className="loading-page"><div className="spinner"></div></div>;
    }

    const portcos = ['All', ...Object.keys(portcoGroups)];
    const memberPortcoMap = {};
    Object.entries(portcoGroups).forEach(([portco, members]) => {
        members.forEach(m => { memberPortcoMap[m.id] = portco; });
    });

    const filtered = teamProgress.filter(mp => {
        const matchPortco = selectedPortco === 'All' || memberPortcoMap[mp.user.id] === selectedPortco;
        const matchSearch = !search || mp.user.name.toLowerCase().includes(search.toLowerCase())
            || (mp.user.designation || '').toLowerCase().includes(search.toLowerCase());
        return matchPortco && matchSearch;
    });

    const getStatusColor = (pct) => {
        if (pct >= 80) return '#00c853';
        if (pct >= 40) return '#ffa000';
        return '#e53935';
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="section-header">
                    <h2>📊 Team Progress Tracker</h2>
                    <button className="btn btn-primary btn-sm" onClick={() => router.push('/manager/assign-course')}>
                        + Assign Course
                    </button>
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                    <div className="search-wrapper" style={{ flex: 1, minWidth: 200, maxWidth: 'none' }}>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search team members..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        <span className="search-icon">🔍</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {portcos.map(p => (
                            <button
                                key={p}
                                className={`btn btn-sm ${selectedPortco === p ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setSelectedPortco(p)}
                            >{p}</button>
                        ))}
                    </div>
                </div>

                {/* Team Cards */}
                {filtered.length === 0 ? (
                    <div className="empty-state">
                        <div className="icon">👥</div>
                        <p>No team members found.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {filtered.map(mp => {
                            const isExpanded = expandedMember === mp.user.id;
                            const enrollments = memberEnrollments[mp.user.id] || [];
                            const portco = memberPortcoMap[mp.user.id] || 'Unassigned';
                            return (
                                <div key={mp.user.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                    <div
                                        style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }}
                                        onClick={() => toggleMember(mp.user.id)}
                                    >
                                        {/* Avatar */}
                                        <div style={{
                                            width: 44, height: 44, borderRadius: '50%',
                                            background: 'var(--gradient)', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center',
                                            fontSize: '1.1rem', fontWeight: 700, color: '#fff', flexShrink: 0
                                        }}>{mp.user.name?.[0]}</div>

                                        {/* Info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 700, marginBottom: 2 }}>{mp.user.name}</div>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                {mp.user.designation || mp.user.department} · 📍 {portco}
                                            </div>
                                        </div>

                                        {/* Progress */}
                                        <div style={{ textAlign: 'center', minWidth: 80 }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                                                {mp.courses_completed}/{mp.courses_assigned} courses
                                            </div>
                                            <div style={{
                                                height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden'
                                            }}>
                                                <div style={{
                                                    height: '100%', width: `${mp.completion_pct}%`,
                                                    background: getStatusColor(mp.completion_pct),
                                                    borderRadius: 3, transition: 'width 0.4s'
                                                }} />
                                            </div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: getStatusColor(mp.completion_pct), marginTop: 2 }}>
                                                {mp.completion_pct}%
                                            </div>
                                        </div>

                                        {/* Last active */}
                                        <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: 90 }}>
                                            {mp.last_active
                                                ? new Date(mp.last_active).toLocaleDateString()
                                                : 'No activity yet'}
                                        </div>
                                        <span style={{ fontSize: '0.9rem' }}>{isExpanded ? '▲' : '▼'}</span>
                                    </div>

                                    {isExpanded && (
                                        <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border)' }}>
                                            <div style={{ paddingTop: 16, display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => router.push(`/manager/assign-course?employee=${mp.user.id}`)}
                                                >
                                                    + Assign Course
                                                </button>
                                            </div>
                                            {enrollments.length === 0 ? (
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No courses assigned yet.</div>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                    {enrollments.map(e => (
                                                        <div key={e.id} style={{
                                                            display: 'flex', alignItems: 'center', gap: 12,
                                                            padding: '8px 12px', background: 'var(--bg)',
                                                            borderRadius: 'var(--radius)', fontSize: '0.85rem'
                                                        }}>
                                                            <span style={{ fontSize: '1.2rem' }}>📘</span>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ fontWeight: 600 }}>{e.course?.title}</div>
                                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                                                    {Math.round(e.progress_pct)}% complete
                                                                </div>
                                                            </div>
                                                            <span className={`badge ${e.status === 'completed' ? 'badge-success' : e.status === 'in_progress' ? 'badge-info' : ''}`}>
                                                                {e.status?.replace('_', ' ')}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
