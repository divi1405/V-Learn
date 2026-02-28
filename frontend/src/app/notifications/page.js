'use client';
import '../globals.css';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

const TYPE_ICON = {
    assignment: '📋',
    achievement: '🏆',
    completion: '✓',
    reminder: '⏰',
};

export default function NotificationsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all | unread

    useEffect(() => {
        const u = api.getUser();
        if (!u) { router.push('/login'); return; }
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            const data = await api.get('/analytics/notifications');
            setNotifications(data);
        } catch {
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    };

    const handleNotifClick = async (n) => {
        if (!n.read) {
            try {
                await api.post(`/analytics/notifications/${n.id}/read`, {});
                setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
            } catch { /* silent */ }
        }
        // Redirect based on notification type
        const t = n.type?.toLowerCase();
        if (t === 'assignment' || t === 'enrollment') {
            router.push('/courses');
        } else if (t === 'achievement' || t === 'completion') {
            router.push('/certificates');
        } else {
            router.push('/dashboard');
        }
    };

    const markAllRead = async () => {
        const unread = notifications.filter(n => !n.read);
        await Promise.all(unread.map(n => api.post(`/analytics/notifications/${n.id}/read`, {})));
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const filtered = filter === 'unread' ? notifications.filter(n => !n.read) : notifications;
    const unreadCount = notifications.filter(n => !n.read).length;

    const timeAgo = (dateStr) => {
        if (!dateStr) return '';
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content" style={{ padding: 0 }}>
                <Header />
                <div style={{ padding: '24px' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                        <div>
                            <h1 style={{ margin: '0 0 4px', fontSize: '1.5rem' }}>🔔 Notifications</h1>
                            <p style={{ margin: 0, color: 'var(--vearc-text-muted)', fontSize: '0.88rem' }}>
                                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <div style={{ display: 'flex', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--vearc-border)' }}>
                                {['all', 'unread'].map(f => (
                                    <button key={f} onClick={() => setFilter(f)}
                                        style={{
                                            padding: '6px 16px', border: 'none', cursor: 'pointer',
                                            background: filter === f ? 'var(--vearc-primary)' : 'var(--card-bg)',
                                            color: filter === f ? 'var(--vearc-surface)' : 'var(--vearc-text-muted)',
                                            fontSize: '0.85rem', fontWeight: filter === f ? 600 : 400,
                                            transition: 'all 0.2s'
                                        }}>
                                        {f === 'all' ? `All (${notifications.length})` : `Unread (${unreadCount})`}
                                    </button>
                                ))}
                            </div>
                            {unreadCount > 0 && (
                                <button className="btn btn-ghost btn-sm" onClick={markAllRead}>
                                    Mark all read
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--vearc-text-muted)' }}>
                            <div className="spinner" style={{ margin: '0 auto 12px' }} />
                            Loading...
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔕</div>
                            <h3 style={{ margin: '0 0 8px' }}>
                                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                            </h3>
                            <p style={{ color: 'var(--vearc-text-muted)', margin: '0 0 20px', fontSize: '0.9rem' }}>
                                {filter === 'unread'
                                    ? "You're all caught up! Switch to 'All' to see past notifications."
                                    : "When your manager assigns a course or you earn a badge, it will show up here."}
                            </p>
                            {filter === 'unread' && (
                                <button className="btn btn-ghost btn-sm" onClick={() => setFilter('all')}>View all</button>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {filtered.map(n => (
                                <div
                                    key={n.id}
                                    className="card"
                                    style={{
                                        padding: '16px 20px',
                                        display: 'flex',
                                        gap: 16,
                                        alignItems: 'flex-start',
                                        cursor: 'pointer',
                                        border: n.read ? '1px solid var(--vearc-border)' : '1px solid var(--vearc-primary)',
                                        background: n.read ? 'var(--card-bg)' : 'rgba(99,102,241,0.06)',
                                        transition: 'all 0.2s'
                                    }}
                                    onClick={() => handleNotifClick(n)}
                                >
                                    {/* Icon */}
                                    <div style={{
                                        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                                        background: n.read ? 'var(--bg)' : 'rgba(99,102,241,0.15)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '1.3rem'
                                    }}>
                                        {TYPE_ICON[n.type] || '🔔'}
                                    </div>

                                    {/* Content */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                                            <span style={{ fontWeight: n.read ? 400 : 700, fontSize: '0.92rem' }}>{n.message}</span>
                                            {!n.read && <span className="badge badge-info" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>New</span>}
                                        </div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--vearc-text-muted)' }}>
                                            {timeAgo(n.created_at || n.timestamp)} Â· {n.type?.replace('_', ' ') || 'notification'}
                                        </div>
                                    </div>

                                    {/* Unread dot */}
                                    {!n.read && (
                                        <div style={{
                                            width: 10, height: 10, borderRadius: '50%',
                                            background: 'var(--vearc-primary)', flexShrink: 0, marginTop: 4
                                        }} />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}


