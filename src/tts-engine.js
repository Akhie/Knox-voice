/**
 * TTS Engine — drives actual speech synthesis.
 *
 * Three backends:
 *   1. Web Speech API  — Electron renderer process (free, native, no internet)
 *   2. Google TTS      — free, no API key, translate.googleapis.com
 *   3. VoiceRSS         — free tier (demo key, 350+ requests/day)
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = (() => {
  try { return require('child_process'); }
  catch { return { spawn: null }; }
})();

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

async function speak({ text, lang, engine }) {
  if (engine === 'web-speech') {
    return speakWebSpeech({ text, lang });
  }
  if (engine === 'voicerss') {
    return speakVoiceRss({ text, lang });
  }
  return speakGoogle({ text, lang });
}

async function saveToFile({ text, lang, outputDir, index = 0 }) {
  const safeLang = lang === 'ko' ? 'ko' : 'en';
  const safeName = text.replace(/[^a-zA-Z0-9가-힣\s]/g, ' ').trim().replace(/\s+/g, '_').slice(0, 40);
  const fileName = `${String(index).padStart(3, '0')}_${safeLang}_${safeName}.mp3`;
  const filePath = path.join(outputDir, fileName);

  try {
    // Try Google HTTPS first, fall back to HTTP, then VoiceRSS
    let audioBuffer;
    try {
      audioBuffer = await fetchGoogleTts(text, safeLang, 'https');
    } catch (httpsErr) {
      try {
        audioBuffer = await fetchGoogleTts(text, safeLang, 'http');
      } catch (httpErr) {
        audioBuffer = await fetchVoiceRss(text, safeLang);
      }
    }
    fs.writeFileSync(filePath, audioBuffer);
    return filePath;
  } catch (err) {
    console.error(`TTS saveToFile error: ${err.message}`);
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Web Speech API                                                    */
/* ------------------------------------------------------------------ */

function speakWebSpeech({ text, lang }) {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return reject(new Error('Web Speech API not available'));
    }
    const utterance = new SpeechSynthesisUtterance(text);
    const langMap = { en: 'en-US', ko: 'ko-KR' };
    utterance.lang = langMap[lang] || 'en-US';
    utterance.rate = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang.startsWith(lang));
    if (preferred) utterance.voice = preferred;

    utterance.onend = resolve;
    utterance.onerror = (e) => reject(new Error(`Web Speech error: ${e.error}`));

    let attempts = 0;
    function trySpeak() {
      if (++attempts > 10)
        return reject(new Error('Web Speech: could not speak after 10 attempts'));
      if (window.speechSynthesis.speaking) {
        setTimeout(trySpeak, 100);
        return;
      }
      window.speechSynthesis.speak(utterance);
    }
    trySpeak();
  });
}

/* ------------------------------------------------------------------ */
/*  Google TTS                                                        */
/* ------------------------------------------------------------------ */

async function speakGoogle({ text, lang }) {
  let audioBuffer;
  try {
    audioBuffer = await fetchGoogleTts(text, lang, 'https');
  } catch {
    audioBuffer = await fetchGoogleTts(text, lang, 'http');
  }
  const tmpFile = path.join(
    process.env.TEMP || process.env.TMP || '/tmp',
    `tts_${Date.now()}_${Math.random().toString(36).slice(2)}.mp3`
  );
  fs.writeFileSync(tmpFile, audioBuffer);
  await playFile(tmpFile);
  try { fs.unlinkSync(tmpFile); } catch (_) {}
}

function fetchGoogleTts(text, lang, protocol = 'https') {
  return new Promise((resolve, reject) => {
    const q = encodeURIComponent(text);
    const tl = lang === 'ko' ? 'ko' : 'en';
    const options = {
      hostname: 'translate.google.com',
      path: `/translate_tts?ie=UTF-8&q=${q}&tl=${tl}&client=tw-ob&ttsspeed=1`,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'audio/mpeg, */*',
        'Referer': 'https://translate.google.com/',
      },
    };

    const transport = protocol === 'https' ? https : http;
    const req = transport.get(options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = new URL(res.headers.location);
        const redirectOpts = {
          hostname: redirectUrl.hostname,
          path: redirectUrl.pathname + redirectUrl.search,
          method: 'GET',
          headers: options.headers,
        };
        const redirectTransport = redirectUrl.protocol === 'https:' ? https : http;
        return redirectTransport.get(redirectOpts, handleResponse).on('error', reject);
      }
      handleResponse(res);
    });
    req.on('error', reject);
    req.end();

    function handleResponse(res) {
      if (res.statusCode !== 200) {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => reject(
          new Error(`Google TTS returned ${res.statusCode}: ${body.slice(0, 200)}`)
        ));
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }
  });
}

/* ------------------------------------------------------------------ */
/*  VoiceRSS  (free tier, demo API key)                               */
/* ------------------------------------------------------------------ */

async function speakVoiceRss({ text, lang }) {
  const audioBuffer = await fetchVoiceRss(text, lang);
  const tmpFile = path.join(
    process.env.TEMP || process.env.TMP || '/tmp',
    `tts_${Date.now()}_${Math.random().toString(36).slice(2)}.wav`
  );
  fs.writeFileSync(tmpFile, audioBuffer);
  await playFile(tmpFile);
  try { fs.unlinkSync(tmpFile); } catch (_) {}
}

function fetchVoiceRss(text, lang) {
  return new Promise((resolve, reject) => {
    const langMap = { en: 'en-us', ko: 'ko-kr' };
    const hl = langMap[lang] || 'en-us';
    const q = encodeURIComponent(text);
    const options = {
      hostname: 'api.voicerss.org',
      path: `/?key=demo&hl=${hl}&src=${q}&r=-2&c=WAV`,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    };

    const req = https.get(options, (res) => {
      if (res.statusCode !== 200) {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => reject(
          new Error(`VoiceRSS returned ${res.statusCode}: ${body.slice(0, 200)}`)
        ));
        return;
      }
      // Skip WAV header (44 bytes) if it's a text error response
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        const header = buf.toString('utf-8', 0, 44).toLowerCase();
        if (header.includes('error') || header.includes('html') || header.includes('<!doctype')) {
          // Demo key limit hit — fall through to Google
          return reject(new Error('VoiceRSS returned an error response'));
        }
        resolve(buf);
      });
    });
    req.on('error', reject);
    req.end();
  });
}

/* ------------------------------------------------------------------ */
/*  Audio playback                                                    */
/* ------------------------------------------------------------------ */

function playFile(filePath) {
  return new Promise((resolve, reject) => {
    const plat = process.platform || 'win32';

    if (plat === 'win32') {
      if (!spawn) return reject(new Error('child_process not available'));
      // PowerShell WPF MediaPlayer — plays MP3, WAV natively
      const psScript = [
        `Add-Type -AssemblyName PresentationCore`,
        `$p = New-Object System.Windows.Media.MediaPlayer`,
        `$p.Open('${filePath.replace(/'/g, "''")}')`,
        `$dur = $p.NaturalDuration.TimeSpan.TotalSeconds`,
        // Wait for duration to be available
        `$sw = [Diagnostics.Stopwatch]::StartNew()`,
        `while ($dur -eq 0 -and $sw.Elapsed.TotalSeconds -lt 5) { Start-Sleep -Milliseconds 200; $dur = $p.NaturalDuration.TimeSpan.TotalSeconds }`,
        // Play
        `$p.Play()`,
        `$ms = [math]::Min($dur * 1000 + 1000, 30000)`,
        `Start-Sleep -Milliseconds $ms`,
        `$p.Stop(); $p.Close()`,
      ].join('; ');
      const ps = spawn('powershell', [
        '-NoProfile', '-Command', psScript,
      ], { stdio: 'ignore' });
      ps.on('close', () => resolve());
      ps.on('error', () => resolve()); // ignore errors, just resolve

    } else if (plat === 'darwin') {
      if (!spawn) return reject(new Error('child_process not available'));
      const child = spawn('afplay', [filePath], { stdio: 'ignore' });
      child.on('close', (code) => code === 0 ? resolve() : reject(new Error(`afplay exited ${code}`)));
      child.on('error', reject);

    } else {
      if (!spawn) return reject(new Error('child_process not available'));
      const players = ['aplay', 'paplay', 'ffplay', 'mpg123', 'mpg321'];
      tryPlayer(0);
      function tryPlayer(i) {
        if (i >= players.length)
          return reject(new Error('No audio player found. Install: ' + players.join(', ')));
        const player = players[i];
        const args = player === 'ffplay' ? ['-nodisp', '-autoexit', filePath]
                    : player === 'mpg123' || player === 'mpg321' ? [filePath]
                    : [filePath];
        const child = spawn(player, args, { stdio: 'ignore' });
        child.on('close', (code) => code === 0 ? resolve() : tryPlayer(i + 1));
        child.on('error', () => tryPlayer(i + 1));
      }
    }
  });
}

module.exports = { speak, saveToFile };