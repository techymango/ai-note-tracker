import { useState } from 'react';
import { useStore } from '../lib/store';
import { runAnalysis } from '../lib/llm/perplexity';
import type { AIMode } from '../types';
import {
    FileText,
    AlertTriangle,
    HelpCircle,
    Brain,
    CheckSquare,
    Network,
    Sparkles,
    Loader2,
    X,
    Maximize2,
    Minimize2,
    Check
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import type { MasterDocument } from '../types';

const MODE_ICONS: Record<AIMode, React.ElementType> = {
    summary: FileText,
    contradictions: AlertTriangle,
    gaps: HelpCircle,
    mental_model: Brain,
    action_items: CheckSquare,
    connect: Network,
};

const MODE_LABELS: Record<AIMode, string> = {
    summary: 'Summarize',
    contradictions: 'Find Contradictions',
    gaps: 'Identify Gaps',
    mental_model: 'Mental Models',
    action_items: 'Action Items',
    connect: 'Connect to Doc',
};

export default function AnalysisPanel() {
    const {
        analysisConfig,
        setAnalysisConfig,
        nodes,
        settings,
        updateDocument
    } = useStore();

    // Local state for analysis execution
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    // Filter nodes based on scope
    const getTargetNodes = () => {
        if (analysisConfig.scope === 'selection') {
            return nodes.filter(n => n.selected);
        }
        return nodes; // 'all' or 'view' (view not impl yet, treat as all)
    };

    const handleAnalyze = async () => {
        const targetNodes = getTargetNodes();
        if (targetNodes.length === 0) {
            setResult("No notes selected. Please select notes or switch to 'All Notes'.");
            return;
        }

        setIsAnalyzing(true);
        setResult(null);
        setIsExpanded(true); // Auto expand to show result

        try {
            // Prepare content
            const content = targetNodes.map(n =>
                `Note (${new Date(n.data.createdAt).toLocaleDateString()}): ${n.data.content}`
            ).join('\n\n---\n\n');

            // If "connect", we might need special handling if we want to update the doc directly
            // For now, let's just run the analysis and show it. 
            // If mode is connect, we might want to actually *execute* the update.
            // But the user requested "AI Insight Modes" which implies "seeing" the insight.
            // Let's keep it simple: Show the insight.

            const response = await runAnalysis(content, analysisConfig.mode, settings);
            setResult(response);
        } catch (error: any) {
            setResult(`Error: ${error.message || 'Analysis failed'}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleApplyConnect = async () => {
        if (!result) return;
        try {
            // Robust JSON parsing logic
            let jsonStr = result || '';
            if (jsonStr.includes('```')) {
                const match = jsonStr.match(/```(?:json)?([\s\S]*?)```/);
                if (match) jsonStr = match[1];
            }
            const parsed = JSON.parse(jsonStr);
            console.log("Parsed Update:", parsed);

            if (parsed.sections) {
                const newDoc: MasterDocument = {
                    sections: parsed.sections,
                    lastUpdated: Date.now()
                };
                await updateDocument(newDoc);
                setResult(null); // Close panel
                // Optional: Show success toast or visual cue
            }
        } catch (e) {
            console.error("Failed to apply changes", e);
            alert("Failed to apply changes. Invalid JSON format.");
        }
    };

    const ModeIcon = MODE_ICONS[analysisConfig.mode];

    // Connect Mode Result View
    const renderConnectResult = () => {
        try {
            // Robust JSON parsing logic
            let jsonStr = result || '';
            // If wrapped in code blocks, extract
            if (jsonStr.includes('```')) {
                const match = jsonStr.match(/```(?:json)?([\s\S]*?)```/);
                if (match) jsonStr = match[1];
            }
            const parsed = JSON.parse(jsonStr);

            return (
                <div className="space-y-4">
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-200">
                        <p className="font-semibold mb-1 flex items-center gap-2">
                            <Sparkles size={14} />
                            Proposed Updates
                        </p>
                        {parsed.summary_of_changes}
                    </div>

                    <div className="space-y-2">
                        <h4 className="text-xs font-medium text-zinc-500 uppercase">New Document Structure</h4>
                        {parsed.sections?.map((s: any) => (
                            <div key={s.id} className="p-2 bg-zinc-800/50 rounded border border-zinc-700/50">
                                <div className="text-sm font-medium text-zinc-300">{s.title}</div>
                                <div className="text-xs text-zinc-500 truncate">{s.content.substring(0, 60)}...</div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleApplyConnect}
                        className="w-full bg-green-600 hover:bg-green-500 text-white text-sm font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <Check size={16} />
                        Apply Changes to Master Doc
                    </button>
                </div>
            );
        } catch (e) {
            return (
                <div className="space-y-2">
                    <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm flex items-center gap-2">
                        <AlertTriangle size={14} />
                        Could not parse AI response as JSON.
                    </div>
                    <div className="text-xs text-zinc-500">Raw Output:</div>
                    <ReactMarkdown>{result}</ReactMarkdown>
                </div>
            );
        }
    };

    return (
        <div className={cn(
            "absolute bottom-4 left-4 z-50 flex flex-col gap-2 transition-all duration-300",
            isExpanded ? "w-96" : "w-auto" // Panel expands when showing results
        )}>
            {/* Controls Card */}
            <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-xl p-3 shadow-2xl flex flex-col gap-3">

                {/* Header / Mode Select */}
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                        <Sparkles size={18} />
                    </div>
                    <div className="flex-1">
                        <select
                            value={analysisConfig.mode}
                            onChange={(e) => setAnalysisConfig({ mode: e.target.value as AIMode })}
                            className="bg-transparent text-sm font-medium text-white outline-none w-full cursor-pointer appearance-none"
                        >
                            {Object.entries(MODE_LABELS).map(([key, label]) => (
                                <option key={key} value={key} className="bg-zinc-900 text-zinc-300">
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Scope Selection */}
                <div className="flex bg-zinc-800/50 rounded-lg p-1">
                    <button
                        onClick={() => setAnalysisConfig({ scope: 'selection' })}
                        className={cn(
                            "flex-1 text-xs py-1.5 rounded-md transition-colors",
                            analysisConfig.scope === 'selection' ? "bg-zinc-700 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        Selection ({nodes.filter(n => n.selected).length})
                    </button>
                    <button
                        onClick={() => setAnalysisConfig({ scope: 'all' })}
                        className={cn(
                            "flex-1 text-xs py-1.5 rounded-md transition-colors",
                            analysisConfig.scope === 'all' ? "bg-zinc-700 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        All Notes
                    </button>
                </div>

                {/* Analyze Button */}
                <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    {isAnalyzing ? (
                        <>
                            <Loader2 size={14} className="animate-spin" />
                            Thinking...
                        </>
                    ) : (
                        <>
                            <ModeIcon size={14} />
                            Generate Insight
                        </>
                    )}
                </button>
            </div>

            {/* Results Card (Collapsible) */}
            {result && (
                <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[60vh]">
                    <div className="flex items-center justify-between p-3 border-b border-zinc-800 bg-zinc-800/30">
                        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                            <ModeIcon size={12} /> {MODE_LABELS[analysisConfig.mode]}
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="p-1 hover:bg-zinc-700 rounded text-zinc-400"
                            >
                                {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                            </button>
                            <button
                                onClick={() => setResult(null)}
                                className="p-1 hover:bg-zinc-700 rounded text-zinc-400"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>

                    {isExpanded && (
                        <div className="p-4 overflow-y-auto text-sm text-zinc-300 prose prose-invert prose-sm max-w-none">
                            {analysisConfig.mode === 'connect' ? renderConnectResult() : <ReactMarkdown>{result}</ReactMarkdown>}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
