'use client';
import '../../globals.css';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import PathMap from '@/components/PathMap';

export default function LearningPathMapPage({ params }) {
    const router = useRouter();
    const [pathData, setPathData] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadPathMap = async () => {
        try {
            const data = await api.get(`/learning-paths/${params.id}/map`);
            setPathData(data);
        } catch (err) {
            console.error(err);
            alert('Failed to load learning path map.');
            router.push('/learning-paths');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPathMap();
    }, [params.id]);

    if (loading) return <div className="loading-page"><div className="spinner"></div></div>;
    if (!pathData) return <div className="app-layout"><Sidebar /><main className="main-content"><h2>Path not found</h2></main></div>;

    const completedSteps = pathData.steps.filter(s => s.status === 'completed').length;
    const totalSteps = pathData.steps.length;
    const progressPct = totalSteps === 0 ? 0 : Math.round((completedSteps / totalSteps) * 100);

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div style={{ marginBottom: 24 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => router.push('/learning-paths')}>
                        &larr; Back to Paths
                    </button>
                </div>

                <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1>{pathData.name}</h1>
                        <p>{pathData.description}</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: progressPct === 100 ? 'var(--success)' : 'var(--accent)' }}>
                            {progressPct}%
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {completedSteps} of {totalSteps} steps completed
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: 40 }}>
                    <PathMap
                        pathId={pathData.path_id}
                        steps={pathData.steps}
                        onProgressUpdated={loadPathMap}
                    />
                </div>
            </main>
        </div>
    );
}
