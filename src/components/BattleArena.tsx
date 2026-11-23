'use client';

import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Swords, 
  Zap, 
  Clock, 
  Trophy, 
  Play, 
  RotateCcw, 
  Bot, 
  ChevronDown,
  Layers,
  Sparkles
} from 'lucide-react';
import { GroqModel } from '@/types/playground';

interface BattleArenaProps {
  models: GroqModel[];
  customApiKey?: string;
}

interface BattleResult {
  content: string;
  tps: number;
  ttft: number;
  totalTime: number;
  totalTokens: number;
  isFinished: boolean;
}

export const BattleArena: React.FC<BattleArenaProps> = ({ models, customApiKey }) => {
  const [modelA, setModelA] = useState('qwen/qwen3.8-27b');
  const [modelB, setModelB] = useState('openai/gpt-oss-120b');
  const [prompt, setPrompt] = useState(
    'Compare the architectural trade-offs between Monolithic and Microservices design patterns. Provide 3 concrete criteria for when to migrate.'
  );
  const [isBattling, setIsBattling] = useState(false);

  const [resultA, setResultA] = useState<BattleResult>({
    content: '',
    tps: 0,
    ttft: 0,
    totalTime: 0,
    totalTokens: 0,
    isFinished: false,
  });

  const [resultB, setResultB] = useState<BattleResult>({
    content: '',
    tps: 0,
    ttft: 0,
    totalTime: 0,
    totalTokens: 0,
    isFinished: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const startStream = async (
    modelId: string,
    setResult: React.Dispatch<React.SetStateAction<BattleResult>>,
    signal: AbortSignal
  ) => {
    const startTime = performance.now();
    let firstTokenTime = 0;
    let accumulatedContent = '';

    setResult({
      content: '',
      tps: 0,
      ttft: 0,
      totalTime: 0,
      totalTokens: 0,
      isFinished: false,
    });

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customApiKey ? { 'x-groq-api-key': customApiKey } : {}),
        },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 1500,
        }),
        signal,
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to start stream');
      }

      const reader = response.body.getReader();
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

            if (data.type === 'chunk' && data.content) {
              if (firstTokenTime === 0) {
                firstTokenTime = performance.now();
              }
              accumulatedContent += data.content;
              const now = performance.now();
              const elapsedSec = (now - startTime) / 1000;
              // Approximate tokens as content length / 4
              const estTokens = Math.max(1, Math.round(accumulatedContent.length / 4));
              const currentTps = elapsedSec > 0 ? estTokens / elapsedSec : 0;

              setResult((prev) => ({
                ...prev,
                content: accumulatedContent,
                tps: currentTps,
                ttft: firstTokenTime - startTime,
                totalTime: elapsedSec,
                totalTokens: estTokens,
              }));
            }

            if (data.type === 'usage' && data.usage) {
              const u = data.usage;
              const tpsFinal = u.completion_time > 0 ? u.completion_tokens / u.completion_time : 0;
              setResult((prev) => ({
                ...prev,
                tps: tpsFinal || prev.tps,
                totalTokens: u.total_tokens || prev.totalTokens,
                totalTime: u.total_time || prev.totalTime,
                isFinished: true,
              }));
            }
          } catch {
            // ignore
          }
        }
      }

      setResult((prev) => ({ ...prev, isFinished: true }));
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error(err);
      }
      setResult((prev) => ({ ...prev, isFinished: true }));
    }
  };

  const handleStartBattle = async () => {
    if (!prompt.trim() || isBattling) return;
    setIsBattling(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    await Promise.all([
      startStream(modelA, setResultA, controller.signal),
      startStream(modelB, setResultB, controller.signal),
    ]);

    setIsBattling(false);
  };

  const handleStopBattle = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsBattling(false);
    }
  };

  // Determine winner
  const bothFinished = resultA.isFinished && resultB.isFinished && resultA.content && resultB.content;
  let winner = null;
  if (bothFinished) {
    if (resultA.tps > resultB.tps) {
      const ratio = (resultA.tps / (resultB.tps || 1)).toFixed(1);
      winner = { model: modelA, side: 'A', ratio, tpsDiff: (resultA.tps - resultB.tps).toFixed(0) };
    } else {
      const ratio = (resultB.tps / (resultA.tps || 1)).toFixed(1);
      winner = { model: modelB, side: 'B', ratio, tpsDiff: (resultB.tps - resultA.tps).toFixed(0) };
    }
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-zinc-950 p-4 sm:p-6 text-zinc-100">
      {/* Header Banner */}
      <div className="relative mb-6 rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-950/40 via-zinc-900/80 to-orange-950/40 p-5 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 shadow-lg shadow-rose-500/20">
              <Swords className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Groq LPU Speed Battle Arena
              </h2>
              <p className="text-xs text-zinc-400">
                Pit two models against each other concurrently. Compare real-time tokens/sec, latency, and response quality.
              </p>
            </div>
          </div>

          {winner && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 font-mono text-xs">
              <Trophy className="h-4 w-4 text-emerald-400" />
              <div>
                <span className="font-bold text-emerald-300">Winner: Model {winner.side}</span>
                <span className="ml-1 text-zinc-400">({winner.ratio}x faster, +{winner.tpsDiff} T/s)</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Prompt Configuration */}
      <div className="mb-6 space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Battle Prompt
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <textarea
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter challenge prompt for both models..."
            className="flex-1 rounded-xl border border-zinc-700/80 bg-zinc-950 p-3 text-sm text-zinc-100 outline-none focus:border-rose-500"
          />
          <div className="flex items-center sm:flex-col justify-end gap-2">
            {isBattling ? (
              <button
                onClick={handleStopBattle}
                className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-rose-700 transition-colors"
              >
                <span>Stop Battle</span>
              </button>
            ) : (
              <button
                onClick={handleStartBattle}
                disabled={!prompt.trim()}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-500/20 hover:opacity-90 transition-opacity"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Launch Race</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Challenge Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-zinc-500 text-[11px]">Quick Tests:</span>
          <button
            onClick={() =>
              setPrompt(
                'Explain quantum entanglement and its implications for cryptography in exactly 3 short paragraphs.'
              )
            }
            className="rounded-lg bg-zinc-800/80 px-2.5 py-1 text-zinc-300 hover:bg-zinc-700"
          >
            Quantum Physics
          </button>
          <button
            onClick={() =>
              setPrompt(
                'Write a complete Python implementation of Dijkstra algorithm with priority queue and type annotations.'
              )
            }
            className="rounded-lg bg-zinc-800/80 px-2.5 py-1 text-zinc-300 hover:bg-zinc-700"
          >
            Dijkstra Algorithm
          </button>
          <button
            onClick={() =>
              setPrompt(
                'Generate a high-stakes dialogue between an AI ethics investigator and the creator of an autonomous swarm system.'
              )
            }
            className="rounded-lg bg-zinc-800/80 px-2.5 py-1 text-zinc-300 hover:bg-zinc-700"
          >
            Creative Sci-Fi
          </button>
        </div>
      </div>

      {/* Split-Screen Arena Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
        {/* Fighter 1 (Model A) */}
        <div className="flex flex-col rounded-2xl border border-rose-500/20 bg-zinc-900/40 p-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-rose-500/20 px-2 py-0.5 text-xs font-bold text-rose-400">
                FIGHTER A
              </span>
              <select
                value={modelA}
                onChange={(e) => setModelA(e.target.value)}
                disabled={isBattling}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-200 outline-none"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Fighter A Live Gauge */}
            <div className="flex items-center gap-2 font-mono text-xs">
              <div className="flex items-center gap-1 rounded bg-zinc-800 px-2 py-1 text-emerald-400 font-semibold">
                <Zap className="h-3 w-3" />
                <span>{resultA.tps > 0 ? `${resultA.tps.toFixed(1)} T/s` : '--'}</span>
              </div>
            </div>
          </div>

          {/* Fighter A Output */}
          <div className="mt-4 flex-1 overflow-y-auto rounded-xl border border-zinc-800/80 bg-zinc-950/80 p-4 text-xs min-h-[300px]">
            {resultA.content ? (
              <div className="prose prose-invert prose-xs max-w-none text-zinc-200">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {resultA.content}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-zinc-600 italic">
                {isBattling ? 'Generating stream on Groq LPU...' : 'Awaiting battle launch'}
              </div>
            )}
          </div>

          {/* Fighter A Footer Stats */}
          <div className="mt-3 flex items-center justify-between font-mono text-[11px] text-zinc-400 pt-2 border-t border-zinc-800/60">
            <span>TTFT: {resultA.ttft > 0 ? `${resultA.ttft.toFixed(0)}ms` : '--'}</span>
            <span>Total: {resultA.totalTime > 0 ? `${resultA.totalTime.toFixed(2)}s` : '--'}</span>
            <span>Tokens: {resultA.totalTokens > 0 ? resultA.totalTokens : '--'}</span>
          </div>
        </div>

        {/* Fighter 2 (Model B) */}
        <div className="flex flex-col rounded-2xl border border-orange-500/20 bg-zinc-900/40 p-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-orange-500/20 px-2 py-0.5 text-xs font-bold text-orange-400">
                FIGHTER B
              </span>
              <select
                value={modelB}
                onChange={(e) => setModelB(e.target.value)}
                disabled={isBattling}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-200 outline-none"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Fighter B Live Gauge */}
            <div className="flex items-center gap-2 font-mono text-xs">
              <div className="flex items-center gap-1 rounded bg-zinc-800 px-2 py-1 text-emerald-400 font-semibold">
                <Zap className="h-3 w-3" />
                <span>{resultB.tps > 0 ? `${resultB.tps.toFixed(1)} T/s` : '--'}</span>
              </div>
            </div>
          </div>

          {/* Fighter B Output */}
          <div className="mt-4 flex-1 overflow-y-auto rounded-xl border border-zinc-800/80 bg-zinc-950/80 p-4 text-xs min-h-[300px]">
            {resultB.content ? (
              <div className="prose prose-invert prose-xs max-w-none text-zinc-200">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {resultB.content}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-zinc-600 italic">
                {isBattling ? 'Generating stream on Groq LPU...' : 'Awaiting battle launch'}
              </div>
            )}
          </div>

          {/* Fighter B Footer Stats */}
          <div className="mt-3 flex items-center justify-between font-mono text-[11px] text-zinc-400 pt-2 border-t border-zinc-800/60">
            <span>TTFT: {resultB.ttft > 0 ? `${resultB.ttft.toFixed(0)}ms` : '--'}</span>
            <span>Total: {resultB.totalTime > 0 ? `${resultB.totalTime.toFixed(2)}s` : '--'}</span>
            <span>Tokens: {resultB.totalTokens > 0 ? resultB.totalTokens : '--'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
