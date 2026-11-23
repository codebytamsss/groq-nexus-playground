'use client';

import React from 'react';
import { Gauge, Clock, Coins, Sparkles, Cpu, Layers } from 'lucide-react';

interface TelemetryProps {
  tps: number;
  ttft: number;
  totalTime: number;
  promptTokens: number;
  completionTokens: number;
  reasoningTokens?: number;
  totalTokens: number;
  isStreaming: boolean;
  modelName: string;
}

export const TelemetryBar: React.FC<TelemetryProps> = ({
  tps,
  ttft,
  totalTime,
  promptTokens,
  completionTokens,
  reasoningTokens = 0,
  totalTokens,
  isStreaming,
  modelName,
}) => {
  // Speed badge styling
  const getSpeedColor = (rate: number) => {
    if (rate >= 400) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (rate >= 200) return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
    if (rate > 0) return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
    return 'text-zinc-500 bg-zinc-900 border-zinc-800';
  };

  // Rough Groq cost calculation ($0.08 / 1M prompt, $0.30 / 1M completion)
  const estimatedCost = (
    (promptTokens * 0.00000008) +
    (completionTokens * 0.00000030)
  ).toFixed(6);

  return (
    <div className="w-full border-b border-zinc-800/80 bg-zinc-950/60 px-4 py-2 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-y-2 text-xs">
        {/* Left: Live Speedometer & Model Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono">
            <Cpu className="h-3.5 w-3.5 text-zinc-400" />
            <span className="text-zinc-400">Model:</span>
            <span className="font-semibold text-zinc-200 truncate max-w-[160px] sm:max-w-[240px]">
              {modelName}
            </span>
          </div>

          <div
            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono transition-all ${getSpeedColor(
              tps
            )}`}
          >
            <Gauge className={`h-3.5 w-3.5 ${isStreaming ? 'animate-spin' : ''}`} />
            <span className="font-bold">
              {tps > 0 ? `${tps.toFixed(1)} T/s` : '0.0 T/s'}
            </span>
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-sans">
              SPEED
            </span>
          </div>

          {isStreaming && (
            <div className="flex items-center gap-1.5 text-orange-400 animate-pulse text-[11px] font-medium">
              <span className="h-2 w-2 rounded-full bg-orange-500"></span>
              Streaming on Groq LPU...
            </div>
          )}
        </div>

        {/* Right: Telemetry Metrics */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-5 font-mono text-zinc-400">
          {/* TTFT */}
          <div className="flex items-center gap-1.5" title="Time to first token">
            <Clock className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-zinc-500">TTFT:</span>
            <span className="text-zinc-200 font-medium">
              {ttft > 0 ? `${ttft.toFixed(0)} ms` : '--'}
            </span>
          </div>

          {/* Latency / Total Time */}
          <div className="flex items-center gap-1.5" title="Total response latency">
            <span className="text-zinc-500">Latency:</span>
            <span className="text-zinc-200 font-medium">
              {totalTime > 0 ? `${totalTime.toFixed(2)}s` : '--'}
            </span>
          </div>

          {/* Token Counts */}
          <div className="flex items-center gap-1.5" title="Prompt + Completion tokens">
            <Layers className="h-3.5 w-3.5 text-purple-400" />
            <span className="text-zinc-500">Tokens:</span>
            <span className="text-zinc-200 font-medium">
              {totalTokens > 0 ? `${totalTokens}` : '--'}
            </span>
            {completionTokens > 0 && (
              <span className="text-[10px] text-zinc-500">
                ({promptTokens} in / {completionTokens} out{reasoningTokens > 0 ? ` / ${reasoningTokens} think` : ''})
              </span>
            )}
          </div>

          {/* Cost */}
          <div className="hidden lg:flex items-center gap-1.5" title="Estimated Groq API cost">
            <Coins className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-zinc-500">Cost:</span>
            <span className="text-emerald-400 font-medium">${estimatedCost}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
