'use client';

import React, { useState, useRef } from 'react';
import { 
  Mic, 
  Square, 
  Upload, 
  Copy, 
  Check, 
  Zap, 
  Clock, 
  FileAudio,
  Radio,
  ArrowRight
} from 'lucide-react';

interface WhisperLabModalProps {
  customApiKey?: string;
  onSendToChat?: (text: string) => void;
}

export const WhisperLabModal: React.FC<WhisperLabModalProps> = ({
  customApiKey,
  onSendToChat,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [latency, setLatency] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [copied, setCopied] = useState(false);
  const [selectedModel, setSelectedModel] = useState('whisper-large-v3-turbo');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        await handleTranscribe(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      alert('Could not access microphone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleTranscribe = async (blob: Blob) => {
    setIsTranscribing(true);
    const start = performance.now();

    try {
      const formData = new FormData();
      formData.append('file', blob);
      formData.append('model', selectedModel);

      const res = await fetch('/api/whisper', {
        method: 'POST',
        headers: {
          ...(customApiKey ? { 'x-groq-api-key': customApiKey } : {}),
        },
        body: formData,
      });

      const data = await res.json();
      const elapsed = (performance.now() - start) / 1000;
      setLatency(elapsed);

      if (data.text) {
        setTranscription(data.text);
        if (data.duration) setAudioDuration(data.duration);
      } else {
        setTranscription('Transcription returned empty or failed.');
      }
    } catch (err: any) {
      setTranscription(`Transcription failed: ${err.message}`);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleTranscribe(file);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(transcription);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-zinc-950 p-4 sm:p-6 text-zinc-100">
      {/* Header Banner */}
      <div className="relative mb-6 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-zinc-900/80 to-blue-950/40 p-5 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
            <Radio className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Groq Whisper Speech-to-Text Lab
            </h2>
            <p className="text-xs text-zinc-400">
              Ultra-fast audio transcription running on Groq LPUs with whisper-large-v3-turbo.
            </p>
          </div>
        </div>
      </div>

      {/* Control Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
        {/* Left: Recording & Upload Panel */}
        <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Whisper Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 outline-none"
              >
                <option value="whisper-large-v3-turbo">whisper-large-v3-turbo (Ultra Fast)</option>
                <option value="whisper-large-v3">whisper-large-v3 (Maximum Accuracy)</option>
              </select>
            </div>

            {/* Mic Recording Card */}
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700/80 bg-zinc-950/60 p-6 text-center">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`flex h-20 w-20 items-center justify-center rounded-full transition-all ${
                  isRecording
                    ? 'bg-rose-500 text-white animate-pulse shadow-xl shadow-rose-500/40 scale-105'
                    : 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white hover:opacity-90 shadow-lg shadow-cyan-500/20'
                }`}
              >
                {isRecording ? <Square className="h-8 w-8 fill-current" /> : <Mic className="h-8 w-8" />}
              </button>
              <div className="mt-4 font-semibold text-sm text-zinc-200">
                {isRecording ? `Recording... (${recordingSeconds}s)` : 'Tap to Start Speaking'}
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                {isRecording ? 'Click to stop and transcribe' : 'Transcribes in a fraction of a second'}
              </p>
            </div>

            {/* File Upload Option */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 py-3 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                <Upload className="h-4 w-4 text-cyan-400" />
                <span>Upload Audio File (mp3, wav, m4a, webm)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Output & Metrics Panel */}
        <div className="md:col-span-2 flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-zinc-200">Transcript Output</span>
              {isTranscribing && (
                <span className="text-xs text-cyan-400 animate-pulse font-mono">
                  Transcribing on Groq LPU...
                </span>
              )}
            </div>

            {transcription && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                {onSendToChat && (
                  <button
                    onClick={() => onSendToChat(transcription)}
                    className="flex items-center gap-1 rounded bg-cyan-500/20 border border-cyan-500/40 px-2 py-0.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/30"
                  >
                    <span>Use in Studio</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 flex-1 rounded-xl border border-zinc-800/80 bg-zinc-950 p-4 font-mono text-sm leading-relaxed text-zinc-200 min-h-[200px] overflow-y-auto">
            {transcription || (
              <span className="text-zinc-600 italic">
                Transcribed speech text will stream here instantly after recording or file upload.
              </span>
            )}
          </div>

          {/* Telemetry Metrics */}
          <div className="mt-4 flex items-center justify-between rounded-xl bg-zinc-950/80 p-3 font-mono text-xs text-zinc-400 border border-zinc-800/60">
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-emerald-400" />
              <span>Inference Latency: </span>
              <span className="text-emerald-400 font-bold">
                {latency > 0 ? `${latency.toFixed(2)}s` : '--'}
              </span>
            </div>
            {audioDuration > 0 && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-cyan-400" />
                <span>Audio Duration: </span>
                <span className="text-zinc-200">{audioDuration.toFixed(1)}s</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
