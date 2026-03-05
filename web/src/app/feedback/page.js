'use client';
import '../globals.css';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { StarIcon, SearchIcon, ClipboardIcon, EditIcon } from '@/components/Icons';

const StarRating = ({ value, onChange, readonly }) => {
    const [hover, setHover] = useState(0);
    return (
        <div className="stars">
            {[1, 2, 3, 4, 5].map(star => (
                <span
                    key={star}
                    className={`star ${star <= (hover || value) ? 'filled' : ''}`}
                    onClick={() => !readonly && onChange?.(star)}
                    onMouseEnter={() => !readonly && setHover(star)}
                    onMouseLeave={() => !readonly && setHover(0)}
                    style={{ cursor: readonly ? 'default' : 'pointer' }}
                ><StarIcon /></span>
            ))}
        </div>
    );
};

export default function FeedbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [enrollments, setEnrollments] = useState([]);
    const [reviews, setReviews] = useState({});
    const [allCourses, setAllCourses] = useState([]);
    const [allReviews, setAllReviews] = useState({});
    const [topRated, setTopRated] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitForm, setSubmitForm] = useState({ courseId: null, rating: 0, comment: '' });
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('my-reviews');
    const [courseFilter, setCourseFilter] = useState('');

    // Support navigating from courses page with ?course=<id>
    useEffect(() => {
        const courseId = searchParams?.get('course');
        if (courseId) {
            setActiveTab('all-feedback');
            setCourseFilter(courseId);
        }
    }, [searchParams]);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [enrollData, topData, courseData] = await Promise.all([
                api.get('/enrollments'),
                api.get('/courses/top-rated').catch(() => []),
                api.get('/courses').catch(() => []),
            ]);
            setEnrollments(enrollData.filter(e => e.status === 'completed'));
            setTopRated(topData);
            setAllCourses(courseData);

            // Load reviews for completed courses (my tab)
            const reviewMap = {};
            for (const e of enrollData.filter(en => en.status === 'completed')) {
                try {
                    const r = await api.get(`/courses/${e.course_id}/reviews`);
                    reviewMap[e.course_id] = r;
                } catch (err) { reviewMap[e.course_id] = []; }
            }
            setReviews(reviewMap);

            // Load reviews for ALL courses (all-feedback tab)
            const allMap = {};
            for (const c of courseData) {
                try {
                    const r = await api.get(`/courses/${c.id}/reviews`);
                    if (r.length > 0) allMap[c.id] = r;
                } catch (err) { }
            }
            setAllReviews(allMap);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleSubmit = async () => {
        if (!submitForm.courseId || submitForm.rating === 0) return;
        setSubmitting(true);
        try {
            await api.post(`/courses/${submitForm.courseId}/reviews`, {
                rating: submitForm.rating,
                comment: submitForm.comment,
            });
            setSubmitForm({ courseId: null, rating: 0, comment: '' });
            loadData();
        } catch (err) { alert(err.message); }
        finally { setSubmitting(false); }
    };

    if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

    // Courses that have at least one review (for all-feedback tab)
    const reviewedCourses = allCourses.filter(c => allReviews[c.id]?.length > 0);

    // Filtered by courseFilter for all-feedback tab
    const filteredReviewedCourses = courseFilter
        ? reviewedCourses.filter(c => String(c.id) === String(courseFilter))
        : reviewedCourses;

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content" style={{ padding: 0 }}>
                <Header />
                <div style={{ padding: '24px' }}>
                    <div className="page-header">
                        <h1>Feedback &amp; Ratings</h1>
                        <p>Rate your completed courses and see what others think</p>
                    </div>

                    <div className="vearc-tabs">
                        <div className={`vearc-tab ${activeTab === 'my-reviews' ? 'active' : ''}`} onClick={() => setActiveTab('my-reviews')}>My Reviews</div>
                        <div className={`vearc-tab ${activeTab === 'all-feedback' ? 'active' : ''}`} onClick={() => setActiveTab('all-feedback')}>All Feedback</div>
                        <div className={`vearc-tab ${activeTab === 'top-rated' ? 'active' : ''}`} onClick={() => setActiveTab('top-rated')}>Top Rated Courses</div>
                    </div>

                    {/* MY REVIEWS TAB */}
                    {activeTab === 'my-reviews' && (
                        <div>
                            {enrollments.length === 0 ? (
                                <div className="empty-state">
                                    <div className="icon" style={{ color: 'var(--vearc-text-muted)' }}><ClipboardIcon width="48" height="48" /></div>
                                    <p>Complete a course to leave feedback</p>
                                </div>
                            ) : (
                                enrollments.map(enrollment => {
                                    const courseReviews = reviews[enrollment.course_id] || [];
                                    const user = api.getUser();
                                    const myReview = courseReviews.find(r => r.user_id === user?.id);
                                    const isWriting = submitForm.courseId === enrollment.course_id;

                                    return (
                                        <div key={enrollment.id} className="card" style={{ marginBottom: 16 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                                <h3 style={{ fontSize: '1.1rem' }}>{enrollment.course?.title || `Course #${enrollment.course_id}`}</h3>
                                                <span className="badge badge-success">Completed</span>
                                            </div>

                                            {myReview ? (
                                                <div style={{ marginBottom: 16, padding: 16, background: 'var(--vearc-bg)', borderRadius: 'var(--vearc-radius-sm)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                                        <span style={{ fontWeight: 600 }}>Your rating:</span>
                                                        <StarRating value={myReview.rating} readonly />
                                                    </div>
                                                    {myReview.comment && <p style={{ color: 'var(--vearc-text-secondary)', fontSize: '0.9rem' }}>{myReview.comment}</p>}
                                                </div>
                                            ) : isWriting ? (
                                                <div style={{ marginBottom: 16, padding: 16, background: 'var(--vearc-bg)', borderRadius: 'var(--vearc-radius-sm)' }}>
                                                    <div style={{ marginBottom: 12 }}>
                                                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Your Rating</label>
                                                        <StarRating value={submitForm.rating} onChange={r => setSubmitForm({ ...submitForm, rating: r })} />
                                                    </div>
                                                    <div style={{ marginBottom: 12 }}>
                                                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Comment (optional)</label>
                                                        <textarea
                                                            value={submitForm.comment}
                                                            onChange={e => setSubmitForm({ ...submitForm, comment: e.target.value })}
                                                            placeholder="Share your experience with this course..."
                                                            rows={3}
                                                        />
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 8 }}>
                                                        <button className="btn vearc-btn-primary btn-sm" onClick={handleSubmit} disabled={submitting || submitForm.rating === 0}>
                                                            {submitting ? 'Submitting...' : 'Submit Review'}
                                                        </button>
                                                        <button className="btn btn-secondary btn-sm" onClick={() => setSubmitForm({ courseId: null, rating: 0, comment: '' })}>Cancel</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }} onClick={() => setSubmitForm({ courseId: enrollment.course_id, rating: 0, comment: '' })}>
                                                    <EditIcon style={{ marginRight: 6 }} width="16" height="16" /> Write a Review
                                                </button>
                                            )}

                                            {/* Other learners' reviews */}
                                            {courseReviews.length > 0 && (
                                                <div>
                                                    <h4 style={{ fontSize: '0.85rem', color: 'var(--vearc-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                                                        All Reviews ({courseReviews.length})
                                                    </h4>
                                                    {courseReviews.map(review => (
                                                        <div key={review.id} className="review-card">
                                                            <div className="review-header">
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                    <span className="review-author">{review.user_name}</span>
                                                                    <StarRating value={review.rating} readonly />
                                                                </div>
                                                                <span className="review-date">
                                                                    {review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}
                                                                </span>
                                                            </div>
                                                            {review.comment && <p className="review-comment">{review.comment}</p>}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {/* ALL FEEDBACK TAB */}
                    {activeTab === 'all-feedback' && (
                        <div>
                            {/* Course filter dropdown */}
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ fontWeight: 600, fontSize: '0.9rem', display: 'block', marginBottom: 6 }}>Filter by Course</label>
                                <select
                                    className="form-select"
                                    value={courseFilter}
                                    onChange={e => setCourseFilter(e.target.value)}
                                    style={{ maxWidth: 400 }}
                                >
                                    <option value="">All Courses</option>
                                    {reviewedCourses.map(c => (
                                        <option key={c.id} value={c.id}>{c.title}</option>
                                    ))}
                                </select>
                            </div>

                            {filteredReviewedCourses.length === 0 ? (
                                <div className="empty-state">
                                    <div className="icon" style={{ color: 'var(--vearc-primary)' }}><StarIcon width="48" height="48" /></div>
                                    <p>No reviews found{courseFilter ? ' for this course' : ''}.</p>
                                </div>
                            ) : (
                                filteredReviewedCourses.map(course => {
                                    const courseReviews = allReviews[course.id] || [];
                                    const avgRating = courseReviews.length > 0
                                        ? (courseReviews.reduce((s, r) => s + r.rating, 0) / courseReviews.length).toFixed(1)
                                        : null;
                                    return (
                                        <div key={course.id} className="card" style={{ marginBottom: 20 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                                <div>
                                                    <h3 style={{ fontSize: '1.05rem', marginBottom: 4 }}>{course.title}</h3>
                                                    {avgRating && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <StarRating value={Math.round(parseFloat(avgRating))} readonly />
                                                            <span style={{ fontWeight: 700, color: 'var(--vearc-primary)', fontSize: '0.9rem' }}>{avgRating}</span>
                                                            <span style={{ color: 'var(--vearc-text-muted)', fontSize: '0.8rem' }}>({courseReviews.length} review{courseReviews.length !== 1 ? 's' : ''})</span>
                                                        </div>
                                                    )}
                                                </div>
                                                {course.category && <span className="badge badge-info">{course.category}</span>}
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                {courseReviews.map(review => (
                                                    <div key={review.id} className="review-card">
                                                        <div className="review-header">
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--vearc-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                                                                    {review.user_name?.[0]?.toUpperCase()}
                                                                </div>
                                                                <span className="review-author">{review.user_name}</span>
                                                                <StarRating value={review.rating} readonly />
                                                            </div>
                                                            <span className="review-date">
                                                                {review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}
                                                            </span>
                                                        </div>
                                                        {review.comment && <p className="review-comment">{review.comment}</p>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {/* TOP RATED TAB */}
                    {activeTab === 'top-rated' && (
                        <div>
                            {topRated.length === 0 ? (
                                <div className="empty-state">
                                    <div className="icon" style={{ color: 'var(--vearc-primary)' }}><StarIcon width="48" height="48" /></div>
                                    <p>No courses have been rated yet</p>
                                </div>
                            ) : (
                                <div className="course-grid">
                                    {topRated.map((course, i) => (
                                        <div key={course.course_id} className={`card ${i === 0 ? 'card-accent' : ''}`}>
                                            {i === 0 && <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--vearc-primary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: '4px' }}><StarIcon width="12" height="12" /> Highest Rated</div>}
                                            <h3 style={{ marginBottom: 8 }}>{course.title}</h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                                <StarRating value={Math.round(course.avg_rating)} readonly />
                                                <span className="rating-summary">
                                                    <span className="avg">{course.avg_rating}</span>
                                                    ({course.review_count} reviews)
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                                                <span className={`badge badge-${course.difficulty}`}>{course.difficulty}</span>
                                                <span className="badge badge-info">{course.category}</span>
                                            </div>
                                            {/* Reviews for this course */}
                                            {allReviews[course.course_id]?.length > 0 && (
                                                <div>
                                                    <h4 style={{ fontSize: '0.8rem', color: 'var(--vearc-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                                                        Reviews ({allReviews[course.course_id].length})
                                                    </h4>
                                                    {allReviews[course.course_id].map(review => (
                                                        <div key={review.id} className="review-card">
                                                            <div className="review-header">
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                    <span className="review-author">{review.user_name}</span>
                                                                    <StarRating value={review.rating} readonly />
                                                                </div>
                                                                <span className="review-date">
                                                                    {review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}
                                                                </span>
                                                            </div>
                                                            {review.comment && <p className="review-comment">{review.comment}</p>}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
