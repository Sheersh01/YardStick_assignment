import React, { useState } from 'react';
import ChatWindow from './ChatWindow';
import { Bot, X } from 'lucide-react';

export default function App() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="yardstick-reset">
      {/* Copilot Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all z-[9999]"
        >
          <Bot size={24} />
        </button>
      )}

      {/* Sidebar Overlay */}
      {isOpen && (
        <div className="fixed top-0 right-0 w-[400px] h-screen bg-white shadow-2xl flex flex-col z-[9999] border-l border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <Bot className="text-blue-600" size={20} />
              <h2 className="font-semibold text-gray-800">SaaS Copilot</h2>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-md hover:bg-gray-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Chat Window Container */}
          <div className="flex-1 overflow-hidden">
            <ChatWindow />
          </div>
        </div>
      )}
    </div>
  );
}
