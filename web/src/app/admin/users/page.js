'use client';
import '../../globals.css';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { UsersIcon, EditIcon, TrashIcon, SearchIcon } from '@/components/Icons';

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editUser, setEditUser] = useState(null);
    const [isAddingUser, setIsAddingUser] = useState(false);
    const [newUser, setNewUser] = useState({
        name: '', email: '', password: '', role: 'LEARNER', department: '', designation: '', manager_id: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await api.get('/users');
            setUsers(data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const updateUser = async (e) => {
        e.preventDefault();
        try {
            const managerId = editUser.manager_id ? parseInt(editUser.manager_id, 10) : null;
            await api.put(`/users/${editUser.id}`, {
                name: editUser.name,
                role: editUser.role,
                department: editUser.department,
                designation: editUser.designation,
                manager_id: managerId,
            });
            setEditUser(null);
            loadUsers();
        } catch (err) { alert(err.message); }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...newUser };
            payload.manager_id = payload.manager_id ? parseInt(payload.manager_id, 10) : null;
            await api.post('/users', payload);
            setIsAddingUser(false);
            setNewUser({ name: '', email: '', password: '', role: 'LEARNER', department: '', designation: '', manager_id: '' });
            loadUsers();
        } catch (err) { alert(err.message); }
    };

    const deleteUser = async (id) => {
        if (!confirm('Delete this user?')) return;
        try {
            await api.delete(`/users/${id}`);
            loadUsers();
        } catch (err) { alert(err.message); }
    };

    const roleColor = (role) => {
        const colors = { admin: 'badge-danger', hr_admin: 'badge-warning', learner: 'badge-success', content_author: 'badge-neutral', manager: 'badge-info' };
        return colors[role?.toLowerCase()] || 'badge-neutral';
    };

    if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

    const filteredUsers = users.filter(u => {
        const matchesSearch = (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (u.department || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole ? u.role === filterRole : true;
        return matchesSearch && matchesRole;
    });

    // Reset page when filters change
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const safePage = Math.min(currentPage, totalPages || 1);
    const paginatedUsers = filteredUsers.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content" style={{ padding: 0 }}>
                <Header />
                <div style={{ padding: '24px' }}>
                    <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h1 className="vearc-page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', marginTop: 0 }}>
                                <UsersIcon style={{ color: 'var(--vearc-primary)' }} width="32" height="32" /> User Management
                            </h1>
                            <p style={{ marginTop: 0 }}>Manage platform users and their roles</p>
                        </div>
                        <button className="btn vearc-btn-primary" onClick={() => setIsAddingUser(true)}>
                            + Add New User
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }} className="slide-up">
                        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ backgroundColor: 'var(--bg-surface)', padding: '12px', borderRadius: '12px', display: 'flex' }}>
                                <UsersIcon width="24" height="24" style={{ color: 'var(--vearc-primary)' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 600, lineHeight: 1.2, color: 'var(--text-primary)' }}>{users.length}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Total Users</div>
                            </div>
                        </div>
                        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ backgroundColor: 'var(--bg-surface)', padding: '12px', borderRadius: '12px', display: 'flex' }}>
                                <UsersIcon width="24" height="24" style={{ color: 'var(--warning)' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 600, lineHeight: 1.2, color: 'var(--text-primary)' }}>{users.filter(u => u.role === 'ADMIN' || u.role === 'HR_ADMIN').length}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Admins</div>
                            </div>
                        </div>
                        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ backgroundColor: 'var(--bg-surface)', padding: '12px', borderRadius: '12px', display: 'flex' }}>
                                <UsersIcon width="24" height="24" style={{ color: 'var(--success)' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 600, lineHeight: 1.2, color: 'var(--text-primary)' }}>{users.filter(u => u.role === 'LEARNER').length}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Learners</div>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ marginBottom: '24px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div className="search-wrapper" style={{ width: '300px', margin: 0, flex: 1, minWidth: '250px' }}>
                            <span className="search-icon" style={{ left: '10px', top: '50%', transform: 'translateY(-50%)' }}><SearchIcon width="14" height="14" /></span>
                            <input
                                type="text"
                                className="search-input vearc-search"
                                placeholder="Search users by name, email, department..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                style={{ paddingLeft: '32px' }}
                            />
                        </div>
                        <select
                            className="form-input"
                            style={{ width: '200px' }}
                            value={filterRole}
                            onChange={e => { setFilterRole(e.target.value); setCurrentPage(1); }}
                        >
                            <option value="">All Roles</option>
                            <option value="LEARNER">Learner</option>
                            <option value="CONTENT_AUTHOR">Content Author</option>
                            <option value="MANAGER">Manager</option>
                            <option value="HR_ADMIN">HR Admin</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>

                    {/* Users Table */}
                    <div className="table-container fade-in" style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Department</th>
                                    <th>Job Title</th>
                                    <th>Role</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedUsers.length === 0 ? (
                                    <tr><td colSpan="6" className="text-center" style={{ padding: 40, color: 'var(--text-muted)' }}>No users found matching your filters.</td></tr>
                                ) : paginatedUsers.map((u) => (
                                    <tr key={u.id}>
                                        <td style={{ padding: '10px 16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{
                                                    width: 32, height: 32, borderRadius: '50%',
                                                    background: (u.profile_image && u.profile_image !== 'null') ? 'transparent' : '#400F61',
                                                    backgroundImage: (u.profile_image && u.profile_image !== 'null') ? `url(${u.profile_image})` : 'none',
                                                    backgroundSize: 'cover', backgroundPosition: 'center',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0
                                                }}>
                                                    {!(u.profile_image && u.profile_image !== 'null') && u.name?.[0]}
                                                </div>
                                                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{u.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '10px 16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                                        <td style={{ padding: '10px 16px', fontSize: '0.85rem' }}>{u.department || '—'}</td>
                                        <td style={{ padding: '10px 16px', fontSize: '0.85rem' }}>{u.designation || '—'}</td>
                                        <td style={{ padding: '10px 16px' }}>
                                            <span className={`badge ${roleColor(u.role)}`} style={{ fontSize: '0.7rem' }}>
                                                {u.role?.toLowerCase()?.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td style={{ padding: '10px 16px' }}>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button className="btn btn-secondary btn-sm" onClick={() => setEditUser({ ...u })} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <EditIcon width="13" height="13" /> Edit
                                                </button>
                                                <button className="btn btn-ghost btn-sm" onClick={() => deleteUser(u.id)} style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', border: '1px solid rgba(255,82,82,0.3)' }}>
                                                    <TrashIcon width="13" height="13" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '12px 16px', borderTop: '1px solid var(--border)', fontSize: '0.85rem',
                            }}>
                                <span style={{ color: 'var(--text-secondary)' }}>
                                    Showing {((safePage - 1) * itemsPerPage) + 1}–{Math.min(safePage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
                                </span>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        disabled={safePage <= 1}
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    >
                                        Previous
                                    </button>
                                    <span style={{ fontWeight: 600, minWidth: '80px', textAlign: 'center' }}>
                                        Page {safePage} of {totalPages}
                                    </span>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        disabled={safePage >= totalPages}
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {editUser && (
                        <div className="modal-overlay" onClick={() => setEditUser(null)}>
                            <div className="modal" onClick={(e) => e.stopPropagation()}>
                                <h2>Edit User</h2>
                                <form onSubmit={updateUser}>
                                    <div className="form-group">
                                        <label className="form-label">Name</label>
                                        <input className="form-input" value={editUser.name} onChange={(e) => setEditUser({ ...editUser, name: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Role</label>
                                        <select className="form-select" value={editUser.role} onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}>
                                            <option value="LEARNER">Learner</option>
                                            <option value="CONTENT_AUTHOR">Content Author</option>
                                            <option value="HR_ADMIN">HR Admin</option>
                                            <option value="ADMIN">Admin</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Department</label>
                                        <input className="form-input" value={editUser.department || ''} onChange={(e) => setEditUser({ ...editUser, department: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Job Title</label>
                                        <input className="form-input" value={editUser.designation || ''} onChange={(e) => setEditUser({ ...editUser, designation: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Manager</label>
                                        <select className="form-select" value={editUser.manager_id || ''} onChange={(e) => setEditUser({ ...editUser, manager_id: e.target.value })}>
                                            <option value="">None</option>
                                            {users.filter(u => ['MANAGER', 'HR_ADMIN', 'ADMIN'].includes(u.role) && u.id !== editUser.id).map(m => (
                                                <option key={m.id} value={m.id}>{m.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="modal-actions">
                                        <button type="button" className="btn btn-secondary" onClick={() => setEditUser(null)}>Cancel</button>
                                        <button type="submit" className="btn vearc-btn-primary">Save Changes</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {isAddingUser && (
                        <div className="modal-overlay" onClick={() => setIsAddingUser(false)}>
                            <div className="modal" onClick={(e) => e.stopPropagation()}>
                                <h2>Add New User</h2>
                                <form onSubmit={handleCreateUser}>
                                    <div className="form-group">
                                        <label className="form-label">Name</label>
                                        <input className="form-input" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email</label>
                                        <input type="email" className="form-input" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Temporary Password</label>
                                        <input className="form-input" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Role</label>
                                        <select className="form-select" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                                            <option value="LEARNER">Learner</option>
                                            <option value="CONTENT_AUTHOR">Content Author</option>
                                            <option value="HR_ADMIN">HR Admin</option>
                                            <option value="ADMIN">Admin</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Department</label>
                                        <input className="form-input" value={newUser.department} onChange={(e) => setNewUser({ ...newUser, department: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Job Title</label>
                                        <input className="form-input" value={newUser.designation} onChange={(e) => setNewUser({ ...newUser, designation: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Manager</label>
                                        <select className="form-select" value={newUser.manager_id} onChange={(e) => setNewUser({ ...newUser, manager_id: e.target.value })}>
                                            <option value="">None</option>
                                            {users.filter(u => ['MANAGER', 'HR_ADMIN', 'ADMIN'].includes(u.role)).map(m => (
                                                <option key={m.id} value={m.id}>{m.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="modal-actions">
                                        <button type="button" className="btn btn-secondary" onClick={() => setIsAddingUser(false)}>Cancel</button>
                                        <button type="submit" className="btn vearc-btn-primary">Create User</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
