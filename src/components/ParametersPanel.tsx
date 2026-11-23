'use client';

import React, { useState } from 'react';
import { 
  Sliders, 
  ChevronDown, 
  RotateCcw, 
  ShieldCheck, 
  HelpCircle,
  Hash,
  Terminal,
  FileCode,
  Zap
} from 'lucide-react';
import { GroqModel, ParameterSettings } from '@/types/playground';

interface ParametersPanelProps {
  models: GroqModel[];
  selectedModel: string;
  onSelectModel: (id: string) => void;
  params: ParameterSettings;
  onChangeParams: (updater: (prev: ParameterSettings) => ParameterSettings) => void;
  onResetParams: () => void;
  isLoadingModels: boolean;
}

export const ParametersPanel: React.FC<ParametersPanelProps> = ({
  models,
  selectedModel,
  onSelectModel,
  params,
  onChangeParams,
  onResetParams,
  isLoadingModels,
}) => {
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [searchModel, setSearchModel] = useState('');

  const currentModel = models.find((m) => m.id === selectedModel);

  const filteredModels = models.filter((m) => 
    m.id.toLowerCase().includes(searchModel.toLowerCase()) ||
    m.name.toLowerCase().includes(searchModel.toLowerCase()) ||
    m.owned_by.toLowerCase().includes(searchModel.toLowerCase())
  );

  const getTempLabel = (val: number) => {
    if (val === 0) return 'Strict & Deterministic';
    if (val <= 0.4) return 'Precise & Factual';
    if (val <= 0.8) return 'Balanced (Recommended)';
    if (val <= 1.2) return 'Creative & Expressive';
    return 'Highly Random / Experimental';
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto border-l border-zinc-800 bg-zinc-950/70 p-4 text-xs scrollbar-thin scrollbar-thumb-zinc-800">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-1.5 font-semibold text-zinc-200">
          <Sliders className="h-4 w-4 text-orange-400" />
          <span>Hyperparameters</span>
        </div>
        <button
          onClick={onResetParams}
          title="Reset to defaults"
          className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Reset</span>
        </button>
      </div>

      <div className="mt-4 space-y-5">
        {/* Model Selection */}
        <div className="space-y-1.5">
          <label className="flex items-center justify-between font-medium text-zinc-300">
            <span>Model</span>
            {currentModel && (
              <span className="font-mono text-[10px] text-zinc-500">
                {(currentModel.context_length / 1024).toFixed(0)}k ctx
              </span>
            )}
          </label>

          <div className="relative">
            <button
              type="button"
              onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
              className="flex w-full items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-left text-zinc-200 hover:border-zinc-700 transition-colors"
            >
              <div className="truncate pr-2">
                <div className="font-medium text-white truncate">
                  {currentModel?.name || selectedModel}
                </div>
                <div className="text-[10px] text-zinc-400 truncate font-mono">
                  {currentModel?.id || selectedModel}
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-zinc-400 shrink-0" />
            </button>

            {modelDropdownOpen && (
              <div className="absolute left-0 top-full z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-900 p-1 shadow-2xl">
                <div className="p-1 pb-2">
                  <input
                    type="text"
                    value={searchModel}
                    onChange={(e) => setSearchModel(e.target.value)}
                    placeholder="Search models..."
                    className="w-full rounded border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-200 outline-none focus:border-orange-500"
                    autoFocus
                  />
                </div>

                {filteredModels.length === 0 ? (
                  <div className="p-2 text-center text-zinc-500">No models found</div>
                ) : (
                  filteredModels.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        onSelectModel(m.id);
                        setModelDropdownOpen(false);
                      }}
                      className={`flex w-full flex-col rounded-md px-2.5 py-2 text-left transition-colors ${
                        m.id === selectedModel
                          ? 'bg-orange-500/10 border border-orange-500/30 text-white'
                          : 'hover:bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-zinc-100">{m.name}</span>
                        <span className="rounded bg-zinc-800 px-1 py-0.5 text-[9px] text-zinc-400">
                          {m.owned_by}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                        <span className="truncate">{m.id}</span>
                        <span>{(m.context_length / 1024).toFixed(0)}k</span>
                      </div>
                      {m.supported_features && m.supported_features.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {m.supported_features.map((feat) => (
                            <span
                              key={feat}
                              className="rounded bg-zinc-800/80 px-1 py-0.2 text-[8px] uppercase tracking-wider text-orange-400/90"
                            >
                              {feat}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Temperature */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="font-medium text-zinc-300">Temperature</label>
            <span className="font-mono font-semibold text-orange-400">
              {params.temperature.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="2"
            step="0.05"
            value={params.temperature}
            onChange={(e) =>
              onChangeParams((prev) => ({ ...prev, temperature: parseFloat(e.target.value) }))
            }
            className="w-full accent-orange-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
          />
          <div className="text-[10px] text-zinc-500 italic">
            {getTempLabel(params.temperature)}
          </div>
        </div>

        {/* Max Output Tokens */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="font-medium text-zinc-300">Max Tokens</label>
            <span className="font-mono font-semibold text-zinc-200">
              {params.maxTokens}
            </span>
          </div>
          <input
            type="range"
            min="64"
            max={currentModel?.max_output_length || 8192}
            step="64"
            value={params.maxTokens}
            onChange={(e) =>
              onChangeParams((prev) => ({ ...prev, maxTokens: parseInt(e.target.value) }))
            }
            className="w-full accent-orange-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
            <span>64</span>
            <span>{currentModel?.max_output_length || 8192}</span>
          </div>
        </div>

        {/* Top P (Nucleus Sampling) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="font-medium text-zinc-300">Top P</label>
            <span className="font-mono font-semibold text-zinc-200">
              {params.topP.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={params.topP}
            onChange={(e) =>
              onChangeParams((prev) => ({ ...prev, topP: parseFloat(e.target.value) }))
            }
            className="w-full accent-orange-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
          />
          <div className="text-[10px] text-zinc-500">
            Controls diversity via nucleus sampling
          </div>
        </div>

        {/* Penalties (Frequency & Presence) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="text-zinc-400">Freq. Penalty</label>
              <span className="font-mono text-zinc-300">{params.frequencyPenalty.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="-2"
              max="2"
              step="0.1"
              value={params.frequencyPenalty}
              onChange={(e) =>
                onChangeParams((prev) => ({ ...prev, frequencyPenalty: parseFloat(e.target.value) }))
              }
              className="w-full accent-orange-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="text-zinc-400">Pres. Penalty</label>
              <span className="font-mono text-zinc-300">{params.presencePenalty.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="-2"
              max="2"
              step="0.1"
              value={params.presencePenalty}
              onChange={(e) =>
                onChangeParams((prev) => ({ ...prev, presencePenalty: parseFloat(e.target.value) }))
              }
              className="w-full accent-orange-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Seed (Reproducibility) */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 font-medium text-zinc-300">
            <Hash className="h-3 w-3 text-zinc-400" />
            <span>Random Seed</span>
          </label>
          <input
            type="number"
            placeholder="e.g. 42 (optional)"
            value={params.seed ?? ''}
            onChange={(e) =>
              onChangeParams((prev) => ({
                ...prev,
                seed: e.target.value === '' ? null : parseInt(e.target.value),
              }))
            }
            className="w-full rounded border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 font-mono text-xs text-zinc-200 outline-none focus:border-orange-500"
          />
        </div>

        {/* Stop Sequences */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 font-medium text-zinc-300">
            <Terminal className="h-3 w-3 text-zinc-400" />
            <span>Stop Sequence</span>
          </label>
          <input
            type="text"
            placeholder="e.g. STOP, \n\n"
            value={params.stopSequence}
            onChange={(e) =>
              onChangeParams((prev) => ({ ...prev, stopSequence: e.target.value }))
            }
            className="w-full rounded border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 font-mono text-xs text-zinc-200 outline-none focus:border-orange-500"
          />
        </div>

        {/* Creative Toggles */}
        <div className="space-y-2.5 pt-2 border-t border-zinc-800/80">
          {/* JSON Mode */}
          <div className="flex items-center justify-between rounded-lg border border-zinc-800/90 bg-zinc-900/40 p-2.5">
            <div className="flex items-center gap-2">
              <FileCode className="h-4 w-4 text-emerald-400" />
              <div>
                <div className="font-semibold text-zinc-200">Strict JSON Mode</div>
                <div className="text-[10px] text-zinc-500">Guarantees valid JSON object output</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={params.jsonMode}
              onChange={(e) =>
                onChangeParams((prev) => ({ ...prev, jsonMode: e.target.checked }))
              }
              className="h-4 w-4 accent-orange-500 rounded cursor-pointer"
            />
          </div>

          {/* Prompt Guard Active Safety */}
          <div className="flex items-center justify-between rounded-lg border border-zinc-800/90 bg-zinc-900/40 p-2.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
              <div>
                <div className="font-semibold text-zinc-200">Llama Prompt Guard</div>
                <div className="text-[10px] text-zinc-500">Check jailbreak / injection safety</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={params.enableGuardrail}
              onChange={(e) =>
                onChangeParams((prev) => ({ ...prev, enableGuardrail: e.target.checked }))
              }
              className="h-4 w-4 accent-cyan-500 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
