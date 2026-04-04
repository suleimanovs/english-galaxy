#!/usr/bin/env node
// word-families.js — Finds word family members via Free Dictionary API
// and adds them to Anki cards (both regular and cloze).
//
// Usage:
//   node word-families.js              — all applicable decks
//   node word-families.js <deck-id>    — specific deck

const fs   = require('fs');
const path = require('path');

const ANKI_DIR = __dirname;
const ROOT     = path.resolve(ANKI_DIR, '..', '..');
const ANKI_URL = 'http://localhost:8765';
const CACHE_FILE = path.join(ANKI_DIR, 'word-families-cache.json');

// Only decks where word families make sense (single words / short phrases)
const DECKS = [
  { id: 'false',     name: 'EG — False Friends',       file: 'false-friends-tracker.csv', dir: ANKI_DIR, tagPrefix: 'ff' },
  { id: 'irregular', name: 'EG — Irregular Verbs',     file: 'irregular-verbs-tracker.csv', dir: ANKI_DIR, tagPrefix: 'iv' },
  { id: 'phrasal_n', name: 'EG — Phrasal Nouns',       file: 'phrasal-nouns-tracker.csv', dir: ANKI_DIR, tagPrefix: 'pn' },
  { id: 'egw',       name: 'EG — All Words',           file: 'word-tracker.csv',
    dir: path.join(ROOT, 'learn-5000-english-words'), tagPrefix: 'egw' },
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

// ─── CANDIDATE GENERATION ────────────────────────────────────────────────────
function generateCandidates(word) {
  const c = new Set();
  const w = word.toLowerCase().trim();
  if (w.includes(' ')) return []; // skip multi-word

  const vowelSuf = ['ing','ed','er','or','ive','ous','ious','ible','able','ation','ation','ence','ance','ity','acy','ist','ism','ize','ise'];
  const consSuf  = ['ly','ness','ment','tion','sion','ful','less','al','ship','dom'];

  // Add suffixes directly
  for (const s of [...vowelSuf, ...consSuf]) c.add(w + s);

  // Drop final 'e' before vowel suffixes
  if (w.endsWith('e')) {
    for (const s of vowelSuf) c.add(w.slice(0, -1) + s);
    c.add(w.slice(0, -1) + 'ly'); // e.g. simple → simply
  }

  // y → i before suffixes
  if (w.endsWith('y')) {
    const base = w.slice(0, -1) + 'i';
    for (const s of [...vowelSuf, ...consSuf]) c.add(base + s);
    c.add(base + 'ly');  c.add(base + 'ness');  c.add(base + 'es');
  }

  // Double final consonant (any word ending in CVC pattern)
  if (/[bcdfglmnprstvz]$/.test(w)) {
    const doubled = w + w[w.length - 1];
    for (const s of ['er','ed','ing','est','able']) c.add(doubled + s);
  }

  // Special ending transforms
  if (w.endsWith('ate')) {
    const b = w.slice(0, -3);
    c.add(b + 'acy');  c.add(b + 'ation');  c.add(b + 'ator');  c.add(b + 'ately');
  }
  if (w.endsWith('ous')) {
    const b = w.slice(0, -3);
    c.add(b + 'osity');  c.add(w + 'ly');  c.add(w + 'ness');
  }
  if (w.endsWith('ble')) {
    const b = w.slice(0, -3);
    c.add(b + 'bility');  c.add(b + 'bly');
  }
  if (w.endsWith('ive')) {
    const b = w.slice(0, -3);
    c.add(b + 'ion');  c.add(b + 'ively');
  }
  if (w.endsWith('ent') || w.endsWith('ant')) {
    const b = w.slice(0, -3);
    c.add(b + 'ence');  c.add(b + 'ance');  c.add(w + 'ly');
  }
  if (w.endsWith('ful')) {
    c.add(w + 'ly');  c.add(w.slice(0, -3));  c.add(w.slice(0, -3) + 'less');
  }
  if (w.endsWith('tion')) {
    const b = w.slice(0, -4);
    c.add(b + 'te');  c.add(b + 't');  c.add(b + 'tive');  c.add(b + 'tional');  c.add(b + 'tionally');
  }
  if (w.endsWith('al')) {
    c.add(w + 'ly');  c.add(w + 'ist');  c.add(w.slice(0, -2));  c.add(w.slice(0, -2) + 'e');
  }
  if (w.endsWith('ity')) {
    c.add(w.slice(0, -3) + 'e');  c.add(w.slice(0, -3));
  }
  if (w.endsWith('ness')) {
    c.add(w.slice(0, -4));  c.add(w.slice(0, -4) + 'ly');
  }
  if (w.endsWith('ly')) {
    c.add(w.slice(0, -2));  c.add(w.slice(0, -2) + 'le');
  }
  if (w.endsWith('ise') || w.endsWith('ize')) {
    const b = w.slice(0, -3);
    c.add(b + 'isation');  c.add(b + 'ization');  c.add(b + 'iser');  c.add(b + 'izer');
  }
  if (w.endsWith('ire')) {
    c.add(w.slice(0, -1) + 'ation');  c.add(w.slice(0, -1) + 'ing');
  }
  // -ny/-ny → -nious (harmony → harmonious)
  if (w.endsWith('ny') || w.endsWith('my')) {
    const b = w.slice(0, -1);
    c.add(b + 'ious');  c.add(b + 'ize');  c.add(b + 'ise');  c.add(b + 'ically');  c.add(b + 'ic');
  }
  // -or/-er → derive
  if (w.endsWith('or') || w.endsWith('er')) {
    const b = w.slice(0, -2);
    c.add(b + 'e');  c.add(b + 'ation');  c.add(b + 'ing');
  }
  // -lar/-nar etc → -larity, -narity
  if (w.endsWith('ar')) {
    c.add(w + 'ity');  c.add(w + 'ly');
  }
  // -ol → -oller, -olled, -olling (control)
  if (w.endsWith('ol') || w.endsWith('el') || w.endsWith('al')) {
    const doubled = w + w[w.length - 1];
    for (const s of ['er','ed','ing','able']) c.add(doubled + s);
  }
  // -rt → -rtise/-rtize (expert → expertise)
  if (w.endsWith('rt')) {
    c.add(w + 'ise');  c.add(w + 'ize');  c.add(w + 'ly');
  }
  // -ic → -ical, -ically, -ics
  if (w.endsWith('ic')) {
    c.add(w + 'al');  c.add(w + 'ally');  c.add(w + 's');  c.add(w + 'ian');
  }
  // -an → -ance, -ancy
  if (w.endsWith('an')) {
    c.add(w + 'ce');  c.add(w + 'cy');
  }
  // general: try removing last 1-3 chars and adding common endings
  if (w.length > 4) {
    for (const cut of [1, 2, 3]) {
      const base = w.slice(0, -cut);
      for (const end of ['tion','sion','ment','ness','ity','ous','ive','al','ful','less','ize','ise','ism','ist','ure','ence','ance','ible','able']) {
        c.add(base + end);
      }
    }
  }

  // Prefixes (negation & common)
  for (const p of ['un','in','im','ir','dis','re','mis','over','under','non']) {
    c.add(p + w);
    if (w.startsWith(p)) c.add(w.slice(p.length));
  }

  c.delete(w);
  return [...c].filter(x => x.length > 2 && x !== w);
}

// ─── API LOOKUP ──────────────────────────────────────────────────────────────
const POS_MAP = { noun: 'n.', verb: 'v.', adjective: 'adj.', adverb: 'adv.' };
let cache = {};

function loadCache() {
  if (fs.existsSync(CACHE_FILE)) {
    try { cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')); } catch { cache = {}; }
  }
}

function saveCache() {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache), 'utf8');
}

async function lookupWord(word) {
  if (word in cache) return cache[word];
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    if (!res.ok) { cache[word] = null; return null; }
    const data = await res.json();
    if (!Array.isArray(data)) { cache[word] = null; return null; }
    const pos = new Set();
    for (const e of data) for (const m of (e.meanings || [])) pos.add(m.partOfSpeech);
    const result = { word, pos: [...pos] };
    cache[word] = result;
    return result;
  } catch {
    cache[word] = null;
    return null;
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function findFamily(word) {
  const candidates = generateCandidates(word);
  const family = [];

  for (const cand of candidates) {
    const result = await lookupWord(cand);
    if (result) {
      const posStr = result.pos.map(p => POS_MAP[p] || p).join(', ');
      family.push({ word: result.word, pos: posStr });
    }
    // Small delay to avoid rate limiting
    if (!(cand in cache)) await sleep(50);
  }

  // Deduplicate and sort
  const seen = new Set();
  return family.filter(f => {
    if (seen.has(f.word)) return false;
    seen.add(f.word);
    return true;
  });
}

// ─── FORMAT ──────────────────────────────────────────────────────────────────
function formatFamily(family) {
  if (family.length === 0) return '';
  return family.map(f => `<b>${f.word}</b> (${f.pos})`).join(' · ');
}

// ─── CSV ─────────────────────────────────────────────────────────────────────
function formatFamilyPlain(family) {
  if (family.length === 0) return '';
  return family.map(f => `${f.word} (${f.pos})`).join(', ');
}

function readCSV(csvPath) {
  const text = fs.readFileSync(csvPath, 'utf8');
  const lines = text.trim().split('\n').filter(l => l.trim());
  const header = lines[0];
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    rows.push(lines[i]);
  }
  return { header, rows };
}

function ensureFamilyColumn(csvPath) {
  const text = fs.readFileSync(csvPath, 'utf8');
  const lines = text.trim().split('\n').filter(l => l.trim());
  const header = lines[0];
  if (header.includes('|family')) return; // already has column
  // Add family column to header and empty value to all rows
  const newLines = [header + '|family'];
  for (let i = 1; i < lines.length; i++) {
    newLines.push(lines[i] + '|');
  }
  fs.writeFileSync(csvPath, newLines.join('\n'), 'utf8');
}

function saveFamilyToCSV(csvPath, word, familyStr) {
  const text = fs.readFileSync(csvPath, 'utf8');
  const lines = text.trim().split('\n');
  const header = lines[0];
  const familyCol = header.split('|').indexOf('family');
  if (familyCol < 0) return;

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('|');
    if (cols[0]?.trim() === word) {
      // Pad columns if needed
      while (cols.length <= familyCol) cols.push('');
      cols[familyCol] = familyStr.replace(/\|/g, ';');
      lines[i] = cols.join('|');
      break;
    }
  }
  fs.writeFileSync(csvPath, lines.join('\n'), 'utf8');
}

function readKeys(csvPath) {
  const lines = fs.readFileSync(csvPath, 'utf8').trim().split('\n').filter(l => l.trim());
  return lines.slice(1).map(l => l.split('|')[0]?.trim()).filter(Boolean);
}

// ─── PROCESS ─────────────────────────────────────────────────────────────────
async function processDeck(deck) {
  const csvPath = path.join(deck.dir, deck.file);
  if (!fs.existsSync(csvPath)) { console.log(`  ⚠ ${deck.file} not found`); return 0; }

  // Ensure CSV has family column
  ensureFamilyColumn(csvPath);

  const keys = readKeys(csvPath).filter(k => !k.includes(' ') || k.split(' ').length <= 2);
  console.log(`\n── ${deck.id} (${deck.name}): ${keys.length} words`);

  let updated = 0;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    // Skip multi-word entries (phrasal verbs, idioms)
    if (key.includes(' ') && key.split(' ').length > 2) continue;

    process.stdout.write(`  [${i + 1}/${keys.length}] "${key}" — `);

    const family = await findFamily(key);
    if (family.length === 0) {
      console.log('no family found');
      continue;
    }

    const familyPlain = formatFamilyPlain(family);
    const familyHtml = `<div style="margin-top:0.6em;padding-top:0.5em;border-top:1px solid #444;font-size:0.9em;color:#aaa">Word family: ${formatFamily(family)}</div>`;

    console.log(familyPlain);

    // 1. Save to CSV
    saveFamilyToCSV(csvPath, key, familyPlain);

    // 2. Update regular Anki card
    const tag = toTag(deck.tagPrefix, key);
    try {
      const noteIds = await ankiReq('findNotes', { query: `deck:"${deck.name}" tag:${tag} -tag:*_cloze` });
      for (const nid of noteIds) {
        const info = await ankiReq('notesInfo', { notes: [nid] });
        const note = info[0];
        if (note.fields.Back?.value?.includes('Word family:')) continue;
        const newBack = note.fields.Back.value + familyHtml;
        await ankiReq('updateNoteFields', { note: { id: nid, fields: { Back: newBack } } });
      }
    } catch {}

    // 3. Update cloze card
    try {
      const clozeTag = tag + '_cloze';
      const clozeIds = await ankiReq('findNotes', { query: `deck:"${deck.name}" tag:${clozeTag}` });
      for (const nid of clozeIds) {
        const info = await ankiReq('notesInfo', { notes: [nid] });
        const note = info[0];
        const extraField = 'Дополнение оборота';
        if (note.fields[extraField]?.value?.includes('Word family:')) continue;
        const newVal = note.fields[extraField].value + familyHtml;
        await ankiReq('updateNoteFields', { note: { id: nid, fields: { [extraField]: newVal } } });
      }
    } catch {}

    updated++;
    if (updated % 20 === 0) saveCache();
  }

  saveCache();
  return updated;
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== word-families.js ===\n');
  loadCache();
  console.log(`Cache: ${Object.keys(cache).length} entries`);

  try {
    const ver = await ankiReq('version');
    console.log(`AnkiConnect v${ver} ✓`);
  } catch {
    console.error('ERROR: Anki is not running!');
    process.exit(1);
  }

  const targetId = process.argv[2]?.toLowerCase();
  const decksToProcess = targetId ? DECKS.filter(d => d.id === targetId) : DECKS;

  if (targetId && decksToProcess.length === 0) {
    console.error(`Unknown deck: ${targetId}. Available: ${DECKS.map(d => d.id).join(', ')}`);
    process.exit(1);
  }

  let total = 0;
  for (const deck of decksToProcess) {
    total += await processDeck(deck);
  }

  console.log(`\n═══ TOTAL: ${total} words with families updated ═══`);
}

main().catch(e => { console.error(e); process.exit(1); });
