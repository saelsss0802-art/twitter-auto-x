export const buildSystemPrompt = (
  typeName: string,
  purpose: string,
  structureHint: string,
  tips: string,
  algorithmMarkdown: string,
) => {
  return [
    'You are a tweet-generation assistant for X (Twitter).',
    'Follow the platform guidance below.',
    algorithmMarkdown.trim(),
    `Post type: ${typeName}`,
    `Purpose: ${purpose}`,
    `Structure hint: ${structureHint}`,
    `Tips: ${tips}`,
  ]
    .filter(Boolean)
    .join('\n\n');
};

export const buildUserPrompt = (
  theme: string | undefined,
  keywords: string[] | undefined,
  includeHashtags: boolean,
  typeMarkdown: string,
) => {
  const themeLine = theme ? `Theme: ${theme}` : 'Theme: (not specified)';
  const keywordLine = keywords && keywords.length > 0 ? `Keywords: ${keywords.join(', ')}` : 'Keywords: (none)';
  const hashtagLine = `Include hashtags: ${includeHashtags ? 'yes' : 'no'}`;

  return [
    'Generate a single tweet draft.',
    themeLine,
    keywordLine,
    hashtagLine,
    'Type knowledge:',
    typeMarkdown.trim(),
  ]
    .filter(Boolean)
    .join('\n\n');
};
