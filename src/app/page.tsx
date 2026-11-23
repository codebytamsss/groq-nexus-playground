'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Navbar 
} from '@/components/Navbar';
import { TelemetryBar } from '@/components/TelemetryBar';
import { ParametersPanel } from '@/components/ParametersPanel';
import { MessageItem } from '@/components/MessageItem';
import { ChatInput } from '@/components/ChatInput';
import { BattleArena } from '@/components/BattleArena';
import { PromptLibraryModal } from '@/components/PromptLibraryModal';
import { CodeExportModal } from '@/components/CodeExportModal';
import { SettingsModal } from '@/components/SettingsModal';
import { WhisperLabModal } from '@/components/WhisperLabModal';
import { 
  GroqModel, 
  ChatMessage, 
  ParameterSettings, 
  PromptPreset 
} from '@/types/playground';
import { 
  Sliders, 
  Sparkles, 
  Bot, 
  Terminal, 
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

const DEFAULT_MODELS: GroqModel[] = [
  {
    id: 'qwen/qwen3.8-27b',
    name: 'Qwen 3.8 27B (High Throughput & Reasoning)',
    owned_by: 'Alibaba Cloud',
    context_length: 131072,
    max_output_length: 16384,
    supported_features: ['tools', 'json_mode', 'reasoning'],
  },
  {
    id: 'openai/gpt-oss-120b',
    name: 'GPT OSS 120B (High Reasoning & Accuracy)',
    owned_by: 'OpenAI',
    context_length: 131072,
    max_output_length: 65536,
    supported_features: ['tools', 'json_mode', 'structured_outputs', 'reasoning'],
  },
  {
    id: 'openai/gpt-oss-20b',
    name: 'GPT OSS 20B (Fast Reasoning & Math)',
    owned_by: 'OpenAI',
    context_length: 131072,
    max_output_length: 65536,
    supported_features: ['tools', 'json_mode', 'reasoning'],
  },
  {
    id: 'allam-2-7b',
    name: 'ALLaM 2 7B',
    owned_by: 'SDAIA',
    context_length: 4096,
    max_output_length: 4096,
  },
];

const DEFAULT_PARAMS: ParameterSettings = {
  temperature: 0.7,
  maxTokens: 2048,
  topP: 1.0,
  frequencyPenalty: 0.0,
  presencePenalty: 0.0,
  seed: null,
  stopSequence: '',
  jsonMode: false,
  enableGuardrail: false,
};

export default function PlaygroundPage() {
  const [activeTab, setActiveTab] = useState<'studio' | 'arena' | 'whisper'>('studio');
  const [models, setModels] = useState<GroqModel[]>(DEFAULT_MODELS);
  const [selectedModel, setSelectedModel] = useState<string>('qwen/qwen3.8-27b');
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(false);
  const [customApiKey, setCustomApiKey] = useState<string>('');

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isCodeOpen, setIsCodeOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Hyperparameters
  const [params, setParams] = useState<ParameterSettings>(DEFAULT_PARAMS);

  // Chat Messages
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'sys-1',
      role: 'system',
      content:
        'You are a high-performance AI assistant powered by Groq LPUs. Provide clear, direct, and rigorous answers.',
    },
    {
      id: 'usr-1',
      role: 'user',
      content:
        'Explain why Groq LPU architecture delivers significantly faster token throughput than conventional GPUs.',
    },
  ]);

  // Streaming & Telemetry
  const [isStreaming, setIsStreaming] = useState(false);
  const [telemetry, setTelemetry] = useState({
    tps: 0,
    ttft: 0,
    totalTime: 0,
    promptTokens: 0,
    completionTokens: 0,
    reasoningTokens: 0,
    totalTokens: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load custom API key from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('groq_nexus_custom_key');
    if (savedKey) setCustomApiKey(savedKey);
  }, []);

  // Fetch dynamic models list from Groq
  useEffect(() => {
    const fetchModels = async () => {
      setIsLoadingModels(true);
      try {
        const res = await fetch('/api/models', {
          headers: {
            ...(customApiKey ? { 'x-groq-api-key': customApiKey } : {}),
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.models && data.models.length > 0) {
            // Keep chat models primarily
            const chatModels = data.models.filter(
              (m: any) =>
                !m.id.startsWith('whisper') &&
                !m.id.startsWith('canopylabs') &&
                !m.id.includes('guard')
            );
            setModels(chatModels.length > 0 ? chatModels : data.models);
            // Default to qwen/qwen3.8-27b or first model
            const exists = chatModels.find((m: any) => m.id === selectedModel);
            if (!exists && chatModels.length > 0) {
              setSelectedModel(chatModels[0].id);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load models:', err);
      } finally {
        setIsLoadingModels(false);
      }
    };

    fetchModels();
  }, [customApiKey]);

  // Auto scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Handle Save API Key
  const handleSaveApiKey = (newKey: string) => {
    setCustomApiKey(newKey);
    if (newKey) {
      localStorage.setItem('groq_nexus_custom_key', newKey);
    } else {
      localStorage.removeItem('groq_nexus_custom_key');
    }
  };

  // Add a message
  const handleAddMessage = (role: 'system' | 'user' | 'assistant') => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      role,
      content:
        role === 'system'
          ? 'You are an AI assistant.'
          : role === 'user'
          ? 'Enter your question here...'
          : 'Response will be generated here.',
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  // Update a message content
  const handleUpdateContent = (id: string, newContent: string) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, content: newContent } : msg))
    );
  };

  // Delete a message
  const handleDeleteMessage = (id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  };

  // Clear chat
  const handleClearChat = () => {
    setMessages([
      {
        id: 'sys-1',
        role: 'system',
        content: 'You are a high-performance AI assistant powered by Groq LPUs.',
      },
    ]);
    setTelemetry({
      tps: 0,
      ttft: 0,
      totalTime: 0,
      promptTokens: 0,
      completionTokens: 0,
      reasoningTokens: 0,
      totalTokens: 0,
    });
  };

  // Load Preset
  const handleSelectPreset = (preset: PromptPreset) => {
    setMessages([
      {
        id: 'sys-preset',
        role: 'system',
        content: preset.systemPrompt,
      },
      {
        id: 'usr-preset',
        role: 'user',
        content: preset.userPrompt,
      },
    ]);
    if (preset.temperature !== undefined) {
      setParams((prev) => ({ ...prev, temperature: preset.temperature || 0.7 }));
    }
  };

  // Transcribe audio blob via Groq Whisper
  const handleTranscribeAudio = async (blob: Blob): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('file', blob);
      formData.append('model', 'whisper-large-v3-turbo');

      const res = await fetch('/api/whisper', {
        method: 'POST',
        headers: {
          ...(customApiKey ? { 'x-groq-api-key': customApiKey } : {}),
        },
        body: formData,
      });

      const data = await res.json();
      return data.text || null;
    } catch (err) {
      console.error('Whisper transcription error:', err);
      return null;
    }
  };

  // Run Chat Completion Stream
  const handleSendMessage = async (userContent?: string) => {
    let currentMessages = [...messages];

    if (userContent && userContent.trim()) {
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: userContent.trim(),
      };
      currentMessages = [...currentMessages, userMsg];
      setMessages(currentMessages);
    }

    // Assistant placeholder
    const assistantId = `asst-${Date.now()}`;
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      reasoning: '',
    };

    setMessages([...currentMessages, assistantMsg]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const startTime = performance.now();
    let firstTokenTime = 0;
    let accumulatedContent = '';
    let accumulatedReasoning = '';

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customApiKey ? { 'x-groq-api-key': customApiKey } : {}),
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: currentMessages,
          temperature: params.temperature,
          max_tokens: params.maxTokens,
          top_p: params.topP,
          frequency_penalty: params.frequencyPenalty,
          presence_penalty: params.presencePenalty,
          seed: params.seed,
          stop: params.stopSequence,
          json_mode: params.jsonMode,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error status ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const jsonStr = trimmed.slice(6);

          try {
            const data = JSON.parse(jsonStr);

            if (data.type === 'chunk') {
              if (firstTokenTime === 0 && (data.content || data.reasoning)) {
                firstTokenTime = performance.now();
                setTelemetry((prev) => ({
                  ...prev,
                  ttft: firstTokenTime - startTime,
                }));
              }

              if (data.content) accumulatedContent += data.content;
              if (data.reasoning) accumulatedReasoning += data.reasoning;

              const now = performance.now();
              const elapsedSec = (now - startTime) / 1000;
              const estCompletionTokens = Math.max(
                1,
                Math.round(accumulatedContent.length / 4)
              );
              const liveTps = elapsedSec > 0 ? estCompletionTokens / elapsedSec : 0;

              setTelemetry((prev) => ({
                ...prev,
                tps: liveTps,
                totalTime: elapsedSec,
                completionTokens: estCompletionTokens,
                totalTokens: prev.promptTokens + estCompletionTokens,
              }));

              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantId
                    ? {
                        ...msg,
                        content: accumulatedContent,
                        reasoning: accumulatedReasoning,
                        metrics: {
                          tps: liveTps,
                          ttft: firstTokenTime - startTime,
                          totalTime: elapsedSec,
                          completionTokens: estCompletionTokens,
                        },
                      }
                    : msg
                )
              );
            }

            if (data.type === 'usage' && data.usage) {
              const u = data.usage;
              const finalTps =
                u.completion_time > 0 ? u.completion_tokens / u.completion_time : 0;

              setTelemetry({
                tps: finalTps,
                ttft: firstTokenTime > 0 ? firstTokenTime - startTime : 0,
                totalTime: u.total_time || (performance.now() - startTime) / 1000,
                promptTokens: u.prompt_tokens || 0,
                completionTokens: u.completion_tokens || 0,
                reasoningTokens: u.completion_tokens_details?.reasoning_tokens || 0,
                totalTokens: u.total_tokens || 0,
              });

              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantId
                    ? {
                        ...msg,
                        metrics: {
                          tps: finalTps,
                          ttft: firstTokenTime > 0 ? firstTokenTime - startTime : 0,
                          totalTime: u.total_time,
                          promptTokens: u.prompt_tokens,
                          completionTokens: u.completion_tokens,
                          reasoningTokens:
                            u.completion_tokens_details?.reasoning_tokens,
                          totalTokens: u.total_tokens,
                        },
                      }
                    : msg
                )
              );
            }

            if (data.type === 'error') {
              throw new Error(data.error);
            }
          } catch {
            // ignore non-json
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content:
                    msg.content +
                    `\n\n> ⚠️ **Error:** ${err.message || 'Stream connection interrupted'}`,
                }
              : msg
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  };

  const handleRegenerate = () => {
    if (messages.length === 0 || isStreaming) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role === 'assistant') {
      setMessages((prev) => prev.slice(0, -1));
    }
    handleSendMessage();
  };

  const selectedModelObj = models.find((m) => m.id === selectedModel);

  return (
    <div className="flex h-screen w-screen flex-col bg-zinc-950 font-sans antialiased overflow-hidden">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenPresets={() => setIsPresetsOpen(true)}
        onOpenCode={() => setIsCodeOpen(true)}
        onClearChat={handleClearChat}
        customApiKey={customApiKey}
        hasMessages={messages.length > 1}
      />

      {/* Real-time Telemetry Bar */}
      <TelemetryBar
        tps={telemetry.tps}
        ttft={telemetry.ttft}
        totalTime={telemetry.totalTime}
        promptTokens={telemetry.promptTokens}
        completionTokens={telemetry.completionTokens}
        reasoningTokens={telemetry.reasoningTokens}
        totalTokens={telemetry.totalTokens}
        isStreaming={isStreaming}
        modelName={selectedModelObj?.name || selectedModel}
      />

      {/* Main Content Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Studio Playground View */}
        {activeTab === 'studio' && (
          <>
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800">
                <div className="mx-auto max-w-4xl space-y-4">
                  {messages.map((message, index) => (
                    <MessageItem
                      key={message.id}
                      message={message}
                      onUpdateContent={handleUpdateContent}
                      onDeleteMessage={handleDeleteMessage}
                      onRegenerate={handleRegenerate}
                      isLatestAssistant={
                        message.role === 'assistant' &&
                        index === messages.length - 1
                      }
                      isStreaming={isStreaming}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Bottom Chat Input */}
              <div className="mx-auto w-full max-w-4xl">
                <ChatInput
                  onSendMessage={handleSendMessage}
                  onStopStreaming={handleStopStreaming}
                  isStreaming={isStreaming}
                  onAddMessage={handleAddMessage}
                  onTranscribeAudio={handleTranscribeAudio}
                  customApiKey={customApiKey}
                  enableGuardrail={params.enableGuardrail}
                />
              </div>
            </div>

            {/* Sidebar Toggle for Mobile / Small Screens */}
            <div className="relative">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="hidden lg:flex absolute -left-3 top-6 z-20 h-6 w-6 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-300 shadow-md hover:bg-zinc-800"
              >
                {isSidebarOpen ? (
                  <ChevronRight className="h-3.5 w-3.5" />
                ) : (
                  <ChevronLeft className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            {/* Hyperparameters Sidebar */}
            <div
              className={`${
                isSidebarOpen ? 'w-80' : 'w-0 hidden'
              } transition-all duration-200 border-l border-zinc-800/80 bg-zinc-950/90 hidden lg:block`}
            >
              <ParametersPanel
                models={models}
                selectedModel={selectedModel}
                onSelectModel={setSelectedModel}
                params={params}
                onChangeParams={setParams}
                onResetParams={() => setParams(DEFAULT_PARAMS)}
                isLoadingModels={isLoadingModels}
              />
            </div>
          </>
        )}

        {/* Battle Arena View (Creative Split-Screen Speed Race) */}
        {activeTab === 'arena' && (
          <div className="flex-1 overflow-hidden">
            <BattleArena models={models} customApiKey={customApiKey} />
          </div>
        )}

        {/* Whisper Audio Lab View */}
        {activeTab === 'whisper' && (
          <div className="flex-1 overflow-hidden">
            <WhisperLabModal
              customApiKey={customApiKey}
              onSendToChat={(text) => {
                handleSendMessage(text);
                setActiveTab('studio');
              }}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <PromptLibraryModal
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        onSelectPreset={handleSelectPreset}
      />

      <CodeExportModal
        isOpen={isCodeOpen}
        onClose={() => setIsCodeOpen(false)}
        messages={messages}
        model={selectedModel}
        params={params}
        apiKey={customApiKey || 'gsk_...'}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={customApiKey}
        onSaveApiKey={handleSaveApiKey}
      />
    </div>
  );
}
