import "server-only";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * OpenAI-compatible chat completion, used for hints and error explanation.
 * Returns null when no provider key is configured — callers must show an
 * honest "AI tutor not configured" state rather than fabricating a reply.
 * See docs/ARCHITECTURE.md and .env.example (AI_PROVIDER_*).
 */
export async function getAIChatCompletion(messages: ChatMessage[]): Promise<string | null> {
  const apiKey = process.env.AI_PROVIDER_API_KEY;
  if (!apiKey) return null;

  const baseUrl = process.env.AI_PROVIDER_BASE_URL ?? "https://api.openai.com/v1";
  const model = process.env.AI_PROVIDER_MODEL ?? "gpt-4o-mini";

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, temperature: 0.4, max_tokens: 300 }),
  });

  if (!res.ok) {
    console.error("[ai] provider request failed", res.status, await res.text());
    return null;
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? null;
}
