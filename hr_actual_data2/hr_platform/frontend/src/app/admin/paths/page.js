'use client';
import '../../globals.css';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';

export default function AdminPathsPage() {
    const [paths, setPaths] = useState([]);
    const [courses, setCourses] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [assignModal, setAssignModal] = useState(null);
    const [form, setForm] = useState({ name: '', description: '', department: '', target_role: '', course_ids: [] });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [pathData, courseData, userData] = await Promise.all([
                api.get('/learning-paths'),
                api.get('/courses'),
                api.get('/users?role=learner'),
            ]);
            setPaths(pathData);
            setCourses(courseData);
            setUsers(userData);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const createPath = async (e) => {
        e.preventDefault();
        try {
            await api.post('/learning-paths', form);
            setShowModal(false);
            setForm({ name: '', description: '', department: '', target_role: '', course_ids: [] });
            loadData();
        } catch (err) { alert(err.message); }
    };

    const assignPath = async (pathId, userId) => {
        try {
            await api.post(`/learning-paths/${pathId}/assign/${userId}`);
            alert('Path assigned successfully!');
            setAssignModal(null);
        } catch (err) { alert(err.message); }
    };

    const deletePath = async (id) => {
        if (!confirm('Delete this learning path?')) return;
        try {
            await api.delete(`/learning-paths/${id}`);
            loadData();
        } catch (err) { alert(err.message); }
    };

    const toggleCourse = (courseId) => {
        const ids = form.course_ids.includes(courseId)
            ? form.course_ids.filter(id => id !== courseId)
            : [...form.course_ids, courseId];
        setForm({ ...form, course_ids: ids });
    };

    if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                        <h1>🗺️ Learning Path Management</h1>
                        <p>Create and assign structured learning paths</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        + New Path
                    </button>
                </div>

                {paths.map((path) => (
                    <div key={path.id} className="path-card fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                                <h3>{path.name}</h3>
                                <p>{path.description}</p>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="btn btn-secondary btn-sm" onClick={() => setAssignModal(path.id)}>
                                    👤 Assign
                                </button>
                                <button className="btn btn-ghost btn-sm" onClick={() => deletePath(path.id)} style={{ color: 'var(--danger)' }}>🗑</button>
                            </div>
                        </div>
                        <div className="path-meta">
                            <span>📚 {path.courses?.length || 0} courses</span>
                            {path.department && <span>🏢 {path.department}</span>}
                            {path.target_role && <span>🎯 {path.target_role}</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {path.courses?.map((pc) => (
                                <span key={pc.id} className="badge badge-neutral" style={{ padding: '6px 12px' }}>
                                    {pc.course?.title || `Course ${pc.course_id}`}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Create Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <h2>Create Learning Path</h2>
                            <form onSubmit={createPath}>
                                <div className="form-group">
                                    <label className="form-label">Name</label>
                                    <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea className="form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div className="form-group">
                                        <label className="form-label">Department</label>
                                        <input className="form-input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Target Role</label>
                                        <input className="form-input" value={form.target_role} onChange={(e) => setForm({ ...form, target_role: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Select Courses ({form.course_ids.length} selected)</label>
                                    <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: 8 }}>
                                        {courses.map((c) => (
                                            <label key={c.id} style={{
                                                display: 'flex', alignItems: 'center', gap: 8, padding: '8px',
                                                cursor: 'pointer', borderRadius: 'var(--radius-sm)',
                                                background: form.course_ids.includes(c.id) ? 'rgba(99,102,241,0.1)' : 'transparent',
                                            }}>
                                                <input
                                                    type="checkbox"
                                                    checked={form.course_ids.includes(c.id)}
                                                    onChange={() => toggleCourse(c.id)}
                                                />
                                                <span style={{ fontSize: 14 }}>{c.title}</span>
                                                <span className="badge badge-neutral" style={{ marginLeft: 'auto', fontSize: 11 }}>{c.category}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Create Path</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Assign Modal */}
                {assignModal && (
                    <div className="modal-overlay" onClick={() => setAssignModal(null)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <h2>Assign Learning Path</h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>Select a learner to assign this path to:</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {users.map((u) => (
                                    <button
                                        key={u.id}
                                        className="card"
                                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, cursor: 'pointer', textAlign: 'left', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}
                                        onClick={() => assignPath(assignModal, u.id)}
                                    >
                                        <div style={{
                                            width: 32, height: 32, borderRadius: '50%',
                                            background: 'var(--accent-gradient)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 14, fontWeight: 700, color: 'white',
                                        }}>
                                            {u.name?.[0]}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.department} · {u.job_title}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <div className="modal-actions">
                                <button className="btn btn-secondary" onClick={() => setAssignModal(null)}>Close</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
