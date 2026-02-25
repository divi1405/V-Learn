'use client';
import '../../globals.css';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';

export default function AdminCoursesPage() {
    const router = useRouter();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ title: '', description: '', category: 'Engineering', difficulty: 'beginner', duration_mins: 60 });

    useEffect(() => {
        loadCourses();
    }, []);

    const loadCourses = async () => {
        try {
            const data = await api.get('/courses');
            setCourses(data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const createCourse = async (e) => {
        e.preventDefault();
        try {
            await api.post('/courses', form);
            setShowModal(false);
            setForm({ title: '', description: '', category: 'Engineering', difficulty: 'beginner', duration_mins: 60 });
            loadCourses();
        } catch (err) { alert(err.message); }
    };

    const deleteCourse = async (id) => {
        if (!confirm('Delete this course?')) return;
        try {
            await api.delete(`/courses/${id}`);
            loadCourses();
        } catch (err) { alert(err.message); }
    };

    if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                        <h1>📝 Course Management</h1>
                        <p>Create, edit, and manage your course catalog</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        + New Course
                    </button>
                </div>

                <div className="table-container fade-in">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Course</th>
                                <th>Category</th>
                                <th>Difficulty</th>
                                <th>Modules</th>
                                <th>Duration</th>
                                <th>Enrollments</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {courses.map((c) => (
                                <tr key={c.id}>
                                    <td>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: 14 }}>{c.title}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description}</div>
                                        </div>
                                    </td>
                                    <td><span className="badge badge-neutral">{c.category}</span></td>
                                    <td><span className={`badge ${c.difficulty === 'beginner' ? 'badge-success' : c.difficulty === 'intermediate' ? 'badge-warning' : 'badge-danger'}`}>{c.difficulty}</span></td>
                                    <td>{c.modules?.length || 0}</td>
                                    <td>{c.duration_mins}m</td>
                                    <td>{c.enrollment_count}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button className="btn btn-primary btn-sm" onClick={() => router.push(`/admin/courses/${c.id}`)}>Build 🛠️</button>
                                            <button className="btn btn-ghost btn-sm" onClick={() => deleteCourse(c.id)} style={{ color: 'var(--danger)' }}>🗑</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <h2>Create New Course</h2>
                            <form onSubmit={createCourse}>
                                <div className="form-group">
                                    <label className="form-label">Title</label>
                                    <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea className="form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div className="form-group">
                                        <label className="form-label">Category</label>
                                        <select className="form-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                                            <option>Engineering</option>
                                            <option>Leadership</option>
                                            <option>Compliance</option>
                                            <option>Product</option>
                                            <option>Design</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Difficulty</label>
                                        <select className="form-select" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                                            <option value="beginner">Beginner</option>
                                            <option value="intermediate">Intermediate</option>
                                            <option value="advanced">Advanced</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Duration (minutes)</label>
                                    <input type="number" className="form-input" value={form.duration_mins} onChange={(e) => setForm({ ...form, duration_mins: parseInt(e.target.value) })} />
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Create Course</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
