/**
 * TTS Module — Text-to-Speech for Electron (Korean ↔ English)
 *
 * Supports:
 *   - Web Speech API  (renderer process, free, built into Electron)
 *   - Google TTS      (main / standalone process, free, no API key needed)
 *
 * Usage (standalone):
 *   const tts = require('./tts-module');
 *   await tts.speakFromFile('input.json');
 *   await tts.speakFromFile('input.txt');
 *
 * Usage (Electron renderer):
 *   const tts = require('./tts-module');
 *   await tts.speak({ text: 'Hello', lang: 'en' });
 */

const InputParser = require('./input-parser');
const TtsEngine = require('./tts-engine');

/**
 * Speak a single utterance.
 * @param {Object} opts
 * @param {string} opts.text       — text to speak
 * @param {string} [opts.lang]     — 'en' | 'ko'  (default: auto-detect)
 * @param {'web-speech'|'google'} [opts.engine]  — (default: auto)
 * @returns {Promise<void>}
 */
async function speak({ text, lang, engine } = {}) {
  if (!text || !text.trim()) {
    throw new Error('tts-module: text is required');
  }
  if (!lang) {
    lang = detectLanguage(text);
  }
  const resolvedEngine = engine || (typeof window !== 'undefined' && window.speechSynthesis
    ? 'web-speech'
    : 'google');

  return TtsEngine.speak({ text, lang, engine: resolvedEngine });
}

/**
 * Speak from an input file.  Accepts .json or .txt (tagged) format.
 * @param {string} filePath
 * @param {Object} [options]       — overrides (e.g. { engine: 'google' })
 * @returns {Promise<void>}
 */
async function speakFromFile(filePath, options = {}) {
  const segments = InputParser.parseFile(filePath);
  for (const seg of segments) {
    await speak({ ...seg, ...options });
  }
}

/**
 * Speak segments sequentially and optionally save each to an audio file.
 * @param {Array<{text:string, lang:string}>} segments
 * @param {Object} [options]
 * @param {string} [options.outputDir]  — if set, save .mp3 / .wav files here
 * @param {'web-speech'|'google'} [options.engine]
 * @returns {Promise<string[]>}  — list of saved file paths (empty if none saved)
 */
async function speakSegments(segments, options = {}) {
  const files = [];
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const filePath = options.outputDir
      ? await TtsEngine.saveToFile({
          text: seg.text,
          lang: seg.lang,
          outputDir: options.outputDir,
          index: i,
          engine: options.engine || 'google',
        })
      : null;
    if (filePath) files.push(filePath);

    await speak({ ...seg, engine: options.engine });
  }
  return files;
}

/**
 * Detect language: 'ko' if text contains Hangul characters, otherwise 'en'.
 */
function detectLanguage(text) {
  return /[가-힯ᄀ-ᇿ㄰-㆏]/.test(text) ? 'ko' : 'en';
}

/**
 * List available voices (Web Speech API only; returns [] in Node.js).
 */
function listVoices() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    return window.speechSynthesis.getVoices();
  }
  return [];
}

module.exports = {
  speak,
  speakFromFile,
  speakSegments,
  detectLanguage,
  listVoices,
};
