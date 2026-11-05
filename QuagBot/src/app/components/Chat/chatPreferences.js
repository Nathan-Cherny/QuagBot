export const EXPLANATION_LEVELS = {
  easy: 'Easy - Elementary school',
  medium: 'Medium - High school',
  max: 'Max - College',
};

export const LEVEL_DESCRIPTIONS = {
  easy: 'Simple words, short explanations, and familiar examples.',
  medium: 'More detail, historical terms, and explanations of causes and effects.',
  max: 'Deeper analysis, historical context, and different interpretations.',
};

export function loadExplanationLevel(key, storage) {
  try {
    const saved = (storage ?? localStorage).getItem(key);
    return Object.hasOwn(EXPLANATION_LEVELS, saved ?? '') ? saved : 'medium';
  } catch {
    return 'medium';
  }
}

export function saveExplanationLevel(key, level, storage) {
  try {
    (storage ?? localStorage).setItem(key, level);
  } catch {
    // Keep the selection usable when browser storage is unavailable.
  }
}
