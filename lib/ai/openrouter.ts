const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'openai/gpt-4o-mini';
const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_RETRIES = 1;

export class OpenRouterConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpenRouterConfigError';
  }
}

export class OpenRouterRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'OpenRouterRequestError';
    this.status = status;
  }
}

type OpenRouterUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
};

type OpenRouterChoice = {
  message?: {
    content?: string;
  };
};

type OpenRouterResponse = {
  model?: string;
  choices?: OpenRouterChoice[];
  usage?: OpenRouterUsage;
};

type GenerateSingleParams = {
  systemPrompt: string;
  userPrompt: string;
  timeoutMs?: number;
  retries?: number;
};

type GenerateSingleResult = {
  content: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
};

const getOpenRouterConfig = () => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    throw new OpenRouterConfigError('OPENROUTER_API_KEY is not configured.');
  }

  const model = process.env.OPENROUTER_MODEL?.trim() || DEFAULT_MODEL;
  return { apiKey, model };
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchWithTimeout = async (input: RequestInfo, init: RequestInit, timeoutMs: number) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

export const generateSingleCompletion = async ({
  systemPrompt,
  userPrompt,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  retries = DEFAULT_RETRIES,
}: GenerateSingleParams): Promise<GenerateSingleResult> => {
  const { apiKey, model } = getOpenRouterConfig();

  const payload = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
  };

  let lastError: unknown = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchWithTimeout(
        OPENROUTER_API_URL,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
        timeoutMs,
      );

      if (!response.ok) {
        const detail = await response.text();
        const message = detail ? `OpenRouter request failed (${response.status}).` : 'OpenRouter request failed.';
        const error = new OpenRouterRequestError(message, response.status);
        if (response.status >= 500 || response.status === 429) {
          throw error;
        }
        throw error;
      }

      const data = (await response.json()) as OpenRouterResponse;
      const content = data.choices?.[0]?.message?.content?.trim();

      if (!content) {
        throw new OpenRouterRequestError('OpenRouter returned empty content.', 502);
      }

      return {
        content,
        model: data.model ?? model,
        promptTokens: data.usage?.prompt_tokens,
        completionTokens: data.usage?.completion_tokens,
      };
    } catch (error) {
      lastError = error;
      const isAbortError = error instanceof Error && error.name === 'AbortError';
      const shouldRetry =
        attempt < retries &&
        (isAbortError || (error instanceof OpenRouterRequestError && (error.status >= 500 || error.status === 429)));

      if (shouldRetry) {
        console.warn('OpenRouter request retrying.', {
          attempt: attempt + 1,
        });
        await delay(500);
        continue;
      }

      break;
    }
  }

  if (lastError instanceof OpenRouterRequestError) {
    throw lastError;
  }

  if (lastError instanceof OpenRouterConfigError) {
    throw lastError;
  }

  const message = lastError instanceof Error ? lastError.message : 'OpenRouter request failed.';
  throw new OpenRouterRequestError(message, 502);
};
