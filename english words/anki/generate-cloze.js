#!/usr/bin/env node
// generate-cloze.js — Creates cloze (fill-in-the-blank) cards from existing sentences.
// Converts **word** → {{c1::word}} and adds to Anki as "Задание с пропусками" model.
//
// Usage:
//   node generate-cloze.js              — all decks
//   node generate-cloze.js <deck-id>    — specific deck

const fs   = require('fs');
const path = require('path');

const ANKI_DIR    = __dirname;
const ROOT        = path.resolve(ANKI_DIR, '..', '..');
const ANKI_URL    = 'http://localhost:8765';
const CLOZE_MODEL = 'Задание с пропусками';

const DECKS = [
  { id: 'false',      name: 'EG — False Friends',         file: 'false-friends-tracker.csv',         dir: ANKI_DIR, tagPrefix: 'ff',    backKey: row => `${row[0]} — ${(row[2]||'').trim()}` },
  { id: 'idioms',     name: 'EG — Idioms',                file: 'idioms-tracker.csv',                dir: ANKI_DIR, tagPrefix: 'idiom', backKey: row => `${row[0]} — ${(row[1]||'').trim()}` },
  { id: 'collocations', name: 'EG — Collocations',        file: 'collocations-tracker.csv',          dir: ANKI_DIR, tagPrefix: 'coll',  backKey: row => `${row[0]} — ${(row[1]||'').trim()}` },
  { id: 'prep',       name: 'EG — Prepositional Phrases',  file: 'prepositional-phrases-tracker.csv', dir: ANKI_DIR, tagPrefix: 'prep',  backKey: row => `${row[0]} — ${(row[1]||'').trim()}` },
  { id: 'linking',    name: 'EG — Linking Words',          file: 'linking-words-tracker.csv',         dir: ANKI_DIR, tagPrefix: 'lw',    backKey: row => `${row[0]} — ${(row[1]||'').trim()}` },
  { id: 'irregular',  name: 'EG — Irregular Verbs',        file: 'irregular-verbs-tracker.csv',       dir: ANKI_DIR, tagPrefix: 'iv',    backKey: row => `${row[0]} (${(row[1]||'').trim()}, ${(row[2]||'').trim()}) — ${(row[3]||'').trim()}` },
  { id: 'phrasal_n',  name: 'EG — Phrasal Nouns',          file: 'phrasal-nouns-tracker.csv',         dir: ANKI_DIR, tagPrefix: 'pn',    backKey: row => `${row[0]} — ${(row[2]||'').trim()}` },
  { id: 'confusing',  name: 'EG — Confusing Words',        file: 'confusing-words-tracker.csv',       dir: ANKI_DIR, tagPrefix: 'cw',    backKey: row => `${(row[1]||'').trim()} — ${(row[2]||'').trim()} / ${(row[3]||'').trim()} — ${(row[4]||'').trim()}` },
  { id: 'phrasal_v',  name: 'EG — Phrasal Verbs',          file: 'phrasal-verbs-tracker.csv',         dir: ANKI_DIR, tagPrefix: 'pv',    backKey: row => `${row[0]} — ${(row[1]||'').trim()}` },
  { id: 'egw',        name: 'EG — All Words',              file: 'word-tracker.csv',
    dir: path.join(ROOT, 'learn-5000-english-words'), tagPrefix: 'egw', backKey: row => `${row[0]} — ${(row[1]||'').trim()}` },
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

// ─── CSV ─────────────────────────────────────────────────────────────────────
function readCSV(csvPath) {
  const lines = fs.readFileSync(csvPath, 'utf8').trim().split('\n').filter(l => l.trim());
  const header = lines[0].split('|');
  const entries = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('|').map(c => c.trim());
    entries.push(cols);
  }
  return { header, entries };
}

// Find sentence columns (s1, s2, s3) by header
function findSentenceCols(header) {
  const s1 = header.indexOf('s1');
  const s2 = header.indexOf('s2');
  const s3 = header.indexOf('s3');
  return [s1, s2, s3].filter(i => i >= 0);
}

// Convert **word** to {{c1::word}} for cloze
function toCloze(sentence) {
  return sentence.replace(/\*\*(.+?)\*\*/g, '{{c1::$1}}');
}

// ─── PROCESS ─────────────────────────────────────────────────────────────────
async function processDeck(deck) {
  const csvPath = path.join(deck.dir, deck.file);
  if (!fs.existsSync(csvPath)) {
    console.log(`  ⚠ CSV not found: ${deck.file}`);
    return { added: 0, skip: 0, err: 0 };
  }

  const { header, entries } = readCSV(csvPath);
  const sCols = findSentenceCols(header);

  if (sCols.length === 0) {
    console.log(`  ⚠ No sentence columns found`);
    return { added: 0, skip: 0, err: 0 };
  }

  // Find exportedAt column to only process exported entries
  const expCol = header.indexOf('exportedAt');

  console.log(`\n── ${deck.id} (${deck.name}): ${entries.length} entries`);

  let added = 0, skip = 0, err = 0;

  for (let i = 0; i < entries.length; i++) {
    const cols = entries[i];
    const key = cols[0];

    // Skip if not exported to Anki yet
    if (expCol >= 0 && !cols[expCol]) { skip++; continue; }

    // Get sentences
    const sentences = sCols
      .map(ci => (cols[ci] || '').replace(/\\n/g, '\n').trim())
      .filter(s => s && s.includes('**'));

    if (sentences.length === 0) { skip++; continue; }

    // Check if cloze card already exists
    const clozeTag = toTag(deck.tagPrefix, key) + '_cloze';
    const existing = await ankiReq('findNotes', { query: `deck:"${deck.name}" tag:${clozeTag}` });
    if (existing.length > 0) { skip++; continue; }

    // Build cloze text
    const clozeLines = sentences.map((s, idx) => `${idx + 1}. ${toCloze(s)}`).join('<br>');
    const clozeText = `<div style="font-size:1.1em;line-height:2">${clozeLines}</div>`;

    // Build back (hint)
    const backText = `<div style="font-size:1.1em;color:#888">${deck.backKey(cols)}</div>`;

    // Audio filename (reuse existing if available)
    const slug = key.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    const audioFile = `eg_${deck.id}_${slug}.mp3`;
    const audioPath = path.join(ANKI_DIR, 'audio', audioFile);
    const hasAudio = fs.existsSync(audioPath);

    const fullCloze = hasAudio ? clozeText + `\n[sound:${audioFile}]` : clozeText;

    process.stdout.write(`  [${i + 1}/${entries.length}] "${key}" — `);

    try {
      await ankiReq('addNote', {
        note: {
          deckName: deck.name,
          modelName: CLOZE_MODEL,
          fields: {
            'Текст': fullCloze,
            'Дополнение оборота': backText
          },
          tags: [deck.id, toTag(deck.tagPrefix, key), clozeTag],
          options: { allowDuplicate: false }
        }
      });
      console.log('✓');
      added++;
    } catch (e) {
      if (e.message.includes('duplicate')) {
        console.log('(duplicate)');
        skip++;
      } else {
        console.log(`✗ ${e.message}`);
        err++;
      }
    }
  }

  console.log(`  → added: ${added}  skip: ${skip}  err: ${err}`);
  return { added, skip, err };
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== generate-cloze.js ===\n');

  try {
    const ver = await ankiReq('version');
    console.log(`AnkiConnect v${ver} ✓`);
  } catch {
    console.error('ERROR: Anki is not running!');
    process.exit(1);
  }

  const targetId = process.argv[2]?.toLowerCase();
  const decksToProcess = targetId
    ? DECKS.filter(d => d.id === targetId)
    : DECKS;

  if (targetId && decksToProcess.length === 0) {
    console.error(`Unknown deck: ${targetId}`);
    console.log('Available:', DECKS.map(d => d.id).join(', '));
    process.exit(1);
  }

  let totalAdded = 0, totalSkip = 0, totalErr = 0;

  for (const deck of decksToProcess) {
    const { added, skip, err } = await processDeck(deck);
    totalAdded += added;
    totalSkip += skip;
    totalErr += err;
  }

  console.log(`\n═══ TOTAL: added ${totalAdded}  skip: ${totalSkip}  err: ${totalErr} ═══`);
}

main().catch(e => { console.error(e); process.exit(1); });
