/**
 * Input Parser — reads .json or .txt files and returns speech segments.
 *
 * JSON format:
 *   { "segments": [
 *       { "text": "Hello", "lang": "en" },
 *       { "text": "안녕하세요", "lang": "ko" }
 *     ]
 *   }
 *   Or a flat array:
 *   [ { "text": "Hello", "lang": "en" }, ... ]
 *
 * TXT format (tagged):
 *   [en] Hello, how are you?
 *   [ko] 안녕하세요, 오늘 날씨가 좋네요.
 *   Lines without a tag inherit the previous line's language (default: en).
 */

const fs = require('fs');
const path = require('path');

/**
 * @param {string} filePath
 * @returns {Array<{text:string, lang:string}>}
 */
function parseFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const raw = fs.readFileSync(filePath, 'utf-8');

  switch (ext) {
    case '.json':
      return parseJson(raw);
    case '.txt':
      return parseTxt(raw);
    default:
      throw new Error(`Unsupported input format: ${ext} (use .json or .txt)`);
  }
}

function parseJson(raw) {
  const data = JSON.parse(raw);

  // Object with "segments" key
  if (Array.isArray(data)) {
    return data.map(validateSegment);
  }
  if (data.segments && Array.isArray(data.segments)) {
    return data.segments.map(validateSegment);
  }
  // Single segment object
  if (data.text) {
    return [validateSegment(data)];
  }
  throw new Error('JSON must contain a "segments" array or a single object with "text".');
}

function validateSegment(seg, index) {
  if (!seg.text || !seg.text.trim()) {
    throw new Error(`Segment ${index}: missing or empty "text".`);
  }
  const lang = (seg.lang || 'en').toLowerCase();
  if (lang !== 'en' && lang !== 'ko') {
    throw new Error(`Segment ${index}: lang must be "en" or "ko", got "${seg.lang}".`);
  }
  return { text: seg.text.trim(), lang };
}

function parseTxt(raw) {
  const lines = raw.split(/\r?\n/).filter(l => l.trim());
  const segments = [];
  let currentLang = 'en';

  for (const line of lines) {
    const tagMatch = line.match(/^\s*\[(en|ko)\]\s*(.*)/i);
    if (tagMatch) {
      currentLang = tagMatch[1].toLowerCase();
      const text = tagMatch[2].trim();
      if (text) {
        segments.push({ text, lang: currentLang });
      }
    } else if (line.trim()) {
      segments.push({ text: line.trim(), lang: currentLang });
    }
  }
  return segments;
}

module.exports = { parseFile, parseJson, parseTxt };