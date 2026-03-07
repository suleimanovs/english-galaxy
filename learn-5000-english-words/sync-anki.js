#!/usr/bin/env node
/**
 * sync-anki.js
 * Syncs unknown English words from Obsidian lessons to Anki.
 *
 * Flow:
 *   1. Scan lesson files for red-colored words (<font color="#c0504d">)
 *   2. Export NEW words to Anki via AnkiConnect (generates 3 sentences with Gemini)
 *   3. Check Anki for cards with interval >= KNOWN_INTERVAL_DAYS → remove red color in lesson
 *
 * Requirements:
 *   - Node.js 18+ (built-in fetch)
 *   - Anki running with AnkiConnect plugin installed
 *   - GEMINI_API_KEY environment variable set
 *
 * Usage:
 *   node sync-anki.js
 */

const fs   = require('fs');
const path = require('path');

// ─── CONFIG ──────────────────────────────────────────────────────────────────

const CONFIG = {
  lessonsPath:      path.dirname(__filename),
  trackerFile:      'word-tracker.json',
  ankiUrl:          'http://localhost:8765',
  ankiDeck:         'English Galaxy',
  ankiModel:        'Basic',           // must have Front + Back fields
  targetColor:      '#c0504d',         // red = unknown
  geminiApiKey:     'AIzaSyCSmV9kPZT7M1QX0fwoMX_6WWNKBUI1kW8',
  geminiModel:      'gemini-2.0-flash',
  knownIntervalDays: 7,               // Anki card interval >= this → word is "known"
  geminiDelayMs:    700,              // delay between Gemini calls to avoid rate limits
};

const TRACKER_PATH = path.join(CONFIG.lessonsPath, CONFIG.trackerFile);

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function loadTracker() {
  if (!fs.existsSync(TRACKER_PATH)) return {};
  try { return JSON.parse(fs.readFileSync(TRACKER_PATH, 'utf8')); }
  catch { return {}; }
}

function saveTracker(tracker) {
  fs.writeFileSync(TRACKER_PATH, JSON.stringify(tracker, null, 2), 'utf8');
}

// ─── ANKI ────────────────────────────────────────────────────────────────────

async function anki(action, params = {}) {
  const res = await fetch(CONFIG.ankiUrl, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ action, version: 6, params }),
  });
  const { result, error } = await res.json();
  if (error) throw new Error(`AnkiConnect [${action}]: ${error}`);
  return result;
}

// ─── GEMINI ──────────────────────────────────────────────────────────────────

async function generateSentences(word, translation) {
  if (!CONFIG.geminiApiKey) throw new Error('GEMINI_API_KEY is not set');

  const prompt =
    `Create 3 diverse English example sentences using the word "${word}" (Russian: ${translation}).\n` +
    `Rules:\n` +
    `- Each sentence in a different real-life context (work, travel, daily life, etc.)\n` +
    `- Bold the target word: **${word}**\n` +
    `- Natural language, suitable for an intermediate learner\n` +
    `- Return ONLY a JSON array of exactly 3 strings, no markdown fences, no explanation\n\n` +
    `Output: ["sentence 1", "sentence 2", "sentence 3"]`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.geminiModel}:generateContent?key=${CONFIG.geminiApiKey}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );
  const data = await res.json();
  if (data.error) throw new Error(`Gemini: ${JSON.stringify(data.error)}`);

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error('Gemini: empty response');

  const start = text.indexOf('[');
  const end   = text.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) throw new Error(`Gemini: unexpected format:\n${text}`);

  return JSON.parse(text.slice(start, end + 1));
}

// ─── LESSON SCANNING ─────────────────────────────────────────────────────────

function scanUnknownWords() {
  const COLOR = CONFIG.targetColor.toLowerCase();
  const results = [];

  const files = fs.readdirSync(CONFIG.lessonsPath)
    .filter(f => f.endsWith('.md') && /^lesson/i.test(f))
    .sort();

  for (const filename of files) {
    const filePath = path.join(CONFIG.lessonsPath, filename);
    const lines    = fs.readFileSync(filePath, 'utf8').split('\n');

    lines.forEach((line, lineIdx) => {
      const re = /<font\s+color=["'](#?[0-9a-fA-F]{6})["'][^>]*>(.*?)<\/font>/gi;
      let m;
      while ((m = re.exec(line)) !== null) {
        const color = m[1].startsWith('#') ? m[1].toLowerCase() : `#${m[1].toLowerCase()}`;
        if (color !== COLOR) continue;

        const inner = m[2].trim();
        const parts = inner.match(/^(.+?)\s*-\s*(.+)$/);
        if (!parts) continue;

        results.push({
          word:        parts[1].trim(),
          translation: parts[2].trim(),
          filename,
          filePath,
          lineIdx,
        });
      }
    });
  }

  return results;
}

// ─── LESSON MODIFICATION ─────────────────────────────────────────────────────

function removeRedColor(filePath, word, translation) {
  const content = fs.readFileSync(filePath, 'utf8');
  const ew = escapeRegex(word);
  const et = escapeRegex(translation);

  // Matches <font color="#c0504d">word - translation</font>
  const pattern = new RegExp(
    `<font\\s+color=["']${escapeRegex(CONFIG.targetColor)}["'][^>]*>${ew}\\s*-\\s*${et}<\\/font>`,
    'gi'
  );

  const updated = content.replace(pattern, `${word} - ${translation}`);
  if (updated === content) return false;

  fs.writeFileSync(filePath, updated, 'utf8');
  return true;
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  Obsidian → Anki Sync');
  console.log('═══════════════════════════════════════\n');

  const tracker      = loadTracker();
  const unknownWords = scanUnknownWords();
  console.log(`Lessons path   : ${CONFIG.lessonsPath}`);
  console.log(`Unknown words  : ${unknownWords.length}`);
  console.log(`Tracker entries: ${Object.keys(tracker).length}\n`);

  // ── Connect to Anki ──────────────────────────────────────────────────────
  try {
    const ver = await anki('version');
    console.log(`AnkiConnect v${ver} connected`);
  } catch {
    console.error('ERROR: Cannot reach AnkiConnect. Is Anki open and AnkiConnect installed?');
    process.exit(1);
  }

  const decks = await anki('deckNames');
  if (!decks.includes(CONFIG.ankiDeck)) {
    await anki('createDeck', { deck: CONFIG.ankiDeck });
    console.log(`Created Anki deck: "${CONFIG.ankiDeck}"`);
  }

  // ── Export new words ─────────────────────────────────────────────────────
  const newWords = unknownWords.filter(w => !tracker[w.word]);
  console.log(`\nNew words to export: ${newWords.length}`);

  let exportedCount = 0;

  for (const { word, translation, filename } of newWords) {
    process.stdout.write(`  "${word}" — generating sentences... `);
    try {
      const sentences = await generateSentences(word, translation);

      const front =
        `<div style="font-size:1.4em;font-weight:bold;margin-bottom:0.8em">${word}</div>` +
        `<ol>` +
        sentences.map(s => `<li>${s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')}</li>`).join('') +
        `</ol>`;

      const back = `<div style="font-size:1.2em">${translation}</div>`;

      const noteId = await anki('addNote', {
        note: {
          deckName:  CONFIG.ankiDeck,
          modelName: CONFIG.ankiModel,
          fields:    { Front: front, Back: back },
          tags:      ['english-galaxy', filename.replace('.md', '').replace(/\s+/g, '_')],
          options:   { allowDuplicate: false },
        },
      });

      tracker[word] = {
        noteId,
        translation,
        filename,
        exportedAt: new Date().toISOString().split('T')[0],
        status:     'learning',
      };

      exportedCount++;
      console.log(`OK (noteId: ${noteId})`);

      await new Promise(r => setTimeout(r, CONFIG.geminiDelayMs));
    } catch (e) {
      console.log(`FAILED: ${e.message}`);
    }
  }

  if (exportedCount > 0) {
    saveTracker(tracker);
    console.log(`\nExported ${exportedCount} word(s) to Anki`);
  }

  // ── Check for known words ────────────────────────────────────────────────
  const learning = Object.entries(tracker).filter(([, d]) => d.status === 'learning');
  console.log(`\nChecking ${learning.length} learning word(s) in Anki...`);

  let knownCount = 0;

  for (const [word, data] of learning) {
    try {
      const cards = await anki('findCards', { query: `nid:${data.noteId}` });
      if (!cards.length) continue;

      const infos        = await anki('cardsInfo', { cards });
      const allGraduated = infos.every(c => c.interval >= CONFIG.knownIntervalDays);
      if (!allGraduated) continue;

      // Use translation from current file (may differ slightly from tracker)
      const entry = unknownWords.find(w => w.word === word);
      if (entry) {
        const removed = removeRedColor(entry.filePath, entry.word, entry.translation);
        if (removed) console.log(`  Marked "${word}" as known in ${entry.filename}`);
      }

      tracker[word].status  = 'known';
      tracker[word].knownAt = new Date().toISOString().split('T')[0];
      knownCount++;
    } catch {
      // card may have been deleted from Anki — skip silently
    }
  }

  // ── Clean up tracker (words manually removed from lessons) ───────────────
  const currentWordSet = new Set(unknownWords.map(w => w.word));
  for (const [word, data] of Object.entries(tracker)) {
    if (data.status === 'learning' && !currentWordSet.has(word)) {
      tracker[word].status = 'removed';
    }
  }

  saveTracker(tracker);

  // ── Summary ──────────────────────────────────────────────────────────────
  const stats = Object.values(tracker).reduce((acc, d) => {
    acc[d.status] = (acc[d.status] || 0) + 1;
    return acc;
  }, {});

  console.log('\n═══════════════════════════════════════');
  console.log('  Done');
  console.log('═══════════════════════════════════════');
  console.log(`  Exported this run : ${exportedCount}`);
  console.log(`  Known this run    : ${knownCount}`);
  console.log(`  Learning (total)  : ${stats.learning  || 0}`);
  console.log(`  Known    (total)  : ${stats.known     || 0}`);
  console.log(`  Removed  (total)  : ${stats.removed   || 0}`);
  console.log('═══════════════════════════════════════\n');
}

main().catch(e => {
  console.error('\nFatal error:', e.message);
  process.exit(1);
});
