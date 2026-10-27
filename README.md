# TTS Module — Text-to-Speech for Electron

A self-contained JavaScript module that adds Korean ↔ English text-to-speech to an Electron app, using **free APIs** with no API key required.

## Features

- **Two backends**: Web Speech API (Electron renderer) + Google TTS (universal, free)
- **Two input formats**: JSON (structured) and TXT (tagged lines)
- **Auto language detection**: Hangul characters → Korean, otherwise → English
- **Standalone testable**: runs with plain `node` — no Electron needed
- **Save to files**: output MP3 files for offline playback
- **Cross-platform playback**: Windows (PowerShell), macOS (afplay), Linux (aplay/paplay/ffplay)

---

## Quick start

```bash
cd text-to-speech-module

# Run unit tests (no internet needed)
node test/test-input-parser.js

# Run integration test (fetches real audio, saves to test/output/)
node test/test.js

# Run example — speaks aloud
node example/run-example.js

# Save to files instead of speaking
node example/run-example.js save
```

---

## Input file formats

### JSON (`input.json`)

```json
{
  "segments": [
    { "text": "Hello, welcome.", "lang": "en" },
    { "text": "안녕하세요, 환영합니다.", "lang": "ko" },
    { "text": "This is English.", "lang": "en" }
  ]
}
```

Or a flat array: `[{ "text": "Hi", "lang": "en" }, ...]`

### TXT (`input.txt`)

```
[en] Hello, this is an English sentence.
[ko] 안녕하세요, 한국어 문장입니다.
[en] Let's switch back.
This line inherits the previous [en] tag.
```

---

## API

```js
const tts = require('text-to-speech-module');

// Speak from file
await tts.speakFromFile('input.json');
await tts.speakFromFile('input.txt');

// Speak programmatically
await tts.speak({ text: 'Hello', lang: 'en' });
await tts.speak({ text: '안녕하세요', lang: 'ko' });

// Specify engine
await tts.speak({ text: 'Hello', lang: 'en', engine: 'google' });
await tts.speak({ text: 'Hello', lang: 'en', engine: 'web-speech' });

// Save to files (returns paths)
const files = await tts.speakSegments(
  [{ text: 'Hello', lang: 'en' }, { text: '안녕', lang: 'ko' }],
  { outputDir: './output', engine: 'google' }
);

// Language detection
tts.detectLanguage('안녕하세요');  // 'ko'
tts.detectLanguage('Hello');     // 'en'

// List voices (renderer only)
const voices = tts.listVoices();
```

---

## Integration with an Electron app

### Option A: Use Web Speech API (renderer process)

```js
// renderer.js
const tts = require('text-to-speech-module');
await tts.speak({ text: 'Hello', lang: 'en' });
// → uses Web Speech API automatically (free, native)
```

### Option B: Use Google TTS (main process, or both)

```js
// main.js or renderer.js
const tts = require('text-to-speech-module');

// Explicitly use Google
await tts.speak({ text: '안녕하세요', lang: 'ko', engine: 'google' });

// Save audio alongside speaking
await tts.speakSegments(segments, {
  outputDir: path.join(app.getPath('userData'), 'audio'),
  engine: 'google',
});
```

### Option C: Preload script

```js
// preload.js
const tts = require('text-to-speech-module');
contextBridge.exposeInMainWorld('tts', {
  speak: (opts) => tts.speak(opts),
  speakFromFile: (path) => tts.speakFromFile(path),
  detectLanguage: (text) => tts.detectLanguage(text),
});
```

Then in renderer: `await window.tts.speak({ text: 'Hello', lang: 'en' })`.

---

## Module structure

```
text-to-speech-module/
├── package.json
├── README.md
├── src/
│   ├── tts-module.js      # Main module — public API
│   ├── tts-engine.js      # Speech engines (Web Speech + Google)
│   └── input-parser.js    # JSON + TXT file parser
├── test/
│   ├── test.js           # Integration tests (fetches audio, saves files)
│   ├── test-input-parser.js  # Unit tests for parser (no internet)
│   └── output/           ← test output dir (gitignore me)
└── example/
    ├── input.json        # Sample JSON input
    ├── input.txt         # Sample TXT input
    ├── run-example.js    # Demo runner
    └── output/           ← example output dir (gitignore me)
```

---

## Requirements

- **Node.js** ≥ 12 (uses `require`, `https`, `child_process`)
- **Internet connection** for Google TTS (fetches MP3 from `translate.google.com`)
- **Speakers/headphones** for playback
- **Web Speech API** only works inside Electron's renderer or a browser

---

## License

MIT — free to use in any project.