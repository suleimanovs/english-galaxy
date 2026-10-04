#!/usr/bin/env node
// export-lesson.js — Export one lesson of "learn-5000-english-words" to Anki (deck "EG — All Words").
//
// What it does for every "NNNN. [x]/[ ] word - translation" line of the lesson:
//   1. builds a card (word + US IPA + 3 example sentences, styled like the rest of the deck)
//   2. downloads Google TTS audio (US) into english words/anki/audio/eg_<slug>.mp3 and attaches it
//   3. adds the note to Anki via AnkiConnect with tags: egw_<word>, english-galaxy, <Lesson_file_name>
//   4. [x] (учу)  → stays a new card                      → tracker status "learning"
//      [ ] (знаю) → setDueDate "30-60!" (random 1–2 months, sets interval too) → tracker status "known"
//   5. appends a row to word-tracker.csv
//
// Repeated words (the word is already in the tracker / deck):
//   • same meaning            → only the lesson tag is added to the existing note, nothing else changes
//   • a new meaning           → MERGE into the existing note: the new sense is appended to the back
//                               ("огонь, пожар; увольнять" → numbered list), one example sentence of the
//                               new sense replaces the last sentence on the front, the lesson tag is added,
//                               the tracker row is updated. If the line is [x] and the card was "known",
//                               the card is reset to new (forgetCards) so the new sense gets learned.
//   One word = one note; never two notes for one spelling.
//
// IPA + sentences come from a JSON data file: { "word": { "ipa": "/…/", "s": ["**word** …", "…", "…"] } }
// (for a merge only s[0] is used — write it for the NEW sense).
//
// Usage:
//   node export-lesson.js "<lesson.md>" <data.json> [--dry-run] [--known-days 30-60]

const fs   = require('fs');
const path = require('path');
const L    = require('./card-lib.js');

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

// ─── LESSON ──────────────────────────────────────────────────────────────────
function parseLesson(file) {
  const out = [];
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*(\d+)\.\s*\[([ xX])\]\s*(.+?)\s*$/);
    if (!m) continue;
    const body = m[3].replace(/<\/?font[^>]*>/gi, '').trim();
    const p = body.match(/^(.+?)\s+[-–]\s+(.+)$/);   // dash must be surrounded by spaces, so "full-time" stays intact
    if (!p) { console.warn(`  ⚠ cannot parse line: ${line}`); continue; }
    out.push({ num: +m[1], learn: m[2].toLowerCase() === 'x', word: p[1].trim(), translation: p[2].trim() });
  }
  return out;
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  const lessonName = path.basename(lessonPath, '.md');
  const lessonTag  = lessonName.replace(/\s+/g, '_');
  const entries = parseLesson(lessonPath);
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const tracker = L.readTracker();

  // plan: add / merge / same
  for (const e of entries) {
    const ex = tracker.byWord.get(e.word.toLowerCase());
    if (!ex) { e.mode = 'add'; continue; }
    e.existing = ex;
    e.newSenses = L.newSenses(e.translation, ex.translation);
    e.mode = e.newSenses.length ? 'merge' : 'same';
  }
  const count = m => entries.filter(e => e.mode === m).length;
  console.log(`Lesson: ${lessonName}  (${entries.length} words, ${entries.filter(e => e.learn).length} учу / ${entries.filter(e => !e.learn).length} знаю)`);
  console.log(`new: ${count('add')}   merge (new sense of a known word): ${count('merge')}   same meaning: ${count('same')}`);
  console.log(`Known words → setDueDate "${KNOWN_DAYS}!"${dryRun ? '   [DRY RUN]' : ''}\n`);

  const missing = entries.filter(e => e.mode !== 'same' && !data[e.word]);
  if (missing.length) { console.error('No data for: ' + missing.map(e => e.word).join(', ')); process.exit(1); }

  if (!dryRun) {
    try { console.log(`AnkiConnect v${await L.anki('version')} ✓`); }
    catch { console.error('✗ Anki is not running (or AnkiConnect missing).'); process.exit(1); }
    if (!(await L.anki('deckNames')).includes(L.ANKI_DECK)) await L.anki('createDeck', { deck: L.ANKI_DECK });
    if (!(await L.anki('modelNames')).includes(L.ANKI_MODEL)) { console.error(`✗ model "${L.ANKI_MODEL}" not found`); process.exit(1); }
  }

  let added = 0, merged = 0, known = 0, same = 0, errors = 0;

  for (const e of entries) {
    const { word, translation, learn, mode, existing } = e;
    const d = data[word];
    process.stdout.write(`  ${e.num}. ${learn ? '[x]' : '[ ]'} ${word.padEnd(16)} `);

    if (dryRun) {
      if (mode === 'same')  console.log(`= same meaning (${existing.translation}) → +tag only`);
      if (mode === 'merge') console.log(`⇄ merge: "${existing.translation}" + "${e.newSenses.join(', ')}"${learn && existing.status === 'known' ? '  (reset to new)' : ''}`);
      if (mode === 'add')   console.log(`+ ${learn ? 'learning' : `known (${KNOWN_DAYS}d)`}  ${d.ipa}`);
      continue;
    }

    try {
      let noteId = await L.findNote(word);

      if (mode === 'same') {
        if (noteId) await L.anki('addTags', { notes: [noteId], tags: lessonTag });
        let extra = '';
        if (noteId && !learn && existing.status !== 'known') {   // now marked [ ] → treat as known
          await L.anki('setDueDate', { cards: await L.anki('findCards', { query: `nid:${noteId}` }), days: `${KNOWN_DAYS}!` });
          existing.status = 'known'; existing.knownAt = L.today(); known++; extra = `, now known (${KNOWN_DAYS}d)`;
        }
        console.log(`= same meaning, tag added${extra}`); same++; continue;
      }

      if (mode === 'merge') {
        if (!noteId) throw new Error('row in tracker but no note in Anki');
        const info = (await L.anki('notesInfo', { notes: [noteId] }))[0];
        const newTr = `${existing.translation}; ${e.newSenses.join(', ')}`;
        const sentences = [existing.s1, existing.s2, d.s[0]].filter(Boolean);
        const ipa = existing.ipa || d.ipa || '';
        await L.anki('updateNoteFields', { note: { id: noteId, fields: {
          Front: L.buildFront(word, ipa, sentences, L.soundOf(info.fields.Front.value)),
          Back:  L.buildBack(newTr, existing.note) } } });
        await L.anki('addTags', { notes: [noteId], tags: lessonTag });
        let reset = '';
        if (learn && existing.status === 'known') {
          await L.anki('forgetCards', { cards: await L.anki('findCards', { query: `nid:${noteId}` }) });
          existing.status = 'learning'; existing.knownAt = ''; reset = ', reset to new';
        }
        Object.assign(existing, { translation: newTr, ipa, s1: sentences[0] || '', s2: sentences[1] || '', s3: sentences[2] || '' });
        L.syncLessonTranslation(existing.filename, word, newTr, false);
        console.log(`⇄ merged: + ${e.newSenses.join(', ')}${reset}`); merged++; continue;
      }

      // mode === 'add'
      if (noteId) {
        process.stdout.write('note exists → ');
      } else {
        let soundFile = '';
        try {
          const { filename, buf } = await L.getAudio(word, dryRun);
          await L.anki('storeMediaFile', { filename, data: buf.toString('base64') });
          soundFile = filename;
          process.stdout.write('🔊 ');
        } catch (err) { process.stdout.write(`(no audio: ${err.message}) `); }

        noteId = await L.anki('addNote', { note: {
          deckName: L.ANKI_DECK, modelName: L.ANKI_MODEL,
          fields: { Front: L.buildFront(word, d.ipa, d.s, soundFile), Back: L.buildBack(translation, '') },
          tags: [L.tagOf(word), 'english-galaxy', lessonTag],
          options: { allowDuplicate: false },
        } });
        added++;
      }

      let status = 'learning', knownAt = '';
      if (!learn) {
        const cards = await L.anki('findCards', { query: `nid:${noteId}` });
        await L.anki('setDueDate', { cards, days: `${KNOWN_DAYS}!` });
        status = 'known'; knownAt = L.today(); known++;
      }

      L.addRow(tracker, { word, ipa: d.ipa, translation, filename: lessonName, exportedAt: L.today(),
        status, knownAt, s1: d.s[0], s2: d.s[1], s3: d.s[2], note: '' });
      console.log(`✓ ${status}`);
    } catch (err) {
      console.log(`✗ ${err.message}`); errors++;
    }
  }

  if (!dryRun) L.writeTracker(tracker);
  console.log(`\n═══ added: ${added}  merged: ${merged}  same: ${same}  known(${KNOWN_DAYS}d): ${known}  errors: ${errors} ═══`);
}

main().catch(e => { console.error(e); process.exit(1); });
