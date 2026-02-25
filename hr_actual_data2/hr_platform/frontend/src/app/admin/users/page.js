'use client';
import '../../globals.css';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editUser, setEditUser] = useState(null);
    const [isAddingUser, setIsAddingUser] = useState(false);
    const [newUser, setNewUser] = useState({
        name: '', email: '', password: '', role: 'learner', department: '', job_title: ''
    });

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
            await api.put(`/users/${editUser.id}`, {
                name: editUser.name,
                role: editUser.role,
                department: editUser.department,
                job_title: editUser.job_title,
            });
            setEditUser(null);
            loadUsers();
        } catch (err) { alert(err.message); }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await api.post('/users', newUser);
            setIsAddingUser(false);
            setNewUser({ name: '', email: '', password: '', role: 'learner', department: '', job_title: '' });
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
        const colors = { admin: 'badge-danger', hr_admin: 'badge-warning', learner: 'badge-success', content_author: 'badge-neutral' };
        return colors[role] || 'badge-neutral';
    };

    if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1>👤 User Management</h1>
                        <p>Manage platform users and their roles</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setIsAddingUser(true)}>
                        + Add New User
                    </button>
                </div>

                <div className="stat-grid" style={{ marginBottom: 24 }}>
                    <div className="stat-card">
                        <div className="value">{users.length}</div>
                        <div className="label">Total Users</div>
                    </div>
                    <div className="stat-card">
                        <div className="value">{users.filter(u => u.role === 'admin' || u.role === 'hr_admin').length}</div>
                        <div className="label">Admins</div>
                    </div>

                    <div className="stat-card">
                        <div className="value">{users.filter(u => u.role === 'learner').length}</div>
                        <div className="label">Learners</div>
                    </div>
                </div>

                <div className="table-container fade-in">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Division</th>
                                <th>Department</th>
                                <th>Manager</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{
                                                width: 32, height: 32, borderRadius: '50%',
                                                background: 'var(--accent-gradient)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 14, fontWeight: 700, color: 'white',
                                            }}>
                                                {u.name?.[0]}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.job_title}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{u.email}</td>
                                    <td><span className={`badge ${roleColor(u.role)}`}>{u.role?.replace('_', ' ')}</span></td>
                                    <td>{u.division || '—'}</td>
                                    <td>{u.department || '—'}</td>
                                    <td>{u.manager_name || '—'}</td>
                                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button className="btn btn-ghost btn-sm" onClick={() => setEditUser({ ...u })}>✏️</button>
                                            <button className="btn btn-ghost btn-sm" onClick={() => deleteUser(u.id)} style={{ color: 'var(--danger)' }}>🗑</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
                                        <option value="learner">Learner</option>
                                        <option value="content_author">Content Author</option>
                                        <option value="hr_admin">HR Admin</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Department</label>
                                    <input className="form-input" value={editUser.department || ''} onChange={(e) => setEditUser({ ...editUser, department: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Job Title</label>
                                    <input className="form-input" value={editUser.job_title || ''} onChange={(e) => setEditUser({ ...editUser, job_title: e.target.value })} />
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setEditUser(null)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Save Changes</button>
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
                                        <option value="learner">Learner</option>
                                        <option value="content_author">Content Author</option>
                                        <option value="hr_admin">HR Admin</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Department</label>
                                    <input className="form-input" value={newUser.department} onChange={(e) => setNewUser({ ...newUser, department: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Job Title</label>
                                    <input className="form-input" value={newUser.job_title} onChange={(e) => setNewUser({ ...newUser, job_title: e.target.value })} />
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setIsAddingUser(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Create User</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
