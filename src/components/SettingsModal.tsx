'use client';

import React, { useState } from 'react';
import { X, Key, ShieldCheck, Check, AlertCircle, RefreshCw } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey,
}) => {
  const [keyInput, setKeyInput] = useState(apiKey);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTestKey = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/models', {
        headers: {
          ...(keyInput ? { 'x-groq-api-key': keyInput } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        setTestResult({
          success: true,
          message: `Active! Successfully accessed ${data.models?.length || 0} Groq models.`,
        });
      } else {
        const err = await res.json().catch(() => ({}));
        setTestResult({
          success: false,
          message: err.error || 'Failed to authenticate with Groq API.',
        });
      }
    } catch {
      setTestResult({
        success: false,
        message: 'Network error while validating key.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    onSaveApiKey(keyInput.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-orange-400" />
            <h3 className="text-base font-bold text-white">Groq API Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Groq API Key
            </label>
            <input
              type="password"
              placeholder="gsk_..."
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-100 outline-none focus:border-orange-500"
            />
            <p className="mt-1 text-[11px] text-zinc-500">
              Leave blank to use the pre-configured environment key, or input your personal Groq key.
            </p>
          </div>

          {testResult && (
            <div
              className={`flex items-start gap-2 rounded-xl p-3 text-xs ${
                testResult.success
                  ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : 'border border-rose-500/30 bg-rose-500/10 text-rose-300'
              }`}
            >
              {testResult.success ? (
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleTestKey}
              disabled={testing}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${testing ? 'animate-spin' : ''}`} />
              <span>Validate Key</span>
            </button>

            <button
              onClick={handleSave}
              className="flex-1 rounded-xl bg-orange-500 py-2 text-xs font-bold text-white hover:bg-orange-600 transition-colors"
            >
              Save & Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
