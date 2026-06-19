import { Request, Response } from 'express';
import { runAgent } from 'agent';
import type { ContextPayload } from 'shared/types';

export const handleChat = async (req: Request, res: Response) => {
  try {
    const { message, context } = req.body as { message: string; context: ContextPayload };
    
    // Set headers for SSE (Server-Sent Events)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Callback to stream chat text back to the client
    const onStreamContent = (text: string) => {
      res.write(`data: ${JSON.stringify({ type: 'message', content: text })}\n\n`);
    };

    // Callback when the agent wants to run a tool on the SaaS
    // For now we will stream the tool execution request back to the client so the client can execute it in its browser context.
    // We wait for the client to send the result back (in a real system this might require an active WebSocket or long polling, but for this demo SSE, we'll just log it or simulate for now).
    // Actually, since SSE is one-way, to have the agent wait for the browser to execute it, we need a bi-directional channel like WebSockets or a mechanism to pause/resume the agent.
    // Since the PRD says: "Agent acts through authenticated browser context", we MUST proxy requests.
    // For the sake of the current structure, if we only have SSE, the client will get a "tool_call" event and execute it, then POST the result back.
    // The current request would pause, but express doesn't easily support pausing an async function waiting for another request without external state (like a pending tasks map).
    // Let's implement a simple pending tasks map for tool results.
    
    const onToolCall = async (name: string, args: any) => {
      const callId = Math.random().toString(36).substring(7);
      
      res.write(`data: ${JSON.stringify({ type: 'tool_call', callId, name, args })}\n\n`);
      
      // Wait for the client to post the result to another endpoint (e.g., /chat/result/:callId)
      return await waitForToolResult(callId);
    };

    await runAgent(message, context, onStreamContent, onToolCall);

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).write(`data: ${JSON.stringify({ type: 'error', content: error instanceof Error ? error.message : String(error) })}\n\n`);
    res.end();
  }
};

// Simple event emitter mechanism for cross-request tool results
import { EventEmitter } from 'events';
export const toolResultEmitter = new EventEmitter();

function waitForToolResult(callId: string, timeoutMs = 30000): Promise<any> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      toolResultEmitter.removeAllListeners(callId);
      resolve({ success: false, message: 'Tool execution timed out' });
    }, timeoutMs);

    toolResultEmitter.once(callId, (result) => {
      clearTimeout(timeout);
      resolve(result);
    });
  });
}
