import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Search, Grid3x3, List, Clock, Trophy, Lock, Play,
  CheckCircle2, BookOpen, AlertTriangle, Loader2, ChevronRight
} from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';
import { API_BASE_URL as getApiBaseUrl } from '@/lib/api';

interface Module {
  moduleId: number;
  name: string;
  category?: string;
  description: string;
  progress: number;
  status: 'in_progress' | 'completed' | 'locked' | 'not_started';
  duration?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  quizScore: number | null;
  parts: number;
  completedParts: number;
  hoursSpent?: number;
}

const API_BASE_URL = getApiBaseUrl();

// Same icon for all modules; only the icon differs by status (in progress / completed / not started / locked)
const getStatusIcon = (status: Module['status']) => {
  switch (status) {
    case 'completed': return CheckCircle2;
    case 'in_progress': return Play;
    case 'locked': return Lock;
    case 'not_started':
    default: return BookOpen;
  }
};

export default function ModulesPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('grid');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recommended');
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const statuses = [
    { id: 'all', name: 'All', count: modules.length },
    { id: 'completed', name: 'Completed', count: modules.filter(m => m.status === 'completed').length },
    { id: 'in_progress', name: 'In Progress', count: modules.filter(m => m.status === 'in_progress').length },
    { id: 'not_started', name: 'Not Started', count: modules.filter(m => m.status === 'not_started').length }
  ];

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/modules`, {
        withCredentials: true
      });

      if (response.data.success) {
        const modulesData = response.data.data.map((module: any) => ({
          ...module,
          duration: `${Math.ceil((module.parts || 10) * 0.3)}-${Math.ceil((module.parts || 10) * 0.4)} h`,
          parts: module.parts || 10,
          completedParts: module.completedParts || 0
        }));
        setModules(modulesData);
      }
    } catch (error: any) {
      console.error('Error fetching modules:', error);
      setError('Failed to load modules. Please try again.');
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartModule = async (moduleId: number, moduleName?: string) => {
    try {
      await axios.post(`${API_BASE_URL}/modules/${moduleId}/start`, {}, {
        withCredentials: true
      });
      // Check if this is LAB 1 module
      if (moduleId === 1 || (moduleName && (moduleName.toUpperCase().includes('LAB 1') || moduleName.toUpperCase().includes('LAB1')))) {
        navigate('/lab1explore');
      }
      // Check if this is LAB 2 module
      else if (moduleId === 2 || (moduleName && (moduleName.toUpperCase().includes('LAB 2') || moduleName.toUpperCase().includes('LAB2')))) {
        navigate('/lab2explore');
      } else {
        navigate(`/module/${moduleId}`);
      }
    } catch (error) {
      console.error('Error starting module:', error);
    }
  };

  const handleTakeQuiz = async (moduleId: number) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/quiz/module/${moduleId}/start`, {}, {
        withCredentials: true
      });

      if (response.data.success) {
        const { attemptId } = response.data.data;
        navigate(`/quizattempt/${attemptId}`);
      }
    } catch (error: any) {
      console.error('Error starting quiz:', error);
      if (error.response?.status === 404) {
        alert('No quiz available for this module yet.');
      } else {
        alert('Failed to start quiz. Please try again.');
      }
    }
  };

  const filteredModules = modules.filter(module => {
    const matchesStatus = filterStatus === 'all' || module.status === filterStatus;
    const matchesSearch = module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const sortedModules = [...filteredModules].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'progress':
        return b.progress - a.progress;
      case 'difficulty':
        const difficultyOrder: Record<string, number> = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
        return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
      case 'recommended':
      default:
        // Sort by in-progress first, then not-started, then completed
        const statusOrder: Record<string, number> = { 'in_progress': 1, 'not_started': 2, 'completed': 3, 'locked': 4 };
        return statusOrder[a.status] - statusOrder[b.status];
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-sm text-neutral-500 font-medium tracking-tight">Loading modules...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-6" />
          <h2 className="text-xl font-bold mb-2 text-white tracking-tight">System Access Restricted</h2>
          <p className="text-neutral-500 text-sm mb-8">{error}</p>
          <button
            onClick={fetchModules}
            className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-sm font-bold text-white transition-all"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <PageLayout
      title="Learning modules"
      subtitle="Human anatomy — interactive 3D"
      breadcrumbLabel="Modules"
      activeNav="modules"
      userType="student"
    >
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600" />
          <input
            type="text"
            placeholder="Search learning modules"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-md pl-9 pr-3 py-2 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-700 transition-all"
          />
        </div>
        <div className="flex items-center p-1 bg-neutral-900 border border-neutral-800 rounded-md">
          {statuses.map(status => (
            <button
              key={status.id}
              onClick={() => setFilterStatus(status.id)}
              className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all rounded ${filterStatus === status.id
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-500 hover:text-neutral-300'
                }`}
            >
              {status.name} <span className="text-[8px] opacity-40">({status.count})</span>
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400 focus:outline-none focus:border-neutral-700"
        >
          <option value="recommended">Sort: recommended</option>
          <option value="name">Sort: name</option>
          <option value="progress">Sort: progress</option>
          <option value="difficulty">Sort: difficulty</option>
        </select>
        <div className="flex p-1 bg-neutral-900 border border-neutral-800 rounded-md">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-neutral-800 text-white' : 'text-neutral-600 hover:text-neutral-400'}`}
            aria-label="Grid view"
          >
            <Grid3x3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-neutral-800 text-white' : 'text-neutral-600 hover:text-neutral-400'}`}
            aria-label="List view"
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Modules Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedModules.map(module => (
            <ModuleCard key={module.moduleId} module={module} onStart={handleStartModule} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {sortedModules.map(module => (
            <ModuleListItem key={module.moduleId} module={module} onStart={handleStartModule} />
          ))}
        </div>
      )}

      {filteredModules.length === 0 && (
        <div className="text-center py-24 border-2 border-dashed border-neutral-900 rounded-lg">
          <Search className="w-10 h-10 mx-auto mb-4 text-neutral-800" />
          <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-1">No modules found</h3>
          <p className="text-xs text-neutral-700 font-medium">Refine search parameters or filters</p>
        </div>
      )}
    </PageLayout>
  );
}

function ModuleCard({ module, onStart }: { module: Module; onStart: (id: number, name?: string) => void }) {
  const IconComponent = getStatusIcon(module.status);
  const getDifficultyColor = (d: string) =>
    d === 'beginner' ? 'text-emerald-500' : d === 'intermediate' ? 'text-amber-500' : d === 'advanced' ? 'text-rose-500' : 'text-neutral-500';

  const statusLabel = module.status === 'in_progress' ? 'In progress' : module.status === 'completed' ? 'Success' : module.status === 'locked' ? 'Locked' : 'Available';
  const statusClass = module.status === 'in_progress' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : module.status === 'completed' ? 'bg-emerald-500/20 text-emerald-600' : 'bg-neutral-950 text-neutral-600 border border-neutral-800';

  return (
    <div
      className={`relative border rounded-lg p-6 transition-all ${module.status === 'locked'
        ? 'bg-neutral-900 border-neutral-800 opacity-40 grayscale'
        : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 cursor-pointer shadow-sm hover:shadow-md'
        }`}
      onClick={() => module.status !== 'locked' && onStart(module.moduleId, module.name)}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 rounded bg-neutral-950 border border-neutral-800 flex items-center justify-center text-neutral-500">
            <IconComponent className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white truncate tracking-tight uppercase">{module.name}</h3>
            <span className={`inline-block mt-1.5 text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${statusClass}`}>{statusLabel}</span>
          </div>
        </div>
      </div>

      <p className="text-neutral-500 text-xs font-medium mb-6 line-clamp-2 leading-relaxed">{module.description}</p>

      <div className="flex items-center gap-5 mb-6 text-[10px] font-bold uppercase tracking-widest text-neutral-600">
        <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{module.duration ?? '—'}</span>
        <span className={getDifficultyColor(module.difficulty)}>{module.difficulty}</span>
        <span>{module.completedParts}/{module.parts} UNIT</span>
      </div>

      {module.status !== 'locked' && (
        <div className="space-y-6">
          <div>
            <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-neutral-700 mb-2">
              <span>Progression</span>
              <span>{module.progress}%</span>
            </div>
            <div className="h-1 bg-neutral-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${module.progress}%` }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            {module.quizScore !== null ? (
              <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-neutral-500">
                <Trophy className="w-3 h-3 text-amber-500" />
                <span>Peak: {module.quizScore}%</span>
              </div>
            ) : <div />}
            <button
              className="px-6 py-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-md text-[9px] font-bold uppercase tracking-widest text-white transition-all flex items-center gap-2 group/btn"
              onClick={(e) => { e.stopPropagation(); module.status !== 'locked' && onStart(module.moduleId, module.name); }}
            >
              {module.status === 'completed' ? 'Review' : module.status === 'in_progress' ? 'Resume' : 'Begin'}
              <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ModuleListItem({ module, onStart }: { module: Module; onStart: (id: number, name?: string) => void }) {
  const IconComponent = getStatusIcon(module.status);
  const getDifficultyColor = (d: string) =>
    d === 'beginner' ? 'text-emerald-500' : d === 'intermediate' ? 'text-amber-500' : d === 'advanced' ? 'text-rose-500' : 'text-neutral-500';

  const statusLabel = module.status === 'in_progress' ? 'Active' : module.status === 'completed' ? 'Success' : module.status === 'locked' ? 'Locked' : 'Available';
  const statusClass = module.status === 'in_progress' ? 'bg-emerald-500/10 text-emerald-500' : module.status === 'completed' ? 'bg-emerald-500/20 text-emerald-600' : 'text-neutral-600';

  return (
    <div
      className={`flex items-center gap-8 border rounded-lg p-5 transition-all ${module.status === 'locked'
        ? 'bg-neutral-900 border-neutral-800 opacity-40 grayscale'
        : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 cursor-pointer shadow-sm'
        }`}
      onClick={() => module.status !== 'locked' && onStart(module.moduleId, module.name)}
    >
      <div className="flex-shrink-0 w-11 h-11 rounded bg-neutral-950 border border-neutral-800 flex items-center justify-center text-neutral-500">
        <IconComponent className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-4 flex-wrap">
          <h3 className="text-sm font-bold text-white tracking-tight uppercase">{module.name}</h3>
          <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-current opacity-60 ${statusClass}`}>{statusLabel}</span>
        </div>
        <p className="text-neutral-500 text-xs font-medium mt-1.5 line-clamp-1">{module.description}</p>
      </div>

      <div className="flex items-center gap-8">
        <div className="hidden lg:flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-neutral-600 min-w-48">
          <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{module.duration ?? '—'}</span>
          <span className={getDifficultyColor(module.difficulty)}>{module.difficulty}</span>
          <span>{module.completedParts}/{module.parts} UNIT</span>
        </div>

        {module.status !== 'locked' && (
          <div className="flex items-center gap-8">
            <div className="hidden sm:block w-32 flex-shrink-0">
              <div className="h-1 bg-neutral-950 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${module.progress}%` }}
                />
              </div>
            </div>
            <span className="hidden sm:block text-[10px] font-mono font-bold text-neutral-500 w-8">{module.progress}%</span>
            <button
              className="flex-shrink-0 px-6 py-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-md text-[9px] font-bold uppercase tracking-widest text-white transition-all flex items-center gap-2 group/btn"
              onClick={(e) => { e.stopPropagation(); module.status !== 'locked' && onStart(module.moduleId, module.name); }}
            >
              {module.status === 'completed' ? 'Review' : module.status === 'in_progress' ? 'Resume' : 'Begin'}
              <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}

        {module.status === 'locked' && (
          <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-neutral-700">
            <Lock className="w-3.5 h-3.5" />
            <span>Prerequisites</span>
          </div>
        )}
      </div>
    </div>
  );
}