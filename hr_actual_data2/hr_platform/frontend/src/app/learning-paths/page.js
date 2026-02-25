'use client';
import '../globals.css';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';

export default function LearningPathsPage() {
    const router = useRouter();
    const [paths, setPaths] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const pathData = await api.get('/learning-paths/recommended');
            setPaths(pathData);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="page-header">
                    <h1>Recommended Learning Paths</h1>
                    <p>Structured, personalized journeys to help you reach your career goals</p>
                </div>

                <div className="course-grid">
                    {paths.map((path) => (
                        <div
                            key={path.id}
                            className="card fade-in"
                            style={{ cursor: 'pointer', transition: 'transform 0.2s', padding: 24 }}
                            onClick={() => router.push(`/learning-paths/${path.id}`)}
                        >
                            <h3 style={{ marginBottom: 8, color: 'var(--text-primary)' }}>{path.name}</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 16 }}>
                                {path.description}
                            </p>
                            <div className="path-meta" style={{ display: 'flex', gap: 12, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                {path.department && <span className="badge badge-info">🏢 {path.department}</span>}
                                {path.target_role && <span className="badge badge-accent">🎯 {path.target_role}</span>}
                            </div>
                            <div style={{ marginTop: 24, textAlign: 'right' }}>
                                <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '0.9rem' }}>View Path &rarr;</span>
                            </div>
                        </div>
                    ))}
                </div>

                {paths.length === 0 && (
                    <div className="empty-state">
                        <div className="icon">🛤️</div>
                        <h3>No learning paths available</h3>
                        <p>We're still curating personalized paths for your role.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
