'use client';
import '../globals.css';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { SettingsIcon, UsersIcon, BookIcon, EditIcon, BarChartIcon, TargetIcon, TrophyIcon } from '@/components/Icons';

export default function AdminPage() {
    const [stats, setStats] = useState(null);
    const [deptStats, setDeptStats] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('department');
    const [courseEnrollees, setCourseEnrollees] = useState({});
    const [showEnrolleesModal, setShowEnrolleesModal] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [statsData, deptData, courseData] = await Promise.all([
                api.get('/analytics/dashboard-stats'),
                api.get('/analytics/department-stats'),
                api.get('/courses?status=published'),
            ]);
            setStats(statsData);
            setDeptStats(deptData);
            setCourses(courseData);

            // Load enrollees for course performance avatars
            try {
                const enrolleesData = await api.get('/courses/enrollees');
                setCourseEnrollees(enrolleesData || {});
            } catch (e) { console.error('Could not load enrollees:', e); }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const MAX_AVATARS = 4;

    const tooltipStyles = {
        position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)',
        background: 'var(--text-primary)', color: '#fff', padding: '4px 8px',
        borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, whiteSpace: 'nowrap',
        pointerEvents: 'none', zIndex: 100,
    };

    const AvatarIcon = ({ name, image, index }) => {
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
                    zIndex: MAX_AVATARS - index, position: 'relative', cursor: 'default',
                    flexShrink: 0,
                }}
            >
                {!(image && image !== 'null') && name?.[0]?.toUpperCase()}
                <div style={{ ...tooltipStyles, opacity: hover ? 1 : 0, transition: 'opacity 0.15s' }}>{name}</div>
            </div>
        );
    };

    const AvatarRow = ({ users, onMoreClick }) => {
        if (!users || users.length === 0) return null;
        const visible = users.slice(0, MAX_AVATARS);
        const extra = users.length - MAX_AVATARS;
        return (
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '12px' }}>
                {visible.map((u, i) => (
                    <AvatarIcon key={u.id || i} name={u.name} image={u.profile_image} index={i} />
                ))}
                {extra > 0 && (
                    <div
                        onClick={(e) => { e.stopPropagation(); onMoreClick(); }}
                        style={{
                            width: 30, height: 30, borderRadius: '50%',
                            background: 'var(--bg-surface)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.65rem', fontWeight: 700, color: 'var(--vearc-primary)',
                            border: '2px solid #fff', marginLeft: '-8px',
                            zIndex: 0, position: 'relative', cursor: 'pointer',
                            flexShrink: 0,
                        }}
                    >
                        +{extra}
                    </div>
                )}
            </div>
        );
    };

    if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content" style={{ padding: 0 }}>
                <Header />
                <div style={{ padding: '24px' }}>
                    <div className="page-header">
                        <h1 className="vearc-page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <SettingsIcon style={{ color: 'var(--vearc-primary)' }} width="32" height="32" /> Admin Dashboard
                        </h1>
                        <p style={{ marginTop: 0 }}>Platform-wide overview and management</p>
                    </div>

                    {/* Stats — 3×2 Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }} className="slide-up">
                        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ backgroundColor: 'var(--bg-surface)', padding: '12px', borderRadius: '12px', display: 'flex' }}>
                                <UsersIcon width="24" height="24" style={{ color: 'var(--vearc-primary)' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 600, lineHeight: 1.2, color: 'var(--text-primary)' }}>{stats?.total_users || 0}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Total Users</div>
                            </div>
                        </div>
                        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ backgroundColor: 'var(--bg-surface)', padding: '12px', borderRadius: '12px', display: 'flex' }}>
                                <BookIcon width="24" height="24" style={{ color: 'var(--vearc-primary)' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 600, lineHeight: 1.2, color: 'var(--text-primary)' }}>{stats?.total_courses || 0}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Published Courses</div>
                            </div>
                        </div>
                        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ backgroundColor: 'var(--bg-surface)', padding: '12px', borderRadius: '12px', display: 'flex' }}>
                                <EditIcon width="24" height="24" style={{ color: 'var(--vearc-primary)' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 600, lineHeight: 1.2, color: 'var(--text-primary)' }}>{stats?.total_enrollments || 0}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Total Enrollments</div>
                            </div>
                        </div>
                        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ backgroundColor: 'var(--bg-surface)', padding: '12px', borderRadius: '12px', display: 'flex' }}>
                                <BarChartIcon width="24" height="24" style={{ color: 'var(--vearc-primary)' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 600, lineHeight: 1.2, color: stats?.completion_rate >= 50 ? 'var(--success)' : 'var(--warning)' }}>
                                    {stats?.completion_rate || 0}%
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Completion Rate</div>
                            </div>
                        </div>
                        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ backgroundColor: 'var(--bg-surface)', padding: '12px', borderRadius: '12px', display: 'flex' }}>
                                <TargetIcon width="24" height="24" style={{ color: 'var(--vearc-primary)' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 600, lineHeight: 1.2, color: 'var(--text-primary)' }}>{stats?.active_learners || 0}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Active Learners (30d)</div>
                            </div>
                        </div>
                        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ backgroundColor: 'var(--bg-surface)', padding: '12px', borderRadius: '12px', display: 'flex' }}>
                                <TrophyIcon width="24" height="24" style={{ color: 'var(--vearc-primary)' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 600, lineHeight: 1.2, color: 'var(--text-primary)' }}>{stats?.certificates_issued || 0}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Certificates Issued</div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs — Department Breakdown / Course Performance */}
                    <div style={{ marginBottom: '16px', display: 'flex', gap: '0', borderBottom: '2px solid var(--border)' }}>
                        <button
                            onClick={() => setActiveTab('department')}
                            style={{
                                padding: '12px 24px', border: 'none', background: 'none', cursor: 'pointer',
                                fontSize: '0.95rem', fontWeight: activeTab === 'department' ? 700 : 500,
                                color: activeTab === 'department' ? 'var(--vearc-primary)' : 'var(--text-secondary)',
                                borderBottom: activeTab === 'department' ? '2px solid var(--vearc-primary)' : '2px solid transparent',
                                marginBottom: '-2px', transition: 'all 0.2s',
                            }}
                        >
                            Department Breakdown
                        </button>
                        <button
                            onClick={() => setActiveTab('course')}
                            style={{
                                padding: '12px 24px', border: 'none', background: 'none', cursor: 'pointer',
                                fontSize: '0.95rem', fontWeight: activeTab === 'course' ? 700 : 500,
                                color: activeTab === 'course' ? 'var(--vearc-primary)' : 'var(--text-secondary)',
                                borderBottom: activeTab === 'course' ? '2px solid var(--vearc-primary)' : '2px solid transparent',
                                marginBottom: '-2px', transition: 'all 0.2s',
                            }}
                        >
                            Course Performance
                        </button>
                    </div>

                    {/* Department Breakdown Tab */}
                    {activeTab === 'department' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '32px' }} className="fade-in">
                            {deptStats.map((d) => (
                                <div key={d.department} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{d.department}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-surface)', padding: '4px 10px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                            <UsersIcon width="14" height="14" style={{ color: 'var(--vearc-primary)' }} />
                                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{d.user_count}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Enrollments</span>
                                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.enrollments}</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completions</span>
                                            <span style={{ fontWeight: 600, color: 'var(--success)' }}>{d.completions}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8rem', fontWeight: 500 }}>
                                            <span>Completion Rate</span>
                                            <span style={{ color: d.completion_rate >= 80 ? 'var(--success)' : d.completion_rate >= 50 ? 'var(--vearc-primary)' : 'var(--warning)' }}>{d.completion_rate}%</span>
                                        </div>
                                        <div className="progress-bar" style={{ width: '100%', height: '6px', background: 'var(--border)' }}>
                                            <div className="progress-fill" style={{
                                                width: `${d.completion_rate}%`,
                                                height: '100%',
                                                background: d.completion_rate >= 80 ? 'var(--success)' : d.completion_rate >= 50 ? 'var(--gradient)' : 'var(--warning)',
                                                borderRadius: '3px'
                                            }}></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Course Performance Tab */}
                    {activeTab === 'course' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }} className="fade-in">
                            {courses.map((c) => {
                                const enrollees = courseEnrollees[c.id] || [];
                                return (
                                    <div key={c.id} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, lineHeight: 1.3, paddingRight: '12px', color: 'var(--text-primary)' }}>{c.title}</h3>
                                            <span className="badge badge-neutral" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{c.category}</span>
                                        </div>

                                        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                <TargetIcon width="14" height="14" />
                                                <span>Difficulty:</span>
                                                <span className={`badge ${c.difficulty === 'beginner' ? 'badge-success' : c.difficulty === 'intermediate' ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '0.7rem', padding: '2px 6px', marginLeft: 'auto' }}>
                                                    {c.difficulty}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                <BookIcon width="14" height="14" />
                                                <span>Duration:</span>
                                                <span style={{ fontWeight: 500, color: 'var(--text-primary)', marginLeft: 'auto' }}>
                                                    {c.duration_mins ? (c.duration_mins < 60 ? `${c.duration_mins}m` : (c.duration_mins / 60).toFixed(1).replace('.0', '') + 'h') : 'N/A'}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                <UsersIcon width="14" height="14" />
                                                <span>Enrollments:</span>
                                                <span style={{ fontWeight: 600, color: 'var(--vearc-primary)', marginLeft: 'auto', fontSize: '0.95rem' }}>
                                                    {c.enrollment_count}
                                                </span>
                                            </div>

                                            {/* Profile Avatars */}
                                            <AvatarRow
                                                users={enrollees}
                                                onMoreClick={() => setShowEnrolleesModal({ title: c.title, users: enrollees })}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Enrollees Modal */}
                    {showEnrolleesModal && (
                        <div className="modal-overlay" onClick={() => setShowEnrolleesModal(null)}>
                            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '70vh', overflow: 'auto' }}>
                                <h2 style={{ marginBottom: '16px' }}>Enrolled in: {showEnrolleesModal.title}</h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {showEnrolleesModal.users.map((u, i) => (
                                        <div key={u.id || i} style={{
                                            display: 'flex', alignItems: 'center', gap: '12px',
                                            padding: '10px', background: 'var(--bg-surface)', borderRadius: 'var(--radius)',
                                        }}>
                                            <div style={{
                                                width: 32, height: 32, borderRadius: '50%',
                                                background: '#400F61', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center',
                                                fontSize: '0.85rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                                            }}>
                                                {u.name?.[0]?.toUpperCase()}
                                            </div>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{u.name}</div>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginTop: '16px', textAlign: 'right' }}>
                                    <button className="btn btn-secondary" onClick={() => setShowEnrolleesModal(null)}>Close</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
