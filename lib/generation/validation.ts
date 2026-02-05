export type TweetValidationOptions = {
  maxLength?: number;
  forbiddenWords?: string[];
  maxLinks?: number;
  maxHashtags?: number;
  maxNewlines?: number;
};

export type TweetValidationResult =
  | { ok: true }
  | {
      ok: false;
      reasons: string[];
    };

const URL_REGEX = /https?:\/\/\S+/gi;
const HASHTAG_REGEX = /#\w+/g;

const countMatches = (content: string, regex: RegExp) => {
  const matches = content.match(regex);
  return matches ? matches.length : 0;
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const validateTweetContent = (
  content: string,
  options: TweetValidationOptions = {},
): TweetValidationResult => {
  const reasons: string[] = [];
  const trimmed = content.trim();

  const maxLength = options.maxLength ?? 280;
  if (trimmed.length > maxLength) {
    reasons.push(`Content exceeds ${maxLength} characters.`);
  }

  const forbiddenWords = options.forbiddenWords?.filter((word) => word.trim().length > 0) ?? [];
  if (forbiddenWords.length > 0) {
    const lowered = trimmed.toLowerCase();
    const hits = forbiddenWords.filter((word) => {
      const pattern = new RegExp(`\\b${escapeRegExp(word.toLowerCase())}\\b`, 'i');
      return pattern.test(lowered);
    });
    if (hits.length > 0) {
      reasons.push(`Contains forbidden words: ${hits.join(', ')}.`);
    }
  }

  if (options.maxLinks !== undefined) {
    const linkCount = countMatches(trimmed, URL_REGEX);
    if (linkCount > options.maxLinks) {
      reasons.push(`Too many links (max ${options.maxLinks}).`);
    }
  }

  if (options.maxHashtags !== undefined) {
    const hashtagCount = countMatches(trimmed, HASHTAG_REGEX);
    if (hashtagCount > options.maxHashtags) {
      reasons.push(`Too many hashtags (max ${options.maxHashtags}).`);
    }
  }

  if (options.maxNewlines !== undefined) {
    const newlineCount = trimmed.split('\n').length - 1;
    if (newlineCount > options.maxNewlines) {
      reasons.push(`Too many line breaks (max ${options.maxNewlines}).`);
    }
  }

  if (reasons.length > 0) {
    return { ok: false, reasons };
  }

  return { ok: true };
};
