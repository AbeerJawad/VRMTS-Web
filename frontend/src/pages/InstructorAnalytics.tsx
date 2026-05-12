import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BarChart3, TrendingUp, Clock, Trophy, Target, Calendar, Download, Filter, Brain, Zap, BookOpen, Activity, Eye, CheckCircle2, XCircle, AlertCircle, TrendingDown, Award, Loader2, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';
import { API_BASE_URL as getApiBaseUrl } from '@/lib/api';

const API_BASE_URL = getApiBaseUrl;

interface Overview {
  totalStudents: number;
  avgGrade: number;
  modulesAssigned: number;
  completionRate: number;
  totalStudyHours: number;
}

interface PerformanceTrend {
  month: string;
  score: number;
}

interface ModuleBreakdown {
  name: string;
  completion: number;
  avgScore: number;
}

interface BatchPerformance {
  name: string;
  students: number;
  avgPerformance: number;
  completionRate: number;
}

interface AnalyticsData {
  overview: Overview;
  performanceTrend: PerformanceTrend[];
  moduleBreakdown: ModuleBreakdown[];
  batchPerformance: BatchPerformance[];
}

export default function InstructorAnalytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const downloadCSV = () => {
    if (!data) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Module,Completion,Avg Score\n";
    
    data.moduleBreakdown.forEach(row => {
      csvContent += `${row.name},${row.completion}%,${row.avgScore}%\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Class_Analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/instructor/class-analytics`, { withCredentials: true });
      if (response.data.success) {
        setData(response.data.data);
      } else {
        setError(response.data.message);
      }
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.response?.data?.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 85) return 'text-emerald-500';
    if (score >= 70) return 'text-cyan-400';
    if (score >= 60) return 'text-amber-500';
    return 'text-rose-500';
  };

  if (loading) {
    return (
      <PageLayout 
        title="Class Analytics" 
        subtitle="Loading performance data..." 
        breadcrumbLabel="Analytics"
        activeNav="analytics" 
        userType="instructor"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
        </div>
      </PageLayout>
    );
  }

  if (error || !data) {
    return (
      <PageLayout 
        title="Class Analytics" 
        subtitle="Error loading data" 
        breadcrumbLabel="Analytics"
        activeNav="analytics" 
        userType="instructor"
      >
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h3 className="text-white font-bold mb-2 uppercase tracking-tight">Failed to load analytics</h3>
          <p className="text-neutral-500 text-sm mb-6">{error || 'Unknown error occurred'}</p>
          <button onClick={fetchAnalytics} className="px-6 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded text-[10px] font-bold uppercase tracking-widest text-white transition-all">
            Retry Connection
          </button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Class Analytics"
      subtitle="Comprehensive overview of student performance and engagement"
      breadcrumbLabel="Analytics"
      activeNav="analytics"
      userType="instructor"
    >
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 hover:border-neutral-700 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg group-hover:border-emerald-500/30 transition-colors">
              <Users className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 uppercase">
              <ArrowUpRight className="w-3.5 h-3.5" />
              12%
            </div>
          </div>
          <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest mb-1">Total Students</p>
          <h4 className="text-2xl font-bold text-white tracking-tight">{data.overview.totalStudents}</h4>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 hover:border-neutral-700 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg group-hover:border-cyan-500/30 transition-colors">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-cyan-400 uppercase">
              <Activity className="w-3.5 h-3.5" />
              Active
            </div>
          </div>
          <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest mb-1">Avg class Grade</p>
          <h4 className={`text-2xl font-bold tracking-tight ${getPerformanceColor(data.overview.avgGrade)}`}>
            {Math.round(data.overview.avgGrade)}%
          </h4>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 hover:border-neutral-700 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg group-hover:border-amber-500/30 transition-colors">
              <Target className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 uppercase">
              <TrendingUp className="w-3.5 h-3.5" />
              High
            </div>
          </div>
          <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest mb-1">Completion Rate</p>
          <h4 className="text-2xl font-bold text-white tracking-tight">{Math.round(data.overview.completionRate)}%</h4>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 hover:border-neutral-700 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg group-hover:border-purple-500/30 transition-colors">
              <Clock className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-purple-400 uppercase">
              <Zap className="w-3.5 h-3.5" />
              Engaged
            </div>
          </div>
          <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest mb-1">Total Study Hours</p>
          <h4 className="text-2xl font-bold text-white tracking-tight">{Math.round(data.overview.totalStudyHours)}h</h4>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Performance Trend Chart */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-white font-bold uppercase tracking-tight text-sm">Performance Trend</h3>
              <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest mt-1">Average score across last 6 months</p>
            </div>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          
          <div className="flex items-end justify-between gap-2 h-48 mb-4">
            {data.performanceTrend.map((item, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                <div className="relative w-full">
                  <div 
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-t-lg group-hover:border-emerald-500/50 transition-all"
                    style={{ height: `${item.score}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-950 border border-neutral-800 px-2 py-1 rounded text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      {Math.round(item.score)}%
                    </div>
                  </div>
                </div>
                <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest">{item.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Batch Comparison */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-white font-bold uppercase tracking-tight text-sm">Batch Comparison</h3>
              <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest mt-1">Performance by class batch</p>
            </div>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>

          <div className="space-y-6">
            {data.batchPerformance.map((batch, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-white uppercase tracking-tight">{batch.name}</span>
                  <div className="flex items-center gap-4 text-[10px] font-bold">
                    <span className="text-neutral-500 italic">{batch.students} Students</span>
                    <span className={getPerformanceColor(batch.avgPerformance)}>{Math.round(batch.avgPerformance)}% AVG</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-1000"
                    style={{ width: `${batch.avgPerformance}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Module performance Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-8 py-6 border-b border-neutral-800 bg-neutral-900/50 flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold uppercase tracking-tight text-sm">Module Performance Overview</h3>
            <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest mt-1">Detailed breakdown by assigned module</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={downloadCSV}
              className="px-4 py-2 bg-neutral-950 border border-neutral-800 rounded text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-white transition-all flex items-center gap-2"
            >
              <Download className="w-3 h-3" />
              Download CSV
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-neutral-950">
                <th className="px-8 py-4 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Module Name</th>
                <th className="px-8 py-4 text-[10px] font-bold text-neutral-500 uppercase tracking-widest text-center">Completion</th>
                <th className="px-8 py-4 text-[10px] font-bold text-neutral-500 uppercase tracking-widest text-center">Avg Quiz Score</th>
                <th className="px-8 py-4 text-[10px] font-bold text-neutral-500 uppercase tracking-widest text-center">Participation Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {data.moduleBreakdown.map((module, i) => (
                <tr key={i} className="hover:bg-neutral-800/30 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-neutral-950 border border-neutral-800 rounded-lg flex items-center justify-center text-emerald-500">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-white uppercase tracking-tight">{module.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-neutral-950 rounded-full border border-neutral-800 overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${module.completion}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-white">{Math.round(module.completion)}%</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={`text-xs font-bold ${getPerformanceColor(module.avgScore)}`}>
                      {Math.round(module.avgScore)}%
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={`px-2 py-1 rounded text-[8px] font-bold uppercase tracking-widest border ${
                      module.completion > 80 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 
                      module.completion > 40 ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' :
                      'bg-amber-500/10 border-amber-500/20 text-amber-500'
                    }`}>
                      {module.completion > 80 ? 'HIGH' : module.completion > 40 ? 'MODERATE' : 'DEVELOPING'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageLayout>
  );
}
