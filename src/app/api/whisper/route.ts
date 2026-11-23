import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('x-groq-api-key');
    const apiKey = authHeader || process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing Groq API Key' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as Blob | null;
    const model = (formData.get('model') as string) || 'whisper-large-v3-turbo';
    const language = formData.get('language') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
    }

    const groqFormData = new FormData();
    groqFormData.append('file', file, 'recording.webm');
    groqFormData.append('model', model);
    if (language) {
      groqFormData.append('language', language);
    }
    groqFormData.append('response_format', 'verbose_json');

    const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: groqFormData,
    });

    if (!groqRes.ok) {
      const err = await groqRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.error?.message || 'Whisper transcription failed' },
        { status: groqRes.status }
      );
    }

    const result = await groqRes.json();
    return NextResponse.json({
      text: result.text || '',
      duration: result.duration,
      segments: result.segments || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
