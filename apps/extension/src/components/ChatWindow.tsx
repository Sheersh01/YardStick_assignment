import React, { useState, useRef, useEffect } from 'react';
import MessageList from './MessageList';
import InputBox from './InputBox';
import type { ChatMessage, ContextPayload } from 'shared/types';
import { sendChatMessage } from '../api/client';
import { executeTool } from '../utils/toolExecutor';
import { Square, X, Trash2 } from 'lucide-react';

interface ChatWindowProps {
  onClose: () => void;
}

export default function ChatWindow({ onClose }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('trello_copilot_messages');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load messages', e);
      }
    }
    return [{ id: '1', role: 'assistant', content: 'SYSTEM READY.' }];
  });
  
  React.useEffect(() => {
    localStorage.setItem('trello_copilot_messages', JSON.stringify(messages));
  }, [messages]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState<string | null>(null);

  const handleClearChat = () => {
    setMessages([{ id: Date.now().toString(), role: 'assistant', content: 'SYSTEM READY.' }]);
  };

  const getPageContext = (): ContextPayload => {
    return {
      boardName: document.title,
      visibleLists: [],
      selectedCard: null,
      currentUrl: window.location.href,
      pageTitle: document.title,
    };
  };

  const handleSendMessage = async (text: string) => {
    const newUserMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text };
    setMessages((prev) => [...prev, newUserMsg]);
    
    const assistantMsgId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { id: assistantMsgId, role: 'assistant', content: '' }]);
    
    setIsLoading(true);

    try {
      const context = getPageContext();
      
      await sendChatMessage(
        text,
        context,
        (chunk: string) => {
          setMessages((prev) => 
            prev.map((msg) => 
              msg.id === assistantMsgId ? { ...msg, content: msg.content + chunk } : msg
            )
          );
        },
        async (name: string, args: any) => {
          setCurrentAction(`Running ${name}...`);
          const result = await executeTool(name, args);
          setCurrentAction(null);
          return result;
        }
      );
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [...prev, { id: Date.now().toString(), role: 'assistant', content: 'ERROR: CONNECTION FAILED.' }]);
    } finally {
      setIsLoading(false);
      setCurrentAction(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#22272B] relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#38414A] bg-[#1D2125] shrink-0 text-[#B6C2CF]">
        <div className="flex items-center gap-3">
          <Square className="text-[#579DFF] fill-current" size={16} />
          <h2 className="font-semibold text-[#FFFFFF] text-sm">Yardstick Agent</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearChat}
            className="text-[11px] font-semibold uppercase text-[#9FADBC] px-2 py-1 hover:bg-[#2C333A] hover:text-[#B6C2CF] rounded transition-colors"
            title="New Session"
          >
            CLEAR
          </button>
          <button
            onClick={onClose}
            className="text-[#9FADBC] hover:bg-[#2C333A] hover:text-[#B6C2CF] p-1 rounded transition-colors"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <MessageList messages={messages} />
        
        {currentAction && (
          <div className="flex items-center gap-2 mt-4 px-3 py-2 bg-[#2C333A] text-[#B6C2CF] border border-[#38414A] rounded-md w-fit shadow-sm">
            <div className="w-2 h-2 bg-[#579DFF] rounded-full animate-pulse"></div>
            <span className="text-[11px] font-medium">{currentAction}</span>
          </div>
        )}

        {isLoading && !currentAction && (
          <div className="flex items-center gap-2 mt-4 px-3 py-2 bg-[#2C333A] text-[#B6C2CF] border border-[#38414A] rounded-md w-fit shadow-sm">
            <span className="w-2 h-2 bg-[#9FADBC] rounded-full animate-pulse"></span>
            <span className="text-[11px] font-medium uppercase text-[#9FADBC]">Awaiting response</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t border-[#38414A] p-4 bg-[#1D2125] shrink-0">
        <InputBox onSend={handleSendMessage} />
      </div>
    </div>
  );
}
