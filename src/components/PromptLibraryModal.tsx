'use client';

import React from 'react';
import { X, Sparkles, ArrowRight, BookOpen } from 'lucide-react';
import { PROMPT_PRESETS } from '@/data/presets';
import { PromptPreset } from '@/types/playground';

interface PromptLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: PromptPreset) => void;
}

export const PromptLibraryModal: React.FC<PromptLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 p-5">
          <div className="flex items-center gap-2.5">
            <BookOpen className="h-5 w-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">Prompt Template Library</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Preset Cards Grid */}
        <div className="overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {PROMPT_PRESETS.map((preset) => (
            <div
              key={preset.id}
              className="group flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 hover:border-amber-500/50 hover:bg-zinc-900/80 transition-all"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                    {preset.category}
                  </span>
                  {preset.temperature !== undefined && (
                    <span className="font-mono text-[10px] text-zinc-500">
                      Temp: {preset.temperature}
                    </span>
                  )}
                </div>
                <h4 className="mt-2 text-sm font-bold text-zinc-100 group-hover:text-amber-300 transition-colors">
                  {preset.title}
                </h4>
                <p className="mt-1 text-xs text-zinc-400 line-clamp-2">
                  {preset.description}
                </p>
                <div className="mt-3 rounded-lg bg-zinc-950 p-2.5 text-[11px] font-mono text-zinc-400 line-clamp-2">
                  {preset.userPrompt}
                </div>
              </div>

              <button
                onClick={() => {
                  onSelectPreset(preset);
                  onClose();
                }}
                className="mt-4 flex items-center justify-between rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 group-hover:bg-amber-500 group-hover:text-black transition-all"
              >
                <span>Load into Studio</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
