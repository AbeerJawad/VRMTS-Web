import React, { useState } from 'react';
import axios from 'axios';
import { MessageSquare, Search, Clock, Calendar, Brain } from 'lucide-react';

interface StudyAssistantProps {
  labId?: number;
  compact?: boolean;
}

const RAG_API_URL = 'http://localhost:8000/ask';

export const StudyAssistant: React.FC<StudyAssistantProps> = ({ labId, compact = false }) => {
  const [isAssistantExpanded, setIsAssistantExpanded] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const handleAskAI = async () => {
    if (!aiQuestion.trim()) return;
    setAiLoading(true);
    setAiAnswer('');
    try {
      // If labId is provided, prefix the question to guide the RAG system
      const query = labId ? `Lab ${labId}: ${aiQuestion}` : aiQuestion;
      
      const response = await axios.post(RAG_API_URL, {
        q: query,
        k: 6,
        use_llm: true
      });
      setAiAnswer(response.data.answer || 'No answer found.');
    } catch (err) {
      console.error('AI Error:', err);
      setAiAnswer('The AI assistant is currently offline. Please ensure the RAG server is running and try again.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className={`${compact ? 'p-4' : 'p-6'}`}>
      <div className={`flex items-center justify-between ${compact ? 'mb-4' : 'mb-6'}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-neutral-950 flex items-center justify-center border border-neutral-800">
            <MessageSquare className="w-4 h-4 text-emerald-500" />
          </div>
          <h4 className="text-sm font-bold text-neutral-200">Study Assistant</h4>
        </div>
        {isAssistantExpanded && (
          <button 
            onClick={() => {
              setIsAssistantExpanded(false);
              setAiQuestion('');
              setAiAnswer('');
            }}
            className="text-[10px] font-bold text-neutral-500 hover:text-white uppercase tracking-wider transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {!isAssistantExpanded ? (
        <>
          <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
            Have questions about your anatomy modules? Our AI assistant is here to help you study.
          </p>
          <button
            onClick={() => setIsAssistantExpanded(true)}
            className="w-full py-2 px-3 bg-neutral-950 hover:bg-neutral-800 rounded-md text-xs font-bold text-neutral-200 transition-colors border border-neutral-800 hover:border-neutral-700"
          >
            Ask a question
          </button>
        </>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div>
            <textarea
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              placeholder={labId ? `Ask about Lab ${labId}...` : "e.g., How does the aortic valve work?"}
              className="w-full h-16 bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none"
              disabled={aiLoading}
            />
          </div>

          {aiAnswer && (
            <div className="animate-in slide-in-from-top-1 duration-300">
              <div className="bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3.5 text-xs text-neutral-400 leading-relaxed max-h-48 overflow-y-auto custom-scrollbar border-l-2 border-l-emerald-500/30">
                {aiAnswer}
              </div>
            </div>
          )}

          <button
            onClick={handleAskAI}
            disabled={!aiQuestion.trim() || aiLoading}
            className={`w-full py-2.5 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 ${
              !aiQuestion.trim() || aiLoading
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {aiLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Retrieving...
              </div>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                Consult Assistant
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
