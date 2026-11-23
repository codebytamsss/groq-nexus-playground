# ⚡ GROQ NEXUS — Ultra-Low Latency Generative Playground & Battle Arena

A next-generation, high-performance LLM Playground powered by **Groq LPU™ (Language Processing Units)**. Built with Next.js App Router, Tailwind CSS, and Server-Sent Events (SSE) streaming.

![Groq Nexus](https://groq.com/wp-content/uploads/2024/03/Groq-logo-black-transparent-padding.png)

---

## 🌟 What Makes GROQ NEXUS Different & Creative

Unlike basic single-model playgrounds, **GROQ NEXUS** includes advanced developer features that showcase Groq's high throughput:

### 1. ⚔️ Groq LPU Speed Battle Arena (Side-by-Side Model Race)
- Compare two different models side-by-side simultaneously (e.g. `openai/gpt-oss-120b` vs `qwen/qwen3.8-27b`).
- Real-time racing telemetry gauges: Live Tokens/Sec (TPS), Time-to-First-Token (TTFT), and latency.
- Automatic **Speed Winner calculation** (e.g. *"Winner: Model A finished 2.1x faster (+180 T/s)"*).

### 2. 🧠 Chain-of-Thought / Reasoning Inspector
- Collapsible neon reasoning drawer for reasoning models (`openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `qwen/qwen3.8-27b`).
- View the model's live chain-of-thought tokens streaming in real-time before the final answer.

### 3. ✨ "Magic Polish" AI Prompt Architect
- One-click prompt enhancer using Groq's sub-second inference.
- Options:
  - **Rich Context & Precision**: Expands prompt with edge cases and constraints.
  - **Chain-of-Thought**: Formats prompt for multi-step reasoning.
  - **Elite Code Format**: Generates production-ready technical specifications.
  - **Concise & Punchy**: Distills instructions to high-yield tokens.

### 4. 🎙️ Groq Whisper Speech-to-Text Lab
- In-browser microphone voice input and audio file transcription powered by `whisper-large-v3-turbo`.
- Direct one-click transfer into the active prompt workspace.

### 5. 🛡️ Llama Prompt Guard 2 Active Safety Scan
- Pre-submission security evaluation with `meta-llama/llama-prompt-guard-2-86m`.
- Detects prompt injection, jailbreak attempts, and safety risks before generation.

### 6. 📊 Real-Time Telemetry Bar
- Live Speedometer: **Tokens Per Second (TPS)** with dynamic threshold badges.
- **TTFT (Time to First Token)** in milliseconds.
- Execution latency in seconds.
- Token usage breakdown (Prompt, Completion, Reasoning, Total).
- Cost calculator based on exact token usage.

### 7. 💻 Multi-Language Code Exporter
- One-click export of current conversation and parameters into:
  - **Python** (`groq` SDK)
  - **TypeScript / Node** (`groq-sdk`)
  - **cURL command**
  - **Fetch API**
  - **Raw JSON payload**

### 8. 📚 Curated Prompt Template Library
- Preloaded presets for Reasoning, Systems Architecture, Structured JSON Extraction, Cyberpunk Fiction, and Security Bug Hunting.

---

## 🚀 Getting Started

### 1. Environment Configuration
The application is pre-configured with your Groq API key in `.env.local`:

```bash
GROQ_API_KEY=gsk_your_groq_api_key_here
```

*(You can also set or change your API key anytime directly inside the UI via the **API Key** settings modal).*

### 2. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### 3. Build for Production

```bash
npm run build
npm run start
```

### 4. Deploy to Vercel

Push this repository to GitHub and import it on [Vercel](https://vercel.com):
- Framework Preset: **Next.js**
- Environment Variable: `GROQ_API_KEY` = your Groq API key.
