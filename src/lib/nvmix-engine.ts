/**
 * Nvmix Inference Engine — OFFICIAL NVMIX API ONLY
 * 
 * This engine exclusively uses Nvmix API keys (format: nvx_...).
 * No other third-party API keys are accepted or supported.
 * Get your key at: https://nvmix.com/dashboard/api-keys
 */

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionOptions {
  temperature?: number;
  max_tokens?: number;
  /** Timeout in ms. Default: 25s */
  timeoutMs?: number;
}

// ─── Validate that a key is a genuine Nvmix API key ───
export function isValidNvmixKey(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  // Nvmix API keys must start with nvx_ and be at least 20 chars
  return trimmed.startsWith('nvx_') && trimmed.length >= 20;
}

// ─── Nvmix platform API endpoints (ordered by priority) ───
const NVMIX_ENDPOINTS = [
  'https://nvmix.com/api/v1/chat/completions',
  'https://nemix-jjjj.vercel.app/api/v1/chat/completions',
];

// ─── Main completion function — Nvmix API only ───
export async function generateNvmixCompletion(
  messages: Message[],
  options: CompletionOptions = {},
  nvmixApiKey?: string
) {
  const { temperature = 0.7, max_tokens = 2048, timeoutMs = 25000 } = options;

  // Resolve the API key — only from parameter or NVMIX_API_KEY env var
  const resolvedKey = (
    nvmixApiKey?.trim() ||
    process.env.NVMIX_API_KEY?.trim()
  );

  if (!resolvedKey || !isValidNvmixKey(resolvedKey)) {
    throw new Error(
      'Nvmix: Invalid or missing API key. ' +
      'Only Nvmix API keys (starting with nvx_) are supported. ' +
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

  let lastError: Error | null = null;

  for (const endpoint of NVMIX_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(endpoint, {
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

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        if (res.status === 401) {
          throw new Error(
            `Nvmix API key is invalid or expired (401). ` +
            `Please check your key at https://nvmix.com/dashboard/api-keys`
          );
        }
        lastError = new Error(`Nvmix API error ${res.status}: ${errText}`);
        continue; // Try next endpoint
      }

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content ?? '';

      if (!content || content.trim().length < 5) {
        lastError = new Error('Nvmix API returned an empty response.');
        continue;
      }

      console.log(`[Nvmix Engine] Success via ${endpoint} | tokens: ~${Math.ceil(content.length / 4)}`);

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
          prompt_tokens: messages.reduce((acc, m) => acc + Math.ceil(m.content.length / 4), 0),
          completion_tokens: Math.ceil(content.length / 4),
          total_tokens:
            messages.reduce((acc, m) => acc + Math.ceil(m.content.length / 4), 0) +
            Math.ceil(content.length / 4),
        },
      };
    } catch (err: any) {
      // Re-throw 401 immediately — no point trying other endpoints
      if (err?.message?.includes('401') || err?.message?.includes('invalid or expired')) {
        throw err;
      }
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[Nvmix Engine] Endpoint ${endpoint} failed: ${lastError.message}`);
    }
  }

  throw lastError ?? new Error('Nvmix: All endpoints failed. Check your connection and API key.');
}
