#!/usr/bin/env node
// Uploads the 7 missing audio files to Anki and updates the cards.

const fs   = require('fs');
const path = require('path');

const AUDIO_DIR = path.join(__dirname, 'audio');
const ANKI_URL  = 'http://localhost:8765';
const DECK_NAME = 'EG — False Friends';
const TAG_PREFIX = 'ff';

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

const MISSING = ['magazine', 'replica', 'focus', 'lunatic', 'speculate', 'technique', 'urban'];

async function main() {
  await ankiReq('version');
  for (const word of MISSING) {
    const filename = `eg_ff_${word}.mp3`;
    const filepath = path.join(AUDIO_DIR, filename);
    if (!fs.existsSync(filepath)) { console.log(`${word} — no file`); continue; }

    const base64 = fs.readFileSync(filepath).toString('base64');
    await ankiReq('storeMediaFile', { filename, data: base64 });

    const noteIds = await ankiReq('findNotes', { query: `deck:"${DECK_NAME}" tag:${toTag(word)}` });
    if (!noteIds.length) { console.log(`${word} — note not found`); continue; }

    const noteInfo = await ankiReq('notesInfo', { notes: [noteIds[0]] });
    const cleanFront = noteInfo[0].fields.Front.value.replace(/\[sound:[^\]]+\]/g, '').trim();
    await ankiReq('updateNoteFields', {
      note: { id: noteIds[0], fields: { Front: cleanFront + `\n[sound:${filename}]` } }
    });
    console.log(`${word} — ✓`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
