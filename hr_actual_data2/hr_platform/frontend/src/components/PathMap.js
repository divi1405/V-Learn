// frontend/src/components/PathMap.js
import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function PathMap({ pathId, steps, onProgressUpdated }) {
    const [selectedStep, setSelectedStep] = useState(null);
    const [loadingCheckpoints, setLoadingCheckpoints] = useState({});

    // Keep selected step in sync if steps refresh globally
    useEffect(() => {
        if (selectedStep) {
            const updated = steps.find(s => s.id === selectedStep.id);
            if (updated) setSelectedStep(updated);
        }
    }, [steps]);

    const handleCheckpointComplete = async (stepId, checkId, completed) => {
        setLoadingCheckpoints(prev => ({ ...prev, [checkId]: true }));
        try {
            await api.post(`/learning-paths/${pathId}/checkpoints/${checkId}/complete`, { completed });
            if (onProgressUpdated) await onProgressUpdated();
        } catch (err) {
            alert(err.message);
        } finally {
            setLoadingCheckpoints(prev => ({ ...prev, [checkId]: false }));
        }
    };

    return (
        <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, position: 'relative', padding: '20px 0' }}>
                <div style={{
                    position: 'absolute', top: 40, bottom: 40, left: '50%',
                    width: 4, background: 'var(--border-color)', transform: 'translateX(-50%)', zIndex: 0
                }} />

                {steps.map((step, index) => {
                    const isLeft = index % 2 === 0;
                    const isLocked = step.status === 'locked';
                    const isAvailable = step.status === 'available';
                    const isCompleted = step.status === 'completed';

                    let nodeColor = 'var(--bg-card)';
                    let borderColor = 'var(--border-color)';
                    let icon = '🔒';
                    if (isCompleted) {
                        borderColor = 'var(--success)';
                        icon = '✅';
                    } else if (isAvailable) {
                        borderColor = 'var(--accent)';
                        icon = '▶️';
                    }

                    return (
                        <div key={step.id} style={{
                            display: 'flex', justifyContent: isLeft ? 'flex-end' : 'flex-start',
                            position: 'relative', marginBottom: 40, zIndex: 1
                        }}>
                            <div style={{
                                position: 'absolute', left: '50%', transform: 'translate(-50%, 0)',
                                width: 40, height: 40, borderRadius: '50%',
                                background: isAvailable ? 'var(--accent-primary)' : nodeColor,
                                border: `3px solid ${borderColor}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 18, zIndex: 2,
                                boxShadow: isAvailable ? '0 0 15px var(--accent-primary)' : 'none'
                            }}>
                                {icon}
                            </div>

                            <div
                                className={`card ${isLocked ? 'locked-node' : ''}`}
                                style={{
                                    width: '45%',
                                    marginRight: isLeft ? '5%' : 0, marginLeft: !isLeft ? '5%' : 0,
                                    cursor: isLocked ? 'not-allowed' : 'pointer',
                                    border: selectedStep?.id === step.id ? '2px solid var(--text-primary)' : undefined,
                                    opacity: isLocked ? 0.6 : 1, padding: '16px 20px',
                                }}
                                onClick={() => { if (!isLocked) setSelectedStep(step); }}
                            >
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                                    Step {index + 1} {step.track ? `• ${step.track} Track` : ''}
                                </div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{step.title}</h3>
                                {step.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 8 }}>{step.description}</p>}

                                {isAvailable && <div style={{ marginTop: 12, fontWeight: 600, color: 'var(--accent)', fontSize: '0.85rem' }}>Next Up ➔</div>}
                                {isCompleted && <div style={{ marginTop: 12, fontWeight: 600, color: 'var(--success)', fontSize: '0.85rem' }}>Completed Step</div>}
                            </div>
                        </div>
                    );
                })}
            </div>

            {selectedStep && (
                <div className="card fade-in" style={{ width: 400, position: 'sticky', top: 20, padding: 24, border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h2 style={{ fontSize: '1.2rem', margin: 0 }}>{selectedStep.title}</h2>
                        <button className="btn btn-secondary btn-sm" onClick={() => setSelectedStep(null)}>✕</button>
                    </div>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 20 }}>
                        {selectedStep.status === 'completed' ? 'You have completed all checkpoints for this step.' : 'Complete the following checkpoints to unlock the next step in your map.'}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {selectedStep.checkpoints.map(cp => (
                            <div key={cp.id} style={{
                                padding: 16, borderRadius: 'var(--radius-md)',
                                background: 'var(--bg-document)',
                                border: '1px solid var(--border-color)',
                                display: 'flex', flexDirection: 'column', gap: 12
                            }}>
                                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                    <div style={{ fontSize: 20 }}>
                                        {cp.type === 'video' ? '📺' : cp.type === 'quiz' ? '📝' : cp.type === 'article' ? '📄' : '🎯'}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: cp.completed ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: cp.completed ? 'line-through' : 'none' }}>
                                            {cp.title}
                                            {cp.is_required && <span style={{ color: 'var(--danger)', marginLeft: 4 }}>*</span>}
                                        </div>
                                    </div>
                                </div>

                                {cp.content && (
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '8px 12px', background: 'var(--bg-card)', borderRadius: 4 }}>
                                        {cp.content}
                                    </div>
                                )}
                                {cp.content_url && (
                                    <a href={cp.content_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 600 }}>
                                        Open Link ↗
                                    </a>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                                    <button
                                        className={`btn btn-sm ${cp.completed ? 'btn-secondary' : 'btn-primary'}`}
                                        onClick={() => handleCheckpointComplete(selectedStep.id, cp.id, !cp.completed)}
                                        disabled={loadingCheckpoints[cp.id]}
                                    >
                                        {loadingCheckpoints[cp.id] ? 'Updating...' : cp.completed ? 'Mark Incomplete' : 'Complete Checkpoint'}
                                    </button>
                                </div>
                            </div>
                        ))}
                        {selectedStep.checkpoints.length === 0 && (
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>No checkpoints for this step.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
