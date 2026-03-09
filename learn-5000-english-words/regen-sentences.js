#!/usr/bin/env node
// regen-sentences.js
// Scans all Lesson*.md files for red words, regenerates SIMPLE sentences via Gemini,
// updates word-tracker.csv, and syncs all cards to Anki.
//
// Usage: node regen-sentences.js

const fs   = require('fs');
const path = require('path');

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const DIR          = __dirname;
const SECRETS_PATH = path.join(DIR, 'secrets.json');
const CSV_PATH     = path.join(DIR, 'word-tracker.csv');
const ANKI_URL     = 'http://localhost:8765';
const ANKI_DECK    = 'English Galaxy';
const ANKI_MODEL   = 'Простая';
const TARGET_COLOR = '#c0504d';
const GEMINI_MODEL = 'gemini-2.5-flash-lite';
const DELAY_MS     = 40000; // 40 s between Gemini calls to avoid rate limits

const { GEMINI_API_KEY } = JSON.parse(fs.readFileSync(SECRETS_PATH, 'utf8'));
if (!GEMINI_API_KEY) { console.error('No GEMINI_API_KEY in secrets.json'); process.exit(1); }

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function post(url, body, headers = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body)
  });
  return res.json();
}

// ─── ANKI ────────────────────────────────────────────────────────────────────
async function ankiReq(action, params = {}) {
  const data = await post(ANKI_URL, { action, version: 6, params });
  if (data.error) throw new Error(`AnkiConnect [${action}]: ${data.error}`);
  return data.result;
}

function wordToTag(word) {
  return 'egw_' + word.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

function buildFront(word, sentences) {
  const items = sentences
    .map(s => `<li>${s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')}</li>`)
    .join('');
  return `<div style="font-size:1.4em;font-weight:bold;margin-bottom:0.8em">${word}</div><ol>${items}</ol>`;
}

async function upsertAnki(word, translation, filename, sentences, mode) {
  const front = buildFront(word, sentences);
  const back  = `<div style="font-size:1.2em">${translation}</div>`;
  const tag   = wordToTag(word);

  if (mode === 'add') {
    await ankiReq('addNote', {
      note: {
        deckName: ANKI_DECK, modelName: ANKI_MODEL,
        fields: { Front: front, Back: back },
        tags: ['english-galaxy', filename.replace(/\s+/g, '_'), tag],
        options: { allowDuplicate: false }
      }
    });
  } else {
    // mode === 'update'
    const noteIds = await ankiReq('findNotes', { query: `deck:"${ANKI_DECK}" tag:${tag}` });
    if (noteIds.length > 0) {
      await ankiReq('updateNoteFields', { note: { id: noteIds[0], fields: { Front: front } } });
    } else {
      // Card doesn't exist yet — add it
      await ankiReq('addNote', {
        note: {
          deckName: ANKI_DECK, modelName: ANKI_MODEL,
          fields: { Front: front, Back: back },
          tags: ['english-galaxy', filename.replace(/\s+/g, '_'), tag],
          options: { allowDuplicate: false }
        }
      });
    }
  }
}

// ─── GEMINI ──────────────────────────────────────────────────────────────────
async function generateSentences(word, translation) {
  const prompt =
    `Create 3 simple English example sentences using the word "${word}" (Russian: ${translation}).\n` +
    `Rules:\n` +
    `- A2 level vocabulary only — use only very common, everyday words\n` +
    `- Short sentences: 6–10 words each\n` +
    `- Each sentence in a different everyday context (home, school, shop, etc.)\n` +
    `- Bold only the target word: **${word}**\n` +
    `- No complex grammar, no rare words, no idioms\n` +
    `- Return ONLY a JSON array of exactly 3 strings, no markdown, no explanation\n\n` +
    `Output: ["s1", "s2", "s3"]`;

  const res = await post(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, topP: 0.7, topK: 40 }
    }
  );

  if (res.error) throw new Error(`Gemini: ${res.error.message}`);
  const text = res.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  const start = text?.indexOf('[');
  const end   = text?.lastIndexOf(']');
  if (start == null || start === -1 || end <= start)
    throw new Error(`Gemini unexpected format: ${text}`);
  return JSON.parse(text.slice(start, end + 1));
}

// ─── CSV ─────────────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split('\n').filter(l => l.trim());
  const tracker = {};
  for (let i = 1; i < lines.length; i++) {
    const p = lines[i].split('|');
    const word = p[0]?.trim();
    if (!word) continue;
    const unesc = s => (s || '').trim().replace(/\\n/g, '\n');
    tracker[word] = {
      translation: p[1]?.trim() || '',
      filename:    p[2]?.trim() || '',
      exportedAt:  p[3]?.trim() || '',
      status:      p[4]?.trim() || 'learning',
      knownAt:     p[5]?.trim() || '',
      sentences:   [unesc(p[6]), unesc(p[7]), unesc(p[8])].filter(s => s)
    };
  }
  return tracker;
}

function toCSV(tracker) {
  const rows = ['word|translation|filename|exportedAt|status|knownAt|s1|s2|s3'];
  for (const [word, d] of Object.entries(tracker)) {
    const s = d.sentences || [];
    const esc = x => (x || '').replace(/\r/g, '').replace(/\n/g, '\\n').replace(/\|/g, ' ');
    rows.push([word, d.translation, d.filename, d.exportedAt, d.status, d.knownAt || '',
               esc(s[0]), esc(s[1]), esc(s[2])].join('|'));
  }
  return rows.join('\n');
}

function saveCSV(tracker) {
  fs.writeFileSync(CSV_PATH, toCSV(tracker), 'utf8');
}

// ─── SCAN LESSONS ─────────────────────────────────────────────────────────────
function scanLessons() {
  const COLOR = TARGET_COLOR.toLowerCase();
  const results = [];
  const files = fs.readdirSync(DIR).filter(f => /^lesson/i.test(f) && f.endsWith('.md'));
  for (const filename of files) {
    const content = fs.readFileSync(path.join(DIR, filename), 'utf8');
    const re = /<font\s+color=["'](#?[0-9a-fA-F]{6})["'][^>]*>(.*?)<\/font>/gi;
    let m;
    while ((m = re.exec(content)) !== null) {
      const color = m[1].startsWith('#') ? m[1].toLowerCase() : `#${m[1].toLowerCase()}`;
      if (color !== COLOR) continue;
      const parts = m[2].trim().match(/^(.+?)\s*-\s*(.+)$/);
      if (!parts) continue;
      results.push({
        word: parts[1].trim(),
        translation: parts[2].trim(),
        filename: filename.replace('.md', '')
      });
    }
  }
  return results;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== regen-sentences.js ===\n');

  // 1. Load tracker
  let tracker = {};
  if (fs.existsSync(CSV_PATH)) {
    tracker = parseCSV(fs.readFileSync(CSV_PATH, 'utf8'));
    console.log(`Loaded ${Object.keys(tracker).length} words from CSV`);
  }

  // 2. Scan lesson files
  const lessonWords = scanLessons();
  console.log(`Found ${lessonWords.length} red words in lesson files\n`);

  // 3. Merge: add any new words from lessons not yet in tracker
  for (const { word, translation, filename } of lessonWords) {
    if (!tracker[word]) {
      tracker[word] = {
        translation, filename,
        exportedAt: new Date().toISOString().split('T')[0],
        status: 'learning',
        knownAt: '',
        sentences: []
      };
      console.log(`  + New word: "${word}"`);
    }
  }

  // 4. Verify Anki is up
  try {
    const ver = await ankiReq('version');
    console.log(`AnkiConnect v${ver} ✓\n`);
  } catch {
    console.error('ERROR: Anki is not running! Start Anki and try again.');
    process.exit(1);
  }

  // 5. Process all learning words — regenerate sentences + upsert Anki
  const words = Object.entries(tracker).filter(([, d]) => d.status === 'learning' || d.status === 'removed');
  console.log(`Processing ${words.length} words...\n`);

  let count = 0;
  for (const [word, data] of words) {
    count++;
    process.stdout.write(`[${count}/${words.length}] "${word}" — generating sentences...`);
    try {
      const sentences = await generateSentences(word, data.translation);
      const mode = data.sentences.length > 0 ? 'update' : 'add';
      await upsertAnki(word, data.translation, data.filename, sentences, mode);
      tracker[word].sentences = sentences;
      tracker[word].status = 'learning';
      if (!tracker[word].exportedAt)
        tracker[word].exportedAt = new Date().toISOString().split('T')[0];
      saveCSV(tracker);
      console.log(` ✓ (${mode})`);
    } catch (e) {
      console.log(` ✗ ERROR: ${e.message}`);
    }
    if (count < words.length) {
      process.stdout.write(`  Waiting ${DELAY_MS / 1000}s...\n`);
      await sleep(DELAY_MS);
    }
  }

  console.log(`\nDone! Processed ${count} words.`);
  console.log(`CSV saved to: ${CSV_PATH}`);
}

main().catch(e => { console.error(e); process.exit(1); });
