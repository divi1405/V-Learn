'use client';
import '../globals.css';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { TrophyIcon, MedalIcon, StarIcon, TargetIcon, UserIcon, EditIcon, BookIcon, BarChartIcon, EyeIcon, EyeOffIcon } from '@/components/Icons';

const StatRing = ({ value, max, color, label, sublabel }) => {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    const r = 40, circ = 2 * Math.PI * r;
    const offset = circ - (pct / 100) * circ;
    return (
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={r} fill="none" stroke="var(--vearc-border)" strokeWidth="8" />
                <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
                    strokeDasharray={circ} strokeDashoffset={offset}
                    strokeLinecap="round" transform="rotate(-90 50 50)"
                    style={{ transition: 'stroke-dashoffset 1s ease' }} />
                <text x="50" y="46" textAnchor="middle" fontSize="18" fontWeight="700" fill="var(--text-color)">{value}</text>
                <text x="50" y="60" textAnchor="middle" fontSize="10" fill="var(--vearc-text-muted)">/ {max}</text>
            </svg>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{label}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--vearc-text-muted)' }}>{sublabel}</div>
        </div>
    );
};

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUserState] = useState(null);
    const [enrollments, setEnrollments] = useState([]);
    const [badges, setBadges] = useState([]);
    const [certs, setCerts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Password change state
    const [showPwForm, setShowPwForm] = useState(false);
    const [pwForm, setPwForm] = useState({ current: '', new: '', confirm: '' });
    const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
    const [pwError, setPwError] = useState('');
    const [pwSuccess, setPwSuccess] = useState('');
    const [pwLoading, setPwLoading] = useState(false);

    const fileInputRef = useRef(null);
    const pwFormRef = useRef(null);
    const [hoverAvatar, setHoverAvatar] = useState(false);

    const handleShowPwForm = useCallback(() => {
        setShowPwForm(true);
        setTimeout(() => pwFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    }, []);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = reader.result;
                try {
                    await api.put('/users/me', { profile_image: base64String });
                } catch (err) { console.error('Failed to save to backend', err); }
                const updatedUser = { ...user, profile_image: base64String };
                setUserState(updatedUser);
                // Store at top level so api.getUser() returns it correctly
                const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
                localStorage.setItem('user', JSON.stringify({ ...storedUser, profile_image: base64String }));
                // Give React a small tick to save, then reload to ensure Header also gets the update
                setTimeout(() => window.location.reload(), 100);
            };
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        const u = api.getUser();
        if (!u) { router.push('/login'); return; }
        setUserState(u);
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [enrollData, badgeData, certData] = await Promise.all([
                api.get('/enrollments'),
                api.get('/badges/').catch(() => []),
                api.get('/certificates/').catch(() => []),
            ]);
            setEnrollments(enrollData);
            setBadges(badgeData);
            setCerts(certData);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPwError(''); setPwSuccess('');
        if (pwForm.new !== pwForm.confirm) { setPwError("Passwords don't match"); return; }
        if (pwForm.new.length < 8) { setPwError("New password must be at least 8 characters"); return; }
        if (pwForm.new === 'Welcome@123') { setPwError("Please choose a different password"); return; }
        setPwLoading(true);
        try {
            await api.post('/auth/change-password', { current_password: pwForm.current, new_password: pwForm.new });
            setPwSuccess('Password updated successfully!');
            setPwForm({ current: '', new: '', confirm: '' });
            setShowPwForm(false);
        } catch (err) {
            setPwError(err.message || 'Failed to change password');
        } finally {
            setPwLoading(false);
        }
    };

    if (!user || loading) return <div className="loading-page"><div className="spinner"></div></div>;

    // Stats computation
    const total = enrollments.length;
    const completed = enrollments.filter(e => e.status === 'completed').length;
    const inProgress = enrollments.filter(e => e.status === 'in_progress').length;
    const notStarted = total - completed - inProgress;
    const avgProgress = total > 0 ? Math.round(enrollments.reduce((s, e) => s + (e.progress_pct || 0), 0) / total) : 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;


    const EyeBtn = ({ field }) => (
        <button type="button" onClick={() => setShowPw(p => ({ ...p, [field]: !p[field] }))}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--vearc-text-muted)', padding: 0 }}>
            {showPw[field] ? <EyeOffIcon width="16" height="16" /> : <EyeIcon width="16" height="16" />}
        </button>
    );

    const PasswordStrength = ({ pw }) => {
        const s = [pw.length >= 8, /[A-Z]/.test(pw), /[0-9]/.test(pw), /[^A-Za-z0-9]/.test(pw)].filter(Boolean).length;
        const colors = ['', 'var(--vearc-danger)', 'var(--vearc-primary)', 'var(--vearc-success)', 'var(--vearc-success)'];
        const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
        if (!pw) return null;
        return (
            <div style={{ marginTop: 4 }}>
                <div style={{ display: 'flex', gap: 3 }}>
                    {[1, 2, 3, 4].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= s ? colors[s] : 'var(--vearc-border)' }} />)}
                </div>
                <span style={{ fontSize: '0.72rem', color: colors[s] }}>{labels[s]}</span>
            </div>
        );
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content" style={{ padding: 0 }}>
                <Header />
                <div style={{ padding: '24px' }}>
                    {/* Profile Header */}
                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24, flexWrap: 'wrap' }}>
                        <div
                            style={{
                                width: 80, height: 80, borderRadius: '50%',
                                background: 'var(--vearc-primary)', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontSize: '2rem', fontWeight: 700, color: 'var(--vearc-surface)', flexShrink: 0,
                                position: 'relative', overflow: 'hidden', cursor: 'pointer'
                            }}
                            onMouseEnter={() => setHoverAvatar(true)}
                            onMouseLeave={() => setHoverAvatar(false)}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {user.profile_image && user.profile_image !== 'null' ? (
                                <img src={user.profile_image} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                user.name?.[0]
                            )}
                            {hoverAvatar && (
                                <div style={{
                                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.75rem', fontWeight: 600, color: 'var(--vearc-surface)', textAlign: 'center'
                                }}>
                                    <EditIcon width="20" height="20" style={{ marginBottom: 4 }} />
                                    Upload
                                </div>
                            )}
                            <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h2 style={{ margin: '0 0 4px', fontSize: '1.4rem' }}>{user.name}</h2>
                            <div style={{ color: 'var(--vearc-text-muted)', fontSize: '0.88rem', marginBottom: 6 }}>
                                {user.designation || 'Employee'} Â· {user.division || user.department || 'VeARC'}
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <span className="badge badge-info">{user.role?.replace('_', ' ')}</span>
                                {user.division && <span className="badge">{user.division}</span>}
                            </div>
                        </div>
                        <button className="btn btn-ghost btn-sm" onClick={handleShowPwForm}>
                            <EditIcon width="16" height="16" style={{ marginRight: 6 }} /> Change Password
                        </button>
                    </div>

                    {/* Credentials */}
                    <div className="card" style={{ marginBottom: 24 }}>
                        <h3 style={{ marginTop: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><UserIcon width="20" height="20" style={{ color: 'var(--vearc-primary)' }} /> My Details</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                            {[
                                ['Employee ID', user.employee_number],
                                ['Email', user.email],
                                ['Designation', user.designation],
                                ['Department', user.department],
                                ['Division / PortCo', user.division],
                                ['Manager', user.manager_name],
                                ['Role', user.role?.replace('_', ' ')],
                            ].map(([label, value]) => (
                                <div key={label} style={{ padding: '10px 14px', background: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px solid var(--vearc-border)' }}>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--vearc-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{value || '-'}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Change Password Form */}
                    {showPwForm && (
                        <div ref={pwFormRef} className="card" style={{ marginBottom: 24, border: '1px solid var(--vearc-primary)', boxShadow: '0 0 0 2px rgba(var(--accent-rgb),0.1)' }}>
                            <h3 style={{ marginTop: 0, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}><EditIcon width="20" height="20" style={{ color: 'var(--vearc-primary)' }} /> Change Password</h3>
                            <p style={{ color: 'var(--vearc-text-muted)', fontSize: '0.85rem', marginBottom: 20 }}>
                                Enter your current password, then set a new secure one.
                            </p>
                            {pwError && <div style={{ background: 'rgba(229,57,53,0.1)', border: '1px solid rgba(229,57,53,0.4)', color: 'var(--vearc-danger)', padding: '10px 14px', borderRadius: 'var(--radius)', fontSize: '0.85rem', marginBottom: 12 }}>{pwError}</div>}
                            {pwSuccess && <div style={{ background: 'rgba(0,200,83,0.1)', border: '1px solid rgba(0,200,83,0.4)', color: 'var(--vearc-success)', padding: '10px 14px', borderRadius: 'var(--radius)', fontSize: '0.85rem', marginBottom: 12 }}>{pwSuccess}</div>}
                            <form onSubmit={handlePasswordChange}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label>Current Password</label>
                                        <div style={{ position: 'relative' }}>
                                            <input type={showPw.current ? 'text' : 'password'} placeholder="Your current password"
                                                value={pwForm.current} onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
                                                required style={{ paddingRight: 40 }} />
                                            <EyeBtn field="current" />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>New Password</label>
                                        <div style={{ position: 'relative' }}>
                                            <input type={showPw.new ? 'text' : 'password'} placeholder="Min 8 characters"
                                                value={pwForm.new} onChange={e => setPwForm(p => ({ ...p, new: e.target.value }))}
                                                required style={{ paddingRight: 40 }} />
                                            <EyeBtn field="new" />
                                        </div>
                                        <PasswordStrength pw={pwForm.new} />
                                    </div>
                                    <div className="form-group">
                                        <label>Confirm New Password</label>
                                        <div style={{ position: 'relative' }}>
                                            <input type={showPw.confirm ? 'text' : 'password'} placeholder="Repeat new password"
                                                value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                                                required style={{ paddingRight: 40 }} />
                                            <EyeBtn field="confirm" />
                                        </div>
                                        {pwForm.confirm && pwForm.new !== pwForm.confirm && (
                                            <div style={{ fontSize: '0.72rem', color: 'var(--vearc-danger)', marginTop: 4 }}>Doesn't match</div>
                                        )}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                                    <button type="submit" className="btn vearc-btn-primary" disabled={pwLoading}>
                                        {pwLoading ? 'Updating...' : <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><EditIcon width="16" height="16" /> Update Password</span>}
                                    </button>
                                    <button type="button" className="btn btn-ghost" onClick={() => { setShowPwForm(false); setPwError(''); setPwSuccess(''); }}>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Progress Stats - hidden for admin */}
                    {user.role !== 'ADMIN' && user.role !== 'HR_ADMIN' && (<>
                        <div className="section-header"><h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><BarChartIcon width="24" height="24" style={{ color: 'var(--vearc-primary)' }} /> My Progress</h2></div>

                        {/* Ring Stats */}
                        <div className="card" style={{ marginBottom: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 24, padding: '8px 0' }}>
                                <StatRing value={completed} max={total} color="var(--vearc-success)" label="Completed" sublabel="courses finished" />
                                <StatRing value={inProgress} max={total} color="var(--vearc-primary)" label="In Progress" sublabel="currently studying" />
                                <StatRing value={badges.length} max={20} color="var(--vearc-primary)" label="Badges" sublabel="earned" />
                                <StatRing value={certs.length} max={total} color="var(--vearc-primary-light)" label="Certificates" sublabel="awarded" />
                            </div>
                        </div>

                        {/* Stats Tiles */}
                        <div className="stats-grid" style={{ marginBottom: 24 }}>
                            <div className="stat-card">
                                <div className="stat-value">{total}</div>
                                <div className="stat-label">Total Courses</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">{completionRate}%</div>
                                <div className="stat-label">Completion Rate</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">{avgProgress}%</div>
                                <div className="stat-label">Avg Progress</div>
                            </div>
                        </div>

                        {/* Course Breakdown */}
                        <div className="card" style={{ marginBottom: 24 }}>
                            <h3 style={{ marginTop: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><BookIcon width="20" height="20" style={{ color: 'var(--vearc-primary)' }} /> Course Breakdown</h3>
                            {[
                                { label: 'Completed', count: completed, color: 'var(--vearc-success)' },
                                { label: 'In Progress', count: inProgress, color: 'var(--vearc-primary)' },
                                { label: 'Not Started', count: notStarted, color: 'var(--vearc-text-muted)' },
                            ].map(({ label, count, color }) => (
                                <div key={label} style={{ marginBottom: 14 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                                        <span style={{ color }}>{label}</span>
                                        <span style={{ fontWeight: 700 }}>{count} {count === 1 ? 'course' : 'courses'}</span>
                                    </div>
                                    <div style={{ height: 8, background: 'var(--vearc-border)', borderRadius: 4 }}>
                                        <div style={{
                                            height: '100%', width: total > 0 ? `${(count / total) * 100}%` : '0%',
                                            background: color, borderRadius: 4, transition: 'width 0.6s'
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Enrolled Courses List */}
                        {enrollments.length > 0 && (
                            <div>
                                <div className="section-header"><h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><BookIcon width="24" height="24" style={{ color: 'var(--vearc-primary)' }} /> All My Courses</h2></div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {enrollments.map(e => (
                                        <div key={e.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 20px', cursor: 'pointer' }}
                                            onClick={() => router.push(`/courses/${e.course_id}`)}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.course?.title}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                                    <div style={{ flex: 1, height: 4, background: 'var(--vearc-border)', borderRadius: 2, maxWidth: 200 }}>
                                                        <div style={{ height: '100%', width: `${e.progress_pct || 0}%`, background: e.status === 'completed' ? 'var(--vearc-success)' : 'var(--vearc-primary)', borderRadius: 2 }} />
                                                    </div>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--vearc-text-muted)' }}>{Math.round(e.progress_pct || 0)}%</span>
                                                </div>
                                            </div>
                                            <span className={`badge ${e.status === 'completed' ? 'badge-success' : e.status === 'in_progress' ? 'badge-info' : ''}`}>
                                                {e.status?.replace('_', ' ') || 'enrolled'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>)}
                </div>
            </main>
        </div>
    );
}
