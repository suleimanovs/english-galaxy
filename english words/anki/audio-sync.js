#!/usr/bin/env node
// audio-sync.js — Unified audio manager for all Anki decks.
// Downloads Google TTS pronunciation, saves MP3 locally, uploads to Anki.
//
// Usage:
//   node audio-sync.js                    — interactive menu
//   node audio-sync.js sync              — sync all decks (add missing only)
//   node audio-sync.js sync <deck-id>    — sync specific deck
//   node audio-sync.js force             — force re-download all
//   node audio-sync.js force <deck-id>   — force specific deck
//   node audio-sync.js list              — show available decks

const fs       = require('fs');
const path     = require('path');
const readline = require('readline');

const ANKI_DIR  = __dirname;
const ROOT      = path.resolve(ANKI_DIR, '..', '..');
const AUDIO_DIR = path.join(ANKI_DIR, 'audio');
const ANKI_URL  = 'http://localhost:8765';

// ─── DECK REGISTRY ───────────────────────────────────────────────────────────
const DECKS = [
  { id: 'false',      name: 'EG — False Friends',           file: 'false-friends-tracker.csv',         dir: ANKI_DIR, tagPrefix: 'ff',    label: 'False Friends' },
  { id: 'idioms',     name: 'EG — Idioms',                  file: 'idioms-tracker.csv',                dir: ANKI_DIR, tagPrefix: 'idiom', label: 'Idioms' },
  { id: 'collocations', name: 'EG — Collocations',            file: 'collocations-tracker.csv',          dir: ANKI_DIR, tagPrefix: 'coll',  label: 'Collocations' },
  { id: 'prep',       name: 'EG — Prepositional Phrases',   file: 'prepositional-phrases-tracker.csv', dir: ANKI_DIR, tagPrefix: 'prep',  label: 'Prep. Phrases' },
  { id: 'linking',    name: 'EG — Linking Words',           file: 'linking-words-tracker.csv',         dir: ANKI_DIR, tagPrefix: 'lw',    label: 'Linking Words' },
  { id: 'irregular',  name: 'EG — Irregular Verbs',         file: 'irregular-verbs-tracker.csv',       dir: ANKI_DIR, tagPrefix: 'iv',    label: 'Irregular Verbs' },
  { id: 'phrasal_n',  name: 'EG — Phrasal Nouns',           file: 'phrasal-nouns-tracker.csv',         dir: ANKI_DIR, tagPrefix: 'pn',    label: 'Phrasal Nouns' },
  { id: 'confusing',  name: 'EG — Confusing Words',         file: 'confusing-words-tracker.csv',       dir: ANKI_DIR, tagPrefix: 'cw',    label: 'Confusing Words',
    ttsTransform: key => key.split('/').map(s => s.trim()).join('. . . ') },
  { id: 'phrasal_v',  name: 'EG — Phrasal Verbs', file: 'phrasal-verbs-tracker.csv',      dir: ANKI_DIR, tagPrefix: 'pv',    label: 'Phrasal Verbs' },
  { id: 'true',       name: 'EG — True Friends',          file: 'true-friends-tracker.csv',      dir: ANKI_DIR, tagPrefix: 'tf',    label: 'True Friends' },
  { id: 'depprep',    name: 'EG — Dependent Prepositions', file: 'dependent-prepositions-tracker.csv', dir: ANKI_DIR, tagPrefix: 'dp', label: 'Dep. Prepositions' },
  { id: 'vp',         name: 'EG — Verb Patterns',          file: 'verb-patterns-tracker.csv',     dir: ANKI_DIR, tagPrefix: 'vp',    label: 'Verb Patterns' },
  { id: 'syn',        name: 'EG — Synonym Chains',         file: 'synonym-chains-tracker.csv',    dir: ANKI_DIR, tagPrefix: 'syn',   label: 'Synonyms' },
  { id: 'egw',        name: 'EG — All Words',               file: 'word-tracker.csv',
    dir: path.join(ROOT, 'learn-5000-english-words'), tagPrefix: 'egw', label: '5000 Words' },
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

// ─── AUDIO ───────────────────────────────────────────────────────────────────
async function downloadAudio(text, filepath) {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length < 100) throw new Error('empty response');
  fs.writeFileSync(filepath, buffer);
  return buffer;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── CSV READER ──────────────────────────────────────────────────────────────
function readKeys(csvPath) {
  const lines = fs.readFileSync(csvPath, 'utf8').trim().split('\n').filter(l => l.trim());
  const keys = [];
  for (let i = 1; i < lines.length; i++) {
    const key = lines[i].split('|')[0]?.trim();
    if (key) keys.push(key);
  }
  return keys;
}

// ─── PROCESS ONE DECK ────────────────────────────────────────────────────────
async function processDeck(deck, force = false) {
  const csvPath = path.join(deck.dir, deck.file);
  if (!fs.existsSync(csvPath)) {
    console.log(`  ⚠ CSV not found: ${deck.file}`);
    return { ok: 0, skip: 0, err: 0 };
  }

  const keys = readKeys(csvPath);
  console.log(`\n── ${deck.label} (${deck.id}): ${keys.length} entries`);

  let ok = 0, skip = 0, err = 0;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const slug = key.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    const filename = `eg_${slug}.mp3`;
    const filepath = path.join(AUDIO_DIR, filename);
    const ttsText = deck.ttsTransform ? deck.ttsTransform(key) : key;

    process.stdout.write(`  [${i + 1}/${keys.length}] "${key}" — `);

    try {
      let audioBuffer;
      const cached = fs.existsSync(filepath) && fs.statSync(filepath).size > 100;

      if (cached && !force) {
        audioBuffer = fs.readFileSync(filepath);
        process.stdout.write('cached → ');
      } else {
        if (cached) fs.unlinkSync(filepath);
        audioBuffer = await downloadAudio(ttsText, filepath);
        process.stdout.write('dl → ');
        await sleep(100);
      }

      // Upload to Anki media
      await ankiReq('storeMediaFile', { filename, data: audioBuffer.toString('base64') });

      // Find note
      const tag = toTag(deck.tagPrefix, key);
      const noteIds = await ankiReq('findNotes', { query: `deck:"${deck.name}" tag:${tag}` });
      if (noteIds.length === 0) {
        console.log('no note');
        skip++;
        continue;
      }

      // Update Front field
      const noteInfo = await ankiReq('notesInfo', { notes: [noteIds[0]] });
      const currentFront = noteInfo[0].fields.Front.value;

      if (!force && currentFront.includes(`[sound:${filename}]`)) {
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
  return { ok, skip, err };
}

// ─── COMMANDS ────────────────────────────────────────────────────────────────
function listDecks() {
  console.log('\nAvailable decks:\n');
  console.log('  ID           Label              CSV file');
  console.log('  ───────────  ─────────────────  ─────────────────────────────');
  for (const d of DECKS) {
    const csvPath = path.join(d.dir, d.file);
    const exists = fs.existsSync(csvPath);
    const count = exists ? readKeys(csvPath).length : 0;
    const audioCount = exists ? readKeys(csvPath).filter(k => {
      const slug = k.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
      return fs.existsSync(path.join(AUDIO_DIR, `eg_${slug}.mp3`));
    }).length : 0;
    console.log(`  ${d.id.padEnd(13)} ${d.label.padEnd(18)} ${d.file.padEnd(35)} ${audioCount}/${count} audio`);
  }
  console.log();
}

async function runDecks(deckIds, force) {
  if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

  try {
    const ver = await ankiReq('version');
    console.log(`AnkiConnect v${ver} ✓`);
  } catch {
    console.error('\n✗ Anki is not running! Start Anki and try again.');
    process.exit(1);
  }

  const mode = force ? 'FORCE (re-download all)' : 'SYNC (add missing only)';
  console.log(`Mode: ${mode}`);

  let totalOk = 0, totalSkip = 0, totalErr = 0;

  for (const id of deckIds) {
    const deck = DECKS.find(d => d.id === id);
    if (!deck) { console.log(`Unknown deck: ${id}`); continue; }
    const { ok, skip, err } = await processDeck(deck, force);
    totalOk += ok; totalSkip += skip; totalErr += err;
  }

  console.log(`\n═══ TOTAL: ✓ ${totalOk}  skip: ${totalSkip}  err: ${totalErr} ═══`);
}

// ─── INTERACTIVE MENU ────────────────────────────────────────────────────────
function ask(rl, question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function interactiveMenu() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log('\n╔══════════════════════════════════════╗');
  console.log('║       Audio Sync for Anki            ║');
  console.log('╚══════════════════════════════════════╝\n');

  listDecks();

  console.log('Commands:');
  console.log('  1) Sync all         — add missing audio to all decks');
  console.log('  2) Sync one         — add missing audio to one deck');
  console.log('  3) Force all        — re-download & update all decks');
  console.log('  4) Force one        — re-download & update one deck');
  console.log('  5) List decks       — show status');
  console.log('  q) Quit\n');

  while (true) {
    const choice = (await ask(rl, '> ')).trim().toLowerCase();

    if (choice === 'q' || choice === 'quit' || choice === 'exit') {
      rl.close();
      return;
    }

    if (choice === '5' || choice === 'list') {
      listDecks();
      continue;
    }

    if (choice === '1') {
      rl.close();
      await runDecks(DECKS.map(d => d.id), false);
      return;
    }

    if (choice === '3') {
      rl.close();
      await runDecks(DECKS.map(d => d.id), true);
      return;
    }

    if (choice === '2' || choice === '4') {
      const force = choice === '4';
      const deckId = (await ask(rl, 'Deck ID: ')).trim().toLowerCase();
      const deck = DECKS.find(d => d.id === deckId);
      if (!deck) {
        console.log(`Unknown deck "${deckId}". Use "list" to see available decks.`);
        continue;
      }
      rl.close();
      await runDecks([deckId], force);
      return;
    }

    console.log('Unknown command. Enter 1-5 or q.');
  }
}

// ─── ENTRY POINT ─────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    await interactiveMenu();
    return;
  }

  const cmd = args[0].toLowerCase();

  if (cmd === 'list') {
    listDecks();
    return;
  }

  if (cmd === 'sync' || cmd === 'force') {
    const force = cmd === 'force';
    const deckId = args[1]?.toLowerCase();
    const deckIds = deckId ? [deckId] : DECKS.map(d => d.id);

    if (deckId && !DECKS.find(d => d.id === deckId)) {
      console.error(`Unknown deck: ${deckId}`);
      listDecks();
      process.exit(1);
    }

    await runDecks(deckIds, force);
    return;
  }

  console.log('Usage:');
  console.log('  node audio-sync.js              — interactive menu');
  console.log('  node audio-sync.js list          — show decks & audio status');
  console.log('  node audio-sync.js sync          — sync all (add missing)');
  console.log('  node audio-sync.js sync <id>     — sync one deck');
  console.log('  node audio-sync.js force         — force re-download all');
  console.log('  node audio-sync.js force <id>    — force re-download one deck');
}

main().catch(e => { console.error(e); process.exit(1); });
