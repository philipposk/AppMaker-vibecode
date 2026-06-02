/**
 * TypeScript port of philipposk/llm-free-rotator for OpenRouter.
 * Fetches all free OpenRouter models, ranks by curated preference weights,
 * retries the next model on 429 / 502 / 503 / 504.
 */

const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";
const OPENROUTER_CHAT_URL   = "https://openrouter.ai/api/v1/chat/completions";

/** Preference weights — mirrors the Python PREF table, higher = better. */
const PREF: Record<string, number> = {
  "openai/gpt-oss-120b:free":                                      10.0,
  "nvidia/nemotron-3-super-120b-a12b:free":                         9.5,
  "nousresearch/hermes-3-llama-3.1-405b:free":                      9.0,
  "z-ai/glm-4.5-air:free":                                          9.0,
  "qwen/qwen3-next-80b-a3b-instruct:free":                          8.5,
  "meta-llama/llama-3.3-70b-instruct:free":                         8.0,
  "minimax/minimax-m2.5:free":                                       7.5,
  "qwen/qwen3-coder:free":                                           7.0,
  "deepseek/deepseek-v4-flash:free":                                 6.5,
  "google/gemma-4-31b-it:free":                                      6.0,
  "google/gemma-4-26b-a4b-it:free":                                  5.5,
  "openai/gpt-oss-20b:free":                                         5.0,
  "cognitivecomputations/dolphin-mistral-24b-venice-edition:free":   4.5,
  "arcee-ai/trinity-large-thinking:free":                            4.0,
  "nvidia/nemotron-3-nano-30b-a3b:free":                             3.5,
  "nvidia/nemotron-nano-12b-v2-vl:free":                             3.0,
  "nvidia/nemotron-nano-9b-v2:free":                                 2.5,
  "meta-llama/llama-3.2-3b-instruct:free":                          2.0,
};

const ROTATE_ON = new Set([429, 502, 503, 504]);

// Module-level cache — survives warm lambda re-use (best-effort).
let _cachedModels: string[] | null = null;
let _cacheAt = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function isFree(rec: Record<string, unknown>): boolean {
  const p = (rec.pricing ?? {}) as Record<string, unknown>;
  try {
    return Number(p.prompt ?? 1) === 0 && Number(p.completion ?? 1) === 0;
  } catch {
    return false;
  }
}

async function getModels(apiKey: string): Promise<string[]> {
  const now = Date.now();
  if (_cachedModels && now - _cacheAt < CACHE_TTL_MS) return _cachedModels;

  try {
    const res = await fetch(OPENROUTER_MODELS_URL, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) throw new Error(`models fetch: ${res.status}`);
    const data = (await res.json()) as { data: Record<string, unknown>[] };

    const models = data.data
      .filter(isFree)
      .map((r) => ({ id: r.id as string, weight: PREF[r.id as string] ?? 0 }))
      .sort((a, b) => b.weight - a.weight)
      .map((m) => m.id);

    _cachedModels = models.length ? models : Object.keys(PREF);
    _cacheAt = now;
  } catch {
    // Fallback to static PREF list if fetch fails.
    _cachedModels = Object.keys(PREF);
    _cacheAt = now;
  }

  return _cachedModels!;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface RotatorResult {
  text: string;
  model: string;
}

export async function chatWithRotation(
  apiKey: string,
  messages: ChatMessage[],
  opts: { maxTokens?: number; temperature?: number; referer?: string; title?: string } = {},
): Promise<RotatorResult> {
  const models = await getModels(apiKey);
  if (!models.length) throw new Error("No free models available");

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    ...(opts.referer ? { "HTTP-Referer": opts.referer } : {}),
    ...(opts.title   ? { "X-Title": opts.title }         : {}),
  };

  const body = {
    messages,
    max_tokens:  opts.maxTokens  ?? 8000,
    temperature: opts.temperature ?? 0.7,
  };

  for (const model of models) {
    const res = await fetch(OPENROUTER_CHAT_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ ...body, model }),
    });

    if (ROTATE_ON.has(res.status)) {
      console.warn(`llm-rotator: ${model} returned ${res.status}, trying next`);
      continue;
    }

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`${model} error ${res.status}: ${err}`);
    }

    const data = await res.json() as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content ?? "";
    return { text, model };
  }

  throw new Error("All free models rate-limited or unavailable");
}
