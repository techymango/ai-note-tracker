import { useState, memo, useEffect, useRef } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { MessageSquare, X, Bot, Send } from 'lucide-react';
import { useStore } from '../lib/store';
import type { NoteNodeData } from '../types';
import { cn } from '../lib/utils';
import { callPerplexity, generateTitle } from '../lib/llm/perplexity';
import ReactMarkdown from 'react-markdown';

const NoteNode = memo(({ id, data, selected }: NodeProps<NoteNodeData>) => {
    const [isChatOpen, setIsChatOpen] = useState(false);

    const updateNodeContent = useStore((state) => state.updateNodeContent);
    const updateNodeTitle = useStore((state) => state.updateNodeTitle);
    const deleteNode = useStore((state) => state.deleteNode);
    const { settings } = useStore();

    // Local state for visual toggle
    const [minimized, setMinimized] = useState(data.isMinimized || false);
    const [expanded, setExpanded] = useState(data.isExpanded || false);

    // Auto-Title Logic
    const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
        // If content changes, title is NOT manual, and content is long enough -> Generate
        if (data.isTitleManual || !data.content || data.content.length < 10) return;

        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        debounceTimer.current = setTimeout(async () => {
            const newTitle = await generateTitle(data.content, settings);
            // Verify again if it became manual in the meantime (rare race condition but good to check store but data prop is reactive)
            if (!data.isTitleManual) { // Utilizing current closure 'data' which might be stale in timeout?
                // Actually data in useEffect deps needs to be careful.
                // Better to check 'isTitleManual' from a fresh ref if possible, but React Flow updates props.
                updateNodeTitle(id, newTitle, false);
            }
        }, 2000); // 2 second debounce

        return () => clearTimeout(debounceTimer.current);
    }, [data.content, data.isTitleManual, id, settings, updateNodeTitle]);

    const handleDelete = () => {
        deleteNode(id);
    };

    const handleMinimize = () => {
        setMinimized(!minimized);
    };

    const handleExpand = () => {
        setExpanded(!expanded);
    };

    const handleManualTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateNodeTitle(id, e.target.value, true);
    };

    return (
        <>
            <div
                className={cn(
                    "bg-zinc-900 border-2 rounded-xl shadow-xl transition-all duration-200 flex flex-col",
                    selected ? "border-blue-500 shadow-blue-500/20" : "border-zinc-800",
                    "hover:border-zinc-700",
                    expanded ? "w-96 h-96" : "w-64",
                    minimized ? "h-auto" : (expanded ? "h-96" : "")
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-zinc-800 bg-zinc-950/50 rounded-t-xl shrink-0">
                    <div className="flex space-x-2 group">
                        <button onClick={handleDelete} className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50 hover:bg-red-500 transition-colors flex items-center justify-center group-hover:block" title="Close" >
                            {/* Optional icon on hover, or just color shift */}
                        </button>
                        <button onClick={handleMinimize} className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50 hover:bg-yellow-500 transition-colors" title="Minimize" />
                        <button onClick={handleExpand} className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50 hover:bg-green-500 transition-colors" title="Expand" />
                    </div>
                    {/* Title Input - Centered or near buttons */}
                    <input
                        className="bg-transparent text-xs font-bold text-center text-zinc-400 focus:text-white focus:outline-none w-24 truncate"
                        placeholder="Untitled"
                        value={data.title || ''}
                        onChange={handleManualTitleChange}
                        onKeyDown={(e) => e.stopPropagation()}
                    />
                    <button
                        onClick={() => setIsChatOpen(!isChatOpen)}
                        className={cn("p-1.5 rounded-md transition-colors", isChatOpen ? "bg-blue-600/20 text-blue-400" : "text-zinc-500 hover:text-zinc-300")}
                    >
                        <MessageSquare size={14} />
                    </button>
                </div>

                {/* Content */}
                {minimized ? (
                    <div className="px-3 pb-3 pt-0">
                        <p className="text-xs text-zinc-400 font-mono line-clamp-3">
                            {data.content || <span className="italic opacity-50">Empty note...</span>}
                        </p>
                    </div>
                ) : (
                    <div className="p-3 flex-1 flex flex-col min-h-[8rem]">
                        <textarea
                            className="w-full flex-1 bg-transparent text-zinc-300 text-sm resize-none focus:outline-none placeholder:text-zinc-700 font-mono leading-relaxed"
                            placeholder="Write your note here..."
                            value={data.content}
                            onChange={(e) => updateNodeContent(id, e.target.value)}
                            onKeyDown={(e) => e.stopPropagation()}
                        />
                    </div>
                )}

                {/* Handles */}
                <Handle type="target" position={Position.Left} className="w-3 h-3 bg-blue-500 border-2 border-zinc-900" />
                <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-500 border-2 border-zinc-900" />
            </div>

            {/* Mini Chat Modal / Popover */}
            {isChatOpen && (
                <NodeChatWindow nodeId={id} data={data} onClose={() => setIsChatOpen(false)} />
            )}
        </>
    );
});

function NodeChatWindow({ nodeId, data, onClose }: { nodeId: string, data: NoteNodeData, onClose: () => void }) {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { addNodeChatMessage, nodes, edges, settings } = useStore();

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        const userMsg = input;
        setInput('');
        setIsLoading(true);

        const timestamp = Date.now();
        await addNodeChatMessage(nodeId, { id: crypto.randomUUID(), role: 'user', content: userMsg, timestamp });

        try {
            // Build Context from current node and UPSTREAM nodes (incoming edges)
            const incomingEdges = edges.filter(e => e.target === nodeId);
            const sourceNodeIds = incomingEdges.map(e => e.source);
            const sourceNodes = nodes.filter(n => sourceNodeIds.includes(n.id));

            const contextContent = sourceNodes.map(n => `[Context from Node ${n.id.slice(0, 4)}]:\n${n.data.content}`).join('\n\n');

            const systemPrompt = `
You are a helpful assistant living inside a note.
Current Note Content:
"${data.content}"

Connected Context (Upstream Notes):
${contextContent || "No upstream context."}

Answer the user's question based on this context.
`;

            const messages = [
                { role: 'system', content: systemPrompt },
                ...data.chatHistory.map(c => ({ role: c.role, content: c.content })),
                { role: 'user', content: userMsg }
            ];

            // @ts-ignore
            const reply = await callPerplexity(messages, settings);

            await addNodeChatMessage(nodeId, { id: crypto.randomUUID(), role: 'assistant', content: reply, timestamp: Date.now() });

        } catch (err: any) {
            await addNodeChatMessage(nodeId, { id: crypto.randomUUID(), role: 'system', content: `Error: ${err.message}`, timestamp: Date.now() });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="absolute left-full top-0 ml-4 w-80 h-96 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700 rounded-xl shadow-2xl flex flex-col overflow-hidden z-50 animate-in fade-in slide-in-from-left-4 duration-200"
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div className="flex justify-between items-center p-3 border-b border-zinc-800 bg-zinc-950/30">
                <span className="text-xs font-medium text-zinc-400 flex items-center gap-2">
                    <Bot size={12} />
                    AI Chat
                </span>
                <button onClick={onClose} className="text-zinc-500 hover:text-white">
                    <X size={14} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">

                {data.chatHistory.map((msg) => (
                    <div key={msg.id} className={cn("flex flex-col text-xs", msg.role === 'user' ? "items-end" : "items-start")}>
                        <div className={cn("p-2 rounded-lg max-w-[90%]", msg.role === 'user' ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-300")}>
                            {msg.role === 'user' ? (
                                msg.content
                            ) : (
                                <div className="prose prose-invert prose-xs max-w-none">
                                    <ReactMarkdown
                                        components={{
                                            p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                                            ul: ({ children }) => <ul className="list-disc ml-4 mb-1">{children}</ul>,
                                            ol: ({ children }) => <ol className="list-decimal ml-4 mb-1">{children}</ol>,
                                            code: ({ node, inline, className, children, ...props }: any) => {
                                                return !inline ? (
                                                    <div className="bg-zinc-950 p-2 rounded my-1 overflow-x-auto">
                                                        <code className={className} {...props}>
                                                            {children}
                                                        </code>
                                                    </div>
                                                ) : (
                                                    <code className="bg-zinc-900 px-1 rounded" {...props}>
                                                        {children}
                                                    </code>
                                                )
                                            }
                                        }}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {isLoading && <div className="text-xs text-zinc-500 italic">Thinking...</div>}
            </div>

            <div className="p-3 border-t border-zinc-800 bg-zinc-950/30 flex gap-2">
                <input
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    placeholder="Ask about connections..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                />
                <button onClick={handleSend} className="p-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500 flex items-center justify-center">
                    <Send size={12} />
                </button>
            </div>
        </div>
    );
}

export default NoteNode;
