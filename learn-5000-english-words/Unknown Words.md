```dataviewjs
// ─── CONFIG ──────────────────────────────────────────────────────────────────
const _secretsFile = app.vault.getAbstractFileByPath(dv.current().file.folder + '/secrets.json');
const _secrets = _secretsFile ? JSON.parse(await app.vault.read(_secretsFile)) : {};
const GEMINI_API_KEY      = _secrets.GEMINI_API_KEY;
const ANKI_URL            = 'http://localhost:8765';
const ANKI_DECK           = 'EG — All Words';
const ANKI_MODEL          = 'Простая';
const TARGET_COLOR        = '#c0504d';
const GEMINI_MODEL        = 'gemini-2.5-flash-lite';
const KNOWN_INTERVAL_DAYS = 7;
const GEMINI_DELAY_MS     = 40000;
const FOLDER              = dv.current().file.folder;
const TRACKER_PATH        = FOLDER + '/word-tracker.csv';

// ─── ANKI ────────────────────────────────────────────────────────────────────
const { requestUrl } = require('obsidian');
async function ankiReq(action, params = {}) {
  const res = await requestUrl({
    url: ANKI_URL,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, version: 6, params })
  });
  const { result, error } = res.json;
  if (error) throw new Error(`AnkiConnect [${action}]: ${error}`);
  return result;
}

function wordToTag(word) {
  return 'egw_' + word.toLowerCase().replace(/[^a-z0-9]/g, '_');
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
  const res = await requestUrl({
    url: `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, topP: 0.7, topK: 40 }
    }),
    throw: false
  });
  if (res.status !== 200) throw new Error(`Gemini ${res.status}: ${res.json?.error?.message || res.text}`);
  const text = res.json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  const start = text?.indexOf('[');
  const end   = text?.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) throw new Error(`Gemini unexpected format: ${text}`);
  return JSON.parse(text.slice(start, end + 1));
}

// ─── CSV TRACKER ─────────────────────────────────────────────────────────────
// Format: word|translation|filename|exportedAt|status|knownAt|s1|s2|s3
// CSV is the single source of truth. Never auto-delete from Anki.

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
    // Escape newlines and strip | to prevent CSV row splitting
    const esc = x => (x || '').replace(/\r/g, '').replace(/\n/g, '\\n').replace(/\|/g, ' ');
    rows.push([word, d.translation, d.filename, d.exportedAt, d.status, d.knownAt || '',
               esc(s[0]), esc(s[1]), esc(s[2])].join('|'));
  }
  return rows.join('\n');
}

async function loadTracker() {
  const file = app.vault.getAbstractFileByPath(TRACKER_PATH);
  if (!file) return {};
  try { return parseCSV(await app.vault.read(file)); } catch { return {}; }
}

async function saveTracker(tracker) {
  const content = toCSV(tracker);
  const file = app.vault.getAbstractFileByPath(TRACKER_PATH);
  if (file) await app.vault.modify(file, content);
  else await app.vault.create(TRACKER_PATH, content);
}

// ─── SCAN LESSONS ────────────────────────────────────────────────────────────
async function scanUnknownWords() {
  const COLOR = TARGET_COLOR.toLowerCase();
  const results = [];
  for (const page of dv.pages(`"${FOLDER}"`)) {
    if (!/^lesson/i.test(page.file.name)) continue;
    const file = app.vault.getAbstractFileByPath(page.file.path);
    if (!file) continue;
    const lines = (await app.vault.read(file)).split('\n');
    lines.forEach(line => {
      const re = /<font\s+color=["'](#?[0-9a-fA-F]{6})["'][^>]*>(.*?)<\/font>/gi;
      let m;
      while ((m = re.exec(line)) !== null) {
        const color = m[1].startsWith('#') ? m[1].toLowerCase() : `#${m[1].toLowerCase()}`;
        if (color !== COLOR) continue;
        const parts = m[2].trim().match(/^(.+?)\s*-\s*(.+)$/);
        if (!parts) continue;
        results.push({ word: parts[1].trim(), translation: parts[2].trim(), filename: page.file.name, filePath: page.file.path });
      }
    });
  }
  return results;
}

// ─── MARK AS KNOWN IN LESSON FILE ────────────────────────────────────────────
function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
async function markAsKnown(filePath, word, translation) {
  const file = app.vault.getAbstractFileByPath(filePath);
  if (!file) return false;
  const content = await app.vault.read(file);
  const pattern = new RegExp(
    `<font\\s+color=["']${esc(TARGET_COLOR)}["'][^>]*>${esc(word)}\\s*-\\s*${esc(translation)}<\\/font>`, 'gi'
  );
  const updated = content.replace(pattern, `${word} - ${translation}`);
  if (updated === content) return false;
  await app.vault.modify(file, updated);
  return true;
}

// ─── AUDIO ──────────────────────────────────────────────────────────────────
async function downloadAndAttachAudio(word, noteId) {
  try {
    const slug = word.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    const filename = `eg_${slug}.mp3`;
    const res = await requestUrl({
      url: `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(word)}`,
      method: 'GET'
    });
    const audioData = res.arrayBuffer;
    if (audioData.byteLength < 100) return;
    // Save locally
    const audioFolder = FOLDER + '/../english words/anki/audio';
    const audioPath = audioFolder + '/' + filename;
    const existing = app.vault.getAbstractFileByPath(audioPath);
    if (!existing) {
      try { await app.vault.createBinary(audioPath, audioData); } catch {}
    }
    // Upload to Anki
    const bytes = new Uint8Array(audioData);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    await ankiReq('storeMediaFile', { filename, data: btoa(bin) });
    // Update card
    const info = await ankiReq('notesInfo', { notes: [noteId] });
    if (info[0] && !info[0].fields.Front.value.includes(`[sound:${filename}]`)) {
      const clean = info[0].fields.Front.value.replace(/\[sound:[^\]]+\]/g, '').trim();
      await ankiReq('updateNoteFields', { note: { id: noteId, fields: { Front: clean + `\n[sound:${filename}]` } } });
    }
  } catch {}
}

// ─── ADD TO ANKI (from sentences array) ──────────────────────────────────────
async function addToAnki(word, translation, filename, sentences) {
  const front =
    `<div style="font-size:1.4em;font-weight:bold;margin-bottom:0.8em">${word}</div>` +
    `<ol>${sentences.map(s => `<li>${s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')}</li>`).join('')}</ol>`;
  const back = `<div style="font-size:1.2em">${translation}</div>`;
  const noteId = await ankiReq('addNote', {
    note: {
      deckName: ANKI_DECK, modelName: ANKI_MODEL,
      fields: { Front: front, Back: back },
      tags: ['english-galaxy', filename.replace(/\s+/g, '_'), wordToTag(word)],
      options: { allowDuplicate: false }
    }
  });
  // Attach audio
  await downloadAndAttachAudio(word, noteId);
}

// ─── SYNC ────────────────────────────────────────────────────────────────────
async function runSync(log) {
  log('Сканирую уроки...');
  const tracker = await loadTracker();
  const unknown = await scanUnknownWords();
  log(`Неизвестных слов в уроках: <b>${unknown.length}</b>`);

  try { const ver = await ankiReq('version'); log(`AnkiConnect v${ver} ✓`); }
  catch { log('<span style="color:#d9534f">Ошибка: Anki не запущен!</span>'); return null; }

  const decks = await ankiReq('deckNames');
  if (!decks.includes(ANKI_DECK)) {
    await ankiReq('createDeck', { deck: ANKI_DECK });
    log(`Создана колода "${ANKI_DECK}"`);
  }

  // ── Determine what needs to be exported ──────────────────────────────────
  // Word needs export if:
  //   a) Not in CSV at all → new word, call Gemini + addNote
  //   b) In CSV with status 'removed' → re-appeared, reuse stored sentences
  //   c) In CSV with status 'learning' but sentences missing → call Gemini + updateNoteFields
  const toExport = [];
  for (const w of unknown) {
    const entry = tracker[w.word];
    if (!entry) {
      toExport.push({ ...w, needGemini: true, sentences: [], mode: 'add' });
    } else if (entry.status === 'removed') {
      // Check if card still exists in Anki (we never auto-delete)
      const noteIds = await ankiReq('findNotes', { query: `deck:"${ANKI_DECK}" tag:${wordToTag(w.word)}` });
      if (noteIds.length > 0) {
        // Card still in Anki — just restore status to 'learning', no re-export needed
        tracker[w.word].status = 'learning';
        await saveTracker(tracker);
        log(`  "<b>${w.word}</b>" возвращён — карточка в Anki уже есть, статус восстановлен`);
      } else {
        // Card was deleted from Anki manually — re-export
        const hasSentences = entry.sentences.length === 3;
        toExport.push({ ...w, needGemini: !hasSentences, sentences: entry.sentences, mode: 'add' });
        log(`  "<b>${w.word}</b>" возвращён — карточки нет в Anki, ${hasSentences ? 'переэкспортирую из CSV' : 'нужен Gemini'}`);
      }
    } else if ((entry.status === 'learning' || entry.status === 'known') && entry.sentences.length < 3) {
      // Has a card in Anki but sentences are missing from CSV — generate and update the card
      toExport.push({ ...w, needGemini: true, sentences: [], mode: 'update' });
      log(`  "<b>${w.word}</b>" — предложения отсутствуют, генерирую для обновления карточки...`);
    }
    // 'learning'/'known' with sentences → nothing to do
  }
  
    // ── Check known words (interval >= threshold) ─────────────────────────────
  const learning = Object.entries(tracker).filter(([, d]) => d.status === 'learning');
  log(`Проверяю ${learning.length} learning слов в Anki...`);
  let knownCount = 0;

  for (const [word, data] of learning) {
    try {
      const noteIds = await ankiReq('findNotes', { query: `deck:"${ANKI_DECK}" tag:${wordToTag(word)}` });
      if (!noteIds.length) continue;
      const cards = await ankiReq('findCards', { query: `nid:${noteIds[0]}` });
      if (!cards.length) continue;
      const infos = await ankiReq('cardsInfo', { cards });
      if (!infos.every(c => c.interval >= KNOWN_INTERVAL_DAYS)) continue;
      const entry = unknown.find(w => w.word === word);
      if (entry) await markAsKnown(entry.filePath, entry.word, entry.translation);
      tracker[word].status  = 'known';
      tracker[word].knownAt = new Date().toISOString().split('T')[0];
      knownCount++;
      await saveTracker(tracker);
      log(`  <span style="color:#5cb85c">"${word}" — выучено, красный убран ✓</span>`);
    } catch { /* skip */ }
  }

  // ── Mark removed (red removed manually, not through sync) ─────────────────
  const currentSet = new Set(unknown.map(w => w.word));
  let removedCount = 0;
  for (const [word, data] of Object.entries(tracker)) {
    if (data.status === 'learning' && !currentSet.has(word)) {
      tracker[word].status = 'removed';
      removedCount++;
    }
  }

  log(`Слов для экспорта: <b>${toExport.length}</b>`);
  let exported = 0;

  for (const { word, translation, filename, needGemini, sentences: existingSentences, mode } of toExport) {
    const modeLabel = mode === 'update' ? '— обновляю карточку' : needGemini ? '— генерирую предложения...' : '— переэкспортирую из CSV';
    log(`  "<b>${word}</b>" ${modeLabel}`);
    try {
      const sentences = needGemini
        ? await generateSentences(word, translation)
        : existingSentences;

      if (mode === 'update') {
        // Update existing Anki card (sentences were missing)
        const noteIds = await ankiReq('findNotes', { query: `deck:"${ANKI_DECK}" tag:${wordToTag(word)}` });
        if (noteIds.length > 0) {
          const front =
            `<div style="font-size:1.4em;font-weight:bold;margin-bottom:0.8em">${word}</div>` +
            `<ol>${sentences.map(s => `<li>${s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')}</li>`).join('')}</ol>`;
          await ankiReq('updateNoteFields', { note: { id: noteIds[0], fields: { Front: front } } });
        }
      } else {
        await addToAnki(word, translation, filename, sentences);
      }

      tracker[word] = {
        translation, filename,
        exportedAt: tracker[word]?.exportedAt || new Date().toISOString().split('T')[0],
        status: tracker[word]?.status || 'learning',
        knownAt: tracker[word]?.knownAt || '',
        sentences
      };
      exported++;
      await saveTracker(tracker);
      const label = mode === 'update' ? 'обновлено' : 'добавлено';
      log(`  <span style="color:#5cb85c">"${word}" → Anki ✓ (${label})</span>`);
    } catch (e) {
      log(`  <span style="color:#d9534f">Ошибка "${word}": ${e.message}</span>`);
    }
    if (needGemini) await new Promise(r => setTimeout(r, GEMINI_DELAY_MS));
  }

  if (removedCount > 0) await saveTracker(tracker);

  const stats = Object.values(tracker).reduce((a, d) => { a[d.status] = (a[d.status]||0)+1; return a; }, {});
  log(`<br><b>Готово!</b> Экспортировано: ${exported} | Выучено: ${knownCount} | Убрано: ${removedCount}`);
  log(`Трекер: learning=${stats.learning||0} | known=${stats.known||0} | removed=${stats.removed||0}`);
  return tracker;


}

// ─── RENDER TABLES ───────────────────────────────────────────────────────────
function renderUnknownTable(container, unknownWords, tracker) {
  container.innerHTML = '';
  if (unknownWords.length === 0) {
    container.createEl('p', { text: 'Нет неизвестных слов. Все выучено!', attr: { style: 'color:#5cb85c;font-weight:bold;margin:8px 0' } });
    return;
  }
  const table = container.createEl('table', { attr: { style: 'width:100%;border-collapse:collapse;margin-bottom:20px' } });
  const hr = table.createEl('thead').createEl('tr');
  ['Файл', 'Слово', 'Перевод', 'Статус'].forEach(h =>
    hr.createEl('th', { text: h, attr: { style: 'text-align:left;padding:4px 10px;border-bottom:1px solid var(--background-modifier-border)' } })
  );
  const tbody = table.createEl('tbody');
  for (const { word, translation, filename, filePath } of unknownWords) {
    const tr = tbody.createEl('tr');
    const link = tr.createEl('td', { attr: { style: 'padding:3px 10px' } });
    link.createEl('a', { text: filename.replace('.md',''), attr: { href: filePath, class: 'internal-link' } });
    tr.createEl('td', { text: word, attr: { style: `padding:3px 10px;font-weight:bold;color:${TARGET_COLOR}` } });
    tr.createEl('td', { text: translation, attr: { style: 'padding:3px 10px;color:var(--text-muted)' } });
    const s = tracker[word]?.status;
    const label = s === 'learning' ? '📚 В Anki' : s === 'removed' ? '🔄 Вернулось' : '—';
    tr.createEl('td', { text: label, attr: { style: 'padding:3px 10px' } });
  }
}

function renderAnkiTable(container, tracker) {
  container.innerHTML = '';
  const entries = Object.entries(tracker).filter(([, d]) => d.status === 'learning' || d.status === 'known');
  if (entries.length === 0) {
    container.createEl('p', { text: 'В Anki пока нет слов.', attr: { style: 'color:var(--text-muted);margin:8px 0' } });
    return;
  }
  entries.sort(([, a], [, b]) => (a.status === 'known' ? 1 : 0) - (b.status === 'known' ? 1 : 0));
  const table = container.createEl('table', { attr: { style: 'width:100%;border-collapse:collapse' } });
  const hr = table.createEl('thead').createEl('tr');
  ['Слово', 'Перевод', 'Статус', 'Добавлено', 'Выучено'].forEach(h =>
    hr.createEl('th', { text: h, attr: { style: 'text-align:left;padding:4px 10px;border-bottom:1px solid var(--background-modifier-border)' } })
  );
  const tbody = table.createEl('tbody');
  for (const [word, d] of entries) {
    const tr = tbody.createEl('tr');
    tr.createEl('td', { text: word, attr: { style: 'padding:3px 10px;font-weight:bold' } });
    tr.createEl('td', { text: d.translation, attr: { style: 'padding:3px 10px;color:var(--text-muted)' } });
    const isKnown = d.status === 'known';
    tr.createEl('td', { text: isKnown ? '✅ Выучено' : '📚 Учу', attr: { style: `padding:3px 10px;color:${isKnown ? '#5cb85c' : '#f0ad4e'}` } });
    tr.createEl('td', { text: d.exportedAt || '—', attr: { style: 'padding:3px 10px;color:var(--text-muted);font-size:0.9em' } });
    tr.createEl('td', { text: d.knownAt || '—', attr: { style: 'padding:3px 10px;color:var(--text-muted);font-size:0.9em' } });
  }
}

// ─── UI ──────────────────────────────────────────────────────────────────────
const wrap = dv.el('div', '');

const btn = wrap.createEl('button', {
  text: '▶ Sync to Anki',
  attr: { style: 'padding:7px 20px;font-size:0.95em;cursor:pointer;background:#4caf50;color:#fff;border:none;border-radius:6px;margin-bottom:10px;font-weight:bold' }
});
const logDiv = wrap.createEl('div', {
  attr: { style: 'font-family:monospace;font-size:0.82em;background:var(--background-secondary);padding:10px 14px;border-radius:6px;max-height:260px;overflow-y:auto;display:none;line-height:1.7;margin-bottom:16px' }
});

wrap.createEl('h3', { text: 'Неизвестные слова (в уроках)', attr: { style: 'margin:16px 0 6px' } });
const unknownTableDiv = wrap.createEl('div', '');

wrap.createEl('h3', { text: 'Все слова в Anki', attr: { style: 'margin:20px 0 6px' } });
const ankiTableDiv = wrap.createEl('div', '');

let currentUnknown = await scanUnknownWords();
let currentTracker = await loadTracker();
renderUnknownTable(unknownTableDiv, currentUnknown, currentTracker);
renderAnkiTable(ankiTableDiv, currentTracker);

btn.addEventListener('click', async () => {
  btn.disabled = true;
  btn.textContent = '⏳ Синхронизирую...';
  logDiv.style.display = 'block';
  logDiv.innerHTML = '';
  const log = (msg) => { logDiv.innerHTML += msg + '<br>'; logDiv.scrollTop = logDiv.scrollHeight; };
  try {
    const updatedTracker = await runSync(log);
    if (updatedTracker) {
      currentUnknown = await scanUnknownWords();
      currentTracker = updatedTracker;
      renderUnknownTable(unknownTableDiv, currentUnknown, currentTracker);
      renderAnkiTable(ankiTableDiv, currentTracker);
    }
  } catch (e) {
    log(`<span style="color:#d9534f">Fatal: ${e.message}</span>`);
  }
  btn.disabled = false;
  btn.textContent = '▶ Sync to Anki';
});
```
