import React, { useState } from 'react';
import ChatWindow from './ChatWindow';
import { Square } from 'lucide-react';

export default function App() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="text-[#B6C2CF]">
      {/* Copilot Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 p-4 bg-[#579DFF] text-[#1D2125] shadow-xl hover:bg-[#85B8FF] transition-all z-[9999] rounded-xl"
        >
          <Square size={20} className="fill-current" />
        </button>
      )}

      {/* Sidebar Overlay */}
      {isOpen && (
        <div className="fixed top-0 right-0 w-[400px] h-screen bg-[#22272B] shadow-2xl flex flex-col z-[9999] border-l border-[#38414A]">
          <ChatWindow onClose={() => setIsOpen(false)} />
        </div>
      )}
    </div>
  );
}
