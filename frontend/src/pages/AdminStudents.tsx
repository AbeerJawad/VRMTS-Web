import React, { useState, useEffect } from 'react';
import { Users, Upload, Search, UserCheck, UserX, Edit, RefreshCw } from 'lucide-react';
import { PageLayout } from '../components/PageLayout';
import axios from 'axios';
import { API_ADMIN_BASE_URL } from '@/lib/api';

const API_BASE_URL = API_ADMIN_BASE_URL;

export default function AdminStudents() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [assigningTo, setAssigningTo] = useState<any>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showCreating, setShowCreating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentsRes, teachersRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/students`, { withCredentials: true }),
        axios.get(`${API_BASE_URL}/teachers`, { withCredentials: true })
      ]);
      setStudents(studentsRes.data.data);
      setTeachers(teachersRes.data.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (userId: number, currentActive: boolean) => {
    try {
      await axios.post(`${API_BASE_URL}/update-status`, { userId, isActive: !currentActive }, { withCredentials: true });
      fetchData();
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const handleAssignTeacher = async (teacherId: number, className: string) => {
    try {
      await axios.post(`${API_BASE_URL}/assign-teacher`, {
        studentId: assigningTo.studentId,
        teacherId,
        className
      }, { withCredentials: true });
      setAssigningTo(null);
      fetchData();
    } catch (err) {
      alert('Assignment failed');
    }
  };

  const filtered = students.filter((s: any) => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.enrollmentNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const navItems = [
    { key: 'dashboard' as const, label: 'Overview', path: '/admindashboard' },
    { key: 'students' as const, label: 'Students', path: '/admin/students' },
    { key: 'faculty' as const, label: 'Faculty', path: '/admin/faculty' },
    { key: 'audit' as const, label: 'Audit Logs', path: '/admin/audit' },
  ];

  return (
    <PageLayout
      title="Manage Students"
      subtitle="View and manage student accounts"
      breadcrumbLabel="Students"
      userType="admin"
      navItems={navItems}
      activeNav="students"
      isWide={true}
    >
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input 
              type="text" 
              placeholder="Search students..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={() => setShowCreating(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-bold uppercase tracking-widest text-white transition-all shadow-lg"
            >
              <Users className="w-4 h-4" />
              Add Student
            </button>
            <button 
              onClick={() => setShowBulkUpload(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-lg text-xs font-bold uppercase tracking-widest text-white transition-all shadow-lg"
            >
              <Upload className="w-4 h-4 text-emerald-500" />
              Bulk Upload
            </button>
          </div>
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
                  <tr className="bg-neutral-950/50 border-b border-neutral-800">
                    <th className="px-6 py-4 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Student</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Enrollment</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Class</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Teacher</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-neutral-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((student: any) => (
                    <tr key={student.studentId} className="border-b border-neutral-800/50 hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="font-bold text-white tracking-tight">{student.name}</div>
                        <div className="text-[10px] text-neutral-600 font-bold uppercase tracking-wider">{student.email}</div>
                      </td>
                      <td className="px-6 py-5 font-mono text-xs text-neutral-400">{student.enrollmentNumber || 'N/A'}</td>
                      <td className="px-6 py-5 text-xs text-neutral-300">{student.className || <span className="text-neutral-600">Unassigned</span>}</td>
                      <td className="px-6 py-5">
                        {student.teacherName ? (
                          <div className="text-xs text-emerald-500/80 font-bold uppercase tracking-tight">{student.teacherName}</div>
                        ) : (
                          <button 
                            onClick={() => setAssigningTo(student)}
                            className="text-[10px] text-neutral-600 hover:text-emerald-500 font-bold uppercase tracking-widest underline underline-offset-4"
                          >
                            Assign
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${
                          student.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                        }`}>
                          {student.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2 text-neutral-500">
                           <button onClick={() => handleUpdateStatus(student.userId, student.isActive)} className="p-2 hover:bg-neutral-800 rounded transition-colors" title={student.isActive ? "Deactivate" : "Activate"}>
                            {student.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                          <button className="p-2 hover:bg-neutral-800 rounded transition-colors hover:text-emerald-500">
                            <Edit className="w-4 h-4" />
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
      </div>

      {/* Modals */}
      {showCreating && (
        <CreateStudentModal 
          onClose={() => setShowCreating(false)} 
          onRefresh={fetchData} 
        />
      )}
      {assigningTo && (
        <AssignmentModal 
          student={assigningTo} 
          teachers={teachers} 
          onAssign={handleAssignTeacher} 
          onClose={() => setAssigningTo(null)} 
        />
      )}
      {showBulkUpload && (
        <BulkUploadModal 
          onClose={() => setShowBulkUpload(false)} 
          onRefresh={fetchData} 
        />
      )}
    </PageLayout>
  );
}

function CreateStudentModal({ onClose, onRefresh }: any) {
  const [form, setForm] = useState({ name: '', email: '', enrollmentNumber: '', className: '', password: '' });
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await axios.post(`${API_BASE_URL}/student`, form, { withCredentials: true });
      onRefresh();
      onClose();
    } catch (err) {
      alert('Failed to register student');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-950/90 backdrop-blur-md flex items-center justify-center z-[200] p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-xl w-full p-10 space-y-8 animate-in slide-in-from-bottom-10 duration-500">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Users className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-xl font-bold text-white tracking-tighter uppercase">Add Individual Student</h3>
          <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest mt-2">Create a new academic record</p>
        </div>
        <div className="space-y-4">
          <input className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-4 text-sm outline-none focus:border-emerald-500/50" placeholder="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          <input className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-4 text-sm outline-none focus:border-emerald-500/50" placeholder="Email Address" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
            <input className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-4 text-sm outline-none focus:border-emerald-500/50" placeholder="Enrollment #" value={form.enrollmentNumber} onChange={e => setForm({...form, enrollmentNumber: e.target.value})} />
            <input className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-4 text-sm outline-none focus:border-emerald-500/50" placeholder="Class (e.g. B1)" value={form.className} onChange={e => setForm({...form, className: e.target.value})} />
          </div>
          <input className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-4 text-sm outline-none focus:border-emerald-500/50" type="password" placeholder="Initial Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
        </div>
        <div className="flex gap-4">
          <button onClick={handleCreate} disabled={!form.name || !form.email || !form.password || saving} className="flex-1 py-4 bg-emerald-600 rounded-lg text-white font-bold uppercase text-[10px] tracking-widest shadow-xl hover:bg-emerald-500 transition-all">
            {saving ? 'Registering...' : 'Add Student'}
          </button>
          <button onClick={onClose} className="px-10 py-4 bg-neutral-800 rounded-lg text-neutral-400 font-bold uppercase text-[10px] tracking-widest">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// Sub-components would be imported or defined here (keeping them here for brevity of the migration)
function AssignmentModal({ student, teachers, onAssign, onClose }: any) {
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [classNameInput, setClassNameInput] = useState('');

  return (
    <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-md w-full p-8 space-y-6">
        <h3 className="text-lg font-bold text-white tracking-tight uppercase">Assign Teacher: {student.name}</h3>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">Instructor</label>
            <select 
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-sm text-neutral-200 outline-none focus:border-emerald-500/50"
              onChange={(e) => setSelectedTeacher(e.target.value)}
            >
              <option value="">Select Instructor...</option>
              {teachers.map((t: any) => (
                <option key={t.teacherId} value={t.teacherId}>{t.name} ({t.department})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">Class Name</label>
            <input 
              type="text" 
              placeholder="e.g. ANAT-2024-B1"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-sm text-neutral-200 outline-none focus:border-emerald-500/50"
              onChange={(e) => setClassNameInput(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-3 pt-4">
          <button 
            onClick={() => onAssign(parseInt(selectedTeacher), classNameInput)}
            disabled={!selectedTeacher || !classNameInput}
            className="flex-1 py-3 bg-emerald-500 rounded text-neutral-950 font-bold uppercase text-[10px] tracking-widest hover:bg-emerald-400 disabled:opacity-50 transition-all font-bold"
          >
            Confirm Assignment
          </button>
          <button onClick={onClose} className="flex-1 py-3 bg-neutral-800 rounded text-neutral-400 font-bold uppercase text-[10px] tracking-widest hover:text-white transition-all">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// Re-using the BulkUploadModal logic from the previous implementation
function BulkUploadModal({ onClose, onRefresh }: any) {
  const [data, setData] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const rows = text.split('\n').filter(row => row.trim());
        const headers = rows[0].split(',').map(h => h.trim());
        const parsed = rows.slice(1).map(row => {
          const cells = row.split(',').map(c => c.trim());
          const obj: any = {};
          headers.forEach((h, i) => obj[h] = cells[i]);
          return obj;
        });
        setData(parsed);
      };
      reader.readAsText(file);
    }
  };

  const handleUpload = async () => {
    setUploading(true);
    try {
      await axios.post(`${API_BASE_URL}/bulk-upload`, { students: data }, { withCredentials: true });
      onRefresh();
      onClose();
    } catch (err) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-950/90 backdrop-blur-md flex items-center justify-center z-[200] p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-4xl w-full p-10 space-y-8 animate-in zoom-in duration-300">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-bold text-white tracking-tighter uppercase">Bulk Student Upload</h3>
            <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest mt-2">Provision multiple accounts via CSV</p>
          </div>
          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-4 max-w-xs">
            <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mb-2">Required CSV Format:</p>
            <code className="text-[10px] text-neutral-400 font-mono block bg-black/40 p-2 rounded">
              name, email, enrollmentNumber, className, password
            </code>
          </div>
        </div>
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-8 border-dashed flex flex-col items-center justify-center relative">
          <input type="file" accept=".csv" onChange={handleFile} className="absolute inset-0 opacity-0 cursor-pointer" />
          <Upload className="w-12 h-12 text-neutral-800 mb-4" />
          <p className="text-sm font-bold text-white uppercase tracking-widest">Upload CSV File</p>
        </div>
        {data.length > 0 && (
          <div className="max-h-48 overflow-y-auto border border-neutral-800 rounded-lg">
             <table className="w-full text-left text-[9px] font-bold uppercase tracking-widest">
              <thead className="sticky top-0 bg-neutral-950 text-neutral-500">
                <tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Class</th></tr>
              </thead>
              <tbody className="text-neutral-400">
                {data.slice(0, 10).map((r, i) => (
                  <tr key={i} className="border-t border-neutral-800/50"><td className="p-3">{r.name}</td><td className="p-3">{r.email}</td><td className="p-3">{r.className}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex gap-4">
          <button onClick={handleUpload} disabled={!data.length || uploading} className="flex-1 py-4 bg-emerald-500 rounded-lg text-neutral-950 font-bold uppercase text-[10px] tracking-widest shadow-xl">
            {uploading ? 'Uploading...' : 'Start Upload'}
          </button>
          <button onClick={onClose} className="px-10 py-4 bg-neutral-800 rounded-lg text-neutral-400 font-bold uppercase text-[10px] tracking-widest">Cancel</button>
        </div>
      </div>
    </div>
  );
}
