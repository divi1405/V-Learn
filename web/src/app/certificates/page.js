'use client';
import '../globals.css';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { TrophyIcon, MedalIcon, ClipboardIcon, BookIcon } from '@/components/Icons';

const BADGE_LEVELS = [
    { level: 'Bronze', icon: <MedalIcon width="32" height="32" style={{ color: 'var(--vearc-surface)' }} />, desc: 'Complete 1 course', threshold: 1, className: 'bronze' },
    { level: 'Silver', icon: <MedalIcon width="32" height="32" style={{ color: 'var(--vearc-surface)' }} />, desc: 'Complete 5 courses', threshold: 5, className: 'silver' },
    { level: 'Gold', icon: <TrophyIcon width="32" height="32" style={{ color: 'var(--vearc-surface)' }} />, desc: 'Complete 10 courses', threshold: 10, className: 'gold' },
    { level: 'Platinum', icon: <TrophyIcon width="32" height="32" style={{ color: 'var(--vearc-surface)' }} />, desc: 'Complete all courses', threshold: 999, className: 'platinum' },
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
                api.get('/badges/me').catch(() => []),
            ]);
            setCertificates(certData);
            setEnrollments(enrollData);
            setBadges(badgeData);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const completedEnrollments = enrollments.filter(e => e.status === 'completed');
    const hasCert = (courseId) => certificates.some(c => c.course_id === courseId);
    const hasBadge = (level) => badges.some(b => b.level && b.level.toLowerCase() === level.toLowerCase());

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
            <main className="main-content" style={{ padding: 0 }}>
                <Header />
                <div style={{ padding: '24px' }}>
                    <div className="page-header">
                        <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><TrophyIcon width="36" height="36" style={{ color: '#1a1a1a' }} /> Certificates & Badges</h1>
                        <p>Your earned credentials, badges and achievements.</p>
                    </div>

                    {/* Badges Section */}
                    <div style={{ marginBottom: 32 }}>
                        <div className="section-header">
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><MedalIcon width="24" height="24" style={{ color: '#1a1a1a' }} /> Badges</h2>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                            {BADGE_LEVELS.map(bl => {
                                const earned = hasBadge(bl.level);
                                return (
                                    <div key={bl.level} className={`badge-card ${earned ? 'earned' : 'locked'}`}>
                                        <div className={`badge-icon ${bl.className}`}>
                                            {bl.icon}
                                        </div>
                                        <div className="badge-text-content">
                                            <h4>{bl.level} Badge</h4>
                                            <p>{earned ? bl.desc.replace('Complete', 'Completed') : bl.desc}</p>
                                            {earned ? (
                                                <span className="badge badge-success" style={{ marginTop: 4 }}>Earned</span>
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
                                <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ClipboardIcon width="24" height="24" style={{ color: 'var(--vearc-primary)' }} /> Earned Certificates</h2>
                            </div>
                            <div className="course-grid">
                                {certificates.map((cert) => (
                                    <div key={cert.id} className="card" style={{ textAlign: 'center' }}>
                                        <div style={{ color: 'var(--vearc-primary)', marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
                                            <TrophyIcon width="48" height="48" />
                                        </div>
                                        <h3 style={{ marginBottom: 8 }}>{cert.course?.title || `Course ${cert.course_id}`}</h3>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--vearc-text-secondary)', marginBottom: 4 }}>
                                            Issued: {cert.issued_at ? new Date(cert.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--vearc-text-muted)', marginBottom: 16 }}>
                                            ID: {cert.credential_id}
                                        </div>
                                        <a
                                            href={`/api/certificates/download/${cert.credential_id}`}
                                            target="_blank"
                                            className="btn vearc-btn-primary btn-sm"
                                        >
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ClipboardIcon width="16" height="16" /> Download PDF</span>
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
                                <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><BookIcon width="24" height="24" style={{ color: 'var(--vearc-primary)' }} /> Available to Claim</h2>
                            </div>
                            <div className="course-grid">
                                {completedEnrollments.filter(e => !hasCert(e.course_id)).map((e) => (
                                    <div key={e.id} className="card" style={{ textAlign: 'center' }}>
                                        <div style={{ color: 'var(--vearc-text-muted)', opacity: 0.5, marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
                                            <BookIcon width="48" height="48" />
                                        </div>
                                        <h3 style={{ fontSize: '1rem', marginBottom: 8 }}>{e.course?.title}</h3>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--vearc-text-secondary)', marginBottom: 16 }}>
                                            Course completed - claim your certificate!
                                        </p>
                                        <button className="btn vearc-btn-primary" onClick={() => generateCert(e.course_id)}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ClipboardIcon width="16" height="16" /> Generate Certificate</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {certificates.length === 0 && completedEnrollments.length === 0 && badges.length === 0 && (
                        <div className="empty-state">
                            <div className="icon" style={{ color: 'var(--vearc-primary)', marginBottom: 16 }}>
                                <TrophyIcon width="48" height="48" />
                            </div>
                            <p>Complete courses to earn badges, certificates, and showcase your achievements</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
