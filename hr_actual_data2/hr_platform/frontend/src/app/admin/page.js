'use client';
import '../globals.css';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';

export default function AdminPage() {
    const [stats, setStats] = useState(null);
    const [deptStats, setDeptStats] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [statsData, deptData, courseData] = await Promise.all([
                api.get('/analytics/dashboard-stats'),
                api.get('/analytics/department-stats'),
                api.get('/courses?status=published'),
            ]);
            setStats(statsData);
            setDeptStats(deptData);
            setCourses(courseData);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="page-header">
                    <h1>⚙️ Admin Dashboard</h1>
                    <p>Platform-wide overview and management</p>
                </div>

                {/* Stats */}
                <div className="stat-grid slide-up">
                    <div className="stat-card">
                        <div className="icon">👥</div>
                        <div className="value">{stats?.total_users || 0}</div>
                        <div className="label">Total Users</div>
                    </div>
                    <div className="stat-card">
                        <div className="icon">📚</div>
                        <div className="value">{stats?.total_courses || 0}</div>
                        <div className="label">Published Courses</div>
                    </div>
                    <div className="stat-card">
                        <div className="icon">📝</div>
                        <div className="value">{stats?.total_enrollments || 0}</div>
                        <div className="label">Total Enrollments</div>
                    </div>
                    <div className="stat-card">
                        <div className="icon">📊</div>
                        <div className="value" style={{ color: stats?.completion_rate >= 50 ? 'var(--success)' : 'var(--warning)' }}>
                            {stats?.completion_rate || 0}%
                        </div>
                        <div className="label">Completion Rate</div>
                    </div>
                    <div className="stat-card">
                        <div className="icon">🔥</div>
                        <div className="value">{stats?.active_learners || 0}</div>
                        <div className="label">Active Learners (30d)</div>
                    </div>
                    <div className="stat-card">
                        <div className="icon">🏆</div>
                        <div className="value">{stats?.certificates_issued || 0}</div>
                        <div className="label">Certificates Issued</div>
                    </div>
                </div>

                {/* Department Stats */}
                <div className="section-header">
                    <h2>Department Breakdown</h2>
                </div>
                <div className="table-container fade-in" style={{ marginBottom: 32 }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Department</th>
                                <th>Users</th>
                                <th>Enrollments</th>
                                <th>Completions</th>
                                <th>Completion Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deptStats.map((d) => (
                                <tr key={d.department}>
                                    <td style={{ fontWeight: 600 }}>{d.department}</td>
                                    <td>{d.user_count}</td>
                                    <td>{d.enrollments}</td>
                                    <td>{d.completions}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div className="progress-bar" style={{ width: 80 }}>
                                                <div className="progress-fill" style={{
                                                    width: `${d.completion_rate}%`,
                                                    background: d.completion_rate >= 80 ? 'var(--success)' : d.completion_rate >= 50 ? 'var(--accent-gradient)' : 'var(--warning)',
                                                }}></div>
                                            </div>
                                            <span style={{ fontSize: 12, fontWeight: 600 }}>{d.completion_rate}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Course Performance */}
                <div className="section-header">
                    <h2>Course Performance</h2>
                </div>
                <div className="table-container fade-in">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Course</th>
                                <th>Category</th>
                                <th>Difficulty</th>
                                <th>Enrollments</th>
                                <th>Duration</th>
                            </tr>
                        </thead>
                        <tbody>
                            {courses.map((c) => (
                                <tr key={c.id}>
                                    <td style={{ fontWeight: 600 }}>{c.title}</td>
                                    <td><span className="badge badge-neutral">{c.category}</span></td>
                                    <td><span className={`badge ${c.difficulty === 'beginner' ? 'badge-success' : c.difficulty === 'intermediate' ? 'badge-warning' : 'badge-danger'}`}>{c.difficulty}</span></td>
                                    <td>{c.enrollment_count}</td>
                                    <td>{c.duration_mins} min</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}
