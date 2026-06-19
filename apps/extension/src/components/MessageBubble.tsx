import React from 'react';
import type { ChatMessage } from 'shared/types';

interface MessageBubbleProps {
  message: ChatMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-2 text-xs font-medium text-[#9FADBC] bg-[#2C333A] px-3 py-1 border border-[#38414A] rounded-md shadow-sm">
        {message.content}
      </div>
    );
  }

  const renderText = (text: string) => {
    // Basic parser for **bold** and `code`
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="text-[#FFFFFF]">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={index} className="bg-[#1D2125] text-[#579DFF] px-1 py-0.5 rounded text-xs font-mono">{part.slice(1, -1)}</code>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className={`flex flex-col gap-1 w-full ${isUser ? 'items-end' : 'items-start'}`}>
      <span className="text-[11px] font-medium uppercase text-[#9FADBC] px-1">
        {isUser ? 'USER' : 'AGENT'}
      </span>
      <div className={`max-w-[85%] px-4 py-3 rounded-xl shadow-sm ${isUser ? 'bg-[#1C2B41] text-[#B6C2CF]' : 'bg-[#2C333A] text-[#B6C2CF] border border-[#38414A]'}`}>
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{renderText(message.content)}</p>
      </div>
    </div>
  );
}
