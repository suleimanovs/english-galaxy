#!/usr/bin/env node
// export-lesson.js — Export one lesson of "learn-5000-english-words" to Anki (deck "EG — All Words").
//
// What it does for every "NNNN. [x]/[ ] word - translation" line of the lesson:
//   1. builds a card (word + US IPA + 3 example sentences, styled like the rest of the deck)
//   2. downloads Google TTS audio (US) into english words/anki/audio/eg_<slug>.mp3 and attaches it
//   3. adds the note to Anki via AnkiConnect with tags: egw_<word>, english-galaxy, <Lesson_file_name>
//   4. [x] (учу)  → stays a new card                      → tracker status "learning"
//      [ ] (знаю) → setDueDate "30-60!" (random 1–2 months, sets interval too) → tracker status "known"
//   5. appends a row to word-tracker.csv (skips words that are already there)
//
// IPA + sentences come from a JSON data file: { "word": { "ipa": "/…/", "s": ["**word** …", "…", "…"] } }
//
// Usage:
//   node export-lesson.js "<lesson.md>" <data.json> [--dry-run] [--known-days 30-60]

const fs   = require('fs');
const path = require('path');

const ANKI_DIR   = __dirname;
const AUDIO_DIR  = path.join(ANKI_DIR, 'audio');
const CSV_PATH   = path.join(ANKI_DIR, 'word-tracker.csv');
const ANKI_URL   = 'http://localhost:8765';
const ANKI_DECK  = 'EG — All Words';
const ANKI_MODEL = 'Простая';
const STYLE      = { bg: '#f8fafc', accent: '#64748b' };   // egw row of card-styles.csv
const TTS_DELAY_MS = 1200;
const FIELDS     = ['word','ipa','translation','filename','exportedAt','status','knownAt','s1','s2','s3','note'];

// ─── ARGS ────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');
const kdIdx = argv.indexOf('--known-days');
const KNOWN_DAYS = kdIdx >= 0 ? argv[kdIdx + 1] : '30-60';
const positional = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--known-days');
const [lessonPath, dataPath] = positional;
if (!lessonPath || !dataPath) {
  console.error('Usage: node export-lesson.js "<lesson.md>" <data.json> [--dry-run] [--known-days 30-60]');
  process.exit(1);
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().split('T')[0];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const slugOf = w => w.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
const tagOf  = w => 'egw_' + w.toLowerCase().replace(/[^a-z0-9]/g, '_');
const bold   = s => s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const escCsv = s => (s || '').replace(/\r/g, '').replace(/\n/g, '\\n').replace(/\|/g, ' ');

async function anki(action, params = {}) {
  const res = await fetch(ANKI_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, version: 6, params }) });
  const { result, error } = await res.json();
  if (error) throw new Error(`AnkiConnect [${action}]: ${error}`);
  return result;
}

// ─── LESSON ──────────────────────────────────────────────────────────────────
function parseLesson(file) {
  const out = [];
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*(\d+)\.\s*\[([ xX])\]\s*(.+?)\s*$/);
    if (!m) continue;
    const body = m[3].replace(/<\/?font[^>]*>/gi, '').trim();
    const p = body.match(/^(.+?)\s*[-–]\s*(.+)$/);
    if (!p) { console.warn(`  ⚠ cannot parse line: ${line}`); continue; }
    out.push({ num: +m[1], learn: m[2].toLowerCase() === 'x', word: p[1].trim(), translation: p[2].trim() });
  }
  return out;
}

// ─── TRACKER CSV ─────────────────────────────────────────────────────────────
function readTracker() {
  const text = fs.readFileSync(CSV_PATH, 'utf8');
  const lines = text.split('\n');
  const header = lines[0].split('|').map(h => h.trim());
  const words = new Set();
  for (let i = 1; i < lines.length; i++) {
    const w = lines[i].split('|')[0]?.trim();
    if (w) words.add(w.toLowerCase());
  }
  return { header, words, endsWithNewline: text.endsWith('\n') };
}

function appendRow(tracker, row) {
  const line = tracker.header.map(h => escCsv(row[h] ?? '')).join('|');
  fs.appendFileSync(CSV_PATH, (tracker.endsWithNewline ? '' : '\n') + line + '\n', 'utf8');
  tracker.endsWithNewline = true;
  tracker.words.add(row.word.toLowerCase());
}

// ─── CARD ────────────────────────────────────────────────────────────────────
function wrap(inner) {
  return `<div class="eg-card eg-deck-egw" style="background:${STYLE.bg};border-left:4px solid ${STYLE.accent};padding:14px 16px;border-radius:8px;color:#1a1a1a">${inner}</div>`;
}
function buildFront(word, ipa, sentences, soundFile) {
  const ipaHtml = ipa ? `<div class="ipa" style="color:#888;font-size:0.85em;margin-bottom:0.5em;font-family:monospace">${ipa}</div>` : '';
  const ol = `<ol>${sentences.map(s => `<li>${bold(s)}</li>`).join('')}</ol>`;
  const sound = soundFile ? `\n[sound:${soundFile}]` : '';
  return wrap(`<div style="font-size:1.4em;font-weight:bold;margin-bottom:0.8em">${word}</div>${ipaHtml}${ol}${sound}`);
}
const buildBack = translation => wrap(`<div style="font-size:1.2em">${translation}</div>`);

// ─── AUDIO ───────────────────────────────────────────────────────────────────
async function getAudio(word) {
  const filename = `eg_${slugOf(word)}.mp3`;
  const filepath = path.join(AUDIO_DIR, filename);
  let buf;
  if (fs.existsSync(filepath) && fs.statSync(filepath).size > 100) {
    buf = fs.readFileSync(filepath);
  } else {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(word)}`;
    let lastErr;
    for (let attempt = 1; attempt <= 3 && !buf; attempt++) {
      try {
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!res.ok) throw new Error(`TTS HTTP ${res.status}`);
        const b = Buffer.from(await res.arrayBuffer());
        if (b.length < 100) throw new Error('TTS empty response');
        buf = b;
      } catch (err) { lastErr = err; await sleep(3000 * attempt); }
    }
    if (!buf) throw lastErr;
    if (!dryRun) fs.writeFileSync(filepath, buf);
    await sleep(TTS_DELAY_MS);   // Google TTS starts refusing after ~40 fast requests
  }
  return { filename, buf };
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  const lessonName = path.basename(lessonPath, '.md');
  const lessonTag  = lessonName.replace(/\s+/g, '_');
  const entries = parseLesson(lessonPath);
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const tracker = readTracker();

  console.log(`Lesson: ${lessonName}  (${entries.length} words, ${entries.filter(e => e.learn).length} учу / ${entries.filter(e => !e.learn).length} знаю)`);
  console.log(`Known words → setDueDate "${KNOWN_DAYS}!"${dryRun ? '   [DRY RUN]' : ''}\n`);

  const missing = entries.filter(e => !data[e.word]);
  if (missing.length) { console.error('No data for: ' + missing.map(e => e.word).join(', ')); process.exit(1); }

  if (!dryRun) {
    try { console.log(`AnkiConnect v${await anki('version')} ✓`); }
    catch { console.error('✗ Anki is not running (or AnkiConnect missing).'); process.exit(1); }
    if (!(await anki('deckNames')).includes(ANKI_DECK)) await anki('createDeck', { deck: ANKI_DECK });
    if (!(await anki('modelNames')).includes(ANKI_MODEL)) { console.error(`✗ model "${ANKI_MODEL}" not found`); process.exit(1); }
    if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });
  }

  let added = 0, known = 0, skipped = 0, errors = 0;

  for (const e of entries) {
    const { word, translation, learn } = e;
    const d = data[word];
    process.stdout.write(`  ${e.num}. ${learn ? '[x]' : '[ ]'} ${word.padEnd(16)} `);

    if (tracker.words.has(word.toLowerCase())) { console.log('— already in tracker, skip'); skipped++; continue; }
    if (dryRun) { console.log(`→ ${learn ? 'learning' : `known (${KNOWN_DAYS}d)`}  ${d.ipa}`); continue; }

    try {
      const dup = await anki('findNotes', { query: `deck:"${ANKI_DECK}" tag:${tagOf(word)}` });
      let noteId;
      if (dup.length) {
        noteId = dup[0];
        process.stdout.write('note exists → ');
      } else {
        let soundFile = '';
        try {
          const { filename, buf } = await getAudio(word);
          await anki('storeMediaFile', { filename, data: buf.toString('base64') });
          soundFile = filename;
          process.stdout.write('🔊 ');
        } catch (err) { process.stdout.write(`(no audio: ${err.message}) `); }

        noteId = await anki('addNote', { note: {
          deckName: ANKI_DECK, modelName: ANKI_MODEL,
          fields: { Front: buildFront(word, d.ipa, d.s, soundFile), Back: buildBack(translation) },
          tags: [tagOf(word), 'english-galaxy', lessonTag],
          options: { allowDuplicate: false },
        } });
        added++;
      }

      let status = 'learning', knownAt = '';
      if (!learn) {
        const cards = await anki('findCards', { query: `nid:${noteId}` });
        await anki('setDueDate', { cards, days: `${KNOWN_DAYS}!` });
        status = 'known'; knownAt = today(); known++;
      }

      appendRow(tracker, {
        word, ipa: d.ipa, translation, filename: lessonName, exportedAt: today(),
        status, knownAt, s1: d.s[0], s2: d.s[1], s3: d.s[2], note: '',
      });
      console.log(`✓ ${status}`);
    } catch (err) {
      console.log(`✗ ${err.message}`); errors++;
    }
  }

  console.log(`\n═══ added: ${added}  known(${KNOWN_DAYS}d): ${known}  skipped: ${skipped}  errors: ${errors} ═══`);
}

main().catch(e => { console.error(e); process.exit(1); });
