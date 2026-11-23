'use client';

import React from 'react';
import { 
  Zap, 
  Swords, 
  Sparkles, 
  Mic, 
  Settings, 
  Code2, 
  BookOpen, 
  Trash2, 
  Download,
  Share2
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'studio' | 'arena' | 'whisper';
  setActiveTab: (tab: 'studio' | 'arena' | 'whisper') => void;
  onOpenSettings: () => void;
  onOpenPresets: () => void;
  onOpenCode: () => void;
  onClearChat: () => void;
  customApiKey: string;
  hasMessages: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenPresets,
  onOpenCode,
  onClearChat,
  customApiKey,
  hasMessages,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-rose-500 to-amber-600 shadow-lg shadow-orange-500/20">
            <Zap className="h-5 w-5 text-white" />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-zinc-950"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold tracking-tight text-white text-base lg:text-lg flex items-center gap-1.5">
                GROQ <span className="bg-gradient-to-r from-orange-400 to-rose-400 bg-clip-text text-transparent">NEXUS</span>
              </h1>
              <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-[10px] font-semibold text-orange-400">
                LPU™ ACCELERATED
              </span>
            </div>
            <p className="hidden text-xs text-zinc-400 sm:block">
              Ultra-Low Latency Generative Playground & Battle Arena
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-900/90 p-1">
          <button
            onClick={() => setActiveTab('studio')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'studio'
                ? 'bg-zinc-800 text-white shadow-sm shadow-zinc-950'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-orange-400" />
            <span>Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('arena')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'arena'
                ? 'bg-zinc-800 text-white shadow-sm shadow-zinc-950'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Swords className="h-3.5 w-3.5 text-rose-400" />
            <span>Battle Arena</span>
            <span className="rounded-full bg-rose-500/20 px-1.5 py-0.2 text-[9px] font-bold text-rose-300">
              Race
            </span>
          </button>

          <button
            onClick={() => setActiveTab('whisper')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'whisper'
                ? 'bg-zinc-800 text-white shadow-sm shadow-zinc-950'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Mic className="h-3.5 w-3.5 text-cyan-400" />
            <span>Whisper Lab</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Preset Library Button */}
          <button
            onClick={onOpenPresets}
            title="Prompt Library"
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/70 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <BookOpen className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden md:inline">Templates</span>
          </button>

          {/* Export Code */}
          <button
            onClick={onOpenCode}
            title="Export Code (Python, TS, cURL)"
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/70 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <Code2 className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden md:inline">Code</span>
          </button>

          {/* Clear Session */}
          {hasMessages && (
            <button
              onClick={onClearChat}
              title="Clear Conversation"
              className="flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/70 p-1.5 text-zinc-400 hover:border-rose-900/50 hover:bg-rose-950/30 hover:text-rose-400 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}

          {/* Settings / API Key */}
          <button
            onClick={onOpenSettings}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
              customApiKey
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                : 'border-zinc-800 bg-zinc-900/70 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <Settings className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {customApiKey ? 'Custom Key' : 'API Key'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
