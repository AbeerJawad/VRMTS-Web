import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BookOpen, Trophy, Clock, Zap, Target, MessageSquare, Settings, Bell, ChevronRight, Lock, Play, BarChart3, Calendar, CheckCircle2, AlertTriangle } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';
import { GuidedChecklist } from '@/components/GuidedChecklist';

interface Module {
  moduleId: number;
  name: string;
  category?: string;
  description: string;
  progress: number;
  status: 'in_progress' | 'completed' | 'locked' | 'not_started';
  duration?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  quizScore: number | null;
  parts: number;
  completedParts: number;
  hoursSpent?: number;
}

const getStatusIcon = (status: Module['status']) => {
  switch (status) {
    case 'completed': return CheckCircle2;
    case 'in_progress': return Play;
    case 'locked': return Lock;
    default: return BookOpen;
  }
};

interface Stats {
  modulesCompleted: number;
  totalModules: number;
  averageScore: number;
  studyStreak: number;
  totalHours: number;
}

interface Activity {
  action: string;
  module: string;
  score?: number;
  time: string;
}

interface Deadline {
  id: number;
  title: string;
  dueDate: string;
  daysUntil: number;
}

const API_BASE_URL = 'http://localhost:8080/api';
const RAG_API_URL = 'http://localhost:8000/ask';

export default function VRDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('modules');
  const [showNotifications, setShowNotifications] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  const [stats, setStats] = useState<Stats>({
    modulesCompleted: 0,
    totalModules: 0,
    averageScore: 0,
    studyStreak: 0,
    totalHours: 0
  });
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState('Student');
  const [analyticsViewed, setAnalyticsViewed] = useState(false);
  const [lab1Interacted, setLab1Interacted] = useState(false);

  useEffect(() => {
    setAnalyticsViewed(localStorage.getItem('vrmts_analytics_viewed') === 'true');
    setLab1Interacted(localStorage.getItem('vrmts_lab1_interacted') === 'true');
  }, []);

  // AI Assistant State
  const [isAssistantExpanded, setIsAssistantExpanded] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const achievements = [
    { name: 'First Steps', Icon: Target, unlocked: true },
    { name: 'Quiz Master', Icon: Trophy, unlocked: true },
    { name: 'Week Warrior', Icon: Zap, unlocked: true },
    { name: 'Perfect Score', Icon: Target, unlocked: false },
    { name: 'Marathon', Icon: Zap, unlocked: false }
  ];

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user info first to check user type
      const userResponse = await axios.get(`${API_BASE_URL}/auth/check`, { withCredentials: true });

      // Redirect teachers to instructor dashboard
      if (userResponse.data.isAuthenticated && (userResponse.data.user.userType === 'teacher' || userResponse.data.user.userType === 'instructor')) {
        navigate('/instructordashboard');
        return;
      }

      // Fetch dashboard data in parallel
      const [statsResponse, modulesResponse, activityResponse, deadlinesResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/dashboard/stats`, { withCredentials: true }),
        axios.get(`${API_BASE_URL}/dashboard/recent-modules`, { withCredentials: true }),
        axios.get(`${API_BASE_URL}/dashboard/recent-activity`, { withCredentials: true }),
        axios.get(`${API_BASE_URL}/dashboard/upcoming-deadlines`, { withCredentials: true })
      ]);

      if (userResponse.data.isAuthenticated) {
        setUserName(userResponse.data.user.name || 'Student');
      }

      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }

      if (modulesResponse.data.success) {
        setModules(modulesResponse.data.data);
      }

      if (activityResponse.data.success) {
        setRecentActivity(activityResponse.data.data);
      }

      if (deadlinesResponse.data.success) {
        setUpcomingDeadlines(deadlinesResponse.data.data);
      }

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // Transform stats for display

  const handleAskAI = async () => {
    if (!aiQuestion.trim()) return;
    setAiLoading(true);
    setAiAnswer('');
    try {
      const response = await axios.post(RAG_API_URL, {
        q: aiQuestion,
        k: 6,
        use_llm: true
      });
      setAiAnswer(response.data.answer || 'No answer found.');
    } catch (err) {
      console.error('AI Error:', err);
      setAiAnswer('The AI assistant is currently offline. Please ensure the RAG server is running and try again.');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4" />
          <p className="text-sm text-neutral-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-6" />
          <h3 className="text-xl font-bold text-white mb-2 tracking-tight">{error}</h3>
          <p className="text-neutral-500 text-sm mb-8">This could be due to a network issue or server downtime.</p>
          <button onClick={fetchDashboardData} className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-sm font-bold text-white transition-all">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const headerRight = (
    <>
      <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 hover:bg-white/5 rounded-lg transition-colors relative">
        <Bell className="w-5 h-5" />
      </button>
      <button onClick={() => navigate('/settings')} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
        <Settings className="w-5 h-5" />
      </button>
      <div className="w-9 h-9 rounded-full bg-slate-600 flex items-center justify-center text-sm font-medium text-slate-200">
        {userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
      </div>
    </>
  );

  return (
    <PageLayout
      title="Dashboard"
      subtitle={`Welcome back, ${userName}`}
      breadcrumbLabel="Dashboard"
      activeNav="dashboard"
      userType="student"
      headerRight={headerRight}
    >

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-8">
          {/* Guided Checklist for Students */}
          <GuidedChecklist 
            userName={userName}
            items={[
              { 
                id: 'explore', 
                title: 'Explore Lab 1', 
                description: 'Enter the Orientation Lab and interact with anatomical structures.',
                icon: BookOpen, 
                done: lab1Interacted || modules.some(m => (m.moduleId === 1 || m.name.toLowerCase().includes('lab 1')) && m.progress > 0), 
                action: () => navigate('/lab1explore') 
              },
              { 
                id: 'quiz', 
                title: 'Take First Quiz', 
                description: 'Test your knowledge by completing your first knowledge assessment.',
                icon: Trophy, 
                done: stats.averageScore > 0, 
                action: () => navigate('/quizselection') 
              },
              { 
                id: 'analytics', 
                title: 'View Progress Report', 
                description: 'Check your performance metrics and learning trends.',
                icon: BarChart3, 
                done: analyticsViewed, 
                action: () => navigate('/studentanalytics') 
              }
            ]}
          />

          {/* Active Modules Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-neutral-400">Active Modules</h3>
              <button className="text-neutral-500 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors" onClick={() => navigate('/modules')}>
                View all modules <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {modules.slice(0, 4).map((module) => {
                const StatusIcon = getStatusIcon(module.status);
                return (
                  <div
                    key={module.moduleId}
                    onClick={() => {
                      if (module.status !== 'locked') {
                        if (module.moduleId === 1 || (module.name && (module.name.toUpperCase().includes('LAB 1') || module.name.toUpperCase().includes('LAB1')))) {
                          navigate('/lab1explore');
                        } else if (module.moduleId === 2 || (module.name && (module.name.toUpperCase().includes('LAB 2') || module.name.toUpperCase().includes('LAB2')))) {
                          navigate('/lab2explore');
                        } else {
                          navigate(`/module/${module.moduleId}`);
                        }
                      }
                    }}
                    className={`group relative flex flex-col p-5 rounded-lg border transition-all ${module.status === 'locked'
                      ? 'bg-neutral-950 border-neutral-900 opacity-60 cursor-not-allowed'
                      : 'bg-neutral-900 border-neutral-800 hover:border-emerald-500/30 cursor-pointer hover:shadow-sm'
                      }`}
                  >
                    <div className="flex items-start gap-4 mb-5">
                      <div className="w-10 h-10 rounded-md bg-neutral-950 flex items-center justify-center text-neutral-400 border border-neutral-800 group-hover:bg-neutral-900 transition-colors">
                        <StatusIcon className="w-5 h-5 shadow-sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-neutral-100 truncate text-base leading-tight group-hover:text-white transition-colors">
                          {module.name}
                        </h4>
                        <div className="flex items-center gap-3 text-xs font-medium text-neutral-500 mt-1.5">
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{module.duration}</span>
                          {module.quizScore != null && (
                            <span className="flex items-center gap-1 text-emerald-500 font-bold"><Trophy className="w-3.5 h-3.5" />{module.quizScore}%</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {module.status !== 'locked' && (
                      <div className="mt-auto pt-4 border-t border-neutral-800/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-tight">Progress</span>
                          <span className="text-[10px] font-bold text-neutral-400">{module.progress}%</span>
                        </div>
                        <div className="h-1 bg-neutral-950 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 bg-emerald-500`}
                            style={{ width: `${module.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Quick Actions Area */}
          <section className="pt-4">
            <h3 className="text-sm font-bold text-neutral-400 mb-4">Quick Shortcuts</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => navigate('/quizselection')}
                className="flex items-center gap-3 p-4 bg-neutral-900 border border-neutral-800 rounded-lg hover:border-neutral-700 hover:bg-neutral-800/50 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded bg-neutral-950 flex items-center justify-center border border-neutral-800 group-hover:bg-neutral-900 transition-colors">
                  <Trophy className="w-4 h-4 text-neutral-500 group-hover:text-amber-500 transition-colors" />
                </div>
                <div>
                  <div className="text-sm font-bold text-neutral-200">Take Quiz</div>
                  <div className="text-[10px] text-neutral-500 font-medium leading-none mt-0.5">Test knowledge</div>
                </div>
              </button>

              <button
                onClick={() => navigate('/modules')}
                className="flex items-center gap-3 p-4 bg-neutral-900 border border-neutral-800 rounded-lg hover:border-neutral-700 hover:bg-neutral-800/50 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded bg-neutral-950 flex items-center justify-center border border-neutral-800 group-hover:bg-neutral-900 transition-colors">
                  <BookOpen className="w-4 h-4 text-neutral-500 group-hover:text-emerald-500 transition-colors" />
                </div>
                <div>
                  <div className="text-sm font-bold text-neutral-200">Library</div>
                  <div className="text-[10px] text-neutral-500 font-medium leading-none mt-0.5">Browse all modules</div>
                </div>
              </button>

              <button
                onClick={() => navigate('/studentanalytics')}
                className="flex items-center gap-3 p-4 bg-neutral-900 border border-neutral-800 rounded-lg hover:border-neutral-700 hover:bg-neutral-800/50 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded bg-neutral-950 flex items-center justify-center border border-neutral-800 group-hover:bg-neutral-900 transition-colors">
                  <BarChart3 className="w-4 h-4 text-neutral-500 group-hover:text-emerald-400 transition-colors" />
                </div>
                <div>
                  <div className="text-sm font-bold text-neutral-200">Report</div>
                  <div className="text-[10px] text-neutral-500 font-medium leading-none mt-0.5">View analytics</div>
                </div>
              </button>
            </div>
          </section>
        </div>

        <aside className="bg-neutral-900 border border-neutral-800 rounded-lg h-fit divide-y divide-neutral-800/50">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-neutral-950 flex items-center justify-center border border-neutral-800">
                  <MessageSquare className="w-4 h-4 text-emerald-500" />
                </div>
                <h4 className="text-sm font-bold text-neutral-200">Study Assistant</h4>
              </div>
              {isAssistantExpanded && (
                <button 
                  onClick={() => {
                    setIsAssistantExpanded(false);
                    setAiQuestion('');
                    setAiAnswer('');
                  }}
                  className="text-[10px] font-bold text-neutral-500 hover:text-white uppercase tracking-wider transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {!isAssistantExpanded ? (
              <>
                <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
                  Have questions about your anatomy modules? Our AI assistant is here to help you study.
                </p>
                <button
                  onClick={() => setIsAssistantExpanded(true)}
                  className="w-full py-2 px-3 bg-neutral-950 hover:bg-neutral-800 rounded-md text-xs font-bold text-neutral-200 transition-colors border border-neutral-800 hover:border-neutral-700"
                >
                  Ask a question
                </button>
              </>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div>
                  <textarea
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    placeholder="e.g., How does the aortic valve work?"
                    className="w-full h-24 bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none"
                    disabled={aiLoading}
                  />
                </div>

                {aiAnswer && (
                  <div className="animate-in slide-in-from-top-1 duration-300">
                    <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs text-neutral-400 leading-relaxed max-h-40 overflow-y-auto">
                      {aiAnswer}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleAskAI}
                  disabled={!aiQuestion.trim() || aiLoading}
                  className={`w-full py-2.5 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                    !aiQuestion.trim() || aiLoading
                      ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {aiLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Analyzing...
                    </div>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      Ask AI
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="p-6">
            <h4 className="text-xs font-bold text-neutral-400 mb-6 tracking-tight flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              Recent activity
            </h4>
            <div className="space-y-6">
              {recentActivity.slice(0, 3).map((activity, idx) => (
                <div key={idx} className="flex gap-4 group">
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-700 mt-1.5 flex-shrink-0 group-hover:bg-emerald-500 transition-colors" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-neutral-200 leading-tight">{activity.action}</p>
                    <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-wider mt-1.5">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6">
            <h4 className="text-xs font-bold text-neutral-400 mb-6 tracking-tight flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              Deadlines
            </h4>
            <div className="space-y-6">
              {upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.slice(0, 2).map((deadline) => {
                  const date = new Date(deadline.dueDate);
                  const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
                  const day = date.getDate();
                  return (
                    <div key={`${deadline.id}-${deadline.dueDate}`} className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded bg-neutral-950 flex flex-col items-center justify-center flex-shrink-0 border border-neutral-800">
                        <span className="text-[8px] font-bold text-neutral-500">{month}</span>
                        <span className="text-base font-bold text-neutral-300 leading-none mt-0.5">{day}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-neutral-200 leading-tight">{deadline.title}</p>
                        <p className="text-[10px] text-neutral-500 font-bold tracking-tight mt-1.5">{deadline.daysUntil} days left</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-neutral-500 font-medium">No deadlines</p>
              )}
            </div>
          </div>
        </aside>
      </div>

    </PageLayout>
  );
}
