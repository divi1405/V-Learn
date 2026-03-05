'use client';
import '../../globals.css';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { BarChartIcon, UsersIcon, SearchIcon, BookIcon, MapIcon, ChevronUpIcon, ChevronDownIcon } from '@/components/Icons';

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
        if (pct >= 80) return 'var(--vearc-success)';
        if (pct >= 40) return 'var(--vearc-primary)';
        return 'var(--vearc-danger)';
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content" style={{ padding: 0 }}>
                <Header />
                <div style={{ padding: '24px' }}>
                    <div className="section-header">
                        <h2 className="vearc-page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                            <BarChartIcon style={{ color: 'var(--vearc-primary)' }} width="28" height="28" /> Team Progress Tracker
                        </h2>
                        <button className="btn vearc-btn-primary btn-sm" onClick={() => router.push('/manager/assign-course')}>
                            + Assign Course
                        </button>
                    </div>

                    {/* Filters */}
                    <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                        <div className="search-wrapper" style={{ flex: 1, minWidth: 200, maxWidth: 'none' }}>
                            <span className="search-icon">
                                <SearchIcon width="16" height="16" />
                            </span>
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search team members..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {portcos.map(p => (
                                <button
                                    key={p}
                                    className={`btn btn-sm ${selectedPortco === p ? 'vearc-btn-primary' : 'btn-ghost'}`}
                                    onClick={() => setSelectedPortco(p)}
                                >{p}</button>
                            ))}
                        </div>
                    </div>

                    {/* Team Cards */}
                    {filtered.length === 0 ? (
                        <div className="empty-state">
                            <div className="icon" style={{ color: 'var(--vearc-primary)', marginBottom: '16px' }}><UsersIcon width="48" height="48" /></div>
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
                                                background: 'var(--vearc-primary)', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center',
                                                fontSize: '1.1rem', fontWeight: 700, color: 'var(--vearc-surface)', flexShrink: 0
                                            }}>{mp.user.name?.[0]}</div>

                                            {/* Info */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 700, marginBottom: 2 }}>{mp.user.name}</div>
                                                <div style={{ fontSize: '0.78rem', color: 'var(--vearc-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    {mp.user.designation || mp.user.department} <span style={{ margin: '0 4px' }}>·</span> {portco}
                                                </div>
                                            </div>

                                            {/* Progress */}
                                            <div style={{ textAlign: 'center', minWidth: 80 }}>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--vearc-text-muted)', marginBottom: 4 }}>
                                                    {mp.courses_completed}/{mp.courses_assigned} courses
                                                </div>
                                                <div style={{
                                                    height: 6, background: 'var(--vearc-border)', borderRadius: 3, overflow: 'hidden'
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
                                            <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--vearc-text-muted)', minWidth: 90 }}>
                                                {mp.last_active
                                                    ? new Date(mp.last_active).toLocaleDateString()
                                                    : 'No activity yet'}
                                            </div>
                                            <span style={{ fontSize: '0.9rem', color: 'var(--vearc-text-muted)' }}>
                                                {isExpanded ? <ChevronUpIcon width="16" height="16" /> : <ChevronDownIcon width="16" height="16" />}
                                            </span>
                                        </div>

                                        {isExpanded && (
                                            <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--vearc-border)' }}>
                                                <div style={{ paddingTop: 16, display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                                                    <button
                                                        className="btn vearc-btn-primary btn-sm"
                                                        onClick={() => router.push(`/manager/assign-course?employee=${mp.user.id}`)}
                                                    >
                                                        + Assign Course
                                                    </button>
                                                </div>
                                                {enrollments.length === 0 ? (
                                                    <div style={{ color: 'var(--vearc-text-muted)', fontSize: '0.85rem' }}>No courses assigned yet.</div>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                        {enrollments.map(e => (
                                                            <div key={e.id} style={{
                                                                display: 'flex', alignItems: 'center', gap: 12,
                                                                padding: '8px 12px', background: 'var(--bg)',
                                                                borderRadius: 'var(--radius)', fontSize: '0.85rem'
                                                            }}>
                                                                <span style={{ color: 'var(--vearc-primary)', display: 'flex', alignItems: 'center' }}><BookIcon width="20" height="20" /></span>
                                                                <div style={{ flex: 1 }}>
                                                                    <div style={{ fontWeight: 600 }}>{e.course?.title}</div>
                                                                    <div style={{ fontSize: '0.75rem', color: 'var(--vearc-text-muted)', marginTop: 2 }}>
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
                </div>
            </main>
        </div>
    );
}
