```dataviewjs
// ─── CONFIG ──────────────────────────────────────────────────────────────────
const ANKI_URL   = 'http://localhost:8765';
const ANKI_MODEL = 'Простая';
const KNOWN_INTERVAL_DAYS = 7;
const FOLDER     = dv.current().file.folder;

const DECKS = [
  { id: 'idioms',       name: 'EG — Idioms',              file: 'idioms-tracker.csv',              label: 'Idioms',              fields: ['idiom','translation','exportedAt','status','knownAt','s1','s2','s3'], frontKey: 'idiom', backKey: 'translation', tagPrefix: 'idiom' },
  { id: 'collocations', name: 'EG — Collocations',         file: 'collocations-tracker.csv',         label: 'Collocations',        fields: ['collocation','translation','exportedAt','status','knownAt','s1','s2','s3'], frontKey: 'collocation', backKey: 'translation', tagPrefix: 'coll' },
  { id: 'prep',         name: 'EG — Prepositional Phrases', file: 'prepositional-phrases-tracker.csv', label: 'Prep. Phrases',       fields: ['phrase','translation','exportedAt','status','knownAt','s1','s2','s3'], frontKey: 'phrase', backKey: 'translation', tagPrefix: 'prep' },
  { id: 'linking',      name: 'EG — Linking Words',         file: 'linking-words-tracker.csv',         label: 'Linking Words',       fields: ['word','translation','category','exportedAt','status','knownAt','s1','s2','s3'], frontKey: 'word', backKey: 'translation', tagPrefix: 'lw', extraFields: ['category'] },
  { id: 'confusing',    name: 'EG — Confusing Words',       file: 'confusing-words-tracker.csv',       label: 'Confusing Pairs',     fields: ['pair','word_a','meaning_a','word_b','meaning_b','exportedAt','status','knownAt','s1','s2','s3'], frontKey: 'pair', backKey: null, tagPrefix: 'cw', custom: true },
  { id: 'irregular',    name: 'EG — Irregular Verbs',       file: 'irregular-verbs-tracker.csv',       label: 'Irregular Verbs',     fields: ['verb','v2','v3','translation','exportedAt','status','knownAt','s1','s2','s3'], frontKey: 'verb', backKey: null, tagPrefix: 'iv', custom: true },
  { id: 'false',        name: 'EG — False Friends',         file: 'false-friends-tracker.csv',         label: 'False Friends',       fields: ['english_word','false_meaning','real_meaning','russian_word','exportedAt','status','knownAt','s1','s2','s3'], frontKey: 'english_word', backKey: null, tagPrefix: 'ff', custom: true },
  { id: 'phrasal_n',    name: 'EG — Phrasal Nouns',         file: 'phrasal-nouns-tracker.csv',         label: 'Phrasal Nouns',       fields: ['word','base_verb','translation','exportedAt','status','knownAt','s1','s2','s3'], frontKey: 'word', backKey: 'translation', tagPrefix: 'pn', extraFields: ['base_verb'] },
  { id: 'phrasal_v',    name: 'EG — Phrasal Verbs', file: 'phrasal-verbs-tracker.csv',  label: 'Phrasal Verbs',       fields: ['phrasal_verb','translation','exportedAt','status','knownAt','s1','s2','s3'], frontKey: 'phrasal_verb', backKey: 'translation', tagPrefix: 'pv' },
  { id: 'true',         name: 'EG — True Friends',  file: 'true-friends-tracker.csv',   label: 'True Friends',        fields: ['english_word','russian_word','exportedAt','status','knownAt','s1','s2','s3','family'], frontKey: 'english_word', backKey: 'russian_word', tagPrefix: 'tf' },
  { id: 'depprep',      name: 'EG — Dependent Prepositions', file: 'dependent-prepositions-tracker.csv', label: 'Dep. Prepositions', fields: ['phrase','type','translation','exportedAt','status','knownAt','s1','s2','s3'], frontKey: 'phrase', backKey: 'translation', tagPrefix: 'dp', extraFields: ['type'] },
  { id: 'egw',          name: 'EG — All Words',              file: 'learn-5000-english-words/word-tracker.csv', label: 'All Words', fields: ['word','translation','filename','exportedAt','status','knownAt','s1','s2','s3'], frontKey: 'word', backKey: 'translation', tagPrefix: 'egw', absPath: true },
  { id: 'vp',           name: 'EG — Verb Patterns',          file: 'verb-patterns-tracker.csv', label: 'Verb Patterns', fields: ['verb','ipa','pattern','hint','translation','exportedAt','status','knownAt','s1','s2','s3'], frontKey: 'verb', backKey: 'translation', tagPrefix: 'vp', extraFields: ['pattern'] },
  { id: 'syn',          name: 'EG — Synonym Chains',         file: 'synonym-chains-tracker.csv', label: 'Synonyms', fields: ['group','description','exportedAt','status','knownAt','s1','s2','s3'], frontKey: 'group', backKey: 'description', tagPrefix: 'syn' },
];

// ─── ANKI ────────────────────────────────────────────────────────────────────
const { requestUrl } = require('obsidian');
async function ankiReq(action, params = {}) {
  const res = await requestUrl({ url: ANKI_URL, method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, version: 6, params }) });
  const { result, error } = res.json;
  if (error) throw new Error(`AnkiConnect [${action}]: ${error}`);
  return result;
}

function toTag(prefix, word) {
  return prefix + '_' + word.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g,'_').replace(/^_|_$/g,'');
}

// ─── CSV ─────────────────────────────────────────────────────────────────────
function parseCSV(text, fields) {
  const lines = text.trim().split('\n').filter(l => l.trim());
  const tracker = {};
  for (let i = 1; i < lines.length; i++) {
    const p = lines[i].split('|');
    const key = p[0]?.trim();
    if (!key) continue;
    const entry = {};
    for (let j = 1; j < fields.length; j++) {
      entry[fields[j]] = (p[j] || '').trim().replace(/\\n/g, '\n');
    }
    tracker[key] = entry;
  }
  return tracker;
}

function toCSVStr(tracker, fields) {
  const rows = [fields.join('|')];
  for (const [key, d] of Object.entries(tracker)) {
    const vals = [key];
    for (let j = 1; j < fields.length; j++) {
      vals.push((d[fields[j]] || '').replace(/\r/g,'').replace(/\n/g,'\\n').replace(/\|/g,' '));
    }
    rows.push(vals.join('|'));
  }
  return rows.join('\n');
}

function trackerPath(deck) {
  return deck.absPath ? deck.file : FOLDER + '/' + deck.file;
}

async function loadTracker(deck) {
  const file = app.vault.getAbstractFileByPath(trackerPath(deck));
  if (!file) return {};
  try { return parseCSV(await app.vault.read(file), deck.fields); } catch { return {}; }
}

async function saveTracker(deck, tracker) {
  const content = toCSVStr(tracker, deck.fields);
  const path = trackerPath(deck);
  const file = app.vault.getAbstractFileByPath(path);
  if (file) await app.vault.modify(file, content);
  else await app.vault.create(path, content);
}

// ─── CARD BUILDERS ───────────────────────────────────────────────────────────
function buildCard(deck, key, data) {
  const bold = s => (s || '').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  const sentences = [data.s1, data.s2, data.s3].filter(s => s);
  const sentHtml = sentences.length > 0 ? `<ol>${sentences.map(s => `<li>${bold(s)}</li>`).join('')}</ol>` : '';

  // IPA & Family blocks (used by all card types if data is present)
  const ipaHtml = data.ipa ? `<div style="color:#888;font-size:0.85em;margin-bottom:0.5em;font-family:monospace">${data.ipa}</div>` : '';
  const familyHtml = data.family ? `<div style="margin-top:0.6em;padding-top:0.5em;border-top:1px solid #444;font-size:0.9em;color:#aaa">Word family: ${data.family.replace(/(\w[\w\s-]*?) \(/g, '<b>$1</b> (')}</div>` : '';

  let front, back;

  if (deck.id === 'confusing') {
    front = `<div style="font-size:1.3em;font-weight:bold;margin-bottom:0.5em">${key}</div>${ipaHtml}${sentHtml}`;
    back = `<div style="font-size:1.1em"><b>${data.word_a}</b> — ${data.meaning_a}<br><b>${data.word_b}</b> — ${data.meaning_b}</div>${familyHtml}`;
  } else if (deck.id === 'irregular') {
    front = `<div style="font-size:1.4em;font-weight:bold;margin-bottom:0.4em">${key}</div>${ipaHtml}<div style="color:#888;margin-bottom:0.8em">${data.translation}</div>${sentHtml}`;
    back = `<div style="font-size:1.3em"><b>V2:</b> ${data.v2}<br><b>V3:</b> ${data.v3}</div>${familyHtml}`;
  } else if (deck.id === 'false') {
    front = `<div style="font-size:1.4em;font-weight:bold;margin-bottom:0.4em">${key}</div>${ipaHtml}<div style="color:#f0ad4e;margin-bottom:0.5em;font-size:0.9em">Похоже на «${data.false_meaning}»</div>${sentHtml}`;
    back = `<div style="font-size:1.2em">${data.real_meaning}</div><div style="color:#888;margin-top:0.3em;font-size:0.9em">${data.russian_word}</div>${familyHtml}`;
  } else if (deck.id === 'vp') {
    const pattern = data.pattern || '';
    const sentencesFront = sentences.map(s => s.replace(/\*\*([^*]+?)\*\*/g, (m, inner) => {
      const words = inner.trim().split(/\s+/);
      return `<b>${words[0]}</b> <span style="color:#5cb85c;font-weight:bold">___</span>`;
    }));
    const sentencesBack = sentences.map(s => s.replace(/\*\*(.+?)\*\*/g, '<b style="color:#5cb85c">$1</b>'));
    const hint = data.hint || pattern;
    front = `<div style="font-size:1.6em;font-weight:bold;margin-bottom:0.4em">${key}</div>${ipaHtml}` +
      `<div style="color:#888;font-size:0.9em;margin-bottom:0.8em;font-style:italic">какой паттерн следует?</div>` +
      `<ol style="line-height:1.8">${sentencesFront.map(s => `<li>${s}</li>`).join('')}</ol>`;
    back = `<div style="font-size:1.6em;font-weight:bold;color:#5cb85c;margin-bottom:0.3em">+ ${pattern}</div>` +
      `<div style="color:#888;font-size:0.9em;margin-bottom:0.8em">${hint}</div>` +
      `<ol style="line-height:1.8">${sentencesBack.map(s => `<li>${s}</li>`).join('')}</ol>` +
      `<div style="margin-top:0.8em;color:#666;font-size:1.05em">${data.translation}</div>${familyHtml}`;
  } else if (deck.id === 'depprep') {
    const phrase = key;
    const words = phrase.split(/\s+/);
    const prep = words[words.length - 1];
    const type = data.type || '';
    const sentencesFront = sentences.map(s => s.replace(/\*\*([^*]+?)\*\*/g, (m, inner) => {
      const sw = inner.trim().split(/\s+/);
      return `<b>${sw.slice(0, sw.length - 1).join(' ')}</b> <span style="color:#5cb85c;font-weight:bold">___</span>`;
    }));
    const sentencesBack = sentences.map(s => s.replace(/\*\*(.+?)\*\*/g, '<b style="color:#5cb85c">$1</b>'));
    front = `<div style="font-size:1.6em;font-weight:bold;margin-bottom:0.4em">${words.slice(0, -1).join(' ')} <span style="color:#5cb85c">___</span></div>${ipaHtml}` +
      `<div style="color:#888;font-size:0.9em;margin-bottom:0.8em">${type} — ${data.translation}</div>` +
      `<ol style="line-height:1.8">${sentencesFront.map(s => `<li>${s}</li>`).join('')}</ol>`;
    back = `<div style="font-size:2em;font-weight:bold;color:#5cb85c;margin-bottom:0.3em">${prep}</div>` +
      `<div style="color:#888;font-size:1em;margin-bottom:0.6em">${phrase}</div>` +
      `<ol style="line-height:1.8">${sentencesBack.map(s => `<li>${s}</li>`).join('')}</ol>${familyHtml}`;
  } else {
    const extra = deck.extraFields ? deck.extraFields.map(f => data[f] ? `<div style="color:#888;font-size:0.9em;margin-bottom:0.5em">${data[f]}</div>` : '').join('') : '';
    front = `<div style="font-size:1.4em;font-weight:bold;margin-bottom:0.4em">${key}</div>${ipaHtml}${extra}${sentHtml}`;
    back = `<div style="font-size:1.2em">${data[deck.backKey]}</div>${familyHtml}`;
  }

  return { front, back };
}

// ─── EXPORT ──────────────────────────────────────────────────────────────────
async function runExport(deck, log) {
  const tracker = await loadTracker(deck);
  const toExport = Object.entries(tracker).filter(([, d]) => !d.exportedAt);
  log(`Всего: <b>${Object.keys(tracker).length}</b> | Для экспорта: <b>${toExport.length}</b>`);

  if (toExport.length === 0) { log('Все уже в Anki.'); return tracker; }

  try { await ankiReq('version'); } catch { log('<span style="color:#d9534f">Anki не запущен!</span>'); return null; }

  const decks = await ankiReq('deckNames');
  if (!decks.includes(deck.name)) { await ankiReq('createDeck', { deck: deck.name }); log(`Создана колода "${deck.name}"`); }

  let exported = 0;
  for (const [key, data] of toExport) {
    try {
      const { front, back } = buildCard(deck, key, data);
      await ankiReq('addNote', {
        note: { deckName: deck.name, modelName: ANKI_MODEL, fields: { Front: front, Back: back }, tags: [deck.id, toTag(deck.tagPrefix, key)], options: { allowDuplicate: false } }
      });
      tracker[key].exportedAt = new Date().toISOString().split('T')[0];
      tracker[key].status = 'learning';
      exported++;
      if (exported % 20 === 0) { await saveTracker(deck, tracker); log(`  ${exported} / ${toExport.length}...`); }
    } catch (e) {
      if (e.message.includes('duplicate')) { tracker[key].exportedAt = new Date().toISOString().split('T')[0]; tracker[key].status = 'learning'; exported++; }
      else log(`  <span style="color:#d9534f">"${key}": ${e.message}</span>`);
    }
  }

  await saveTracker(deck, tracker);
  log(`<b>Экспорт завершён!</b> Добавлено: ${exported}`);
  return tracker;
}

// ─── RESTORE RED IN LESSON (for EGW deck) ──────────────────────────────────
const EGW_TARGET_COLOR = '#c0504d';
const EGW_LESSON_FOLDER = 'learn-5000-english-words';
function escRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
async function restoreRedInLesson(filename, word, translation) {
  const fname = filename + (filename.endsWith('.md') ? '' : '.md');
  const filePath = EGW_LESSON_FOLDER + '/' + fname;
  const file = app.vault.getAbstractFileByPath(filePath);
  if (!file) return false;
  const content = await app.vault.read(file);
  const escWord = escRegex(word), escTrans = escRegex(translation);
  const pattern = new RegExp(`(^|[^>])${escWord}\\s*-\\s*${escTrans}`, 'g');
  const replacement = `$1<font color="${EGW_TARGET_COLOR}">${word} - ${translation}</font>`;
  const updated = content.replace(pattern, replacement);
  if (updated === content) return false;
  await app.vault.modify(file, updated);
  return true;
}

// ─── SYNC ────────────────────────────────────────────────────────────────────
async function runSync(deck, log) {
  const tracker = await loadTracker(deck);

  try { await ankiReq('version'); } catch { log('<span style="color:#d9534f">Anki не запущен!</span>'); return null; }

  const exported = Object.entries(tracker).filter(([, d]) => d.exportedAt);
  log(`Проверяю ${exported.length} записей...`);

  let knownCount = 0, returnedCount = 0;

  for (const [key, data] of exported) {
    try {
      const tag = toTag(deck.tagPrefix, key);

      // Find ALL notes for this word (basic + cloze + special)
      const noteIds = await ankiReq('findNotes', { query: `deck:"${deck.name}" tag:${tag}` });
      if (!noteIds.length) continue;

      // Get all cards, filter out suspended (frozen)
      let allCards = [];
      for (const nid of noteIds) {
        const cards = await ankiReq('findCards', { query: `nid:${nid}` });
        allCards = allCards.concat(cards);
      }
      if (!allCards.length) continue;

      const infos = await ankiReq('cardsInfo', { cards: allCards });
      const activeCards = infos.filter(c => c.queue !== -1); // queue -1 = suspended
      if (!activeCards.length) continue;

      const allActiveKnown = activeCards.every(c => c.interval >= KNOWN_INTERVAL_DAYS);

      if (allActiveKnown && data.status !== 'known') {
        tracker[key].status = 'known';
        tracker[key].knownAt = new Date().toISOString().split('T')[0];
        knownCount++;
      } else if (!allActiveKnown && data.status === 'known') {
        tracker[key].status = 'learning';
        tracker[key].knownAt = '';
        returnedCount++;
        const minInterval = Math.min(...activeCards.map(c => c.interval));
        log(`  <span style="color:#f0ad4e">"${key}" — забыто (интервал ${minInterval}d), вернулось в learning</span>`);
        // For EGW deck — restore red mark in lesson file
        if (deck.id === 'egw' && data.filename) {
          await restoreRedInLesson(data.filename, key, data.translation);
        }
      }
    } catch { /* skip */ }
  }

  await saveTracker(deck, tracker);
  const stats = Object.values(tracker).reduce((a, d) => { a[d.status || 'new'] = (a[d.status || 'new']||0)+1; return a; }, {});
  log(`<b>Sync!</b> Выучено: +${knownCount} | Вернулось: ${returnedCount}`);
  log(`new=${stats.new||stats['']||0} | learning=${stats.learning||0} | known=${stats.known||0}`);
  return tracker;
}

// ─── RENDER TABLE ────────────────────────────────────────────────────────────
function renderTable(container, tracker, deck) {
  container.innerHTML = '';
  const entries = Object.entries(tracker);
  if (entries.length === 0) { container.createEl('p', { text: 'Пусто.', attr: { style: 'color:var(--text-muted)' } }); return; }

  const stats = entries.reduce((a, [, d]) => { a[d.status || 'new'] = (a[d.status || 'new']||0)+1; return a; }, {});
  const total = entries.length, known = stats.known || 0, learning = stats.learning || 0;
  const notExp = (stats[''] || 0) + (stats.new || 0);
  const pct = total > 0 ? Math.round(known / total * 100) : 0;

  const sd = container.createEl('div', { attr: { style: 'margin-bottom:12px' } });
  sd.innerHTML =
    `<div style="display:flex;gap:16px;font-size:0.9em;margin-bottom:6px">` +
    `<span>Всего: <b>${total}</b></span>` +
    `<span style="color:#5cb85c">Выучено: <b>${known}</b></span>` +
    `<span style="color:#f0ad4e">Учу: <b>${learning}</b></span>` +
    `<span style="color:var(--text-muted)">Новое: <b>${notExp}</b></span>` +
    `</div>` +
    `<div style="width:100%;height:8px;background:var(--background-modifier-border);border-radius:4px;overflow:hidden">` +
    `<div style="width:${pct}%;height:100%;background:#5cb85c;transition:width 0.3s"></div></div>` +
    `<div style="font-size:0.8em;color:var(--text-muted);margin-top:2px">${pct}% выучено</div>`;

  const order = { learning: 0, '': 1, new: 1, known: 2 };
  entries.sort(([, a], [, b]) => (order[a.status || ''] ?? 1) - (order[b.status || ''] ?? 1));

  const table = container.createEl('table', { attr: { style: 'width:100%;border-collapse:collapse' } });
  const hr = table.createEl('thead').createEl('tr');
  const firstField = deck.fields[0].charAt(0).toUpperCase() + deck.fields[0].slice(1);
  [firstField, 'Статус', 'Добавлено', 'Выучено'].forEach(h =>
    hr.createEl('th', { text: h, attr: { style: 'text-align:left;padding:4px 10px;border-bottom:1px solid var(--background-modifier-border)' } })
  );
  const tbody = table.createEl('tbody');
  for (const [key, d] of entries) {
    const tr = tbody.createEl('tr');
    tr.createEl('td', { text: key, attr: { style: 'padding:3px 10px;font-weight:bold' } });
    const st = d.status || 'new';
    const label = st === 'known' ? 'Выучено' : st === 'learning' ? 'Учу' : 'Новое';
    const color = st === 'known' ? '#5cb85c' : st === 'learning' ? '#f0ad4e' : 'var(--text-muted)';
    tr.createEl('td', { text: label, attr: { style: `padding:3px 10px;color:${color}` } });
    tr.createEl('td', { text: d.exportedAt || '—', attr: { style: 'padding:3px 10px;color:var(--text-muted);font-size:0.9em' } });
    tr.createEl('td', { text: d.knownAt || '—', attr: { style: 'padding:3px 10px;color:var(--text-muted);font-size:0.9em' } });
  }
}

// ─── AUDIO SYNC ─────────────────────────────────────────────────────────────
const AUDIO_FOLDER = FOLDER + '/audio';

function audioFilename(deck, key) {
  const slug = key.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  return `eg_${slug}.mp3`;
}

function ttsText(deck, key) {
  if (deck.id === 'confusing') return key.split('/').map(s => s.trim()).join('. . . ');
  return key;
}

function arrayBufToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

async function runAudioSync(deck, log, force = false) {
  const tracker = await loadTracker(deck);
  const entries = Object.entries(tracker).filter(([, d]) => d.exportedAt);
  log(`Аудио-синк для <b>${deck.name}</b> (${entries.length} записей, ${force ? 'force' : 'sync'})`);

  try { await ankiReq('version'); } catch { log('<span style="color:#d9534f">Anki не запущен!</span>'); return; }

  // Ensure audio folder exists
  if (!app.vault.getAbstractFileByPath(AUDIO_FOLDER)) {
    await app.vault.createFolder(AUDIO_FOLDER);
  }

  let ok = 0, skip = 0, err = 0;

  for (let i = 0; i < entries.length; i++) {
    const [key, data] = entries[i];
    const fname = audioFilename(deck, key);
    const fpath = AUDIO_FOLDER + '/' + fname;
    const existing = app.vault.getAbstractFileByPath(fpath);

    // Skip if cached and not force
    if (existing && !force) {
      const tag = toTag(deck.tagPrefix, key);
      const noteIds = await ankiReq('findNotes', { query: `deck:"${deck.name}" tag:${tag}` });
      if (noteIds.length > 0) {
        const info = await ankiReq('notesInfo', { notes: [noteIds[0]] });
        if (info[0].fields.Front.value.includes(`[sound:${fname}]`)) { skip++; continue; }
      }
    }

    log(`  [${i + 1}/${entries.length}] "<b>${key}</b>" — ${existing && !force ? 'cached' : 'downloading'}...`);

    try {
      // Download or read cached
      let audioData;
      if (existing && !force) {
        audioData = await app.vault.readBinary(existing);
      } else {
        const text = ttsText(deck, key);
        const res = await requestUrl({
          url: `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(text)}`,
          method: 'GET'
        });
        audioData = res.arrayBuffer;
        if (audioData.byteLength < 100) throw new Error('empty response');
        // Save locally
        if (existing) await app.vault.modifyBinary(existing, audioData);
        else await app.vault.createBinary(fpath, audioData);
      }

      // Upload to Anki
      const base64 = arrayBufToBase64(audioData);
      await ankiReq('storeMediaFile', { filename: fname, data: base64 });

      // Update card
      const tag = toTag(deck.tagPrefix, key);
      const noteIds = await ankiReq('findNotes', { query: `deck:"${deck.name}" tag:${tag}` });
      if (noteIds.length === 0) { skip++; continue; }

      const info = await ankiReq('notesInfo', { notes: [noteIds[0]] });
      const cleanFront = info[0].fields.Front.value.replace(/\[sound:[^\]]+\]/g, '').trim();
      await ankiReq('updateNoteFields', {
        note: { id: noteIds[0], fields: { Front: cleanFront + `\n[sound:${fname}]` } }
      });

      ok++;
      log(`  <span style="color:#5cb85c">"${key}" ✓</span>`);
    } catch (e) {
      err++;
      log(`  <span style="color:#d9534f">"${key}" ✗ ${e.message}</span>`);
    }
  }

  log(`<br><b>Аудио готово!</b> Добавлено: ${ok} | Пропущено: ${skip} | Ошибок: ${err}`);
}

// ─── UI ──────────────────────────────────────────────────────────────────────
const wrap = dv.el('div', '');

// Deck selector tabs
const tabRow = wrap.createEl('div', { attr: { style: 'display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px' } });
const tabs = DECKS.map(deck => {
  const btn = tabRow.createEl('button', {
    text: deck.label,
    attr: { style: 'padding:5px 14px;font-size:0.88em;cursor:pointer;background:var(--background-secondary);color:var(--text-normal);border:1px solid var(--background-modifier-border);border-radius:5px' }
  });
  return { btn, deck };
});

const btnRow = wrap.createEl('div', { attr: { style: 'display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px' } });
const bs = 'padding:7px 16px;font-size:0.9em;cursor:pointer;color:#fff;border:none;border-radius:6px;font-weight:bold';
const exportBtn = btnRow.createEl('button', { text: 'Export', attr: { style: bs + ';background:#4caf50' } });
const syncBtn = btnRow.createEl('button', { text: 'Sync', attr: { style: bs + ';background:#2196f3' } });
const syncAllBtn = btnRow.createEl('button', { text: 'Sync All', attr: { style: bs + ';background:#673ab7' } });
const audioBtn = btnRow.createEl('button', { text: 'Audio Sync', attr: { style: bs + ';background:#ff9800' } });
const guidesBtn = btnRow.createEl('button', { text: 'Sync Guides', attr: { style: bs + ';background:#795548' } });
const stylesBtn = btnRow.createEl('button', { text: 'Apply Styles', attr: { style: bs + ';background:#9c27b0' } });

// ─── Global progress bar ─────────────────────────────────────────────────────
const progressDiv = wrap.createEl('div', { attr: { style: 'margin-bottom:12px' } });

async function renderProgress() {
  progressDiv.innerHTML = '';
  let totalWords = 0, totalKnown = 0, totalLearning = 0;
  for (const deck of DECKS) {
    const tracker = await loadTracker(deck);
    const entries = Object.values(tracker);
    totalWords += entries.length;
    totalKnown += entries.filter(d => d.status === 'known').length;
    totalLearning += entries.filter(d => d.status === 'learning').length;
  }
  const pct = totalWords > 0 ? Math.round(totalKnown / totalWords * 100) : 0;
  const lPct = totalWords > 0 ? Math.round(totalLearning / totalWords * 100) : 0;
  progressDiv.innerHTML =
    `<div style="display:flex;gap:16px;font-size:0.88em;margin-bottom:4px">` +
    `<span>Всего: <b>${totalWords}</b></span>` +
    `<span style="color:#5cb85c">Выучено: <b>${totalKnown}</b> (${pct}%)</span>` +
    `<span style="color:#f0ad4e">Учу: <b>${totalLearning}</b> (${lPct}%)</span></div>` +
    `<div style="width:100%;height:8px;background:var(--background-modifier-border);border-radius:4px;overflow:hidden">` +
    `<div style="width:${pct + lPct}%;height:100%;background:linear-gradient(to right, #5cb85c ${pct}%, #f0ad4e ${pct}%);border-radius:4px"></div></div>`;
}
await renderProgress();

// ─── Card types panel ────────────────────────────────────────────────────────
const cardTypesDiv = wrap.createEl('div', { attr: { style: 'background:var(--background-secondary);padding:10px 14px;border-radius:6px;margin-bottom:12px;font-size:0.88em' } });

async function renderCardTypes(deck) {
  cardTypesDiv.innerHTML = '';
  try { await ankiReq('version'); } catch { cardTypesDiv.innerHTML = '<span style="color:var(--text-muted)">Anki не запущен</span>'; return; }

  const types = [
    { label: 'Basic', model: 'Простая' },
    { label: 'Cloze', model: 'Задание с пропусками' },
  ];

  const header = cardTypesDiv.createEl('div', { attr: { style: 'font-weight:bold;margin-bottom:6px;color:var(--text-normal)' } });
  header.textContent = 'Типы карточек';

  for (const type of types) {
    const allCards = await ankiReq('findCards', { query: `deck:"${deck.name}" note:"${type.model}"` });
    if (allCards.length === 0) continue;

    const suspended = await ankiReq('findCards', { query: `deck:"${deck.name}" note:"${type.model}" is:suspended` });
    const active = allCards.length - suspended.length;
    const isFrozen = suspended.length === allCards.length;

    const row = cardTypesDiv.createEl('div', { attr: { style: 'display:flex;align-items:center;gap:8px;margin:4px 0' } });

    const cb = row.createEl('input', { attr: { type: 'checkbox' } });
    cb.checked = !isFrozen;

    const label = row.createEl('span', { attr: { style: 'color:var(--text-normal)' } });
    label.textContent = `${type.label} (${allCards.length})`;

    const status = row.createEl('span', { attr: { style: 'font-size:0.85em;color:var(--text-muted)' } });
    status.textContent = isFrozen ? 'frozen' : `${active} active`;

    cb.addEventListener('change', async () => {
      cb.disabled = true;
      status.textContent = '...';
      if (cb.checked) {
        await ankiReq('unsuspend', { cards: allCards });
        status.textContent = `${allCards.length} active`;
        status.style.color = '#5cb85c';
      } else {
        await ankiReq('suspend', { cards: allCards });
        status.textContent = 'frozen';
        status.style.color = 'var(--text-muted)';
      }
      cb.disabled = false;
    });
  }
}

// ─── Guide panel ─────────────────────────────────────────────────────────────
const guideHeader = wrap.createEl('div', { attr: { style: 'display:flex;align-items:center;gap:8px;margin-bottom:8px;cursor:pointer;user-select:none' } });
const guideToggle = guideHeader.createEl('span', { text: '▶ Гайд по колоде', attr: { style: 'font-weight:bold;color:var(--text-normal)' } });
const guideDiv = wrap.createEl('div', { attr: { style: 'background:var(--background-secondary);padding:12px 16px;border-radius:6px;margin-bottom:12px;font-size:0.9em;line-height:1.6;border-left:3px solid var(--interactive-accent);display:none' } });
let guideOpen = false;

guideHeader.addEventListener('click', () => {
  guideOpen = !guideOpen;
  guideDiv.style.display = guideOpen ? 'block' : 'none';
  guideToggle.textContent = guideOpen ? '▼ Гайд по колоде' : '▶ Гайд по колоде';
});

let guidesCache = null;
async function loadGuides() {
  if (guidesCache) return guidesCache;
  const file = app.vault.getAbstractFileByPath(FOLDER + '/deck-guides.csv');
  if (!file) return {};
  const text = await app.vault.read(file);
  const lines = text.trim().split('\n').filter(l => l.trim());
  const guides = {};
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('|');
    const id = cols[0]?.trim();
    const title = cols[1]?.trim();
    const content = (cols.slice(2).join('|') || '').replace(/\\n/g, '\n');
    if (id) guides[id] = { title, content };
  }
  guidesCache = guides;
  return guides;
}

function renderMarkdown(md) {
  return md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/^•\s/gm, '&nbsp;&nbsp;•&nbsp;')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
}

async function renderGuide(deck) {
  const guides = await loadGuides();
  const guide = guides[deck.id];
  if (!guide) {
    guideDiv.innerHTML = '<span style="color:var(--text-muted)">Гайд для этой колоды пока не написан.</span>';
    return;
  }
  guideDiv.innerHTML = `<div style="font-weight:bold;font-size:1.05em;margin-bottom:8px">${guide.title}</div>${renderMarkdown(guide.content)}`;
}

async function loadCardStyles() {
  const file = app.vault.getAbstractFileByPath(FOLDER + '/card-styles.csv');
  if (!file) return {};
  const text = await app.vault.read(file);
  const lines = text.trim().split('\n').filter(l => l.trim());
  const styles = {};
  for (let i = 1; i < lines.length; i++) {
    const [id, bg, accent, icon, desc] = lines[i].split('|').map(s => s.trim());
    if (id) styles[id] = { bg, accent, icon, desc };
  }
  return styles;
}

async function runApplyStyles(log) {
  const styles = await loadCardStyles();
  log(`Загружено стилей: <b>${Object.keys(styles).length}</b>`);

  try { await ankiReq('version'); } catch { log('<span style="color:#d9534f">Anki не запущен!</span>'); return; }

  let totalUpdated = 0;
  for (const deck of DECKS) {
    const style = styles[deck.id];
    if (!style) { log(`  ${deck.label}: стиль не задан, пропуск`); continue; }

    const noteIds = await ankiReq('findNotes', { query: `deck:"${deck.name}" -tag:guide` });
    if (noteIds.length === 0) continue;

    let updated = 0;
    // Process in batches of 100
    for (let batchStart = 0; batchStart < noteIds.length; batchStart += 100) {
      const batch = noteIds.slice(batchStart, batchStart + 100);
      const infos = await ankiReq('notesInfo', { notes: batch });

      for (const note of infos) {
        const fields = {};
        let changed = false;
        for (const [fieldName, fieldData] of Object.entries(note.fields)) {
          let val = fieldData.value;
          // Strip existing wrapper if present
          val = val.replace(/^<div class="eg-card eg-deck-[^"]+"[^>]*>([\s\S]*)<\/div>\s*$/, '$1');
          // Wrap with new style
          const wrapper = `<div class="eg-card eg-deck-${deck.id}" style="background:${style.bg};border-left:4px solid ${style.accent};padding:14px 16px;border-radius:8px;color:#1a1a1a">`;
          fields[fieldName] = wrapper + val + '</div>';
          changed = true;
        }
        if (changed) {
          try {
            await ankiReq('updateNoteFields', { note: { id: note.noteId, fields } });
            updated++;
          } catch {}
        }
      }
    }
    log(`  <span style="color:#5cb85c">${deck.label} ${style.icon} — ${updated} карточек</span>`);
    totalUpdated += updated;
  }

  log(`<br><b>Готово!</b> Стилизовано: ${totalUpdated} карточек`);
}

async function runGuidesSync(log) {
  const guides = await loadGuides();
  log(`Загружено гайдов: <b>${Object.keys(guides).length}</b>`);

  try { await ankiReq('version'); } catch { log('<span style="color:#d9534f">Anki не запущен!</span>'); return; }

  let created = 0, updated = 0, skipped = 0;

  for (const deck of DECKS) {
    const guide = guides[deck.id];
    if (!guide) { skipped++; continue; }

    const front = `<div style="background:#673ab7;color:#fff;padding:6px 12px;border-radius:4px;display:inline-block;font-size:0.85em;margin-bottom:0.8em">📚 GUIDE</div>` +
      `<div style="font-size:1.2em;font-weight:bold;margin-bottom:0.5em">${guide.title}</div>` +
      `<div style="color:#888;font-size:0.85em">Click "Show Answer" to read the guide</div>`;
    const back = `<div style="font-size:0.95em;line-height:1.7;text-align:left">${renderMarkdown(guide.content)}</div>`;

    const tag = `guide_${deck.id}`;
    const existing = await ankiReq('findNotes', { query: `deck:"${deck.name}" tag:guide tag:${tag}` });

    try {
      if (existing.length > 0) {
        await ankiReq('updateNoteFields', { note: { id: existing[0], fields: { Front: front, Back: back } } });
        updated++;
        log(`  <span style="color:#5cb85c">${deck.label} ✓ (обновлён)</span>`);
      } else {
        const noteId = await ankiReq('addNote', {
          note: {
            deckName: deck.name, modelName: ANKI_MODEL,
            fields: { Front: front, Back: back },
            tags: ['guide', tag],
            options: { allowDuplicate: false }
          }
        });
        // Suspend it so it doesn't appear in regular study
        const cards = await ankiReq('findCards', { query: `nid:${noteId}` });
        if (cards.length > 0) await ankiReq('suspend', { cards });
        created++;
        log(`  <span style="color:#5cb85c">${deck.label} ✓ (создан)</span>`);
      }
    } catch (e) {
      log(`  <span style="color:#d9534f">${deck.label} ✗ ${e.message}</span>`);
    }
  }

  log(`<br><b>Готово!</b> Создано: ${created} | Обновлено: ${updated} | Пропущено: ${skipped}`);
}

const logDiv = wrap.createEl('div', { attr: { style: 'font-family:monospace;font-size:0.82em;background:var(--background-secondary);padding:10px 14px;border-radius:6px;max-height:260px;overflow-y:auto;display:none;line-height:1.7;margin-bottom:16px' } });
const tableDiv = wrap.createEl('div', '');

let activeDeck = DECKS[0];
let currentTracker = {};

async function selectDeck(deck) {
  activeDeck = deck;
  tabs.forEach(t => {
    const isActive = t.deck.id === deck.id;
    t.btn.style.background = isActive ? 'var(--interactive-accent)' : 'var(--background-secondary)';
    t.btn.style.color = isActive ? '#fff' : 'var(--text-normal)';
    t.btn.style.fontWeight = isActive ? 'bold' : 'normal';
  });
  currentTracker = await loadTracker(deck);
  renderTable(tableDiv, currentTracker, deck);
  await renderCardTypes(deck);
  await renderGuide(deck);
  logDiv.style.display = 'none';
}

tabs.forEach(t => t.btn.addEventListener('click', () => selectDeck(t.deck)));

function showLog() {
  logDiv.style.display = 'block';
  logDiv.innerHTML = '';
  return (msg) => { logDiv.innerHTML += msg + '<br>'; logDiv.scrollTop = logDiv.scrollHeight; };
}

function disableAll() { exportBtn.disabled = syncBtn.disabled = syncAllBtn.disabled = audioBtn.disabled = guidesBtn.disabled = stylesBtn.disabled = true; }
function enableAll()  { exportBtn.disabled = syncBtn.disabled = syncAllBtn.disabled = audioBtn.disabled = guidesBtn.disabled = stylesBtn.disabled = false; }

exportBtn.addEventListener('click', async () => {
  disableAll();
  exportBtn.textContent = '...';
  const log = showLog();
  log(`Колода: <b>${activeDeck.name}</b>`);
  try {
    const updated = await runExport(activeDeck, log);
    if (updated) { currentTracker = updated; renderTable(tableDiv, currentTracker, activeDeck); }
  } catch (e) { log(`<span style="color:#d9534f">Fatal: ${e.message}</span>`); }
  enableAll(); exportBtn.textContent = 'Export';
});

syncBtn.addEventListener('click', async () => {
  disableAll();
  syncBtn.textContent = '...';
  const log = showLog();
  log(`Колода: <b>${activeDeck.name}</b>`);
  try {
    const updated = await runSync(activeDeck, log);
    if (updated) { currentTracker = updated; renderTable(tableDiv, currentTracker, activeDeck); }
    await renderProgress();
  } catch (e) { log(`<span style="color:#d9534f">Fatal: ${e.message}</span>`); }
  enableAll(); syncBtn.textContent = 'Sync';
});

syncAllBtn.addEventListener('click', async () => {
  disableAll();
  syncAllBtn.textContent = '...';
  const log = showLog();
  log('<b>Sync All — все колоды</b>');
  try {
    await ankiReq('version');
    for (const deck of DECKS) {
      log(`<br><b>${deck.label}</b>`);
      await runSync(deck, log);
    }
    await renderProgress();
    currentTracker = await loadTracker(activeDeck);
    renderTable(tableDiv, currentTracker, activeDeck);
    await renderCardTypes(activeDeck);
  } catch (e) { log(`<span style="color:#d9534f">Fatal: ${e.message}</span>`); }
  enableAll(); syncAllBtn.textContent = 'Sync All';
});

audioBtn.addEventListener('click', async () => {
  disableAll();
  audioBtn.textContent = '...';
  const log = showLog();
  try { await runAudioSync(activeDeck, log, false); }
  catch (e) { log(`<span style="color:#d9534f">Fatal: ${e.message}</span>`); }
  enableAll(); audioBtn.textContent = 'Audio Sync';
});

guidesBtn.addEventListener('click', async () => {
  disableAll();
  guidesBtn.textContent = '...';
  const log = showLog();
  log('<b>Sync Guides — все колоды</b>');
  guidesCache = null; // reload from CSV
  try { await runGuidesSync(log); }
  catch (e) { log(`<span style="color:#d9534f">Fatal: ${e.message}</span>`); }
  enableAll(); guidesBtn.textContent = 'Sync Guides';
});

stylesBtn.addEventListener('click', async () => {
  disableAll();
  stylesBtn.textContent = '...';
  const log = showLog();
  log('<b>Apply Card Styles — все колоды</b>');
  try { await runApplyStyles(log); }
  catch (e) { log(`<span style="color:#d9534f">Fatal: ${e.message}</span>`); }
  enableAll(); stylesBtn.textContent = 'Apply Styles';
});

await selectDeck(DECKS[0]);
```
