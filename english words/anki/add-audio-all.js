#!/usr/bin/env node
// add-audio-all.js — Downloads Google TTS audio for ALL decks,
// saves MP3 locally, uploads to Anki, updates card Front field.
//
// Usage: node add-audio-all.js

const fs   = require('fs');
const path = require('path');

const ANKI_DIR  = __dirname;
const ROOT      = path.resolve(ANKI_DIR, '..', '..');
const AUDIO_DIR = path.join(ANKI_DIR, 'audio');
const ANKI_URL  = 'http://localhost:8765';

// ─── DECK CONFIGS ────────────────────────────────────────────────────────────
const DECKS = [
  {
    id: 'false', name: 'EG — False Friends', file: 'false-friends-tracker.csv',
    dir: ANKI_DIR, tagPrefix: 'ff', frontKey: 0, ttsKey: 0
  },
  {
    id: 'idioms', name: 'EG — Idioms', file: 'idioms-tracker.csv',
    dir: ANKI_DIR, tagPrefix: 'idiom', frontKey: 0, ttsKey: 0
  },
  {
    id: 'collocations', name: 'EG — Collocations', file: 'collocations-tracker.csv',
    dir: ANKI_DIR, tagPrefix: 'coll', frontKey: 0, ttsKey: 0
  },
  {
    id: 'prep', name: 'EG — Prepositional Phrases', file: 'prepositional-phrases-tracker.csv',
    dir: ANKI_DIR, tagPrefix: 'prep', frontKey: 0, ttsKey: 0
  },
  {
    id: 'linking', name: 'EG — Linking Words', file: 'linking-words-tracker.csv',
    dir: ANKI_DIR, tagPrefix: 'lw', frontKey: 0, ttsKey: 0
  },
  {
    id: 'irregular', name: 'EG — Irregular Verbs', file: 'irregular-verbs-tracker.csv',
    dir: ANKI_DIR, tagPrefix: 'iv', frontKey: 0, ttsKey: 0
  },
  {
    id: 'phrasal_n', name: 'EG — Phrasal Nouns', file: 'phrasal-nouns-tracker.csv',
    dir: ANKI_DIR, tagPrefix: 'pn', frontKey: 0, ttsKey: 0
  },
  {
    id: 'confusing', name: 'EG — Confusing Words', file: 'confusing-words-tracker.csv',
    dir: ANKI_DIR, tagPrefix: 'cw', frontKey: 0,
    // For confusing pairs like "affect / effect", TTS both words separately
    ttsTransform: row => {
      const parts = row[0].split('/').map(s => s.trim());
      return parts.join('. . . '); // pause between words
    }
  },
  {
    id: 'phrasal_v', name: 'English Galaxy — Phrasal Verbs', file: 'phrasal-verbs-tracker.csv',
    dir: ANKI_DIR, tagPrefix: 'pv', frontKey: 0, ttsKey: 0
  },
  {
    id: 'egw', name: 'English Galaxy', file: 'word-tracker.csv',
    dir: path.join(ROOT, 'learn-5000-english-words'), tagPrefix: 'egw', frontKey: 0, ttsKey: 0
  },
];

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

function toTag(prefix, word) {
  return prefix + '_' + word.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

// ─── DOWNLOAD ────────────────────────────────────────────────────────────────
async function downloadAudio(text, filepath) {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length < 100) throw new Error('file too small');
  fs.writeFileSync(filepath, buffer);
  return buffer;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== add-audio-all.js ===\n');

  if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

  try {
    const ver = await ankiReq('version');
    console.log(`AnkiConnect v${ver} ✓\n`);
  } catch {
    console.error('ERROR: Anki is not running!');
    process.exit(1);
  }

  let totalOk = 0, totalSkip = 0, totalErr = 0;

  for (const deck of DECKS) {
    const csvPath = path.join(deck.dir, deck.file);
    if (!fs.existsSync(csvPath)) {
      console.log(`\n── ${deck.id}: file not found (${deck.file}), skipping`);
      continue;
    }

    const lines = fs.readFileSync(csvPath, 'utf8').trim().split('\n').filter(l => l.trim());
    const entries = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split('|');
      const key = cols[0]?.trim();
      if (!key) continue;
      entries.push({ key, cols });
    }

    console.log(`\n── ${deck.id} (${deck.name}): ${entries.length} entries`);
    let ok = 0, skip = 0, err = 0;

    for (let i = 0; i < entries.length; i++) {
      const { key, cols } = entries[i];
      const fileSlug = key.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
      const filename = `eg_${deck.id}_${fileSlug}.mp3`;
      const filepath = path.join(AUDIO_DIR, filename);

      // Determine TTS text
      const ttsText = deck.ttsTransform ? deck.ttsTransform(cols) : cols[deck.ttsKey || 0].trim();

      process.stdout.write(`  [${i + 1}/${entries.length}] "${key}" — `);

      try {
        // Download if not cached
        let audioBuffer;
        if (fs.existsSync(filepath) && fs.statSync(filepath).size > 100) {
          audioBuffer = fs.readFileSync(filepath);
          process.stdout.write('cached → ');
        } else {
          audioBuffer = await downloadAudio(ttsText, filepath);
          process.stdout.write('dl → ');
          // Small delay to avoid rate limiting
          await sleep(100);
        }

        // Upload to Anki
        const base64 = audioBuffer.toString('base64');
        await ankiReq('storeMediaFile', { filename, data: base64 });

        // Find note and update
        const tag = toTag(deck.tagPrefix, key);
        const noteIds = await ankiReq('findNotes', { query: `deck:"${deck.name}" tag:${tag}` });
        if (noteIds.length === 0) {
          console.log('no note');
          skip++;
          continue;
        }

        const noteInfo = await ankiReq('notesInfo', { notes: [noteIds[0]] });
        const currentFront = noteInfo[0].fields.Front.value;

        // Skip if already has this exact sound
        if (currentFront.includes(`[sound:${filename}]`)) {
          console.log('✓ (already)');
          ok++;
          continue;
        }

        const cleanFront = currentFront.replace(/\[sound:[^\]]+\]/g, '').trim();
        await ankiReq('updateNoteFields', {
          note: { id: noteIds[0], fields: { Front: cleanFront + `\n[sound:${filename}]` } }
        });

        console.log('✓');
        ok++;
      } catch (e) {
        console.log(`✗ ${e.message}`);
        err++;
      }
    }

    console.log(`  → ok: ${ok}  skip: ${skip}  err: ${err}`);
    totalOk += ok; totalSkip += skip; totalErr += err;
  }

  console.log(`\n=== TOTAL: ✓ ${totalOk}  skip: ${totalSkip}  err: ${totalErr} ===`);
}

main().catch(e => { console.error(e); process.exit(1); });
