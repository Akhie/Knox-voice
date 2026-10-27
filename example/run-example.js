/**
 * Standalone example runner for the TTS module.
 *
 * Usage:
 *   node example/run-example.js            — speaks both JSON and TXT examples
 *   node example/run-example.js json       — speaks only the JSON example
 *   node example/run-example.js txt        — speaks only the TXT example
 *   node example/run-example.js save       — saves audio files to ./output/ instead of playing
 */

const path = require('path');
const fs = require('fs');

// Load the TTS module
const tts = require('../src/tts-module');

async function main() {
  const mode = process.argv[2] || 'all';
  const saveMode = mode === 'save';

  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   TTS Module — Standalone Test / Demo           ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log(`Engine: Google TTS (free, no API key needed)`);
  console.log(`Output: ${saveMode ? 'files saved to ./output/' : 'speak aloud (requires speakers/headphones)'}`);
  console.log('');

  let outputDir = null;
  if (saveMode) {
    outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
  }

  const examplesDir = __dirname;

  if (mode === 'all' || mode === 'json') {
    console.log('── ▶ JSON example ──────────────────────────────');
    const jsonPath = path.join(examplesDir, 'input.json');
    if (saveMode) {
      const files = await tts.speakFromFile(jsonPath, { outputDir, engine: 'google' });
      console.log(`Saved ${files.length} files`);
    } else {
      await tts.speakFromFile(jsonPath);
    }
    console.log('');
  }

  if (mode === 'all' || mode === 'txt') {
    console.log('── ▶ TXT example ───────────────────────────────');
    const txtPath = path.join(examplesDir, 'input.txt');
    if (saveMode) {
      const files = await tts.speakFromFile(txtPath, { outputDir, engine: 'google' });
      console.log(`Saved ${files.length} files`);
    } else {
      await tts.speakFromFile(txtPath);
    }
    console.log('');
  }

  if (saveMode) {
    console.log(`Audio files saved to: ${path.join(__dirname, 'output')}`);
    const files = fs.readdirSync(outputDir);
    files.forEach(f => console.log(`  • ${f}`));
  }

  console.log('✓ Done');
}

main().catch(err => {
  console.error('✗ Error:', err.message);
  process.exit(1);
});