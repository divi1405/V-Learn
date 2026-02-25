'use client';
import '../globals.css';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';

export default function CoursesPage() {
    const router = useRouter();
    const [courses, setCourses] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [reviews, setReviews] = useState({});
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const u = api.getUser();
        setUser(u);
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [courseData, enrollData] = await Promise.all([
                api.get('/courses'),
                api.get('/enrollments'),
            ]);
            setCourses(courseData);
            setEnrollments(enrollData);

            // Load review counts for all courses
            const rMap = {};
            for (const c of courseData) {
                try {
                    const r = await api.get(`/courses/${c.id}/reviews`);
                    if (r.length > 0) {
                        const avgRating = r.reduce((s, rev) => s + rev.rating, 0) / r.length;
                        rMap[c.id] = { avg: avgRating.toFixed(1), count: r.length };
                    }
                } catch (e) { }
            }
            setReviews(rMap);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const filteredCourses = courses.filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        (c.category || '').toLowerCase().includes(search.toLowerCase())
    );

    const isEnrolled = (courseId) => enrollments.some(e => e.course_id === courseId);
    const isAdmin = user && ['admin', 'hr_admin'].includes(user.role);

    const handleEnroll = async (courseId, e) => {
        e.stopPropagation();
        try {
            await api.post('/enrollments', { course_id: courseId });
            // Check for badges after enrollment
            try { await api.post('/badges/check'); } catch (e) { }
            loadData();
        } catch (err) { alert(err.message); }
    };

    const courseIcon = (cat) => {
        const icons = { 'AI': '🤖', 'Machine Learning': '🧠', 'Deep Learning': '🔬', 'NLP': '💬', 'Generative AI': '✨' };
        return icons[cat] || '📖';
    };

    if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="page-header">
                    <h1>📚 AI Course Catalog</h1>
                    <p>Curated AI courses from top universities and industry leaders</p>
                </div>

                <div className="search-wrapper" style={{ margin: '0 0 32px 0', maxWidth: 'none' }}>
                    <input
                        className="search-input"
                        placeholder="Search AI courses by title or category..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <span className="search-icon">🔍</span>
                </div>

                <div className="course-grid">
                    {filteredCourses.map((c) => {
                        const enrolled = isEnrolled(c.id);
                        const enrollment = enrollments.find(e => e.course_id === c.id);
                        const review = reviews[c.id];
                        return (
                            <div key={c.id} className="card" style={{ cursor: 'pointer', overflow: 'hidden' }} onClick={() => router.push(`/courses/${c.id}`)}>
                                {/* Gradient header */}
                                <div style={{
                                    height: 8,
                                    background: enrolled
                                        ? (enrollment?.status === 'completed'
                                            ? 'linear-gradient(90deg, #00c853, #00e676)'
                                            : 'var(--gradient)')
                                        : 'linear-gradient(90deg, #333, #555)',
                                    margin: '-24px -24px 16px -24px',
                                }} />

                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                    <span style={{ fontSize: '1.5rem' }}>{courseIcon(c.category)}</span>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 4 }}>{c.title}</h3>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                            <span className={`badge badge-${c.difficulty === 'beginner' ? 'beginner' : c.difficulty === 'intermediate' ? 'intermediate' : 'advanced'}`}>
                                                {c.difficulty}
                                            </span>
                                            {c.category && <span className="badge badge-info">{c.category}</span>}
                                        </div>
                                    </div>
                                </div>

                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
                                    {c.description?.substring(0, 120)}{c.description?.length > 120 ? '...' : ''}
                                </p>

                                {/* Rating stars */}
                                {review && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                                        <div className="stars">
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <span key={s} className={`star ${s <= Math.round(parseFloat(review.avg)) ? 'filled' : ''}`} style={{ cursor: 'default', fontSize: '0.85rem' }}>★</span>
                                            ))}
                                        </div>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--warning)', fontWeight: 700 }}>{review.avg}</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({review.count})</span>
                                    </div>
                                )}

                                {/* Progress bar for enrolled */}
                                {enrolled && enrollment && (
                                    <div style={{ marginBottom: 12 }}>
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{
                                                width: `${enrollment.progress_pct}%`,
                                                background: enrollment.status === 'completed' ? 'var(--success)' : undefined
                                            }}></div>
                                        </div>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{Math.round(enrollment.progress_pct)}% complete</span>
                                    </div>
                                )}

                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    <span>⏱ {c.duration_mins}m</span>
                                    <span>📖 {c.modules?.length || 0} modules</span>
                                    <span>👥 {c.enrollment_count}</span>
                                    <div style={{ marginLeft: 'auto' }}>
                                        {!enrolled && !isAdmin && (
                                            <button className="btn btn-primary btn-sm" onClick={(e) => handleEnroll(c.id, e)}>
                                                Enroll
                                            </button>
                                        )}
                                        {enrolled && enrollment?.status === 'completed' && (
                                            <span className="badge badge-success">✓ Done</span>
                                        )}
                                        {enrolled && enrollment?.status !== 'completed' && (
                                            <span className="badge badge-accent">In Progress</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredCourses.length === 0 && (
                    <div className="empty-state">
                        <div className="icon">🔍</div>
                        <p>No courses found. Try adjusting your search.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
