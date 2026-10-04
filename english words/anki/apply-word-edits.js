#!/usr/bin/env node
// apply-word-edits.js — Apply reviewed edits (translation / sentences / note / tags) to words of the
// "EG — All Words" deck: rebuilds the Anki note (Front + Back, sound kept), updates word-tracker.csv
// and the translation in the lesson .md the word came from.
//
// Edits file: { "word": { "translation": "a, b; c", "s": ["**word** …", "…", "…"], "note": "", "ipa": "/…/", "tags": ["Lesson_43"], "reset": true }
// reset: true → forgetCards + tracker status learning (used when a later lesson marks a new sense as [x] and the card was "known"). }
// Every key is optional except that at least one must be present. Words not in the tracker are reported and skipped.
//
// Usage:  node apply-word-edits.js <edits.json> [--dry-run] [--no-lessons]

const fs = require('fs');
const L  = require('./card-lib.js');

const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');
const noLessons = argv.includes('--no-lessons');
const file = argv.find(a => !a.startsWith('--'));
if (!file) { console.error('Usage: node apply-word-edits.js <edits.json> [--dry-run] [--no-lessons]'); process.exit(1); }

async function main() {
  const edits = JSON.parse(fs.readFileSync(file, 'utf8'));
  const tracker = L.readTracker();
  const words = Object.keys(edits);
  console.log(`${words.length} edits${dryRun ? '   [DRY RUN]' : ''}`);
  if (!dryRun) { try { await L.anki('version'); } catch { console.error('✗ Anki is not running'); process.exit(1); } }

  let ok = 0, missing = 0, noNote = 0, errors = 0; const lessonStats = {};
  for (const word of words) {
    const e = edits[word];
    const row = tracker.byWord.get(word.toLowerCase());
    process.stdout.write(`  ${word.padEnd(20)} `);
    if (!row) { console.log('✗ not in tracker'); missing++; continue; }

    if (e.translation != null) row.translation = e.translation.trim();
    if (e.ipa) row.ipa = e.ipa;
    if (e.note != null) row.note = e.note.trim();
    if (Array.isArray(e.s)) { row.s1 = e.s[0] || ''; row.s2 = e.s[1] || ''; row.s3 = e.s[2] || ''; }

    if (dryRun) { console.log(`→ ${row.translation}${row.note ? `  💡 ${row.note}` : ''}`); ok++; continue; }
    try {
      const noteId = await L.findNote(word);
      if (!noteId) { console.log('⚠ no note in Anki, tracker only'); noNote++; }
      else {
        const info = (await L.anki('notesInfo', { notes: [noteId] }))[0];
        await L.anki('updateNoteFields', { note: { id: noteId, fields: {
          Front: L.buildFront(row.word, row.ipa, [row.s1, row.s2, row.s3], L.soundOf(info.fields.Front.value)),
          Back:  L.buildBack(row.translation, row.note) } } });
        if (e.tags?.length) await L.anki('addTags', { notes: [noteId], tags: e.tags.join(' ') });
        if (e.reset && row.status === 'known') {   // a new sense is marked [x] in a later lesson → learn the card again
          await L.anki('forgetCards', { cards: await L.anki('findCards', { query: `nid:${noteId}` }) });
          row.status = 'learning'; row.knownAt = '';
        }
      }
      let ls = 'skipped';
      if (!noLessons && e.translation != null) ls = L.syncLessonTranslation(row.filename, row.word, row.translation, false);
      lessonStats[ls] = (lessonStats[ls] || 0) + 1;
      console.log(`✓ ${row.translation}   [lesson: ${ls}]`); ok++;
    } catch (err) { console.log(`✗ ${err.message}`); errors++; }
  }
  if (!dryRun) L.writeTracker(tracker);
  console.log(`\n═══ applied: ${ok}  not in tracker: ${missing}  no Anki note: ${noNote}  errors: ${errors} ═══`);
  console.log('lesson .md sync:', JSON.stringify(lessonStats));
}
main().catch(e => { console.error(e); process.exit(1); });
