'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Bot, 
  User, 
  Terminal, 
  Copy, 
  Check, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  ChevronDown, 
  ChevronRight,
  BrainCircuit,
  Zap
} from 'lucide-react';
import { ChatMessage } from '@/types/playground';

interface MessageItemProps {
  message: ChatMessage;
  onUpdateContent: (id: string, newContent: string) => void;
  onDeleteMessage: (id: string) => void;
  onRegenerate?: () => void;
  isLatestAssistant?: boolean;
  isStreaming?: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onUpdateContent,
  onDeleteMessage,
  onRegenerate,
  isLatestAssistant,
  isStreaming,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [reasoningOpen, setReasoningOpen] = useState(true);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    onUpdateContent(message.id, editContent);
    setIsEditing(false);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'system':
        return (
          <div className="flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-bold text-purple-400 uppercase tracking-wider">
            <Terminal className="h-3 w-3" />
            <span>System Prompt</span>
          </div>
        );
      case 'user':
        return (
          <div className="flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold text-blue-400 uppercase tracking-wider">
            <User className="h-3 w-3" />
            <span>User</span>
          </div>
        );
      case 'assistant':
      default:
        return (
          <div className="flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-0.5 text-[10px] font-bold text-orange-400 uppercase tracking-wider">
            <Bot className="h-3 w-3" />
            <span>Assistant</span>
          </div>
        );
    }
  };

  return (
    <div
      className={`group relative rounded-xl border p-4 transition-all ${
        message.role === 'system'
          ? 'border-purple-900/40 bg-purple-950/10 hover:border-purple-800/60'
          : message.role === 'user'
          ? 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700/80'
          : 'border-zinc-800/80 bg-zinc-950/60 hover:border-zinc-700 shadow-sm'
      }`}
    >
      {/* Top Bar of the Message Card */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/40">
        <div className="flex items-center gap-2">
          {getRoleBadge(message.role)}

          {/* Assistant Metrics Badge */}
          {message.role === 'assistant' && message.metrics && (
            <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400">
              {message.metrics.tps && message.metrics.tps > 0 && (
                <span className="flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                  <Zap className="h-3 w-3" />
                  {message.metrics.tps.toFixed(1)} T/s
                </span>
              )}
              {message.metrics.totalTokens && (
                <span className="text-zinc-500">
                  {message.metrics.totalTokens} tokens
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleCopy}
            title="Copy message text"
            className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>

          <button
            onClick={() => {
              setEditContent(message.content);
              setIsEditing(!isEditing);
            }}
            title="Edit message"
            className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>

          {message.role === 'assistant' && onRegenerate && isLatestAssistant && !isStreaming && (
            <button
              onClick={onRegenerate}
              title="Regenerate response"
              className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-orange-400 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            onClick={() => onDeleteMessage(message.id)}
            title="Delete message"
            className="rounded p-1 text-zinc-500 hover:bg-rose-950/40 hover:text-rose-400 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Reasoning / Thinking Drawer (Chain of Thought) */}
      {message.reasoning && (
        <div className="my-3 rounded-lg border border-amber-500/20 bg-amber-500/5 overflow-hidden">
          <button
            onClick={() => setReasoningOpen(!reasoningOpen)}
            className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold text-amber-400/90 hover:bg-amber-500/10 transition-colors"
          >
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-4 w-4 animate-pulse" />
              <span>Thought Process / Reasoning Trace</span>
            </div>
            {reasoningOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          {reasoningOpen && (
            <div className="px-3 pb-3 pt-1 text-xs font-mono text-zinc-400 whitespace-pre-wrap leading-relaxed border-t border-amber-500/10 bg-black/40">
              {message.reasoning}
            </div>
          )}
        </div>
      )}

      {/* Message Content Area */}
      <div className="mt-3">
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-sm text-zinc-200 outline-none focus:border-orange-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="rounded px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="rounded bg-orange-500 px-3 py-1 text-xs font-semibold text-white hover:bg-orange-600"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="prose prose-invert max-w-none text-sm leading-relaxed text-zinc-200 break-words">
            {message.role === 'assistant' ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match && !String(children).includes('\n');
                    return isInline ? (
                      <code className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-orange-300" {...props}>
                        {children}
                      </code>
                    ) : (
                      <div className="relative my-3 rounded-lg border border-zinc-800 bg-zinc-900/90 p-3 overflow-x-auto">
                        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-zinc-800 text-[10px] text-zinc-400 font-mono">
                          <span>{match ? match[1] : 'code'}</span>
                          <button
                            onClick={() => navigator.clipboard.writeText(String(children))}
                            className="hover:text-white"
                          >
                            Copy code
                          </button>
                        </div>
                        <code className="font-mono text-xs leading-normal block text-zinc-200" {...props}>
                          {children}
                        </code>
                      </div>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            ) : (
              <p className="whitespace-pre-wrap">{message.content}</p>
            )}

            {isStreaming && isLatestAssistant && message.role === 'assistant' && (
              <span className="inline-block h-3.5 w-1.5 bg-orange-400 animate-pulse ml-0.5 align-middle" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
