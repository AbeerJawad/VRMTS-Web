import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Download, Upload, Mail, MoreVertical, TrendingUp, TrendingDown, Clock, Target, BookOpen, Award, AlertTriangle, CheckCircle, XCircle, Eye, Edit, Trash2, Send, X, Calendar, BarChart3, Activity, MessageSquare, Loader2 } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';
import axios from 'axios';
import { API_BASE_URL as getApiBaseUrl } from '@/lib/api';

interface Activity {
  type: 'quiz' | 'study';
  module: string;
  score?: number;
  duration?: string;
  date: string;
}

interface Student {
  id: number;
  name: string;
  email: string;
  avatar: string;
  enrolled: string;
  modulesCompleted: number;
  totalModules: number;
  avgScore: number;
  lastActive: string;
  status: 'excellent' | 'good' | 'average' | 'at-risk';
  trend: 'up' | 'down' | 'neutral';
  studyTime: string;
  quizzesTaken: number;
  achievements: number;
  recentActivity: Activity[];
}

const API_BASE_URL = getApiBaseUrl;

export default function VRMTSStudentManagement() {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | Student['status']>('all');
  
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/instructor/my-students`, { withCredentials: true });
      
      const mappedStudents: Student[] = res.data.data.map((s: any) => {
        const avgScore = Math.round(s.avgScore || 0);
        let status: Student['status'] = 'average';
        if (avgScore >= 85) status = 'excellent';
        else if (avgScore >= 70) status = 'good';
        else if (avgScore < 60 && avgScore > 0) status = 'at-risk';

        return {
          id: s.studentId,
          name: s.name,
          email: s.email,
          avatar: s.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
          enrolled: s.className || 'Medical Batch 2024',
          modulesCompleted: s.modulesCompleted || 0,
          totalModules: s.totalModules || 12,
          avgScore: avgScore,
          lastActive: s.lastActive ? new Date(s.lastActive).toLocaleDateString() : 'Never',
          status: status,
          trend: 'neutral',
          studyTime: '---',
          quizzesTaken: 0,
          achievements: 0,
          recentActivity: []
        };
      });

      setStudents(mappedStudents);
    } catch (err: any) {
      console.error('Failed to fetch students:', err);
      setError('Failed to load students. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Student['status']): string => {
    const colors: Record<Student['status'], string> = {
      'excellent': 'bg-emerald-500',
      'good': 'bg-emerald-500/60',
      'average': 'bg-neutral-600',
      'at-risk': 'bg-rose-500/60'
    };
    return colors[status];
  };

  const getStatusBadge = (status: Student['status']): string => {
    const badges: Record<Student['status'], string> = {
      'excellent': 'bg-neutral-950 text-emerald-500 border-emerald-500/20',
      'good': 'bg-neutral-950 text-emerald-400 border-emerald-500/10',
      'average': 'bg-neutral-950 text-neutral-400 border-neutral-800',
      'at-risk': 'bg-neutral-950 text-rose-500 border-rose-500/10'
    };
    return badges[status];
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || student.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <PageLayout
      title="Student Management"
      subtitle="Global student registry and performance metrics"
      breadcrumbLabel="Students"
      activeNav="students"
      userType="instructor"
    >
        {/* Page Header */}
        <div className="mb-12 flex items-end justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 text-emerald-500" />
              <h2 className="text-sm font-bold text-white uppercase tracking-tight">Manage Students</h2>
            </div>
            <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest">Student Directory and performance metrics</p>
          </div>
          <div className="flex gap-4">
            <button className="px-6 py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-500 hover:text-white text-[10px] font-bold uppercase tracking-widest rounded transition-all flex items-center gap-3">
              <Download className="w-3 h-3" />
              Export
            </button>
            <button className="px-6 py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-500 hover:text-white text-[10px] font-bold uppercase tracking-widest rounded transition-all flex items-center gap-3">
              <Upload className="w-3 h-3" />
              Import
            </button>
            <button className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 text-[10px] font-bold uppercase tracking-[0.2em] rounded transition-all flex items-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <Mail className="w-3 h-3" />
              Email all
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-1 gap-3 w-full md:w-auto">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-neutral-700 transition-colors"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => {
                const statusOptions = ['all', 'excellent', 'good', 'average', 'at-risk'] as const;
                const value = e.target.value;
                if (statusOptions.includes(value as typeof statusOptions[number])) {
                  setFilterStatus(value as typeof statusOptions[number]);
                }
              }}
              className="px-4 py-2 bg-neutral-950 border border-neutral-800 rounded text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-neutral-700"
            >
              <option value="all">All Status</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="average">Average</option>
              <option value="at-risk">At Risk</option>
            </select>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-all ${viewMode === 'grid' ? 'bg-neutral-900 text-emerald-500 border border-neutral-800' : 'bg-neutral-950 text-neutral-600 border border-neutral-800 hover:text-neutral-400'}`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 12a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1v-4zM11 4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V4zM11 12a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`p-2 rounded transition-all ${viewMode === 'table' ? 'bg-neutral-900 text-emerald-500 border border-neutral-800' : 'bg-neutral-950 text-neutral-600 border border-neutral-800 hover:text-neutral-400'}`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Loading/Error State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-lg text-rose-500 text-xs font-bold uppercase tracking-widest text-center mb-8">
            {error}
          </div>
        )}

        {!loading && filteredStudents.length === 0 && (
          <div className="bg-neutral-900 border border-neutral-800 p-20 rounded-lg text-neutral-500 text-xs font-bold uppercase tracking-widest text-center mb-8">
            No students found in your registry.
          </div>
        )}

        {/* Students Grid/Table View */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 hover:border-neutral-700 transition-all cursor-pointer group"
                onClick={() => setSelectedStudent(student)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full ${getStatusColor(student.status)} flex items-center justify-center font-bold text-neutral-950`}>
                      {student.avatar}
                    </div>
                    <div>
                      <h4 className="font-bold text-white tracking-tight">{student.name}</h4>
                      <p className="text-xs text-neutral-500">{student.email}</p>
                    </div>
                  </div>
                  <button className="p-1 hover:bg-white/5 rounded transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500 font-medium">Status</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight border ${getStatusBadge(student.status)}`}>
                      {student.status.replace('-', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500 font-medium">Average Score</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{student.avgScore}%</span>
                      {student.trend === 'up' && <TrendingUp className="w-3 h-3 text-emerald-500" />}
                      {student.trend === 'down' && <TrendingDown className="w-3 h-3 text-rose-500" />}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-1.5">
                      <span>Progress</span>
                      <span>{student.modulesCompleted}/{student.totalModules} modules</span>
                    </div>
                    <div className="h-1 bg-neutral-950 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getStatusColor(student.status)}`}
                        style={{ width: `${(student.modulesCompleted / student.totalModules) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {student.lastActive}
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      {student.achievements} badges
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-neutral-800 flex gap-2">
                  <button className="flex-1 py-2 px-3 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-white transition-all flex items-center justify-center gap-2">
                    <Eye className="w-3 h-3" />
                    View
                  </button>
                  <button className="flex-1 py-2 px-3 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded text-[10px] font-bold uppercase tracking-widest text-emerald-500 transition-all flex items-center justify-center gap-2">
                    <Send className="w-3 h-3" />
                    Message
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-800">
                    <th className="text-left p-4 text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Student</th>
                    <th className="text-left p-4 text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Status</th>
                    <th className="text-left p-4 text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Avg Score</th>
                    <th className="text-left p-4 text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Progress</th>
                    <th className="text-left p-4 text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Study Time</th>
                    <th className="text-left p-4 text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Last Active</th>
                    <th className="text-left p-4 text-[10px] font-bold text-neutral-600 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/50">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-neutral-950 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${getStatusColor(student.status)} flex items-center justify-center font-bold text-[10px] text-neutral-950`}>
                            {student.avatar}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-neutral-200 group-hover:text-white transition-colors">{student.name}</div>
                            <div className="text-[10px] text-neutral-600 font-medium">{student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight border ${getStatusBadge(student.status)}`}>
                          {student.status.replace('-', ' ')}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{student.avgScore}%</span>
                          {student.trend === 'up' && <TrendingUp className="w-3 h-3 text-emerald-500" />}
                          {student.trend === 'down' && <TrendingDown className="w-3 h-3 text-rose-500" />}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="w-32">
                          <div className="flex justify-between text-[9px] font-bold text-neutral-600 uppercase tracking-widest mb-1.5">
                            <span>{student.modulesCompleted}/{student.totalModules}</span>
                          </div>
                          <div className="h-1 bg-neutral-950 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${getStatusColor(student.status)}`}
                              style={{ width: `${(student.modulesCompleted / student.totalModules) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-xs font-bold text-neutral-400">{student.studyTime}</td>
                      <td className="p-4 text-xs font-medium text-neutral-600">{student.lastActive}</td>
                      <td className="p-4">
                        <div className="flex gap-1 justify-end">
                          <button 
                            onClick={() => setSelectedStudent(student)}
                            className="p-2 hover:bg-neutral-800 rounded transition-colors text-neutral-500 hover:text-emerald-500"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 hover:bg-neutral-800 rounded transition-colors text-neutral-500 hover:text-white">
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Student Detail Modal */}
        {selectedStudent && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
              <button 
                onClick={() => setSelectedStudent(null)}
                className="absolute top-6 right-6 p-2 hover:bg-neutral-800 rounded-lg transition-colors z-10"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>

              <div className="p-8">
                {/* Modal Header */}
                <div className="flex items-center gap-6 mb-8">
                  <div className={`w-20 h-20 rounded-full ${getStatusColor(selectedStudent.status)} flex items-center justify-center text-2xl font-bold text-neutral-950`}>
                    {selectedStudent.avatar}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white tracking-tight">{selectedStudent.name}</h3>
                    <p className="text-neutral-500 font-medium">{selectedStudent.email}</p>
                    <div className="flex gap-2 mt-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight border ${getStatusBadge(selectedStudent.status)}`}>
                        {selectedStudent.status.replace('-', ' ')}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-neutral-950 text-neutral-500 border border-neutral-800 text-[10px] font-bold uppercase tracking-tight">
                        Batch 2024
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-cyan-400 mb-2">
                      <Target className="w-5 h-5" />
                      <span className="text-xs">Avg Score</span>
                    </div>
                    <div className="text-2xl font-bold">{selectedStudent.avgScore}%</div>
                  </div>
                  <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-emerald-400 mb-2">
                      <BookOpen className="w-5 h-5" />
                      <span className="text-xs">Modules</span>
                    </div>
                    <div className="text-2xl font-bold">{selectedStudent.modulesCompleted}/{selectedStudent.totalModules}</div>
                  </div>
                  <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-purple-400 mb-2">
                      <Clock className="w-5 h-5" />
                      <span className="text-xs">Study Time</span>
                    </div>
                    <div className="text-2xl font-bold">{selectedStudent.studyTime}</div>
                  </div>
                  <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-yellow-400 mb-2">
                      <Award className="w-5 h-5" />
                      <span className="text-xs">Achievements</span>
                    </div>
                    <div className="text-2xl font-bold">{selectedStudent.achievements}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-5">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-cyan-400" />
                      Recent Activity
                    </h4>
                    <div className="space-y-3">
                      {selectedStudent.recentActivity.map((activity, idx) => (
                        <div key={idx} className="flex gap-3 pb-3 border-b border-neutral-800 last:border-0">
                          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                            {activity.type === 'quiz' ? <Target className="w-4 h-4 text-cyan-400" /> : <BookOpen className="w-4 h-4 text-cyan-400" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{activity.type === 'quiz' ? 'Quiz' : 'Study Session'}</p>
                            <p className="text-xs text-neutral-500">{activity.module}</p>
                            {activity.score && <p className="text-xs text-emerald-400 font-medium">Score: {activity.score}%</p>}
                            {activity.duration && <p className="text-xs text-neutral-500">{activity.duration}</p>}
                            <p className="text-xs text-neutral-600 mt-1">{activity.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-5">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-400" />
                      Academic Support
                    </h4>
                    <p className="text-sm text-neutral-500 mb-4">
                      Use full analytics to identify weak topics and assign targeted practice modules.
                    </p>
                    <button className="w-full py-2 px-4 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 rounded-lg text-sm font-medium transition-all">
                      Open Student Analytics
                    </button>
                  </div>
                </div>

                <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-5 mt-6">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-400" />
                    Performance Overview
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-neutral-500">Quiz Performance</span>
                        <span className="font-semibold">{selectedStudent.avgScore}%</span>
                      </div>
                      <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getStatusColor(selectedStudent.status)}`}
                          style={{ width: `${selectedStudent.avgScore}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-neutral-500">Module Completion</span>
                        <span className="font-semibold">{Math.round((selectedStudent.modulesCompleted / selectedStudent.totalModules) * 100)}%</span>
                      </div>
                      <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500"
                          style={{ width: `${(selectedStudent.modulesCompleted / selectedStudent.totalModules) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                   <button className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 rounded font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" />
                    Send Message
                  </button>
                  <button className="flex-1 py-3 px-4 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg font-medium transition-all flex items-center justify-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    View Full Analytics
                  </button>
                  <button className="py-3 px-4 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-all">
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </PageLayout>
  );
}