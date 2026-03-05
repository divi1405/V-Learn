'use client';
import '../globals.css';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { EditIcon, ArrowRightIcon } from '@/components/Icons';

const STEPS = ['Skill Level', 'Areas of Interest', 'Goals', 'Format', 'Time Commitment'];

const AREAS = [
    'Machine Learning', 'Deep Learning', 'Natural Language Processing',
    'Computer Vision', 'Generative AI / LLMs', 'AI Ethics & Safety',
    'Data Science & Analytics', 'MLOps & Deployment', 'Reinforcement Learning',
    'AI Strategy for Business',
];

const FORMATS = ['Video lectures', 'Interactive articles', 'Hands-on projects', 'Mixed (all formats)'];
const TIME_OPTIONS = ['1-2 hours/week', '3-5 hours/week', '5-10 hours/week', '10+ hours/week'];
const SKILL_LEVELS = [
    { value: 'beginner', label: 'Beginner', desc: 'I\'m new to AI and want to learn the basics' },
    { value: 'intermediate', label: 'Intermediate', desc: 'I understand core concepts and want to go deeper' },
    { value: 'advanced', label: 'Advanced', desc: 'I have strong AI skills and want to specialize' },
];

export default function LearningNeedsPage() {
    const [step, setStep] = useState(0);
    const [form, setForm] = useState({
        current_skill_level: '',
        areas_of_interest: [],
        learning_goals: '',
        preferred_format: '',
        weekly_time_commitment: '',
    });
    const [existing, setExisting] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        api.get('/lna/me').then(data => {
            setExisting(data);
            setForm({
                current_skill_level: data.current_skill_level,
                areas_of_interest: data.areas_of_interest || [],
                learning_goals: data.learning_goals,
                preferred_format: data.preferred_format,
                weekly_time_commitment: data.weekly_time_commitment,
            });
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const result = await api.post('/lna', form);
            setExisting(result);
            setSubmitted(true);
        } catch (err) { alert(err.message); }
        finally { setSubmitting(false); }
    };

    const toggleArea = (area) => {
        setForm(f => ({
            ...f,
            areas_of_interest: f.areas_of_interest.includes(area)
                ? f.areas_of_interest.filter(a => a !== area)
                : [...f.areas_of_interest, area]
        }));
    };

    const canProceed = () => {
        switch (step) {
            case 0: return !!form.current_skill_level;
            case 1: return form.areas_of_interest.length > 0;
            case 2: return form.learning_goals.trim().length > 0;
            case 3: return !!form.preferred_format;
            case 4: return !!form.weekly_time_commitment;
            default: return false;
        }
    };

    if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

    if (submitted || (existing && step === 0 && !submitted)) {
        const data = existing;
        return (
            <div className="app-layout">
                <Sidebar />
                <main className="main-content" style={{ padding: 0 }}>
                    <Header />
                    <div style={{ padding: '24px' }}>
                        <div className="page-header">
                            <h1>Learning Need Analysis</h1>
                            <p>Your learning preferences and goals</p>
                        </div>

                        {submitted && (
                            <div className="card card-accent" style={{ marginBottom: 24, textAlign: 'center' }}>
                                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--vearc-surface-soft)', color: 'var(--vearc-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}></div>
                                <h3>Analysis Submitted Successfully!</h3>
                                <p style={{ color: 'var(--vearc-text-secondary)' }}>We'll use this to recommend the best courses for you.</p>
                            </div>
                        )}

                        <div className="card" style={{ marginBottom: 16 }}>
                            <h3 style={{ marginBottom: 16 }}>Your Learning Profile</h3>
                            <div style={{ display: 'grid', gap: 16 }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--vearc-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Skill Level</label>
                                    <p style={{ fontSize: '1rem', fontWeight: 600, textTransform: 'capitalize', marginTop: 4 }}>{data.current_skill_level}</p>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--vearc-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Areas of Interest</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                                        {(data.areas_of_interest || []).map(a => (
                                            <span key={a} className="badge badge-accent">{a}</span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--vearc-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Learning Goals</label>
                                    <p style={{ marginTop: 4, color: 'var(--vearc-text-secondary)', lineHeight: 1.6 }}>{data.learning_goals}</p>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--vearc-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Preferred Format</label>
                                        <p style={{ marginTop: 4, fontWeight: 600 }}>{data.preferred_format}</p>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--vearc-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Time Commitment</label>
                                        <p style={{ marginTop: 4, fontWeight: 600 }}>{data.weekly_time_commitment}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button className="btn btn-secondary" onClick={() => { setSubmitted(false); setExisting(null); setStep(0); }}>
                            <EditIcon width="16" height="16" style={{ marginRight: 8 }} /> Update My Analysis
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content" style={{ padding: 0 }}>
                <Header />
                <div style={{ padding: '24px' }}>
                    <div className="page-header">
                        <h1>Learning Need Analysis</h1>
                        <p>Help us understand your learning goals</p>
                    </div>

                    {/* Step progress */}
                    <div className="lna-progress">
                        {STEPS.map((s, i) => (
                            <div key={i} className={`lna-dot ${i === step ? 'active' : i < step ? 'done' : ''}`} />
                        ))}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--vearc-text-muted)', marginBottom: 24 }}>
                        Step {step + 1} of {STEPS.length}: <strong style={{ color: 'var(--vearc-text-primary)' }}>{STEPS[step]}</strong>
                    </div>

                    <div className="card lna-step">
                        {step === 0 && (
                            <div>
                                <h2 style={{ marginBottom: 8 }}>What's your current AI skill level?</h2>
                                <p style={{ color: 'var(--vearc-text-secondary)', marginBottom: 20 }}>This helps us recommend the right starting point</p>
                                <div className="radio-group">
                                    {SKILL_LEVELS.map(level => (
                                        <div
                                            key={level.value}
                                            className={`radio-item ${form.current_skill_level === level.value ? 'selected' : ''}`}
                                            onClick={() => setForm({ ...form, current_skill_level: level.value })}
                                        >
                                            <div>
                                                <strong>{level.label}</strong>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--vearc-text-muted)', marginTop: 4 }}>{level.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 1 && (
                            <div>
                                <h2 style={{ marginBottom: 8 }}>Which AI areas interest you?</h2>
                                <p style={{ color: 'var(--vearc-text-secondary)', marginBottom: 20 }}>Select all that apply</p>
                                <div className="checkbox-group">
                                    {AREAS.map(area => (
                                        <div
                                            key={area}
                                            className={`checkbox-item ${form.areas_of_interest.includes(area) ? 'selected' : ''}`}
                                            onClick={() => toggleArea(area)}
                                        >
                                            <span>
                                                <div style={{
                                                    width: 18, height: 18, borderRadius: 4,
                                                    border: `2px solid ${form.areas_of_interest.includes(area) ? 'var(--vearc-primary)' : 'var(--vearc-border)'}`,
                                                    background: form.areas_of_interest.includes(area) ? 'var(--vearc-primary)' : 'transparent',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    {form.areas_of_interest.includes(area) && <span style={{ color: 'var(--vearc-surface)', fontSize: '12px' }}></span>}
                                                </div>
                                            </span>
                                            {area}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div>
                                <h2 style={{ marginBottom: 8 }}>What are your learning goals?</h2>
                                <p style={{ color: 'var(--vearc-text-secondary)', marginBottom: 20 }}>Describe what you hope to achieve with AI learning</p>
                                <textarea
                                    value={form.learning_goals}
                                    onChange={e => setForm({ ...form, learning_goals: e.target.value })}
                                    placeholder="e.g., I want to understand how LLMs work so I can build AI-powered features for our product. I'm also interested in learning MLOps to deploy models in production..."
                                    rows={5}
                                />
                            </div>
                        )}

                        {step === 3 && (
                            <div>
                                <h2 style={{ marginBottom: 8 }}>Preferred learning format?</h2>
                                <p style={{ color: 'var(--vearc-text-secondary)', marginBottom: 20 }}>How do you learn best?</p>
                                <div className="radio-group">
                                    {FORMATS.map(f => (
                                        <div
                                            key={f}
                                            className={`radio-item ${form.preferred_format === f ? 'selected' : ''}`}
                                            onClick={() => setForm({ ...form, preferred_format: f })}
                                        >
                                            {f}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div>
                                <h2 style={{ marginBottom: 8 }}>Weekly time commitment?</h2>
                                <p style={{ color: 'var(--vearc-text-secondary)', marginBottom: 20 }}>How much time can you dedicate each week?</p>
                                <div className="radio-group">
                                    {TIME_OPTIONS.map(t => (
                                        <div
                                            key={t}
                                            className={`radio-item ${form.weekly_time_commitment === t ? 'selected' : ''}`}
                                            onClick={() => setForm({ ...form, weekly_time_commitment: t })}
                                        >
                                            {t}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
                        {step > 0 ? (
                            <button className="btn btn-secondary" onClick={() => setStep(step - 1)}>&larr; Previous</button>
                        ) : <div />}
                        {step < STEPS.length - 1 ? (
                            <button className="btn vearc-btn-primary" onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                                Next <ArrowRightIcon width="16" height="16" />
                            </button>
                        ) : (
                            <button className="btn vearc-btn-primary" onClick={handleSubmit} disabled={!canProceed() || submitting}>
                                {submitting ? 'Submitting...' : 'Submit Analysis'}
                            </button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
