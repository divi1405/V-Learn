'use client';
import '../../../globals.css';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

// SVG Icons for reorder & actions
const ChevronUpIcon = (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>;
const ChevronDownIcon = (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>;
const TrashIcon = (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>;
const GripIcon = (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="9" cy="5" r="1" /><circle cx="15" cy="5" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="9" cy="19" r="1" /><circle cx="15" cy="19" r="1" /></svg>;

export default function CourseBuilderPage() {
    const router = useRouter();
    const params = useParams();
    const courseId = params?.id;

    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedModule, setExpandedModule] = useState(null);

    // Form States
    const [showModuleModal, setShowModuleModal] = useState(false);
    const [moduleForm, setModuleForm] = useState({ title: '', order_index: 0 });
    const [showLessonModal, setShowLessonModal] = useState(false);
    const [targetModuleId, setTargetModuleId] = useState(null);
    const [lessonForm, setLessonForm] = useState({ title: '', type: 'video', content: '', content_url: '', duration_mins: 5, order_index: 0 });
    const [uploading, setUploading] = useState(false);
    const [generatingQuiz, setGeneratingQuiz] = useState(false);

    // Drag state
    const dragItem = useRef(null);
    const dragOverItem = useRef(null);
    const [dragContext, setDragContext] = useState(null); // 'module' or moduleId for lessons

    useEffect(() => { if (courseId) loadBuilderData(); }, [courseId]);

    const loadBuilderData = async () => {
        try {
            const data = await api.get(`/courses/${courseId}`);
            setCourse(data);
        } catch (err) {
            console.error(err);
            alert("Failed to load course details.");
        } finally { setLoading(false); }
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

    // Module drag-and-drop
    const handleModuleDragEnd = async () => {
        if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) {
            dragItem.current = null;
            dragOverItem.current = null;
            return;
        }
        const sorted = [...(course.modules || [])].sort((a, b) => a.order_index - b.order_index);
        const draggedModule = sorted[dragItem.current];
        sorted.splice(dragItem.current, 1);
        sorted.splice(dragOverItem.current, 0, draggedModule);

        // Update all order indices
        try {
            await Promise.all(sorted.map((m, i) =>
                api.put(`/courses/${courseId}/modules/${m.id}`, { order_index: i })
            ));
            loadBuilderData();
        } catch (err) { alert(err.message); }
        dragItem.current = null;
        dragOverItem.current = null;
    };

    // Lesson drag-and-drop within a module
    const handleLessonDragEnd = async (moduleId) => {
        if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) {
            dragItem.current = null;
            dragOverItem.current = null;
            return;
        }
        const mod = course.modules.find(m => m.id === moduleId);
        if (!mod) return;
        const sorted = [...(mod.lessons || [])].sort((a, b) => a.order_index - b.order_index);
        const draggedLesson = sorted[dragItem.current];
        sorted.splice(dragItem.current, 1);
        sorted.splice(dragOverItem.current, 0, draggedLesson);

        try {
            await Promise.all(sorted.map((l, i) =>
                api.put(`/modules/${moduleId}/lessons/${l.id}`, { order_index: i })
            ));
            loadBuilderData();
        } catch (err) { alert(err.message); }
        dragItem.current = null;
        dragOverItem.current = null;
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
        } catch (err) { alert(err.message); }
        finally { setUploading(false); }
    };

    // --- QUIZ AI MOCK ---
    const handleAutoGenerateQuiz = async (lessonId, lessonTitle) => {
        setGeneratingQuiz(true);
        try {
            const mockQuestions = await api.post('/ai/generate-quiz', { topic: lessonTitle });
            const quizPayload = { pass_threshold: 70.0, max_attempts: 3, questions: mockQuestions };
            await api.post(`/quizzes/lesson/${lessonId}`, quizPayload);
            alert("Quiz auto-generated and attached to lesson!");
            loadBuilderData();
        } catch (err) {
            alert(err.message || "Failed to generate quiz.");
        } finally { setGeneratingQuiz(false); }
    };

    if (loading) return <div className="loading-page"><div className="spinner"></div></div>;
    if (!course) return <div className="app-layout"><Sidebar /><main className="main-content"><h1>Course Not Found</h1></main></div>;

    const sortedModules = [...(course.modules || [])].sort((a, b) => a.order_index - b.order_index);

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content" style={{ padding: 0 }}>
                <Header />
                <div style={{ padding: '24px', paddingBottom: '100px' }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
                        <button className="btn btn-ghost" onClick={() => router.push('/admin/courses')}>← Back</button>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '1.3rem' }}>Course Builder: {course.title}</h1>
                            <p style={{ margin: '4px 0 0', color: 'var(--vearc-text-muted)', fontSize: '0.85rem' }}>Manage modules, lessons, and quizzes. Drag items to reorder.</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                        <h3 style={{ margin: 0 }}>Curriculum Outline</h3>
                        <button className="btn vearc-btn-primary btn-sm" onClick={() => setShowModuleModal(true)}>+ Add Module</button>
                    </div>

                    {/* MODULE LIST */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {sortedModules.map((mod, modIdx) => {
                            const sortedLessons = [...(mod.lessons || [])].sort((a, b) => a.order_index - b.order_index);
                            return (
                                <div
                                    key={mod.id}
                                    className="card fade-in"
                                    style={{ borderLeft: '4px solid var(--vearc-primary)', padding: 0, overflow: 'hidden' }}
                                    draggable
                                    onDragStart={() => { dragItem.current = modIdx; setDragContext('module'); }}
                                    onDragEnter={() => { if (dragContext === 'module') dragOverItem.current = modIdx; }}
                                    onDragEnd={() => { if (dragContext === 'module') { handleModuleDragEnd(); setDragContext(null); } }}
                                    onDragOver={(e) => e.preventDefault()}
                                >
                                    <div
                                        style={{ padding: '16px 20px', background: 'var(--vearc-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                                        onClick={() => setExpandedModule(expandedModule === mod.id ? null : mod.id)}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <GripIcon width="16" height="16" style={{ color: 'var(--vearc-text-muted)', cursor: 'grab', flexShrink: 0 }} />
                                            <div>
                                                <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem' }}>Module {modIdx + 1}: {mod.title}</h4>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--vearc-text-muted)' }}>{mod.lessons?.length || 0} Lessons</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                            <button className="btn btn-ghost btn-sm" title="Delete module" onClick={(e) => { e.stopPropagation(); deleteModule(mod.id); }} style={{ color: 'var(--vearc-danger)' }}>
                                                <TrashIcon width="16" height="16" />
                                            </button>
                                            <ChevronDownIcon width="18" height="18" style={{ transition: '0.2s', transform: expandedModule === mod.id ? 'rotate(180deg)' : 'none', color: 'var(--vearc-text-muted)' }} />
                                        </div>
                                    </div>

                                    {/* LESSONS ACCORDION */}
                                    {expandedModule === mod.id && (
                                        <div style={{ padding: '20px', background: 'var(--vearc-bg)', borderTop: '1px solid var(--vearc-border)' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                {sortedLessons.map((lesson, lessIdx) => (
                                                    <div
                                                        key={lesson.id}
                                                        draggable
                                                        onDragStart={(e) => { e.stopPropagation(); dragItem.current = lessIdx; setDragContext(mod.id); }}
                                                        onDragEnter={(e) => { e.stopPropagation(); if (dragContext === mod.id) dragOverItem.current = lessIdx; }}
                                                        onDragEnd={(e) => { e.stopPropagation(); if (dragContext === mod.id) { handleLessonDragEnd(mod.id); setDragContext(null); } }}
                                                        onDragOver={(e) => e.preventDefault()}
                                                        style={{
                                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                            background: 'var(--vearc-surface)', padding: '12px 16px',
                                                            borderRadius: 'var(--vearc-radius-md)', border: '1px solid var(--vearc-border)',
                                                            cursor: 'grab'
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                            <GripIcon width="14" height="14" style={{ color: 'var(--vearc-text-muted)', flexShrink: 0 }} />
                                                            <span style={{ fontSize: '1.2rem' }}>{lesson.type === 'video' ? '🎥' : lesson.type === 'quiz' ? '✅' : '📄'}</span>
                                                            <div>
                                                                <div style={{ fontWeight: 500 }}>{lessIdx + 1}. {lesson.title}</div>
                                                                <div style={{ fontSize: '0.75rem', color: 'var(--vearc-text-muted)' }}>{lesson.duration_mins} mins • {lesson.type}</div>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: 6 }}>
                                                            {lesson.type === 'quiz' && (
                                                                <button className="btn btn-ghost btn-sm" onClick={() => handleAutoGenerateQuiz(lesson.id, lesson.title)} disabled={generatingQuiz}>
                                                                    {generatingQuiz ? 'Generating...' : 'AI Quiz'}
                                                                </button>
                                                            )}

                                                            <button className="btn btn-ghost btn-sm" title="Delete lesson" onClick={() => deleteLesson(mod.id, lesson.id)} style={{ color: 'var(--vearc-danger)' }}>
                                                                <TrashIcon width="14" height="14" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                                <button className="btn btn-ghost btn-sm" style={{ borderStyle: 'dashed', border: '1px dashed var(--vearc-border)', marginTop: 8 }} onClick={() => {
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
                            );
                        })}
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
                                        <button type="submit" className="btn vearc-btn-primary">Save Module</button>
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
                                        <div className="form-group" style={{ padding: '16px', background: 'var(--vearc-bg)', borderRadius: 'var(--vearc-radius-sm)', border: '1px solid var(--vearc-border)' }}>
                                            <label className="form-label">Media Source</label>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--vearc-text-muted)' }}>Paste a YouTube/External URL below, OR upload a file directly.</p>
                                            <input className="form-input" style={{ marginBottom: 12 }} placeholder="https://youtube.com/watch?v=..." value={lessonForm.content_url} onChange={(e) => setLessonForm({ ...lessonForm, content_url: e.target.value })} />
                                            <div style={{ textAlign: 'center', margin: '8px 0', fontSize: '0.8rem' }}>— OR —</div>
                                            <input type="file" onChange={handleFileUpload} accept={lessonForm.type === 'video' ? "video/*" : ".pdf"} className="form-input" />
                                            {uploading && <div style={{ fontSize: '0.8rem', color: 'var(--vearc-primary)', marginTop: 4 }}>Uploading file, please wait...</div>}
                                        </div>
                                    ) : lessonForm.type === 'article' ? (
                                        <div className="form-group">
                                            <label className="form-label">Article Text Content</label>
                                            <textarea className="form-textarea" rows="4" value={lessonForm.content} onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })} />
                                        </div>
                                    ) : (
                                        <div className="form-group">
                                            <div className="empty-state" style={{ padding: 12, minHeight: 'auto' }}>
                                                Save the lesson first, then click "AI Quiz" from the list to generate questions.
                                            </div>
                                        </div>
                                    )}

                                    <div className="modal-actions" style={{ marginTop: 24 }}>
                                        <button type="button" className="btn btn-secondary" onClick={() => setShowLessonModal(false)}>Cancel</button>
                                        <button type="submit" className="btn vearc-btn-primary" disabled={uploading}>Save Lesson</button>
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
