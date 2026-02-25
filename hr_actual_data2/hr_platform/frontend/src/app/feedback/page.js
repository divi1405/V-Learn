'use client';
import '../globals.css';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';

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
                >★</span>
            ))}
        </div>
    );
};

export default function FeedbackPage() {
    const [enrollments, setEnrollments] = useState([]);
    const [reviews, setReviews] = useState({});
    const [topRated, setTopRated] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitForm, setSubmitForm] = useState({ courseId: null, rating: 0, comment: '' });
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('my-reviews');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [enrollData, topData] = await Promise.all([
                api.get('/enrollments'),
                api.get('/courses/top-rated').catch(() => []),
            ]);
            setEnrollments(enrollData.filter(e => e.status === 'completed'));
            setTopRated(topData);

            // Load reviews for completed courses
            const reviewMap = {};
            for (const e of enrollData.filter(en => en.status === 'completed')) {
                try {
                    const r = await api.get(`/courses/${e.course_id}/reviews`);
                    reviewMap[e.course_id] = r;
                } catch (err) { reviewMap[e.course_id] = []; }
            }
            setReviews(reviewMap);
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

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="page-header">
                    <h1>⭐ Feedback & Ratings</h1>
                    <p>Rate your completed courses and see what others think</p>
                </div>

                <div className="tabs">
                    <div className={`tab ${activeTab === 'my-reviews' ? 'active' : ''}`} onClick={() => setActiveTab('my-reviews')}>My Reviews</div>
                    <div className={`tab ${activeTab === 'top-rated' ? 'active' : ''}`} onClick={() => setActiveTab('top-rated')}>Top Rated Courses</div>
                </div>

                {activeTab === 'my-reviews' && (
                    <div>
                        {enrollments.length === 0 ? (
                            <div className="empty-state">
                                <div className="icon">📝</div>
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
                                            <div style={{ marginBottom: 16, padding: 16, background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                                    <span style={{ fontWeight: 600 }}>Your rating:</span>
                                                    <StarRating value={myReview.rating} readonly />
                                                </div>
                                                {myReview.comment && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{myReview.comment}</p>}
                                            </div>
                                        ) : isWriting ? (
                                            <div style={{ marginBottom: 16, padding: 16, background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
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
                                                    <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={submitting || submitForm.rating === 0}>
                                                        {submitting ? 'Submitting...' : 'Submit Review'}
                                                    </button>
                                                    <button className="btn btn-secondary btn-sm" onClick={() => setSubmitForm({ courseId: null, rating: 0, comment: '' })}>Cancel</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }} onClick={() => setSubmitForm({ courseId: enrollment.course_id, rating: 0, comment: '' })}>
                                                ✏️ Write a Review
                                            </button>
                                        )}

                                        {/* Other learners' reviews */}
                                        {courseReviews.length > 0 && (
                                            <div>
                                                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
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

                {activeTab === 'top-rated' && (
                    <div>
                        {topRated.length === 0 ? (
                            <div className="empty-state">
                                <div className="icon">⭐</div>
                                <p>No courses have been rated yet</p>
                            </div>
                        ) : (
                            <div className="course-grid">
                                {topRated.map((course, i) => (
                                    <div key={course.course_id} className={`card ${i === 0 ? 'card-accent' : ''}`}>
                                        {i === 0 && <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>⭐ Highest Rated</div>}
                                        <h3 style={{ marginBottom: 8 }}>{course.title}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                            <StarRating value={Math.round(course.avg_rating)} readonly />
                                            <span className="rating-summary">
                                                <span className="avg">{course.avg_rating}</span>
                                                ({course.review_count} reviews)
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <span className={`badge badge-${course.difficulty}`}>{course.difficulty}</span>
                                            <span className="badge badge-info">{course.category}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
