export const DEFAULT_PREFERENCES = {
  textSize: '18px',
  font: 'Arial, sans-serif',
  fontColor: '#000000',
};

const FONTS = ['Arial, sans-serif', 'Verdana, sans-serif', 'Georgia, serif', 'Lucida Sans, serif', 'Monaco, serif', "'Times New Roman', serif", "'Courier New', monospace", 'Comic Sans MS, monospace', 'Impact, monospace', 'Papyrus, monospace', 'Symbol, serif', 'Webdings, serif'];
const COLORS = ['#000000', '#a61b1b', '#974000', '#756000', '#20612e', '#164ca0', '#4b3080', '#803080'];

export function parsePreferences(raw) {
  let saved;
  try { saved = JSON.parse(raw); } catch { saved = null; }
  return {
    textSize: ['14px', '18px', '22px'].includes(saved?.textSize) ? saved.textSize : DEFAULT_PREFERENCES.textSize,
    font: FONTS.includes(saved?.font) ? saved.font : DEFAULT_PREFERENCES.font,
    fontColor: COLORS.includes(saved?.fontColor) ? saved.fontColor : DEFAULT_PREFERENCES.fontColor,
  };
}
