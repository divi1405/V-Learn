'use client';
import '../globals.css';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { HomeIcon, BookIcon, BellIcon, ArrowRightIcon, UsersIcon } from '@/components/Icons';

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [enrollments, setEnrollments] = useState([]);

    const [badges, setBadges] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const u = api.getUser();
        if (!u) { router.push('/login'); return; }
        setUser(u);
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [enrollData, notifData, badgeData] = await Promise.all([
                api.get('/enrollments'),
                api.get('/analytics/notifications'),
                api.get('/badges/me').catch(() => []),
            ]);
            setEnrollments(enrollData);
            setNotifications(notifData);
            setBadges(badgeData);
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>

                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, flex: 1 }}>{e.course?.title}</h3>
                {e.status === 'completed' && <span className="badge badge-success">Done</span>}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--vearc-text-secondary)', marginBottom: 12 }}>{e.course?.description?.substring(0, 100)}...</p>
            <div className="progress-bar" style={{ marginBottom: 8 }}>
                <div className="progress-fill" style={{ width: `${e.progress_pct}%`, background: e.status === 'completed' ? 'var(--vearc-success)' : undefined }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--vearc-text-muted)' }}>
                <span>{Math.round(e.progress_pct)}% complete</span>
                <span>⏱ {e.course?.duration_mins ? (e.course.duration_mins < 60 ? `${e.course.duration_mins}m` : (e.course.duration_mins / 60).toFixed(1).replace('.0', '') + 'h') : ''}</span>
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
            <main className="main-content" style={{ padding: 0 }}>
                <Header />
                <div style={{ padding: '24px' }}>
                    {/* Hero */}
                    <div className="hero-card">
                        <h2 className="vearc-page-title">{getGreeting()}, {user.name?.split(' ')[0]} </h2>
                        <p>Track your learning progress and explore new courses.</p>
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

                    {/* Earned Badges Section */}
                    {badges.length > 0 && (
                        <div style={{ marginTop: 32, marginBottom: 32 }}>
                            <div className="section-header">
                                <h2 className="vearc-page-title">🏆 My Badges</h2>
                            </div>
                            <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 }}>
                                {badges.map(b => (
                                    <div key={b.id} className="card" style={{ minWidth: 200, textAlign: 'center', padding: '24px 16px', borderTop: `4px solid ${b.level === 'bronze' ? '#cd7f32' : b.level === 'silver' ? '#c0c0c0' : b.level === 'gold' ? '#ffd700' : '#333'}` }}>
                                        <div style={{ fontSize: '2rem', marginBottom: 12, color: b.level === 'bronze' ? '#cd7f32' : b.level === 'silver' ? '#c0c0c0' : b.level === 'gold' ? '#ffd700' : '#333' }}>
                                            <BookIcon width="48" height="48" />
                                        </div>
                                        <h3 style={{ fontSize: '1.1rem', marginBottom: 8, textTransform: 'capitalize', color: '#1a1a1a' }}>{b.level} Badge</h3>
                                        <p style={{ fontSize: '0.85rem', color: '#4a4a4a', marginBottom: 8 }}>{b.title}</p>
                                        <div style={{ fontSize: '0.7rem', color: '#666' }}>{b.description}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Enrolled Courses */}
                    <div>
                        {enrollments.length === 0 ? (
                            <>
                                <div className="section-header">
                                    <h2 className="vearc-page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <BookIcon style={{ color: 'var(--vearc-primary)' }} width="28" height="28" /> My AI Courses
                                    </h2>
                                    <a href="/courses" className="btn-underline">Browse all</a>
                                </div>
                                <div className="empty-state">
                                    <div className="icon" style={{ color: 'var(--vearc-primary)', marginBottom: '16px' }}><BookIcon width="48" height="48" /></div>
                                    <p>No courses yet. Browse our AI courses to get started!</p>
                                    <button className="btn vearc-btn-primary" style={{ marginTop: 16 }} onClick={() => router.push('/courses')}>
                                        Browse AI Courses
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                {assignedCourses.length > 0 && (
                                    <div style={{ marginBottom: 32 }}>
                                        <div className="section-header">
                                            <h2 className="vearc-page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <BookIcon style={{ color: 'var(--vearc-primary)' }} width="28" height="28" /> Assigned by Manager
                                            </h2>
                                            <a href="/courses" className="btn-underline">Browse all</a>
                                        </div>
                                        <div className="course-grid">
                                            {assignedCourses.slice(0, 2).map(renderCourseCard)}
                                        </div>
                                    </div>
                                )}

                                {selfCourses.length > 0 && (
                                    <div style={{ marginBottom: 32 }}>
                                        <div className="section-header">
                                            <h2 className="vearc-page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <BookIcon style={{ color: 'var(--vearc-primary)' }} width="28" height="28" /> My Explored Courses
                                            </h2>
                                            <a href="/courses" className="btn-underline">Browse all</a>
                                        </div>
                                        <div className="course-grid">
                                            {selfCourses.slice(0, 2).map(renderCourseCard)}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                </div>
            </main>
        </div>
    );
}




