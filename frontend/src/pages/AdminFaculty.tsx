import React, { useState, useEffect } from 'react';
import { Shield, UserPlus, Trash2, RefreshCw } from 'lucide-react';
import { PageLayout } from '../components/PageLayout';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/admin';

export default function AdminFaculty() {
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/teachers`, { withCredentials: true });
      setTeachers(res.data.data);
    } catch (error) {
      console.error('Failed to fetch faculty:', error);
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
    { key: 'audit' as const, label: 'Audit Logs', path: '/admin/audit' },
  ];

  return (
    <PageLayout
      title="Faculty Directory"
      subtitle="Manage academic staff and accounts"
      breadcrumbLabel="Faculty"
      userType="admin"
      navItems={navItems}
      activeNav="faculty"
      isWide={true}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-[0.2em]">Faculty Members</h3>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-lg text-xs font-bold uppercase tracking-widest text-white transition-all shadow-lg"
          >
            <UserPlus className="w-4 h-4 text-purple-500" />
            Add Faculty Member
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teachers.map((t: any) => (
              <div key={t.teacherId} className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 group hover:border-neutral-700 transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 rounded-bl-full border-l border-b border-purple-500/10 pointer-events-none" />
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-inner">
                    <Shield className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white tracking-tight">{t.name}</h4>
                    <div className="text-[10px] text-purple-400/80 font-bold uppercase tracking-widest">{t.department}</div>
                  </div>
                </div>
                <div className="space-y-3 pt-4 border-t border-neutral-800">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-neutral-600">
                    <span>Role</span>
                    <span className="text-neutral-400">Instructor</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-neutral-600">
                    <span>Account Status</span>
                    <span className="text-emerald-500">Active</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-8">
                  <button className="flex-1 py-2 bg-neutral-950 border border-neutral-800 rounded text-[9px] font-bold uppercase tracking-widest text-neutral-500 hover:text-white hover:border-neutral-700 transition-all">Edit Account</button>
                  <button className="p-2 bg-neutral-950 border border-neutral-800 rounded text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/50 transition-all border shadow-sm"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && <CreateFacultyModal onClose={() => setShowCreateModal(false)} onRefresh={fetchData} />}
    </PageLayout>
  );
}

function CreateFacultyModal({ onClose, onRefresh }: any) {
  const [form, setForm] = useState({ name: '', email: '', department: '', password: '' });
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await axios.post(`${API_BASE_URL}/faculty`, form, { withCredentials: true });
      onRefresh();
      onClose();
    } catch (err) {
      alert('Failed to commission faculty');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-950/90 backdrop-blur-md flex items-center justify-center z-[200] p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-xl w-full p-10 space-y-8 animate-in slide-in-from-bottom-10 duration-500">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Shield className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-xl font-bold text-white tracking-tighter uppercase">Add Faculty Member</h3>
          <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest mt-2">Create a new instructor account</p>
        </div>
        <div className="space-y-4">
          <input className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-4 text-sm outline-none focus:border-purple-500/50" placeholder="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          <input className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-4 text-sm outline-none focus:border-purple-500/50" placeholder="Email Address" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          <input className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-4 text-sm outline-none focus:border-purple-500/50" type="password" placeholder="Initial Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
          <select className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-4 text-sm outline-none focus:border-purple-500/50" value={form.department} onChange={e => setForm({...form, department: e.target.value})}>
            <option value="">Select Department...</option>
            <option value="Anatomy & Physiology">Anatomy & Physiology</option>
            <option value="Neuroscience">Neuroscience</option>
            <option value="Clinical Sciences">Clinical Sciences</option>
          </select>
        </div>
        <div className="flex gap-4">
          <button onClick={handleCreate} disabled={!form.name || !form.email || !form.department || !form.password || saving} className="flex-1 py-4 bg-purple-600 rounded-lg text-white font-bold uppercase text-[10px] tracking-widest shadow-xl">
            {saving ? 'Creating Account...' : 'Add Member'}
          </button>
          <button onClick={onClose} className="px-10 py-4 bg-neutral-800 rounded-lg text-neutral-400 font-bold uppercase text-[10px] tracking-widest">Cancel</button>
        </div>
      </div>
    </div>
  );
}
