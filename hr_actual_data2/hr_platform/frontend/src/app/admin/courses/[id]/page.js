'use client';
import '../../../globals.css';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';

export default function CourseBuilderPage() {
    const router = useRouter();
    const params = useParams();
    const courseId = params?.id;

    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);

    // UI States
    const [expandedModule, setExpandedModule] = useState(null);
    const [editingLesson, setEditingLesson] = useState(null);

    // Form States
    const [showModuleModal, setShowModuleModal] = useState(false);
    const [moduleForm, setModuleForm] = useState({ title: '', order_index: 0 });

    const [showLessonModal, setShowLessonModal] = useState(false);
    const [targetModuleId, setTargetModuleId] = useState(null);
    const [lessonForm, setLessonForm] = useState({ title: '', type: 'video', content: '', content_url: '', duration_mins: 5, order_index: 0 });

    const [uploading, setUploading] = useState(false);
    const [generatingQuiz, setGeneratingQuiz] = useState(false);

    useEffect(() => {
        if (courseId) loadBuilderData();
    }, [courseId]);

    const loadBuilderData = async () => {
        try {
            const data = await api.get(`/courses/${courseId}`);
            setCourse(data);
        } catch (err) {
            console.error(err);
            alert("Failed to load course details.");
        } finally {
            setLoading(false);
        }
    };

    // --- MODULES ---
    const handleCreateModule = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/courses/${courseId}/modules`, moduleForm);
            setShowModuleModal(false);
            setModuleForm({ title: '', order_index: course.modules?.length || 0 });
            loadBuilderData();
        } catch (err) { alert(err.message); }
    };

    const deleteModule = async (moduleId) => {
        if (!confirm('Delete this entire module and all its lessons?')) return;
        try {
            await api.delete(`/courses/${courseId}/modules/${moduleId}`);
            loadBuilderData();
        } catch (err) { alert(err.message); }
    };

    const moveModule = async (moduleId, direction) => {
        const mod = course.modules.find(m => m.id === moduleId);
        if (!mod) return;
        const newOrder = direction === 'up' ? mod.order_index - 1 : mod.order_index + 1;
        try {
            await api.put(`/courses/${courseId}/modules/${moduleId}`, { order_index: newOrder });
            loadBuilderData();
        } catch (err) { alert(err.message); }
    };

    // --- LESSONS ---
    const handleCreateLesson = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/modules/${targetModuleId}/lessons`, lessonForm);
            setShowLessonModal(false);
            setLessonForm({ title: '', type: 'video', content: '', content_url: '', duration_mins: 5, order_index: 0 });
            loadBuilderData();
        } catch (err) { alert(err.message); }
    };

    const deleteLesson = async (moduleId, lessonId) => {
        if (!confirm('Delete this lesson?')) return;
        try {
            await api.delete(`/modules/${moduleId}/lessons/${lessonId}`);
            loadBuilderData();
        } catch (err) { alert(err.message); }
    };

    const moveLesson = async (moduleId, lessonId, currentOrder, direction) => {
        const newOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;
        try {
            await api.put(`/modules/${moduleId}/lessons/${lessonId}`, { order_index: newOrder });
            loadBuilderData();
        } catch (err) { alert(err.message); }
    };

    // --- UPLOADS & MEDIA ---
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (!res.ok) throw new Error('Upload failed');
            const data = await res.json();
            setLessonForm({ ...lessonForm, content_url: data.url });
        } catch (err) {
            alert(err.message);
        } finally {
            setUploading(false);
        }
    };

    // --- QUIZ AI MOCK ---
    const handleAutoGenerateQuiz = async (lessonId, lessonTitle) => {
        setGeneratingQuiz(true);
        try {
            // 1. Fetch AI mock questions
            const mockQuestions = await api.post('/ai/generate-quiz', { topic: lessonTitle });

            // 2. Wrap them into a QuizCreate schema
            const quizPayload = {
                pass_threshold: 70.0,
                max_attempts: 3,
                questions: mockQuestions
            };

            // 3. Post to quizzes router
            await api.post(`/quizzes/lesson/${lessonId}`, quizPayload);
            alert("Quiz auto-generated and attached to lesson!");
            loadBuilderData(); // Refresh to show badge or status
        } catch (err) {
            alert(err.message || "Failed to generate quiz. A quiz might already exist for this lesson.");
        } finally {
            setGeneratingQuiz(false);
        }
    };

    if (loading) return <div className="loading-page"><div className="spinner"></div></div>;
    if (!course) return <div className="app-layout"><Sidebar /><main className="main-content"><h1>Course Not Found</h1></main></div>;

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content" style={{ paddingBottom: '100px' }}>
                <div className="page-header" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <button className="btn btn-ghost" onClick={() => router.push('/admin/courses')}>← Back</button>
                    <div>
                        <h1>🛠️ Course Builder: {course.title}</h1>
                        <p>Construct modules, upload videos, attach YouTube links, and generate quizzes.</p>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                    <h3 style={{ margin: 0 }}>Curriculum Outline</h3>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowModuleModal(true)}>+ Add Module</button>
                </div>

                {/* MODULE LIST */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {(course.modules || []).sort((a, b) => a.order_index - b.order_index).map((mod, modIdx) => (
                        <div key={mod.id} className="card fade-in" style={{ borderLeft: '4px solid var(--accent)', padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '16px 20px', background: 'var(--bg-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                                onClick={() => setExpandedModule(expandedModule === mod.id ? null : mod.id)}>
                                <div>
                                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>Module {modIdx + 1}: {mod.title}</h4>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{mod.lessons?.length || 0} Lessons</span>
                                </div>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); moveModule(mod.id, 'up'); }}>⬆</button>
                                    <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); moveModule(mod.id, 'down'); }}>⬇</button>
                                    <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); deleteModule(mod.id); }} style={{ color: 'var(--danger)' }}>🗑</button>
                                    <span style={{ transform: expandedModule === mod.id ? 'rotate(180deg)' : 'none', transition: '0.2s', display: 'inline-block' }}>▼</span>
                                </div>
                            </div>

                            {/* LESSONS ACCORDION */}
                            {expandedModule === mod.id && (
                                <div style={{ padding: '20px', background: 'var(--bg-body)', borderTop: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {(mod.lessons || []).sort((a, b) => a.order_index - b.order_index).map((lesson, lessIdx) => (
                                            <div key={lesson.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <span style={{ fontSize: '1.2rem' }}>{lesson.type === 'video' ? '🎥' : lesson.type === 'quiz' ? '✅' : '📄'}</span>
                                                    <div>
                                                        <div style={{ fontWeight: 500 }}>{lessIdx + 1}. {lesson.title}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lesson.duration_mins} mins • {lesson.type} • URL: {lesson.content_url || 'None'}</div>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    {lesson.type === 'quiz' && (
                                                        <button className="btn btn-outline btn-sm" onClick={() => handleAutoGenerateQuiz(lesson.id, lesson.title)} disabled={generatingQuiz}>
                                                            {generatingQuiz ? '✨ Generating...' : '✨ Auto-Generate Quiz'}
                                                        </button>
                                                    )}
                                                    <button className="btn btn-ghost btn-sm" onClick={() => moveLesson(mod.id, lesson.id, lesson.order_index, 'up')}>⬆</button>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => moveLesson(mod.id, lesson.id, lesson.order_index, 'down')}>⬇</button>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => deleteLesson(mod.id, lesson.id)} style={{ color: 'var(--danger)' }}>🗑</button>
                                                </div>
                                            </div>
                                        ))}
                                        <button className="btn btn-outline btn-sm" style={{ borderStyle: 'dashed', marginTop: 8 }} onClick={() => {
                                            setTargetModuleId(mod.id);
                                            setLessonForm({ ...lessonForm, order_index: mod.lessons?.length || 0 });
                                            setShowLessonModal(true);
                                        }}>
                                            + Add Lesson to {mod.title}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {course.modules?.length === 0 && <div className="empty-state">No modules created yet. Start building your curriculum!</div>}
                </div>

                {/* CREATE MODULE MODAL */}
                {showModuleModal && (
                    <div className="modal-overlay" onClick={() => setShowModuleModal(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <h2>Add New Module</h2>
                            <form onSubmit={handleCreateModule}>
                                <div className="form-group">
                                    <label className="form-label">Module Title</label>
                                    <input className="form-input" value={moduleForm.title} onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })} required placeholder="e.g. Introduction to Robotics" />
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModuleModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Save Module</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* CREATE LESSON MODAL */}
                {showLessonModal && (
                    <div className="modal-overlay" onClick={() => setShowLessonModal(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
                            <h2>Add New Lesson</h2>
                            <form onSubmit={handleCreateLesson}>
                                <div className="form-group">
                                    <label className="form-label">Lesson Title</label>
                                    <input className="form-input" value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} required />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div className="form-group">
                                        <label className="form-label">Lesson Type</label>
                                        <select className="form-select" value={lessonForm.type} onChange={(e) => setLessonForm({ ...lessonForm, type: e.target.value, content_url: '' })}>
                                            <option value="video">Video (Upload/YouTube)</option>
                                            <option value="article">Article / Text</option>
                                            <option value="quiz">Interactive Quiz</option>
                                            <option value="pdf">PDF Document</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Est. Duration (mins)</label>
                                        <input type="number" className="form-input" value={lessonForm.duration_mins} onChange={(e) => setLessonForm({ ...lessonForm, duration_mins: parseInt(e.target.value) })} />
                                    </div>
                                </div>

                                {lessonForm.type === 'video' || lessonForm.type === 'pdf' ? (
                                    <div className="form-group" style={{ padding: '16px', background: 'var(--bg-body)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                                        <label className="form-label">Media Source</label>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Paste a YouTube/External URL below, OR upload a file directly.</p>

                                        <input className="form-input" style={{ marginBottom: 12 }} placeholder="https://youtube.com/watch?v=..." value={lessonForm.content_url} onChange={(e) => setLessonForm({ ...lessonForm, content_url: e.target.value })} />

                                        <div style={{ textAlign: 'center', margin: '8px 0', fontSize: '0.8rem' }}>— OR —</div>

                                        <input type="file" onChange={handleFileUpload} accept={lessonForm.type === 'video' ? "video/*" : ".pdf"} className="form-input" />
                                        {uploading && <div style={{ fontSize: '0.8rem', color: 'var(--accent)', marginTop: 4 }}>Uploading file, please wait...</div>}
                                    </div>
                                ) : lessonForm.type === 'article' ? (
                                    <div className="form-group">
                                        <label className="form-label">Article Text Content</label>
                                        <textarea className="form-textarea" rows="4" value={lessonForm.content} onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })} />
                                    </div>
                                ) : (
                                    <div className="form-group">
                                        <div className="empty-state" style={{ padding: 12, minHeight: 'auto' }}>
                                            Save the lesson first, then click "✨ Auto-Generate Quiz" from the list view to attach questions.
                                        </div>
                                    </div>
                                )}

                                <div className="modal-actions" style={{ marginTop: 24 }}>
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowLessonModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" disabled={uploading}>Save Lesson</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}
