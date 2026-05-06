import React, { useState, useEffect } from 'react';
import { BookOpen, Users, Calendar, Clock, Target, ChevronRight, Plus, Save, Send, X, CheckCircle, Lock, Award, FileText, AlertCircle, Search, Filter, Edit, Trash2, Copy, Eye, Loader2 } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';
import axios from 'axios';
import { API_BASE_URL as getApiBaseUrl } from '@/lib/api';

interface Student {
  studentId: number;
  name: string;
  email: string;
  enrollmentNumber: string;
  className: string;
}

interface Module {
  moduleId: number;
  title: string;
  description: string;
  difficultyLevel: string;
}

const API_BASE_URL = getApiBaseUrl();

export default function VRMTSModuleAssignment() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [selectedModules, setSelectedModules] = useState<number[]>([]);
  const [assignmentType, setAssignmentType] = useState('class');
  const [requireQuiz, setRequireQuiz] = useState(true);
  const [lockPrerequisites, setLockPrerequisites] = useState(true);
  
  const [students, setStudents] = useState<Student[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [activeAssignments, setActiveAssignments] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [unassignTarget, setUnassignTarget] = useState<{id: number, name: string} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    fetchActiveAssignments();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [studentsRes, modulesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/instructor/my-students`, { withCredentials: true }),
        axios.get(`${API_BASE_URL}/modules/all`, { withCredentials: true })
      ]);
      
      setStudents(studentsRes.data.data || []);
      setModules(modulesRes.data.data || []);
      
      // Auto-select first class if available
      const classes = Array.from(new Set((studentsRes.data.data || []).map((s: any) => s.className).filter(Boolean)));
      if (classes.length > 0) setSelectedClass(classes[0] as string);
      
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load students and modules. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActiveAssignments = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/instructor/active-assignments`, { withCredentials: true });
      if (res.data.success) {
        setActiveAssignments(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch active assignments:', err);
    }
  };

  const handleAssign = async () => {
    if (selectedModules.length === 0) {
      alert('Please select at least one module.');
      return;
    }

    try {
      setIsAssigning(true);
      
      if (assignmentType === 'class') {
        if (!selectedClass) {
          alert('Please select a class.');
          return;
        }

        for (const moduleId of selectedModules) {
          await axios.post(`${API_BASE_URL}/instructor/assign-module-class`, {
            className: selectedClass,
            moduleId
          }, { withCredentials: true });
        }
      } else {
        if (selectedStudents.length === 0) {
          alert('Please select at least one student.');
          return;
        }

        for (const moduleId of selectedModules) {
          for (const studentId of selectedStudents) {
            await axios.post(`${API_BASE_URL}/instructor/assign-module`, {
              studentId,
              moduleId
            }, { withCredentials: true });
          }
        }
      }

      alert('Modules assigned successfully!');
      setShowCreateModal(false);
      setSelectedStudents([]);
      setSelectedModules([]);
      fetchActiveAssignments(); // Refresh the list
    } catch (err: any) {
      console.error('Assignment failed:', err);
      alert('Failed to assign modules. ' + (err.response?.data?.message || ''));
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUnassign = async (moduleId: number, moduleName: string) => {
    if (!window.confirm(`Are you sure you want to unassign "${moduleName}" from all your students? This will remove their progress records for this module.`)) {
      return;
    }

    try {
      setIsAssigning(true);
      await axios.delete(`${API_BASE_URL}/instructor/unassign-module-batch`, {
        data: { moduleId },
        withCredentials: true
      });
      
      alert('Module unassigned successfully.');
      fetchActiveAssignments(); // Refresh the list
    } catch (err: any) {
      console.error('Unassignment failed:', err);
      alert('Failed to unassign module. ' + (err.response?.data?.message || ''));
    } finally {
      setIsAssigning(false);
    }
  };

  // Extract unique classes
  const uniqueClasses = Array.from(new Set(students.map(s => s.className).filter(Boolean)));



  const toggleStudentSelection = (studentId: number) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleModuleSelection = (moduleId: number) => {
    setSelectedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: { [key: string]: string } = {
      'Beginner': 'bg-neutral-950 text-emerald-500 border-emerald-500/20',
      'Intermediate': 'bg-neutral-950 text-cyan-400 border-cyan-500/20',
      'Advanced': 'bg-neutral-950 text-purple-400 border-purple-500/20'
    };
    return colors[difficulty] || colors['Intermediate'];
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'active': 'bg-neutral-950 text-cyan-400 border-cyan-500/20',
      'completed': 'bg-neutral-950 text-emerald-500 border-emerald-500/20',
      'overdue': 'bg-neutral-950 text-rose-500 border-rose-500/20'
    };
    return colors[status] || colors['active'];
  };

  return (
    <>
      <PageLayout
        title="Module Assignment"
        subtitle="Assign learning modules to students and track progress"
        breadcrumbLabel="Modules"
        activeNav="modules"
        userType="instructor"
      >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-3 text-white tracking-tight uppercase">
            <BookOpen className="w-6 h-6 text-emerald-500" />
            Module List
          </h2>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 rounded text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/10"
        >
          <Plus className="w-4 h-4" />
          Create Assignment
        </button>
      </div>



        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Active Assignments</h3>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-white transition-all flex items-center gap-2">
                <Filter className="w-3 h-3" />
                Filter
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeAssignments.length === 0 ? (
              <div className="col-span-full py-20 bg-neutral-900 border border-dashed border-neutral-800 rounded-lg text-center">
                <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest">No active assignments found</p>
                <button onClick={() => setShowCreateModal(true)} className="mt-4 text-[10px] font-bold text-emerald-500 hover:underline uppercase tracking-widest">Initiate First Assignment</button>
              </div>
            ) : (
              activeAssignments.map((assignment) => (
                <div 
                  key={assignment.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 hover:border-emerald-500/20 transition-all group relative overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-neutral-950 border border-neutral-800 rounded text-emerald-500">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[8px] font-bold uppercase tracking-widest">
                      ACTIVE
                    </span>
                  </div>
                  
                  <h4 className="text-sm font-bold text-white tracking-tight uppercase mb-2">{assignment.module}</h4>
                  <div className="flex flex-wrap gap-4 text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-6">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      {assignment.students} STUDENTS
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {assignment.date}
                    </span>
                  </div>

                  <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
                    <button className="text-[9px] font-bold text-neutral-400 hover:text-white uppercase tracking-widest transition-colors">
                      View details
                    </button>
                    <button 
                      onClick={() => setUnassignTarget({ id: assignment.id, name: assignment.module })}
                      disabled={isAssigning}
                      className="p-1.5 hover:bg-neutral-800 rounded transition-colors text-neutral-600 hover:text-rose-500 disabled:opacity-50"
                    >
                      {isAssigning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      {showCreateModal && (
          <div className="fixed inset-0 bg-neutral-950/80 flex items-center justify-center z-50 p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto relative">
              <div className="sticky top-0 bg-neutral-900 border-b border-neutral-800 p-6 flex items-center justify-between z-10">
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight uppercase">Create New Assignment</h3>
                  <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest mt-1">Assign modules to students with custom settings</p>
                </div>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-500" />
                </button>
              </div>

              <div className="p-8 space-y-10">
                <div>
                  <h4 className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-4 flex items-center gap-3">
                    <span className="w-6 h-6 rounded bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">01</span>
                    Select Recipients
                  </h4>
                  
                  <div className="flex gap-4 mb-4">
                    <button
                      onClick={() => setAssignmentType('class')}
                      className={`flex-1 py-4 px-4 rounded border transition-all flex flex-col items-center gap-2 ${
                        assignmentType === 'class'
                          ? 'bg-neutral-950 border-emerald-500/50 text-emerald-500'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-600 hover:border-neutral-700'
                      }`}
                    >
                      <Users className="w-5 h-5" />
                      <div className="text-[10px] font-bold uppercase tracking-widest">Entire Class</div>
                    </button>
                    <button
                      onClick={() => setAssignmentType('individual')}
                      className={`flex-1 py-4 px-4 rounded border transition-all flex flex-col items-center gap-2 ${
                        assignmentType === 'individual'
                          ? 'bg-neutral-950 border-emerald-500/50 text-emerald-500'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-600 hover:border-neutral-700'
                      }`}
                    >
                      <Target className="w-5 h-5" />
                      <div className="text-[10px] font-bold uppercase tracking-widest">Individual Students</div>
                    </button>
                  </div>

                  {assignmentType === 'class' ? (
                    <div className="space-y-4">
                      <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Target Batch (Class Name)</label>
                      <select 
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="w-full px-4 py-4 bg-neutral-950 border border-neutral-800 rounded text-sm font-bold uppercase tracking-tight text-white focus:outline-none focus:border-emerald-500/50 appearance-none"
                      >
                        <option value="">Select a batch...</option>
                        {uniqueClasses.map((cls, idx) => (
                          <option key={idx} value={cls}>{cls}</option>
                        ))}
                      </select>
                      {selectedClass && (
                        <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest italic">
                          Found {students.filter(s => s.className === selectedClass).length} students in this batch.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">{selectedStudents.length} students selected</span>
                        <button 
                          onClick={() => setSelectedStudents(students.map(s => s.studentId))}
                          className="text-[10px] font-bold text-emerald-500 hover:text-emerald-400 uppercase tracking-widest"
                        >
                          Select All
                        </button>
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-2 bg-neutral-950 border border-neutral-800 rounded-lg p-3">
                        {students.map((student) => (
                          <label 
                            key={student.studentId}
                            className={`flex items-center gap-3 p-3 rounded border transition-all cursor-pointer ${
                              selectedStudents.includes(student.studentId) ? 'bg-neutral-900 border-neutral-700' : 'bg-neutral-950 border-transparent hover:bg-neutral-900'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(student.studentId)}
                              onChange={() => toggleStudentSelection(student.studentId)}
                              className="sr-only"
                            />
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              selectedStudents.includes(student.studentId) ? 'bg-emerald-500 text-neutral-950' : 'bg-neutral-800 text-neutral-500'
                            }`}>
                              {(student.name || 'ST').substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="text-[10px] font-bold text-white uppercase tracking-widest">{student.name}</div>
                              <div className="text-[9px] text-neutral-600 font-medium">{student.email}</div>
                            </div>
                            {selectedStudents.includes(student.studentId) && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-4 flex items-center gap-3">
                    <span className="w-6 h-6 rounded bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">02</span>
                    Select Modules
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {modules.map((module) => (
                      <label
                        key={module.moduleId}
                        className={`relative cursor-pointer transition-all ${
                          selectedModules.includes(module.moduleId) ? 'ring-1 ring-emerald-500 rounded-lg' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedModules.includes(module.moduleId)}
                          onChange={() => toggleModuleSelection(module.moduleId)}
                          className="sr-only"
                        />
                        <div className={`bg-neutral-950 border rounded-lg p-4 hover:border-neutral-700 transition-all ${
                          selectedModules.includes(module.moduleId) ? 'border-emerald-500/50 bg-neutral-900' : 'border-neutral-800'
                        }`}>
                          <div className="flex items-start gap-4 mb-4">
                            <div className="text-3xl text-emerald-500">📚</div>
                            <div className="flex-1">
                              <h5 className="text-[11px] font-bold text-white uppercase tracking-widest mb-1">{module.title}</h5>
                              <p className="text-[10px] text-neutral-500 font-medium line-clamp-2">{module.description}</p>
                            </div>
                            {selectedModules.includes(module.moduleId) && (
                              <div className="w-5 h-5 rounded bg-emerald-500 flex items-center justify-center">
                                <CheckCircle className="w-3 h-3 text-neutral-950" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-tight">
                            <span className={`px-2 py-0.5 rounded border ${getDifficultyColor(module.difficultyLevel)}`}>
                              {module.difficultyLevel}
                            </span>
                            <span className="text-neutral-600 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              4-5 hours
                            </span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-6 flex items-center gap-3">
                    <span className="w-6 h-6 rounded bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">03</span>
                    Parameters
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-[10px] font-bold text-white uppercase tracking-widest mb-3">Start Date</label>
                      <input
                        type="date"
                        className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded text-[10px] font-bold uppercase tracking-widest text-neutral-400 focus:outline-none focus:border-neutral-700"
                        defaultValue={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-white uppercase tracking-widest mb-3">Due Date</label>
                      <input
                        type="date"
                        className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded text-[10px] font-bold uppercase tracking-widest text-neutral-400 focus:outline-none focus:border-neutral-700"
                      />
                    </div>
                  </div>

                  <div className="mt-10 space-y-3">
                    <label className="flex items-center justify-between p-4 bg-neutral-950 border border-neutral-800 rounded hover:border-neutral-700 cursor-pointer transition-all group">
                      <div>
                        <div className="text-[10px] font-bold text-white uppercase tracking-widest group-hover:text-emerald-500 transition-colors">Lock Prerequisites</div>
                        <div className="text-[9px] text-neutral-600 font-medium">Students must complete prerequisite modules sequentially</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={lockPrerequisites}
                        onChange={(e) => setLockPrerequisites(e.target.checked)}
                        className="w-4 h-4 rounded border-neutral-800 bg-neutral-900 text-emerald-500 focus:ring-emerald-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-neutral-950 border border-neutral-800 rounded hover:border-neutral-700 cursor-pointer transition-all group">
                      <div>
                        <div className="text-[10px] font-bold text-white uppercase tracking-widest group-hover:text-emerald-500 transition-colors">Require Quiz Completion</div>
                        <div className="text-[9px] text-neutral-600 font-medium">Validation assessment required to finalize module</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={requireQuiz}
                        onChange={(e) => setRequireQuiz(e.target.checked)}
                        className="w-4 h-4 rounded border-neutral-800 bg-neutral-900 text-emerald-500 focus:ring-emerald-500"
                      />
                    </label>

                    {requireQuiz && (
                      <div className="ml-6 p-6 bg-neutral-900 border-l border-emerald-500/20 rounded-r">
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-4">Passing Score Threshold</label>
                        <div className="flex items-center gap-6">
                          <input
                            type="range"
                            min="50"
                            max="100"
                            defaultValue="70"
                            className="flex-1 accent-emerald-500 h-1.5 bg-neutral-950 rounded-full appearance-none cursor-pointer"
                          />
                          <span className="text-lg font-bold text-emerald-500 min-w-16">70%</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-4 flex items-center gap-3">
                    <span className="w-6 h-6 rounded bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">04</span>
                    Instructions
                  </h4>

                  <textarea
                    placeholder="ENTER GUIDELINES OR CUSTOM INSTRUCTIONS..."
                    rows={4}
                    className="w-full px-4 py-4 bg-neutral-950 border border-neutral-800 rounded text-[10px] font-bold uppercase tracking-widest text-neutral-400 focus:outline-none focus:border-neutral-700 resize-none"
                  ></textarea>

                  <button className="mt-4 text-[10px] font-bold text-emerald-500 hover:text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Attach Supplementary Resources
                  </button>
                </div>
              </div>

              <div className="sticky bottom-0 bg-neutral-950 border-t border-neutral-800 p-8 flex items-center justify-between">
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="px-8 py-3 bg-neutral-900 border border-neutral-800 rounded text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-white transition-all"
                >
                  Cancel
                </button>
                <div className="flex gap-4">
                  <button className="px-8 py-3 bg-neutral-900 border border-neutral-800 rounded text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-white transition-all flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Save Draft
                  </button>
                  <button 
                    onClick={handleAssign}
                    disabled={isAssigning}
                    className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-neutral-800 disabled:text-neutral-600 text-neutral-950 rounded text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/10"
                  >
                    {isAssigning ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {isAssigning ? 'Assigning...' : 'Assign Module'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </PageLayout>
      
      {/* Unassign Confirmation Modal */}
      {unassignTarget && (
        <div className="fixed inset-0 bg-neutral-950/90 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight uppercase mb-2">Unassign Module?</h3>
              <p className="text-neutral-500 text-xs font-medium leading-relaxed">
                Are you sure you want to unassign <span className="text-white font-bold">"{unassignTarget.name}"</span> from all your students? This action cannot be undone and students will lose their current progress.
              </p>
            </div>
            <div className="p-6 bg-neutral-950 border-t border-neutral-800 flex gap-4">
              <button 
                onClick={() => setUnassignTarget(null)}
                className="flex-1 py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  const target = unassignTarget;
                  setUnassignTarget(null);
                  await handleUnassign(target.id, target.name);
                }}
                className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-neutral-950 rounded text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-rose-500/10"
              >
                Confirm Unassign
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}