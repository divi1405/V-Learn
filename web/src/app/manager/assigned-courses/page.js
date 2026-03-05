'use client';
import '../../globals.css';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { ClipboardIcon, BookIcon, ChevronDownIcon, ChevronUpIcon } from '@/components/Icons';

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
                backgroundColor: '#400F61',
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

export default function AssignedCoursesPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [assignedCourses, setAssignedCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedCourse, setExpandedCourse] = useState(null);
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
            const data = await api.get('/manager/assigned-courses');
            setAssignedCourses(data || []);
        } catch (err) {
            console.error('Failed to load assigned courses:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!user || loading) {
        return <div className="loading-page"><div className="spinner"></div></div>;
    }

    const toggleCourse = (courseId) => {
        if (expandedCourse === courseId) {
            setExpandedCourse(null);
        } else {
            setExpandedCourse(courseId);
        }
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content" style={{ padding: 0 }}>
                <Header />
                <div style={{ padding: '24px' }}>
                    <div className="section-header">
                        <h2 className="vearc-page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                            <BookIcon style={{ color: 'var(--vearc-primary)' }} width="28" height="28" /> Assigned Courses
                        </h2>
                    </div>

                    {assignedCourses.length === 0 ? (
                        <div className="empty-state">
                            <div className="icon" style={{ color: 'var(--vearc-primary)', marginBottom: '16px' }}><ClipboardIcon width="48" height="48" /></div>
                            <p>No courses have been assigned to your team yet.</p>
                            <button className="btn vearc-btn-primary" style={{ marginTop: 16 }} onClick={() => router.push('/manager/assign-course')}>
                                Assign a Course
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {assignedCourses.map(ac => {
                                const isExpanded = expandedCourse === ac.course_id;
                                const completedCount = ac.assignments.filter(a => a.status === 'completed').length;
                                const progressPct = ac.assignments.length > 0 ? Math.round((completedCount / ac.assignments.length) * 100) : 0;

                                const visibleAvatars = ac.assignments.slice(0, MAX_AVATARS);
                                const extraCount = ac.assignments.length - MAX_AVATARS;

                                return (
                                    <div key={ac.course_id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                        <div
                                            style={{ padding: '20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 16 }}
                                            onClick={() => toggleCourse(ac.course_id)}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div style={{ flex: 1, paddingRight: 16 }}>
                                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <BookIcon style={{ color: 'var(--vearc-primary)' }} width="20" height="20" /> {ac.course}
                                                    </h3>
                                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                                                        {ac.description?.substring(0, 150)}{ac.description?.length > 150 ? '...' : ''}
                                                    </p>
                                                </div>
                                                <div style={{ textAlign: 'right', minWidth: '40px' }}>
                                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                                        {isExpanded ? <ChevronUpIcon width="16" height="16" /> : <ChevronDownIcon width="16" height="16" />}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Progress Bar & Profile Avatars Row */}
                                            {ac.assignments.length > 0 && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }} onClick={(e) => e.stopPropagation()}>
                                                    <div style={{ width: '100%' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                                                            <span>Course Progress</span>
                                                            <span>{completedCount} / {ac.assignments.length} Completed</span>
                                                        </div>
                                                        <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                                                            <div style={{ height: '100%', width: `${progressPct}%`, background: progressPct === 100 ? 'var(--success)' : 'var(--vearc-primary)', transition: 'width 0.4s' }} />
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center' }}>
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
                                                                    background: 'var(--bg-hover)', display: 'flex',
                                                                    alignItems: 'center', justifyContent: 'center',
                                                                    fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-primary)',
                                                                    border: '2px solid var(--bg-surface)', marginLeft: '-8px',
                                                                    zIndex: 0, position: 'relative', cursor: 'pointer',
                                                                    flexShrink: 0,
                                                                }}
                                                            >
                                                                +{extraCount}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {isExpanded && (
                                            <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border)' }}>
                                                <div style={{ paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>Assigned Team Members</h4>
                                                    {ac.assignments.map(assignee => (
                                                        <div key={assignee.user_id} style={{
                                                            display: 'flex', alignItems: 'center', gap: 12,
                                                            padding: '12px', background: 'var(--bg)',
                                                            borderRadius: 'var(--radius)', fontSize: '0.85rem'
                                                        }}>
                                                            <div style={{
                                                                width: 32, height: 32, borderRadius: '50%',
                                                                background: '#400F61', display: 'flex',
                                                                alignItems: 'center', justifyContent: 'center',
                                                                fontSize: '0.9rem', fontWeight: 700, color: '#fff', flexShrink: 0
                                                            }}>
                                                                {assignee.user_name?.[0]}
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{assignee.user_name}</div>
                                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                                                    Progress: {Math.round(assignee.progress_pct)}%
                                                                </div>
                                                            </div>
                                                            <span className={`badge ${assignee.status === 'completed' ? 'badge-success' : assignee.status === 'in_progress' ? 'badge-info' : ''}`}>
                                                                {assignee.status?.replace('_', ' ')}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
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
