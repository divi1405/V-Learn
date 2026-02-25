'use client';
import '../../globals.css';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';

export default function ManagerDashboard() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [teamProgress, setTeamProgress] = useState([]);
    const [portcoGroups, setPortcoGroups] = useState({});
    const [myEnrollments, setMyEnrollments] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);

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
            const [teamData, portcoData, enrollData, recData] = await Promise.all([
                api.get('/manager/team-progress'),
                api.get('/manager/portco-employees'),
                api.get('/enrollments'),
                api.get('/recommendations').catch(() => []),
            ]);
            setTeamProgress(teamData);
            setPortcoGroups(portcoData);
            setMyEnrollments(enrollData);
            setRecommendations(recData);
        } catch (err) {
            console.error('Manager data load error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!user || loading) {
        return <div className="loading-page"><div className="spinner"></div></div>;
    }

    const totalTeam = teamProgress.length;
    const avgCompletion = totalTeam > 0
        ? Math.round(teamProgress.reduce((s, m) => s + m.completion_pct, 0) / totalTeam)
        : 0;
    const totalAssignments = teamProgress.reduce((s, m) => s + m.courses_assigned, 0);
    const totalCompleted = teamProgress.reduce((s, m) => s + m.courses_completed, 0);

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                {/* Hero */}
                <div className="hero-card">
                    <h2>Welcome back, {user.name?.split(' ')[0]} 👔</h2>
                    <p>Manage your team's learning journey and track their progress.</p>
                </div>

                {/* Stats */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-value">{totalTeam}</div>
                        <div className="stat-label">Team Members</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{avgCompletion}%</div>
                        <div className="stat-label">Avg. Completion</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{totalAssignments}</div>
                        <div className="stat-label">Total Assignments</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{totalCompleted}</div>
                        <div className="stat-label">Courses Completed</div>
                    </div>
                </div>

                {/* Team by Portco */}
                {Object.keys(portcoGroups).length > 0 && (
                    <div>
                        <div className="section-header">
                            <h2>🏢 Team by PortCo / Division</h2>
                            <button className="btn btn-ghost btn-sm" onClick={() => router.push('/manager/team')}>
                                Full progress →
                            </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>
                            {Object.entries(portcoGroups).map(([portco, members]) => (
                                <div key={portco} className="card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>📍 {portco}</h3>
                                        <span className="badge badge-info">{members.length} people</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        {members.slice(0, 4).map(m => (
                                            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem' }}>
                                                <div style={{
                                                    width: 28, height: 28, borderRadius: '50%',
                                                    background: 'var(--gradient)', display: 'flex',
                                                    alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '0.75rem', fontWeight: 700, color: '#fff', flexShrink: 0
                                                }}>{m.name?.[0]}</div>
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{m.name}</div>
                                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{m.designation || m.department}</div>
                                                </div>
                                            </div>
                                        ))}
                                        {members.length > 4 && (
                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                                +{members.length - 4} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="section-header">
                    <h2>⚡ Quick Actions</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
                    <div className="card" style={{ cursor: 'pointer', textAlign: 'center' }} onClick={() => router.push('/manager/assign-course')}>
                        <div style={{ fontSize: '2rem', marginBottom: 8 }}>📋</div>
                        <div style={{ fontWeight: 700 }}>Assign Course</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>Assign learning to a team member</div>
                    </div>
                    <div className="card" style={{ cursor: 'pointer', textAlign: 'center' }} onClick={() => router.push('/manager/team')}>
                        <div style={{ fontSize: '2rem', marginBottom: 8 }}>📊</div>
                        <div style={{ fontWeight: 700 }}>Team Progress</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>Detailed progress tracker</div>
                    </div>
                    <div className="card" style={{ cursor: 'pointer', textAlign: 'center' }} onClick={() => router.push('/courses')}>
                        <div style={{ fontSize: '2rem', marginBottom: 8 }}>📚</div>
                        <div style={{ fontWeight: 700 }}>Browse Courses</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>Explore all available courses</div>
                    </div>
                </div>

                {/* Recommended for Manager */}
                {recommendations.length > 0 && (
                    <div>
                        <div className="section-header">
                            <h2>✨ Recommended for You</h2>
                        </div>
                        <div className="course-grid">
                            {recommendations.slice(0, 3).map(c => (
                                <div key={c.id} className="card" style={{ cursor: 'pointer' }}
                                    onClick={() => router.push(`/courses/${c.id}`)}>
                                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 6 }}>{c.title}</h3>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                                        {c.description?.substring(0, 90)}...
                                    </p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        <span className="badge badge-info">{c.category}</span>
                                        <span>⏱ {c.duration_mins}m</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* My Courses */}
                {myEnrollments.length > 0 && (
                    <div style={{ marginTop: 32 }}>
                        <div className="section-header">
                            <h2>📚 My Courses</h2>
                            <a href="/courses" className="btn btn-ghost btn-sm">Browse all →</a>
                        </div>
                        <div className="course-grid">
                            {myEnrollments.slice(0, 3).map(e => (
                                <div key={e.id} className="card" style={{ cursor: 'pointer' }}
                                    onClick={() => router.push(`/courses/${e.course_id}`)}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                        <span style={{ fontSize: '1.5rem' }}>🤖</span>
                                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, flex: 1 }}>{e.course?.title}</h3>
                                        {e.status === 'completed' && <span className="badge badge-success">✓ Done</span>}
                                    </div>
                                    <div className="progress-bar">
                                        <div className="progress-fill" style={{ width: `${e.progress_pct}%` }}></div>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
                                        {Math.round(e.progress_pct)}% complete
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
