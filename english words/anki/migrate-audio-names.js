#!/usr/bin/env node
// migrate-audio-names.js — Removes deck prefix from audio filenames.
// eg_ff_accurate.mp3 → eg_accurate.mp3
// Deduplicates, updates Anki cards, cleans up old files.

const fs   = require('fs');
const path = require('path');

const AUDIO_DIR = path.join(__dirname, 'audio');
const ANKI_URL  = 'http://localhost:8765';

async function ankiReq(action, params = {}) {
  const res = await fetch(ANKI_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, version: 6, params }) });
  const data = await res.json();
  if (data.error) throw new Error(`AnkiConnect [${action}]: ${data.error}`);
  return data.result;
}

async function main() {
  console.log('=== migrate-audio-names.js ===\n');
  const ver = await ankiReq('version');
  console.log(`AnkiConnect v${ver} ✓\n`);

  // 1. Rename local files
  console.log('── Step 1: Renaming local files...');
  const files = fs.readdirSync(AUDIO_DIR).filter(f => f.endsWith('.mp3'));
  const renameMap = {}; // old name → new name
  let renamed = 0, deduped = 0;

  for (const oldName of files) {
    // eg_ff_accurate.mp3 → eg_accurate.mp3
    // Pattern: eg_{deckid}_{slug}.mp3 → eg_{slug}.mp3
    const m = oldName.match(/^eg_[a-z_]+?_(.+\.mp3)$/);
    if (!m) continue;

    // Need to figure out where deck prefix ends and slug begins.
    // Deck prefixes: ff, idiom, collocations, coll, prep, lw, iv, pn, cw, pv, phrasal_v, phrasal_n, egw, tf, true, false, irregular, linking, confusing
    const prefixes = ['collocations_', 'confusing_', 'phrasal_v_', 'phrasal_n_', 'irregular_', 'linking_', 'false_', 'true_', 'idioms_', 'idiom_', 'prep_', 'egw_', 'ff_', 'cw_', 'pv_', 'pn_', 'lw_', 'iv_', 'tf_'];

    let newName = oldName;
    const afterEg = oldName.slice(3); // remove "eg_"
    for (const prefix of prefixes) {
      if (afterEg.startsWith(prefix)) {
        newName = 'eg_' + afterEg.slice(prefix.length);
        break;
      }
    }

    if (newName === oldName) continue;

    renameMap[oldName] = newName;
    const oldPath = path.join(AUDIO_DIR, oldName);
    const newPath = path.join(AUDIO_DIR, newName);

    if (fs.existsSync(newPath)) {
      // Already exists — just delete the old one
      fs.unlinkSync(oldPath);
      deduped++;
    } else {
      fs.renameSync(oldPath, newPath);
      renamed++;
    }
  }
  console.log(`  Renamed: ${renamed}, Deduplicated: ${deduped}\n`);

  // 2. Upload new files to Anki and update cards
  console.log('── Step 2: Updating Anki cards...');

  // Get ALL notes from all EG decks
  const deckNames = await ankiReq('deckNames');
  const egDecks = deckNames.filter(d => d.startsWith('EG') || d.startsWith('English Galaxy'));

  let updated = 0;
  for (const deckName of egDecks) {
    const noteIds = await ankiReq('findNotes', { query: `deck:"${deckName}"` });
    if (noteIds.length === 0) continue;

    console.log(`  ${deckName}: ${noteIds.length} notes`);

    // Process in batches
    const batchSize = 50;
    for (let i = 0; i < noteIds.length; i += batchSize) {
      const batch = noteIds.slice(i, i + batchSize);
      const infos = await ankiReq('notesInfo', { notes: batch });

      for (const note of infos) {
        let changed = false;
        const fields = {};

        for (const [fieldName, fieldData] of Object.entries(note.fields)) {
          let val = fieldData.value;
          // Replace [sound:eg_PREFIX_slug.mp3] → [sound:eg_slug.mp3]
          const newVal = val.replace(/\[sound:eg_(?:collocations|confusing|phrasal_v|phrasal_n|irregular|linking|false|true|idioms|idiom|prep|egw|ff|cw|pv|pn|lw|iv|tf)_([^\]]+)\]/g, '[sound:eg_$1]');
          if (newVal !== val) {
            fields[fieldName] = newVal;
            changed = true;
          }
        }

        if (changed) {
          await ankiReq('updateNoteFields', { note: { id: note.noteId, fields } });
          updated++;
        }
      }
    }
  }
  console.log(`\n  Cards updated: ${updated}`);

  // 3. Upload renamed files to Anki media
  console.log('\n── Step 3: Uploading new audio files to Anki...');
  const newFiles = fs.readdirSync(AUDIO_DIR).filter(f => f.startsWith('eg_') && f.endsWith('.mp3'));
  let uploaded = 0;
  for (const fname of newFiles) {
    const fpath = path.join(AUDIO_DIR, fname);
    const base64 = fs.readFileSync(fpath).toString('base64');
    await ankiReq('storeMediaFile', { filename: fname, data: base64 });
    uploaded++;
    if (uploaded % 100 === 0) process.stdout.write(`  ${uploaded}/${newFiles.length}...\n`);
  }
  console.log(`  Uploaded: ${uploaded}`);

  console.log(`\n═══ Done! Renamed: ${renamed} | Deduped: ${deduped} | Cards updated: ${updated} | Uploaded: ${uploaded} ═══`);
}

main().catch(e => { console.error(e); process.exit(1); });
