'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

const SunIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>;
const MoonIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>;
const LogoutIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;
const BellIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>;
const HomeIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
const BookIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>;
const MapIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" /><line x1="9" x2="9" y1="3" y2="18" /><line x1="15" x2="15" y1="6" y2="21" /></svg>;
const TrophyIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>;
const StarIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
const TargetIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>;
const MedalIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15" /><path d="M11 12 5.12 2.2" /><path d="m13 12 5.88-9.8" /><path d="M8 7h8" /><circle cx="12" cy="17" r="5" /><polyline points="12 18 10.9 15.2 8.9 16.2 11 17.3" /><polyline points="12 18 13.1 15.2 15.1 16.2 13 17.3" /></svg>;
const SettingsIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>;
const EditIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
const UsersIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const BarChartIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="18" y1="20" y2="10" /><line x1="12" x2="12" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="14" /></svg>;
const ClipboardIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /></svg>;
const UserIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;

const learnerOverview = [
    { label: 'Dashboard', icon: <HomeIcon />, href: '/dashboard' },
];

const learnerNav = [
    { label: 'Courses', icon: <BookIcon />, href: '/courses' },
    { label: 'Certificates & Badges', icon: <TrophyIcon />, href: '/certificates' },
    { label: 'Feedback & Ratings', icon: <StarIcon />, href: '/feedback' },
    { label: 'Learning Needs', icon: <TargetIcon />, href: '/learning-needs' },
    { label: 'Leaderboard', icon: <MedalIcon />, href: '/leaderboard' },
];

const adminOverview = [
    { label: 'Admin Dashboard', icon: <SettingsIcon />, href: '/admin' },
];

const adminNav = [
    { label: 'Manage Courses', icon: <EditIcon />, href: '/admin/courses' },
    { label: 'Manage Users', icon: <UsersIcon />, href: '/admin/users' },
    { label: 'Course Feedback', icon: <StarIcon />, href: '/admin/feedback' },
    { label: 'Learning Needs', icon: <TargetIcon />, href: '/admin/needs' },
    { label: 'Leaderboard', icon: <MedalIcon />, href: '/leaderboard' },
];

const managerOverview = [
    { label: 'Dashboard', icon: <HomeIcon />, href: '/manager/dashboard' },
];

const managerNav = [
    { label: 'Team Progress', icon: <BarChartIcon />, href: '/manager/team' },
    { label: 'Assigned Courses', icon: <BookIcon />, href: '/manager/assigned-courses' },
    { label: 'Assign Course', icon: <ClipboardIcon />, href: '/manager/assign-course' },
];

// Notification dropdown component
function NotificationPanel({ notifications, onMarkRead, onClose }) {
    const unread = notifications.filter(n => !n.read);
    return (
        <div style={{
            position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, right: 0,
            background: 'var(--card-bg)', border: '1px solid var(--vearc-border)',
            borderRadius: 'var(--radius)', boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            zIndex: 200, maxHeight: 320, overflow: 'hidden', display: 'flex', flexDirection: 'column'
        }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--vearc-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>🔔 Notifications</span>
                {unread.length > 0 && (
                    <button onClick={onMarkRead} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--vearc-primary)', fontSize: '0.75rem' }}>
                        Mark all read
                    </button>
                )}
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
                {notifications.length === 0 ? (
                    <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--vearc-text-muted)', fontSize: '0.85rem' }}>
                        No notifications yet
                    </div>
                ) : (
                    notifications.slice(0, 8).map(n => (
                        <div key={n.id} style={{
                            padding: '10px 16px', borderBottom: '1px solid var(--vearc-border)',
                            background: n.read ? 'transparent' : 'rgba(var(--accent-rgb,99,102,241),0.08)',
                            display: 'flex', gap: 10, alignItems: 'flex-start'
                        }}>
                            <span style={{ fontSize: '1rem', flexShrink: 0, color: 'var(--vearc-primary)' }}>
                                {n.type === 'assignment' ? <ClipboardIcon /> : n.type === 'achievement' ? <TrophyIcon /> : <BellIcon />}
                            </span>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.82rem', lineHeight: 1.4 }}>{n.message}</div>
                                {!n.read && (
                                    <div style={{
                                        width: 7, height: 7, borderRadius: '50%', background: 'var(--vearc-primary)',
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
    }, []);

    if (!user) return null;
    const role = user.role ? user.role.toLowerCase() : '';
    const isAdmin = ['admin', 'hr_admin'].includes(role);
    const isManager = role === 'manager';

    let navSections = [];
    if (isAdmin) {
        navSections.push({ title: 'Dashboard', items: adminOverview });
        navSections.push({ title: 'Administration', items: adminNav });
    } else if (isManager) {
        navSections.push({ title: '', items: managerOverview });
        navSections.push({
            title: 'My Learning', items: [
                { label: 'Courses', icon: <BookIcon />, href: '/courses' },
                { label: 'Certificates and badges', icon: <TrophyIcon />, href: '/certificates' },
                { label: 'Leaderboard', icon: <MedalIcon />, href: '/leaderboard' }
            ]
        });
        navSections.push({ title: 'Management', items: managerNav });
    } else {
        navSections.push({ title: 'Dashboard', items: learnerOverview });
        navSections.push({ title: 'Learning', items: learnerNav });
    }

    const handleNav = (href) => { router.push(href); setOpen(false); };

    return (
        <>
            <button className="mobile-toggle" onClick={() => setOpen(!open)}>☰</button>
            {open && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }} onClick={() => setOpen(false)} />}
            <aside className={`sidebar vearc-sidebar ${open ? 'open' : ''}`}>


                {/* Nav */}
                <nav className="sidebar-nav">
                    {navSections.map((section, idx) => (
                        <div className="nav-section" key={idx}>
                            {section.title && <div className="nav-section-title">{section.title}</div>}
                            {section.items.map((item) => {
                                const isDashboardRoot = ['/admin', '/manager/dashboard', '/dashboard'].includes(item.href);
                                const isActive = isDashboardRoot ? pathname === item.href : (pathname === item.href || pathname.startsWith(item.href + '/'));
                                return (
                                    <button
                                        key={item.href}
                                        className={`nav-item vearc-sidebar-item ${isActive ? 'active' : ''}`}
                                        onClick={() => handleNav(item.href)}
                                    >
                                        <span className="icon">{item.icon}</span>
                                        {item.label}
                                    </button>
                                );
                            })}
                        </div>
                    ))}


                </nav>

                {/* Bottom Logo section */}
                <div style={{ padding: '20px', borderTop: '1px solid var(--vearc-border)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
                    <img src="/vearc_logo.png" alt="VeArc Logo" style={{ height: '24px', width: 'auto', objectFit: 'contain' }} onError={(e) => e.target.style.display = 'none'} />
                </div>


            </aside>
        </>
    );
}
