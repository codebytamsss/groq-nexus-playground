export interface GroqModel {
  id: string;
  name: string;
  owned_by: string;
  context_length: number;
  max_output_length?: number;
  max_completion_tokens?: number;
  supported_features?: string[];
  pricing?: {
    prompt: string;
    completion: string;
  };
}

export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  reasoning?: string;
  metrics?: {
    tps?: number;
    ttft?: number; // ms
    totalTime?: number; // s
    promptTokens?: number;
    completionTokens?: number;
    reasoningTokens?: number;
    totalTokens?: number;
  };
  timestamp?: number;
}

export interface ParameterSettings {
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  seed?: number | null;
  stopSequence: string;
  jsonMode: boolean;
  enableGuardrail: boolean;
}

export interface PromptPreset {
  id: string;
  title: string;
  description: string;
  category: 'Coding' | 'Reasoning' | 'Creative' | 'Analysis' | 'Productivity';
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
}

export interface GuardrailCheckResult {
  isSafe: boolean;
  riskScore: number; // 0 to 1
  label: string;
  reason?: string;
}
