'use client';
import '../globals.css';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';

const BADGE_LEVELS = [
    { level: 'Bronze', icon: '🥉', desc: 'Complete 1 course', threshold: 1, className: 'bronze' },
    { level: 'Silver', icon: '🥈', desc: 'Complete 3 courses', threshold: 3, className: 'silver' },
    { level: 'Gold', icon: '🥇', desc: 'Complete 5 courses', threshold: 5, className: 'gold' },
    { level: 'Platinum', icon: '💎', desc: 'Complete all courses', threshold: 999, className: 'platinum' },
];

export default function CertificatesPage() {
    const [certificates, setCertificates] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [badges, setBadges] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [certData, enrollData, badgeData] = await Promise.all([
                api.get('/certificates'),
                api.get('/enrollments'),
                api.get('/badges/').catch(() => []),
            ]);
            setCertificates(certData);
            setEnrollments(enrollData);
            setBadges(badgeData);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const completedEnrollments = enrollments.filter(e => e.status === 'completed');
    const hasCert = (courseId) => certificates.some(c => c.course_id === courseId);
    const hasBadge = (level) => badges.some(b => b.badge_level === level);

    const generateCert = async (courseId) => {
        try {
            await api.post(`/certificates/generate/${courseId}`, {});
            loadData();
        } catch (err) { alert(err.message); }
    };

    if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="page-header">
                    <h1>🏆 Certificates & Badges</h1>
                    <p>Your earned credentials, badges, and achievements</p>
                </div>

                {/* Badges Section */}
                <div style={{ marginBottom: 32 }}>
                    <div className="section-header">
                        <h2>🎖️ Badges</h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                        {BADGE_LEVELS.map(bl => {
                            const earned = hasBadge(bl.level);
                            return (
                                <div key={bl.level} className={`badge-card ${earned ? 'earned' : 'locked'}`}>
                                    <div className={`badge-icon ${bl.className}`}>
                                        {bl.icon}
                                    </div>
                                    <div className="badge-info">
                                        <h4>{bl.level} Badge</h4>
                                        <p>{bl.desc}</p>
                                        {earned ? (
                                            <span className="badge badge-success" style={{ marginTop: 4 }}>✓ Earned</span>
                                        ) : (
                                            <span className="badge badge-info" style={{ marginTop: 4 }}>🔒 Locked</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Certificates Section */}
                {certificates.length > 0 && (
                    <div style={{ marginBottom: 32 }}>
                        <div className="section-header">
                            <h2>📜 Earned Certificates</h2>
                        </div>
                        <div className="course-grid">
                            {certificates.map((cert) => (
                                <div key={cert.id} className="card" style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 48, marginBottom: 12 }}>🏅</div>
                                    <h3 style={{ marginBottom: 8 }}>{cert.course?.title || `Course ${cert.course_id}`}</h3>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                                        Issued: {cert.issued_at ? new Date(cert.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                                        ID: {cert.credential_id}
                                    </div>
                                    <a
                                        href={`/api/certificates/download/${cert.credential_id}`}
                                        target="_blank"
                                        className="btn btn-primary btn-sm"
                                    >
                                        📄 Download PDF
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Available to Claim */}
                {completedEnrollments.filter(e => !hasCert(e.course_id)).length > 0 && (
                    <div style={{ marginBottom: 32 }}>
                        <div className="section-header">
                            <h2>🎓 Available to Claim</h2>
                        </div>
                        <div className="course-grid">
                            {completedEnrollments.filter(e => !hasCert(e.course_id)).map((e) => (
                                <div key={e.id} className="card" style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.5 }}>🎓</div>
                                    <h3 style={{ fontSize: '1rem', marginBottom: 8 }}>{e.course?.title}</h3>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                                        Course completed — claim your certificate!
                                    </p>
                                    <button className="btn btn-primary" onClick={() => generateCert(e.course_id)}>
                                        Generate Certificate
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {certificates.length === 0 && completedEnrollments.length === 0 && badges.length === 0 && (
                    <div className="empty-state">
                        <div className="icon">🏆</div>
                        <p>Complete courses to earn badges, certificates, and showcase your achievements</p>
                    </div>
                )}
            </main>
        </div>
    );
}
