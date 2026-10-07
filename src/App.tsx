import { useState } from 'react';
import { ChatPanel } from './components/ChatPanel';
import { Sidebar } from './components/Sidebar';

export default function App() {
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <div className="flex h-dvh overflow-hidden bg-zinc-950">
      <ChatPanel onTogglePanel={() => setPanelOpen((o) => !o)} />
      <div className="hidden w-80 shrink-0 lg:block">
        <Sidebar />
      </div>
      {panelOpen && (
        <div className="fixed inset-0 z-20 flex lg:hidden">
          <div className="flex-1 bg-black/60" onClick={() => setPanelOpen(false)} />
          <div className="w-80 max-w-full">
            <Sidebar onClose={() => setPanelOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
