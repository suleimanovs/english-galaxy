#!/usr/bin/env node
// setup-true-friends.js — Reads CSV, exports to Anki, downloads audio, generates cloze.
// All data lives in CSV. No duplication.
// Usage: node setup-true-friends.js

const fs   = require('fs');
const path = require('path');

const ANKI_DIR   = __dirname;
const CSV_PATH   = path.join(ANKI_DIR, 'true-friends-tracker.csv');
const AUDIO_DIR  = path.join(ANKI_DIR, 'audio');
const ANKI_URL   = 'http://localhost:8765';
const DECK_NAME  = 'EG — True Friends';
const ANKI_MODEL = 'Простая';
const CLOZE_MODEL = 'Задание с пропусками';
const TAG_PREFIX = 'tf';

async function ankiReq(action, params = {}) {
  const res = await fetch(ANKI_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, version: 6, params }) });
  const data = await res.json();
  if (data.error) throw new Error(`AnkiConnect [${action}]: ${data.error}`);
  return data.result;
}

function toTag(word) {
  return TAG_PREFIX + '_' + word.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

function readCSV() {
  const lines = fs.readFileSync(CSV_PATH, 'utf8').trim().split('\n');
  const entries = [];
  for (let i = 1; i < lines.length; i++) {
    const c = lines[i].split('|');
    entries.push({
      word: c[0]?.trim(), russian: c[1]?.trim(),
      exportedAt: c[2]?.trim(), status: c[3]?.trim(), knownAt: c[4]?.trim(),
      s1: (c[5]||'').trim().replace(/\\n/g,'\n'), s2: (c[6]||'').trim().replace(/\\n/g,'\n'), s3: (c[7]||'').trim().replace(/\\n/g,'\n'),
      family: (c[8]||'').trim()
    });
  }
  return entries;
}

function saveCSV(entries) {
  const esc = x => (x||'').replace(/\r/g,'').replace(/\n/g,'\\n').replace(/\|/g,' ');
  const lines = ['english_word|russian_word|exportedAt|status|knownAt|s1|s2|s3|family'];
  for (const e of entries) {
    lines.push([e.word, e.russian, e.exportedAt||'', e.status||'', e.knownAt||'',
      esc(e.s1), esc(e.s2), esc(e.s3), e.family||''].join('|'));
  }
  fs.writeFileSync(CSV_PATH, lines.join('\n'), 'utf8');
}

async function downloadAudio(word, filepath) {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(word)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 100) throw new Error('empty');
  fs.writeFileSync(filepath, buf);
  return buf;
}

async function main() {
  console.log('=== setup-true-friends.js ===\n');
  const ver = await ankiReq('version');
  console.log(`AnkiConnect v${ver} ✓`);

  const decks = await ankiReq('deckNames');
  if (!decks.includes(DECK_NAME)) { await ankiReq('createDeck', { deck: DECK_NAME }); console.log(`Created deck "${DECK_NAME}"`); }
  if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

  const entries = readCSV();
  console.log(`${entries.length} words in CSV\n`);

  let exported = 0, audioOk = 0, clozeOk = 0;

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const sentences = [e.s1, e.s2, e.s3].filter(Boolean);
    if (sentences.length === 0) continue;

    const tag = toTag(e.word);
    const slug = e.word.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const audioFile = `eg_tf_${slug}.mp3`;
    const audioPath = path.join(AUDIO_DIR, audioFile);

    process.stdout.write(`[${i+1}/${entries.length}] "${e.word}" — `);

    // 1. Export regular card
    const existingNotes = await ankiReq('findNotes', { query: `deck:"${DECK_NAME}" tag:${tag} -tag:*_cloze` });
    if (existingNotes.length === 0) {
      const items = sentences.map(s => `<li>${s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')}</li>`).join('');
      const front = `<div style="font-size:1.4em;font-weight:bold;margin-bottom:0.8em">${e.word}</div><ol>${items}</ol>`;
      let back = `<div style="font-size:1.2em">${e.russian}</div><div style="color:#5cb85c;margin-top:0.3em;font-size:0.9em">✓ True Friend</div>`;
      if (e.family) back += `<div style="margin-top:0.6em;padding-top:0.5em;border-top:1px solid #444;font-size:0.9em;color:#aaa">Word family: ${e.family.replace(/(\w[\w\s-]*?) \(/g, '<b>$1</b> (')}</div>`;
      try {
        await ankiReq('addNote', { note: { deckName: DECK_NAME, modelName: ANKI_MODEL, fields: { Front: front, Back: back }, tags: ['true-friends', tag], options: { allowDuplicate: false } } });
        e.exportedAt = new Date().toISOString().split('T')[0];
        e.status = 'learning';
        exported++;
        process.stdout.write('card ');
      } catch (err) {
        if (err.message.includes('duplicate')) { e.exportedAt = e.exportedAt || new Date().toISOString().split('T')[0]; e.status = 'learning'; }
        else { console.log(`✗ ${err.message}`); continue; }
      }
    }

    // 2. Audio
    try {
      if (!fs.existsSync(audioPath)) { await downloadAudio(e.word, audioPath); await new Promise(r => setTimeout(r, 100)); }
      const base64 = fs.readFileSync(audioPath).toString('base64');
      await ankiReq('storeMediaFile', { filename: audioFile, data: base64 });
      const noteIds = await ankiReq('findNotes', { query: `deck:"${DECK_NAME}" tag:${tag} -tag:*_cloze` });
      if (noteIds.length > 0) {
        const info = await ankiReq('notesInfo', { notes: [noteIds[0]] });
        if (!info[0].fields.Front.value.includes(`[sound:${audioFile}]`)) {
          const clean = info[0].fields.Front.value.replace(/\[sound:[^\]]+\]/g, '').trim();
          await ankiReq('updateNoteFields', { note: { id: noteIds[0], fields: { Front: clean + `\n[sound:${audioFile}]` } } });
        }
      }
      audioOk++;
      process.stdout.write('audio ');
    } catch {}

    // 3. Cloze
    const clozeTag = tag + '_cloze';
    const existingCloze = await ankiReq('findNotes', { query: `deck:"${DECK_NAME}" tag:${clozeTag}` });
    if (existingCloze.length === 0) {
      const clozeSentences = sentences.filter(s => s.includes('**'));
      if (clozeSentences.length > 0) {
        const clozeLines = clozeSentences.map((s, idx) => `${idx+1}. ${s.replace(/\*\*(.+?)\*\*/g, '{{c1::$1}}')}`).join('<br>');
        let clozeText = `<div style="font-size:1.1em;line-height:2">${clozeLines}</div>`;
        if (fs.existsSync(audioPath)) clozeText += `\n[sound:${audioFile}]`;
        let backText = `<div style="font-size:1.1em;color:#888">${e.word} — ${e.russian}</div>`;
        if (e.family) backText += `<div style="margin-top:0.6em;padding-top:0.5em;border-top:1px solid #444;font-size:0.9em;color:#aaa">Word family: ${e.family.replace(/(\w[\w\s-]*?) \(/g, '<b>$1</b> (')}</div>`;
        try {
          await ankiReq('addNote', { note: { deckName: DECK_NAME, modelName: CLOZE_MODEL, fields: { 'Текст': clozeText, 'Дополнение оборота': backText }, tags: ['true-friends', tag, clozeTag], options: { allowDuplicate: false } } });
          clozeOk++;
          process.stdout.write('cloze ');
        } catch {}
      }
    }

    console.log('✓');
    if ((i + 1) % 50 === 0) saveCSV(entries);
  }

  saveCSV(entries);
  console.log(`\n═══ Done! Cards: ${exported} | Audio: ${audioOk} | Cloze: ${clozeOk} ═══`);
}

main().catch(e => { console.error(e); process.exit(1); });
