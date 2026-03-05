'use client';
import '../../globals.css';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { EditIcon, SearchIcon } from '@/components/Icons';

export default function AdminCoursesPage() {
    const router = useRouter();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [form, setForm] = useState({ title: '', description: '', category: 'Engineering', difficulty: 'beginner', duration_mins: 60 });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

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

    const uniqueCategories = [...new Set(courses.map(c => c.category).filter(Boolean))];

    const filteredCourses = courses.filter(c => {
        const matchesSearch = (c.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || (c.description || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCat = filterCategory ? (c.category || '').toLowerCase() === filterCategory.toLowerCase() : true;
        return matchesSearch && matchesCat;
    });

    const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
    const safePage = Math.min(currentPage, totalPages || 1);
    const paginatedCourses = filteredCourses.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content" style={{ padding: 0 }}>
                <Header />
                <div style={{ padding: '24px' }}>
                    <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '24px' }}>
                        <div>
                            <h1 className="vearc-page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, marginBottom: '8px' }}>
                                <EditIcon style={{ color: 'var(--vearc-primary)' }} width="32" height="32" /> Course Management
                            </h1>
                            <p style={{ marginTop: 0 }}>Create, edit, and manage your course catalog</p>
                        </div>
                        <button className="btn vearc-btn-primary" onClick={() => setShowModal(true)}>
                            + New Course
                        </button>
                    </div>

                    <div className="card" style={{ marginBottom: '24px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div className="search-wrapper" style={{ width: '300px', margin: 0 }}>
                            <span className="search-icon" style={{ left: '10px', top: '50%', transform: 'translateY(-50%)' }}><SearchIcon width="14" height="14" /></span>
                            <input
                                type="text"
                                className="vearc-search vearc-search"
                                placeholder="Search courses..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                style={{ paddingLeft: '32px' }}
                            />
                        </div>
                        <select
                            className="form-input"
                            style={{ width: '200px' }}
                            value={filterCategory}
                            onChange={e => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                        >
                            <option value="">All Categories</option>
                            {uniqueCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div className="table-container fade-in" style={{ background: 'var(--vearc-surface)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
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
                                {paginatedCourses.length === 0 ? (
                                    <tr><td colSpan="7" className="text-center" style={{ padding: 40, color: 'var(--vearc-text-muted)' }}>No courses found</td></tr>
                                ) : paginatedCourses.map((c) => (
                                    <tr key={c.id}>
                                        <td style={{ padding: '8px 16px' }}>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: 13 }}>{c.title}</div>
                                                <div style={{ fontSize: 11, color: 'var(--vearc-text-muted)', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description}</div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '8px 16px' }}><span className="badge badge-neutral" style={{ fontSize: 10 }}>{c.category}</span></td>
                                        <td style={{ padding: '8px 16px' }}><span className={`badge ${c.difficulty === 'beginner' ? 'badge-success' : c.difficulty === 'intermediate' ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: 10 }}>{c.difficulty}</span></td>
                                        <td style={{ padding: '8px 16px', fontSize: 13 }}>{c.modules?.length || 0}</td>
                                        <td style={{ padding: '8px 16px', fontSize: 13 }}>{c.duration_mins ? (c.duration_mins < 60 ? `${c.duration_mins}m` : (c.duration_mins / 60).toFixed(1).replace('.0', '') + 'h') : ''}</td>
                                        <td style={{ padding: '8px 16px', fontSize: 13 }}>{c.enrollment_count}</td>
                                        <td style={{ padding: '8px 16px' }}>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button className="btn vearc-btn-primary btn-sm" onClick={() => router.push(`/admin/courses/${c.id}`)}>Edit</button>
                                                <button className="btn btn-ghost btn-sm" onClick={() => deleteCourse(c.id)} style={{ color: 'var(--vearc-danger)', display: 'flex', alignItems: 'center' }}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '12px 16px', borderTop: '1px solid var(--vearc-border)', fontSize: '0.85rem',
                            }}>
                                <span style={{ color: 'var(--vearc-text-secondary)' }}>
                                    Showing {((safePage - 1) * itemsPerPage) + 1}-{Math.min(safePage * itemsPerPage, filteredCourses.length)} of {filteredCourses.length} courses
                                </span>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        disabled={safePage <= 1}
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    >
                                        Previous
                                    </button>
                                    <span style={{ fontWeight: 600, minWidth: '80px', textAlign: 'center' }}>
                                        Page {safePage} of {totalPages}
                                    </span>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        disabled={safePage >= totalPages}
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
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
                                        <button type="submit" className="btn vearc-btn-primary">Create Course</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
