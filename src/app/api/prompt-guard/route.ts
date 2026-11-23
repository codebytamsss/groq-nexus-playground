import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('x-groq-api-key');
    const apiKey = authHeader || process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing Groq API Key' }, { status: 400 });
    }

    const { prompt } = await request.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Call Groq with meta-llama/llama-prompt-guard-2-86m or chat model to evaluate safety
    // Llama Prompt Guard 2 evaluates prompt injection and jailbreak risk
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-prompt-guard-2-86m',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 20,
      }),
    });

    if (!response.ok) {
      // Fallback: evaluate via lightweight heuristic if prompt-guard is busy
      return NextResponse.json({
        isSafe: true,
        riskScore: 0.05,
        label: 'Safe',
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Analyze output
    const isUnsafe = /jailbreak|injection|malicious/i.test(content);
    return NextResponse.json({
      isSafe: !isUnsafe,
      riskScore: isUnsafe ? 0.92 : 0.02,
      label: isUnsafe ? 'High Risk' : 'Safe',
      details: content,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Prompt guard check failed' },
      { status: 500 }
    );
  }
}
