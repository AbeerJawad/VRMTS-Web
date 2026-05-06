import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Clock, Zap, Target, ChevronRight, ChevronLeft, Trophy, TrendingUp, Calendar, Filter, Search, Play, BarChart3, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';
import { API_BASE_URL as getApiBaseUrl } from '@/lib/api';

interface Module {
  moduleId: number;
  name: string;
  description?: string;
  difficulty?: string;
  estimatedTime?: number;
  quizCount?: number;
  totalQuestions?: number;
  avgDifficulty?: number;
}

interface Quiz {
  quizId: number;
  title: string;
  description: string;
  totalQuestions: number;
  timeLimit: number;
  passingScore: number;
  isComprehensive: number;
}

interface QuizAttempt {
  attemptId?: number;
  quizId?: number;
  date: string;
  type: string;
  module: string;
  score: number;
  time: string;
  status: string;
}

interface QuizStats {
  quizzesTaken: number;
  averageScore: number;
  passRate: number;
  totalTime: number;
}

// API base URL
const API_BASE_URL = getApiBaseUrl();

export default function QuizSelection() {
  const navigate = useNavigate();
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedModules, setSelectedModules] = useState<number[]>([]);
  const [timeLimit, setTimeLimit] = useState('30');
  const [showFilters, setShowFilters] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [, setError] = useState('');
  const [modules, setModules] = useState<Module[]>([]);
  const [previousAttempts, setPreviousAttempts] = useState<QuizAttempt[]>([]);
  const [startingQuiz, setStartingQuiz] = useState(false);
  const [customQuizzes, setCustomQuizzes] = useState<Quiz[]>([]);
  const [loadingCustom, setLoadingCustom] = useState(false);
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);
  
  // Practice Quiz State
  const [isTimedPractice, setIsTimedPractice] = useState(true);
  const [practiceTimeLimit, setPracticeTimeLimit] = useState('15');
  const [practiceQuestionCount, setPracticeQuestionCount] = useState('10');
  
  // Comprehensive Exam State
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);

  const [attemptsPage, setAttemptsPage] = useState(1);
  const ATTEMPTS_PER_PAGE = 5;

  const totalAttemptsPages = Math.max(1, Math.ceil(previousAttempts.length / ATTEMPTS_PER_PAGE));
  const paginatedAttempts = previousAttempts.slice(
    (attemptsPage - 1) * ATTEMPTS_PER_PAGE,
    attemptsPage * ATTEMPTS_PER_PAGE
  );

  // Fetch data from API on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch modules
        const modulesResponse = await fetch(`${API_BASE_URL}/modules`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!modulesResponse.ok) {
          throw new Error('Failed to fetch modules');
        }

        const modulesData = await modulesResponse.json();
        setModules(modulesData.data || []);

        // Set first module as selected if available
        if (modulesData.data && modulesData.data.length > 0) {
          setSelectedModule(modulesData.data[0]);
        }


        // Fetch attempts
        const attemptsResponse = await fetch(`${API_BASE_URL}/quiz/attempts`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (attemptsResponse.ok) {
          const attemptsData = await attemptsResponse.json();
          setPreviousAttempts(attemptsData.data || []);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        console.error('Error fetching quiz data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // Fetch custom quizzes when module changes
  useEffect(() => {
    const fetchCustomQuizzes = async () => {
      if (!selectedModule) return;
      try {
        setLoadingCustom(true);
        const response = await fetch(`${API_BASE_URL}/quiz/module/${selectedModule.moduleId}/custom`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setCustomQuizzes(data.data || []);
          setSelectedQuizId(null); // Reset selection
          setSelectedExamId(null); // Reset exam selection
        }
      } catch (err) {
        console.error('Error fetching custom quizzes:', err);
      } finally {
        setLoadingCustom(false);
      }
    };

    fetchCustomQuizzes();
  }, [selectedModule]);

  const handleStartModuleQuiz = async () => {
    if (!selectedModule) return;
    setStartingQuiz(true);
    try {
      // If a custom quiz is selected, we might need a different endpoint or pass ID
      const endpoint = selectedQuizId
        ? `${API_BASE_URL}/quiz/module/${selectedModule.moduleId}/start?quizId=${selectedQuizId}`
        : `${API_BASE_URL}/quiz/module/${selectedModule.moduleId}/start`;

      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        // Only send custom config for non-static practice quizzes
        body: !selectedQuizId ? JSON.stringify({
          timeLimit: isTimedPractice ? parseInt(practiceTimeLimit) : 0,
          questionCount: parseInt(practiceQuestionCount)
        }) : undefined
      });

      if (!response.ok) {
        throw new Error('Failed to start quiz');
      }

      const data = await response.json();
      if (data.success) {
        navigate(`/quizattempt/${data.data.attemptId}`);
      } else {
        throw new Error(data.message || 'Failed to start quiz');
      }
    } catch (err) {
      console.error('Error starting quiz:', err);
      setError(err instanceof Error ? err.message : 'Failed to start quiz');
    } finally {
      setStartingQuiz(false);
    }
  };


  const handleStartTimedExam = async () => {
    if (!selectedModule || !selectedExamId) return;
    setStartingQuiz(true);
    try {
      const response = await fetch(`${API_BASE_URL}/quiz/module/${selectedModule.moduleId}/start?quizId=${selectedExamId}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to start comprehensive exam');
      }

      const data = await response.json();
      if (data.success) {
        navigate(`/quizattempt/${data.data.attemptId}`);
      } else {
        throw new Error(data.message || 'Failed to start comprehensive exam');
      }
    } catch (err) {
      console.error('Error starting comprehensive exam:', err);
      setError(err instanceof Error ? err.message : 'Failed to start comprehensive exam');
    } finally {
      setStartingQuiz(false);
    }
  };


  const toggleModuleSelection = (moduleId: number) => {
    setSelectedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-sm text-neutral-500 font-medium tracking-tight">Loading quizzes...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageLayout
        title="Quiz"
        subtitle="Choose your assessment type"
        breadcrumbLabel="Quiz"
        activeNav="quiz"
        userType="student"
      >

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div
            onClick={handleStartModuleQuiz}
            className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 hover:border-neutral-700 transition-all cursor-pointer group"
          >
            <div className="mb-6">
              <div className="w-12 h-12 rounded bg-neutral-950 border border-neutral-800 text-neutral-500 flex items-center justify-center mb-4 group-hover:text-emerald-500 transition-colors">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1 tracking-tight">Module Quiz</h3>
              <p className="text-neutral-500 text-sm font-medium">Test your knowledge on a specific module</p>
            </div>
            <div className="space-y-3 mb-6 text-xs font-bold text-neutral-400 uppercase tracking-tight">
              <div className="flex justify-between"><span>Format</span><span className="text-neutral-200">MCQ & Labeling</span></div>
              <div className="flex justify-between"><span>Duration</span><span className="text-neutral-200">15-20 mins</span></div>
              <div className="flex justify-between"><span>Questions</span><span className="text-neutral-200">10-15</span></div>
            </div>
            <div className="mb-6" onClick={(e) => e.stopPropagation()}>
              <label className="block text-xs font-bold mb-2 text-neutral-500 uppercase tracking-wider">Select Module</label>
              <select
                value={selectedModule?.moduleId || ''}
                onChange={(e) => {
                  const module = modules.find(m => m.moduleId === parseInt(e.target.value));
                  setSelectedModule(module || null);
                }}
                className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-md text-neutral-200 focus:outline-none focus:border-neutral-700 text-sm font-medium"
                disabled={loading}
              >
                {modules.length === 0 ? (
                  <option>No modules available</option>
                ) : (
                  modules.map(module => (
                    <option key={module.moduleId} value={module.moduleId.toString()}>
                      {module.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="mb-6" onClick={(e) => e.stopPropagation()}>
              <label className="block text-xs font-bold mb-2 text-neutral-500 uppercase tracking-wider">Assessment Type</label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                <button
                  onClick={() => setSelectedQuizId(null)}
                  className={`w-full text-left px-3 py-3 rounded-md border transition-all ${selectedQuizId === null ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'}`}
                >
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-bold tracking-tight">Practice Quiz</div>
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 uppercase tracking-widest border border-neutral-700">Dynamic</span>
                  </div>
                  <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-0.5">Random questions from module</div>
                </button>

                {customQuizzes.filter(q => !q.isComprehensive).map(quiz => {
                  const isTimed = (quiz.timeLimit || 0) > 0;
                  return (
                    <button
                      key={quiz.quizId}
                      onClick={() => setSelectedQuizId(quiz.quizId)}
                      className={`w-full text-left px-3 py-3 rounded-md border transition-all ${selectedQuizId === quiz.quizId ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'}`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-bold tracking-tight">{quiz.title}</div>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest border ${isTimed ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                          {isTimed ? 'Timed' : 'Untimed'}
                        </span>
                      </div>
                      <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-0.5">{quiz.totalQuestions} questions • {isTimed ? `${quiz.timeLimit} mins` : 'No limit'}</div>
                    </button>
                  );
                })}

                {loadingCustom && <div className="text-center py-2"><Loader2 className="w-4 h-4 animate-spin mx-auto text-emerald-500" /></div>}
                {!loadingCustom && customQuizzes.length === 0 && <div className="text-[10px] text-neutral-600 text-center py-2 font-bold uppercase tracking-widest italic">No custom quizzes found</div>}
              </div>
            </div>

            {selectedQuizId === null && (
              <div className="mb-6 p-4 bg-neutral-950/50 border border-neutral-800 rounded-md box-content -mx-1" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Practice Mode</label>
                  <button 
                    onClick={() => setIsTimedPractice(!isTimedPractice)}
                    className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest transition-all border ${isTimedPractice ? 'bg-emerald-500 text-neutral-950 border-emerald-500' : 'bg-neutral-900 text-neutral-500 border-neutral-800'}`}
                  >
                    {isTimedPractice ? 'Timed' : 'Untimed'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-600 uppercase tracking-widest mb-1.5">Questions</label>
                    <input 
                      type="number" 
                      value={practiceQuestionCount} 
                      onChange={(e) => setPracticeQuestionCount(e.target.value)}
                      className="w-full px-2 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs font-bold text-neutral-300 focus:outline-none focus:border-neutral-700" 
                      min="5" max="30"
                    />
                  </div>
                  <div className={isTimedPractice ? 'opacity-100' : 'opacity-30 pointer-events-none'}>
                    <label className="block text-[9px] font-bold text-neutral-600 uppercase tracking-widest mb-1.5">Mins</label>
                    <input 
                      type="number" 
                      value={practiceTimeLimit} 
                      onChange={(e) => setPracticeTimeLimit(e.target.value)}
                      className="w-full px-2 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs font-bold text-neutral-300 focus:outline-none focus:border-neutral-700" 
                      min="5" max="60"
                    />
                  </div>
                </div>
              </div>
            )}
            <button
              disabled={startingQuiz}
              className={`w-full py-3 px-4 rounded-md font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${previousAttempts.some(a => a.status === 'in_progress' && (
                selectedQuizId
                  ? a.quizId === selectedQuizId
                  : (a.type === 'Practice' && (a.module === selectedModule?.name || a.module === `Practice: ${selectedModule?.name}`))
              ))
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-neutral-950 hover:bg-neutral-800 text-white border border-neutral-800 hover:border-neutral-700'
                }`}
            >
              {startingQuiz ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {previousAttempts.some(a => a.status === 'in_progress' && (
                selectedQuizId
                  ? a.quizId === selectedQuizId
                  : (a.type === 'Practice Quiz' && (a.module === selectedModule?.name || a.module === `Practice Quiz: ${selectedModule?.name}`))
              ))
                ? (selectedQuizId ? 'Resume quiz' : 'Resume practice quiz')
                : (selectedQuizId ? 'Start quiz' : 'Start practice quiz')
              }
            </button>
          </div>

          <div
            onClick={handleStartTimedExam}
            className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 hover:border-neutral-700 transition-all cursor-pointer group"
          >
            <div className="mb-6">
              <div className="w-12 h-12 rounded bg-neutral-950 border border-neutral-800 text-neutral-500 flex items-center justify-center mb-4 group-hover:text-amber-500 transition-colors">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1 tracking-tight">Comprehensive Exam</h3>
              <p className="text-neutral-500 text-sm font-medium">Official instructor-prescribed assessment</p>
            </div>

            <div className="space-y-3 mb-6 text-xs font-bold text-neutral-400 uppercase tracking-tight">
              <div className="flex justify-between"><span>Standards</span><span className="text-neutral-200">Official</span></div>
              <div className="flex justify-between"><span>Attempt Limit</span><span className="text-neutral-200">Institutional</span></div>
              <div className="flex justify-between"><span>Goal</span><span className="text-neutral-200">Formal Mastery</span></div>
            </div>

            <div className="mb-6" onClick={(e) => e.stopPropagation()}>
              <label className="block text-xs font-bold mb-2 text-neutral-500 uppercase tracking-wider">Select Assessment</label>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                {customQuizzes.filter(q => q.isComprehensive).map(quiz => {
                  const isTimed = (quiz.timeLimit || 0) > 0;
                  return (
                    <button
                      key={quiz.quizId}
                      onClick={() => setSelectedExamId(quiz.quizId)}
                      className={`w-full text-left px-3 py-3 rounded-md border transition-all ${selectedExamId === quiz.quizId ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'}`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-bold tracking-tight">{quiz.title}</div>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest border ${isTimed ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                          {isTimed ? 'Timed' : 'Untimed'}
                        </span>
                      </div>
                      <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-0.5">{quiz.totalQuestions} questions • {isTimed ? `${quiz.timeLimit} mins` : 'No limit'}</div>
                    </button>
                  );
                })}

                {loadingCustom && <div className="text-center py-2"><Loader2 className="w-4 h-4 animate-spin mx-auto text-emerald-500" /></div>}
                {!loadingCustom && customQuizzes.filter(q => q.isComprehensive).length === 0 && (
                  <div className="text-[10px] text-neutral-600 text-center py-8 font-bold uppercase tracking-widest italic border border-dashed border-neutral-800 rounded-md">
                    No official exams published for this module
                  </div>
                )}
              </div>
            </div>

            <button 
              disabled={startingQuiz || !selectedExamId} 
              className={`w-full py-3 px-4 rounded-md font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                selectedExamId ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_15px_rgba(217,119,6,0.3)]' : 'bg-neutral-950 text-neutral-600 border border-neutral-800'
              }`}
            >
              {startingQuiz ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Start Comprehensive Exam
            </button>
          </div>

        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
              Previous Attempts
            </h3>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowFilters(!showFilters)} className={`p-2 rounded transition-all ${showFilters ? 'bg-neutral-800 text-emerald-500' : 'bg-neutral-950 border border-neutral-800 text-neutral-500 hover:text-white'}`}>
                <Filter className="w-4 h-4" />
              </button>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" />
                <input type="text" placeholder="SEARCH HISTORY..." className="pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-md focus:outline-none focus:border-neutral-700 text-[10px] font-bold w-48 text-neutral-200 placeholder-neutral-600 uppercase tracking-widest" />
              </div>
            </div>
          </div>

          {showFilters && (
            <div className="mb-8 p-6 bg-neutral-950/50 rounded-lg border border-neutral-800">
              <div className="flex items-center gap-6">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold mb-2 text-neutral-500 uppercase tracking-widest">Difficulty</label>
                  <select
                    value={difficultyFilter}
                    onChange={(e) => setDifficultyFilter(e.target.value)}
                    className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-md focus:border-neutral-700 focus:outline-none transition-all text-xs font-bold text-neutral-300"
                  >
                    <option value="all">ALL LEVELS</option>
                    <option value="beginner">BEGINNER</option>
                    <option value="intermediate">INTERMEDIATE</option>
                    <option value="advanced">ADVANCED</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold mb-2 text-neutral-500 uppercase tracking-widest">Status</label>
                  <select className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-md focus:border-neutral-700 focus:outline-none transition-all text-xs font-bold text-neutral-300">
                    <option>ALL STATUS</option>
                    <option>PASSED</option>
                    <option>FAILED</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold mb-2 text-neutral-500 uppercase tracking-widest">Date Range</label>
                  <select className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-md focus:border-neutral-700 focus:outline-none transition-all text-xs font-bold text-neutral-300">
                    <option>LAST 30 DAYS</option>
                    <option>LAST 3 MONTHS</option>
                    <option>ALL TIME</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Attempts Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="text-left py-4 px-4 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Date</th>
                  <th className="text-left py-4 px-4 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Type</th>
                  <th className="text-left py-4 px-4 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Module</th>
                  <th className="text-left py-4 px-4 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Score</th>
                  <th className="text-left py-4 px-4 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Time</th>
                  <th className="text-left py-4 px-4 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Status</th>
                  <th className="text-right py-4 px-4 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {paginatedAttempts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-neutral-600 text-[10px] font-bold uppercase tracking-widest">No quiz history found</td>
                  </tr>
                ) : (
                  paginatedAttempts.map((attempt, idx) => (
                    <tr key={idx} className="group hover:bg-neutral-800/30 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-neutral-400">
                          <Calendar className="w-3.5 h-3.5 text-neutral-600" />
                          <span>{attempt.date}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-xs font-bold text-neutral-300 uppercase tracking-tight">{attempt.type}</td>
                      <td className="py-4 px-4 text-xs font-bold text-neutral-400">{attempt.module}</td>
                      <td className="py-4 px-4">
                        <span className={`text-sm font-bold tracking-tight ${attempt.score >= 80 ? 'text-emerald-500' :
                            attempt.score >= 70 ? 'text-amber-500' : 'text-rose-500'
                          }`}>
                          {attempt.score}%
                        </span>
                      </td>
                      <td className="py-4 px-4 text-[10px] font-bold text-neutral-500 uppercase">{attempt.time}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight border ${attempt.status === 'passed'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                          }`}>
                          {attempt.status === 'passed' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {attempt.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => attempt.attemptId && navigate(`/quizresult/${attempt.attemptId}`)}
                          className="text-neutral-400 hover:text-emerald-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ml-auto disabled:opacity-50 transition-colors"
                          disabled={!attempt.attemptId || (attempt.status !== 'passed' && attempt.status !== 'failed')}
                        >
                          Details <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-10 pt-8 border-t border-neutral-800">
            <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">
              Showing {previousAttempts.length === 0 ? 0 : (attemptsPage - 1) * ATTEMPTS_PER_PAGE + 1}-
              {Math.min(attemptsPage * ATTEMPTS_PER_PAGE, previousAttempts.length)} / {previousAttempts.length} entries
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setAttemptsPage(p => Math.max(1, p - 1))}
                disabled={attemptsPage <= 1}
                className="p-2 border border-neutral-800 hover:bg-neutral-800 rounded transition-all disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4 text-neutral-400" />
              </button>
              {Array.from({ length: totalAttemptsPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setAttemptsPage(p)}
                  className={`min-w-[32px] h-8 rounded text-[10px] font-bold tracking-tight transition-all ${attemptsPage === p ? 'bg-neutral-800 text-emerald-500 border border-emerald-500/30' : 'text-neutral-500 hover:text-white hover:bg-neutral-800'
                    }`}
                >
                  {p.toString().padStart(2, '0')}
                </button>
              ))}
              <button
                onClick={() => setAttemptsPage(p => Math.min(totalAttemptsPages, p + 1))}
                disabled={attemptsPage >= totalAttemptsPages}
                className="p-2 border border-neutral-800 hover:bg-neutral-800 rounded transition-all disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              </button>
            </div>
          </div>
        </div>
      </PageLayout>
      <style>{`
      .custom-scrollbar::-webkit-scrollbar { width: 6px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 3px; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(100,116,139,0.5); border-radius: 3px; }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(100,116,139,0.7); }
    `}</style>
    </>
  );
}