import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('x-groq-api-key');
    const apiKey = authHeader || process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing Groq API Key' }, { status: 400 });
    }

    const body = await request.json();
    const {
      messages,
      model = 'qwen/qwen3.8-27b',
      temperature = 0.7,
      max_tokens = 2048,
      top_p = 1,
      frequency_penalty = 0,
      presence_penalty = 0,
      seed = null,
      stop = undefined,
      json_mode = false,
    } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    // Filter out messages with empty content (unless it's an assistant message with reasoning)
    const formattedMessages = messages
      .filter((m: any) => m.content?.trim() || m.role === 'system')
      .map((m: any) => ({
        role: m.role,
        content: m.content || '',
      }));

    const payload: any = {
      model,
      messages: formattedMessages,
      temperature: Number(temperature),
      max_tokens: Number(max_tokens),
      top_p: Number(top_p),
      frequency_penalty: Number(frequency_penalty),
      presence_penalty: Number(presence_penalty),
      stream: true,
      stream_options: {
        include_usage: true,
      },
    };

    if (seed !== null && seed !== undefined && !isNaN(Number(seed))) {
      payload.seed = Number(seed);
    }

    if (stop && typeof stop === 'string' && stop.trim().length > 0) {
      payload.stop = stop.includes(',') ? stop.split(',').map((s) => s.trim()) : stop.trim();
    }

    if (json_mode) {
      payload.response_format = { type: 'json_object' };
    }

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!groqResponse.ok) {
      const err = await groqResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.error?.message || `Groq API returned status ${groqResponse.status}` },
        { status: groqResponse.status }
      );
    }

    if (!groqResponse.body) {
      return NextResponse.json({ error: 'No response body from Groq API' }, { status: 500 });
    }

    // Transform raw SSE stream from Groq into a clean SSE stream for the frontend
    const reader = groqResponse.body.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed.startsWith(':')) continue;

              if (trimmed === 'data: [DONE]') {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
                continue;
              }

              if (trimmed.startsWith('data: ')) {
                const jsonStr = trimmed.slice(6);
                try {
                  const parsed = JSON.parse(jsonStr);

                  // Check if delta content or reasoning exists
                  const choice = parsed.choices?.[0];
                  const delta = choice?.delta;
                  const usage = parsed.usage;
                  const finishReason = choice?.finish_reason;

                  if (delta?.content !== undefined || delta?.reasoning !== undefined || finishReason) {
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({
                          type: 'chunk',
                          content: delta?.content || '',
                          reasoning: delta?.reasoning || '',
                          finish_reason: finishReason || null,
                        })}\n\n`
                      )
                    );
                  }

                  if (usage) {
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({
                          type: 'usage',
                          usage,
                        })}\n\n`
                      )
                    );
                  }
                } catch {
                  // In case of non-JSON data
                }
              }
            }
          }

          controller.close();
        } catch (err: any) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'error', error: err.message || 'Stream error' })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
