'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Code2, Terminal, FileCode } from 'lucide-react';
import { ChatMessage, ParameterSettings } from '@/types/playground';
import {
  generatePythonCode,
  generateTypeScriptCode,
  generateCurlCode,
  generateFetchCode,
} from '@/utils/codeGenerators';

interface CodeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  model: string;
  params: ParameterSettings;
  apiKey?: string;
}

export const CodeExportModal: React.FC<CodeExportModalProps> = ({
  isOpen,
  onClose,
  messages,
  model,
  params,
  apiKey,
}) => {
  const [activeLang, setActiveLang] = useState<'python' | 'ts' | 'curl' | 'fetch' | 'json'>('python');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const getCode = () => {
    switch (activeLang) {
      case 'python':
        return generatePythonCode(messages, model, params, apiKey);
      case 'ts':
        return generateTypeScriptCode(messages, model, params, apiKey);
      case 'curl':
        return generateCurlCode(messages, model, params, apiKey);
      case 'fetch':
        return generateFetchCode(messages, model, params, apiKey);
      case 'json':
        return JSON.stringify(
          {
            model,
            messages: messages.map((m) => ({ role: m.role, content: m.content })),
            temperature: params.temperature,
            max_tokens: params.maxTokens,
            top_p: params.topP,
            stream: true,
          },
          null,
          2
        );
      default:
        return '';
    }
  };

  const codeText = getCode();

  const handleCopy = () => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 p-4">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Export Playground Code</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Language Tabs */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-900/60 px-4 py-2">
          <div className="flex gap-2">
            {(
              [
                { id: 'python', label: 'Python (groq)' },
                { id: 'ts', label: 'TypeScript / Node' },
                { id: 'curl', label: 'cURL' },
                { id: 'fetch', label: 'Fetch API' },
                { id: 'json', label: 'Raw JSON' },
              ] as const
            ).map((lang) => (
              <button
                key={lang.id}
                onClick={() => setActiveLang(lang.id)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                  activeLang === lang.id
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        {/* Code View */}
        <div className="flex-1 overflow-auto bg-black p-4">
          <pre className="font-mono text-xs leading-relaxed text-emerald-300 whitespace-pre">
            {codeText}
          </pre>
        </div>
      </div>
    </div>
  );
};
