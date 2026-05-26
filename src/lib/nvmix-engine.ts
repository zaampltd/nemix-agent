/**
 * Nvmix Inference Engine — OFFICIAL NVMIX API ONLY
 *
 * Exclusively uses Nvmix API keys (format: nvx_...).
 * No third-party AI keys are accepted or used.
 * Get your key at: https://nvmix.com/dashboard/api-keys
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

// ─── Validate Nvmix key format ───
export function isValidNvmixKey(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  const t = key.trim();
  return t.startsWith('nvx_') && t.length >= 20 && /^nvx_[a-zA-Z0-9_]+$/.test(t);
}

// ─── Nvmix API endpoint ───
const NVMIX_ENDPOINT = 'https://nvmix.com/api/v1/chat/completions';

// ─── Main completion function — Nvmix API only ───
export async function generateNvmixCompletion(
  messages: Message[],
  options: CompletionOptions = {},
  nvmixApiKey?: string
) {
  const { temperature = 0.7, max_tokens = 4096, timeoutMs = 30000 } = options;

  // Resolve API key — only from parameter or NVMIX_API_KEY env var
  const resolvedKey = nvmixApiKey?.trim() || process.env.NVMIX_API_KEY?.trim();

  if (!resolvedKey || !isValidNvmixKey(resolvedKey)) {
    throw new Error(
      'Nvmix: Invalid or missing API key. ' +
      'Only Nvmix keys (starting with nvx_) are supported. ' +
      'Get your key at https://nvmix.com/dashboard/api-keys'
    );
  }

  const payload = {
    model: 'nvmix-inference-v1',
    messages,
    temperature,
    max_tokens,
    stream: false,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(NVMIX_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resolvedKey}`,
        'X-Client': 'nvmix-agents/1.0',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (networkErr: any) {
    clearTimeout(timeoutId);

    // AbortError = timeout
    if (networkErr?.name === 'AbortError') {
      throw new Error(
        `Nvmix API request timed out after ${timeoutMs / 1000}s. ` +
        'Check your internet connection or try again later.'
      );
    }

    // General network failure (server unreachable, DNS fail, etc.)
    throw new Error(
      `Cannot reach Nvmix API (${networkErr?.message || 'network error'}). ` +
      'Please check your internet connection. ' +
      'If the issue persists, visit https://nvmix.com/status'
    );
  }

  // ── HTTP error responses ──
  if (!res.ok) {
    const errText = await res.text().catch(() => '');

    if (res.status === 401) {
      throw new Error(
        'Nvmix API key is invalid or expired (401). ' +
        'Check your key at https://nvmix.com/dashboard/api-keys'
      );
    }
    if (res.status === 402) {
      throw new Error('Nvmix account has insufficient credits (402). Top up at https://nvmix.com/billing');
    }
    if (res.status === 429) {
      throw new Error('Nvmix rate limit reached (429). Please wait a moment and try again.');
    }
    if (res.status >= 500) {
      throw new Error(`Nvmix server error (${res.status}). The Nvmix API is temporarily unavailable.`);
    }

    throw new Error(`Nvmix API error ${res.status}: ${errText.substring(0, 200)}`);
  }

  // ── Parse response ──
  const data = await res.json().catch(() => {
    throw new Error('Nvmix API returned an invalid (non-JSON) response.');
  });

  const content: string = data?.choices?.[0]?.message?.content ?? '';

  if (!content || content.trim().length < 5) {
    throw new Error('Nvmix API returned an empty response. Please try again.');
  }

  console.log(`[Nvmix Engine] ✅ Success | ~${Math.ceil(content.length / 4)} tokens`);

  return {
    id: `nvmix-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    object: 'chat.completion' as const,
    created: Math.floor(Date.now() / 1000),
    model: 'nvmix-inference-v1',
    provider: 'Nvmix',
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
}
