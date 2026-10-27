/**
 * Run any custom input file through TTS.
 *
 * Usage:
 *   node run.js example/custom-test.json        — speak aloud
 *   node run.js example/custom-test.json save   — save to ./output/
 *   node run.js example/custom-test.txt
 *   node run.js example/custom-test.txt save
 */

const path = require('path');
const fs = require('fs');
const tts = require('./src/tts-module');

async function main() {
  const inputFile = process.argv[2];
  const saveMode = process.argv[3] === 'save';

  if (!inputFile) {
    console.log('Usage: node run.js <input-file> [save]');
    console.log('  node run.js example/custom-test.json');
    console.log('  node run.js example/custom-test.json save');
    process.exit(1);
  }

  const filePath = path.resolve(inputFile);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  console.log(`Input: ${filePath}`);
  console.log(`Mode:  ${saveMode ? 'save to output/' : 'speak aloud'}`);
  console.log('');

  if (saveMode) {
    const outDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

    const parser = require('./src/input-parser');
    const segments = parser.parseFile(filePath);
    const files = await tts.speakSegments(segments, { outputDir: outDir, engine: 'google' });

    console.log(`\nSaved ${files.length} files to output/`);
    files.forEach(f => console.log(`  → ${path.basename(f)}`));
  } else {
    await tts.speakFromFile(filePath);
  }

  console.log('\n✓ Done');
}

main().catch(err => {
  console.error('✗ Error:', err.message);
  process.exit(1);
});