import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp, Clock, Trophy, Target, Calendar, Download, Filter, Brain, Zap, BookOpen, Activity, Eye, CheckCircle2, XCircle, AlertCircle, TrendingDown, Award, Loader2 } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';
import { API_BASE_URL as getApiBaseUrl } from '@/lib/api';

const API_BASE_URL = getApiBaseUrl;

interface Overview {
  totalStudyTime: string;
  modulesCompleted: number;
  totalModules: number;
  averageScore: number;
  quizzesTaken: number;
  currentStreak: number;
  longestStreak: number;
  totalSessions: number;
}

interface ScoreProgress {
  month: string;
  score: number;
}

interface StudyTime {
  day: string;
  hours: number;
}

interface ModulePerformance {
  module: string;
  progress: number;
  avgScore: number;
  timeSpent: string;
  lastAttempt: string;
  status: string;
}

interface QuestionTypePerformance {
  type: string;
  correct: number;
  total: number;
  percentage: number;
}

interface RecentActivity {
  date: string;
  action: string;
  module: string;
  score?: number;
  time?: string;
  duration?: string;
}

interface Strength {
  topic: string;
  mastery: number;
  questions: number;
}

interface Weakness {
  topic: string;
  mastery: number;
  questions: number;
}

interface LearningPattern {
  mostActiveDay: string;
  mostActiveTime: string;
  avgSessionLength: string;
  preferredFormat: string;
}

interface Achievement {
  name: string;
  icon: string;
  unlocked: boolean;
  date?: string;
}

interface AnalyticsData {
  overview: Overview;
  scoreProgress: ScoreProgress[];
  studyTime: StudyTime[];
  modulePerformance: ModulePerformance[];
  questionTypePerformance: QuestionTypePerformance[];
  recentActivity: RecentActivity[];
  strengths: Strength[];
  weaknesses: Weakness[];
  learningPattern: LearningPattern;
  achievements: Achievement[];
}

export default function StudentAnalytics() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('month');
  const [selectedModule, setSelectedModule] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/analytics/student`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch analytics data');
        }

        const result = await response.json();
        if (result.success && result.data) {
          setAnalyticsData(result.data);
          // Mark analytics as viewed for the guided checklist
          localStorage.setItem('vrmts_analytics_viewed', 'true');
        } else {
          throw new Error(result.message || 'Failed to load analytics data');
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const downloadCSV = () => {
    if (!analyticsData) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Module,Progress,Avg Score,Time Spent,Status\n";
    
    analyticsData.modulePerformance.forEach(row => {
      csvContent += `${row.module},${row.progress}%,${row.avgScore}%,${row.timeSpent},${row.status}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Student_Analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-xs text-neutral-500 font-medium tracking-tight uppercase">Processing analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !analyticsData) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-6" />
          <h2 className="text-xl font-bold mb-2 text-white tracking-tight uppercase">Data link failure</h2>
          <p className="text-neutral-500 text-sm mb-8">{error || 'Analytics data not available'}</p>
          <button
            onClick={() => navigate('/studentdashboard')}
            className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-xs font-bold text-white transition-all uppercase tracking-widest"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const maxStudyHours = Math.max(...(analyticsData.studyTime || []).map((d: any) => d.hours || 0), 1);

  const getAchievementIcon = (iconName: string) => {
    switch (iconName) {
      case 'Trophy': return Trophy;
      case 'Zap': return Zap;
      case 'Award': return Award;
      case 'Brain': return Brain;
      case 'Target': return Target;
      case 'Clock': return Clock;
      default: return Trophy;
    }
  };

  return (
    <PageLayout
      title="Analytics"
      subtitle="Your learning progress and performance"
      breadcrumbLabel="Analytics"
      activeNav="analytics"
      userType="student"
      headerRight={
        <button 
          onClick={downloadCSV}
          className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-md text-[10px] font-bold uppercase tracking-widest text-white transition-all flex items-center gap-2"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export record</span>
        </button>
      }
    >
      <div className="flex flex-wrap items-center gap-6 mb-8 p-6 bg-neutral-900 border border-neutral-800 rounded-lg">
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-neutral-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Period:</span>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white focus:border-emerald-500 focus:outline-none transition-all"
          >
            <option value="week">Past 7 days</option>
            <option value="month">Past 30 days</option>
            <option value="3months">Past quarter</option>
            <option value="year">Current year</option>
            <option value="all">Universal history</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-neutral-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Scope:</span>
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white focus:border-emerald-500 focus:outline-none transition-all"
          >
            <option value="all">Global modules</option>
            <option value="cardiovascular">Cardiovascular</option>
            <option value="nervous">Nervous system</option>
            <option value="skeletal">Skeletal structure</option>
            <option value="muscular">Muscular system</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { icon: Clock, value: `${analyticsData.overview.totalStudyTime}h`, label: 'Total Study Time', trend: <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> },
          { icon: Target, value: `${analyticsData.overview.averageScore}%`, label: 'Average Accuracy', trend: <span className="text-[8px] font-bold text-emerald-500">+5.2%</span> },
          { icon: BookOpen, value: `${analyticsData.overview.modulesCompleted}/${analyticsData.overview.totalModules}`, label: 'Modules Completed' },
          { icon: Zap, value: analyticsData.overview.currentStreak, label: 'Daily Streak' }
        ].map((stat, i) => (
          <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 rounded bg-neutral-950 border border-neutral-800">
                <stat.icon className="w-4 h-4 text-neutral-400" />
              </div>
              {stat.trend}
            </div>
            <div className="text-2xl font-bold text-white tracking-tight mb-1">{stat.value}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8">
          <h3 className="text-sm font-bold text-white uppercase tracking-tight mb-8 flex items-center gap-3">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            Score progression
          </h3>
          <div className="space-y-6">
            {analyticsData.scoreProgress.map((item, idx) => (
              <div key={idx} className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">{item.month}</span>
                  <span className="text-xs font-mono font-bold text-white">{item.score}%</span>
                </div>
                <div className="h-1 bg-neutral-950 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${item.score}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 p-4 bg-neutral-950 border border-neutral-800 rounded-lg flex items-center gap-3">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/80">A-Grade improvement detected since baseline</span>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8">
          <h3 className="text-sm font-bold text-white uppercase tracking-tight mb-8 flex items-center gap-3">
            <Activity className="w-4 h-4 text-emerald-500" />
            Weekly Engagement
          </h3>
          <div className="flex items-end justify-between gap-3 h-48 mb-8">
            {analyticsData.studyTime.map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-4 group">
                <div className="w-full flex-1 flex flex-col justify-end">
                  <div
                    className="w-full bg-neutral-800 group-hover:bg-emerald-500 transition-all rounded-t duration-500"
                    style={{ height: `${(item.hours / maxStudyHours) * 100}%` }}
                  />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-600 group-hover:text-white transition-colors">{item.day}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg">
              <div className="text-[8px] font-bold uppercase tracking-widest text-neutral-600 mb-1">Peak day</div>
              <div className="text-xs font-bold text-white uppercase">{analyticsData.learningPattern.mostActiveDay}</div>
            </div>
            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg">
              <div className="text-[8px] font-bold uppercase tracking-widest text-neutral-600 mb-1">Avg session</div>
              <div className="text-xs font-bold text-white uppercase">{analyticsData.learningPattern.avgSessionLength}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8 mb-8">
          <h3 className="text-sm font-bold text-white uppercase tracking-tight mb-8 flex items-center gap-3">
            <BarChart3 className="w-4 h-4 text-emerald-500" />
            Module Performance Summary
          </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="text-left py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-neutral-600">Module</th>
                <th className="text-left py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-neutral-600">Completion</th>
                 <th className="text-left py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-neutral-600">Avg Accuracy</th>
                <th className="text-left py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-neutral-600">Total Time</th>
                <th className="text-left py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-neutral-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/30">
              {analyticsData.modulePerformance.map((module, idx) => (
                <tr key={idx} className="group hover:bg-neutral-950/40 transition-colors">
                  <td className="py-5 px-4">
                    <div className="text-xs font-bold text-white uppercase tracking-tight">{module.module}</div>
                  </td>
                  <td className="py-5 px-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 w-24 h-1 bg-neutral-950 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${module.progress}%` }} />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-neutral-500 w-8">{module.progress}%</span>
                    </div>
                  </td>
                  <td className="py-5 px-4">
                    <span className={`text-xs font-mono font-bold ${
                      module.avgScore >= 90 ? 'text-emerald-500' :
                      module.avgScore >= 75 ? 'text-white' : 'text-neutral-500'
                    }`}>
                      {module.avgScore}%
                    </span>
                  </td>
                  <td className="py-5 px-4 text-[10px] font-bold uppercase tracking-widest text-neutral-600">{module.timeSpent}</td>
                  <td className="py-5 px-4">
                    <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded text-[8px] font-bold uppercase tracking-widest ${
                      module.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-neutral-950 text-neutral-600 border border-neutral-800'
                    }`}>
                      {module.status === 'completed' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {module.status === 'completed' ? 'Success' : 'Active'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8">
          <h3 className="text-sm font-bold text-white uppercase tracking-tight mb-8 flex items-center gap-3">
            <Target className="w-4 h-4 text-emerald-500" />
            Performance by Category
          </h3>
          <div className="space-y-6">
            {analyticsData.questionTypePerformance.map((item, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-2 text-[10px] font-bold uppercase tracking-widest">
                  <div>
                    <div className="text-white mb-1">{item.type}</div>
                    <div className="text-neutral-600">{item.correct} OUT OF {item.total} CORRECT</div>
                  </div>
                  <span className="text-white">{item.percentage}%</span>
                </div>
                <div className="h-1 bg-neutral-950 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      item.percentage >= 85 ? 'bg-emerald-500' :
                      item.percentage >= 70 ? 'bg-emerald-500/60' : 'bg-neutral-700'
                    }`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8">
          <h3 className="text-sm font-bold text-white uppercase tracking-tight mb-8 flex items-center gap-3">
            <Eye className="w-4 h-4 text-emerald-500" />
            Study Insights
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Peak Day', value: analyticsData.learningPattern.mostActiveDay },
              { label: 'Active Window', value: analyticsData.learningPattern.mostActiveTime },
              { label: 'Session Length', value: analyticsData.learningPattern.avgSessionLength },
              { label: 'Methodology', value: analyticsData.learningPattern.preferredFormat }
            ].map((pattern, idx) => (
              <div key={idx} className="p-4 bg-neutral-950 border border-neutral-800 rounded flex items-center justify-between group">
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 group-hover:text-neutral-400 transition-colors">{pattern.label}</span>
                <span className="text-xs font-bold text-white uppercase">{pattern.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8">
          <h3 className="text-sm font-bold text-white uppercase tracking-tight mb-8 flex items-center gap-3">
            <Trophy className="w-4 h-4 text-emerald-500" />
            Subject mastery
          </h3>
          <div className="space-y-4">
            {analyticsData.strengths.map((item, idx) => (
              <div key={idx} className="p-4 bg-neutral-950 border border-neutral-800 rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white uppercase tracking-tight">{item.topic}</span>
                  <span className="text-xs font-mono font-bold text-emerald-500">{item.mastery}%</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-neutral-600">
                  <span>{item.questions} VERIFIED QUERIES</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8">
          <h3 className="text-sm font-bold text-white uppercase tracking-tight mb-8 flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            Optimization targets
          </h3>
          <div className="space-y-4">
            {analyticsData.weaknesses.map((item, idx) => (
              <div key={idx} className="p-4 bg-neutral-950 border border-neutral-800 rounded">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-white uppercase tracking-tight">{item.topic}</span>
                  <span className="text-xs font-mono font-bold text-rose-500">{item.mastery}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">{item.questions} QUERIES LOGGED</span>
                  <button type="button" className="text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded text-white transition-all">
                    Initiate review
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8 mb-8">
          <h3 className="text-sm font-bold text-white uppercase tracking-tight mb-8 flex items-center gap-3">
            <Clock className="w-4 h-4 text-emerald-500" />
            Activity History
          </h3>
        <div className="space-y-3">
          {analyticsData.recentActivity.map((activity, idx) => (
            <div key={idx} className="flex gap-4 p-4 bg-neutral-950/40 border border-neutral-800/50 rounded-lg hover:border-neutral-700 transition-all group">
              <div className="w-1 h-1 rounded-full bg-emerald-500 mt-2 flex-shrink-0 group-hover:scale-125 transition-transform" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4 mb-1">
                  <span className="text-xs font-bold text-white uppercase tracking-tight">{activity.action}</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-600">{activity.date}</span>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">{activity.module}</div>
                {activity.score != null && (
                  <div className="text-[10px] font-mono font-bold text-emerald-500/80 mt-2">RESULT_SCORE: {activity.score}%{activity.time ? ` // ${activity.time}` : ''}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8 mb-8">
          <h3 className="text-sm font-bold text-white uppercase tracking-tight mb-8 flex items-center gap-3">
            <Trophy className="w-4 h-4 text-emerald-500" />
            Achievements
          </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analyticsData.achievements.map((achievement, idx) => {
            const IconComponent = getAchievementIcon(achievement.icon);
            return (
              <div
                key={idx}
                className={`p-4 rounded-lg border transition-all ${
                  achievement.unlocked ? 'bg-neutral-950 border-emerald-500/30' : 'bg-neutral-950/40 border-neutral-800/50 opacity-40 grayscale'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded bg-neutral-900 border ${achievement.unlocked ? 'border-emerald-500/50 text-emerald-500' : 'border-neutral-800 text-neutral-600'}`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${achievement.unlocked ? 'text-white' : 'text-neutral-600'}`}>
                      {achievement.name}
                    </div>
                    {achievement.unlocked && achievement.date && (
                      <div className="text-[8px] font-bold text-emerald-500/60 uppercase">{achievement.date}</div>
                    )}
                    {!achievement.unlocked && <div className="text-[8px] font-bold text-neutral-700 uppercase">ACCESS_DENIED</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </PageLayout>
  );
}