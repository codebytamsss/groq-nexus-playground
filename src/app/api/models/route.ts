import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('x-groq-api-key');
    const apiKey = authHeader || process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing Groq API Key' }, { status: 400 });
    }

    const response = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.error?.message || 'Failed to fetch models from Groq' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Sort models nicely: chat/completion models first, then sort alphabetically
    const models = (data.data || []).map((m: any) => ({
      id: m.id,
      name: m.name || m.id,
      owned_by: m.owned_by || 'Groq',
      context_length: m.context_length || m.context_window || 8192,
      max_output_length: m.max_output_length || m.max_completion_tokens || 4096,
      supported_features: m.supported_features || [],
      input_modalities: m.input_modalities || ['text'],
      output_modalities: m.output_modalities || ['text'],
      pricing: m.pricing,
      active: m.active ?? true,
    }));

    return NextResponse.json({ models });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
