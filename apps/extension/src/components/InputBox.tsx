import React, { useState } from 'react';
import { Send } from 'lucide-react';

interface InputBoxProps {
  onSend: (text: string) => void;
}

export default function InputBox({ onSend }: InputBoxProps) {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSend(text.trim());
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ask Copilot..."
        className="flex-1 rounded-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm text-gray-900 placeholder-gray-400 bg-white"
      />
      <button
        type="submit"
        disabled={!text.trim()}
        className="p-2 rounded-full bg-blue-600 text-white disabled:bg-gray-100 disabled:text-gray-400 hover:bg-blue-700 transition-colors"
      >
        <Send size={18} />
      </button>
    </form>
  );
}
