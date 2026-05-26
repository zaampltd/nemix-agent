import { readFileSync, existsSync } from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'db.json');
const PLATFORM_ENV_PATH = 'C:\\Users\\shahi\\ai-saas-platform\\frontend\\.env.local';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionOptions {
  temperature?: number;
  max_tokens?: number;
}

const readDBKeys = (): any => {
  const keys: any = {};
  
  // 1. Read from db.json if exists
  if (existsSync(DB_PATH)) {
    try {
      const db = JSON.parse(readFileSync(DB_PATH, 'utf-8'));
      keys.nvidiaKey = db.nvidiaKey || db.NVIDIA_API_KEY;
      keys.openaiKey = db.openaiKey || db.OPENAI_API_KEY;
      keys.groqKey = db.groqKey || db.GROQ_API_KEY;
      keys.geminiKey = db.geminiKey || db.GEMINI_API_KEY || db.GOOGLE_API_KEY;
      keys.openrouterKey = db.openrouterKey || db.OPENROUTER_API_KEY || db.DEEPSEEK_API_KEY;
      keys.mistralKey = db.mistralKey || db.MISTRAL_API_KEY;
    } catch {}
  }
  
  // 2. Resilient fallback: parse main platform's .env.local file to fetch active keys
  if (existsSync(PLATFORM_ENV_PATH)) {
    try {
      const envContent = readFileSync(PLATFORM_ENV_PATH, 'utf-8');
      const parseEnvVar = (varName: string) => {
        const match = envContent.match(new RegExp(`^${varName}\\s*=\\s*(.*)$`, 'm'));
        return match ? match[1]?.trim()?.replace(/['"]/g, '') : null;
      };
      
      keys.nvidiaKey = keys.nvidiaKey || parseEnvVar('NVIDIA_API_KEY');
      keys.openaiKey = keys.openaiKey || parseEnvVar('OPENAI_API_KEY');
      keys.groqKey = keys.groqKey || parseEnvVar('GROQ_API_KEY');
      keys.geminiKey = keys.geminiKey || parseEnvVar('GEMINI_API_KEY') || parseEnvVar('GOOGLE_API_KEY');
      keys.openrouterKey = keys.openrouterKey || parseEnvVar('OPENROUTER_API_KEY') || parseEnvVar('DEEPSEEK_API_KEY');
      keys.mistralKey = keys.mistralKey || parseEnvVar('MISTRAL_API_KEY');
    } catch {}
  }
  
  return keys;
};

// Helper for fetch calls with robust timeout control (reduced to 3.5s to balance speed and stability)
const fetchWithTimeout = async (provider: string, url: string, headers: any, payload: any, timeoutMs = 3500) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(id);
    if (!res.ok) {
      throw new Error(`Upstream ${provider} error: Status ${res.status}`);
    }
    const data = await res.json();
    return { provider, data };
  } catch (err: any) {
    clearTimeout(id);
    throw err;
  }
};

export async function generateNvmixCompletion(messages: Message[], options: CompletionOptions = {}) {
  const { temperature, max_tokens } = options;

  // Resolve active API Keys from server environment AND db.json/platform env fallback
  const dbKeys = readDBKeys();
  const activeOpenAIKey = process.env.OPENAI_API_KEY || dbKeys.openaiKey;
  const activeNvidiaKey = process.env.NVIDIA_API_KEY || dbKeys.nvidiaKey;
  const activeGroqKey = process.env.GROQ_API_KEY || dbKeys.groqKey;
  const activeGeminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || dbKeys.geminiKey;
  const activeOpenRouterKey = process.env.OPENROUTER_API_KEY || process.env.DEEPSEEK_API_KEY || dbKeys.openrouterKey;
  const activeMistralKey = process.env.MISTRAL_API_KEY || dbKeys.mistralKey;

  // Verify at least one provider API key is loaded
  const keysLoaded = [
    activeOpenAIKey,
    activeNvidiaKey,
    activeGroqKey,
    activeGeminiKey,
    activeOpenRouterKey,
    activeMistralKey
  ].some(k => k && k.trim().length > 5);

  if (!keysLoaded) {
    throw new Error('Nvmix Aggregator: No active LLM provider keys configured on the server. Please add your NVIDIA_API_KEY, OPENAI_API_KEY, or other credentials in db.json or environment variables to enable real AI processing.');
  }

  // Populate Promise Pool for Concurrent LLM Upstream Execution
  const promises: Promise<{ provider: string; data: any }>[] = [];

  // Upstream ─── OpenAI ───
  if (activeOpenAIKey && activeOpenAIKey.trim().length > 5) {
    promises.push(
      fetchWithTimeout(
        'OpenAI',
        'https://api.openai.com/v1/chat/completions',
        {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeOpenAIKey}`
        },
        {
          model: 'gpt-4o-mini',
          messages,
          temperature: temperature ?? 0.7,
          max_tokens: max_tokens ?? 1024,
          stream: false,
        }
      )
    );
  }

  // Upstream ─── NVIDIA NIM ───
  if (activeNvidiaKey && activeNvidiaKey.trim().length > 5) {
    promises.push(
      fetchWithTimeout(
        'Nvidia NIM',
        'https://integrate.api.nvidia.com/v1/chat/completions',
        {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeNvidiaKey}`
        },
        {
          model: 'meta/llama-3.1-8b-instruct',
          messages,
          temperature: temperature ?? 0.7,
          max_tokens: max_tokens ?? 1024,
        }
      )
    );
  }

  // Upstream ─── Groq ───
  if (activeGroqKey && activeGroqKey.trim().length > 5) {
    promises.push(
      fetchWithTimeout(
        'Groq',
        'https://api.groq.com/openai/v1/chat/completions',
        {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeGroqKey}`
        },
        {
          model: 'llama3-70b-8192',
          messages,
          temperature: temperature ?? 0.7,
          max_tokens: max_tokens ?? 1024,
        }
      )
    );
  }

  // Upstream ─── DeepSeek via OpenRouter / Direct ───
  if (activeOpenRouterKey && activeOpenRouterKey.trim().length > 5) {
    const isDirectDeepSeek = activeOpenRouterKey.startsWith('sk-');
    const url = isDirectDeepSeek 
      ? 'https://api.deepseek.com/v1/chat/completions' 
      : 'https://openrouter.ai/api/v1/chat/completions';
    
    const headers = isDirectDeepSeek 
      ? {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeOpenRouterKey}`
        }
      : {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeOpenRouterKey}`,
          'HTTP-Referer': 'https://nvmix.com',
          'X-Title': 'Nvmix AI Swarm'
        };

    promises.push(
      fetchWithTimeout(
        'DeepSeek',
        url,
        headers,
        {
          model: isDirectDeepSeek ? 'deepseek-chat' : 'deepseek/deepseek-chat',
          messages,
          temperature: temperature ?? 0.7,
          max_tokens: max_tokens ?? 1024,
        }
      )
    );
  }

  // Upstream ─── Google Gemini ───
  if (activeGeminiKey && activeGeminiKey.trim().length > 5) {
    promises.push(
      (async () => {
        const res = await fetchWithTimeout(
          'Google Gemini',
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeGeminiKey}`,
          { 'Content-Type': 'application/json' },
          {
            contents: messages.map((msg: any) => ({
              role: msg.role === 'user' ? 'user' : 'model',
              parts: [{ text: msg.content }]
            })),
            generationConfig: { temperature: temperature ?? 0.7 }
          }
        );
        
        if (!res.data.candidates || !res.data.candidates[0]) {
          throw new Error("Gemini returned invalid response candidates");
        }
        const text = res.data.candidates[0].content.parts[0].text;
        return {
          provider: 'Google Gemini',
          data: {
            id: `nvmix-gemini-${Date.now()}`,
            choices: [{ message: { role: 'assistant', content: text }, finish_reason: 'stop' }],
            created: Math.floor(Date.now() / 1000)
          }
        };
      })()
    );
  }

  // Upstream ─── Mistral ───
  if (activeMistralKey && activeMistralKey.trim().length > 5) {
    promises.push(
      fetchWithTimeout(
        'Mistral',
        'https://api.mistral.ai/v1/chat/completions',
        {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeMistralKey}`
        },
        {
          model: 'mistral-large-latest',
          messages,
          temperature: temperature ?? 0.7,
          max_tokens: max_tokens ?? 1024,
        }
      )
    );
  }

  // Execute concurrent upstream race
  if (promises.length === 0) {
    throw new Error('Nvmix Aggregator: Provider keys parsed successfully, but all keys were found to be empty or too short.');
  }

  try {
    const result = await Promise.any(promises);
    const responseData = result.data;

    if (responseData && responseData.choices && responseData.choices[0]) {
      const reply = responseData.choices[0].message.content;
      return {
        id: responseData.id || `nvmix-chat-${Math.random().toString(36).substring(2, 11)}`,
        object: 'chat.completion' as const,
        created: responseData.created || Math.floor(Date.now() / 1000),
        model: 'nvmix-inference-v1',
        provider: 'Nvmix',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant' as const,
              content: reply,
            },
            finish_reason: responseData.choices[0].finish_reason || 'stop',
          },
        ],
        usage: responseData.usage || {
          prompt_tokens: messages.length * 10,
          completion_tokens: Math.ceil(reply.length / 4),
          total_tokens: (messages.length * 10) + Math.ceil(reply.length / 4),
        },
      };
    }

    throw new Error('Nvmix Aggregator: Received response from provider, but format was invalid or empty.');
  } catch (aggregateError: any) {
    console.warn('All concurrent master upstream AI providers failed or timed out:', aggregateError);
    throw new Error('Nvmix Aggregator: All concurrent upstream master AI providers failed or timed out. Please check your key status.');
  }
}
