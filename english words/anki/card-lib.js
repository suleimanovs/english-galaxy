// card-lib.js — shared pieces for the "EG — All Words" deck: card HTML, AnkiConnect client,
// word-tracker.csv read/write, Google TTS audio, sense helpers.
// Used by export-lesson.js and apply-word-edits.js.
//
// Translation convention (back of the card):
//   different senses are separated by "; ", synonyms of one sense by ", "
//   e.g.  "огонь, пожар; увольнять"  → rendered as a numbered list  1. огонь, пожар  2. увольнять
//   a single sense is rendered as plain text. Rare senses live in the `note` column ("реже: …").

const fs   = require('fs');
const path = require('path');

const ANKI_DIR   = __dirname;
const AUDIO_DIR  = path.join(ANKI_DIR, 'audio');
const CSV_PATH   = path.join(ANKI_DIR, 'word-tracker.csv');
const LESSON_DIR = path.join(ANKI_DIR, '..', '..', 'playlists', 'learn-5000-english-words');
const ANKI_URL   = 'http://localhost:8765';
const ANKI_DECK  = 'EG — All Words';
const ANKI_MODEL = 'Простая';
const STYLE      = { bg: '#f8fafc', accent: '#64748b' };   // egw row of card-styles.csv
const TTS_DELAY_MS = 1200;
const FIELDS     = ['word','ipa','translation','filename','exportedAt','status','knownAt','s1','s2','s3','note'];

// ─── helpers ─────────────────────────────────────────────────────────────────
const today  = () => new Date().toISOString().split('T')[0];
const sleep  = ms => new Promise(r => setTimeout(r, ms));
const slugOf = w => w.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
const tagOf  = w => 'egw_' + w.toLowerCase().replace(/[^a-z0-9]/g, '_');
const bold   = s => s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const escCsv = s => (s || '').replace(/\r/g, '').replace(/\n/g, '\\n').replace(/\|/g, ' ');

// Senses: "a, b; c" → [["a","b"],["c"]]
const splitSenses = t => (t || '').split(';').map(s => s.trim()).filter(Boolean);
const normSense   = s => s.toLowerCase().replace(/ё/g, 'е').replace(/\(.*?\)/g, '').replace(/[^a-zа-я\s-]/g, '').trim();
function sameSense(a, b) {
  a = normSense(a); b = normSense(b);
  if (!a || !b) return false;
  if (a === b || a.includes(b) || b.includes(a)) return true;
  let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i >= 6 && Math.abs(a.length - b.length) <= 3;   // заполнять / заполнить, правильный / правильно
}
// Which of the new translation's items are absent from the existing one
function newSenses(newTranslation, existingTranslation) {
  const have = (existingTranslation || '').split(/[;,]/).map(s => s.trim()).filter(Boolean);
  return (newTranslation || '').split(/[;,]/).map(s => s.trim()).filter(Boolean)
    .filter(n => !have.some(h => sameSense(h, n)));
}

// ─── AnkiConnect ─────────────────────────────────────────────────────────────
async function anki(action, params = {}) {
  const res = await fetch(ANKI_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, version: 6, params }) });
  const { result, error } = await res.json();
  if (error) throw new Error(`AnkiConnect [${action}]: ${error}`);
  return result;
}
const findNote = async word => (await anki('findNotes', { query: `deck:"${ANKI_DECK}" tag:${tagOf(word)}` }))[0];

// ─── card HTML ───────────────────────────────────────────────────────────────
const wrap = inner => `<div class="eg-card eg-deck-egw" style="background:${STYLE.bg};border-left:4px solid ${STYLE.accent};padding:14px 16px;border-radius:8px;color:#1a1a1a">${inner}</div>`;

function buildFront(word, ipa, sentences, soundFile) {
  const ipaHtml = ipa ? `<div class="ipa" style="color:#888;font-size:0.85em;margin-bottom:0.5em;font-family:monospace">${ipa}</div>` : '';
  const ol = `<ol>${sentences.filter(Boolean).map(s => `<li>${bold(s)}</li>`).join('')}</ol>`;
  const sound = soundFile ? `\n[sound:${soundFile}]` : '';
  return wrap(`<div style="font-size:1.4em;font-weight:bold;margin-bottom:0.8em">${word}</div>${ipaHtml}${ol}${sound}`);
}

function buildBack(translation, note) {
  const senses = splitSenses(translation);
  const main = senses.length > 1
    ? `<ol class="senses" style="margin:0;padding-left:1.4em;font-size:1.2em">${senses.map(s => `<li>${s}</li>`).join('')}</ol>`
    : `<div style="font-size:1.2em">${translation || ''}</div>`;
  const noteHtml = note ? `<div style="margin-top:0.8em;padding:8px 12px;background:rgba(99,102,241,0.08);border-left:3px solid #6366f1;border-radius:4px;font-size:0.88em;color:#888;font-style:italic">💡 ${note}</div>` : '';
  return wrap(main + noteHtml);
}

const soundOf = frontHtml => (frontHtml.match(/\[sound:([^\]]+)\]/) || [])[1] || '';

// ─── tracker CSV ─────────────────────────────────────────────────────────────
function readTracker() {
  const text = fs.readFileSync(CSV_PATH, 'utf8');
  const lines = text.split('\n');
  const header = lines[0].split('|').map(h => h.trim());
  const rows = [];
  const byWord = new Map();
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cells = lines[i].split('|');
    const row = Object.fromEntries(header.map((h, k) => [h, (cells[k] ?? '').trim()]));
    rows.push(row);
    if (row.word) byWord.set(row.word.toLowerCase(), row);
  }
  return { header, rows, byWord };
}
function writeTracker(tracker) {
  const out = [tracker.header.join('|'), ...tracker.rows.map(r => tracker.header.map(h => escCsv(r[h] ?? '')).join('|'))].join('\n') + '\n';
  fs.writeFileSync(CSV_PATH, out, 'utf8');
}
function addRow(tracker, row) {
  const full = Object.fromEntries(tracker.header.map(h => [h, row[h] ?? '']));
  tracker.rows.push(full);
  tracker.byWord.set(full.word.toLowerCase(), full);
  return full;
}

// ─── lesson .md sync: replace the translation of one "NNNN. [x] word - translation" line ───
function lessonFile(name) {
  if (!name || name === 'New') return null;
  const direct = path.join(LESSON_DIR, name + '.md');
  if (fs.existsSync(direct)) return direct;
  const base = name.replace(/\s*\(.*$/, '').trim();          // "Lesson 21(107-)" → "Lesson 21"
  const hit = fs.readdirSync(LESSON_DIR).find(f => f.replace(/\s*\(.*$/, '').replace(/\.md$/, '').trim() === base);
  return hit ? path.join(LESSON_DIR, hit) : null;
}
function syncLessonTranslation(lessonName, word, translation, dryRun) {
  const file = lessonFile(lessonName);
  if (!file) return 'no lesson file';
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const re = new RegExp(`^(\\s*\\d+\\.\\s*\\[[ xX]\\]\\s*)${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s+[-–]\\s+)(.*)$`, 'i');
  const i = lines.findIndex(l => re.test(l));
  if (i < 0) return 'line not found';
  const m = lines[i].match(re);
  if (m[3].trim() === translation) return 'unchanged';
  lines[i] = `${m[1]}${word}${m[2]}${translation}`;
  if (!dryRun) fs.writeFileSync(file, lines.join('\n'), 'utf8');
  return 'updated';
}

// ─── Google TTS (US voice) ───────────────────────────────────────────────────
async function getAudio(word, dryRun) {
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
    if (!dryRun) { if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true }); fs.writeFileSync(filepath, buf); }
    await sleep(TTS_DELAY_MS);   // Google TTS starts refusing after ~40 fast requests
  }
  return { filename, buf };
}

module.exports = { ANKI_DIR, AUDIO_DIR, CSV_PATH, LESSON_DIR, ANKI_DECK, ANKI_MODEL, FIELDS,
  today, sleep, slugOf, tagOf, bold, escCsv, splitSenses, sameSense, newSenses,
  anki, findNote, buildFront, buildBack, soundOf,
  readTracker, writeTracker, addRow, lessonFile, syncLessonTranslation, getAudio };
