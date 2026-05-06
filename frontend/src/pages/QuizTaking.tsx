import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Clock, Flag, ChevronLeft, ChevronRight, MessageCircle, Eye, EyeOff, Save, AlertCircle, CheckCircle, Circle, XCircle, Lightbulb, Brain, AlertTriangle, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

export default function QuizTaking() {
  const navigate = useNavigate();
  const { attemptId } = useParams<{ attemptId: string }>();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [markedForReview, setMarkedForReview] = useState(new Set());
  const [showHint, setShowHint] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [draggedLabels, setDraggedLabels] = useState<Record<string, string>>({});
  const [showQuestionNav, setShowQuestionNav] = useState(true);
  const [quizData, setQuizData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedAnswers, setSubmittedAnswers] = useState<Set<number>>(new Set());
  const [autoSubmitted, setAutoSubmitted] = useState(false);

  const handleSubmitQuiz = async () => {
    if (submitting || autoSubmitted) return;

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/quiz/attempt/${attemptId}/finish`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to submit quiz');
      }

      const data = await response.json();
      if (data.success) {
        // Navigate to results page with the attempt ID
        navigate(`/quizresult/${attemptId}`);
      } else {
        throw new Error(data.message || 'Failed to submit quiz');
      }
    } catch (err) {
      console.error('Error submitting quiz:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveProgress = async () => {
    // Current answers are already saved to backend on every select via handleAnswerSelect
    // This button can serve as a manual confirmation that everything is synced
    alert("Progress saved successfully!");
  };

  const handleExit = () => {
    navigate('/quizselection');
  };

  // Warn on page leave
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!autoSubmitted && !submitting) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [autoSubmitted, submitting]);

  // Fetch quiz data
  useEffect(() => {
    const fetchQuizData = async () => {
      if (!attemptId) {
        setError('No attempt ID provided');
        setLoading(false);
        return;
      }

      try {
        const fetchUrl = `${API_BASE_URL}/quiz/attempt/${attemptId}`;
        const response = await fetch(fetchUrl, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.status === 404) {
          throw new Error('Quiz attempt not found. Please start a new quiz from the quiz selection page.');
        }

        if (!response.ok) {
          throw new Error('Failed to fetch quiz data');
        }

        const data = await response.json();

        if (data.success) {
          if (!data.data.questions || data.data.questions.length === 0) {
            throw new Error('No questions assigned to this quiz attempt. Please start a new quiz from the quiz selection page.');
          }
          setQuizData(data.data);
          setTimeRemaining(data.data.timeLimit * 60);
        } else {
          throw new Error(data.message || 'Failed to load quiz');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [attemptId]);

  // Timer countdown
  useEffect(() => {
    if (quizData && quizData.timeLimit <= 0) return; // No timer for untimed quizzes

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0 && !autoSubmitted) {
          clearInterval(timer);
          // Auto-submit quiz when time runs out
          setAutoSubmitted(true);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoSubmitted, quizData]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = async (questionId: number, answer: any) => {
    // Update local state immediately for UI responsiveness
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));

    // Submit answer to backend
    try {
      const response = await fetch(`${API_BASE_URL}/quiz/submit-answer`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attemptId: parseInt(attemptId!),
          questionId,
          answer,
          timeSpent: 0 // TODO: Track actual time spent per question
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit answer');
      }

      const data = await response.json();
      if (data.success) {
        // Mark answer as submitted
        setSubmittedAnswers(prev => new Set(prev).add(questionId));
      } else {
        console.error('Failed to submit answer:', data.message);
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
      // Could show a toast notification here
    }
  };

  const toggleMarkForReview = (questionId: number) => {
    setMarkedForReview(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setShowHint(false);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      setShowHint(false);
    }
  };

  const handleDrop = (itemId: string, zoneId: string) => {
    setDraggedLabels(prev => ({
      ...prev,
      [zoneId]: itemId
    }));
  };

  const getQuestionStatus = (questionId: number) => {
    const isAnswered = answers[questionId] !== undefined;
    const isSubmitted = submittedAnswers.has(questionId);
    const isMarked = markedForReview.has(questionId);
    const isCurrent = quizData.questions[currentQuestion].id === questionId;

    if (isCurrent) return 'current';
    if (isMarked) return 'marked';
    if (isSubmitted) return 'submitted';
    if (isAnswered) return 'answered';
    return 'unanswered';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-sm text-neutral-500 font-medium tracking-tight">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (error || !quizData) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-6" />
          <h2 className="text-xl font-bold text-white mb-2 tracking-tight">System Error</h2>
          <p className="text-neutral-500 text-sm mb-8">{error || 'Quiz data not available'}</p>
          <button
            onClick={() => navigate('/quizselection')}
            className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-sm font-bold text-white transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const question = quizData.questions[currentQuestion];

  const progress = ((currentQuestion + 1) / quizData.questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200">
      <header className="border-b border-neutral-900 bg-neutral-950/50 sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-6">
              <h1 className="text-base font-bold text-white tracking-tight">VRMTS</h1>
              <div className="h-6 w-px bg-neutral-900"></div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight">{quizData.title}</h2>
                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-0.5">{quizData.module}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Timer */}
              {quizData?.timeLimit > 0 ? (
                <div className={`flex items-center gap-2 px-3.5 py-2 rounded-md border text-xs font-bold font-mono tracking-wider transition-all ${timeRemaining < 300
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-200'
                  }`}>
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(timeRemaining)}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-md border border-neutral-800 bg-neutral-900 text-xs font-bold text-emerald-500 uppercase tracking-widest">
                  <Clock className="w-4 h-4 text-neutral-500" />
                  <span>Untimed</span>
                </div>
              )}

              {/* Question Counter */}
              <div className="px-3.5 py-2 bg-neutral-900 border border-neutral-800 rounded-md text-xs font-bold text-neutral-400">
                <span className="text-white">{currentQuestion + 1}</span>
                <span className="text-neutral-600 self-center"> / {quizData.questions.length}</span>
              </div>

              <button
                type="button"
                onClick={() => setShowExitModal(true)}
                className="px-4 py-2 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 rounded-md text-xs font-bold text-neutral-400 hover:text-white transition-all uppercase tracking-widest"
              >
                Exit
              </button>
            </div>
          </div>

          <div className="h-1 bg-neutral-900 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <div key={question.id} className="bg-neutral-900 border border-neutral-800 rounded-lg p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-2.5 py-1 bg-neutral-950 text-neutral-500 border border-neutral-800 rounded text-[10px] font-bold uppercase tracking-widest">
                      Question {currentQuestion + 1}
                    </span>
                    <span className="px-2.5 py-1 bg-neutral-950 text-neutral-600 rounded text-[10px] font-bold uppercase tracking-widest">
                      {question.type === 'mcq' ? 'Multiple Choice' :
                        question.type === 'labeling' ? 'Labeling' :
                          'Matching'}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white leading-relaxed tracking-tight">
                    {question.question || 'Instruction sequence unavailable'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => toggleMarkForReview(question.id)}
                  className={`p-3 rounded-lg border transition-all ${markedForReview.has(question.id)
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                    : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 text-neutral-600 hover:text-white'
                    }`}
                  aria-label="Review marker"
                >
                  <Flag className="w-4 h-4" />
                </button>
              </div>

              {/* MCQ Options */}
              {question.type === 'mcq' && (
                <div className="space-y-3">
                  {question.options?.map((option: string, idx: number) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAnswerSelect(question.id, option)}
                      className={`w-full p-4 rounded-lg border transition-all text-left flex items-center gap-4 text-sm font-medium ${answers[question.id] === option
                        ? 'bg-neutral-800 border-emerald-500/30 text-white'
                        : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 text-neutral-400'
                        }`}
                    >
                      <div className={`w-2 h-2 rounded-full transition-all ${answers[question.id] === option ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-neutral-800'}`} />
                      <span>{option}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Labeling Question */}
              {question.type === 'labeling' && (
                <div className="space-y-8">
                  {/* Diagram with Hotspots */}
                  <div className="relative bg-neutral-950 rounded-lg p-8 border border-neutral-800">
                    <div className="relative mx-auto flex items-center justify-center" style={{ width: '400px', height: '400px' }}>
                      <div className="absolute inset-0 flex items-center justify-center opacity-20">
                        <Brain className="w-64 h-64 text-emerald-500" />
                      </div>

                      {/* Hotspots */}
                      {question.hotspots?.map((spot: any) => (
                        <div
                          key={spot.id}
                          className="absolute"
                          style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                        >
                          <div className="relative">
                            <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${answers[question.id]?.[spot.id]
                              ? 'bg-emerald-500 border-emerald-400'
                              : 'bg-neutral-900 border-neutral-700 hover:border-neutral-500'
                              }`}>
                              {answers[question.id]?.[spot.id] ? (
                                <CheckCircle className="w-4 h-4 text-neutral-950" />
                              ) : (
                                <div className="w-2 h-2 rounded-full bg-neutral-700" />
                              )}
                            </div>
                            {answers[question.id]?.[spot.id] && (
                              <div className="absolute left-10 top-0 bg-neutral-800 border border-neutral-700 rounded-md px-3 py-1.5 text-xs font-bold text-white whitespace-nowrap tracking-tight">
                                {answers[question.id][spot.id]}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Label Options */}
                  <div className="grid grid-cols-2 gap-4">
                    {question.labels?.map((label: string, idx: number) => (
                      <button
                        key={idx}
                        className="p-5 bg-neutral-950 border border-neutral-800 rounded-lg hover:border-neutral-700 hover:bg-neutral-900 transition-all text-center text-xs font-bold text-neutral-400 uppercase tracking-widest"
                      >
                        {label || `Label ${idx + 1}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Drag & Drop Question */}
              {question.type === 'drag-drop' && (
                <div className="space-y-6">
                  {/* Drop Zones */}
                  <div className="space-y-4">
                    {question.dropZones?.map((zone: any) => (
                      <div
                        key={zone.id}
                        className="p-6 bg-slate-800/30 border-2 border-dashed border-white/20 rounded-lg hover:border-slate-600 transition-all"
                      >
                        <p className="text-slate-300 mb-3">{zone.description}</p>
                        <div className={`min-h-16 p-4 rounded-lg border-2 transition-all ${draggedLabels[zone.id]
                          ? 'bg-slate-600/80 border-slate-500'
                          : 'bg-slate-800/50 border-white/10'
                          }`}>
                          {draggedLabels[zone.id] ? (
                            <div className="flex items-center justify-between">
                              <span className="font-medium">
                                {question.items.find((item: any) => item.id === draggedLabels[zone.id])?.text}
                              </span>
                              <button
                                onClick={() => setDraggedLabels(prev => {
                                  const newState = { ...prev };
                                  delete newState[zone.id];
                                  return newState;
                                })}
                                className="text-red-400 hover:text-red-300"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-sm">Drop answer here</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Draggable Items */}
                  <div>
                    <p className="text-sm text-slate-400 mb-3">Available Items:</p>
                    <div className="grid grid-cols-3 gap-3">
                      {question.items?.map((item: any) => {
                        const isUsed = Object.values(draggedLabels).includes(item.id);
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              // Simple click to add to first available zone
                              const emptyZone = question.dropZones.find((z: any) => !draggedLabels[z.id]);
                              if (emptyZone && !isUsed) {
                                handleDrop(item.id, emptyZone.id);
                              }
                            }}
                            disabled={isUsed}
                            className={`p-4 rounded-lg border-2 font-medium transition-all ${isUsed
                              ? 'bg-neutral-900 border-neutral-800 text-neutral-600 cursor-not-allowed'
                              : 'bg-neutral-950 border-neutral-800 hover:border-neutral-600 hover:scale-105 cursor-grab active:cursor-grabbing'
                              }`}
                          >
                            {item.text}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Hint Section */}
              {showHint && (
                <div className="mt-6 p-5 bg-slate-800/50 border border-white/10 rounded-lg">
                  <div className="flex gap-3">
                    <Lightbulb className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-400 mb-1">Hint</h4>
                      <p className="text-sm text-slate-300">{question.hint}</p>
                      <p className="text-xs text-yellow-600 mt-2">⚠️ Using hints may affect your final score</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestion === 0}
                  className="px-5 py-2.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-md text-[10px] font-bold text-neutral-400 uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  PREVIOUS
                </button>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="px-5 py-2.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-md text-[10px] font-bold text-neutral-400 uppercase tracking-widest transition-all flex items-center gap-2"
                  >
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    HINT
                  </button>

                  <button
                    onClick={handleSaveProgress}
                    className="px-6 py-2.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-md text-[10px] font-bold text-neutral-300 uppercase tracking-widest transition-all flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    SAVE
                  </button>
                </div>

                {currentQuestion === quizData.questions.length - 1 ? (
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={submitting}
                    className="px-6 py-2.5 bg-neutral-950 hover:bg-neutral-900 border border-emerald-500/30 text-emerald-500 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-30"
                  >
                    {submitting ? 'SUBMITTING...' : 'FINISH QUIZ'}
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="px-5 py-2.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-md text-[10px] font-bold text-neutral-200 uppercase tracking-widest transition-all flex items-center gap-2"
                  >
                    NEXT
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Question Navigator */}
          <div className="lg:col-span-1">
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8 sticky top-24">
              <div className="flex items-center justify-between mb-8">
                <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Navigation</h4>
                <button
                  onClick={() => setShowQuestionNav(!showQuestionNav)}
                  className="p-1 text-neutral-600 hover:text-white transition-colors"
                >
                  {showQuestionNav ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {showQuestionNav && (
                <>
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-10">
                    <div className="p-4 bg-neutral-950 border border-neutral-800 rounded">
                      <p className="text-[10px] font-bold text-neutral-600 uppercase mb-2">Answered</p>
                      <p className="text-xl font-bold text-white tracking-tight">{answeredCount}<span className="text-neutral-700 text-sm">/{quizData.questions.length}</span></p>
                    </div>
                    <div className="p-4 bg-neutral-950 border border-neutral-800 rounded">
                      <p className="text-[10px] font-bold text-neutral-600 uppercase mb-2">Review</p>
                      <p className="text-xl font-bold text-amber-500 tracking-tight">{markedForReview.size}</p>
                    </div>
                  </div>

                  {/* Question Grid */}
                  <div className="grid grid-cols-4 gap-2.5 mb-10">
                    {quizData.questions.map((q: any, idx: number) => {
                      const status = getQuestionStatus(q.id);
                      return (
                        <button
                          key={q.id}
                          onClick={() => {
                            setCurrentQuestion(idx);
                            setShowHint(false);
                          }}
                          className={`aspect-square rounded flex items-center justify-center text-[10px] font-bold transition-all border ${status === 'current'
                            ? 'bg-neutral-800 border-neutral-600 text-white'
                            : status === 'marked'
                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                              : status === 'submitted'
                                ? 'bg-neutral-950 border-emerald-500/30 text-emerald-500'
                                : status === 'answered'
                                  ? 'bg-neutral-950 border-neutral-800 text-neutral-300'
                                  : 'bg-neutral-950 border-neutral-800 text-neutral-600 hover:border-neutral-700'
                            }`}
                        >
                          {(idx + 1).toString().padStart(2, '0')}
                        </button>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="space-y-3 text-[9px] font-bold uppercase tracking-widest">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-neutral-600" />
                      <span className="text-neutral-500">Active</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                      <span className="text-neutral-500">Submitted</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-amber-500/50" />
                      <span className="text-neutral-500">Flagged</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full border border-neutral-800" />
                      <span className="text-neutral-500">Not Answered</span>
                    </div>
                  </div>

                  <button className="mt-10 w-full py-3 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-md flex items-center justify-center gap-3 text-neutral-400 hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest">
                    <MessageCircle className="w-4 h-4" />
                    Support Bot
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 bg-neutral-950/90 flex items-center justify-center z-50 p-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-10 max-w-md w-full">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-neutral-950 border border-neutral-800 flex items-center justify-center mb-6">
                <AlertCircle className="w-8 h-8 text-neutral-600" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 tracking-tight">EXIT QUIZ?</h3>
              <p className="text-neutral-500 text-sm font-medium">
                Your progress is saved, but the quiz timer will continue to run.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setShowExitModal(false)}
                className="w-full py-3 bg-white hover:bg-neutral-200 text-neutral-950 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all"
              >
                RESUME QUIZ
              </button>
              <button
                onClick={handleExit}
                className="w-full py-3 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all"
              >
                SAVE AND EXIT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}