import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Sparkles,
    Upload,
    ArrowLeft,
    Save,
    Trash2,
    CheckCircle,
    List,
    Type,
    AlignLeft,
    Loader2
} from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';

type CreationMode = 'selection' | 'manual' | 'pdf' | 'ai';
type QuestionType = 'mcq' | 'short' | 'blank';

interface Question {
    id: string;
    type: QuestionType;
    question: string;
    options?: string[];
    correctAnswer?: string;
    points: number;
}

interface ModuleOption {
    moduleId: number;
    title: string;
}

interface StagedQuestion {
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    difficulty: string;
    approved: boolean;
}

const API_BASE_URL = 'http://localhost:8080/api';

export default function CreateQuiz() {
    const navigate = useNavigate();
    const [mode, setMode] = useState<CreationMode>('selection');
    const [quizTitle, setQuizTitle] = useState('');
    const [selectedModule, setSelectedModule] = useState('');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [moduleList, setModuleList] = useState<ModuleOption[]>([]);
    const [isLoadingModules, setIsLoadingModules] = useState(false);
    
    // Quiz Config State
    const [isTimed, setIsTimed] = useState(true);
    const [timeLimit, setTimeLimit] = useState(30);
    const [passingScore, setPassingScore] = useState(60);
    const [quizDescription, setQuizDescription] = useState('');
    const [isComprehensive, setIsComprehensive] = useState(false);

    // AI Generation State
    const [aiStep, setAiStep] = useState<'config' | 'generating' | 'review'>('config');
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiConfig, setAiConfig] = useState({
        labNum: 1,
        count: 10,
        difficulty: 'medium',
        topicHint: ''
    });
    const [ragResult, setRagResult] = useState<{ quizId: number, totalQuestions: number } | null>(null);
    const [stagedQuestions, setStagedQuestions] = useState<StagedQuestion[]>([]);
    const [showRagQuestions, setShowRagQuestions] = useState(false);

    useEffect(() => {
        const fetchModules = async () => {
            try {
                setIsLoadingModules(true);
                const response = await axios.get(`${API_BASE_URL}/modules/all`, {
                    withCredentials: true
                });
                if (response.data.success) {
                    setModuleList(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching modules:', error);
            } finally {
                setIsLoadingModules(false);
            }
        };

        fetchModules();
    }, []);

    // Auto-select module based on Lab Number in AI mode
    useEffect(() => {
        if (moduleList.length > 0 && mode === 'ai') {
            const labPrefix = `Lab ${aiConfig.labNum}`;
            const matchingModule = moduleList.find(m => 
                m.title.startsWith(labPrefix) || m.title.includes(labPrefix)
            );
            if (matchingModule) {
                setSelectedModule(matchingModule.moduleId.toString());
            }
        }
    }, [aiConfig.labNum, moduleList, mode]);

    const instructorNav = [
        { key: 'dashboard' as const, label: 'Dashboard', path: '/instructordashboard' },
        { key: 'students' as const, label: 'Students', path: '/instructor/students' },
        { key: 'modules' as const, label: 'Modules', path: '/modules' },
        { key: 'quiz' as const, label: 'Quiz', path: '/instructor/create-quiz' },
        { key: 'analytics' as const, label: 'Analytics', path: '/studentanalytics' },
    ];

    const addQuestion = (type: QuestionType) => {
        const newQuestion: Question = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            question: '',
            points: 1,
            options: type === 'mcq' ? ['', '', '', ''] : undefined,
        };
        setQuestions([...questions, newQuestion]);
    };

    const removeQuestion = (id: string) => {
        setQuestions(questions.filter(q => q.id !== id));
    };

    const updateQuestion = (id: string, updates: Partial<Question>) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
    };

    const handleCreateQuiz = async () => {
        if (!quizTitle || !selectedModule || questions.length === 0) {
            alert("Please provide a title, select a module, and add at least one question.");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                title: quizTitle,
                description: quizDescription || `Custom quiz for ${moduleList.find(m => m.moduleId === parseInt(selectedModule))?.title || 'selected module'}`,
                moduleId: parseInt(selectedModule),
                questions: questions.map(q => ({
                    question: q.question,
                    type: q.type,
                    options: q.options,
                    correctAnswer: q.correctAnswer,
                    points: q.points
                })),
                timeLimit: isTimed ? (timeLimit || 0) : 0,
                passingScore: passingScore || 60,
                isComprehensive: isComprehensive
            };

            const response = await axios.post(`${API_BASE_URL}/quiz/create`, payload, {
                withCredentials: true
            });

            if (response.data.success) {
                alert("Quiz published successfully!");
                navigate('/instructordashboard');
            }
        } catch (error: any) {
            console.error('Error creating quiz:', error);
            alert(error.response?.data?.message || "Failed to publish quiz. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGenerateAI = async () => {
        if (!aiConfig.labNum) {
            alert("Please select a source lab.");
            return;
        }

        if (!selectedModule) {
            alert("Please select a target module.");
            return;
        }

        setIsGenerating(true);
        setAiStep('generating');
        setStagedQuestions([]);
        
        try {
            const response = await axios.post(`${API_BASE_URL}/quiz/preview-rag-questions`, {
                labNumber: aiConfig.labNum,
                questionCount: aiConfig.count
            }, {
                withCredentials: true
            });

            if (response.data.success) {
                const questions = response.data.data.map((q: any) => ({
                    id: Math.random().toString(36).substr(2, 9),
                    ...q,
                    approved: true
                }));
                setStagedQuestions(questions);
                setAiStep('review');
            } else {
                alert(response.data.message || "Failed to generate questions.");
                setAiStep('config');
            }
        } catch (error: any) {
            console.error('Error generating AI questions:', error);
            alert(error.response?.data?.message || "Critical error during generation. Please try again.");
            setAiStep('config');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateMoreAI = async () => {
        setIsGenerating(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/quiz/preview-rag-questions`, {
                labNumber: aiConfig.labNum,
                questionCount: aiConfig.count
            }, {
                withCredentials: true
            });

            if (response.data.success) {
                const additionalQuestions = response.data.data.map((q: any) => ({
                    id: Math.random().toString(36).substr(2, 9),
                    ...q,
                    approved: true
                }));
                setStagedQuestions((prev) => [...prev, ...additionalQuestions]);
            }
        } catch (error: any) {
            console.error('Error generating more AI questions:', error);
            alert("Failed to generate additional questions.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePublishFromStaging = async () => {
        const approved = stagedQuestions.filter(q => q.approved);
        if (approved.length === 0) {
            alert("Please approve at least one question.");
            return;
        }

        let effectiveModuleId = selectedModule;
        
        // If selectedModule is still empty, attempt one last auto-resolve
        if (!effectiveModuleId && moduleList.length > 0) {
            const labPrefix = `Lab ${aiConfig.labNum}`;
            const matchingModule = moduleList.find(m => 
                m.title.startsWith(labPrefix) || m.title.includes(labPrefix)
            );
            if (matchingModule) {
                effectiveModuleId = matchingModule.moduleId.toString();
                setSelectedModule(effectiveModuleId);
            }
        }

        if (!effectiveModuleId) {
            alert(`Target module for Lab ${aiConfig.labNum} not found. Please select it manually.`);
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                title: quizTitle || `Lab ${aiConfig.labNum} Assessment`,
                description: quizDescription || `AI-generated quiz for lab ${aiConfig.labNum}`,
                moduleId: parseInt(effectiveModuleId),
                questions: approved.map(q => ({
                    question: q.question,
                    type: 'mcq' as const,
                    options: q.options,
                    correctAnswer: q.options[q.correctIndex],
                    points: 1
                })),
                timeLimit: isTimed ? (timeLimit || 0) : 0,
                passingScore: passingScore || 60,
                isComprehensive: isComprehensive
            };

            const response = await axios.post(`${API_BASE_URL}/quiz/create`, payload, {
                withCredentials: true
            });

            if (response.data.success) {
                setRagResult(response.data);
                setAiStep('config');
                setStagedQuestions([]);
            }
        } catch (error: any) {
            console.error('Error publishing quiz:', error);
            alert(error.response?.data?.message || "Failed to publish quiz.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderSelection = () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12 text-blue-50">
            <button
                onClick={() => setMode('manual')}
                className="bg-neutral-900 border border-neutral-800 rounded-lg p-10 text-center hover:border-emerald-500/50 hover:bg-neutral-950 transition-all group"
            >
                <div className="w-16 h-16 bg-neutral-950 border border-neutral-800 rounded-lg flex items-center justify-center mx-auto mb-6 group-hover:bg-emerald-500/10 transition-colors">
                    <Type className="w-8 h-8 text-neutral-400 group-hover:text-emerald-500 transition-colors" />
                </div>
                <h3 className="text-xl font-bold mb-3 uppercase tracking-tight">Manual Entry</h3>
                <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed">Create MCQs, short questions, and fill-in-the-blanks yourself.</p>
            </button>

            <button
                onClick={() => setMode('pdf')}
                className="bg-neutral-900 border border-neutral-800 rounded-lg p-10 text-center hover:border-emerald-500/50 hover:bg-neutral-950 transition-all group"
            >
                <div className="w-16 h-16 bg-neutral-950 border border-neutral-800 rounded-lg flex items-center justify-center mx-auto mb-6 group-hover:bg-emerald-500/10 transition-colors">
                    <Upload className="w-8 h-8 text-neutral-400 group-hover:text-emerald-500 transition-colors" />
                </div>
                <h3 className="text-xl font-bold mb-3 uppercase tracking-tight">Upload PDF</h3>
                <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed">Upload a document and we'll extract questions from it.</p>
            </button>

            <button
                onClick={() => setMode('ai')}
                className="bg-neutral-900 border border-neutral-800 rounded-lg p-10 text-center hover:border-emerald-500/50 hover:bg-neutral-950 transition-all group"
            >
                <div className="w-16 h-16 bg-neutral-950 border border-neutral-800 rounded-lg flex items-center justify-center mx-auto mb-6 group-hover:bg-emerald-500/10 transition-colors">
                    <Sparkles className="w-8 h-8 text-neutral-400 group-hover:text-emerald-500 transition-colors" />
                </div>
                <h3 className="text-xl font-bold mb-3 uppercase tracking-tight">AI Generated</h3>
                <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed">Generate a comprehensive quiz using AI based on your topic.</p>
            </button>
        </div>
    );

    const renderManualMode = () => (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Quiz Title</label>
                        <input
                            type="text"
                            value={quizTitle}
                            onChange={(e) => setQuizTitle(e.target.value)}
                            placeholder="e.g. Cardiovascular System Essentials"
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-neutral-200 text-sm font-bold uppercase tracking-tight focus:outline-none focus:border-emerald-500/50 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Target Module</label>
                        <select
                            value={selectedModule}
                            onChange={(e) => setSelectedModule(e.target.value)}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-neutral-200 text-sm font-bold uppercase tracking-tight focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none"
                        >
                            <option value="">{isLoadingModules ? 'Loading...' : 'Select a module'}</option>
                            {moduleList.map((mod) => (
                                <option key={mod.moduleId} value={mod.moduleId}>
                                    {mod.title}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Quiz Description</label>
                    <textarea
                        value={quizDescription}
                        onChange={(e) => setQuizDescription(e.target.value)}
                        placeholder="Provide a brief description of the quiz goals..."
                        rows={2}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-neutral-200 text-xs font-medium focus:outline-none focus:border-emerald-500/50 transition-colors resize-none"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3">Quiz Type</label>
                        <div className="flex bg-neutral-950 border border-neutral-800 rounded-lg p-1">
                            <button
                                onClick={() => setIsTimed(true)}
                                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded transition-all ${isTimed ? 'bg-emerald-500 text-neutral-950 shadow-lg' : 'text-neutral-500 hover:text-neutral-300'}`}
                            >
                                Timed
                            </button>
                            <button
                                onClick={() => setIsTimed(false)}
                                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded transition-all ${!isTimed ? 'bg-emerald-500 text-neutral-950 shadow-lg' : 'text-neutral-500 hover:text-neutral-300'}`}
                            >
                                Untimed
                            </button>
                        </div>
                    </div>

                    <div className={isTimed ? 'opacity-100' : 'opacity-30 pointer-events-none'}>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3">Time Limit (Mins)</label>
                        <input
                            type="number"
                            min={1}
                            value={timeLimit}
                            onChange={(e) => setTimeLimit(parseInt(e.target.value) || 0)}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-neutral-200 text-sm font-bold focus:outline-none focus:border-emerald-500/50 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3">Passing Score (%)</label>
                        <input
                            type="number"
                            min={1}
                            max={100}
                            value={passingScore}
                            onChange={(e) => setPassingScore(parseInt(e.target.value) || 0)}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-neutral-200 text-sm font-bold focus:outline-none focus:border-emerald-500/50 transition-colors"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-neutral-800/50">
                    <button
                        onClick={() => setIsComprehensive(!isComprehensive)}
                        className={`w-12 h-6 rounded-full transition-all relative ${isComprehensive ? 'bg-emerald-500' : 'bg-neutral-800'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isComprehensive ? 'left-7' : 'left-1'}`}></div>
                    </button>
                    <div>
                        <label className="block text-sm font-bold text-neutral-200 uppercase tracking-tight">Mark as Comprehensive Exam</label>
                        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">This will list the quiz in the "Comprehensive" section for students.</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {questions.map((q, index) => (
                    <div key={q.id} className="bg-neutral-900 border border-neutral-800 rounded-lg p-8 relative group">
                        <button
                            onClick={() => removeQuestion(q.id)}
                            className="absolute top-6 right-6 p-2 text-neutral-600 hover:text-rose-500 transition-colors"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                        <div className="flex items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-4">
                                <span className="w-8 h-8 bg-neutral-950 border border-neutral-800 rounded text-xs font-bold text-neutral-400 flex items-center justify-center">
                                    {index + 1}
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                                    {q.type === 'mcq' ? 'Multiple Choice' : q.type === 'short' ? 'Short Question' : 'Fill in the Blank'}
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <label className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest">Points:</label>
                                <input 
                                    type="number"
                                    min={1}
                                    value={q.points}
                                    onChange={(e) => updateQuestion(q.id, { points: parseInt(e.target.value) || 1 })}
                                    className="w-12 bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-[10px] font-bold text-emerald-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                                />
                            </div>
                        </div>

                        <input
                            type="text"
                            value={q.question}
                            onChange={(e) => updateQuestion(q.id, { question: e.target.value })}
                            placeholder="Enter your question here..."
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-4 text-neutral-200 mb-6 focus:outline-none focus:border-emerald-500/50 text-sm font-bold uppercase tracking-tight"
                        />

                        {q.type === 'mcq' && q.options && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                {q.options.map((opt, optIdx) => (
                                    <div key={optIdx} className="flex gap-3">
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                value={opt}
                                                onChange={(e) => {
                                                    const newOpts = [...q.options!];
                                                    newOpts[optIdx] = e.target.value;
                                                    updateQuestion(q.id, { options: newOpts });
                                                }}
                                                placeholder={`Option ${optIdx + 1}`}
                                                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-200 focus:outline-none focus:border-emerald-500/50"
                                            />
                                        </div>
                                        <button
                                            onClick={() => updateQuestion(q.id, { correctAnswer: opt })}
                                            className={`px-4 rounded-lg border transition-all ${q.correctAnswer === opt && opt !== ''
                                                ? 'bg-emerald-500 text-neutral-950 border-emerald-500'
                                                : 'bg-neutral-950 border-neutral-800 text-neutral-600 hover:text-neutral-400 box-content'
                                                }`}
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {(q.type === 'short' || q.type === 'blank') && (
                            <input
                                type="text"
                                value={q.correctAnswer}
                                onChange={(e) => updateQuestion(q.id, { correctAnswer: e.target.value })}
                                placeholder="Enter correct answer (for auto-grading)..."
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-200 focus:outline-none focus:border-emerald-500/50"
                            />
                        )}
                    </div>
                ))}
            </div>

            <div className="flex gap-4 justify-center py-10 border border-dashed border-neutral-800 rounded-lg bg-neutral-900/50">
                <button
                    onClick={() => addQuestion('mcq')}
                    className="flex items-center gap-3 px-6 py-3 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 rounded text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-white transition-colors"
                >
                    <List className="w-4 h-4" /> Add MCQ
                </button>
                <button
                    onClick={() => addQuestion('short')}
                    className="flex items-center gap-3 px-6 py-3 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 rounded text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-white transition-colors"
                >
                    <AlignLeft className="w-4 h-4" /> Add Short Question
                </button>
                <button
                    onClick={() => addQuestion('blank')}
                    className="flex items-center gap-3 px-6 py-3 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 rounded text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-white transition-colors"
                >
                    <Type className="w-4 h-4" /> Add Fill-in-the-Blank
                </button>
            </div>

            <div className="flex justify-end gap-4 mt-12">
                <button
                    onClick={() => setMode('selection')}
                    className="px-8 py-3 bg-neutral-950 text-neutral-500 hover:text-white rounded border border-neutral-800 text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-900 transition-all"
                >
                    Discard Changes
                </button>
                <button
                    onClick={handleCreateQuiz}
                    disabled={isSubmitting || !quizTitle || questions.length === 0}
                    className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 rounded text-[10px] font-bold uppercase tracking-[0.2em] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Publish Quiz
                </button>
            </div>
        </div>
    );

    const renderPDFMode = () => (
        <div className="max-w-xl mx-auto mt-12 text-center">
            <div className="bg-neutral-900 border border-dashed border-neutral-800 rounded-lg p-12 transition-all hover:border-emerald-500/30">
                <div className="w-20 h-20 bg-neutral-950 border border-neutral-800 rounded-lg flex items-center justify-center mx-auto mb-6">
                    <Upload className="w-10 h-10 text-neutral-400" />
                </div>
                <h3 className="text-xl font-bold mb-3 uppercase tracking-tight">Upload your PDF document</h3>
                <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest mb-8 leading-relaxed">We'll analyze the content and generate relevant questions automatically.</p>

                <label className="cursor-pointer">
                    <input type="file" className="hidden" accept=".pdf" />
                    <span className="px-10 py-3 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 rounded text-[10px] font-bold uppercase tracking-[0.2em] inline-block transition-all shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                        Select File
                    </span>
                </label>
                <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest mt-6">Supported format: .pdf (Max 10MB)</p>
            </div>

            <button
                onClick={() => setMode('selection')}
                className="mt-8 text-neutral-500 hover:text-white flex items-center justify-center gap-2 mx-auto transition-colors text-[10px] font-bold uppercase tracking-widest"
            >
                <ArrowLeft className="w-4 h-4" /> Selection mode
            </button>
        </div>
    );

    const renderAIMode = () => (
        <div className="max-w-4xl mx-auto mt-12">
            {aiStep === 'config' && (
                <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-10">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold uppercase tracking-tight">AI Quiz Configuration</h3>
                            <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest">Set your parameters for automated question generation.</p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3">Quiz Title</label>
                            <input 
                                type="text"
                                value={quizTitle}
                                onChange={(e) => setQuizTitle(e.target.value)}
                                placeholder={`e.g. Lab ${aiConfig.labNum} Comprehensive Quiz`}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded px-4 py-3 text-neutral-200 text-sm font-bold uppercase tracking-tight focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-neutral-800"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3">Select Source Lab</label>
                                <select 
                                    value={aiConfig.labNum}
                                    onChange={(e) => setAiConfig({...aiConfig, labNum: parseInt(e.target.value)})}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-4 py-3 text-neutral-200 text-sm font-bold uppercase tracking-tight focus:outline-none focus:border-emerald-500/50 appearance-none transition-all"
                                >
                                    {[1,2,3,4,5,6,7,8,9,10].map(n => (
                                        <option key={n} value={n}>Lab {n}: {
                                            n === 1 ? 'Anatomical Language' :
                                            n === 2 ? 'Bones & Markings' :
                                            n === 3 ? 'Spinal Cord' :
                                            n === 4 ? 'Brain & Nerves' :
                                            n === 5 ? 'Special Senses' :
                                            n === 6 ? 'Muscles' :
                                            n === 7 ? 'Heart & Vessels' :
                                            n === 8 ? 'Respiratory' :
                                            n === 9 ? 'Digestive' : 'Urinary/Repro'
                                        }</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3">Target Module</label>
                                <select 
                                    value={selectedModule}
                                    onChange={(e) => setSelectedModule(e.target.value)}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-4 py-3 text-neutral-200 text-sm font-bold uppercase tracking-tight focus:outline-none focus:border-emerald-500/50 appearance-none transition-all"
                                >
                                    <option value="">{isLoadingModules ? 'Loading...' : 'Select Target Module'}</option>
                                    {moduleList.map((m) => (
                                        <option key={m.moduleId} value={m.moduleId}>{m.title}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3">Question Count (Max 20)</label>
                                <input 
                                    type="number" 
                                    min={1} 
                                    max={20}
                                    value={aiConfig.count}
                                    onChange={(e) => setAiConfig({...aiConfig, count: Math.min(20, parseInt(e.target.value) || 1)})}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-4 py-3 text-neutral-200 text-sm font-bold uppercase tracking-tight focus:outline-none focus:border-emerald-500/50 transition-all" 
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3">Difficulty Level</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['easy', 'medium', 'hard'].map((d) => (
                                        <button
                                            key={d}
                                            onClick={() => setAiConfig({...aiConfig, difficulty: d})}
                                            className={`py-2 text-[10px] font-bold uppercase tracking-widest border transition-all rounded ${
                                                aiConfig.difficulty === d 
                                                ? 'bg-emerald-500 border-emerald-500 text-neutral-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                                                : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                                            }`}
                                        >
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3">Topic Hint / Specific Coverage (Optional)</label>
                            <textarea
                                rows={3}
                                value={aiConfig.topicHint}
                                onChange={(e) => setAiConfig({...aiConfig, topicHint: e.target.value})}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded px-4 py-4 text-neutral-200 text-sm font-bold uppercase tracking-tight focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-neutral-800"
                                placeholder="e.g. Focus on cranial nerves VII and X, or specific anatomical structures..."
                            />
                        </div>

                        <div className="flex justify-end">
                            <button 
                                onClick={handleGenerateAI}
                                className="w-full md:w-auto px-10 py-4 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 rounded text-[10px] font-bold uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center justify-center gap-3"
                            >
                                <Sparkles className="w-4 h-4" />
                                Generate Questions
                            </button>
                        </div>

                        {ragResult && (
                            <div className="mt-8 p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-lg animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                                        <CheckCircle className="w-5 h-5 text-neutral-950" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold uppercase tracking-tight text-emerald-500">Quiz Published Successfully!</h4>
                                        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-0.5">Your assessment is now live in your dashboard.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-neutral-950 border border-neutral-800 p-4 rounded">
                                        <span className="block text-[8px] font-bold text-neutral-600 uppercase tracking-[0.2em] mb-1">Quiz ID</span>
                                        <span className="text-xl font-mono font-bold text-neutral-200">{ragResult.quizId}</span>
                                    </div>
                                    <div className="bg-neutral-950 border border-neutral-800 p-4 rounded">
                                        <span className="block text-[8px] font-bold text-neutral-600 uppercase tracking-[0.2em] mb-1">Questions</span>
                                        <span className="text-xl font-bold text-neutral-200">{ragResult.totalQuestions}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate('/instructordashboard')}
                                    className="w-full px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 rounded text-[10px] font-bold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                                >
                                    Finish & Go to Dashboard
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {aiStep === 'generating' && (
                <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-20 text-center">
                    <div className="relative w-24 h-24 mx-auto mb-8">
                        <div className="absolute inset-0 border-4 border-emerald-500/10 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="w-8 h-8 text-emerald-500 animate-pulse" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold uppercase tracking-tight mb-4">AI is Processing</h3>
                    <p className="text-neutral-500 text-xs font-bold uppercase tracking-[0.3em] max-w-sm mx-auto leading-relaxed">
                        Reading lab manual content for <span className="text-emerald-500">Lab {aiConfig.labNum}</span> and formulating questions...
                    </p>
                </div>
            )}

            {aiStep === 'review' && (
                <div className="space-y-6 max-w-5xl mx-auto mt-12 pb-20">
                    <div className="flex items-center justify-between mb-8 sticky top-0 py-4 bg-[#0a0a0a] z-10 border-b border-neutral-800">
                        <div>
                            <h3 className="text-2xl font-bold uppercase tracking-tight">{quizTitle || `Lab ${aiConfig.labNum} Assessment`}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest">
                                    {stagedQuestions.filter(q => q.approved).length} of {stagedQuestions.length} questions approved
                                </span>
                                <span className="w-1 h-1 rounded-full bg-neutral-800"></span>
                                <span className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest">
                                    Target: {moduleList.find(m => m.moduleId === parseInt(selectedModule))?.title || 'No Module Selected'}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={handleGenerateMoreAI}
                                disabled={isGenerating}
                                className="px-6 py-3 bg-neutral-950 border border-neutral-800 rounded text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-white transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                Generate More
                            </button>
                            <button
                                onClick={handlePublishFromStaging}
                                disabled={isSubmitting || stagedQuestions.filter(q => q.approved).length === 0}
                                className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 rounded text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Publish Final Quiz
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {stagedQuestions.map((q, idx) => (
                            <div 
                                key={q.id} 
                                className={`bg-neutral-900 border transition-all rounded-lg p-6 group ${
                                    q.approved ? 'border-emerald-500/40 opacity-100 shadow-[0_0_20px_rgba(16,185,129,0.05)]' : 'border-neutral-800 opacity-50 grayscale scale-[0.98]'
                                }`}
                            >
                                <div className="flex gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="w-6 h-6 rounded bg-neutral-950 border border-neutral-800 text-[10px] font-bold text-neutral-400 flex items-center justify-center">
                                                {idx + 1}
                                            </span>
                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${q.approved ? 'text-emerald-500/80' : 'text-neutral-600'}`}>
                                                AI Generated • {q.difficulty || 'medium'}
                                            </span>
                                        </div>
                                        
                                        <input
                                            type="text"
                                            value={q.question}
                                            onChange={(e) => {
                                                const newQuestions = [...stagedQuestions];
                                                newQuestions[idx].question = e.target.value;
                                                setStagedQuestions(newQuestions);
                                            }}
                                            className="w-full bg-neutral-950/50 border border-transparent hover:border-neutral-800 rounded p-4 text-neutral-200 text-sm font-bold uppercase tracking-tight focus:outline-none focus:border-emerald-500/30 transition-all mb-4"
                                        />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                            {(q.options || []).map((opt: string, optIdx: number) => (
                                                <button
                                                    key={optIdx} 
                                                    type="button"
                                                    onClick={() => {
                                                        const newQuestions = [...stagedQuestions];
                                                        newQuestions[idx].correctIndex = optIdx;
                                                        setStagedQuestions(newQuestions);
                                                    }}
                                                    className={`px-4 py-3 rounded text-[10px] font-semibold tracking-wide border transition-all flex justify-between items-center gap-3 text-left ${
                                                        q.correctIndex === optIdx 
                                                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500' 
                                                        : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                                                    }`}
                                                >
                                                    <div className="flex gap-2 flex-1 items-center">
                                                        <span className="text-[10px] font-bold opacity-80 mt-0.5">
                                                            {String.fromCharCode(65 + optIdx)}.
                                                        </span>
                                                        <input
                                                            type="text"
                                                            value={opt}
                                                            onChange={(e) => {
                                                                const newQuestions = [...stagedQuestions];
                                                                const nextOptions = [...(newQuestions[idx].options || [])];
                                                                nextOptions[optIdx] = e.target.value;
                                                                newQuestions[idx].options = nextOptions;
                                                                setStagedQuestions(newQuestions);
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="w-full bg-transparent text-inherit leading-relaxed focus:outline-none"
                                                        />
                                                    </div>
                                                    {q.correctIndex === optIdx && <CheckCircle className="w-3 h-3 flex-shrink-0" />}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="bg-neutral-950/50 rounded-lg p-4 border border-neutral-800/50">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${q.approved ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-neutral-800'}`}></div>
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Context & AI Rationale</span>
                                            </div>
                                            <p className="text-[10px] text-neutral-600 italic leading-relaxed">
                                                {q.explanation || "No explanation provided for this question."}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col gap-2 justify-center pt-10">
                                        <button
                                            onClick={() => {
                                                const newQuestions = [...stagedQuestions];
                                                newQuestions[idx].approved = true;
                                                setStagedQuestions(newQuestions);
                                            }}
                                            className={`p-4 rounded-lg border transition-all ${
                                                q.approved 
                                                ? 'bg-emerald-500 border-emerald-500 text-neutral-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                                                : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:text-white hover:border-neutral-700'
                                            }`}
                                        >
                                            <CheckCircle className="w-6 h-6" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                const newQuestions = [...stagedQuestions];
                                                newQuestions[idx].approved = false;
                                                setStagedQuestions(newQuestions);
                                            }}
                                            className={`px-3 py-2 rounded border text-[8px] font-bold uppercase tracking-[0.2em] transition-all ${
                                                !q.approved 
                                                ? 'bg-rose-500 border-rose-500 text-neutral-950' 
                                                : 'border-neutral-800 bg-neutral-950 text-neutral-500 hover:text-white hover:border-neutral-700'
                                            }`}
                                        >
                                            Reject
                                        </button>
                                        <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-center text-neutral-600 mt-2">
                                            {q.approved ? 'Approve' : 'Reject'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <PageLayout
            title="Create New Quiz"
            subtitle={
                mode === 'manual' ? "Create questions manually for your students" :
                    mode === 'pdf' ? "Convert PDF document to an interactive quiz" :
                        mode === 'ai' ? "Harness AI to build comprehensive quizzes" :
                            "Choose how you want to create your quiz"
            }
            breadcrumbLabel="Create Quiz"
            activeNav="none"
            userType="instructor"
            navItems={instructorNav}
        >
            <div className="mb-8">
                {mode !== 'selection' && (
                    <button
                        onClick={() => setMode('selection')}
                        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </button>
                )}

                {mode === 'selection' && renderSelection()}
                {mode === 'manual' && renderManualMode()}
                {mode === 'pdf' && renderPDFMode()}
                {mode === 'ai' && renderAIMode()}
            </div>
        </PageLayout>
    );
}
