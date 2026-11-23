import { ChatMessage, ParameterSettings } from '@/types/playground';

export function generatePythonCode(
  messages: ChatMessage[],
  model: string,
  params: ParameterSettings,
  apiKey: string = 'YOUR_GROQ_API_KEY'
): string {
  const formattedMessages = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  return `import os
from groq import Groq

client = Groq(
    api_key=os.environ.get("GROQ_API_KEY", "${apiKey.startsWith('gsk_') ? apiKey.slice(0, 10) + '...' : apiKey}"),
)

completion = client.chat.completions.create(
    model="${model}",
    messages=${JSON.stringify(formattedMessages, null, 4)},
    temperature=${params.temperature},
    max_tokens=${params.maxTokens},
    top_p=${params.topP},
    stream=True,${params.stopSequence ? `\n    stop=["${params.stopSequence}"],` : ''}${params.seed ? `\n    seed=${params.seed},` : ''}${params.jsonMode ? `\n    response_format={"type": "json_object"},` : ''}
)

for chunk in completion:
    print(chunk.choices[0].delta.content or "", end="")
`;
}

export function generateTypeScriptCode(
  messages: ChatMessage[],
  model: string,
  params: ParameterSettings,
  apiKey: string = 'YOUR_GROQ_API_KEY'
): string {
  const formattedMessages = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  return `import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "${apiKey.startsWith('gsk_') ? apiKey.slice(0, 10) + '...' : apiKey}",
});

async function main() {
  const chatCompletion = await groq.chat.completions.create({
    messages: ${JSON.stringify(formattedMessages, null, 4)},
    model: "${model}",
    temperature: ${params.temperature},
    max_tokens: ${params.maxTokens},
    top_p: ${params.topP},
    stream: true,${params.stopSequence ? `\n    stop: ["${params.stopSequence}"],` : ''}${params.seed ? `\n    seed: ${params.seed},` : ''}${params.jsonMode ? `\n    response_format: { type: "json_object" },` : ''}
  });

  for await (const chunk of chatCompletion) {
    process.stdout.write(chunk.choices[0]?.delta?.content || "");
  }
}

main();
`;
}

export function generateCurlCode(
  messages: ChatMessage[],
  model: string,
  params: ParameterSettings,
  apiKey: string = 'YOUR_GROQ_API_KEY'
): string {
  const formattedMessages = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const payload: any = {
    model,
    messages: formattedMessages,
    temperature: params.temperature,
    max_tokens: params.maxTokens,
    top_p: params.topP,
    stream: true,
  };

  if (params.stopSequence) payload.stop = [params.stopSequence];
  if (params.seed) payload.seed = params.seed;
  if (params.jsonMode) payload.response_format = { type: 'json_object' };

  return `curl "https://api.groq.com/openai/v1/chat/completions" \\
  -X POST \\
  -H "Authorization: Bearer \${GROQ_API_KEY:-${apiKey.startsWith('gsk_') ? apiKey.slice(0, 10) + '...' : apiKey}}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(payload, null, 2)}'`;
}

export function generateFetchCode(
  messages: ChatMessage[],
  model: string,
  params: ParameterSettings,
  apiKey: string = 'YOUR_GROQ_API_KEY'
): string {
  const formattedMessages = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  return `const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": \`Bearer \${process.env.GROQ_API_KEY || "${apiKey.startsWith('gsk_') ? apiKey.slice(0, 10) + '...' : apiKey}"}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "${model}",
    messages: ${JSON.stringify(formattedMessages, null, 4)},
    temperature: ${params.temperature},
    max_tokens: ${params.maxTokens},
    stream: true,
  }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  console.log(decoder.decode(value));
}
`;
}
