'use client';
import '../../globals.css';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { ClipboardIcon, SearchIcon, BookIcon, UserIcon, TargetIcon, UsersIcon } from '@/components/Icons';

export default function AssignCoursePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preselectedEmployee = searchParams.get('employee');

    const [user, setUser] = useState(null);
    const [team, setTeam] = useState([]);
    const [courses, setCourses] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState(preselectedEmployee || '');
    const [selectedCourse, setSelectedCourse] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);
    const [searchEmployee, setSearchEmployee] = useState('');
    const [search, setSearch] = useState('');

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
            const [teamData, coursesData] = await Promise.all([
                api.get('/manager/my-team'),
                api.get('/courses'),
            ]);
            setTeam(teamData);
            setCourses(coursesData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!selectedEmployee || !selectedCourse) {
            setMessage({ type: 'error', text: 'Please select both an employee and a course.' });
            return;
        }
        setSubmitting(true);
        setMessage(null);
        try {
            await api.post(`/manager/assign-course?employee_id=${selectedEmployee}&course_id=${selectedCourse}`, {});
            setMessage({ type: 'success', text: 'Course assigned successfully! The employee has been notified.' });
            setSelectedCourse('');
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Failed to assign course.' });
        } finally {
            setSubmitting(false);
        }
    };

    if (!user || loading) {
        return <div className="loading-page"><div className="spinner"></div></div>;
    }

    const filteredCourses = courses.filter(c =>
        !search || c.title.toLowerCase().includes(search.toLowerCase()) ||
        (c.category || '').toLowerCase().includes(search.toLowerCase())
    );

    const filteredTeam = team.filter(m =>
        !searchEmployee || m.name.toLowerCase().includes(searchEmployee.toLowerCase()) ||
        (m.designation || '').toLowerCase().includes(searchEmployee.toLowerCase()) ||
        (m.department || '').toLowerCase().includes(searchEmployee.toLowerCase())
    );

    const selectedEmpData = team.find(m => String(m.id) === String(selectedEmployee));

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content" style={{ padding: 0 }}>
                <Header />
                <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
                    <div className="section-header" style={{ marginBottom: '32px' }}>
                        <div>
                            <h2 className="vearc-page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                                <ClipboardIcon style={{ color: 'var(--vearc-primary)' }} width="32" height="32" /> Assign Course
                            </h2>
                            <p style={{ color: 'var(--vearc-text-muted)', marginTop: '8px', fontSize: '0.95rem' }}>
                                Interactive dashboard to allocate learning resources to your team.
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '16px' }}>

                        {/* Left Column: Selection */}
                        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>

                            {/* Employee Selection */}
                            <div>
                                <h3 style={{ marginTop: '0', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--vearc-text-secondary)' }}>
                                    <UsersIcon width="14" height="14" /> Team Member
                                </h3>

                                <div className="search-wrapper" style={{ width: '100%', maxWidth: '100%', marginBottom: '8px' }}>
                                    <span className="search-icon" style={{ left: '10px' }}>
                                        <SearchIcon width="12" height="12" />
                                    </span>
                                    <input
                                        type="text"
                                        className="vearc-search vearc-search"
                                        placeholder="Search by name, designation..."
                                        value={searchEmployee}
                                        onChange={e => setSearchEmployee(e.target.value)}
                                        style={{ background: 'var(--vearc-surface)', padding: '6px 10px 6px 30px', fontSize: '0.8rem', minHeight: '32px' }}
                                    />
                                </div>

                                <div className="custom-scrollbar" style={{ maxHeight: '180px', overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {filteredTeam.map(m => {
                                        const isSelected = String(selectedEmployee) === String(m.id);
                                        return (
                                            <div
                                                key={m.id}
                                                onClick={() => setSelectedEmployee(m.id)}
                                                style={{
                                                    flexShrink: 0,
                                                    padding: '8px 12px',
                                                    borderRadius: 'var(--vearc-radius-sm)',
                                                    border: `1px solid ${isSelected ? 'var(--vearc-primary)' : 'var(--vearc-border)'}`,
                                                    background: isSelected ? 'var(--vearc-primary-verylight)' : 'var(--vearc-bg)',
                                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                                                    transition: 'all 0.2s ease',
                                                }}
                                            >
                                                <div style={{
                                                    width: '24px', height: '24px', borderRadius: '50%',
                                                    background: isSelected ? 'var(--vearc-primary)' : 'var(--vearc-surface)',
                                                    border: `1px solid ${isSelected ? 'transparent' : 'var(--vearc-border)'}`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '0.75rem', fontWeight: 600, color: isSelected ? 'var(--vearc-surface)' : 'var(--vearc-text-secondary)',
                                                    transition: 'all 0.3s ease', flexShrink: 0
                                                }}>
                                                    {m.name?.[0]}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: isSelected ? 'var(--vearc-text-primary)' : 'var(--vearc-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {m.name}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: isSelected ? 'var(--vearc-primary)' : 'var(--vearc-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {m.designation || m.department}
                                                    </div>
                                                </div>
                                                <div style={{
                                                    width: '16px', height: '16px', borderRadius: '50%',
                                                    border: `1px solid ${isSelected ? 'var(--vearc-primary)' : 'var(--vearc-border)'}`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    background: isSelected ? 'var(--vearc-primary)' : 'transparent',
                                                    color: 'var(--vearc-surface)', fontSize: '10px', flexShrink: 0
                                                }}>
                                                    {isSelected && ''}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Course Selection */}
                            <div style={{ opacity: selectedEmployee ? 1 : 0.6, pointerEvents: selectedEmployee ? 'auto' : 'none', transition: 'all 0.3s ease' }}>
                                <h3 style={{ marginTop: '0', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--vearc-text-secondary)' }}>
                                    <BookIcon width="14" height="14" /> Course
                                </h3>

                                <div className="search-wrapper" style={{ width: '100%', maxWidth: '100%', marginBottom: '8px' }}>
                                    <span className="search-icon" style={{ left: '10px' }}>
                                        <SearchIcon width="12" height="12" />
                                    </span>
                                    <input
                                        type="text"
                                        className="vearc-search vearc-search"
                                        placeholder="Search courses..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        style={{ background: 'var(--vearc-surface)', padding: '6px 10px 6px 30px', fontSize: '0.8rem', minHeight: '32px' }}
                                    />
                                </div>

                                <div className="custom-scrollbar" style={{ maxHeight: '220px', overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {filteredCourses.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '16px 12px', color: 'var(--vearc-text-muted)', fontSize: '0.8rem', background: 'var(--vearc-bg)', borderRadius: 'var(--vearc-radius-sm)' }}>
                                            <SearchIcon width="16" height="16" style={{ marginBottom: '4px', opacity: 0.5 }} />
                                            <div>No courses found matching "{search}"</div>
                                        </div>
                                    ) : (
                                        filteredCourses.map(c => {
                                            const isSelected = String(selectedCourse) === String(c.id);
                                            return (
                                                <div
                                                    key={c.id}
                                                    onClick={() => setSelectedCourse(c.id)}
                                                    style={{
                                                        flexShrink: 0,
                                                        padding: '12px 14px',
                                                        borderRadius: 'var(--vearc-radius-sm)',
                                                        border: `1px solid ${isSelected ? 'var(--vearc-primary)' : 'var(--vearc-border)'}`,
                                                        background: isSelected ? 'var(--vearc-primary-verylight)' : 'var(--vearc-bg)',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease',
                                                        position: 'relative',
                                                        overflow: 'hidden'
                                                    }}
                                                >
                                                    {isSelected && (
                                                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: 'var(--vearc-primary)' }} />
                                                    )}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: isSelected ? 'var(--vearc-text-primary)' : 'var(--vearc-text-secondary)', lineHeight: 1.4, paddingRight: '12px', wordBreak: 'break-word' }}>
                                                            {c.title}
                                                        </div>
                                                        <div style={{
                                                            width: '16px', height: '16px', borderRadius: '50%',
                                                            border: `1px solid ${isSelected ? 'var(--vearc-primary)' : 'var(--vearc-border)'}`,
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            background: isSelected ? 'var(--vearc-primary)' : 'transparent',
                                                            color: 'var(--vearc-surface)', fontSize: '10px', flexShrink: 0
                                                        }}>
                                                            {isSelected && ''}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                        <span className={`badge ${isSelected ? 'badge-accent' : 'badge-info'}`} style={{ fontSize: '0.55rem', padding: '1px 4px' }}>{c.category}</span>
                                                        <span style={{ fontSize: '0.65rem', color: isSelected ? 'var(--vearc-text-secondary)' : 'var(--vearc-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <TargetIcon width="10" height="10" /> {c.difficulty}
                                                        </span>
                                                        <span style={{ fontSize: '0.75rem', color: isSelected ? 'var(--vearc-text-secondary)' : 'var(--vearc-text-muted)' }}>
                                                            ⏱ {c.duration_mins ? (c.duration_mins < 60 ? `${c.duration_mins}m` : (c.duration_mins / 60).toFixed(1).replace('.0', '') + 'h') : ''}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Preview & Submit */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="card" style={{ position: 'sticky', top: '100px', padding: '16px 16px' }}>
                                <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--vearc-text-secondary)' }}>
                                    <ClipboardIcon width="14" height="14" /> Assignment Summary
                                </h3>

                                {message && (
                                    <div style={{
                                        padding: '10px 12px', borderRadius: 'var(--vearc-radius-sm)', marginBottom: '16px',
                                        background: message.type === 'success' ? 'rgba(0,200,83,0.1)' : 'rgba(229,57,53,0.1)',
                                        border: `1px solid ${message.type === 'success' ? 'var(--vearc-success)' : 'var(--vearc-danger)'}`,
                                        color: message.type === 'success' ? 'var(--vearc-success)' : 'var(--vearc-danger)',
                                        fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px'
                                    }}>
                                        {message.type === 'success' ? '✓' : '⚠️'} {message.text}
                                    </div>
                                )}

                                <div style={{ marginBottom: '16px' }}>
                                    {selectedEmpData ? (
                                        <div style={{ padding: '8px 12px', borderRadius: 'var(--vearc-radius-sm)', background: 'var(--vearc-bg)', border: '1px solid var(--vearc-border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                width: '32px', height: '32px', borderRadius: '50%',
                                                background: 'var(--vearc-primary)', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center',
                                                fontSize: '0.9rem', fontWeight: 700, color: 'var(--vearc-surface)'
                                            }}>
                                                {selectedEmpData.name?.[0]}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedEmpData.name}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--vearc-text-muted)', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    <TargetIcon width="10" height="10" /> {selectedEmpData.designation || selectedEmpData.department || 'No Designation'}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ padding: '8px 12px', borderRadius: 'var(--vearc-radius-sm)', background: 'var(--vearc-bg)', border: '1px dashed var(--vearc-border)', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--vearc-text-muted)' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--vearc-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <UserIcon width="14" height="14" />
                                            </div>
                                            <span style={{ fontSize: '0.8rem' }}>No team member selected</span>
                                        </div>
                                    )}
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    {selectedCourse ? (
                                        (() => {
                                            const c = courses.find(x => String(x.id) === String(selectedCourse));
                                            if (!c) return null;
                                            return (
                                                <div style={{ padding: '12px', borderRadius: 'var(--vearc-radius-sm)', background: 'var(--vearc-bg)', border: '1px solid var(--vearc-border)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                                                        <div style={{ padding: '6px', borderRadius: '6px', background: 'var(--vearc-primary-verylight)', color: 'var(--vearc-primary)' }}>
                                                            <BookIcon width="16" height="16" />
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '2px', lineHeight: 1.2 }}>{c.title}</div>
                                                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                                <span className="badge badge-info" style={{ fontSize: '0.6rem', padding: '1px 4px' }}>{c.category}</span>
                                                                <span className="badge" style={{ fontSize: '0.6rem', padding: '1px 4px' }}>{c.difficulty}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--vearc-text-secondary)', lineHeight: 1.4, padding: '8px', background: 'var(--vearc-surface)', borderRadius: 'var(--vearc-radius-sm)' }}>
                                                        {c.description?.length > 100 ? c.description.substring(0, 100) + '...' : c.description || 'No description available.'}
                                                    </div>
                                                </div>
                                            );
                                        })()
                                    ) : (
                                        <div style={{ padding: '12px', borderRadius: 'var(--vearc-radius-sm)', background: 'var(--vearc-bg)', border: '1px dashed var(--vearc-border)', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--vearc-text-muted)' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'var(--vearc-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <BookIcon width="16" height="16" />
                                            </div>
                                            <span style={{ fontSize: '0.8rem' }}>No course selected</span>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={handleAssign}
                                    className="btn vearc-btn-primary"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        opacity: (!selectedEmployee || !selectedCourse) ? 0.5 : 1,
                                    }}
                                    disabled={submitting || !selectedEmployee || !selectedCourse}
                                >
                                    {submitting ? (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                                            <span className="spinner" style={{ width: '12px', height: '12px', borderWidth: '2px' }}></span> Assigning...
                                        </span>
                                    ) : 'Confirm Assignment'}
                                </button>

                                {(!selectedEmployee || !selectedCourse) && (
                                    <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--vearc-text-muted)', marginTop: '12px' }}>
                                        Please complete Step 1 and Step 2 to proceed
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}



