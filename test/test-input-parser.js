/**
 * Unit tests for InputParser (standalone, no audio).
 *
 * Run:
 *   node test/test-input-parser.js
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { parseJson, parseTxt, parseFile } = require('../src/input-parser');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ✗ ${name}: ${e.message}`);
  }
}

function eq(a, b, msg) {
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    throw new Error(`${msg || ''}\n    expected: ${JSON.stringify(b)}\n    got:      ${JSON.stringify(a)}`);
  }
}

/* ── JSON parsing ────────────────────────────────────────────── */

test('parseJson — segments object', () => {
  const result = parseJson('{"segments":[{"text":"Hello","lang":"en"},{"text":"안녕","lang":"ko"}]}');
  eq(result, [
    { text: 'Hello', lang: 'en' },
    { text: '안녕', lang: 'ko' },
  ]);
});

test('parseJson — flat array', () => {
  const result = parseJson('[{"text":"Hi","lang":"en"},{"text":"감사합니다","lang":"ko"}]');
  eq(result, [
    { text: 'Hi', lang: 'en' },
    { text: '감사합니다', lang: 'ko' },
  ]);
});

test('parseJson — single object', () => {
  const result = parseJson('{"text":"Hello world","lang":"en"}');
  eq(result, [{ text: 'Hello world', lang: 'en' }]);
});

test('parseJson — defaults lang to en', () => {
  const result = parseJson('[{"text":"Test"}]');
  eq(result, [{ text: 'Test', lang: 'en' }]);
});

test('parseJson — throws on missing text', () => {
  try {
    parseJson('[{"lang":"en"}]');
    throw new Error('should have thrown');
  } catch (e) {
    // expected
  }
});

test('parseJson — throws on invalid lang', () => {
  try {
    parseJson('[{"text":"Hi","lang":"fr"}]');
    throw new Error('should have thrown');
  } catch (e) {
    // expected
  }
});

/* ── TXT parsing ─────────────────────────────────────────────── */

test('parseTxt — basic tagged lines', () => {
  const result = parseTxt('[en] Hello\n[ko] 안녕');
  eq(result, [
    { text: 'Hello', lang: 'en' },
    { text: '안녕', lang: 'ko' },
  ]);
});

test('parseTxt — default lang is en', () => {
  const result = parseTxt('Hello\n[ko] 안녕\nGoodbye');
  eq(result, [
    { text: 'Hello', lang: 'en' },
    { text: '안녕', lang: 'ko' },
    { text: 'Goodbye', lang: 'ko' },   // inherits previous [ko]
  ]);
});

test('parseTxt — case-insensitive tags', () => {
  const result = parseTxt('[EN] Hello\n[KO] 안녕');
  eq(result, [
    { text: 'Hello', lang: 'en' },
    { text: '안녕', lang: 'ko' },
  ]);
});

test('parseTxt — trims whitespace', () => {
  const result = parseTxt('  [en]   Hello world   ');
  eq(result, [{ text: 'Hello world', lang: 'en' }]);
});

test('parseTxt — ignores blank lines', () => {
  const result = parseTxt('[en] Hello\n\n\n[ko] 안녕');
  eq(result, [
    { text: 'Hello', lang: 'en' },
    { text: '안녕', lang: 'ko' },
  ]);
});

/* ── File loading ────────────────────────────────────────────── */

test('parseFile — loads .json', () => {
  const tmp = path.join(os.tmpdir(), `tts_test_${Date.now()}.json`);
  fs.writeFileSync(tmp, '{"text":"hi"}');
  const result = parseFile(tmp);
  eq(result, [{ text: 'hi', lang: 'en' }]);
  fs.unlinkSync(tmp);
});

test('parseFile — loads .txt', () => {
  const tmp = path.join(os.tmpdir(), `tts_test_${Date.now()}.txt`);
  fs.writeFileSync(tmp, '[ko] 반갑습니다');
  const result = parseFile(tmp);
  eq(result, [{ text: '반갑습니다', lang: 'ko' }]);
  fs.unlinkSync(tmp);
});

test('parseFile — throws on unknown extension', () => {
  try {
    parseFile('test.csv');
    throw new Error('should have thrown');
  } catch (e) {
    // expected
  }
});

/* ── Summary ─────────────────────────────────────────────────── */

console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);