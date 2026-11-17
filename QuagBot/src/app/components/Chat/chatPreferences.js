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

const LEVEL_INSTRUCTIONS = {
  easy: 'Explain at an elementary-school level using simple words, short explanations, and familiar examples. Keep facts and citations accurate.',
  medium: 'Explain at a high-school level with relevant historical terms, supporting detail, and causes and effects. Keep facts and citations accurate.',
  max: 'Explain at a college level with deeper analysis, historical context, and competing interpretations where relevant. Keep facts and citations accurate.',
};

export function prepareMessage(text, level, isPDF = false) {
  if (isPDF) return text;
  const instruction = Object.hasOwn(LEVEL_INSTRUCTIONS, level) ? LEVEL_INSTRUCTIONS[level] : LEVEL_INSTRUCTIONS.medium;
  return instruction + '\n\n' + text;
}
