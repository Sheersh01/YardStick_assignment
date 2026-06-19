import type { ContextPayload } from 'shared/types';

// Ensure trailing slash is removed from env var if present
const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000').replace(/\/$/, '');

export async function sendChatMessage(
  message: string,
  context: ContextPayload,
  onChunk: (chunk: string) => void,
  onToolCall: (name: string, args: any) => Promise<any>
) {
  const response = await fetch(`${BACKEND_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, context }),
  });

  if (!response.body) throw new Error('No response body');

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');

  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    
    // Process all complete events in the buffer
    let boundary = buffer.indexOf('\n\n');
    while (boundary !== -1) {
      const chunk = buffer.slice(0, boundary).replace(/^data: /, '').trim();
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf('\n\n');

      if (chunk === '[DONE]') {
        return;
      }

      if (chunk) {
        try {
          const data = JSON.parse(chunk);
          if (data.type === 'message') {
            onChunk(data.content);
          } else if (data.type === 'tool_call') {
            // Execute the tool in the browser context
            const result = await onToolCall(data.name, data.args);
            
            // Post result back to backend
            await fetch(`http://localhost:3000/chat/result/${data.callId}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(result),
            });
          }
        } catch (e) {
          console.error('Error parsing SSE chunk:', e, chunk);
        }
      }
    }
  }
}
