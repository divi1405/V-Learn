'use client';
import '../globals.css';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [enrollments, setEnrollments] = useState([]);
    const [paths, setPaths] = useState([]);
    const [badges, setBadges] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const u = api.getUser();
        if (!u) { router.push('/login'); return; }
        setUser(u);
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [enrollData, pathData, notifData, badgeData, recData] = await Promise.all([
                api.get('/enrollments'),
                api.get('/learning-paths'),
                api.get('/analytics/notifications'),
                api.get('/badges/').catch(() => []),
                api.get('/recommendations').catch(() => []),
            ]);
            setEnrollments(enrollData);
            setPaths(pathData);
            setNotifications(notifData);
            setBadges(badgeData);
            setRecommendations(recData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!user || loading) {
        return <div className="loading-page"><div className="spinner"></div></div>;
    }

    const inProgress = enrollments.filter(e => e.status === 'in_progress');
    const completed = enrollments.filter(e => e.status === 'completed');
    const lastCourse = inProgress[0];
    const assignedCourses = enrollments.filter(e => e.assigned_by);
    const selfCourses = enrollments.filter(e => !e.assigned_by);

    const renderCourseCard = (e) => (
        <div key={e.id} className="card" style={{ cursor: 'pointer' }} onClick={() => router.push(`/courses/${e.course_id}`)}>
            <div style={{ height: 6, background: e.status === 'completed' ? 'linear-gradient(90deg, #00c853, #00e676)' : 'var(--gradient)', margin: '-24px -24px 16px -24px', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <span style={{ fontSize: '1.5rem' }}>🤖</span>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, flex: 1 }}>{e.course?.title}</h3>
                {e.status === 'completed' && <span className="badge badge-success">✓ Done</span>}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 12 }}>{e.course?.description?.substring(0, 100)}...</p>
            <div className="progress-bar" style={{ marginBottom: 8 }}>
                <div className="progress-fill" style={{ width: `${e.progress_pct}%`, background: e.status === 'completed' ? 'var(--success)' : undefined }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>{Math.round(e.progress_pct)}% complete</span>
                <span>⏱ {e.course?.duration_mins}m</span>
            </div>
        </div>
    );

    const getGreeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 17) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                {/* Hero */}
                <div className="hero-card">
                    <h2>{getGreeting()}, {user.name?.split(' ')[0]} 👋</h2>
                    <p>
                        {completed.length > 0
                            ? `You've completed ${completed.length} AI course${completed.length > 1 ? 's' : ''}. Keep learning!`
                            : 'Start your AI learning journey today!'}
                    </p>
                    {lastCourse && (
                        <div
                            className="card"
                            style={{ display: 'flex', alignItems: 'center', gap: 20, cursor: 'pointer', background: 'rgba(255,255,255,0.08)' }}
                            onClick={() => router.push(`/courses/${lastCourse.course_id}`)}
                        >
                            <div style={{ fontSize: '2rem' }}>🤖</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, marginBottom: 4 }}>{lastCourse.course?.title}</div>
                                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
                                    {Math.round(lastCourse.progress_pct)}% complete
                                </div>
                                <div className="progress-bar" style={{ background: 'rgba(255,255,255,0.2)' }}>
                                    <div className="progress-fill" style={{ width: `${lastCourse.progress_pct}%` }}></div>
                                </div>
                            </div>
                            <button className="btn btn-primary" style={{ background: 'white', color: '#0077b6' }}>Continue →</button>
                        </div>
                    )}
                </div>

                {/* Stats */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-value">{enrollments.length}</div>
                        <div className="stat-label">Enrolled Courses</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{completed.length}</div>
                        <div className="stat-label">Completed</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{inProgress.length}</div>
                        <div className="stat-label">In Progress</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{badges.length}</div>
                        <div className="stat-label">Badges Earned</div>
                    </div>
                </div>

                {/* Learning Paths */}
                {paths.length > 0 && (
                    <div>
                        <div className="section-header">
                            <h2>🛤️ AI Learning Paths</h2>
                            <a href="/learning-paths" className="btn btn-ghost btn-sm">View all →</a>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginBottom: 32 }}>
                            {paths.slice(0, 3).map((path) => {
                                const pathCourseIds = path.courses?.map(pc => pc.course_id) || [];
                                const myPathEnrollments = enrollments.filter(e => pathCourseIds.includes(e.course_id));
                                const pathCompleted = myPathEnrollments.filter(e => e.status === 'completed').length;
                                const pathTotal = pathCourseIds.length;
                                const pathPct = pathTotal > 0 ? Math.round((pathCompleted / pathTotal) * 100) : 0;

                                return (
                                    <div key={path.id} className="card" style={{ cursor: 'pointer' }} onClick={() => router.push('/learning-paths')}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{path.name}</h3>
                                            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: pathPct === 100 ? 'var(--success)' : 'var(--accent)' }}>{pathPct}%</span>
                                        </div>
                                        <div className="progress-bar" style={{ marginBottom: 8 }}>
                                            <div className="progress-fill" style={{ width: `${pathPct}%`, background: pathPct === 100 ? 'var(--success)' : undefined }}></div>
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            {pathCompleted}/{pathTotal} courses
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Enrolled Courses */}
                <div>
                    {enrollments.length === 0 ? (
                        <>
                            <div className="section-header">
                                <h2>📚 My AI Courses</h2>
                                <a href="/courses" className="btn btn-ghost btn-sm">Browse all →</a>
                            </div>
                            <div className="empty-state">
                                <div className="icon">📚</div>
                                <p>No courses yet. Browse our AI courses to get started!</p>
                                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => router.push('/courses')}>
                                    Browse AI Courses
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {assignedCourses.length > 0 && (
                                <div style={{ marginBottom: 32 }}>
                                    <div className="section-header">
                                        <h2>📌 Assigned by Manager</h2>
                                    </div>
                                    <div className="course-grid">
                                        {assignedCourses.map(renderCourseCard)}
                                    </div>
                                </div>
                            )}

                            {selfCourses.length > 0 && (
                                <div style={{ marginBottom: 32 }}>
                                    <div className="section-header">
                                        <h2>📚 My Explored Courses</h2>
                                        <a href="/courses" className="btn btn-ghost btn-sm">Browse all →</a>
                                    </div>
                                    <div className="course-grid">
                                        {selfCourses.map(renderCourseCard)}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Recommendations */}
                {recommendations.length > 0 && (
                    <div style={{ marginTop: 32 }}>
                        <div className="section-header">
                            <h2>✨ Recommended for You</h2>
                            <a href="/courses" className="btn btn-ghost btn-sm">Browse all →</a>
                        </div>
                        <div className="course-grid">
                            {recommendations.slice(0, 3).map((c) => (
                                <div
                                    key={c.id}
                                    className="card"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => router.push(`/courses/${c.id}`)}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                        <span style={{ fontSize: '1.5rem' }}>✨</span>
                                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, flex: 1 }}>{c.title}</h3>
                                    </div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                                        {c.description?.substring(0, 100)}...
                                    </p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                        <span className="badge badge-info">{c.category}</span>
                                        <span style={{ color: 'var(--text-muted)' }}>⏱ {c.duration_mins}m</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Notifications */}
                {notifications.length > 0 && (
                    <div style={{ marginTop: 32 }}>
                        <div className="section-header">
                            <h2>🔔 Notifications</h2>
                        </div>
                        <div className="card" style={{ padding: 0 }}>
                            {notifications.slice(0, 5).map((n) => (
                                <div key={n.id} className="notification-item" style={{ padding: '14px 20px' }}>
                                    {!n.read && <div className="notification-dot" />}
                                    <div style={{ flex: 1, fontSize: '0.85rem' }}>{n.message}</div>
                                    {!n.read && <span className="badge badge-info">New</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
