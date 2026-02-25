'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

const SunIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>;
const MoonIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>;
const LogoutIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;
const BellIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>;

const learnerNav = [
    { label: 'Dashboard', icon: '🏠', href: '/dashboard' },
    { label: 'Courses', icon: '📚', href: '/courses' },
    { label: 'Learning Paths', icon: '🛤️', href: '/learning-paths' },
    { label: 'Certificates & Badges', icon: '🏆', href: '/certificates' },
    { label: 'Feedback & Ratings', icon: '⭐', href: '/feedback' },
    { label: 'Learning Needs', icon: '🎯', href: '/learning-needs' },
    { label: 'Leaderboard', icon: '🏅', href: '/leaderboard' },
];

const adminNav = [
    { label: 'Admin Dashboard', icon: '⚙️', href: '/admin' },
    { label: 'Manage Courses', icon: '📝', href: '/admin/courses' },
    { label: 'Manage Users', icon: '👥', href: '/admin/users' },
    { label: 'Platform Feedback', icon: '⭐', href: '/admin/feedback' },
    { label: 'Learning Needs', icon: '🎯', href: '/admin/needs' },
    { label: 'Manage Paths', icon: '🗺️', href: '/admin/paths' },
];

const managerNav = [
    { label: 'Dashboard', icon: '🏠', href: '/manager/dashboard' },
    { label: 'Team Progress', icon: '📊', href: '/manager/team' },
    { label: 'Assign Course', icon: '📋', href: '/manager/assign-course' },
    { label: 'Courses', icon: '📚', href: '/courses' },
    { label: 'Leaderboard', icon: '🏅', href: '/leaderboard' },
];

// Notification dropdown component
function NotificationPanel({ notifications, onMarkRead, onClose }) {
    const unread = notifications.filter(n => !n.read);
    return (
        <div style={{
            position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, right: 0,
            background: 'var(--card-bg)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            zIndex: 200, maxHeight: 320, overflow: 'hidden', display: 'flex', flexDirection: 'column'
        }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>🔔 Notifications</span>
                {unread.length > 0 && (
                    <button onClick={onMarkRead} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: '0.75rem' }}>
                        Mark all read
                    </button>
                )}
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
                {notifications.length === 0 ? (
                    <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        No notifications yet
                    </div>
                ) : (
                    notifications.slice(0, 8).map(n => (
                        <div key={n.id} style={{
                            padding: '10px 16px', borderBottom: '1px solid var(--border)',
                            background: n.read ? 'transparent' : 'rgba(var(--accent-rgb,99,102,241),0.08)',
                            display: 'flex', gap: 10, alignItems: 'flex-start'
                        }}>
                            <span style={{ fontSize: '1rem', flexShrink: 0 }}>
                                {n.type === 'assignment' ? '📋' : n.type === 'achievement' ? '🏆' : '🔔'}
                            </span>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.82rem', lineHeight: 1.4 }}>{n.message}</div>
                                {!n.read && (
                                    <div style={{
                                        width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)',
                                        display: 'inline-block', marginTop: 4
                                    }} />
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [open, setOpen] = useState(false);
    const [theme, setTheme] = useState('dark');
    const [notifications, setNotifications] = useState([]);
    const [showNotifs, setShowNotifs] = useState(false);

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
        if (!u) { router.push('/login'); return; }
        setUser(u);
        // Fetch notifications on mount
        api.get('/analytics/notifications').then(data => setNotifications(data)).catch(() => { });
    }, []);

    const markAllRead = async () => {
        // mark each unread notification
        const unread = notifications.filter(n => !n.read);
        await Promise.all(unread.map(n => api.post(`/analytics/notifications/${n.id}/read`, {})));
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    if (!user) return null;
    const role = user.role ? user.role.toLowerCase() : '';
    const isAdmin = ['admin', 'hr_admin'].includes(role);
    const isManager = role === 'manager';
    const unreadCount = notifications.filter(n => !n.read).length;

    let navSections = [];
    if (isAdmin) {
        navSections.push({ title: 'Administration', items: adminNav });
    } else if (isManager) {
        navSections.push({ title: 'Management', items: managerNav });
        navSections.push({ title: 'My Learning', items: [{ label: 'My Courses', icon: '📚', href: '/courses' }, { label: 'My Certificates', icon: '🏆', href: '/certificates' }, { label: 'Leaderboard', icon: '🏅', href: '/leaderboard' }] });
    } else {
        navSections.push({ title: 'Learning', items: learnerNav });
    }

    const handleNav = (href) => { router.push(href); setOpen(false); };

    return (
        <>
            <button className="mobile-toggle" onClick={() => setOpen(!open)}>☰</button>
            {open && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }} onClick={() => setOpen(false)} />}
            <aside className={`sidebar ${open ? 'open' : ''}`}>
                {/* Logo */}
                <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '20px' }}>
                    <img src="/vearc_logo.png" alt="VeARC" style={{ height: '45px', width: '45px', borderRadius: '8px', objectFit: 'cover' }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <h1 style={{ fontSize: '1.5rem', margin: 0, lineHeight: 1 }}>VeLearn</h1>
                        <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>AI Learning Platform</span>
                    </div>
                </div>

                {/* Nav */}
                <nav className="sidebar-nav">
                    {navSections.map((section) => (
                        <div className="nav-section" key={section.title}>
                            <div className="nav-section-title">{section.title}</div>
                            {section.items.map((item) => (
                                <button
                                    key={item.href}
                                    className={`nav-item ${pathname === item.href || pathname.startsWith(item.href + '/') ? 'active' : ''}`}
                                    onClick={() => handleNav(item.href)}
                                >
                                    <span className="icon">{item.icon}</span>
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    ))}

                    {/* Account section — Notifications link + Profile */}
                    <div className="nav-section">
                        <div className="nav-section-title">Account</div>

                        {/* Notifications — navigates to /notifications page */}
                        <button
                            className={`nav-item ${pathname === '/notifications' ? 'active' : ''}`}
                            onClick={() => handleNav('/notifications')}
                            style={{ width: '100%' }}
                        >
                            <span className="icon" style={{ position: 'relative', display: 'inline-flex' }}>
                                🔔
                                {unreadCount > 0 && (
                                    <span style={{
                                        position: 'absolute', top: -6, right: -8,
                                        background: '#e53935', color: '#fff',
                                        borderRadius: '50%', minWidth: 16, height: 16,
                                        fontSize: '0.6rem', fontWeight: 700,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        padding: '0 2px', lineHeight: 1
                                    }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                                )}
                            </span>
                            Notifications
                            {unreadCount > 0 && (
                                <span className="badge badge-info" style={{ marginLeft: 'auto', fontSize: '0.65rem', padding: '1px 6px' }}>
                                    {unreadCount} new
                                </span>
                            )}
                        </button>

                        {/* Profile */}
                        <button
                            className={`nav-item ${pathname === '/profile' ? 'active' : ''}`}
                            onClick={() => handleNav('/profile')}
                        >
                            <span className="icon">👤</span>
                            My Profile
                        </button>
                    </div>
                </nav>

                {/* Footer — clean: avatar + name + theme toggle + logout only */}
                <div className="sidebar-user">
                    <div className="sidebar-avatar" style={{ cursor: 'pointer' }} onClick={() => router.push('/profile')} title="View Profile">
                        {user.name?.[0] || '?'}
                    </div>
                    <div className="sidebar-user-info" style={{ cursor: 'pointer', flex: 1, minWidth: 0 }} onClick={() => router.push('/profile')}>
                        <div className="sidebar-user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                        <div className="sidebar-user-role">{user.role?.replace('_', ' ')}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="logout-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Light mode' : 'Dark mode'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                        </button>
                        <button className="logout-btn" onClick={() => api.logout()} title="Sign out" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <LogoutIcon />
                        </button>
                    </div>
                </div>
            </aside>
            {showNotifs && <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowNotifs(false)} />}
        </>
    );
}
