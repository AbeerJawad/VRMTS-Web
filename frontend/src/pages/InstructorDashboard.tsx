import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, BookOpen, TrendingUp, AlertCircle, Clock, Target, Award, MessageSquare, Settings, Bell, ChevronRight, Plus, Download, Send, BarChart3, Activity, CheckCircle, AlertTriangle, Calendar, Eye, Loader2 } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';

const API_BASE_URL = 'http://localhost:8080/api';

interface ClassStats {
  totalStudents: number;
  averagePerformance: number;
  modulesAssigned: number;
  totalModules: number;
  atRiskStudents: number;
}

interface ModulePerformance {
  module: string;
  completed: number;
  avgScore: number;
  timeSpent: string;
  status: string;
}

interface RecentSubmission {
  student: string;
  module: string;
  score: number;
  time: string;
  status: string;
}

interface AtRiskStudent {
  name: string;
  avatar: string;
  avgScore: number;
  missedDeadlines: number;
  lastActive: string;
  risk: string;
}

interface TopPerformer {
  name: string;
  avatar: string;
  avgScore: number;
  modules: number;
  badge: string;
}

interface UpcomingDeadline {
  assignment: string;
  dueDate: string;
  studentsCompleted: number;
  totalStudents: number;
}

export default function InstructorDashboard() {
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState('Medical Batch 2024');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [classStats, setClassStats] = useState<ClassStats>({
    totalStudents: 0,
    averagePerformance: 0,
    modulesAssigned: 0,
    totalModules: 0,
    atRiskStudents: 0
  });
  const [modulePerformance, setModulePerformance] = useState<ModulePerformance[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([]);
  const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<UpcomingDeadline[]>([]);
  const [totalStudents, setTotalStudents] = useState(156);
  const [userName, setUserName] = useState('Instructor');
  const [userInitials, setUserInitials] = useState('IN');

  useEffect(() => {
    fetchUserInfo();
    fetchDashboardData();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const userResponse = await axios.get(`${API_BASE_URL}/auth/check`, { withCredentials: true });
      if (userResponse.data.isAuthenticated && userResponse.data.user) {
        const name = userResponse.data.user.name || 'Instructor';
        setUserName(name);
        // Get initials from name
        const initials = name
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .substring(0, 2);
        setUserInitials(initials);
      }
    } catch (err) {
      console.error('Error fetching user info:', err);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        statsResponse,
        modulePerfResponse,
        submissionsResponse,
        atRiskResponse,
        topPerformersResponse,
        deadlinesResponse
      ] = await Promise.all([
        axios.get(`${API_BASE_URL}/instructor/class-stats`, { withCredentials: true }),
        axios.get(`${API_BASE_URL}/instructor/module-performance`, { withCredentials: true }),
        axios.get(`${API_BASE_URL}/instructor/recent-submissions`, { withCredentials: true }),
        axios.get(`${API_BASE_URL}/instructor/at-risk-students`, { withCredentials: true }),
        axios.get(`${API_BASE_URL}/instructor/top-performers`, { withCredentials: true }),
        axios.get(`${API_BASE_URL}/instructor/upcoming-deadlines`, { withCredentials: true })
      ]);

      if (statsResponse.data.success) {
        setClassStats(statsResponse.data.data);
      }

      if (modulePerfResponse.data.success) {
        setModulePerformance(modulePerfResponse.data.data);
        setTotalStudents(modulePerfResponse.data.totalStudents || 156);
      }

      if (submissionsResponse.data.success) {
        setRecentSubmissions(submissionsResponse.data.data);
      }

      if (atRiskResponse.data.success) {
        setAtRiskStudents(atRiskResponse.data.data);
      }

      if (topPerformersResponse.data.success) {
        setTopPerformers(topPerformersResponse.data.data);
      }

      if (deadlinesResponse.data.success) {
        setUpcomingDeadlines(deadlinesResponse.data.data);
      }

    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const displayClassStats = [
    {
      label: 'Total Students',
      value: classStats.totalStudents.toString(),
      icon: Users,
      color: 'text-neutral-400',
      change: null
    },
    {
      label: 'Average Performance',
      value: `${classStats.averagePerformance}%`,
      icon: Target,
      color: 'text-emerald-500',
      change: null
    },
    {
      label: 'Modules Assigned',
      value: `${classStats.modulesAssigned}/${classStats.totalModules}`,
      icon: BookOpen,
      color: 'text-emerald-400',
      change: null
    },
    {
      label: 'Students Needing Support',
      value: classStats.atRiskStudents.toString(),
      icon: AlertCircle,
      color: 'text-amber-500',
      change: null
    }
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'excellent': 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      'good': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      'average': 'text-neutral-400 bg-neutral-500/10 border-neutral-500/20',
      'needs-attention': 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      'poor': 'text-rose-500 bg-rose-500/10 border-rose-500/20',
      'needs-review': 'text-amber-500 bg-amber-500/10 border-amber-500/20'
    };
    return colors[status] || colors['average'];
  };

  const getRiskColor = (risk: string) => {
    const colors: Record<string, string> = {
      'high': 'border-red-500/30 bg-red-500/10',
      'medium': 'border-orange-500/30 bg-orange-500/10',
      'low': 'border-yellow-500/30 bg-yellow-500/10'
    };
    return colors[risk] || colors['medium'];
  };



  const headerRight = (
    <>
      <select
        value={selectedClass}
        onChange={(e) => setSelectedClass(e.target.value)}
        className="px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-md text-sm text-neutral-200 focus:outline-none focus:border-neutral-700"
      >
        <option>Medical Batch 2024</option>
        <option>Medical Batch 2023</option>
        <option>Nursing Program A</option>
      </select>
      <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
        <Bell className="w-5 h-5" />
      </button>
      <button onClick={() => navigate('/instructor/settings')} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
        <Settings className="w-5 h-5" />
      </button>
      <div className="w-9 h-9 rounded-full bg-slate-600 flex items-center justify-center text-sm font-medium text-slate-200">
        {userInitials}
      </div>
    </>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-sm text-neutral-500 font-medium">Loading dashboard...</p>
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
          <p className="text-neutral-500 text-sm mb-8">Failed to load data. Please check your connection.</p>
          <button onClick={fetchDashboardData} className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-sm font-bold text-white transition-all">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <PageLayout
      title="Instructor dashboard"
      subtitle={`Welcome back, ${userName}`}
      breadcrumbLabel="Dashboard"
      activeNav="dashboard"
      userType="instructor"
      headerRight={headerRight}
    >
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-md text-sm font-bold text-neutral-200 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export report
          </button>
          <button 
            onClick={() => navigate('/instructor/modules')}
            className="px-4 py-2 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 rounded-md text-sm font-bold text-neutral-200 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Assign module
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50">
              <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5" />
                Module Performance
              </h3>
              <button className="text-[10px] font-bold text-emerald-500 hover:text-emerald-400 uppercase tracking-widest flex items-center gap-1 transition-colors">
                Analytics <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y divide-neutral-800">
              {modulePerformance.length === 0 ? (
                <div className="px-6 py-8 text-center text-neutral-600 text-[10px] font-bold uppercase tracking-widest">No data available</div>
              ) : (
                modulePerformance.map((module, idx) => (
                  <div key={idx} className="px-6 py-4 flex items-center hover:bg-neutral-950/50 transition-colors group">
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-neutral-200 group-hover:text-emerald-500 transition-colors uppercase tracking-tight">{module.module}</h4>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex-1 h-1 bg-neutral-950 rounded-full overflow-hidden max-w-[120px]">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${totalStudents > 0 ? (module.completed / totalStudents) * 100 : 0}%` }} />
                        </div>
                        <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-tight">{module.completed}/{totalStudents} COMPLETED</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-white tracking-tighter">{module.avgScore}%</div>
                      <div className={`text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-sm border ${getStatusColor(module.status)}`}>
                        {module.status.replace('-', ' ')}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50">
              <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                Recent History
              </h3>
              <button className="text-[10px] font-bold text-neutral-500 hover:text-emerald-500 uppercase tracking-widest transition-colors">View activity</button>
            </div>
            <div className="divide-y divide-neutral-800">
              {recentSubmissions.length === 0 ? (
                <div className="px-6 py-8 text-center text-neutral-600 text-[10px] font-bold uppercase tracking-widest">No recent activity</div>
              ) : (
                recentSubmissions.map((submission, idx) => (
                  <div key={idx} className="px-6 py-3 flex items-center gap-4 hover:bg-neutral-950/50 transition-colors group">
                    <div className="w-7 h-7 rounded bg-neutral-950 border border-neutral-800 flex items-center justify-center text-[9px] font-bold text-neutral-500 group-hover:border-emerald-500/30 transition-colors">
                      {submission.student.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[11px] font-bold text-neutral-200 group-hover:text-white truncate tracking-tight uppercase">{submission.student}</h4>
                      <p className="text-[9px] text-neutral-600 font-medium uppercase tracking-widest">{submission.module}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-[11px] font-bold tracking-tighter ${submission.score >= 80 ? 'text-emerald-500' : submission.score >= 60 ? 'text-amber-400' : 'text-rose-500'}`}>
                        {submission.score}%
                      </div>
                      <p className="text-[8px] text-neutral-600 font-bold uppercase tracking-tighter">{submission.time}</p>
                    </div>
                    <div className="w-px h-6 bg-neutral-800 mx-1"></div>
                    <button className="p-1.5 hover:bg-neutral-800 rounded transition-colors text-neutral-600 hover:text-emerald-500">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
            <h4 className="text-[10px] font-bold text-neutral-500 mb-6 tracking-widest flex items-center gap-2 uppercase">
              <Award className="w-3.5 h-3.5 text-emerald-500" />
              Top Performers
            </h4>
            <div className="space-y-4">
              {topPerformers.length === 0 ? (
                <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest">No data available</p>
              ) : (
                topPerformers.slice(0, 3).map((student, idx) => (
                  <div key={idx} className="flex items-center gap-4 group">
                    <div className="w-8 h-8 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-center text-[10px] font-bold text-neutral-500 group-hover:text-emerald-500 transition-all uppercase">
                      {student.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-neutral-200 truncate uppercase tracking-tight">{student.name}</p>
                      <p className="text-[9px] text-neutral-600 font-bold uppercase tracking-widest">{student.modules} modules</p>
                    </div>
                    <p className="text-sm font-bold text-emerald-500 tracking-tighter">{student.avgScore}%</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
            <h4 className="text-[10px] font-bold text-neutral-500 mb-6 tracking-widest flex items-center gap-2 uppercase">
              <Calendar className="w-3.5 h-3.5" />
              Upcoming Deadlines
            </h4>
            <div className="space-y-6">
              {upcomingDeadlines.length === 0 ? (
                <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest">No deadlines</p>
              ) : (
                upcomingDeadlines.slice(0, 2).map((deadline, idx) => (
                  <div key={idx} className="space-y-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-neutral-200 leading-tight mb-1 uppercase tracking-tight">{deadline.assignment}</p>
                      <p className="text-[9px] text-neutral-600 font-bold uppercase tracking-widest">Due: {deadline.dueDate}</p>
                    </div>
                    <div>
                      <div className="flex justify-between text-[8px] font-bold text-neutral-700 mb-1.5 uppercase tracking-widest">
                        <span>COMPLETION</span>
                        <span>{deadline.studentsCompleted}/{deadline.totalStudents}</span>
                      </div>
                      <div className="h-1 bg-neutral-950 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${(deadline.studentsCompleted / deadline.totalStudents) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={() => navigate('/instructor/create-quiz')}
              className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 text-left hover:border-emerald-500/30 transition-all group"
            >
              <Plus className="w-4 h-4 text-neutral-600 mb-3 group-hover:text-emerald-500 transition-colors" />
              <h4 className="font-bold text-neutral-200 mb-1 text-[10px] uppercase tracking-widest">Create quiz</h4>
              <p className="text-[9px] text-neutral-600 font-bold uppercase tracking-widest">Add new assessment</p>
            </button>
            <button className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 text-left hover:border-emerald-500/30 transition-all group">
              <Send className="w-4 h-4 text-neutral-600 mb-3 group-hover:text-emerald-500 transition-colors" />
              <h4 className="font-bold text-neutral-200 mb-1 text-[10px] uppercase tracking-widest">Send message</h4>
              <p className="text-[9px] text-neutral-600 font-bold uppercase tracking-widest">Contact students</p>
            </button>
          </div>
        </aside>
      </div>
    </PageLayout>
  );
}