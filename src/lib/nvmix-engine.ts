import { readFileSync, existsSync } from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'db.json');

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionOptions {
  temperature?: number;
  max_tokens?: number;
  /** How long to wait for ALL providers before scoring. Default: 25s */
  timeoutMs?: number;
}

// ─── Read API keys from db.json + env vars ───
const readDBKeys = (): any => {
  const keys: any = {};

  // 1. Read from db.json if exists
  if (existsSync(DB_PATH)) {
    try {
      const db = JSON.parse(readFileSync(DB_PATH, 'utf-8'));
      keys.nvidiaKey     = db.nvidiaKey     || db.NVIDIA_API_KEY;
      keys.openaiKey     = db.openaiKey     || db.OPENAI_API_KEY;
      keys.groqKey       = db.groqKey       || db.GROQ_API_KEY;
      keys.geminiKey     = db.geminiKey     || db.GEMINI_API_KEY || db.GOOGLE_API_KEY;
      keys.openrouterKey = db.openrouterKey || db.OPENROUTER_API_KEY || db.DEEPSEEK_API_KEY;
      keys.mistralKey    = db.mistralKey    || db.MISTRAL_API_KEY;
    } catch {}
  }

  // 2. Try loading from platform env file if it exists
  const envPaths = [
    'C:\\Users\\shahi\\ai-saas-platform\\frontend\\.env.local',
    path.join(process.cwd(), '.env.local'),
    path.join(process.cwd(), '..', '.env.local'),
  ];
  for (const envPath of envPaths) {
    if (existsSync(envPath)) {
      try {
        const envContent = readFileSync(envPath, 'utf-8');
        const parseEnvVar = (varName: string) => {
          const match = envContent.match(new RegExp(`^${varName}\\s*=\\s*(.*)$`, 'm'));
          return match ? match[1]?.trim()?.replace(/['"]/g, '') : null;
        };
        keys.nvidiaKey     = keys.nvidiaKey     || parseEnvVar('NVIDIA_API_KEY');
        keys.openaiKey     = keys.openaiKey     || parseEnvVar('OPENAI_API_KEY');
        keys.groqKey       = keys.groqKey       || parseEnvVar('GROQ_API_KEY');
        keys.geminiKey     = keys.geminiKey     || parseEnvVar('GEMINI_API_KEY') || parseEnvVar('GOOGLE_API_KEY');
        keys.openrouterKey = keys.openrouterKey || parseEnvVar('OPENROUTER_API_KEY') || parseEnvVar('DEEPSEEK_API_KEY');
        keys.mistralKey    = keys.mistralKey    || parseEnvVar('MISTRAL_API_KEY');
      } catch {}
    }
  }

  return keys;
};

// ─── Quality scorer: pick the BEST response, not just the first ───
function scoreResponse(content: string): number {
  if (!content || content.trim().length < 5) return 0;

  let score = 0;

  // Length: longer responses are generally better
  score += Math.min(content.length / 50, 40); // up to 40 points for length

  // Has code blocks → very valuable for technical tasks
  const codeBlockCount = (content.match(/```/g) || []).length / 2;
  score += codeBlockCount * 8; // 8 points per code block

  // Has structured sections (markdown headers)
  const headerCount = (content.match(/^#{1,4}\s/gm) || []).length;
  score += headerCount * 3;

  // Has numbered or bulleted lists
  const listItems = (content.match(/^[-*•]\s|^\d+\.\s/gm) || []).length;
  score += listItems * 1.5;

  // Penalize for error-like responses
  const lower = content.toLowerCase();
  if (lower.includes('i cannot') || lower.includes("i can't") || lower.includes('i am unable')) score -= 20;
  if (lower.includes('error') && lower.includes('api')) score -= 10;
  if (lower.includes('as an ai') && content.length < 200) score -= 15;

  // Penalize very short responses (< 50 chars probably an error)
  if (content.trim().length < 50) score -= 30;

  return score;
}

// ─── Fetch with per-provider timeout ───
const fetchProvider = async (
  provider: string,
  url: string,
  headers: any,
  payload: any,
  timeoutMs: number
): Promise<{ provider: string; data: any; content: string; score: number }> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(id);
    if (!res.ok) throw new Error(`${provider} HTTP ${res.status}`);
    const data = await res.json();
    return { provider, data, content: '', score: 0 }; // content filled below
  } catch (err: any) {
    clearTimeout(id);
    throw new Error(`${provider}: ${err.message}`);
  }
};

// ─── Main completion function ───
export async function generateNvmixCompletion(messages: Message[], options: CompletionOptions = {}) {
  const { temperature, max_tokens, timeoutMs = 25000 } = options;

  const dbKeys = readDBKeys();
  const activeOpenAIKey     = process.env.OPENAI_API_KEY     || dbKeys.openaiKey;
  const activeNvidiaKey     = process.env.NVIDIA_API_KEY     || dbKeys.nvidiaKey;
  const activeGroqKey       = process.env.GROQ_API_KEY       || dbKeys.groqKey;
  const activeGeminiKey     = process.env.GEMINI_API_KEY     || process.env.GOOGLE_API_KEY || dbKeys.geminiKey;
  const activeOpenRouterKey = process.env.OPENROUTER_API_KEY || process.env.DEEPSEEK_API_KEY || dbKeys.openrouterKey;
  const activeMistralKey    = process.env.MISTRAL_API_KEY    || dbKeys.mistralKey;

  const hasKey = [activeOpenAIKey, activeNvidiaKey, activeGroqKey, activeGeminiKey, activeOpenRouterKey, activeMistralKey]
    .some(k => k && k.trim().length > 5);

  if (!hasKey) {
    throw new Error('Nvmix: No API keys configured. Please add your keys to db.json or .env.local');
  }

  // ─── Build provider promises ───
  type ProviderResult = { provider: string; content: string; score: number; rawData: any };
  const promises: Promise<ProviderResult>[] = [];

  const wrap = async (providerName: string, fn: () => Promise<{ provider: string; data: any; content: string; score: number }>): Promise<ProviderResult> => {
    const res = await fn();
    const content = res.data?.choices?.[0]?.message?.content ?? '';
    return { provider: providerName, content, score: scoreResponse(content), rawData: res.data };
  };

  // ── OpenAI ──
  if (activeOpenAIKey?.trim().length > 5) {
    promises.push(wrap('OpenAI', () => fetchProvider(
      'OpenAI', 'https://api.openai.com/v1/chat/completions',
      { 'Content-Type': 'application/json', 'Authorization': `Bearer ${activeOpenAIKey}` },
      { model: 'gpt-4o-mini', messages, temperature: temperature ?? 0.7, max_tokens: max_tokens ?? 2048, stream: false },
      timeoutMs
    )));
  }

  // ── NVIDIA NIM ──
  if (activeNvidiaKey?.trim().length > 5) {
    promises.push(wrap('NVIDIA NIM', () => fetchProvider(
      'NVIDIA NIM', 'https://integrate.api.nvidia.com/v1/chat/completions',
      { 'Content-Type': 'application/json', 'Authorization': `Bearer ${activeNvidiaKey}` },
      { model: 'meta/llama-3.3-70b-instruct', messages, temperature: temperature ?? 0.7, max_tokens: max_tokens ?? 2048 },
      timeoutMs
    )));
  }

  // ── Groq ──
  if (activeGroqKey?.trim().length > 5) {
    promises.push(wrap('Groq', () => fetchProvider(
      'Groq', 'https://api.groq.com/openai/v1/chat/completions',
      { 'Content-Type': 'application/json', 'Authorization': `Bearer ${activeGroqKey}` },
      { model: 'llama-3.3-70b-versatile', messages, temperature: temperature ?? 0.7, max_tokens: max_tokens ?? 2048 },
      timeoutMs
    )));
  }

  // ── DeepSeek via OpenRouter or direct ──
  if (activeOpenRouterKey?.trim().length > 5) {
    const isDirectDeepSeek = activeOpenRouterKey.startsWith('sk-');
    const url = isDirectDeepSeek
      ? 'https://api.deepseek.com/v1/chat/completions'
      : 'https://openrouter.ai/api/v1/chat/completions';
    const headers = isDirectDeepSeek
      ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${activeOpenRouterKey}` }
      : { 'Content-Type': 'application/json', 'Authorization': `Bearer ${activeOpenRouterKey}`, 'HTTP-Referer': 'https://nvmix.com', 'X-Title': 'Nvmix Agents' };
    promises.push(wrap('DeepSeek', () => fetchProvider(
      'DeepSeek', url, headers,
      { model: isDirectDeepSeek ? 'deepseek-chat' : 'deepseek/deepseek-chat', messages, temperature: temperature ?? 0.7, max_tokens: max_tokens ?? 2048 },
      timeoutMs
    )));
  }

  // ── Google Gemini ──
  if (activeGeminiKey?.trim().length > 5) {
    promises.push((async (): Promise<ProviderResult> => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);
      try {
        // Filter out system messages for Gemini (not supported in same way)
        const geminiMessages = messages.filter(m => m.role !== 'system');
        const systemMsg = messages.find(m => m.role === 'system');

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${activeGeminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: geminiMessages.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
              })),
              systemInstruction: systemMsg ? { parts: [{ text: systemMsg.content }] } : undefined,
              generationConfig: { temperature: temperature ?? 0.7, maxOutputTokens: max_tokens ?? 2048 }
            }),
            signal: controller.signal,
          }
        );
        clearTimeout(id);
        if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
        const data = await res.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        return { provider: 'Google Gemini', content, score: scoreResponse(content), rawData: data };
      } catch (err: any) {
        clearTimeout(id);
        throw new Error(`Google Gemini: ${err.message}`);
      }
    })());
  }

  // ── Mistral ──
  if (activeMistralKey?.trim().length > 5) {
    promises.push(wrap('Mistral', () => fetchProvider(
      'Mistral', 'https://api.mistral.ai/v1/chat/completions',
      { 'Content-Type': 'application/json', 'Authorization': `Bearer ${activeMistralKey}` },
      { model: 'mistral-large-latest', messages, temperature: temperature ?? 0.7, max_tokens: max_tokens ?? 2048 },
      timeoutMs
    )));
  }

  if (promises.length === 0) {
    throw new Error('Nvmix: No valid providers configured.');
  }

  // ─── Wait for ALL providers, then pick BEST response ───
  const results = await Promise.allSettled(promises);

  const successful = results
    .filter((r): r is PromiseFulfilledResult<ProviderResult> => r.status === 'fulfilled' && r.value.content.trim().length > 5)
    .map(r => r.value);

  if (successful.length === 0) {
    const errors = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map(r => r.reason?.message || String(r.reason))
      .join(' | ');
    throw new Error(`Nvmix: All providers failed. Errors: ${errors}`);
  }

  // Sort by quality score — highest wins
  successful.sort((a, b) => b.score - a.score);
  const best = successful[0];

  console.log(
    `[Nvmix Engine] ${successful.length}/${promises.length} providers responded. ` +
    `Best: ${best.provider} (score: ${best.score.toFixed(1)}). ` +
    `All scores: ${successful.map(s => `${s.provider}:${s.score.toFixed(0)}`).join(', ')}`
  );

  return {
    id: `nvmix-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    object: 'chat.completion' as const,
    created: Math.floor(Date.now() / 1000),
    model: 'nvmix-inference-v1',
    provider: best.provider,
    providers_tried: successful.length,
    choices: [
      {
        index: 0,
        message: { role: 'assistant' as const, content: best.content },
        finish_reason: 'stop',
      },
    ],
    usage: {
      prompt_tokens:     messages.reduce((acc, m) => acc + Math.ceil(m.content.length / 4), 0),
      completion_tokens: Math.ceil(best.content.length / 4),
      total_tokens:      messages.reduce((acc, m) => acc + Math.ceil(m.content.length / 4), 0) + Math.ceil(best.content.length / 4),
    },
  };
}
