import { useState } from 'react';
import { Plus, Link, Check, Loader2, X } from 'lucide-react';
import { useStore } from '../lib/store';
import type { Note } from '../types';
import { callPerplexityJSON } from '../lib/llm/perplexity';
import { CONNECT_SYSTEM_PROMPT, CONNECT_USER_TEMPLATE } from '../lib/prompts';

export default function NotesTab() {
    const notes = useStore((state) => state.notes);
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="p-4 pb-20 space-y-4">
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                    My Notes
                </h1>
                <span className="text-xs text-zinc-500">{notes.length} notes</span>
            </header>

            <div className="space-y-3">
                {notes.length === 0 ? (
                    <div className="text-center py-20 text-zinc-600">
                        <p>No notes yet.</p>
                        <p className="text-sm">Tap + to create one.</p>
                    </div>
                ) : (
                    notes.map((note) => <NoteCard key={note.id} note={note} />)
                )}
            </div>

            <button
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-20 right-4 w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 z-40"
            >
                <Plus size={28} />
            </button>

            {isModalOpen && <CreateNoteModal onClose={() => setIsModalOpen(false)} />}
        </div>
    );
}

function NoteCard({ note }: { note: Note }) {
    const [isConnecting, setIsConnecting] = useState(false);
    const { document, updateNoteStatus, updateDocument, settings } = useStore();

    const handleConnect = async () => {
        if (isConnecting) return;
        setIsConnecting(true);

        try {
            const currentDocJSON = JSON.stringify(document || { sections: [], lastUpdated: 0 }, null, 2);
            const messages = [
                { role: 'system', content: CONNECT_SYSTEM_PROMPT },
                { role: 'user', content: CONNECT_USER_TEMPLATE(currentDocJSON, note.content) }
            ];

            // Call Perplexity with strict JSON requirement
            // @ts-ignore - messages type match
            const result = await callPerplexityJSON<{ sections: any[], summary_of_changes: string }>(messages, settings);

            if (result && result.sections) {
                // Update Document
                await updateDocument({
                    sections: result.sections,
                    lastUpdated: Date.now()
                });

                // Update Note Status
                await updateNoteStatus(note.id, 'connected');
            } else {
                alert('AI response unexpected format.');
            }
        } catch (error: any) {
            alert(`Connect failed: ${error.message}`);
        } finally {
            setIsConnecting(false);
        }
    };

    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 active:bg-zinc-900 transition-colors">
            <div className="flex justify-between items-start mb-2">
                <div className="flex flex-wrap gap-1">
                    {note.tags.map(tag => (
                        <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                            #{tag}
                        </span>
                    ))}
                </div>
                <span className="text-[10px] text-zinc-600">
                    {new Date(note.createdAt).toLocaleDateString()}
                </span>
            </div>

            <p className="text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed line-clamp-4">
                {note.content}
            </p>

            <div className="mt-4 flex justify-end">
                {note.status === 'connected' ? (
                    <div className="flex items-center space-x-1 text-green-500 text-xs font-medium px-2 py-1 bg-green-950/30 rounded-full border border-green-900/50">
                        <Check size={12} />
                        <span>Connected</span>
                    </div>
                ) : (
                    <button
                        onClick={handleConnect}
                        disabled={isConnecting}
                        className="flex items-center space-x-1.5 text-blue-400 text-xs font-medium px-3 py-1.5 bg-blue-950/20 hover:bg-blue-900/30 rounded-full border border-blue-900/50 transition-colors disabled:opacity-50"
                    >
                        {isConnecting ? <Loader2 size={12} className="animate-spin" /> : <Link size={12} />}
                        <span>{isConnecting ? 'Analyzing...' : 'Connect'}</span>
                    </button>
                )}
            </div>
        </div>
    );
}

function CreateNoteModal({ onClose }: { onClose: () => void }) {
    const [content, setContent] = useState('');
    const [tags, setTags] = useState('');
    const addNote = useStore((state) => state.addNote);

    const handleSubmit = async () => {
        if (!content.trim()) return;
        const tagList = tags.split(' ').map(t => t.replace('#', '')).filter(Boolean);
        await addNote(content, tagList);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-zinc-900 w-full max-w-sm rounded-2xl border border-zinc-800 p-4 shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-white">New Note</h2>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white p-1">
                        <X size={20} />
                    </button>
                </div>

                <textarea
                    autoFocus
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="What's on your mind?"
                    className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none text-base"
                />

                <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="Tags (e.g. #ideas #work)"
                    className="w-full mt-3 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 text-sm"
                />

                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        onClick={handleSubmit}
                        disabled={!content.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors"
                    >
                        Create Note
                    </button>
                </div>
            </div>
        </div>
    );
}
