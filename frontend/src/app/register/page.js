'use client';
import '../globals.css';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const ROLES = ['LEARNER', 'MANAGER', 'HR_ADMIN', 'CONTENT_AUTHOR'];

export default function RegisterPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        name: '',
        employee_number: '',
        email: '',
        role: 'LEARNER',
        division: '',
        department: '',
        designation: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!form.name || !form.employee_number || !form.email) {
            setError('Name, Employee ID, and Email are required.');
            return;
        }
        setLoading(true);
        try {
            // Default password is Welcome@123; user will be prompted to change on first login
            const payload = {
                ...form,
                password: 'Welcome@123',
            };
            const data = await api.register(payload);
            // is_first_login will be true -> redirect to set-password
            if (data.user && data.user.is_first_login) {
                router.push('/set-password');
            } else {
                const role = data.user.role?.toLowerCase() || '';
                if (['admin', 'hr_admin'].includes(role)) router.push('/admin');
                else if (role === 'manager') router.push('/manager/dashboard');
                else router.push('/dashboard');
            }
        } catch (err) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const update = (k, v) => setForm({ ...form, [k]: v });

    return (
        <div className="auth-page">
            <div className="auth-card" style={{ maxWidth: 480 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '20px' }}>
                    <img src="/vearc_logo.png" alt="VeARC" style={{ height: '50px', width: '50px', borderRadius: '10px' }} />
                    <h1 style={{ margin: 0, fontSize: '2.5rem' }}>VeLearn</h1>
                </div>
                <h2 style={{ marginTop: 0 }}>Create Account</h2>
                <p style={{ color: 'var(--vearc-text-muted)', fontSize: '0.85rem', marginTop: -8, marginBottom: 16 }}>
                    A default password <strong>Welcome@123</strong> will be set. You'll be prompted to change it on first login.
                </p>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label>Full Name *</label>
                            <input type="text" value={form.name}
                                onChange={e => update('name', e.target.value)}
                                placeholder="e.g. Sri Vidya M" required />
                        </div>

                        <div className="form-group">
                            <label>Employee ID *</label>
                            <input type="text" value={form.employee_number}
                                onChange={e => update('employee_number', e.target.value)}
                                placeholder="e.g. VA101" required />
                        </div>

                        <div className="form-group">
                            <label>Role</label>
                            <select value={form.role} onChange={e => update('role', e.target.value)}
                                style={{
                                    width: '100%', padding: '10px 12px', borderRadius: 'var(--radius)',
                                    border: '1px solid var(--vearc-border)', background: 'var(--card-bg)',
                                    color: 'var(--vearc-text-primary)', fontSize: '0.9rem'
                                }}>
                                {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                            </select>
                        </div>

                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label>Work Email *</label>
                            <input type="email" value={form.email}
                                onChange={e => update('email', e.target.value)}
                                placeholder="your.name@vearc.com" required />
                        </div>

                        <div className="form-group">
                            <label>Division / PortCo</label>
                            <input type="text" value={form.division}
                                onChange={e => update('division', e.target.value)}
                                placeholder="e.g. AI-CoE" />
                        </div>

                        <div className="form-group">
                            <label>Department</label>
                            <input type="text" value={form.department}
                                onChange={e => update('department', e.target.value)}
                                placeholder="e.g. Technology" />
                        </div>

                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label>Designation</label>
                            <input type="text" value={form.designation}
                                onChange={e => update('designation', e.target.value)}
                                placeholder="e.g. Intern" />
                        </div>
                    </div>

                    <button type="submit" className="btn vearc-btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: 16, fontSize: '0.85rem', color: 'var(--vearc-text-muted)' }}>
                    Already have an account? <a href="/login" style={{ color: 'var(--vearc-primary)' }}>Sign in</a>
                </div>
            </div>
        </div>
    );
}
