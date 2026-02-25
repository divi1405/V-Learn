'use client';
import '../globals.css';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await api.login(email, password);
            if (data.user && data.user.is_first_login) {
                router.push('/set-password');
            } else {
                const role = data.user.role ? data.user.role.toLowerCase() : '';
                if (['admin', 'hr_admin'].includes(role)) {
                    router.push('/admin');
                } else if (role === 'manager') {
                    router.push('/manager/dashboard');
                } else {
                    router.push('/dashboard');
                }
            }
        } catch (err) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '20px' }}>
                    <img src="/vearc_logo.png" alt="VeARC" style={{ height: '50px', width: '50px', borderRadius: '10px' }} />
                    <h1 style={{ margin: 0, fontSize: '2.5rem' }}>VeLearn</h1>
                </div>
                <h2 style={{ marginTop: 0 }}>Welcome back</h2>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your.work@email.com"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div style={{
                    textAlign: 'center', marginTop: 24, fontSize: '0.82rem',
                    color: 'var(--text-muted)', background: 'var(--card-bg)',
                    borderRadius: 'var(--radius)', padding: '14px 16px',
                    border: '1px solid var(--border)', lineHeight: 1.6
                }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>🔐 First Time Login</div>
                    <div>Use your <strong>work email</strong> with default password:&nbsp;
                        <code style={{ background: 'var(--bg)', padding: '2px 6px', borderRadius: 4 }}>Welcome@123</code>
                    </div>
                    <div style={{ marginTop: 4, opacity: 0.75 }}>You will be prompted to set a new password on first login.</div>
                </div>
            </div>
        </div>
    );
}

