'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { BellIcon, UserIcon, TrophyIcon, ClipboardIcon } from '@/components/Icons';

const SunIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>;
const MoonIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>;

export default function Header() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [showNotifs, setShowNotifs] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [theme, setTheme] = useState('dark');

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    useEffect(() => {
        const u = api.getUser();
        if (u) {
            setUser(u);
            api.get('/analytics/notifications')
                .then(data => setNotifications(data))
                .catch(() => { });
        }
    }, []);

    const markAllRead = async () => {
        const unread = notifications.filter(n => !n.read);
        await Promise.all(unread.map(n => api.post(`/analytics/notifications/${n.id}/read`, {})));
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const getNotifRedirect = (type) => {
        const t = type?.toLowerCase();
        if (t === 'assignment' || t === 'enrollment') return '/courses';
        if (t === 'achievement' || t === 'completion') return '/certificates';
        return '/dashboard';
    };

    const handleNotifClick = async (n) => {
        if (!n.read) {
            try {
                await api.post(`/analytics/notifications/${n.id}/read`, {});
                setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
            } catch { /* silent */ }
        }
        setShowNotifs(false);
        router.push(getNotifRedirect(n.type));
    };

    if (!user) return null;
    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <header style={{
            height: '64px',
            background: 'var(--vearc-surface)',
            borderBottom: '1px solid var(--vearc-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            gap: '20px',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000
        }}>
            {/* Left Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <h1 style={{ fontSize: '1.5rem', margin: 0, lineHeight: 1, fontWeight: 800, background: 'var(--vearc-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>VeLearn</h1>
                </div>
            </div>

            {/* Right Icons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--vearc-text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--vearc-bg)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                    {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                </button>

                {/* Notifications */}
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setShowNotifs(!showNotifs)}
                        title="Notifications"
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--vearc-text-secondary)',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--vearc-bg)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                        <BellIcon width="20" height="20" />
                        {unreadCount > 0 && (
                            <span style={{
                                position: 'absolute',
                                top: 6,
                                right: 6,
                                background: 'var(--vearc-danger)',
                                color: 'var(--vearc-surface)',
                                borderRadius: '50%',
                                minWidth: '16px',
                                height: '16px',
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '0 4px',
                            }}>
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {showNotifs && (
                        <>
                            <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setShowNotifs(false)} />
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                marginTop: '8px',
                                width: '320px',
                                background: 'var(--vearc-surface)',
                                border: '1px solid var(--vearc-border)',
                                borderRadius: 'var(--vearc-radius-md)',
                                boxShadow: 'var(--vearc-shadow-hover)',
                                zIndex: 20,
                                overflow: 'hidden'
                            }}>
                                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--vearc-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--vearc-text-primary)' }}>Notifications</span>
                                    {unreadCount > 0 && (
                                        <button onClick={markAllRead} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--vearc-primary)', fontSize: '0.8rem', fontWeight: 500 }}>
                                            Mark all read
                                        </button>
                                    )}
                                </div>
                                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    {notifications.length === 0 ? (
                                        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--vearc-text-muted)', fontSize: '0.85rem' }}>
                                            No notifications yet
                                        </div>
                                    ) : (
                                        notifications.slice(0, 8).map(n => (
                                            <div key={n.id} style={{
                                                padding: '12px 16px',
                                                borderBottom: '1px solid var(--vearc-border)',
                                                background: n.read ? 'transparent' : 'var(--vearc-primary-verylight)',
                                                display: 'flex',
                                                gap: '12px',
                                                alignItems: 'flex-start',
                                                cursor: 'pointer'
                                            }}
                                                onClick={() => handleNotifClick(n)}
                                            >
                                                <span style={{ color: 'var(--vearc-primary)' }}>
                                                    {n.type === 'assignment' ? <ClipboardIcon width="16" height="16" /> : n.type === 'achievement' ? <TrophyIcon width="16" height="16" /> : <BellIcon width="16" height="16" />}
                                                </span>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--vearc-text-primary)' }}>{n.message}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--vearc-text-muted)', marginTop: '4px' }}>
                                                        {new Date(n.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                {!n.read && (
                                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--vearc-primary)', marginTop: 4 }} />
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* User Profile */}
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        title="Profile"
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '4px 8px',
                            borderRadius: 'var(--vearc-radius-sm)',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--vearc-bg)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'var(--vearc-primary)',
                            color: 'var(--vearc-surface)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 600,
                            fontSize: '1.2rem',
                            overflow: 'hidden'
                        }}>
                            {user.profile_image && user.profile_image !== 'null' ? (
                                <img src={user.profile_image} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                user.name?.[0]
                            )}
                        </div>
                    </button>

                    {showProfileMenu && (
                        <>
                            <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setShowProfileMenu(false)} />
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                marginTop: '8px',
                                width: '200px',
                                background: 'var(--vearc-surface)',
                                border: '1px solid var(--vearc-border)',
                                borderRadius: 'var(--vearc-radius-md)',
                                boxShadow: 'var(--vearc-shadow-hover)',
                                zIndex: 20,
                                padding: '8px 0'
                            }}>
                                <button
                                    onClick={() => { setShowProfileMenu(false); router.push('/profile'); }}
                                    style={{
                                        width: '100%',
                                        textAlign: 'left',
                                        padding: '10px 16px',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--vearc-text-primary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        fontSize: '0.9rem'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--vearc-bg)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                >
                                    <UserIcon width="16" height="16" /> Profile Setings
                                </button>
                                <div style={{ height: '1px', background: 'var(--vearc-border)', margin: '4px 0' }} />
                                <button
                                    onClick={() => { setShowProfileMenu(false); api.logout(); }}
                                    style={{
                                        width: '100%',
                                        textAlign: 'left',
                                        padding: '10px 16px',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--vearc-danger)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        fontSize: '0.9rem'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--vearc-bg)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                >
                                    Sign Out
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
