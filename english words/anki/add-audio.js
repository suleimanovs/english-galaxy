#!/usr/bin/env node
// add-audio.js — Downloads pronunciation from Free Dictionary API,
// saves MP3 locally, uploads to Anki, updates card Front field.
//
// Usage: node add-audio.js

const fs   = require('fs');
const path = require('path');

const DIR       = __dirname;
const CSV_PATH  = path.join(DIR, 'false-friends-tracker.csv');
const AUDIO_DIR = path.join(DIR, 'audio');
const ANKI_URL  = 'http://localhost:8765';
const DECK_NAME = 'EG — False Friends';
const TAG_PREFIX = 'ff';

// ─── ANKI ────────────────────────────────────────────────────────────────────
async function ankiReq(action, params = {}) {
  const res = await fetch(ANKI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, version: 6, params })
  });
  const data = await res.json();
  if (data.error) throw new Error(`AnkiConnect [${action}]: ${data.error}`);
  return data.result;
}

function toTag(word) {
  return TAG_PREFIX + '_' + word.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

// ─── DOWNLOAD AUDIO ──────────────────────────────────────────────────────────
async function downloadAudio(word, filepath) {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(word)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length < 100) throw new Error('file too small, likely empty');
  fs.writeFileSync(filepath, buffer);
  return buffer;
}

// ─── CSV ─────────────────────────────────────────────────────────────────────
const FIELDS = ['english_word','false_meaning','real_meaning','russian_word','exportedAt','status','knownAt','s1','s2','s3'];

function parseCSV(text) {
  const lines = text.trim().split('\n').filter(l => l.trim());
  const tracker = {};
  for (let i = 1; i < lines.length; i++) {
    const p = lines[i].split('|');
    const key = p[0]?.trim();
    if (!key) continue;
    const entry = {};
    for (let j = 1; j < FIELDS.length; j++) {
      entry[FIELDS[j]] = (p[j] || '').trim().replace(/\\n/g, '\n');
    }
    tracker[key] = entry;
  }
  return tracker;
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== add-audio.js (False Friends) ===\n');

  const tracker = parseCSV(fs.readFileSync(CSV_PATH, 'utf8'));
  const words = Object.keys(tracker);
  console.log(`Loaded ${words.length} words from CSV`);

  try {
    const ver = await ankiReq('version');
    console.log(`AnkiConnect v${ver} ✓\n`);
  } catch {
    console.error('ERROR: Anki is not running!');
    process.exit(1);
  }

  let ok = 0, noAudio = 0, errors = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const data = tracker[word];
    const filename = `eg_ff_${word.toLowerCase().replace(/[^a-z0-9]/g, '_')}.mp3`;
    const filepath = path.join(AUDIO_DIR, filename);

    process.stdout.write(`[${i + 1}/${words.length}] "${word}" — `);

    try {
      // 1. Download audio (skip if already exists locally)
      let audioBuffer;
      if (fs.existsSync(filepath)) {
        audioBuffer = fs.readFileSync(filepath);
        process.stdout.write('cached → ');
      } else {
        audioBuffer = await downloadAudio(word, filepath);
        process.stdout.write('downloaded → ');
      }

      // 2. Upload to Anki media
      const base64 = audioBuffer.toString('base64');
      await ankiReq('storeMediaFile', { filename, data: base64 });

      // 3. Find the note and update Front to include [sound:...]
      const tag = toTag(word);
      const noteIds = await ankiReq('findNotes', { query: `deck:"${DECK_NAME}" tag:${tag}` });
      if (noteIds.length === 0) {
        console.log('note not found in Anki, skipping');
        noAudio++;
        continue;
      }

      const noteInfo = await ankiReq('notesInfo', { notes: [noteIds[0]] });
      const currentFront = noteInfo[0].fields.Front.value;

      // Remove any existing [sound:...] to avoid duplicates
      const cleanFront = currentFront.replace(/\[sound:[^\]]+\]/g, '').trim();
      const newFront = cleanFront + `\n[sound:${filename}]`;

      await ankiReq('updateNoteFields', {
        note: { id: noteIds[0], fields: { Front: newFront } }
      });

      console.log(`✓ (${filename})`);
      ok++;
    } catch (e) {
      console.log(`✗ ERROR: ${e.message}`);
      errors++;
    }
  }

  console.log(`\nDone! ✓ ${ok}  no audio: ${noAudio}  errors: ${errors}`);
  console.log(`Audio files saved to: ${AUDIO_DIR}`);
}

main().catch(e => { console.error(e); process.exit(1); });
