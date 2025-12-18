import { useStore } from '../lib/store';
import { FileText } from 'lucide-react';

export default function DocumentTab() {
    const document = useStore((state) => state.document);

    if (!document || !document.sections || document.sections.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-zinc-500 p-8 text-center">
                <div className="bg-zinc-900 p-4 rounded-full mb-4">
                    <FileText size={32} />
                </div>
                <h3 className="text-zinc-300 font-medium mb-2">Master Document Empty</h3>
                <p className="text-sm">Connect notes to start building your knowledge base.</p>
            </div>
        );
    }

    return (
        <div className="p-4 pb-20 space-y-6">
            <header className="mb-6">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                    Master Document
                </h1>
                <p className="text-xs text-zinc-500 mt-1">
                    Last updated: {new Date(document.lastUpdated).toLocaleString()}
                </p>
            </header>

            <div className="space-y-8">
                {document.sections.map((section) => (
                    <section key={section.id} className="animate-in fade-in duration-500">
                        <h2 className="text-lg font-semibold text-blue-400 mb-3 border-b border-zinc-800 pb-2">
                            {section.title}
                        </h2>
                        <div className="text-zinc-300 leading-7 whitespace-pre-wrap text-sm">
                            {section.content}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
}
