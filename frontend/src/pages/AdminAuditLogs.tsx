import React, { useState, useEffect } from 'react';
import { List, RefreshCw, Clock, Shield } from 'lucide-react';
import { PageLayout } from '../components/PageLayout';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/admin';

export default function AdminAuditLogs() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/logs`, { withCredentials: true });
      setLogs(res.data.data);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
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

  return (
    <PageLayout
      title="Audit Logs"
      subtitle="View administrative activity logs"
      breadcrumbLabel="Audit"
      userType="admin"
      navItems={navItems}
      activeNav="audit"
      isWide={true}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <Clock className="w-4 h-4" /> Activity Log
          </h3>
          <button onClick={fetchData} className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-500 hover:text-white transition-colors">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : (
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-950 border-b border-neutral-800">
                    <th className="px-6 py-4 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Date & Time</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Admin</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Action</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Target</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log: any) => (
                    <tr key={log.logId} className="border-b border-neutral-800/50 hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-xs text-neutral-400 font-mono tracking-tighter">{new Date(log.timestamp).toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[10px] font-bold text-neutral-400">
                            {log.userName?.charAt(0)}
                          </div>
                          <span className="text-xs font-bold text-white tracking-tight">{log.userName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="px-2 py-1 rounded-md bg-neutral-950 border border-neutral-800 text-[9px] font-bold uppercase tracking-widest text-emerald-400 shadow-sm">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest">{log.entityType || 'CORE'} (ID: {log.entityId || 'SYS'})</span>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-xs text-neutral-400 truncate max-w-sm">{log.details}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
