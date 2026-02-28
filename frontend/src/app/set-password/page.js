'use client';
import '../globals.css';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const PasswordStrengthBar = ({ password }) => {
    const checks = [
        password.length >= 8,
        /[A-Z]/.test(password),
        /[0-9]/.test(password),
        /[^A-Za-z0-9]/.test(password),
    ];
    const strength = checks.filter(Boolean).length;
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['', 'var(--vearc-danger)', 'var(--vearc-primary)', 'var(--vearc-success)', 'var(--vearc-success)'];
    return password ? (
        <div style={{ marginTop: 6 }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{
                        flex: 1, height: 4, borderRadius: 2,
                        background: i <= strength ? colors[strength] : 'var(--vearc-border)',
                        transition: 'background 0.3s'
                    }} />
                ))}
            </div>
            <div style={{ fontSize: '0.75rem', color: colors[strength] }}>{labels[strength]}</div>
        </div>
    ) : null;
};

export default function SetPasswordPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const u = api.getUser();
        if (!u) {
            router.push('/login');
            return;
        }
        if (!u.is_first_login) {
            const role = u.role?.toLowerCase() || '';
            if (['admin', 'hr_admin'].includes(role)) router.push('/admin');
            else if (role === 'manager') router.push('/manager/dashboard');
            else router.push('/dashboard');
            return;
        }
        setUser(u);
    }, [router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (newPassword !== confirmPassword) return setError('Passwords do not match');
        if (newPassword.length < 8) return setError('Password must be at least 8 characters');
        if (newPassword === 'Welcome@123') return setError('Please choose a different password from the default one');
        setLoading(true);
        try {
            const updatedUser = await api.post('/auth/set-password', { new_password: newPassword });
            api.setUser(updatedUser);
            const role = updatedUser.role?.toLowerCase() || '';
            if (['admin', 'hr_admin'].includes(role)) router.push('/admin');
            else if (role === 'manager') router.push('/manager/dashboard');
            else router.push('/dashboard');
        } catch (err) {
            setError(err.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    const EyeIcon = ({ show }) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {show
                ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>
                : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
            }
        </svg>
    );

    const LockIcon = ({ size = 24 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    );


    return (
        <div className="auth-page">
            <div className="auth-card" style={{ maxWidth: 440 }}>
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
                    {/* <img src="/vearc_logo.png" alt="VeARC" style={{ height: 48, width: 48, borderRadius: 10 }} /> */}
                    <h1 style={{ margin: 0, fontSize: '2rem' }}>VeLearn</h1>
                </div>

                {/* Welcome */}
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6, color: 'var(--vearc-primary)' }}></div>
                    <h2 style={{ margin: '0 0 8px', fontSize: '1.3rem' }}>Set Your Password</h2>
                    <p style={{ margin: 0, color: 'var(--vearc-text-muted)', fontSize: '0.88rem' }}>
                        Welcome, <strong style={{ color: 'var(--vearc-text-primary)' }}>{user.name}</strong>! Please create a secure password to continue.
                    </p>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(229,57,53,0.12)', border: '1px solid rgba(229,57,53,0.4)',
                        color: 'var(--vearc-danger)', padding: '10px 14px', borderRadius: 'var(--radius)',
                        fontSize: '0.88rem', marginBottom: 16
                    }}>{error}</div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>New Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showNew ? 'text' : 'password'}
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                placeholder="At least 8 characters"
                                required
                                style={{ paddingRight: 44 }}
                            />
                            <button type="button" onClick={() => setShowNew(!showNew)}
                                style={{
                                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: 'var(--vearc-text-muted)', padding: 0, display: 'flex'
                                }}>
                                <EyeIcon show={showNew} />
                            </button>
                        </div>
                        <PasswordStrengthBar password={newPassword} />
                    </div>

                    <div className="form-group" style={{ marginTop: 16 }}>
                        <label>Confirm Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showConfirm ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="Repeat your new password"
                                required
                                style={{ paddingRight: 44 }}
                            />
                            <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                                style={{
                                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: 'var(--vearc-text-muted)', padding: 0, display: 'flex'
                                }}>
                                <EyeIcon show={showConfirm} />
                            </button>
                        </div>
                        {confirmPassword && newPassword !== confirmPassword && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--vearc-danger)', marginTop: 4 }}>Passwords don't match</div>
                        )}
                        {confirmPassword && newPassword === confirmPassword && newPassword.length >= 8 && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--vearc-success)', marginTop: 4 }}>Passwords match</div>
                        )}
                    </div>

                    {/* Requirements */}
                    <div style={{
                        background: 'var(--bg)', border: '1px solid var(--vearc-border)', borderRadius: 'var(--radius)',
                        padding: '12px 14px', marginTop: 16, fontSize: '0.8rem', color: 'var(--vearc-text-muted)'
                    }}>
                        <div style={{ fontWeight: 600, marginBottom: 6 }}>Password requirements:</div>
                        {[
                            ['At least 8 characters', newPassword.length >= 8],
                            ['One uppercase letter', /[A-Z]/.test(newPassword)],
                            ['One number', /[0-9]/.test(newPassword)],
                            ['One special character', /[^A-Za-z0-9]/.test(newPassword)],
                        ].map(([label, met]) => (
                            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                <span style={{ color: met ? 'var(--vearc-success)' : 'var(--vearc-border)' }}>{met ? '' : ''}</span>
                                <span style={{ color: met ? 'var(--vearc-text-secondary)' : 'var(--vearc-text-muted)' }}>{label}</span>
                            </div>
                        ))}
                    </div>

                    <button
                        type="submit"
                        className="btn vearc-btn-primary"
                        style={{ width: '100%', marginTop: 20, padding: '12px', fontSize: '1rem' }}
                        disabled={loading || newPassword !== confirmPassword || newPassword.length < 8}
                    >
                        {loading ? (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                <span className="spinner-sm" />Updating...
                            </span>
                        ) : (
                            <>

                                Set Password & Continue
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}




