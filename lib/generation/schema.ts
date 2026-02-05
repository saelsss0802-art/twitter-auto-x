export type GenerateSingleRequest = {
  accountId: string;
  typeId: string;
  theme?: string;
  keywords?: string[];
  includeHashtags?: boolean;
};

export type GenerateWeeklyRequest = {
  accountId: string;
  days?: number;
  postsPerDay?: number;
  distribution?: Record<string, number>;
};

export type GenerateResponse = {
  tweets: Array<{
    content: string;
    typeId: string;
    rationale?: string;
    knowledgeRefs?: string[];
  }>;
};

type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

export const validateGenerateSingleRequest = (payload: unknown): ValidationResult<GenerateSingleRequest> => {
  if (!payload || typeof payload !== 'object') {
    return { ok: false, error: 'Request body must be an object.' };
  }

  const record = payload as Record<string, unknown>;
  if (!isNonEmptyString(record.accountId)) {
    return { ok: false, error: 'accountId is required.' };
  }
  if (!isNonEmptyString(record.typeId)) {
    return { ok: false, error: 'typeId is required.' };
  }

  const theme = isNonEmptyString(record.theme) ? record.theme.trim() : undefined;
  const keywords = record.keywords === undefined ? undefined : isStringArray(record.keywords) ? record.keywords : null;
  if (keywords === null) {
    return { ok: false, error: 'keywords must be an array of strings.' };
  }

  const includeHashtags =
    record.includeHashtags === undefined
      ? undefined
      : typeof record.includeHashtags === 'boolean'
        ? record.includeHashtags
        : null;
  if (includeHashtags === null) {
    return { ok: false, error: 'includeHashtags must be a boolean.' };
  }

  return {
    ok: true,
    value: {
      accountId: record.accountId as string,
      typeId: record.typeId as string,
      theme,
      keywords,
      includeHashtags,
    },
  };
};

export const validateGenerateWeeklyRequest = (payload: unknown): ValidationResult<GenerateWeeklyRequest> => {
  if (!payload || typeof payload !== 'object') {
    return { ok: false, error: 'Request body must be an object.' };
  }

  const record = payload as Record<string, unknown>;
  if (!isNonEmptyString(record.accountId)) {
    return { ok: false, error: 'accountId is required.' };
  }

  const days = record.days === undefined ? undefined : Number(record.days);
  if (days !== undefined && (!Number.isInteger(days) || days <= 0)) {
    return { ok: false, error: 'days must be a positive integer.' };
  }

  const postsPerDay = record.postsPerDay === undefined ? undefined : Number(record.postsPerDay);
  if (postsPerDay !== undefined && (!Number.isInteger(postsPerDay) || postsPerDay <= 0)) {
    return { ok: false, error: 'postsPerDay must be a positive integer.' };
  }

  const distribution =
    record.distribution === undefined
      ? undefined
      : typeof record.distribution === 'object' && record.distribution !== null
        ? (record.distribution as Record<string, number>)
        : null;
  if (distribution === null) {
    return { ok: false, error: 'distribution must be an object with numeric values.' };
  }
  if (distribution) {
    for (const [key, value] of Object.entries(distribution)) {
      if (!isNonEmptyString(key) || typeof value !== 'number') {
        return { ok: false, error: 'distribution must be an object with numeric values.' };
      }
    }
  }

  return {
    ok: true,
    value: {
      accountId: record.accountId as string,
      days,
      postsPerDay,
      distribution,
    },
  };
};
