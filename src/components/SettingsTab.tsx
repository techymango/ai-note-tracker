import { useState } from 'react';
import { Download, Save } from 'lucide-react';
import { useStore } from '../lib/store';
import { db } from '../lib/db';

export default function SettingsTab() {
    const settings = useStore((state) => state.settings);
    const updateSettings = useStore((state) => state.updateSettings);

    const [apiKey, setApiKey] = useState(settings.apiKey);
    const [model, setModel] = useState(settings.model);
    const [isSaved, setIsSaved] = useState(false);

    const handleSave = async () => {
        await updateSettings({ apiKey, model });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const handleExport = async () => {
        const notes = await db.getNotes();
        const doc = await db.getDocument();
        const chats = await db.getChats();
        const exportData = {
            timestamp: Date.now(),
            notes,
            document: doc,
            chats,
            settings: { ...settings, apiKey: '***MASKED***' } // Don't export API key
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-notetaker-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-4 pb-20 space-y-6">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-white">Settings</h1>
            </header>

            <section className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">
                        Perplexity API Key
                    </label>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="pplx-..."
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all font-mono text-sm"
                    />
                    <p className="text-[10px] text-zinc-500 mt-1">
                        Stored locally in your browser.
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">
                        Model
                    </label>
                    <select
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50 appearance-none"
                    >
                        <option value="sonar-pro">sonar-pro</option>
                        <option value="sonar">sonar</option>
                    </select>
                </div>

                <button
                    onClick={handleSave}
                    className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-lg transition-colors active:scale-95"
                >
                    {isSaved ? <CheckIcon /> : <Save size={18} />}
                    <span>{isSaved ? 'Saved' : 'Save Settings'}</span>
                </button>
            </section>

            <div className="h-px bg-zinc-800 my-6" />

            <section>
                <h3 className="text-sm font-medium text-zinc-400 mb-3">Data Management</h3>
                <button
                    onClick={handleExport}
                    className="w-full flex items-center justify-center space-x-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium py-3 rounded-lg transition-colors border border-zinc-700"
                >
                    <Download size={18} />
                    <span>Export Data (JSON)</span>
                </button>
            </section>
        </div>
    );
}

function CheckIcon() {
    return (
        <svg
            className="w-5 h-5 animate-in zoom-in duration-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
    );
}
