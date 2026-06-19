import React, { useState } from 'react';
import MessageList from './MessageList';
import InputBox from './InputBox';
import type { ChatMessage, ContextPayload } from 'shared/types';
import { sendChatMessage } from '../api/client';
import { executeTool } from '../utils/toolExecutor';

export default function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('trello_copilot_messages');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load messages', e);
      }
    }
    return [{ id: '1', role: 'assistant', content: 'Hi! I am your Trello Copilot. How can I help you today?' }];
  });
  
  React.useEffect(() => {
    localStorage.setItem('trello_copilot_messages', JSON.stringify(messages));
  }, [messages]);
  
  const [isLoading, setIsLoading] = useState(false);

  const [currentAction, setCurrentAction] = useState<string | null>(null);

  const getPageContext = (): ContextPayload => {
    // For now, grabbing standard properties. In a real scenario we parse the DOM or Trello state
    return {
      boardName: document.title,
      visibleLists: [], // TODO: extract from DOM
      selectedCard: null,
      currentUrl: window.location.href,
      pageTitle: document.title,
    };
  };

  const handleSendMessage = async (text: string) => {
    const newUserMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text };
    setMessages((prev) => [...prev, newUserMsg]);
    
    // Add temporary assistant message for streaming
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
          // Clean UX: Show a skeleton action loader instead of permanent chat bubbles
          setCurrentAction(`Running ${name}...`);
          
          const result = await executeTool(name, args);
          
          setCurrentAction(null);
          
          return result;
        }
      );
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [...prev, { id: Date.now().toString(), role: 'assistant', content: 'Sorry, I encountered an error communicating with the backend.' }]);
    } finally {
      setIsLoading(false);
      setCurrentAction(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="flex-1 overflow-y-auto p-4">
        <MessageList messages={messages} />
        
        {currentAction && (
          <div className="flex items-center gap-3 mt-4 px-4 py-2 bg-gray-50 text-gray-600 rounded-full w-fit border border-gray-200 shadow-sm animate-pulse">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
            <span className="text-xs font-medium">{currentAction}</span>
          </div>
        )}

        {isLoading && !currentAction && (
          <div className="flex gap-1.5 mt-4 px-4 py-2 w-fit">
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
        )}
      </div>
      <div className="border-t border-gray-200 p-4">
        <InputBox onSend={handleSendMessage} />
      </div>
    </div>
  );
}
