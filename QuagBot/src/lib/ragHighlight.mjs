// Finds where a RAG `referenced_text` quote sits inside the section text so the UI can highlight it.
// The model often reproduces a passage with small differences (curly vs. straight quotes, collapsed
// whitespace, and the stray hyphens that textbook extraction leaves in words like "negoti-ated"),
// so an exact match is tried first and a normalized match second.

const DASHES = /[­‐-―-]/;

// Lower-cases, collapses whitespace, straightens quotes and drops dashes. `map[i]` is the index in
// the original string of normalized character `i`, so a match can be translated back.
function normalize(str) {
  let out = '';
  const map = [];
  for (let i = 0; i < str.length; i++) {
    let ch = str[i];
    if (/\s/.test(ch)) {
      if (out && !out.endsWith(' ')) { out += ' '; map.push(i); }
      continue;
    }
    if (DASHES.test(ch)) continue;
    if ('‘’‛'.includes(ch)) ch = "'";
    else if ('“”‟'.includes(ch)) ch = '"';
    const lower = ch.toLowerCase();
    out += lower;
    for (let k = 0; k < lower.length; k++) map.push(i);
  }
  return { out, map };
}

// Returns the section's text as an array of non-empty strings.
export function sectionParagraphs(text) {
  const list = Array.isArray(text) ? text : [text];
  return list.filter((item) => typeof item === 'string' && item.trim());
}

// Returns { section, start, end } for the first paragraph containing the quote, or null.
export function locateHighlight(sections, referencedText) {
  if (typeof referencedText !== 'string') return null;
  const target = referencedText.trim();
  if (!target) return null;

  for (let i = 0; i < sections.length; i++) {
    const at = sections[i].indexOf(target);
    if (at !== -1) return { section: i, start: at, end: at + target.length };
  }

  const needle = normalize(target).out.trim();
  if (!needle) return null;
  for (let i = 0; i < sections.length; i++) {
    const { out, map } = normalize(sections[i]);
    const at = out.indexOf(needle);
    if (at !== -1) return { section: i, start: map[at], end: map[at + needle.length - 1] + 1 };
  }
  return null;
}
