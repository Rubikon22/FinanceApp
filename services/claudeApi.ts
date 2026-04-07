/**
 * Claude API service — direct HTTP calls (no Node.js SDK needed in React Native)
 */

import { CLAUDE_API_KEY } from './secrets';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string | ClaudeContentBlock[];
}

export interface ClaudeContentBlock {
  type: 'text' | 'tool_use' | 'tool_result';
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, any>;
  tool_use_id?: string;
  content?: string;
}

export interface ClaudeTool {
  name: string;
  description: string;
  input_schema: Record<string, any>;
}

export interface ClaudeResponse {
  id: string;
  content: ClaudeContentBlock[];
  stop_reason: 'end_turn' | 'tool_use' | 'max_tokens';
  usage: { input_tokens: number; output_tokens: number };
}

export async function callClaude(
  messages: ClaudeMessage[],
  system: string,
  tools?: ClaudeTool[],
): Promise<ClaudeResponse> {
  const body: Record<string, any> = {
    model: MODEL,
    max_tokens: 1024,
    system,
    messages,
  };

  if (tools && tools.length > 0) {
    body.tools = tools;
  }

  const res = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Claude API error ${res.status}: ${errorText}`);
  }

  return res.json();
}

export function getApiKey(): string {
  return CLAUDE_API_KEY;
}

export function isApiKeySet(): boolean {
  return CLAUDE_API_KEY !== 'YOUR_CLAUDE_API_KEY' && CLAUDE_API_KEY.length > 0;
}
