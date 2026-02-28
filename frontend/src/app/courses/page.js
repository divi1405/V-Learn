'use client';
import '../globals.css';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { BookIcon, TargetIcon, BotIcon, SearchIcon , ClockIcon, CheckIcon, AlertIcon, ArrowLeftIcon, ArrowRightIcon, UsersIcon} from '@/components/Icons';

export default function CoursesPage() {
    const router = useRouter();
    const [courses, setCourses] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [reviews, setReviews] = useState({});
    const [topRated, setTopRated] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('enrolled');

    useEffect(() => {
        const u = api.getUser();
        setUser(u);
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [courseData, enrollData, topData] = await Promise.all([
                api.get('/courses'),
                api.get('/enrollments'),
                api.get('/courses/top-rated').catch(() => []),
            ]);
            setCourses(courseData);
            setEnrollments(enrollData);
            setTopRated(topData || []);

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

    const enrolledCoursesList = filteredCourses.filter(c => {
        const e = enrollments.find(env => env.course_id === c.id);
        return e && !e.assigned_by;
    });

    const assignedCoursesList = filteredCourses.filter(c => {
        const e = enrollments.find(env => env.course_id === c.id);
        return e && e.assigned_by;
    });

    const allOtherCoursesList = filteredCourses.filter(c => !isEnrolled(c.id));

    const renderCourseCard = (c) => {
        const enrolled = isEnrolled(c.id);
        const enrollment = enrollments.find(e => e.course_id === c.id);
        const review = reviews[c.id];
        return (
            <div key={c.id} className="card" style={{ cursor: 'pointer', overflow: 'hidden', padding: '24px' }} onClick={() => router.push(`/courses/${c.id}`)}>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
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

                <p style={{ fontSize: '0.85rem', color: 'var(--vearc-text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
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
                        <span style={{ fontSize: '0.8rem', color: 'var(--vearc-primary)', fontWeight: 700 }}>{review.avg}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--vearc-text-muted)' }}>({review.count})</span>
                    </div>
                )}

                {/* Progress bar for enrolled */}
                {enrolled && enrollment && (
                    <div style={{ marginBottom: 12 }}>
                        <div className="progress-bar">
                            <div className="progress-fill" style={{
                                width: `${enrollment.progress_pct}%`,
                                background: enrollment.status === 'completed' ? 'var(--vearc-success)' : undefined
                            }}></div>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--vearc-text-muted)' }}>{Math.round(enrollment.progress_pct)}% complete</span>
                    </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.8rem', color: 'var(--vearc-text-muted)' }}>
                    <span>⏱ {c.duration_mins ? (c.duration_mins < 60 ? `${c.duration_mins}m` : (c.duration_mins / 60).toFixed(1).replace('.0', '') + 'h') : ''}</span>
                    <span><BookIcon width="14" height="14" /> {c.modules?.length || 0} modules</span>
                    <span><UsersIcon width="14" height="14" style={{ marginRight: "4px" }} /> {c.enrollment_count}</span>
                    <div style={{ marginLeft: 'auto' }}>
                        {!enrolled && !isAdmin && (
                            <button className="btn vearc-btn-primary btn-sm" onClick={(e) => handleEnroll(c.id, e)}>
                                Enroll
                            </button>
                        )}
                        {enrolled && enrollment?.status === 'completed' && (
                            <span className="badge badge-success">Done</span>
                        )}
                        {enrolled && enrollment?.status !== 'completed' && (
                            <span className="badge badge-accent">In Progress</span>
                        )}
                    </div>
                </div>
            </div>
        );
    };

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
        const icons = { 'AI': <BotIcon />, 'Machine Learning': <TargetIcon />, 'Deep Learning': <BookIcon />, 'NLP': <BotIcon />, 'Generative AI': <BotIcon /> };
        return icons[cat] || <BookIcon />;
    };

    if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content" style={{ padding: 0 }}>
                <Header />
                <div style={{ padding: '24px' }}>
                    <div className="page-header">
                        <h1 className="vearc-page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, marginBottom: '8px' }}>
                            <BookIcon style={{ color: 'var(--vearc-primary)' }} width="32" height="32" /> AI Course Catalog
                        </h1>
                        <p style={{ marginTop: 0 }}>Curated AI courses from top universities and industry leaders</p>
                    </div>

                    <div className="search-wrapper" style={{ margin: '0 0 32px 0', maxWidth: 'none' }}>
                        <input
                            className="vearc-search vearc-search"
                            placeholder="Search AI courses by title or category..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <span className="search-icon" style={{ display: 'flex', alignItems: 'center', color: 'var(--vearc-primary)' }}><SearchIcon width="16" height="16" /></span>
                    </div>

                    <div className="vearc-tabs">
                        <div className={`vearc-tab ${activeTab === 'enrolled' ? 'active' : ''}`} onClick={() => setActiveTab('enrolled')}>Enrolled Courses</div>
                        <div className={`vearc-tab ${activeTab === 'assigned' ? 'active' : ''}`} onClick={() => setActiveTab('assigned')}>Assigned Courses</div>
                        <div className={`vearc-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>All Courses</div>
                        <div className={`vearc-tab ${activeTab === 'toprated' ? 'active' : ''}`} onClick={() => setActiveTab('toprated')}>Top Rated</div>
                    </div>

                    <div className="course-grid">
                        {activeTab === 'enrolled' && (
                            enrolledCoursesList.length > 0 ? enrolledCoursesList.map(renderCourseCard) : <div style={{ gridColumn: '1 / -1', color: 'var(--vearc-text-muted)', textAlign: 'center', padding: '40px 0' }}>No enrolled courses found.</div>
                        )}
                        {activeTab === 'assigned' && (
                            assignedCoursesList.length > 0 ? assignedCoursesList.map(renderCourseCard) : <div style={{ gridColumn: '1 / -1', color: 'var(--vearc-text-muted)', textAlign: 'center', padding: '40px 0' }}>No assigned courses found.</div>
                        )}
                        {activeTab === 'all' && (
                            filteredCourses.length > 0 ? filteredCourses.map(renderCourseCard) : (
                                <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                                    <div className="icon" style={{ color: 'var(--vearc-primary)', marginBottom: '16px' }}><SearchIcon width="48" height="48" /></div>
                                    <p>No courses found. Try adjusting your search.</p>
                                </div>
                            )
                        )}
                        {activeTab === 'toprated' && (
                            topRated.length > 0 ? topRated.map(tr => (
                                <div key={tr.course_id} className="card" style={{ cursor: 'pointer', padding: '24px' }} onClick={() => router.push(`/courses/${tr.course_id}`)}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8 }}>{tr.title}</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                        <div className="stars">
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <span key={s} className={`star ${s <= Math.round(tr.avg_rating) ? 'filled' : ''}`} style={{ cursor: 'default', fontSize: '0.85rem' }}>★</span>
                                            ))}
                                        </div>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--vearc-primary)', fontWeight: 700 }}>{tr.avg_rating}</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--vearc-text-muted)' }}>({tr.review_count} reviews)</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <span className={`badge badge-${tr.difficulty === 'beginner' ? 'beginner' : tr.difficulty === 'intermediate' ? 'intermediate' : 'advanced'}`}>{tr.difficulty}</span>
                                        {tr.category && <span className="badge badge-info">{tr.category}</span>}
                                    </div>
                                </div>
                            )) : <div style={{ gridColumn: '1 / -1', color: 'var(--vearc-text-muted)', textAlign: 'center', padding: '40px 0' }}>No rated courses yet. Complete a course and leave a review!</div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}



