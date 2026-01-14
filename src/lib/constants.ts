// Character limits for posts and comments
export const POST_MAX_LENGTH = 500;
export const COMMENT_MAX_LENGTH = 200;

// Confession limits
export const CONFESSION_TITLE_MAX_LENGTH = 100;
export const CONFESSION_DESCRIPTION_MAX_LENGTH = 1000;
export const CONFESSION_DESCRIPTION_MAX_WORDS = 200;
export const CONFESSION_COMMENT_MAX_LENGTH = 300;

export const getCharacterCountColor = (current: number, max: number): string => {
  const remaining = max - current;
  const percentage = remaining / max;
  
  if (percentage <= 0) return 'text-destructive';
  if (percentage <= 0.1) return 'text-destructive';
  if (percentage <= 0.2) return 'text-accent';
  return 'text-muted-foreground';
};

export const isOverLimit = (current: number, max: number): boolean => {
  return current > max;
};

export const getWordCount = (text: string): number => {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

export const isOverWordLimit = (text: string, maxWords: number): boolean => {
  return getWordCount(text) > maxWords;
};
