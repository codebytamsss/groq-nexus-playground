import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('x-groq-api-key');
    const apiKey = authHeader || process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing Groq API Key' }, { status: 400 });
    }

    const { prompt, style = 'detailed' } = await request.json();
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const styleInstructions: Record<string, string> = {
      detailed: 'Enhance this prompt by adding rich context, clear constraints, high quality expectations, and edge-case instructions.',
      cot: 'Transform this prompt into an optimal chain-of-thought prompt, instructing the model to think step-by-step and show its reasoning before answering.',
      concise: 'Clarify and distill this prompt into punchy, unambiguous, high-yield instructions for the model.',
      code: 'Refactor this into an elite software engineering prompt: specify language versions, modular clean code, error handling, and test cases.',
    };

    const instruction = styleInstructions[style] || styleInstructions.detailed;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.8-27b',
        messages: [
          {
            role: 'system',
            content: `You are an expert prompt engineer. ${instruction}
Return ONLY the final enhanced prompt text directly without any introductory conversational filler (do not say "Here is the prompt:").`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.6,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.error?.message || 'Failed to enhance prompt' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const enhanced = data.choices?.[0]?.message?.content?.trim() || prompt;

    return NextResponse.json({ enhancedPrompt: enhanced });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
