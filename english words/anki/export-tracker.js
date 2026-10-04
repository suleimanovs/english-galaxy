#!/usr/bin/env node
// export-tracker.js — Export pending rows of a tracker CSV to Anki from the command line.
// Mirrors the "Export" button of Anki Decks.md (same deck, model, tags, card HTML and wrapper style),
// so it can be run without opening Obsidian.
//
// Usage:
//   node export-tracker.js <deck-id> [--dry-run]       deck-id: phrasal_v (others can be added to DECKS)
//
// A row is "pending" when its exportedAt column is empty. After a successful addNote the row gets
// exportedAt = today and status = learning; the CSV is rewritten preserving all columns.

const fs   = require('fs');
const path = require('path');

const ANKI_DIR   = __dirname;
const ANKI_URL   = 'http://localhost:8765';
const ANKI_MODEL = 'Простая';

// Same shape as DECKS in Anki Decks.md (only the decks exported from the CLI so far)
const DECKS = {
  phrasal_v: { name: 'EG — Phrasal Verbs', file: 'phrasal-verbs-tracker.csv', tagPrefix: 'pv',
               keyField: 'phrasal_verb', backField: 'translation', extraTags: ['pv', 'phrasal_v'] },
};

// Wrapper colors from card-styles.csv
function cardStyle(deckId) {
  const csv = fs.readFileSync(path.join(ANKI_DIR, 'card-styles.csv'), 'utf8').trim().split('\n').slice(1);
  for (const l of csv) { const [id, bg, accent] = l.split('|'); if (id === deckId) return { bg, accent }; }
  return { bg: '#f8fafc', accent: '#64748b' };
}

const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');
const deckId = argv.find(a => !a.startsWith('--'));
const deck = DECKS[deckId];
if (!deck) { console.error(`Usage: node export-tracker.js <${Object.keys(DECKS).join('|')}> [--dry-run]`); process.exit(1); }

const today = () => new Date().toISOString().split('T')[0];
const toTag = (prefix, key) => prefix + '_' + key.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
const bold  = s => s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');

async function anki(action, params = {}) {
  const res = await fetch(ANKI_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, version: 6, params }) });
  const { result, error } = await res.json();
  if (error) throw new Error(`AnkiConnect [${action}]: ${error}`);
  return result;
}

function buildCard(deckId, key, row) {
  const st = cardStyle(deckId);
  const wrap = inner => `<div class="eg-card eg-deck-${deckId}" style="background:${st.bg};border-left:4px solid ${st.accent};padding:14px 16px;border-radius:8px;color:#1a1a1a">${inner}</div>`;
  const sentences = [row.s1, row.s2, row.s3].filter(Boolean);
  const sentHtml = sentences.length ? `<ol>${sentences.map(s => `<li>${bold(s)}</li>`).join('')}</ol>` : '';
  const ipaHtml  = row.ipa ? `<div class="ipa" style="color:#888;font-size:0.85em;margin-bottom:0.5em;font-family:monospace">${row.ipa}</div>` : '';
  const noteHtml = row.note && !/^из словаря/.test(row.note) ? `<div style="margin-top:0.8em;padding:8px 12px;background:rgba(99,102,241,0.08);border-left:3px solid #6366f1;border-radius:4px;font-size:0.88em;color:#888;font-style:italic">💡 ${row.note}</div>` : '';
  return {
    front: wrap(`<div style="font-size:1.4em;font-weight:bold;margin-bottom:0.8em">${key}</div>${ipaHtml}${sentHtml}`),
    back:  wrap(`<div style="font-size:1.2em">${row[deck.backField] || ''}</div>${noteHtml}`),
  };
}

async function main() {
  const csvPath = path.join(ANKI_DIR, deck.file);
  const text = fs.readFileSync(csvPath, 'utf8');
  const lines = text.split('\n');
  const header = lines[0].split('|').map(h => h.trim());
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  const rows = lines.slice(1).filter(l => l.trim()).map(l => l.split('|'));
  const pending = rows.filter(r => !(r[idx.exportedAt] || '').trim());

  console.log(`Deck: ${deck.name}   rows: ${rows.length}   pending: ${pending.length}${dryRun ? '   [DRY RUN]' : ''}`);
  if (!pending.length) return;

  if (!dryRun) {
    try { console.log(`AnkiConnect v${await anki('version')} ✓`); }
    catch { console.error('✗ Anki is not running'); process.exit(1); }
    if (!(await anki('deckNames')).includes(deck.name)) await anki('createDeck', { deck: deck.name });
  }

  let added = 0, dup = 0, err = 0;
  for (const r of pending) {
    const key = r[idx[deck.keyField]].trim();
    const row = Object.fromEntries(header.map(h => [h, (r[idx[h]] || '').trim().replace(/\\n/g, '\n')]));
    process.stdout.write(`  ${key.padEnd(24)} `);
    if (dryRun) { console.log('→ would add'); continue; }
    try {
      const tag = toTag(deck.tagPrefix, key);
      const existing = await anki('findNotes', { query: `deck:"${deck.name}" tag:${tag}` });
      if (existing.length) { dup++; console.log('already in Anki'); }
      else {
        const { front, back } = buildCard(deckId, key, row);
        await anki('addNote', { note: { deckName: deck.name, modelName: ANKI_MODEL, fields: { Front: front, Back: back },
          tags: [...deck.extraTags, tag], options: { allowDuplicate: false } } });
        added++; console.log('✓');
      }
      r[idx.exportedAt] = today();
      r[idx.status] = 'learning';
    } catch (e) { err++; console.log(`✗ ${e.message}`); }
  }

  if (!dryRun) {
    const out = [header.join('|'), ...rows.map(r => r.join('|'))].join('\n') + '\n';
    fs.writeFileSync(csvPath, out, 'utf8');
  }
  console.log(`\n═══ added: ${added}  already: ${dup}  errors: ${err} ═══`);
  if (added) console.log(`Audio: node audio-sync.js sync ${deckId}`);
}

main().catch(e => { console.error(e); process.exit(1); });
