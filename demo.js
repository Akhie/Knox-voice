/**
 * Quick demo — converts a hardcoded sample text to speech.
 * No input files needed.  Just run it.
 *
 * Usage:
 *   node demo.js           — speaks aloud
 *   node demo.js save      — saves MP3s to ./output/ instead
 */

const path = require('path');
const fs = require('fs');
const tts = require('./src/tts-module');

// ── The sample text (bilingual Korean ↔ English) ──────────────────

const SAMPLE = [
  { text: 'Hello! This is a text to speech demo.', lang: 'en' },
  { text: 'It supports both English', lang: 'en' },
  { text: '한국어도 지원합니다.', lang: 'ko' },
  { text: 'The app reads each segment one by one, in order.', lang: 'en' },
  { text: '이 앱은 각 문장을 순서대로 읽어줍니다.', lang: 'ko' },
  { text: 'No API key, no registration, completely free.', lang: 'en' },
  { text: '무료로 사용할 수 있습니다.', lang: 'ko' },
];

// ── Run ───────────────────────────────────────────────────────────

async function main() {
  const saveMode = process.argv[2] === 'save';

  console.log('╔═══════════════════════════════════════╗');
  console.log('║   TTS Demo — Sample Text to Speech   ║');
  console.log('╚═══════════════════════════════════════╝');
  console.log('');

  if (saveMode) {
    const outDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

    const files = await tts.speakSegments(SAMPLE, { outputDir: outDir, engine: 'google' });
    console.log(`\nSaved ${files.length} files to output/`);
    files.forEach(f => console.log(`  • ${path.basename(f)}`));
  } else {
    for (const seg of SAMPLE) {
      console.log(`  ▶ [${seg.lang}] ${seg.text}`);
      await tts.speak(seg);
    }
  }

  console.log('\n✓ Done');
}

main().catch(err => {
  console.error('✗ Error:', err.message);
  process.exit(1);
});