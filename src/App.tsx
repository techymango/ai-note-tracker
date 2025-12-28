import { useEffect, useState } from 'react';
import { useStore } from './lib/store';
import CanvasTab from './components/CanvasTab';
import SettingsTab from './components/SettingsTab';
import NotesTab from './components/NotesTab';
import DocumentTab from './components/DocumentTab';
import ChatTab from './components/ChatTab';
import { NotebookPen, Settings as SettingsIcon, FileText, MessageSquare, Network } from 'lucide-react';
import { cn } from './lib/utils';

type ActiveTab = 'notes' | 'canvas' | 'doc' | 'chat' | 'settings';

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('canvas');
  const loadInitialData = useStore((state) => state.loadInitialData);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const renderContent = () => {
    switch (activeTab) {
      case 'notes': return <div className="max-w-md mx-auto pt-10"><NotesTab /></div>;
      case 'canvas': return <CanvasTab />;
      case 'doc': return <div className="max-w-md mx-auto pt-10"><DocumentTab /></div>;
      case 'chat': return <div className="max-w-md mx-auto pt-10 h-[calc(100vh-80px)]"><ChatTab /></div>;
      case 'settings': return <div className="max-w-md mx-auto pt-10"><SettingsTab /></div>;
      default: return <CanvasTab />;
    }
  };

  return (
    <div className="w-screen h-screen bg-black text-white overflow-hidden relative flex flex-col">
      {/* Main Content Area */}
      <div className="flex-1 overflow-auto bg-zinc-950 relative">
        {renderContent()}
      </div>

      {/* Bottom Navigation Bar */}
      <div className="h-16 bg-zinc-900/90 backdrop-blur-md border-t border-zinc-800 flex items-center justify-around px-4 pb-2 z-50">
        <NavButton
          active={activeTab === 'notes'}
          onClick={() => setActiveTab('notes')}
          icon={NotebookPen}
          label="Notes"
        />
        <NavButton
          active={activeTab === 'canvas'}
          onClick={() => setActiveTab('canvas')}
          icon={Network}
          label="Canvas"
        />
        <NavButton
          active={activeTab === 'doc'}
          onClick={() => setActiveTab('doc')}
          icon={FileText}
          label="Doc"
        />
        <NavButton
          active={activeTab === 'chat'}
          onClick={() => setActiveTab('chat')}
          icon={MessageSquare}
          label="Chat"
        />
        <NavButton
          active={activeTab === 'settings'}
          onClick={() => setActiveTab('settings')}
          icon={SettingsIcon}
          label="Settings"
        />
      </div>
    </div>
  );
}

function NavButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center w-16 h-full transition-all duration-200 active:scale-95",
        active ? "text-blue-500" : "text-zinc-500 hover:text-zinc-300"
      )}
    >
      <div className={cn("p-1.5 rounded-xl transition-colors", active && "bg-blue-500/10")}>
        <Icon size={24} strokeWidth={active ? 2.5 : 2} />
      </div>
      <span className="text-[10px] font-medium mt-1">{label}</span>
    </button>
  );
}

export default App;
