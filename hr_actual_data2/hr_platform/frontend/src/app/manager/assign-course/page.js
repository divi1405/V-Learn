'use client';
import '../../globals.css';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';

export default function AssignCoursePage() {
    return (
        <Suspense fallback={<div className="loading-page"><div className="spinner"></div></div>}>
            <AssignCourseContent />
        </Suspense>
    );
}

function AssignCourseContent() {
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
        e.preventDefault();
        if (!selectedEmployee || !selectedCourse) {
            setMessage({ type: 'error', text: 'Please select both an employee and a course.' });
            return;
        }
        setSubmitting(true);
        setMessage(null);
        try {
            await api.post(`/manager/assign-course?employee_id=${selectedEmployee}&course_id=${selectedCourse}`, {});
            setMessage({ type: 'success', text: '✅ Course assigned successfully! The employee has been notified.' });
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

    const selectedEmpData = team.find(m => String(m.id) === String(selectedEmployee));

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="section-header">
                    <h2>📋 Assign Course to Team Member</h2>
                    <button className="btn btn-ghost btn-sm" onClick={() => router.push('/manager/team')}>
                        ← Back to Team
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 900 }}>
                    {/* Assignment Form */}
                    <div className="card">
                        <h3 style={{ marginTop: 0, marginBottom: 20 }}>Assignment Details</h3>

                        {message && (
                            <div style={{
                                padding: '12px 16px', borderRadius: 'var(--radius)', marginBottom: 16,
                                background: message.type === 'success' ? 'rgba(0,200,83,0.1)' : 'rgba(229,57,53,0.1)',
                                border: `1px solid ${message.type === 'success' ? '#00c853' : '#e53935'}`,
                                color: message.type === 'success' ? '#00c853' : '#e53935',
                                fontSize: '0.88rem'
                            }}>{message.text}</div>
                        )}

                        <form onSubmit={handleAssign}>
                            <div className="form-group">
                                <label>Select Team Member</label>
                                <select
                                    value={selectedEmployee}
                                    onChange={e => setSelectedEmployee(e.target.value)}
                                    style={{
                                        width: '100%', padding: '10px 14px',
                                        borderRadius: 'var(--radius)', border: '1px solid var(--border)',
                                        background: 'var(--card-bg)', color: 'var(--text-color)', fontSize: '0.9rem'
                                    }}
                                    required
                                >
                                    <option value="">-- Choose employee --</option>
                                    {team.map(m => (
                                        <option key={m.id} value={m.id}>{m.name} ({m.designation || m.department})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group" style={{ marginTop: 16 }}>
                                <label>Search Course</label>
                                <div className="search-wrapper" style={{ maxWidth: 'none' }}>
                                    <input
                                        type="text"
                                        className="search-input"
                                        placeholder="Filter courses..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                    />
                                    <span className="search-icon">🔍</span>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginTop: 8 }}>
                                <label>Select Course</label>
                                <select
                                    value={selectedCourse}
                                    onChange={e => setSelectedCourse(e.target.value)}
                                    style={{
                                        width: '100%', padding: '10px 14px',
                                        borderRadius: 'var(--radius)', border: '1px solid var(--border)',
                                        background: 'var(--card-bg)', color: 'var(--text-color)', fontSize: '0.9rem',
                                        height: 180
                                    }}
                                    size={6}
                                    required
                                >
                                    {filteredCourses.map(c => (
                                        <option key={c.id} value={c.id}>{c.title} [{c.category}]</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                style={{ width: '100%', marginTop: 16 }}
                                disabled={submitting}
                            >
                                {submitting ? 'Assigning...' : '✅ Assign Course'}
                            </button>
                        </form>
                    </div>

                    {/* Selected Employee Preview */}
                    <div>
                        {selectedEmpData ? (
                            <div className="card">
                                <h3 style={{ marginTop: 0, marginBottom: 16 }}>👤 {selectedEmpData.name}</h3>
                                <div style={{ fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <div><span style={{ color: 'var(--text-muted)' }}>Designation:</span> {selectedEmpData.designation || '—'}</div>
                                    <div><span style={{ color: 'var(--text-muted)' }}>Division/PortCo:</span> {selectedEmpData.division || '—'}</div>
                                    <div><span style={{ color: 'var(--text-muted)' }}>Department:</span> {selectedEmpData.department || '—'}</div>
                                    <div><span style={{ color: 'var(--text-muted)' }}>Email:</span> {selectedEmpData.email}</div>
                                </div>
                            </div>
                        ) : (
                            <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                <div style={{ fontSize: '2rem', marginBottom: 8 }}>👤</div>
                                <div>Select a team member to see their details</div>
                            </div>
                        )}

                        {selectedCourse && (
                            <div className="card" style={{ marginTop: 16 }}>
                                {(() => {
                                    const c = courses.find(x => String(x.id) === String(selectedCourse));
                                    if (!c) return null;
                                    return (
                                        <>
                                            <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: '0.95rem' }}>📘 {c.title}</h3>
                                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                                                {c.description?.substring(0, 120)}...
                                            </div>
                                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                <span className="badge badge-info">{c.category}</span>
                                                <span className="badge">{c.difficulty}</span>
                                                <span className="badge">⏱ {c.duration_mins}m</span>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
