import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GROQ NEXUS | Ultra-Fast LLM Playground & Battle Arena',
  description:
    'Next-generation Groq LPU playground featuring multi-model speed battles, chain-of-thought inspector, Whisper audio lab, and real-time token telemetry.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full dark antialiased bg-zinc-950 text-zinc-100">
      <body className="h-full flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
        {children}
      </body>
    </html>
  );
}
