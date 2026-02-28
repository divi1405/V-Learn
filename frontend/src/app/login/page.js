'use client';
import '../globals.css';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', 'light');
    }, []);

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
        <div style={{ display: 'flex', minHeight: '100vh', width: '100%', background: 'var(--vearc-surface)' }}>
            {/* Left Image Pane */}
            <div style={{
                flex: 1,
                position: 'relative',
                backgroundColor: 'var(--vearc-primary-verylight)'
            }} className="login-left-pane">
                <div style={{ position: 'absolute', top: '32px', left: '32px', zIndex: 10 }}>
                    <img src="/vearc_logo.png" alt="VeARC Logo" style={{ height: '32px', objectFit: 'contain' }} />
                </div>

                <img
                    src="/VeLearnLogin.png"
                    alt="Login Background"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
                    onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentNode.style.background = 'linear-gradient(135deg, #eae3f0 0%, #4b2354 100%)';
                    }}
                />
            </div>

            {/* Right Form Pane */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                background: 'var(--vearc-surface)'
            }}>
                <h1 style={{
                    color: 'var(--vearc-primary)',
                    fontSize: '2rem',
                    marginBottom: '28px',
                    fontFamily: 'serif',
                    fontWeight: '700'
                }}>
                    VeLearn
                </h1>

                <div style={{
                    background: 'var(--vearc-surface)',
                    padding: '32px',
                    width: '100%',
                    maxWidth: '380px',
                    boxShadow: '0 4px 25px rgba(0,0,0,0.06)',
                    borderRadius: '4px',
                    border: '1px solid #f8f8f8'
                }}>
                    <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.15rem', fontWeight: 600, color: 'var(--vearc-text-primary)' }}>
                        Sign in to your account
                    </h3>

                    {error && <div className="auth-error" style={{ marginBottom: '16px' }}>{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--vearc-text-secondary)', marginBottom: '6px', display: 'block' }}>Enter email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="johndoe@vearc.com"
                                required
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    background: 'var(--vearc-bg)',
                                    border: 'none',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                    transition: 'background-color 0.2s',
                                    color: 'var(--vearc-text-primary)'
                                }}
                                onFocus={(e) => e.target.style.background = 'var(--vearc-border)'}
                                onBlur={(e) => e.target.style.background = 'var(--vearc-bg)'}
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: '24px' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--vearc-text-secondary)', marginBottom: '6px', display: 'block' }}>Enter password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="********"
                                required
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    background: 'var(--vearc-bg)',
                                    border: 'none',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                    transition: 'background-color 0.2s',
                                    color: 'var(--vearc-text-primary)'
                                }}
                                onFocus={(e) => e.target.style.background = 'var(--vearc-border)'}
                                onBlur={(e) => e.target.style.background = 'var(--vearc-bg)'}
                            />
                        </div>
                        <button type="submit" style={{
                            width: '100%',
                            padding: '12px',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            background: 'var(--vearc-primary)',
                            color: 'var(--vearc-surface)',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                        }}
                            disabled={loading}
                            onMouseOver={(e) => e.target.style.background = 'var(--vearc-primary)'}
                            onMouseOut={(e) => e.target.style.background = 'var(--vearc-primary)'}
                        >
                            {loading ? 'Signing in...' : 'Login'}
                        </button>
                    </form>


                </div>

                <div style={{
                    textAlign: 'center', marginTop: 24, fontSize: '0.8rem',
                    color: 'var(--vearc-text-secondary)', background: 'var(--vearc-surface)',
                    borderRadius: '4px', padding: '12px 16px',
                    border: '1px solid #eee', lineHeight: 1.5,
                    maxWidth: '380px', width: '100%'
                }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>First Time Login</div>
                    <div>Use your <strong>work email</strong> with default password:&nbsp;
                        <code style={{ background: 'var(--vearc-bg)', padding: '2px 6px', borderRadius: 4 }}>Welcome@123</code>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @media (max-width: 768px) {
                    .login-left-pane {
                        display: none !important;
                    }
                }
                .login-left-pane {
                    display: block;
                }
            `}</style>
        </div>
    );
}

