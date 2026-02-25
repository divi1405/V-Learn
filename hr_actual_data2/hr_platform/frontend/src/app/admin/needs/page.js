'use client';
import '../../globals.css';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';

export default function AdminLearningNeedsPage() {
    const [lnas, setLnas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadLNAs();
    }, []);

    const loadLNAs = async () => {
        try {
            setLoading(true);
            const data = await api.get('/lna/admin');
            setLnas(data);
        } catch (err) {
            console.error('Failed to load LNAs:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredLnas = lnas.filter(lna =>
        (lna.user_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lna.learning_goals || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lna.current_skill_level || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

    // Calculate stats
    const totalSubmissions = lnas.length;
    const formatCounts = lnas.reduce((acc, lna) => {
        acc[lna.preferred_format] = (acc[lna.preferred_format] || 0) + 1;
        return acc;
    }, {});

    // Find the most popular format
    let topFormat = '-';
    let topFormatCount = 0;
    for (const [format, count] of Object.entries(formatCounts)) {
        if (count > topFormatCount) {
            topFormat = format;
            topFormatCount = count;
        }
    }

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="page-header">
                    <h1>🎯 Learning Needs Analysis</h1>
                    <p>Review what skills and formats your learners are requesting</p>
                </div>

                {error && <div className="alert alert-error" style={{ marginBottom: 24 }}>{error}</div>}

                <div className="stats-grid" style={{ marginBottom: 32 }}>
                    <div className="stat-card">
                        <div className="value">{totalSubmissions}</div>
                        <div className="label">Total Submissions</div>
                    </div>
                    <div className="stat-card">
                        <div className="value" style={{ textTransform: 'capitalize' }}>
                            {topFormat}
                        </div>
                        <div className="label">Top Preferred Format ({topFormatCount})</div>
                    </div>
                    <div className="stat-card">
                        <div className="value">
                            {lnas.filter(l => l.current_skill_level === 'beginner').length} / {lnas.filter(l => l.current_skill_level === 'advanced').length}
                        </div>
                        <div className="label">Beginners / Advanced</div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <h2 style={{ fontSize: '1.2rem' }}>Learner Submissions</h2>
                        <div className="search-wrapper" style={{ width: 300 }}>
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search names, skills, goals..."
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
                                    <th>Learner</th>
                                    <th>Skill Level</th>
                                    <th>Format</th>
                                    <th>Time/Week</th>
                                    <th>Areas of Interest</th>
                                    <th>Learning Goals</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLnas.length === 0 ? (
                                    <tr><td colSpan="7" className="text-center" style={{ padding: 40, color: 'var(--text-muted)' }}>No data found</td></tr>
                                ) : (
                                    filteredLnas.map(lna => (
                                        <tr key={lna.id}>
                                            <td style={{ fontWeight: 600 }}>{lna.user_name}</td>
                                            <td>
                                                <span className={`badge badge-${lna.current_skill_level === 'beginner' ? 'info' : lna.current_skill_level === 'intermediate' ? 'warning' : 'danger'}`}>
                                                    {lna.current_skill_level}
                                                </span>
                                            </td>
                                            <td style={{ textTransform: 'capitalize' }}>{lna.preferred_format}</td>
                                            <td>{lna.weekly_time_commitment}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 200 }}>
                                                    {(lna.areas_of_interest || []).map(skill => (
                                                        <span key={skill} className="badge badge-neutral" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>{skill}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td style={{ maxWidth: 300, whiteSpace: 'normal', lineHeight: 1.4, color: 'var(--text-secondary)' }}>
                                                {lna.learning_goals}
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)' }}>
                                                {new Date(lna.submitted_at).toLocaleDateString()}
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
