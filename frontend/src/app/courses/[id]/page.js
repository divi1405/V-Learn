'use client';
import '../../globals.css';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { BotIcon, MapIcon, TargetIcon, UserIcon, TrophyIcon, ClipboardIcon } from '@/components/Icons';

function getYouTubeId(url) {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
}

export default function CourseDetailPage() {
    const router = useRouter();
    const params = useParams();
    const courseId = params.id;
    const [course, setCourse] = useState(null);
    const [enrollment, setEnrollment] = useState(null);
    const [lessonProgress, setLessonProgress] = useState([]);
    const [activeLesson, setActiveLesson] = useState(null);
    const [quiz, setQuiz] = useState(null);
    const [quizAnswers, setQuizAnswers] = useState({});
    const [quizResult, setQuizResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const u = api.getUser();
        setUser(u);
        loadData();
    }, [courseId]);

    const loadData = async () => {
        try {
            const [courseData, enrollData, progressData] = await Promise.all([
                api.get(`/courses/${courseId}`),
                api.get('/enrollments'),
                api.get(`/enrollments/lessons/progress?course_id=${courseId}`),
            ]);
            setCourse(courseData);
            setEnrollment(enrollData.find(e => e.course_id === parseInt(courseId)));
            setLessonProgress(progressData);

            if (courseData.modules?.length > 0 && courseData.modules[0].lessons?.length > 0) {
                setActiveLesson(courseData.modules[0].lessons[0]);
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleEnroll = async () => {
        try {
            await api.post('/enrollments', { course_id: parseInt(courseId) });
            loadData();
        } catch (err) { alert(err.message); }
    };

    const isLessonCompleted = (lessonId) => {
        return lessonProgress.some(p => p.lesson_id === lessonId && p.status === 'completed');
    };

    const handleSelectLesson = async (lesson) => {
        setActiveLesson(lesson);
        setQuiz(null);
        setQuizResult(null);
        setQuizAnswers({});
    };

    const markComplete = async (lessonId) => {
        try {
            await api.post(`/enrollments/lessons/${lessonId}/progress`, { status: 'completed', time_spent_secs: 300 });
            // Check and award badges after completion
            try { await api.post('/badges/check'); } catch (e) { }
            loadData();
        } catch (err) { console.error(err); }
    };

    const submitQuiz = async () => {
        if (!quiz) return;
        try {
            const result = await api.post(`/quizzes/${quiz.id}/submit`, { answers: quizAnswers });
            setQuizResult(result);
            // Check for badges after quiz
            try { await api.post('/badges/check'); } catch (e) { }
            loadData();
        } catch (err) { alert(err.message); }
    };

    if (loading) return <div className="loading-page"><div className="spinner"></div></div>;
    if (!course) return <div className="loading-page"><p>Course not found</p></div>;

    const isAdmin = user && ['admin', 'hr_admin'].includes(user.role);
    const allLessons = course.modules?.flatMap(m => m.lessons || []) || [];
    const currentIndex = activeLesson ? allLessons.findIndex(l => l.id === activeLesson.id) : -1;
    const nextLesson = currentIndex >= 0 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;
    const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
    const videoId = activeLesson ? getYouTubeId(activeLesson.content_url) : null;

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
                <Header />
                {/* Top bar */}
                <div style={{
                    padding: '12px 24px',
                    background: 'var(--vearc-surface-soft)',
                    borderBottom: '1px solid var(--vearc-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => router.push('/courses')}>← Back</button>
                    <h2 style={{ fontSize: 16, fontWeight: 700, flex: 1 }}>{course.title}</h2>
                    {enrollment && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div className="progress-bar" style={{ width: 120 }}>
                                <div className="progress-fill" style={{ width: `${enrollment.progress_pct}%` }}></div>
                            </div>
                            <span style={{ fontSize: 13, color: 'var(--vearc-text-secondary)' }}>{Math.round(enrollment.progress_pct)}%</span>
                        </div>
                    )}
                    {!enrollment && !isAdmin && <button className="btn vearc-btn-primary btn-sm" onClick={handleEnroll}>Enroll Now</button>}
                </div>

                <div className="player-layout" style={{ flex: 1 }}>
                    {/* Sidebar lessons */}
                    <div className="player-sidebar">
                        {course.modules?.map((mod) => (
                            <div key={mod.id}>
                                <div style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--vearc-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{mod.title}</div>
                                {mod.lessons?.map((lesson) => (
                                    <button
                                        key={lesson.id}
                                        className={`lesson-item ${activeLesson?.id === lesson.id ? 'active' : ''}`}
                                        onClick={() => handleSelectLesson(lesson)}
                                    >
                                        <span className={`check ${isLessonCompleted(lesson.id) ? 'done' : ''}`}>
                                            {isLessonCompleted(lesson.id) ? '✓' : lesson.type === 'quiz' ? <ClipboardIcon width="14" height="14" /> : lesson.type === 'video' ? < BotIcon width="14" height="14" /> : <TargetIcon width="14" height="14" />}
                                        </span>
                                        <span style={{ flex: 1 }}>{lesson.title}</span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--vearc-text-muted)' }}>{lesson.duration_mins ? (lesson.duration_mins < 60 ? `${lesson.duration_mins}m` : (lesson.duration_mins / 60).toFixed(1).replace('.0', '') + 'h') : ''}</span>
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* Content area */}
                    <div className="player-content">
                        {activeLesson ? (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                    <span className={`badge badge-${activeLesson.type === 'video' ? 'accent' : activeLesson.type === 'quiz' ? 'warning' : 'info'}`}>
                                        {activeLesson.type}
                                    </span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--vearc-text-muted)' }}>⏱ {activeLesson.duration_mins ? (activeLesson.duration_mins < 60 ? `${activeLesson.duration_mins}m` : (activeLesson.duration_mins / 60).toFixed(1).replace('.0', '') + 'h') : ''}</span>
                                </div>
                                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 24 }}>{activeLesson.title}</h1>

                                {activeLesson.type === 'quiz' ? (
                                    <div className="quiz-container">
                                        {!quiz ? (
                                            <div style={{ textAlign: 'center', padding: 40 }}>
                                                <div style={{ color: 'var(--vearc-primary)', marginBottom: 16, display: 'flex', justifyContent: 'center' }}><ClipboardIcon width="48" height="48" /></div>
                                                <h3 style={{ fontSize: '1.2rem', marginBottom: 8 }}>Ready for the quiz?</h3>
                                                <p style={{ color: 'var(--vearc-text-secondary)', marginBottom: 24 }}>Test your knowledge from this section</p>
                                                <button className="btn vearc-btn-primary" onClick={async () => {
                                                    try {
                                                        for (let qid = 1; qid <= 30; qid++) {
                                                            try {
                                                                const q = await api.get(`/quizzes/${qid}`);
                                                                if (q.lesson_id === activeLesson.id) {
                                                                    setQuiz(q);
                                                                    break;
                                                                }
                                                            } catch (e) { continue; }
                                                        }
                                                    } catch (err) { alert('Could not load quiz'); }
                                                }}>Start Quiz</button>
                                            </div>
                                        ) : quizResult ? (
                                            <div className={`quiz-result ${quizResult.passed ? 'passed' : 'failed'}`}>
                                                <div style={{ color: quizResult.passed ? 'var(--vearc-success)' : 'var(--vearc-danger)', marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
                                                    {quizResult.passed ? <TrophyIcon width="64" height="64" /> : <TargetIcon width="64" height="64" />}
                                                </div>
                                                <h3 style={{ fontSize: '1.3rem', marginBottom: 8 }}>
                                                    {quizResult.passed ? 'Congratulations!' : 'Not quite!'}
                                                </h3>
                                                <div style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 8 }}>
                                                    {Math.round(quizResult.score)}%
                                                </div>
                                                <p style={{ color: 'var(--vearc-text-secondary)', marginBottom: 24 }}>
                                                    {quizResult.passed ? 'You passed!' : `Need ${quiz.pass_threshold}% to pass.`}
                                                </p>
                                                {!quizResult.passed && (
                                                    <button className="btn vearc-btn-primary" onClick={() => { setQuizResult(null); setQuizAnswers({}); }}>Retry</button>
                                                )}
                                                {quizResult.passed && nextLesson && (
                                                    <button className="btn vearc-btn-primary" onClick={() => handleSelectLesson(nextLesson)}>Next →</button>
                                                )}
                                            </div>
                                        ) : (
                                            <div>
                                                {quiz.questions?.map((q, qi) => (
                                                    <div key={q.id} className="quiz-question">
                                                        <h3>Q{qi + 1}. {q.question_text}</h3>
                                                        <div>
                                                            {q.options?.map((opt, oi) => (
                                                                <div
                                                                    key={oi}
                                                                    className={`quiz-option ${quizAnswers[q.id] === opt ? 'selected' : ''}`}
                                                                    onClick={() => setQuizAnswers({ ...quizAnswers, [q.id]: opt })}
                                                                >
                                                                    <span style={{ fontWeight: 700, color: 'var(--vearc-primary)' }}>{String.fromCharCode(65 + oi)}.</span>
                                                                    {opt}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                                <button
                                                    className="btn vearc-btn-primary"
                                                    style={{ width: '100%' }}
                                                    onClick={submitQuiz}
                                                    disabled={Object.keys(quizAnswers).length < (quiz.questions?.length || 0)}
                                                >
                                                    Submit ({Object.keys(quizAnswers).length}/{quiz.questions?.length || 0})
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div>
                                        {/* YouTube Video Embed */}
                                        {videoId ? (
                                            <div className="video-container">
                                                <iframe
                                                    src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                                                    title={activeLesson.title}
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                />
                                            </div>
                                        ) : activeLesson.type === 'video' && activeLesson.content_url && (
                                            <div className="video-container">
                                                <video
                                                    src={activeLesson.content_url}
                                                    controls
                                                    style={{ width: '100%', borderRadius: 'var(--vearc-radius-md)' }}
                                                />
                                            </div>
                                        )}

                                        {/* Link for external viewing (if applicable) */}
                                        {activeLesson.content_url && !activeLesson.content_url.startsWith('/uploads/') && !activeLesson.content_url.startsWith('/api/uploads/') && (
                                            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--vearc-text-muted)' }}><BotIcon width="14" height="14" style={{ display: 'inline' }} /> View</span>
                                                <a href={activeLesson.content_url} target="_blank" rel="noopener noreferrer"
                                                    style={{ color: 'var(--vearc-primary)', fontSize: '0.85rem', fontWeight: 600 }}>
                                                    {videoId ? 'on YouTube ↗' : 'External Link ↗'}
                                                </a>
                                            </div>
                                        )}

                                        {/* Article content */}
                                        <div
                                            className="article-content"
                                            dangerouslySetInnerHTML={{ __html: activeLesson.content || '<p>No content available.</p>' }}
                                        />

                                        <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                                {prevLesson && (
                                                    <button className="btn btn-secondary" onClick={() => handleSelectLesson(prevLesson)}>
                                                        ← Prev: {prevLesson.title}
                                                    </button>
                                                )}
                                                {enrollment && !isLessonCompleted(activeLesson.id) && (
                                                    <button className="btn vearc-btn-primary" onClick={() => markComplete(activeLesson.id)}>
                                                        ✓ Mark as Complete
                                                    </button>
                                                )}
                                                {isLessonCompleted(activeLesson.id) && (
                                                    <span className="badge badge-success" style={{ padding: '8px 16px' }}>✅ Completed</span>
                                                )}
                                            </div>
                                            {nextLesson && (
                                                <button className="btn btn-secondary" onClick={() => handleSelectLesson(nextLesson)}>
                                                    Next: {nextLesson.title} →
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <div className="icon" style={{ color: 'var(--vearc-primary)', marginBottom: '16px' }}><MapIcon width="48" height="48" /></div>
                                <p>Select a lesson from the sidebar to start learning</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
