import React, { useState } from 'react';

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
        placeholder="Ask Yardstick..."
        className="flex-1 px-4 py-2 focus:outline-none text-sm text-[#B6C2CF] placeholder-[#9FADBC] bg-[#22272B] border border-[#38414A] rounded-md focus:border-[#579DFF]"
      />
      <button
        type="submit"
        disabled={!text.trim()}
        className="px-4 py-2 bg-[#579DFF] text-[#1D2125] disabled:bg-[#2C333A] disabled:text-[#9FADBC] hover:bg-[#85B8FF] transition-colors rounded-md text-sm font-semibold"
      >
        Submit
      </button>
    </form>
  );
}
