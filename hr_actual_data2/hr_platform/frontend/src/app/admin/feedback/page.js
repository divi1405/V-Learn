'use client';
import '../../globals.css';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';

const StarRating = ({ value }) => {
    return (
        <div className="stars">
            {[1, 2, 3, 4, 5].map(star => (
                <span
                    key={star}
                    className={`star ${star <= value ? 'filled' : ''}`}
                    style={{ cursor: 'default', fontSize: '1rem' }}
                >★</span>
            ))}
        </div>
    );
};

export default function AdminFeedbackPage() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadReviews();
    }, []);

    const loadReviews = async () => {
        try {
            setLoading(true);
            const data = await api.get('/admin/reviews');
            setReviews(data);
        } catch (err) {
            console.error('Failed to load reviews:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredReviews = reviews.filter(r =>
        (r.course_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.user_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.comment || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

    // Calculate stats
    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
        : 0;

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="page-header">
                    <h1>⭐ Platform Feedback</h1>
                    <p>View all course reviews and ratings from learners</p>
                </div>

                {error && <div className="alert alert-error" style={{ marginBottom: 24 }}>{error}</div>}

                <div className="stats-grid" style={{ marginBottom: 32 }}>
                    <div className="stat-card">
                        <div className="value">{totalReviews}</div>
                        <div className="label">Total Reviews</div>
                    </div>
                    <div className="stat-card">
                        <div className="value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {avgRating} <span style={{ color: '#f1c40f', fontSize: '1.5rem' }}>★</span>
                        </div>
                        <div className="label">Average Rating</div>
                    </div>
                    <div className="stat-card">
                        <div className="value">{reviews.filter(r => r.rating >= 4).length}</div>
                        <div className="label">4+ Star Ratings</div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <h2 style={{ fontSize: '1.2rem' }}>All Feedback</h2>
                        <div className="search-wrapper" style={{ width: 300 }}>
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search feedback..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <span className="search-icon">🔍</span>
                        </div>
                    </div>

                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Learner</th>
                                    <th>Course</th>
                                    <th>Rating</th>
                                    <th>Comment</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredReviews.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center" style={{ padding: 40, color: 'var(--text-muted)' }}>No feedback found</td></tr>
                                ) : (
                                    filteredReviews.map(review => (
                                        <tr key={review.id}>
                                            <td style={{ color: 'var(--text-secondary)' }}>
                                                {new Date(review.created_at).toLocaleDateString()}
                                            </td>
                                            <td style={{ fontWeight: 600 }}>{review.user_name}</td>
                                            <td>{review.course_title}</td>
                                            <td>
                                                <StarRating value={review.rating} />
                                            </td>
                                            <td style={{ maxWidth: 300, whiteSpace: 'normal', lineHeight: 1.4, color: 'var(--text-secondary)' }}>
                                                {review.comment ? `"${review.comment}"` : '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
