import React, { useState, useEffect, useRef } from 'react';
import { MousePointer2, Move3D, Layers, FileText, CheckCircle2, Target, X, ChevronRight } from 'lucide-react';

interface Objective {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  isComplete: boolean;
}

interface LabOrientationProps {
  onComplete: () => void;
  objectives: Objective[];
}

export const LabOrientation: React.FC<LabOrientationProps> = ({ onComplete, objectives }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const allObjectivesComplete = objectives.every(o => o.isComplete);

  useEffect(() => {
    const isFirstTime = localStorage.getItem('vrmts_lab_orientation_seen') !== 'true';
    if (isFirstTime) {
      setIsVisible(true);
    }
  }, []);

  const handleStart = () => {
    setShowWelcome(false);
    localStorage.setItem('vrmts_lab_orientation_seen', 'true');
  };

  const handleFinish = () => {
    setIsVisible(false);
    onComplete();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    e.stopPropagation();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (!isVisible) return null;

  if (showWelcome) {
    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-neutral-950/80 backdrop-blur-md animate-in fade-in duration-500">
        <div className="max-w-md w-full bg-neutral-900 border border-emerald-500/20 rounded-2xl p-8 shadow-2xl shadow-emerald-500/5 animate-in zoom-in-95 duration-500">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/20">
            <Target className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">Welcome to the Orientation Lab</h2>
          <p className="text-neutral-400 text-sm leading-relaxed mb-8">
            Before you begin your anatomical journey, let's take a quick 60-second tour of the advanced 3D exploration tools at your disposal.
          </p>
          <button 
            onClick={handleStart}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 group"
          >
            Start Orientation
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed top-24 left-8 z-[9999] w-80 animate-in slide-in-from-left-4 duration-500 pointer-events-none"
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
    >
      <div className="bg-neutral-900/95 backdrop-blur-xl border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto">
        <div 
          className="p-5 border-b border-neutral-800 flex items-center justify-between bg-emerald-500/5 cursor-move active:cursor-grabbing select-none"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold text-white uppercase tracking-widest">Lab Objectives</span>
          </div>
          <div className="text-[10px] font-mono text-emerald-500 px-2 py-0.5 bg-emerald-500/10 rounded-full">
            {objectives.filter(o => o.isComplete).length}/{objectives.length}
          </div>
        </div>
        
        <div className="p-4 space-y-3">
          {objectives.map((objective) => (
            <div 
              key={objective.id}
              className={`flex items-start gap-3 p-3 rounded-xl transition-all border ${
                objective.isComplete 
                  ? 'bg-emerald-500/5 border-emerald-500/10 opacity-60' 
                  : 'bg-neutral-950/50 border-neutral-800/50 shadow-inner'
              }`}
            >
              <div className={`mt-0.5 p-1.5 rounded-lg ${
                objective.isComplete ? 'bg-emerald-500 text-neutral-950' : 'bg-neutral-900 text-neutral-500 border border-neutral-800'
              }`}>
                {objective.isComplete ? <CheckCircle2 className="w-3.5 h-3.5" /> : <objective.icon className="w-3.5 h-3.5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[11px] font-bold leading-tight ${objective.isComplete ? 'text-emerald-500' : 'text-neutral-200'}`}>
                  {objective.label}
                </p>
                {!objective.isComplete && (
                  <p className="text-[10px] text-neutral-500 mt-1 leading-relaxed">
                    {objective.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {allObjectivesComplete && (
          <div className="p-4 bg-emerald-500/10 border-t border-emerald-500/20 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <p className="text-[11px] font-bold text-emerald-400 text-center mb-3">CONGRATULATIONS! OBJECTIVES COMPLETE</p>
            <button 
              onClick={handleFinish}
              className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold rounded-lg transition-all"
            >
              Finish Orientation
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
