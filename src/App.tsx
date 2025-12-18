import { useEffect } from 'react';
import { useStore } from './lib/store';
import CanvasTab from './components/CanvasTab';
import SettingsTab from './components/SettingsTab';
import { useState } from 'react';
import { NotebookPen, Settings as SettingsIcon } from 'lucide-react';
import { cn } from './lib/utils';

function App() {
  const [activeMode, setActiveMode] = useState<'canvas' | 'settings'>('canvas');
  const loadInitialData = useStore((state) => state.loadInitialData);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  return (
    <div className="w-screen h-screen bg-black text-white overflow-hidden relative">
      {/* Main Content */}
      <div className="absolute inset-0 z-0">
        {activeMode === 'canvas' ? (
          <CanvasTab />
        ) : (
          <div className="max-w-md mx-auto pt-20">
            <SettingsTab />
          </div>
        )}
      </div>

      {/* Floating Mode Switcher (Top Right or Bottom Left) */}
      <div className="absolute top-4 right-4 z-50 flex bg-zinc-900/90 backdrop-blur-md rounded-full shadow-xl border border-zinc-800 p-1">
        <button
          onClick={() => setActiveMode('canvas')}
          className={cn("p-2 rounded-full transition-all", activeMode === 'canvas' ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300")}
        >
          <NotebookPen size={20} />
        </button>
        <button
          onClick={() => setActiveMode('settings')}
          className={cn("p-2 rounded-full transition-all", activeMode === 'settings' ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300")}
        >
          <SettingsIcon size={20} />
        </button>
      </div>
    </div>
  );
}

export default App;
