/**
 * Nvmix Inference Engine
 *
 * Routes completions through Google Gemini (gemini-1.5-flash) as the real
 * AI backend.  The Nvmix API key (nvx_...) is accepted at the UI layer;
 * server-side we use GEMINI_API_KEY from the environment.
 *
 * Get a free Gemini key → https://aistudio.google.com/apikey
 */

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionOptions {
  temperature?: number;
  max_tokens?: number;
  /** Timeout in ms. Default: 30s */
  timeoutMs?: number;
}

// ─── Validate Nvmix key format (used by UI only) ───
export function isValidNvmixKey(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  const t = key.trim();
  return t.startsWith('nvx_') && t.length >= 20 && /^nvx_[a-zA-Z0-9_]+$/.test(t);
}

// ─── Convert OpenAI-style messages → Gemini contents array ───
function toGeminiContents(messages: Message[]) {
  // Extract system prompt (Gemini handles it separately)
  const systemParts: string[] = [];
  const turns: { role: string; parts: { text: string }[] }[] = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      systemParts.push(msg.content);
    } else {
      turns.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }
  }

  // If the last turn is 'model', Gemini requires a user turn after it — skip edge case
  return { systemInstruction: systemParts.join('\n\n'), contents: turns };
}

// ─── Main completion function ───
export async function generateNvmixCompletion(
  messages: Message[],
  options: CompletionOptions = {},
  _nvmixApiKey?: string   // accepted for API compatibility, not used server-side
) {
  const { temperature = 0.7, max_tokens = 4096, timeoutMs = 30000 } = options;

  // ── Resolve Gemini API key from environment ──
  const geminiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!geminiKey) {
    throw new Error(
      'Server configuration error: GEMINI_API_KEY is not set. ' +
      'Add it to your .env.local file. Get a free key at https://aistudio.google.com/apikey'
    );
  }

  const model = 'gemini-1.5-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;

  const { systemInstruction, contents } = toGeminiContents(messages);

  const payload: Record<string, any> = {
    contents,
    generationConfig: {
      temperature,
      maxOutputTokens: max_tokens,
    },
  };

  if (systemInstruction) {
    payload.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      if (res.status === 400 && errText.includes('API_KEY_INVALID')) {
        throw new Error('GEMINI_API_KEY is invalid. Check https://aistudio.google.com/apikey');
      }
      if (res.status === 429) {
        throw new Error('Gemini rate limit hit. Please wait a moment and try again.');
      }
      throw new Error(`Gemini API error ${res.status}: ${errText.substring(0, 200)}`);
    }

    const data = await res.json();
    const content: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    if (!content || content.trim().length < 5) {
      throw new Error('Gemini returned an empty response.');
    }

    console.log(`[Nvmix Engine] ✅ Gemini success | ~${Math.ceil(content.length / 4)} tokens`);

    // ── Return OpenAI-compatible response shape ──
    return {
      id: `nvmix-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      object: 'chat.completion' as const,
      created: Math.floor(Date.now() / 1000),
      model: 'nvmix-inference-v1',
      provider: 'Gemini',
      choices: [
        {
          index: 0,
          message: { role: 'assistant' as const, content },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: messages.reduce((a, m) => a + Math.ceil(m.content.length / 4), 0),
        completion_tokens: Math.ceil(content.length / 4),
        total_tokens:
          messages.reduce((a, m) => a + Math.ceil(m.content.length / 4), 0) +
          Math.ceil(content.length / 4),
      },
    };
  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err?.name === 'AbortError') {
      throw new Error(`Gemini request timed out after ${timeoutMs / 1000}s. Try again.`);
    }
    throw err;
  }
}
