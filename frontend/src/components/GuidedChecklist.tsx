import React from 'react';
import { BookOpen, Trophy, BarChart3, CheckCircle2, Zap } from 'lucide-react';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  done: boolean;
  action: () => void;
}

interface GuidedChecklistProps {
  items: ChecklistItem[];
  userName: string;
}

export const GuidedChecklist: React.FC<GuidedChecklistProps> = ({ items, userName }) => {
  const allDone = items.every(item => item.done);
  
  if (allDone) return null;

  const completedCount = items.filter(i => i.done).length;
  const progressPercent = (completedCount / items.length) * 100;

  return (
    <section className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-8 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-inner">
            <Zap className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight leading-none mb-1.5">
              Welcome to your journey, {userName}
            </h3>
            <p className="text-xs text-neutral-500 font-medium uppercase tracking-widest">
              Guided Orientation Program • {completedCount} of {items.length} Tasks
            </p>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Efficiency Level</div>
          <div className="w-48 h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
            <div 
              className="h-full bg-emerald-500 transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(16,185,129,0.5)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((item) => (
          <div 
            key={item.id}
            onClick={item.action}
            className={`group relative flex flex-col p-6 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden ${
              item.done 
                ? 'bg-neutral-900/40 border-emerald-500/20 opacity-60' 
                : 'bg-neutral-900 border-neutral-800 hover:border-emerald-500/40 hover:bg-neutral-800/50 hover:shadow-lg hover:shadow-emerald-500/5'
            }`}
          >
            {item.done && (
              <div className="absolute top-0 right-0 p-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
            )}
            
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-colors ${
              item.done ? 'bg-emerald-500 text-neutral-950' : 'bg-neutral-950 text-neutral-400 border border-neutral-800 group-hover:bg-emerald-500/10 group-hover:text-emerald-500'
            }`}>
              <item.icon className="w-5 h-5" />
            </div>
            
            <h4 className={`font-bold text-sm mb-2 tracking-tight ${item.done ? 'text-emerald-500 line-through decoration-emerald-500/40 decoration-2' : 'text-neutral-100'}`}>
              {item.title}
            </h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              {item.description}
            </p>
            
            {!item.done && (
              <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                Execute Action <Zap className="w-3 h-3" />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
