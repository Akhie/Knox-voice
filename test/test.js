/**
 * Integration test for TTS module (no speakers needed — saves to files).
 *
 * Run:
 *   node test/test.js
 */

const path = require('path');
const fs = require('fs');
const tts = require('../src/tts-module');

const outputDir = path.join(__dirname, 'output');

async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   TTS Module — Integration Tests                ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');

  // Clean / create output dir
  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
  fs.mkdirSync(outputDir);

  let passed = 0;
  let total = 0;

  /* ── 1. detectLanguage ─────────────────────────────────────── */

  total++;
  const enResult = tts.detectLanguage('Hello world');
  if (enResult === 'en') { passed++; console.log('  ✓ detectLanguage — English text'); }
  else                   { console.log(`  ✗ detectLanguage — English text (got: ${enResult})`); }

  total++;
  const koResult = tts.detectLanguage('안녕하세요');
  if (koResult === 'ko') { passed++; console.log('  ✓ detectLanguage — Korean text'); }
  else                   { console.log(`  ✗ detectLanguage — Korean text (got: ${koResult})`); }

  total++;
  const mixedResult = tts.detectLanguage('Hello 안녕');
  if (mixedResult === 'ko') { passed++; console.log('  ✓ detectLanguage — Mixed text (Hangul present → ko)'); }
  else                     { console.log(`  ✗ detectLanguage — Mixed text (got: ${mixedResult})`); }

  /* ── 2. speakSegments (save to files) ──────────────────────── */

  total++;
  try {
    const files = await tts.speakSegments([
      { text: 'Hello, welcome to the test.', lang: 'en' },
      { text: '안녕하세요, 테스트 중입니다.', lang: 'ko' },
    ], { outputDir, engine: 'google' });
    if (files.length === 2) {
      const allExist = files.every(f => fs.existsSync(f));
      if (allExist) {
        passed++;
        console.log('  ✓ speakSegments — saved 2 audio files');
        files.forEach(f => console.log(`      ${path.basename(f)}  (${(fs.statSync(f).size / 1024).toFixed(1)} KB)`));
      } else {
        console.log('  ✗ speakSegments — files not found');
      }
    } else {
      console.log(`  ✗ speakSegments — expected 2 files, got ${files.length}`);
    }
  } catch (e) {
    console.log(`  ✗ speakSegments — ${e.message}`);
  }

  /* ── 3. speakFromFile (.json) ──────────────────────────────── */

  total++;
  const jsonInput = path.join(__dirname, '../example/input.json');
  if (fs.existsSync(jsonInput)) {
    try {
      const files = await tts.speakSegments(
        require(jsonInput).segments,
        { outputDir, engine: 'google' }
      );
      const ok = files.every(f => fs.existsSync(f));
      if (ok) {
        passed++;
        console.log(`  ✓ speakFromFile (json) — ${files.length} files`);
      } else {
        console.log('  ✗ speakFromFile (json) — some files missing');
      }
    } catch (e) {
      console.log(`  ✗ speakFromFile (json) — ${e.message}`);
    }
  } else {
    console.log('  ⚠ speakFromFile (json) — input.json not found, skipped');
  }

  /* ── 4. speakFromFile (.txt) ───────────────────────────────── */

  total++;
  const txtInput = path.join(__dirname, '../example/input.txt');
  if (fs.existsSync(txtInput)) {
    try {
      const parser = require('../src/input-parser');
      const segments = parser.parseFile(txtInput);
      const files = await tts.speakSegments(segments, { outputDir, engine: 'google' });
      const ok = files.every(f => fs.existsSync(f));
      if (ok) {
        passed++;
        console.log(`  ✓ speakFromFile (txt) — ${files.length} files`);
      } else {
        console.log('  ✗ speakFromFile (txt) — some files missing');
      }
    } catch (e) {
      console.log(`  ✗ speakFromFile (txt) — ${e.message}`);
    }
  } else {
    console.log('  ⚠ speakFromFile (txt) — input.txt not found, skipped');
  }

  /* ── Summary ────────────────────────────────────────────────── */

  console.log('');
  console.log(`Results: ${passed}/${total} passed`);

  const allFiles = fs.readdirSync(outputDir);
  console.log(`\nOutput files (${allFiles.length} total):`);
  allFiles.forEach(f => {
    const size = fs.statSync(path.join(outputDir, f)).size;
    console.log(`  • ${f}  (${(size / 1024).toFixed(1)} KB)`);
  });

  process.exit(passed === total ? 0 : 1);
}

main().catch(err => {
  console.error('✗ Fatal error:', err);
  process.exit(1);
});