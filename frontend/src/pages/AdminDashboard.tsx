import React, { useState, useEffect } from 'react';
import { Activity, Server, RefreshCw, BookOpen, Users, UserPlus } from 'lucide-react';
import { PageLayout } from '../components/PageLayout';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/admin';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/stats`, { withCredentials: true });
      setStats(res.data.stats);
      setRecentActivity(res.data.recentActivity);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const navItems = [
    { key: 'dashboard' as const, label: 'Overview', path: '/admindashboard' },
    { key: 'students' as const, label: 'Students', path: '/admin/students' },
    { key: 'faculty' as const, label: 'Faculty', path: '/admin/faculty' },
    { key: 'announcements' as const, label: 'Announcements', path: '/admin/announcements' },
    { key: 'audit' as const, label: 'Audit Logs', path: '/admin/audit' },
  ];

  const statCards = [
    { label: 'Total Students', value: stats?.totalStudents || 0, icon: Users, color: 'text-blue-500' },
    { label: 'Total Faculty', value: stats?.totalFaculty || 0, icon: UserPlus, color: 'text-purple-500' },
    { label: 'Active Modules', value: stats?.totalModules || 0, icon: BookOpen, color: 'text-emerald-500' },
    { label: 'Recent Activity', value: stats?.recentActions || 0, icon: Activity, color: 'text-amber-500' },
  ];

  return (
    <PageLayout
      title="Admin Dashboard"
      subtitle="System overview and performance metrics"
      breadcrumbLabel="Overview"
      userType="admin"
      navItems={navItems}
      activeNav="dashboard"
      isWide={true}
    >
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-10 animate-in fade-in duration-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((card, i) => (
              <div key={i} className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 hover:border-neutral-700 transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-lg bg-neutral-950 border border-neutral-800 ${card.color}`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                  <button onClick={fetchData} className="text-neutral-600 hover:text-white transition-all">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-3xl font-bold text-white tracking-tighter mb-1">{card.value}</div>
                <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest leading-none">{card.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-neutral-900/50 border border-neutral-800 rounded-xl p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10 scale-150 rotate-12 pointer-events-none transition-transform group-hover:scale-[1.8]">
                <Server className="w-32 h-32 text-emerald-500" />
              </div>
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-[0.2em] mb-10 flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                System Health
              </h3>
              <div className="space-y-5">
                {[
                  { name: 'API Server', status: 'Operational', performance: '99.9%', latency: '24ms' },
                  { name: 'Database', status: 'Optimal', performance: '100%', latency: '2ms' },
                  { name: 'CDN', status: 'Operational', performance: '98.5%', latency: '45ms' },
                  { name: 'Storage', status: 'Stable', performance: '94.2%', latency: '12ms' },
                ].map((srv, i) => (
                  <div key={i} className="bg-neutral-950/50 border border-neutral-800 rounded-lg p-5 flex items-center justify-between hover:border-neutral-700 transition-colors">
                    <div className="flex items-center gap-4">
                       <div className="text-sm font-bold text-white tracking-tight">{srv.name}</div>
                    </div>
                    <div className="flex gap-10 items-center">
                      <div className="text-right">
                        <div className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest mb-1">Health</div>
                        <div className="text-xs font-bold text-emerald-500">{srv.status}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest mb-1">Latency</div>
                        <div className="text-xs font-bold text-neutral-400 font-mono">{srv.latency}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-8 shadow-inner">
               <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-[0.2em] mb-10">Resource Usage</h3>
               <div className="space-y-8">
                  {[
                    { label: 'CPU Usage', value: stats?.system?.cpu || 0, color: 'bg-emerald-500' },
                    { label: 'Memory', value: stats?.system?.memory || 0, color: 'bg-blue-500' },
                    { label: 'Network', value: stats?.system?.network || 0, color: 'bg-purple-500' },
                    { label: 'Disk Usage', value: stats?.system?.disk || 0, color: 'bg-amber-500' },
                  ].map((sys, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3">
                        <span>{sys.label}</span>
                        <span className="text-neutral-300 font-mono">{sys.value}%</span>
                      </div>
                      <div className="h-1 bg-neutral-950 rounded-full overflow-hidden border border-neutral-900">
                        <div className={`h-full ${sys.color} transition-all duration-1000`} style={{ width: `${sys.value}%` }} />
                      </div>
                    </div>
                  ))}
               </div>
               <button className="w-full mt-12 py-3.5 bg-neutral-950 border border-neutral-800 rounded-lg text-[9px] font-bold text-neutral-500 uppercase tracking-[0.2em] hover:text-white hover:border-neutral-600 transition-all shadow-lg active:scale-95">
                 Run Diagnostics
               </button>
            </div>
          </div>
          
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-8">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-[0.2em] mb-6">Recent Administrative Activity</h3>
            <div className="space-y-4">
              {recentActivity.map((log: any) => (
                <div key={log.logId} className="flex items-center justify-between py-3 border-b border-neutral-800/50 last:border-0">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[10px] font-bold text-neutral-400">
                      {log.adminName?.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white tracking-tight">{log.action}</div>
                      <div className="text-[10px] text-neutral-500 uppercase tracking-widest">{log.adminName} • {new Date(log.timestamp).toLocaleTimeString()}</div>
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest">
                    {log.entityType}
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <div className="text-center py-6 text-neutral-600 text-xs font-bold uppercase tracking-widest">No recent activity detected</div>
              )}
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}