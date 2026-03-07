# Anki Sync

```dataviewjs
// ─── CONFIG ─────────────────────────────────────────────────────────────────
const GEMINI_API_KEY     = 'AIzaSyCSmV9kPZT7M1QX0fwoMX_6WWNKBUI1kW8';
const ANKI_URL           = 'http://localhost:8765';
const ANKI_DECK          = 'English Galaxy';
const ANKI_MODEL         = 'Basic';
const TARGET_COLOR       = '#c0504d';
const GEMINI_MODEL       = 'gemini-2.0-flash';
const KNOWN_INTERVAL_DAYS = 7;
const GEMINI_DELAY_MS    = 700;
const FOLDER             = dv.current().file.folder;
const TRACKER_PATH       = FOLDER + '/word-tracker.json';

// ─── ANKI ────────────────────────────────────────────────────────────────────
async function ankiReq(action, params = {}) {
  const res = await fetch(ANKI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, version: 6, params })
  });
  const { result, error } = await res.json();
  if (error) throw new Error(`AnkiConnect [${action}]: ${error}`);
  return result;
}

// ─── GEMINI ──────────────────────────────────────────────────────────────────
async function generateSentences(word, translation) {
  const prompt =
    `Create 3 diverse English example sentences using the word "${word}" (Russian: ${translation}).\n` +
    `Rules:\n- Each sentence in a different real-life context\n- Bold the target word: **${word}**\n` +
    `- Return ONLY a JSON array of exactly 3 strings, no markdown, no explanation\n\n` +
    `Output: ["s1", "s2", "s3"]`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    }
  );
  const data = await res.json();
  if (data.error) throw new Error(`Gemini: ${JSON.stringify(data.error)}`);
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  const match = text?.match(/\[[\s\S]*?\]/);
  if (!match) throw new Error(`Gemini unexpected format: ${text}`);
  return JSON.parse(match[0]);
}

// ─── TRACKER ─────────────────────────────────────────────────────────────────
async function loadTracker() {
  const file = app.vault.getAbstractFileByPath(TRACKER_PATH);
  if (!file) return {};
  try { return JSON.parse(await app.vault.read(file)); } catch { return {}; }
}

async function saveTracker(tracker) {
  const content = JSON.stringify(tracker, null, 2);
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
    lines.forEach((line, lineIdx) => {
      const re = /<font\s+color=["'](#?[0-9a-fA-F]{6})["'][^>]*>(.*?)<\/font>/gi;
      let m;
      while ((m = re.exec(line)) !== null) {
        const color = m[1].startsWith('#') ? m[1].toLowerCase() : `#${m[1].toLowerCase()}`;
        if (color !== COLOR) continue;
        const parts = m[2].trim().match(/^(.+?)\s*-\s*(.+)$/);
        if (!parts) continue;
        results.push({ word: parts[1].trim(), translation: parts[2].trim(), filename: page.file.name, filePath: page.file.path, lineIdx });
      }
    });
  }
  return results;
}

// ─── MARK AS KNOWN ───────────────────────────────────────────────────────────
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

// ─── MAIN SYNC ───────────────────────────────────────────────────────────────
async function runSync(log) {
  log('Сканирую уроки...');
  const tracker = await loadTracker();
  const unknown = await scanUnknownWords();
  log(`Неизвестных слов в уроках: <b>${unknown.length}</b>`);

  try { const ver = await ankiReq('version'); log(`AnkiConnect v${ver} ✓`); }
  catch { log('<span class="err">Ошибка: Anki не запущен или AnkiConnect не установлен!</span>'); return; }

  const decks = await ankiReq('deckNames');
  if (!decks.includes(ANKI_DECK)) {
    await ankiReq('createDeck', { deck: ANKI_DECK });
    log(`Создана колода "${ANKI_DECK}"`);
  }

  // Export new words
  const newWords = unknown.filter(w => !tracker[w.word]);
  log(`Новых слов для экспорта: <b>${newWords.length}</b>`);
  let exported = 0;

  for (const { word, translation, filename } of newWords) {
    log(`  Генерирую предложения для "<b>${word}</b>"...`);
    try {
      const sentences = await generateSentences(word, translation);
      const front =
        `<div style="font-size:1.4em;font-weight:bold;margin-bottom:0.8em">${word}</div>` +
        `<ol>${sentences.map(s => `<li>${s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')}</li>`).join('')}</ol>`;
      const back = `<div style="font-size:1.2em">${translation}</div>`;
      const noteId = await ankiReq('addNote', {
        note: {
          deckName: ANKI_DECK, modelName: ANKI_MODEL,
          fields: { Front: front, Back: back },
          tags: ['english-galaxy', filename.replace(/\s+/g, '_')],
          options: { allowDuplicate: false }
        }
      });
      tracker[word] = { noteId, translation, filename, exportedAt: new Date().toISOString().split('T')[0], status: 'learning' };
      exported++;
      log(`  <span class="ok">"${word}" → Anki (noteId: ${noteId})</span>`);
      await new Promise(r => setTimeout(r, GEMINI_DELAY_MS));
    } catch (e) {
      log(`  <span class="err">Ошибка "${word}": ${e.message}</span>`);
    }
  }
  if (exported > 0) await saveTracker(tracker);

  // Check known words
  const learning = Object.entries(tracker).filter(([, d]) => d.status === 'learning');
  log(`Проверяю ${learning.length} слов в Anki...`);
  let knownCount = 0;

  for (const [word, data] of learning) {
    try {
      const cards = await ankiReq('findCards', { query: `nid:${data.noteId}` });
      if (!cards.length) continue;
      const infos = await ankiReq('cardsInfo', { cards });
      if (!infos.every(c => c.interval >= KNOWN_INTERVAL_DAYS)) continue;
      const entry = unknown.find(w => w.word === word);
      if (entry) await markAsKnown(entry.filePath, entry.word, entry.translation);
      tracker[word].status = 'known';
      tracker[word].knownAt = new Date().toISOString().split('T')[0];
      knownCount++;
      log(`  <span class="ok">"${word}" — выучено, убран красный цвет</span>`);
    } catch { /* skip */ }
  }

  // Clean removed
  const currentSet = new Set(unknown.map(w => w.word));
  for (const [word, data] of Object.entries(tracker))
    if (data.status === 'learning' && !currentSet.has(word)) tracker[word].status = 'removed';

  await saveTracker(tracker);

  const stats = Object.values(tracker).reduce((a, d) => { a[d.status] = (a[d.status] || 0) + 1; return a; }, {});
  log(`<br><b>Готово!</b> Экспортировано: ${exported} | Выучено: ${knownCount} | В процессе: ${stats.learning || 0} | Всего выучено: ${stats.known || 0}`);
}

// ─── STATUS BLOCK ─────────────────────────────────────────────────────────────
async function renderStatus(container) {
  const file = app.vault.getAbstractFileByPath(TRACKER_PATH);
  if (!file) { container.createEl('p', { text: 'word-tracker.json не найден — запусти синхронизацию.', attr: { style: 'color:#888' } }); return; }
  const tracker = JSON.parse(await app.vault.read(file));
  const stats = Object.values(tracker).reduce((a, d) => { a[d.status] = (a[d.status] || 0) + 1; return a; }, {});
  const table = container.createEl('table', { attr: { style: 'border-collapse:collapse;margin-bottom:12px' } });
  [['В процессе (Anki)', stats.learning || 0, '#f0ad4e'],
   ['Выучено', stats.known || 0, '#5cb85c'],
   ['Убрано из уроков', stats.removed || 0, '#888']
  ].forEach(([label, count, color]) => {
    const tr = table.createEl('tr');
    tr.createEl('td', { text: label, attr: { style: 'padding:3px 12px 3px 0' } });
    tr.createEl('td', { text: String(count), attr: { style: `font-weight:bold;color:${color}` } });
  });
}

// ─── UI ──────────────────────────────────────────────────────────────────────
const wrap = dv.el('div', '');

// Status
const statusDiv = wrap.createEl('div', { attr: { style: 'margin-bottom:16px' } });
await renderStatus(statusDiv);

// Button
const btn = wrap.createEl('button', {
  text: '▶ Sync to Anki',
  attr: { style: 'padding:8px 22px;font-size:1em;cursor:pointer;background:#4caf50;color:#fff;border:none;border-radius:6px;margin-bottom:12px;font-weight:bold' }
});

// Log output
const logDiv = wrap.createEl('div', {
  attr: { style: 'font-family:monospace;font-size:0.82em;background:var(--background-secondary);padding:10px 14px;border-radius:6px;max-height:320px;overflow-y:auto;display:none;line-height:1.7' }
});

btn.addEventListener('click', async () => {
  btn.disabled = true;
  btn.textContent = '⏳ Синхронизирую...';
  logDiv.style.display = 'block';
  logDiv.innerHTML = '';
  const log = (msg) => { logDiv.innerHTML += msg + '<br>'; logDiv.scrollTop = logDiv.scrollHeight; };
  const style = logDiv.createEl('style');
  style.textContent = '.ok{color:#5cb85c}.err{color:#d9534f}';
  try {
    await runSync(log);
    // Refresh status
    statusDiv.innerHTML = '';
    await renderStatus(statusDiv);
  } catch (e) {
    log(`<span class="err">Fatal: ${e.message}</span>`);
  }
  btn.disabled = false;
  btn.textContent = '▶ Sync to Anki';
});
```
