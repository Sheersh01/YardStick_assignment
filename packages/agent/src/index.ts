import OpenAI from 'openai';
import { registry } from '../../skills/src/skill-registry';
import type { ContextPayload } from '../../shared/src/types';

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

const SYSTEM_PROMPT = `You are a Universal SaaS Copilot operating inside Trello.
Your capabilities are defined by the tools available to you. These tools map to network requests on Trello.
You will be provided with the user's request and the current page context (e.g. board name, visible lists).

Before you execute any tools, you MUST generate an execution plan.
Use the tool \`generatePlan\` to output your plan first.
Then proceed to call the necessary tools.
Do not invent or fabricate actions. If a tool fails, report the failure.
`;

export async function runAgent(
  prompt: string,
  context: ContextPayload,
  onStreamContent: (text: string) => void,
  onToolCall: (name: string, args: any) => Promise<any>
) {
  const tools = registry.getOpenAITools();

  // Add the built-in planning tool
  const allTools = [
    {
      type: 'function',
      function: {
        name: 'generatePlan',
        description: 'Output the execution plan before running actual SaaS tools',
        parameters: {
          type: 'object',
          properties: {
            steps: {
              type: 'array',
              items: { type: 'string' },
              description: 'The sequential steps to achieve the goal',
            },
          },
          required: ['steps'],
        },
      },
    },
    ...tools,
  ];

  const messages: any[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Context:\n${JSON.stringify(context, null, 2)}\n\nRequest:\n${prompt}`,
    },
  ];

  let isComplete = false;

  while (!isComplete) {
    const stream = await openai.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages,
      tools: allTools as any,
      tool_choice: 'auto',
      stream: true,
    });

    let fullContent = '';
    const toolCallsMap: Record<number, any> = {};

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (!delta) continue;

      if (delta.content) {
        fullContent += delta.content;
        onStreamContent(delta.content); // Stream token-by-token directly to UI
      }

      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          if (!toolCallsMap[tc.index]) {
            toolCallsMap[tc.index] = {
              id: tc.id,
              type: 'function',
              function: { name: tc.function?.name || '', arguments: '' }
            };
          }
          if (tc.function?.arguments) {
            toolCallsMap[tc.index].function.arguments += tc.function.arguments;
          }
        }
      }
    }

    const tool_calls = Object.values(toolCallsMap).length > 0 ? Object.values(toolCallsMap) : undefined;
    
    const msg: any = { role: 'assistant' };
    if (fullContent) msg.content = fullContent;
    if (tool_calls) msg.tool_calls = tool_calls;
    
    messages.push(msg);

    if (msg.tool_calls && msg.tool_calls.length > 0) {
      for (const toolCall of msg.tool_calls) {
        const args = JSON.parse(toolCall.function.arguments);
        
        let toolResult;
        if (toolCall.function.name === 'generatePlan') {
          toolResult = { success: true, message: 'Plan generated.' };
          onStreamContent(`\n**Plan:**\n${args.steps.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}\n`);
        } else {
          // Delegate to generic execution layer
          toolResult = await onToolCall(toolCall.function.name, args);
        }

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: toolCall.function.name,
          content: JSON.stringify(toolResult),
        });
      }
    } else {
      isComplete = true;
    }
  }
}
