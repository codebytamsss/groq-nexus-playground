'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  Mic, 
  Square, 
  ShieldAlert, 
  ShieldCheck, 
  ChevronUp, 
  Paperclip,
  Loader2,
  Plus
} from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  onStopStreaming: () => void;
  isStreaming: boolean;
  onAddMessage: (role: 'system' | 'user' | 'assistant') => void;
  onTranscribeAudio: (blob: Blob) => Promise<string | null>;
  customApiKey?: string;
  enableGuardrail?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onStopStreaming,
  isStreaming,
  onAddMessage,
  onTranscribeAudio,
  customApiKey,
  enableGuardrail = false,
}) => {
  const [input, setInput] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceMenuOpen, setEnhanceMenuOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [guardChecking, setGuardChecking] = useState(false);
  const [guardStatus, setGuardStatus] = useState<{ isSafe: boolean; label: string } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    if (enableGuardrail) {
      setGuardChecking(true);
      try {
        const res = await fetch('/api/prompt-guard', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(customApiKey ? { 'x-groq-api-key': customApiKey } : {}),
          },
          body: JSON.stringify({ prompt: input }),
        });
        const data = await res.json();
        setGuardStatus({ isSafe: data.isSafe, label: data.label });
        if (!data.isSafe) {
          setGuardChecking(false);
          const proceed = window.confirm(
            'Llama Prompt Guard flagged this prompt as potentially unsafe/injection. Do you still wish to submit?'
          );
          if (!proceed) return;
        }
      } catch {
        // Continue if check fails
      } finally {
        setGuardChecking(false);
      }
    }

    onSendMessage(input);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  // Enhance prompt with Groq
  const handleEnhance = async (style: string) => {
    if (!input.trim() || isEnhancing) return;
    setIsEnhancing(true);
    setEnhanceMenuOpen(false);

    try {
      const res = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customApiKey ? { 'x-groq-api-key': customApiKey } : {}),
        },
        body: JSON.stringify({ prompt: input, style }),
      });
      const data = await res.json();
      if (data.enhancedPrompt) {
        setInput(data.enhancedPrompt);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsEnhancing(false);
    }
  };

  // Audio Recording with Groq Whisper
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const transcribedText = await onTranscribeAudio(audioBlob);
        if (transcribedText) {
          setInput((prev) => (prev ? `${prev} ${transcribedText}` : transcribedText));
        }
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Could not access microphone. Please allow audio permission in browser.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  return (
    <div className="relative border-t border-zinc-800/80 bg-zinc-950/80 p-3 sm:p-4 backdrop-blur-md">
      {/* Top Helper Bar */}
      <div className="flex items-center justify-between pb-2 text-[11px] text-zinc-400">
        <div className="flex items-center gap-2">
          {/* Add Manual Turns */}
          <div className="flex items-center gap-1">
            <span className="text-zinc-500 font-medium">Add block:</span>
            <button
              onClick={() => onAddMessage('user')}
              className="rounded bg-zinc-900 px-2 py-0.5 text-blue-400 hover:bg-zinc-800 transition-colors"
            >
              + User
            </button>
            <button
              onClick={() => onAddMessage('assistant')}
              className="rounded bg-zinc-900 px-2 py-0.5 text-orange-400 hover:bg-zinc-800 transition-colors"
            >
              + Assistant
            </button>
          </div>

          {/* Prompt Guard Badge */}
          {enableGuardrail && guardStatus && (
            <div
              className={`flex items-center gap-1 rounded px-2 py-0.5 ${
                guardStatus.isSafe
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}
            >
              {guardStatus.isSafe ? (
                <ShieldCheck className="h-3 w-3" />
              ) : (
                <ShieldAlert className="h-3 w-3" />
              )}
              <span>{guardStatus.label}</span>
            </div>
          )}
        </div>

        {/* Prompt Enhancer Dropdown */}
        <div className="relative flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEnhanceMenuOpen(!enhanceMenuOpen)}
            disabled={!input.trim() || isEnhancing}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 transition-all ${
              input.trim()
                ? 'border-orange-500/30 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20'
                : 'border-zinc-800 bg-zinc-900/50 text-zinc-500 cursor-not-allowed'
            }`}
          >
            {isEnhancing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            <span className="font-medium">Magic Polish</span>
            <ChevronUp className="h-3 w-3" />
          </button>

          {enhanceMenuOpen && (
            <div className="absolute right-0 bottom-full mb-1 w-56 rounded-xl border border-zinc-700 bg-zinc-900 p-1.5 shadow-2xl z-50 text-xs">
              <div className="px-2 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                Groq AI Prompt Optimizer
              </div>
              <button
                onClick={() => handleEnhance('detailed')}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-zinc-200 hover:bg-zinc-800"
              >
                <span>Rich Context & Precision</span>
              </button>
              <button
                onClick={() => handleEnhance('cot')}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-zinc-200 hover:bg-zinc-800"
              >
                <span>Add Chain-of-Thought</span>
              </button>
              <button
                onClick={() => handleEnhance('code')}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-zinc-200 hover:bg-zinc-800"
              >
                <span>Elite Code Format</span>
              </button>
              <button
                onClick={() => handleEnhance('concise')}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-zinc-200 hover:bg-zinc-800"
              >
                <span>Concise & Punchy</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Input Box Area */}
      <div className="relative flex items-end gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/90 p-2 shadow-inner focus-within:border-orange-500/80 transition-colors">
        {/* Whisper Mic Button */}
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          title={isRecording ? 'Stop Whisper recording' : 'Speak with Groq Whisper'}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all ${
            isRecording
              ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30'
              : 'text-zinc-400 hover:bg-zinc-800 hover:text-cyan-400'
          }`}
        >
          <Mic className="h-5 w-5" />
        </button>

        {/* Text Area */}
        <div className="relative flex-1">
          {isRecording ? (
            <div className="flex h-10 items-center gap-3 px-2 text-xs text-rose-400 font-mono">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping"></span>
              <span>Recording audio ({recordingSeconds}s)... Click mic or stop to transcribe</span>
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter message or prompt... (Cmd+Enter to send)"
              className="w-full resize-none bg-transparent py-2 px-1 text-sm text-zinc-100 placeholder-zinc-500 outline-none max-h-44 scrollbar-thin"
            />
          )}
        </div>

        {/* Action Button: Send or Stop */}
        {isStreaming ? (
          <button
            type="button"
            onClick={onStopStreaming}
            title="Stop streaming"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 hover:bg-rose-500/30 transition-all"
          >
            <Square className="h-4 w-4 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || guardChecking}
            title="Send prompt (Cmd+Enter)"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all ${
              input.trim()
                ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/20 hover:opacity-90'
                : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
            }`}
          >
            {guardChecking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Keyboard Shortcut Hint */}
      <div className="mt-1.5 flex justify-end text-[10px] text-zinc-600 font-mono">
        <span>Press <kbd className="rounded bg-zinc-900 px-1 py-0.5 border border-zinc-800">⌘</kbd> + <kbd className="rounded bg-zinc-900 px-1 py-0.5 border border-zinc-800">Enter</kbd> to run</span>
      </div>
    </div>
  );
};
