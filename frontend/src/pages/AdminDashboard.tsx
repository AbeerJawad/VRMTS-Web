import React, { useState, useEffect } from 'react';
import { RefreshCw, BookOpen, Bell, CheckCircle, AlertTriangle } from 'lucide-react';
import { PageLayout } from '../components/PageLayout';
import axios from 'axios';
import { API_ADMIN_BASE_URL } from '@/lib/api';

const API_BASE_URL = API_ADMIN_BASE_URL;

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [announcement, setAnnouncement] = useState({ title: '', message: '', type: 'info' });
  const [announcing, setAnnouncing] = useState(false);

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

  const handleSendAnnouncement = async () => {
    if (!announcement.title || !announcement.message) return;
    setAnnouncing(true);
    try {
      await axios.post(`${API_BASE_URL}/announce`, announcement, { withCredentials: true });
      alert('Announcement sent successfully');
      setAnnouncement({ title: '', message: '', type: 'info' });
      fetchData(); // Refresh activity to show the announcement log
    } catch (err) {
      alert('Failed to send announcement');
    } finally {
      setAnnouncing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const navItems = [
    { key: 'dashboard' as const, label: 'Overview', path: '/admindashboard' },
    { key: 'students' as const, label: 'Students', path: '/admin/students' },
    { key: 'faculty' as const, label: 'Faculty', path: '/admin/faculty' },
    { key: 'audit' as const, label: 'Audit Logs', path: '/admin/audit' },
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


          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-8 shadow-inner">
               <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-[0.2em] mb-10">System Resources</h3>
               <div className="space-y-8">
                  {[
                    { label: 'CPU Usage', value: stats?.system?.cpu || 0, color: 'bg-emerald-500' },
                    { label: 'Memory', value: stats?.system?.memory || 0, color: 'bg-blue-500' },
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

            <div className="lg:col-span-2 bg-neutral-900/50 border border-neutral-800 rounded-xl p-8">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-[0.2em] mb-6">Action Log</h3>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-8 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Bell className="w-24 h-24 text-amber-500" />
              </div>
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-[0.2em] flex items-center gap-3">
                <Bell className="w-4 h-4 text-amber-500" />
                System Announcement
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">Title</label>
                  <input 
                    type="text" 
                    placeholder="Important Update..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs text-neutral-200 outline-none focus:border-emerald-500/50"
                    value={announcement.title}
                    onChange={e => setAnnouncement({...announcement, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">Message</label>
                  <textarea 
                    rows={3}
                    placeholder="Enter message details..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs text-neutral-200 outline-none focus:border-emerald-500/50 resize-none"
                    value={announcement.message}
                    onChange={e => setAnnouncement({...announcement, message: e.target.value})}
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">Type</label>
                    <select 
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-200 outline-none focus:border-emerald-500/50"
                      value={announcement.type}
                      onChange={e => setAnnouncement({...announcement, type: e.target.value})}
                    >
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="success">Success</option>
                      <option value="reminder">Reminder</option>
                    </select>
                  </div>
                  <div className="flex items-end flex-1">
                    <button 
                      onClick={handleSendAnnouncement}
                      disabled={!announcement.title || !announcement.message || announcing}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:grayscale rounded text-neutral-950 font-bold uppercase text-[9px] tracking-widest transition-all"
                    >
                      {announcing ? 'Sending...' : 'Announce'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-[0.2em]">Preview</h3>
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 relative overflow-hidden shadow-inner min-h-[180px]">
                <div className={`absolute top-0 left-0 w-1 h-full ${
                  announcement.type === 'info' ? 'bg-blue-500' :
                  announcement.type === 'warning' ? 'bg-amber-500' :
                  announcement.type === 'success' ? 'bg-emerald-500' :
                  'bg-neutral-400'
                }`} />
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-sm font-bold text-white tracking-tight">{announcement.title || 'Announcement Title'}</h4>
                  <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest">Preview</span>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed whitespace-pre-wrap italic">
                  {announcement.message || 'Your announcement content will appear here...'}
                </p>
                <div className="mt-6 pt-3 border-t border-neutral-900 flex justify-between items-center text-[9px] font-bold uppercase tracking-widest">
                  <span className="text-neutral-600">To: All Active Users</span>
                  {announcement.title && announcement.message && (
                    <span className="text-emerald-500 flex items-center gap-1.5 animate-pulse"><CheckCircle className="w-3 h-3" /> System Ready</span>
                  )}
                </div>
              </div>
              <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-4 flex gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <p className="text-[9px] font-bold text-amber-500/70 uppercase tracking-widest leading-relaxed">
                  Caution: Announcements are instant and permanent.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}