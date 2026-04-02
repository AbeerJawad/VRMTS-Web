import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Target, Clock, TrendingUp, ChevronRight, ChevronDown, RotateCcw, Home, BarChart3, CheckCircle2, XCircle, AlertCircle, BookOpen, Share2, Download, Loader2 } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';

const API_BASE_URL = 'http://localhost:8080/api';

interface ResultsData {
  score: number;
  passingScore: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedQuestions: number;
  timeSpent: string;
  timeTaken: number;
  attemptDate: string;
  quizTitle: string;
  module: string;
  passed: boolean;
  questionBreakdown: Array<{ type: string; correct: number; total: number }>;
  detailedQuestions: Array<{
    id: number;
    question: string;
    yourAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    type: string;
    explanation?: string;
    relatedTopics?: string[];
  }>;
  previousAttempts: Array<{ date: string; score: number; isCurrent?: boolean }>;
  classAverage: number;
  topScore: number;
  rank: number;
  totalStudents: number;
  weakAreas: Array<{ topic: string; accuracy: number }>;
  strongAreas: Array<{ topic: string; accuracy: number }>;
  recommendations: string[];
  badges: Array<{ icon?: string; name: string; earned?: boolean }>;
}

export default function QuizResults() {
  const navigate = useNavigate();
  const { attemptId } = useParams<{ attemptId: string }>();
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resultsData, setResultsData] = useState<ResultsData | null>(null);

  // Fetch quiz results
  useEffect(() => {
    const fetchResults = async () => {
      if (!attemptId) {
        setError('No attempt ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // First, get the attempt details (which includes all the results after finishing)
        const response = await fetch(`${API_BASE_URL}/quiz/attempt/${attemptId}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch quiz results');
        }

        const data = await response.json();
        if (data.success && data.data) {
          const attempt = data.data;

          // If quiz is completed, use results data, otherwise use attempt data
          const results = attempt.results || attempt;

          // Compute time spent from start/end if not in results (fallback)
          let timeSpent = results.timeSpent;
          if (!timeSpent && attempt.startTime && attempt.endTime) {
            const ms = new Date(attempt.endTime).getTime() - new Date(attempt.startTime).getTime();
            const mins = Math.floor(ms / 60000);
            const secs = Math.floor((ms % 60000) / 1000);
            timeSpent = mins >= 60
              ? `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
              : `${mins}:${String(secs).padStart(2, '0')}`;
          }

          // Format the data to match the expected structure
          const formattedData = {
            score: results.score || attempt.score || 0,
            passingScore: results.passingScore || attempt.passingScore || 60,
            totalQuestions: results.totalQuestions || attempt.totalQuestions || 0,
            correctAnswers: results.correctAnswers || 0,
            incorrectAnswers: results.incorrectAnswers || 0,
            skippedQuestions: results.skippedQuestions || 0,
            timeSpent: timeSpent || '0:00',
            timeTaken: results.timeTaken || 0,
            attemptDate: results.attemptDate || (attempt.endTime
              ? new Date(attempt.endTime).toLocaleString()
              : new Date().toLocaleString()),
            quizTitle: results.quizTitle || attempt.moduleTitle || attempt.title || 'Quiz',
            module: results.module || attempt.moduleTitle || attempt.module || 'Module',
            passed: results.passed !== undefined
              ? results.passed
              : (results.score || attempt.score || 0) >= (results.passingScore || attempt.passingScore || 60),
            questionBreakdown: results.questionBreakdown || [],
            detailedQuestions: (results.detailedQuestions || attempt.questions || []).map((q: Record<string, unknown>, idx: number) => ({
              id: (q.id ?? q.questionId ?? idx) as number,
              question: (q.question ?? q.questionText ?? 'Question') as string,
              yourAnswer: (q.yourAnswer ?? q.studentAnswer ?? 'Not answered') as string,
              correctAnswer: (q.correctAnswer ?? 'N/A') as string,
              isCorrect: q.isCorrect === true || q.isCorrect === 1,
              type: (q.type ?? 'MCQ') as string,
              explanation: (q.explanation as string) ?? undefined,
              relatedTopics: q.relatedTopics as string[] | undefined,
            })),
            previousAttempts: [], // Can be fetched separately if needed
            averageScore: results.score || attempt.score || 0,
            classAverage: 0, // Not available from current API
            topScore: 0, // Not available from current API
            rank: 0, // Not available from current API
            totalStudents: 0, // Not available from current API
            weakAreas: [],
            strongAreas: [],
            recommendations: [],
            badges: []
          };

          setResultsData(formattedData);
        } else {
          throw new Error(data.message || 'Failed to load quiz results');
        }
      } catch (err) {
        console.error('Error fetching quiz results:', err);
        setError(err instanceof Error ? err.message : 'Failed to load quiz results');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [attemptId]);

  const toggleQuestion = (questionId: number) => {
    setExpandedQuestion(expandedQuestion === questionId ? null : questionId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-sm text-neutral-500 font-medium tracking-tight">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error || !resultsData) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <div className="text-center px-6 max-w-md">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-6" />
          <h2 className="text-xl font-bold mb-2 text-white tracking-tight">Access Error</h2>
          <p className="text-neutral-500 text-sm mb-8">{error || 'Quiz results not available'}</p>
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

  const headerRight = (
    <div className="flex items-center gap-3">
      <button className="h-9 px-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-md text-[10px] font-bold text-neutral-400 hover:text-white uppercase tracking-widest transition-all flex items-center gap-2">
        <Share2 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Share report</span>
      </button>
      <button className="h-9 px-4 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2">
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Export pdf</span>
      </button>
    </div>
  );

  return (
    <PageLayout
      title="Quiz results"
      subtitle={resultsData?.quizTitle}
      breadcrumbLabel="Quiz"
      activeNav="quiz"
      userType="student"
      headerRight={headerRight}
    >
      <div className="space-y-6 animate-in fade-in duration-700">
        {/* Top Section: Score & Stats + Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Score & Stats Card */}
          <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-lg p-8 relative overflow-hidden group">
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
              {/* Circular Score Gauge */}
              <div className="relative w-44 h-44 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                  <circle
                    cx="50" cy="50" r="46"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-neutral-950"
                  />
                  <circle
                    cx="50" cy="50" r="46"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeDasharray={`${289 * (resultsData.score / 100)} 289`}
                    strokeLinecap="round"
                    className={`transition-all duration-1000 ease-out ${resultsData.passed ? 'text-emerald-500' : 'text-rose-500'}`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-transparent">
                  <span className="text-4xl font-bold tracking-tight text-white">{resultsData.score}%</span>
                  <span className="text-[9px] uppercase tracking-widest text-neutral-600 font-bold mt-1">Score</span>
                </div>
              </div>

              {/* Performance Summary */}
              <div className="flex-1 text-center md:text-left">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded mb-4 text-[9px] font-bold uppercase tracking-widest ${resultsData.passed
                  ? 'bg-neutral-950 text-emerald-500 border border-emerald-500/20'
                  : 'bg-neutral-950 text-rose-500 border border-rose-500/20'
                  }`}>
                  {resultsData.passed ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {resultsData.passed ? 'Outcome: Academic Pass' : 'Outcome: Needs Review'}
                </div>

                <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">
                  {resultsData.passed ? 'Quiz passed successfully' : 'Quiz failed'}
                </h2>
                <p className="text-neutral-500 text-sm font-medium leading-relaxed mb-8 max-w-md">
                  {resultsData.passed
                    ? `You have successfully passed the ${resultsData.quizTitle} quiz. Great job!`
                    : `You did not reach the passing score of ${resultsData.passingScore}%. Please review the material and try again.`}
                </p>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <div className="text-lg font-bold text-white tracking-tight">{resultsData.correctAnswers}</div>
                    <div className="text-[9px] uppercase tracking-widest text-neutral-600 font-bold">Correct</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white tracking-tight">{resultsData.incorrectAnswers}</div>
                    <div className="text-[9px] uppercase tracking-widest text-neutral-600 font-bold">Incorrect</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white tracking-tight">{resultsData.timeSpent}</div>
                    <div className="text-[9px] uppercase tracking-widest text-neutral-600 font-bold">Duration</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 flex flex-col">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-8 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Performance Analysis
            </h3>

            <div className="space-y-8 flex-1">
              {/* Your Performance vs Target */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-neutral-500">Your Score</span>
                  <span className="text-white">{resultsData.score}%</span>
                </div>
                <div className="h-1 bg-neutral-950 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-1000 ${resultsData.passed ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]' : 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.3)]'}`} style={{ width: `${resultsData.score}%` }} />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-neutral-500">Passing Score</span>
                  <span className="text-neutral-700">{resultsData.passingScore}%</span>
                </div>
                <div className="h-1 bg-neutral-950 rounded-full overflow-hidden">
                  <div className="h-full bg-neutral-800 rounded-full" style={{ width: `${resultsData.passingScore}%` }} />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-auto pt-8 grid grid-cols-2 gap-3">
                <button
                  onClick={() => navigate('/quizselection')}
                  className="flex items-center justify-center gap-2 py-3 bg-neutral-950 hover:bg-neutral-800 text-neutral-400 border border-neutral-800 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Retake
                </button>
                <button
                  onClick={() => navigate('/studentdashboard')}
                  className="flex items-center justify-center gap-2 py-3 bg-neutral-950 hover:bg-neutral-800 text-emerald-500 border border-neutral-800 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(16,185,129,0.05)]"
                >
                  <Home className="w-3.5 h-3.5" /> Close
                </button>
              </div>
            </div>
          </div>
        </div>


        {/* Detailed Question Review */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Question Review</h3>
              <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest">Detailed results</p>
            </div>
            <div className="flex items-center gap-2 p-1.5 bg-neutral-950 border border-neutral-800 rounded-lg">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 border border-emerald-500/20 rounded-md">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-500">{resultsData.correctAnswers} Correct</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 border border-rose-500/20 rounded-md">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-rose-500">{resultsData.incorrectAnswers} Incorrect</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {resultsData.detailedQuestions.map((q, idx) => (
              <div key={q.id ?? idx} className="group">
                <div className="p-0.5 rounded-lg transition-all">
                  <button
                    onClick={() => toggleQuestion(q.id ?? idx)}
                    className={`w-full text-left p-6 rounded-md border transition-all flex items-center gap-8 ${q.isCorrect
                      ? 'border-neutral-800 bg-neutral-950 hover:bg-neutral-900'
                      : 'border-rose-500/10 bg-neutral-950 hover:bg-neutral-900'
                      }`}
                  >
                    <div className={`w-10 h-10 rounded flex items-center justify-center flex-shrink-0 border transition-all ${q.isCorrect ? 'border-emerald-500/20 text-emerald-500 bg-neutral-900' : 'border-rose-500/20 text-rose-500 bg-neutral-900'}`}>
                      {q.isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-600">ID: {String(idx + 1).padStart(2, '0')}</span>
                        <span className="px-2 py-0.5 bg-neutral-900 text-[9px] font-bold text-neutral-500 rounded border border-neutral-800 uppercase tracking-tighter">{q.type}</span>
                      </div>
                      <p className="text-sm font-bold text-neutral-200 leading-snug tracking-tight">{q.question}</p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className={`w-8 h-8 rounded flex items-center justify-center bg-neutral-900 border border-neutral-800 transition-transform duration-300 ${expandedQuestion === (q.id ?? idx) ? 'rotate-180' : ''}`}>
                        <ChevronDown className="w-4 h-4 text-neutral-600" />
                      </div>
                    </div>
                  </button>

                  {expandedQuestion === (q.id ?? idx) && (
                    <div className="px-10 py-10 bg-neutral-900/50 rounded-b-md border-x border-b border-neutral-800 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-8">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 block mb-4">Your Answer</span>
                            <div className="space-y-4">
                              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-md">
                                <div className="text-[9px] font-bold uppercase tracking-widest text-neutral-700 mb-2">Your response</div>
                                <div className={`font-bold text-sm ${q.isCorrect ? 'text-emerald-500' : 'text-rose-500'}`}>{q.yourAnswer}</div>
                              </div>
                              {!q.isCorrect && (
                                <div className="p-4 bg-neutral-950 border border-emerald-500/20 rounded-md">
                                  <div className="text-[9px] font-bold uppercase tracking-widest text-emerald-700 mb-2">Correct Answer</div>
                                  <div className="font-bold text-sm text-emerald-500">{q.correctAnswer}</div>
                                </div>
                              )}
                            </div>
                          </div>

                          {q.relatedTopics && q.relatedTopics.length > 0 && (
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 block mb-4">Topics</span>
                              <div className="flex flex-wrap gap-2">
                                {q.relatedTopics.map((topic, tIdx) => (
                                  <span key={tIdx} className="px-3 py-1.5 bg-neutral-950 text-neutral-400 rounded-md text-[9px] font-bold uppercase tracking-widest border border-neutral-800">
                                    {topic}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="relative">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 block mb-4">Explanation</span>
                          <div className="bg-neutral-950 p-6 rounded-lg border border-neutral-800 min-h-[140px] shadow-inner">
                            <p className="text-sm text-neutral-400 leading-relaxed font-medium">
                              {q.explanation || 'Detailed explanation for this question is currently unavailable.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}