'use client';
import '../globals.css';
import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { TrophyIcon, MedalIcon, BookIcon, StarIcon, BarChartIcon, ClipboardIcon } from '@/components/Icons';

export default function LeaderboardPage() {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [animated, setAnimated] = useState(false);
    const [viewMode, setViewMode] = useState('bars'); // 'bars' | 'table'
    const chartRef = useRef(null);

    useEffect(() => {
        api.get('/leaderboard/').then(data => {
            setEntries(data);
            setLoading(false);
            // Trigger bar animation after data load
            setTimeout(() => setAnimated(true), 100);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, []);

    // Intersection observer for scroll animation
    useEffect(() => {
        if (!chartRef.current) return;
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(e => {
                    if (e.isIntersecting) setAnimated(true);
                });
            },
            { threshold: 0.1 }
        );
        observer.observe(chartRef.current);
        return () => observer.disconnect();
    }, [loading]);

    if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

    const maxPoints = entries.length > 0 ? Math.max(...entries.map(e => e.total_points)) : 1;
    const medals = [
        <TrophyIcon key="1" width="24" height="24" style={{ color: 'var(--vearc-primary)' }} />,
        <MedalIcon key="2" width="24" height="24" style={{ color: 'var(--vearc-text-muted)' }} />,
        <MedalIcon key="3" width="24" height="24" style={{ color: 'var(--vearc-text-muted)' }} />
    ];
    const podiumClasses = ['first', 'second', 'third'];
    const barClasses = ['gold', 'silver', 'bronze'];
    const top3 = entries.slice(0, 3);

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content" style={{ padding: 0 }}>
                <Header />
                <div className="leaderboard-container" style={{ padding: '24px' }}>
                    <div className="page-header" style={{ textAlign: 'center' }}>
                        <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                            <TrophyIcon width="36" height="36" style={{ color: 'var(--vearc-primary)' }} /> Leaderboard
                        </h1>
                        <p>Top learners ranked by total points earned across all activities</p>
                    </div>

                    {/* Podium for top 3 */}
                    {top3.length > 0 && (
                        <div className="leaderboard-podium">
                            {top3.length > 1 && (
                                <div className={`podium-item ${podiumClasses[1]}`}>
                                    <div className="podium-medal">{medals[1]}</div>
                                    <div className="podium-name">{top3[1].user_name}</div>
                                    <div className="podium-points">{top3[1].total_points} pts</div>
                                    <div className="lb-stat-pills" style={{ justifyContent: 'center', marginTop: 8 }}>
                                        <span className="lb-pill" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><BookIcon width="14" height="14" /> {top3[1].courses_completed}</span>
                                        <span className="lb-pill" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MedalIcon width="14" height="14" /> {top3[1].badges_count}</span>
                                    </div>
                                </div>
                            )}
                            <div className={`podium-item first`} style={{ transform: 'scale(1.08)' }}>
                                <div className="podium-medal">{medals[0]}</div>
                                <div className="podium-name">{top3[0].user_name}</div>
                                <div className="podium-points">{top3[0].total_points} pts</div>
                                <div className="lb-stat-pills" style={{ justifyContent: 'center', marginTop: 8 }}>
                                    <span className="lb-pill" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><BookIcon width="14" height="14" /> {top3[0].courses_completed}</span>
                                    <span className="lb-pill" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MedalIcon width="14" height="14" /> {top3[0].badges_count}</span>
                                </div>
                            </div>
                            {top3.length > 2 && (
                                <div className={`podium-item ${podiumClasses[2]}`}>
                                    <div className="podium-medal">{medals[2]}</div>
                                    <div className="podium-name">{top3[2].user_name}</div>
                                    <div className="podium-points">{top3[2].total_points} pts</div>
                                    <div className="lb-stat-pills" style={{ justifyContent: 'center', marginTop: 8 }}>
                                        <span className="lb-pill" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><BookIcon width="14" height="14" /> {top3[2].courses_completed}</span>
                                        <span className="lb-pill" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MedalIcon width="14" height="14" /> {top3[2].badges_count}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* View toggle */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
                        <button
                            className={`btn btn-sm ${viewMode === 'bars' ? 'vearc-btn-primary' : 'btn-secondary'}`}
                            onClick={() => setViewMode('bars')}
                        >
                            <BarChartIcon width="16" height="16" style={{ marginRight: 6 }} /> Bar Chart
                        </button>
                        <button
                            className={`btn btn-sm ${viewMode === 'table' ? 'vearc-btn-primary' : 'btn-secondary'}`}
                            onClick={() => setViewMode('table')}
                        >
                            <ClipboardIcon width="16" height="16" style={{ marginRight: 6 }} /> Table
                        </button>
                    </div>

                    {/* Bar Chart View */}
                    {viewMode === 'bars' && (
                        <div className="lb-chart card" ref={chartRef} style={{ padding: 24 }}>
                            <h3 style={{ marginBottom: 20, fontSize: '1.1rem' }}>Points Distribution</h3>
                            {entries.map((entry, idx) => {
                                const pct = maxPoints > 0 ? (entry.total_points / maxPoints) * 100 : 0;
                                const barClass = idx < 3 ? barClasses[idx] : 'purple';
                                return (
                                    <div key={entry.user_id || idx}>
                                        <div
                                            className="lb-bar-row"
                                            onClick={() => toggleExpand(entry.user_id || idx)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className={`lb-rank ${idx < 3 ? 'top' : ''}`}>
                                                {idx < 3 ? medals[idx] : idx + 1}
                                            </div>
                                            <div className="lb-name" title={entry.user_name}>
                                                {entry.user_name}
                                            </div>
                                            <div className="lb-bar-container">
                                                <div
                                                    className={`lb-bar-fill ${barClass}`}
                                                    style={{
                                                        width: animated ? `${Math.max(pct, 8)}%` : '0%',
                                                        transitionDelay: `${idx * 0.08}s`,
                                                    }}
                                                >
                                                    <span className="lb-bar-label">
                                                        {entry.total_points} pts
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="lb-points">
                                                {entry.total_points}
                                            </div>
                                        </div>

                                        {/* Expanded detail row */}
                                        {expandedId === (entry.user_id || idx) && (
                                            <div className="lb-expanded">
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                                                    <div className="stat-card" style={{ padding: 12 }}>
                                                        <div className="stat-value" style={{ fontSize: '1.3rem' }}>{entry.courses_completed}</div>
                                                        <div className="stat-label" style={{ fontSize: '0.65rem' }}>Courses Done</div>
                                                    </div>
                                                    <div className="stat-card" style={{ padding: 12 }}>
                                                        <div className="stat-value" style={{ fontSize: '1.3rem' }}>{entry.badges_count}</div>
                                                        <div className="stat-label" style={{ fontSize: '0.65rem' }}>Badges</div>
                                                    </div>
                                                    <div className="stat-card" style={{ padding: 12 }}>
                                                        <div className="stat-value" style={{ fontSize: '1.3rem' }}>{entry.avg_score?.toFixed(0) || '-'}</div>
                                                        <div className="stat-label" style={{ fontSize: '0.65rem' }}>Avg Quiz Score</div>
                                                    </div>
                                                    <div className="stat-card" style={{ padding: 12 }}>
                                                        <div className="stat-value" style={{ fontSize: '1.3rem' }}>{entry.total_points}</div>
                                                        <div className="stat-label" style={{ fontSize: '0.65rem' }}>Total Points</div>
                                                    </div>
                                                </div>
                                                {/* Points breakdown bar */}
                                                <div style={{ marginTop: 12, padding: '8px 0' }}>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--vearc-text-muted)', marginBottom: 6 }}>Points Breakdown</div>
                                                    <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', background: 'var(--vearc-surface)' }}>
                                                        <div style={{ width: `${entry.total_points > 0 ? (entry.courses_completed * 100 / entry.total_points) * 100 : 0}%`, background: 'var(--vearc-primary)', transition: 'width 0.5s' }} title="Courses" />
                                                        <div style={{ width: `${entry.total_points > 0 ? (entry.badges_count * 50 / entry.total_points) * 100 : 0}%`, background: 'var(--vearc-primary)', transition: 'width 0.5s' }} title="Badges" />
                                                        <div style={{ width: `${entry.total_points > 0 ? ((entry.avg_score || 0) / entry.total_points) * 100 : 0}%`, background: 'var(--vearc-success)', transition: 'width 0.5s' }} title="Quiz Scores" />
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: '0.7rem', color: 'var(--vearc-text-muted)' }}>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--vearc-primary)' }} /> Courses ({entry.courses_completed * 100}pts)
                                                        </span>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--vearc-primary)' }} /> Badges ({entry.badges_count * 50}pts)
                                                        </span>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--vearc-success)' }} /> Quizzes
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Table View */}
                    {viewMode === 'table' && (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>Learner</th>
                                        <th>Courses</th>
                                        <th>Badges</th>
                                        <th>Avg Score</th>
                                        <th>Total Points</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entries.map((entry, idx) => (
                                        <tr key={entry.user_id || idx} style={{ cursor: 'pointer' }} onClick={() => toggleExpand(entry.user_id || idx)}>
                                            <td>
                                                <span style={{ fontWeight: 700 }}>
                                                    {idx < 3 ? medals[idx] : `#${idx + 1}`}
                                                </span>
                                            </td>
                                            <td style={{ fontWeight: 600 }}>{entry.user_name}</td>
                                            <td>{entry.courses_completed}</td>
                                            <td>{entry.badges_count}</td>
                                            <td>{entry.avg_score?.toFixed(1) || '-'}</td>
                                            <td>
                                                <span style={{ fontWeight: 800, color: 'var(--vearc-primary-light)' }}>
                                                    {entry.total_points}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {entries.length === 0 && (
                        <div className="empty-state">
                            <div className="icon" style={{ color: 'var(--vearc-primary)', marginBottom: '16px' }}>
                                <TrophyIcon width="48" height="48" />
                            </div>
                            <p>No leaderboard data yet. Complete courses to earn points!</p>
                        </div>
                    )}

                    {/* How points work */}
                    <div className="card" style={{ marginTop: 32, padding: 24 }}>
                        <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <StarIcon width="20" height="20" style={{ color: 'var(--vearc-primary)' }} /> How Points Work
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--vearc-primary-verylight)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--vearc-primary)', flexShrink: 0 }}><BookIcon width="20" height="20" /></div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Course Completion</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--vearc-text-muted)' }}>+100 pts per course</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--vearc-primary-verylight)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--vearc-primary)', flexShrink: 0 }}><MedalIcon width="20" height="20" /></div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Badge Earned</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--vearc-text-muted)' }}>+50 pts per badge</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--vearc-surface-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--vearc-success)', flexShrink: 0 }}>
                                    <div style={{ width: 14, height: 14, borderBottom: '2px solid currentColor', borderRight: '2px solid currentColor', transform: 'rotate(45deg)' }} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Quiz Score</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--vearc-text-muted)' }}>Average quiz score added</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
