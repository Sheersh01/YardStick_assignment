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
          className="fixed bottom-6 right-6 p-4 bg-[#0055CC] text-white shadow-xl hover:bg-[#004BB5] transition-all z-[9999] rounded-full"
        >
          <Square size={20} className="fill-current" />
        </button>
      )}

      {/* Floating Chat Widget */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[380px] h-[600px] max-h-[calc(100vh-48px)] bg-[#1F1F21] shadow-2xl flex flex-col z-[9999] border border-[#38414A] rounded-xl overflow-hidden">
          <ChatWindow onClose={() => setIsOpen(false)} />
        </div>
      )}
    </div>
  );
}
