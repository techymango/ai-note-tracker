import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Trash2 } from 'lucide-react';
import { useStore } from '../lib/store';
import { callPerplexity } from '../lib/llm/perplexity';
import { cn } from '../lib/utils';

export default function ChatTab() {
    const { chats, addChatMessage, document, notes, settings } = useStore();
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chats]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput('');
        setIsLoading(true);

        // Add User Message
        await addChatMessage({
            id: crypto.randomUUID(),
            role: 'user',
            content: userMsg,
            timestamp: Date.now(),
        });

        try {
            // Build Context
            const docContent = document?.sections?.map(s => `## ${s.title}\n${s.content}`).join('\n\n') || 'No master document yet.';
            const connectedNotes = notes
                .filter(n => n.status === 'connected')
                .map(n => `- ${n.content} (Tags: ${n.tags.join(', ')})`)
                .join('\n');

            const systemContext = `
You are a helpful AI assistant for a Note-Taking app.
Answer questions based on the Master Document and Connected Notes provided below.
If the answer is not in the context, you can use your general knowledge but mention that it's from outside context.

=== MASTER DOCUMENT ===
${docContent}

=== CONNECTED NOTES ===
${connectedNotes || 'No connected notes.'}
`;

            // Sanitize history: Ensure strict User -> Assistant -> User alternation.
            // If the last message in history was 'user', it means a previous request failed.
            // We should discard it from the *LLM Context* so we don't send [User, User].
            const validHistory = chats.reduce((acc, msg) => {
                if (msg.role === 'system') return acc; // Skip system messages in history (handled by systemContext)

                const lastMsg = acc[acc.length - 1];

                // If current is user
                if (msg.role === 'user') {
                    // If we have no history, or last was assistant, this is valid.
                    if (!lastMsg || lastMsg.role === 'assistant') {
                        acc.push({ role: 'user', content: msg.content });
                    } else {
                        // Last was user, so we replace it (or drop previous). 
                        // Let's drop the previous "dangling" user message from context.
                        // Actually, simplest is: if we have User, User... just take the latest one?
                        // Or just drop the previous one.
                        acc.pop();
                        acc.push({ role: 'user', content: msg.content });
                    }
                } else if (msg.role === 'assistant') {
                    // Assistant should follow user
                    if (lastMsg && lastMsg.role === 'user') {
                        acc.push({ role: 'assistant', content: msg.content });
                    }
                    // If assistant comes without user (rare/impossible in this flow), ignore.
                }
                return acc;
            }, [] as { role: 'user' | 'assistant'; content: string }[]);

            // Double check: if the very last item in validHistory is USER, we have a problem because we are about to append another USER.
            if (validHistory.length > 0 && validHistory[validHistory.length - 1].role === 'user') {
                validHistory.pop();
            }

            const messages = [
                { role: 'system', content: systemContext },
                ...validHistory,
                { role: 'user', content: userMsg }
            ];

            // @ts-ignore
            const reply = await callPerplexity(messages, settings);

            // Add Assistant Message
            await addChatMessage({
                id: crypto.randomUUID(),
                role: 'assistant',
                content: reply,
                timestamp: Date.now(),
            });

        } catch (error: any) {
            await addChatMessage({
                id: crypto.randomUUID(),
                role: 'system', // Display as error/system
                content: `Error: ${error.message}`,
                timestamp: Date.now(),
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-zinc-950 pb-20">
            <header className="p-4 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10 flex justify-between items-center">
                <h1 className="text-xl font-bold text-white">Chat</h1>
                {chats.length > 0 && (
                    <button
                        onClick={() => { if (confirm('Clear chat history?')) { /* TODO implement clear action in store if needed, or manual wipe */ } }}
                        className="text-zinc-600 hover:text-red-400 p-2"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-4 opacity-50">
                        <Bot size={48} />
                        <p>Ask me anything about your notes.</p>
                    </div>
                ) : (
                    chats.map((msg) => (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex w-full max-w-[85%] flex-col space-y-1",
                                msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                            )}
                        >
                            <div
                                className={cn(
                                    "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                                    msg.role === 'user'
                                        ? "bg-blue-600 text-white rounded-tr-sm"
                                        : msg.role === 'system'
                                            ? "bg-red-900/30 text-red-200 border border-red-900/50"
                                            : "bg-zinc-800 text-zinc-200 rounded-tl-sm"
                                )}
                            >
                                {msg.content}
                            </div>
                            <span className="text-[10px] text-zinc-600 px-1">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))
                )}
                {isLoading && (
                    <div className="flex items-center space-x-2 text-zinc-500 text-sm ml-2">
                        <Bot size={16} className="animate-pulse" />
                        <span className="animate-pulse">Thinking...</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-zinc-950 border-t border-zinc-900">
                <div className="flex items-center space-x-2 bg-zinc-900 rounded-full border border-zinc-800 px-2 py-2 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        placeholder="Ask a question..."
                        className="flex-1 bg-transparent px-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-full transition-colors flex-shrink-0"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
