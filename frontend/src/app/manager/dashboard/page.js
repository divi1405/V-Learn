'use client';
import '../../globals.css';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { UserIcon, UsersIcon, StarIcon, ClipboardIcon, BarChartIcon, BookIcon, BotIcon } from '@/components/Icons';

const MAX_AVATARS = 4;

const tooltipStyles = {
    position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)',
    background: 'var(--text-primary)', color: '#fff', padding: '4px 8px',
    borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, whiteSpace: 'nowrap',
    pointerEvents: 'none', opacity: 0, transition: 'opacity 0.15s',
    zIndex: 100,
};

function AvatarIcon({ name, image, index, total }) {
    const [hover, setHover] = useState(false);
    return (
        <div
            onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
            style={{
                width: 30, height: 30, borderRadius: '50%',
                background: (image && image !== 'null') ? 'transparent' : '#400F61', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                backgroundImage: (image && image !== 'null') ? `url(${image})` : 'none',
                backgroundSize: 'cover', backgroundPosition: 'center',
                fontSize: '0.7rem', fontWeight: 700, color: '#fff',
                border: '2px solid #fff', marginLeft: index > 0 ? '-8px' : '0',
                zIndex: total - index, position: 'relative', cursor: 'default', flexShrink: 0,
            }}
        >
            {!(image && image !== 'null') && name?.[0]?.toUpperCase()}
            <div style={{ ...tooltipStyles, opacity: hover ? 1 : 0 }}>{name}</div>
        </div>
    );
}

export default function ManagerDashboard() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [teamProgress, setTeamProgress] = useState([]);
    const [portcoGroups, setPortcoGroups] = useState({});
    const [myEnrollments, setMyEnrollments] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [assignedCourses, setAssignedCourses] = useState([]);
    const [badges, setBadges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPortco, setSelectedPortco] = useState(null);
    const [showMembersModal, setShowMembersModal] = useState(null);

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
            const [teamData, portcoData, enrollData, recData, assignedCoursesData, badgesData] = await Promise.all([
                api.get('/manager/team-progress'),
                api.get('/manager/portco-employees'),
                api.get('/enrollments'),
                api.get('/recommendations').catch(() => []),
                api.get('/manager/assigned-courses').catch(() => []),
                api.get('/badges/').catch(() => []),
            ]);
            setTeamProgress(teamData);
            setPortcoGroups(portcoData);
            setMyEnrollments(enrollData);
            setRecommendations(recData);
            setAssignedCourses(assignedCoursesData || []);
            setBadges(badgesData || []);
        } catch (err) {
            console.error('Manager data load error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!user || loading) {
        return <div className="loading-page"><div className="spinner"></div></div>;
    }

    const inProgressLearner = myEnrollments.filter(e => e.status === 'in_progress').length;
    const completedLearner = myEnrollments.filter(e => e.status === 'completed').length;
    const totalEnrolledLearner = myEnrollments.length;
    const totalBadgesLearner = badges.length;

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content" style={{ padding: 0 }}>
                <Header />
                <div style={{ padding: '24px' }}>
                    {/* Hero */}
                    <div className="hero-card">
                        <h2 className="vearc-page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                            Welcome back, {user.name?.split(' ')[0]} <UserIcon style={{ color: 'var(--vearc-primary)' }} width="28" height="28" />
                        </h2>
                        <p>Manage your team's learning journey and track their progress.</p>
                    </div>

                    {/* Stats */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-value">{totalEnrolledLearner}</div>
                            <div className="stat-label">Enrolled Courses</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{completedLearner}</div>
                            <div className="stat-label">Completed</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{inProgressLearner}</div>
                            <div className="stat-label">In Progress</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{totalBadgesLearner}</div>
                            <div className="stat-label">Badges Earned</div>
                        </div>
                    </div>

                    {/* My Courses */}
                    {myEnrollments.length > 0 && (
                        <div style={{ marginTop: 32 }}>
                            <div className="section-header">
                                <h2 className="vearc-page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <BookIcon style={{ color: 'var(--vearc-primary)' }} width="28" height="28" /> My Courses
                                </h2>
                                <a href="/courses" className="btn-underline">Browse all</a>
                            </div>
                            <div className="course-grid">
                                {myEnrollments.slice(0, 2).map(e => (
                                    <div key={e.id} className="card" style={{ cursor: 'pointer' }}
                                        onClick={() => router.push(`/courses/${e.course_id}`)}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
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

                    {/* Quick Actions */}
                    <div style={{ marginTop: 32 }}>
                        <div className="section-header">
                            <h2 className="vearc-page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <StarIcon style={{ color: 'var(--vearc-primary)' }} width="28" height="28" /> Quick Actions
                            </h2>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
                            <div className="card" style={{ cursor: 'pointer', textAlign: 'center' }} onClick={() => router.push('/manager/assign-course')}>
                                <div style={{ color: 'var(--vearc-primary)', marginBottom: '8px', display: 'flex', justifyContent: 'center' }}><ClipboardIcon width="32" height="32" /></div>
                                <div style={{ fontWeight: 700 }}>Assign Course</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>Assign learning to a team member</div>
                            </div>
                            <div className="card" style={{ cursor: 'pointer', textAlign: 'center' }} onClick={() => router.push('/manager/team')}>
                                <div style={{ color: 'var(--vearc-primary)', marginBottom: '8px', display: 'flex', justifyContent: 'center' }}><BarChartIcon width="32" height="32" /></div>
                                <div style={{ fontWeight: 700 }}>Team Progress</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>Detailed progress tracker</div>
                            </div>
                            <div className="card" style={{ cursor: 'pointer', textAlign: 'center' }} onClick={() => router.push('/courses')}>
                                <div style={{ color: 'var(--vearc-primary)', marginBottom: '8px', display: 'flex', justifyContent: 'center' }}><BookIcon width="32" height="32" /></div>
                                <div style={{ fontWeight: 700 }}>Browse Courses</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>Explore all available courses</div>
                            </div>
                        </div>
                    </div>

                    {/* Assigned Courses Overview */}
                    {assignedCourses && assignedCourses.length > 0 && (
                        <div style={{ marginTop: 32, marginBottom: 32 }}>
                            <div className="section-header">
                                <h2 className="vearc-page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <ClipboardIcon style={{ color: 'var(--vearc-primary)' }} width="28" height="28" /> Assigned Courses Overview
                                </h2>
                                <a href="/manager/assigned-courses" className="btn-underline">View all details</a>
                            </div>
                            <div className="course-grid">
                                {assignedCourses.slice(0, 2).map(ac => {
                                    const visibleAvatars = ac.assignments.slice(0, MAX_AVATARS);
                                    const extraCount = ac.assignments.length - MAX_AVATARS;
                                    return (
                                        <div key={ac.course_id} className="card" style={{ cursor: 'pointer' }}
                                            onClick={() => router.push('/manager/assigned-courses')}>
                                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 8 }}>{ac.course}</h3>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                                                Assigned to {ac.assignments.length} team member{ac.assignments.length !== 1 ? 's' : ''}
                                            </div>

                                            {/* Profile Avatars */}
                                            {ac.assignments.length > 0 && (
                                                <div style={{ display: 'flex', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                                                    {visibleAvatars.map((a, i) => (
                                                        <AvatarIcon key={a.user_id} name={a.user_name} image={a.user_image} index={i} total={MAX_AVATARS} />
                                                    ))}
                                                    {extraCount > 0 && (
                                                        <div
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setShowMembersModal({ course: ac.course, members: ac.assignments });
                                                            }}
                                                            style={{
                                                                width: 30, height: 30, borderRadius: '50%',
                                                                background: 'var(--bg-surface)', display: 'flex',
                                                                alignItems: 'center', justifyContent: 'center',
                                                                fontSize: '0.65rem', fontWeight: 700, color: 'var(--vearc-primary)',
                                                                border: '2px solid #fff', marginLeft: '-8px',
                                                                zIndex: 0, position: 'relative', cursor: 'pointer', flexShrink: 0,
                                                            }}
                                                        >
                                                            +{extraCount}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Recommended for Manager */}
                    {recommendations.length > 0 && (
                        <div>
                            <div className="section-header">
                                <h2 className="vearc-page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <StarIcon style={{ color: 'var(--vearc-primary)' }} width="28" height="28" /> Recommended for You
                                </h2>
                            </div>
                            <div className="course-grid">
                                {recommendations.slice(0, 2).map(c => (
                                    <div key={c.id} className="card" style={{ cursor: 'pointer' }}
                                        onClick={() => router.push(`/courses/${c.id}`)}>
                                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 6 }}>{c.title}</h3>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                                            {c.description?.substring(0, 90)}...
                                        </p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            <span className="badge badge-info">{c.category}</span>
                                            <span>⏱ {c.duration_mins ? (c.duration_mins < 60 ? `${c.duration_mins}m` : (c.duration_mins / 60).toFixed(1).replace('.0', '') + 'h') : ''}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Members Modal */}
                    {showMembersModal && (
                        <div className="modal-overlay" onClick={() => setShowMembersModal(null)}>
                            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '70vh', overflow: 'auto' }}>
                                <h2 style={{ marginBottom: '16px' }}>Members: {showMembersModal.course}</h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {showMembersModal.members.map((m) => (
                                        <div key={m.user_id} style={{
                                            display: 'flex', alignItems: 'center', gap: '12px',
                                            padding: '10px', background: 'var(--bg-surface)', borderRadius: 'var(--radius)',
                                        }}>
                                            <div style={{
                                                width: 32, height: 32, borderRadius: '50%',
                                                background: '#400F61', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center',
                                                fontSize: '0.85rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                                            }}>
                                                {m.user_name?.[0]?.toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{m.user_name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                                    Progress: {Math.round(m.progress_pct)}%
                                                </div>
                                            </div>
                                            <span className={`badge ${m.status === 'completed' ? 'badge-success' : m.status === 'in_progress' ? 'badge-info' : ''}`}>
                                                {m.status?.replace('_', ' ')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginTop: '16px', textAlign: 'right' }}>
                                    <button className="btn btn-secondary" onClick={() => setShowMembersModal(null)}>Close</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
