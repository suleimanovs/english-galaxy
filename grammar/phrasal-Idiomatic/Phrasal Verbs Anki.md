```dataviewjs
// ─── CONFIG ──────────────────────────────────────────────────────────────────
const ANKI_URL            = 'http://localhost:8765';
const ANKI_DECK           = 'English Galaxy — Phrasal Verbs';
const ANKI_MODEL          = 'Простая';
const KNOWN_INTERVAL_DAYS = 7;
const TRACKER_PATH        = 'english words/anki/phrasal-verbs-tracker.csv';

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

function pvToTag(pv) {
  return 'pv_' + pv.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

// ─── CSV TRACKER ─────────────────────────────────────────────────────────────
// Format: phrasal_verb|translation|exportedAt|status|knownAt|s1|s2|s3

function parseCSV(text) {
  const lines = text.trim().split('\n').filter(l => l.trim());
  const tracker = {};
  for (let i = 1; i < lines.length; i++) {
    const p = lines[i].split('|');
    const pv = p[0]?.trim();
    if (!pv) continue;
    const unesc = s => (s || '').trim().replace(/\\n/g, '\n');
    tracker[pv] = {
      translation: p[1]?.trim() || '',
      exportedAt:  p[2]?.trim() || '',
      status:      p[3]?.trim() || '',
      knownAt:     p[4]?.trim() || '',
      sentences:   [unesc(p[5]), unesc(p[6]), unesc(p[7])].filter(s => s)
    };
  }
  return tracker;
}

function toCSV(tracker) {
  const rows = ['phrasal_verb|translation|exportedAt|status|knownAt|s1|s2|s3'];
  for (const [pv, d] of Object.entries(tracker)) {
    const s = d.sentences || [];
    const esc = x => (x || '').replace(/\r/g, '').replace(/\n/g, '\\n').replace(/\|/g, ' ');
    rows.push([pv, d.translation, d.exportedAt, d.status, d.knownAt || '',
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

// ─── ADD TO ANKI ─────────────────────────────────────────────────────────────
async function addToAnki(pv, translation, sentences) {
  const front =
    `<div style="font-size:1.4em;font-weight:bold;margin-bottom:0.8em">${pv}</div>` +
    `<ol>${sentences.map(s => `<li>${s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')}</li>`).join('')}</ol>`;
  const back = `<div style="font-size:1.2em">${translation}</div>`;
  await ankiReq('addNote', {
    note: {
      deckName: ANKI_DECK, modelName: ANKI_MODEL,
      fields: { Front: front, Back: back },
      tags: ['phrasal-verbs', pvToTag(pv)],
      options: { allowDuplicate: false }
    }
  });
}

// ─── EXPORT ──────────────────────────────────────────────────────────────────
async function runExport(log) {
  const tracker = await loadTracker();
  const total = Object.keys(tracker).length;
  const toExport = Object.entries(tracker).filter(([, d]) => !d.exportedAt);
  log(`Всего фразовых глаголов: <b>${total}</b>`);
  log(`Для экспорта: <b>${toExport.length}</b>`);

  if (toExport.length === 0) {
    log('Все уже в Anki.');
    return tracker;
  }

  try { const ver = await ankiReq('version'); log(`AnkiConnect v${ver}`); }
  catch { log('<span style="color:#d9534f">Anki не запущен!</span>'); return null; }

  const decks = await ankiReq('deckNames');
  if (!decks.includes(ANKI_DECK)) {
    await ankiReq('createDeck', { deck: ANKI_DECK });
    log(`Создана колода "${ANKI_DECK}"`);
  }

  let exported = 0;
  for (const [pv, data] of toExport) {
    try {
      await addToAnki(pv, data.translation, data.sentences);
      tracker[pv].exportedAt = new Date().toISOString().split('T')[0];
      tracker[pv].status = 'learning';
      exported++;
      if (exported % 20 === 0) {
        await saveTracker(tracker);
        log(`  Экспортировано ${exported} / ${toExport.length}...`);
      }
    } catch (e) {
      if (e.message.includes('duplicate')) {
        tracker[pv].exportedAt = new Date().toISOString().split('T')[0];
        tracker[pv].status = 'learning';
        exported++;
      } else {
        log(`  <span style="color:#d9534f">"${pv}": ${e.message}</span>`);
      }
    }
  }

  await saveTracker(tracker);
  log(`<br><b>Экспорт завершён!</b> Добавлено: ${exported}`);
  return tracker;
}

// ─── SYNC ────────────────────────────────────────────────────────────────────
async function runSync(log) {
  const tracker = await loadTracker();

  try { const ver = await ankiReq('version'); log(`AnkiConnect v${ver}`); }
  catch { log('<span style="color:#d9534f">Anki не запущен!</span>'); return null; }

  const exported = Object.entries(tracker).filter(([, d]) => d.exportedAt);
  log(`Проверяю ${exported.length} фразовых глаголов в Anki...`);

  let knownCount = 0;
  let returnedCount = 0;

  for (const [pv, data] of exported) {
    try {
      const noteIds = await ankiReq('findNotes', { query: `deck:"${ANKI_DECK}" tag:${pvToTag(pv)}` });
      if (!noteIds.length) continue;
      const cards = await ankiReq('findCards', { query: `nid:${noteIds[0]}` });
      if (!cards.length) continue;
      const infos = await ankiReq('cardsInfo', { cards });
      const allKnown = infos.every(c => c.interval >= KNOWN_INTERVAL_DAYS);

      if (allKnown && data.status !== 'known') {
        tracker[pv].status = 'known';
        tracker[pv].knownAt = new Date().toISOString().split('T')[0];
        knownCount++;
        log(`  <span style="color:#5cb85c">"${pv}" — выучено</span>`);
      } else if (!allKnown && data.status === 'known') {
        tracker[pv].status = 'learning';
        tracker[pv].knownAt = '';
        returnedCount++;
        log(`  <span style="color:#f0ad4e">"${pv}" — вернулось в learning (interval < ${KNOWN_INTERVAL_DAYS})</span>`);
      }
    } catch { /* skip */ }
  }

  await saveTracker(tracker);

  const stats = Object.values(tracker).reduce((a, d) => { a[d.status || 'new'] = (a[d.status || 'new']||0)+1; return a; }, {});
  log(`<br><b>Sync завершён!</b>`);
  log(`Новых выученных: ${knownCount} | Вернулось в learning: ${returnedCount}`);
  log(`Всего: new=${stats.new||0} | learning=${stats.learning||0} | known=${stats.known||0}`);
  return tracker;
}

// ─── RENDER TABLE ────────────────────────────────────────────────────────────
function renderTable(container, tracker) {
  container.innerHTML = '';
  const entries = Object.entries(tracker);
  if (entries.length === 0) {
    container.createEl('p', { text: 'Трекер пуст.', attr: { style: 'color:var(--text-muted)' } });
    return;
  }

  // Stats bar
  const stats = entries.reduce((a, [, d]) => { a[d.status || 'new'] = (a[d.status || 'new']||0)+1; return a; }, {});
  const total = entries.length;
  const known = stats.known || 0;
  const learning = stats.learning || 0;
  const notExported = stats[''] || stats.new || 0;
  const pct = total > 0 ? Math.round(known / total * 100) : 0;

  const statsDiv = container.createEl('div', { attr: { style: 'margin-bottom:12px' } });
  statsDiv.innerHTML =
    `<div style="display:flex;gap:16px;font-size:0.9em;margin-bottom:6px">` +
    `<span>Всего: <b>${total}</b></span>` +
    `<span style="color:#5cb85c">Выучено: <b>${known}</b></span>` +
    `<span style="color:#f0ad4e">Учу: <b>${learning}</b></span>` +
    `<span style="color:var(--text-muted)">Не экспортировано: <b>${notExported}</b></span>` +
    `</div>` +
    `<div style="width:100%;height:8px;background:var(--background-modifier-border);border-radius:4px;overflow:hidden">` +
    `<div style="width:${pct}%;height:100%;background:#5cb85c;transition:width 0.3s"></div>` +
    `</div>` +
    `<div style="font-size:0.8em;color:var(--text-muted);margin-top:2px">${pct}% выучено</div>`;

  // Sort: learning first, then new, then known
  const order = { learning: 0, '': 1, new: 1, known: 2 };
  entries.sort(([, a], [, b]) => (order[a.status || ''] ?? 1) - (order[b.status || ''] ?? 1));

  const table = container.createEl('table', { attr: { style: 'width:100%;border-collapse:collapse' } });
  const hr = table.createEl('thead').createEl('tr');
  ['Phrasal Verb', 'Перевод', 'Статус', 'Добавлено', 'Выучено'].forEach(h =>
    hr.createEl('th', { text: h, attr: { style: 'text-align:left;padding:4px 10px;border-bottom:1px solid var(--background-modifier-border)' } })
  );
  const tbody = table.createEl('tbody');
  for (const [pv, d] of entries) {
    const tr = tbody.createEl('tr');
    tr.createEl('td', { text: pv, attr: { style: 'padding:3px 10px;font-weight:bold' } });
    tr.createEl('td', { text: d.translation, attr: { style: 'padding:3px 10px;color:var(--text-muted)' } });
    const st = d.status || 'new';
    const label = st === 'known' ? 'Выучено' : st === 'learning' ? 'Учу' : 'Новое';
    const color = st === 'known' ? '#5cb85c' : st === 'learning' ? '#f0ad4e' : 'var(--text-muted)';
    tr.createEl('td', { text: label, attr: { style: `padding:3px 10px;color:${color}` } });
    tr.createEl('td', { text: d.exportedAt || '—', attr: { style: 'padding:3px 10px;color:var(--text-muted);font-size:0.9em' } });
    tr.createEl('td', { text: d.knownAt || '—', attr: { style: 'padding:3px 10px;color:var(--text-muted);font-size:0.9em' } });
  }
}

// ─── UI ──────────────────────────────────────────────────────────────────────
const wrap = dv.el('div', '');

const btnRow = wrap.createEl('div', { attr: { style: 'display:flex;gap:10px;margin-bottom:10px' } });

const exportBtn = btnRow.createEl('button', {
  text: 'Export to Anki',
  attr: { style: 'padding:7px 20px;font-size:0.95em;cursor:pointer;background:#4caf50;color:#fff;border:none;border-radius:6px;font-weight:bold' }
});

const syncBtn = btnRow.createEl('button', {
  text: 'Sync',
  attr: { style: 'padding:7px 20px;font-size:0.95em;cursor:pointer;background:#2196f3;color:#fff;border:none;border-radius:6px;font-weight:bold' }
});

const logDiv = wrap.createEl('div', {
  attr: { style: 'font-family:monospace;font-size:0.82em;background:var(--background-secondary);padding:10px 14px;border-radius:6px;max-height:260px;overflow-y:auto;display:none;line-height:1.7;margin-bottom:16px' }
});

wrap.createEl('h3', { text: 'Phrasal Verbs', attr: { style: 'margin:16px 0 6px' } });
const tableDiv = wrap.createEl('div', '');

let currentTracker = await loadTracker();
renderTable(tableDiv, currentTracker);

function showLog() {
  logDiv.style.display = 'block';
  logDiv.innerHTML = '';
  return (msg) => { logDiv.innerHTML += msg + '<br>'; logDiv.scrollTop = logDiv.scrollHeight; };
}

exportBtn.addEventListener('click', async () => {
  exportBtn.disabled = true;
  syncBtn.disabled = true;
  exportBtn.textContent = 'Экспортирую...';
  const log = showLog();
  try {
    const updated = await runExport(log);
    if (updated) { currentTracker = updated; renderTable(tableDiv, currentTracker); }
  } catch (e) { log(`<span style="color:#d9534f">Fatal: ${e.message}</span>`); }
  exportBtn.disabled = false;
  syncBtn.disabled = false;
  exportBtn.textContent = 'Export to Anki';
});

syncBtn.addEventListener('click', async () => {
  exportBtn.disabled = true;
  syncBtn.disabled = true;
  syncBtn.textContent = 'Синхронизирую...';
  const log = showLog();
  try {
    const updated = await runSync(log);
    if (updated) { currentTracker = updated; renderTable(tableDiv, currentTracker); }
  } catch (e) { log(`<span style="color:#d9534f">Fatal: ${e.message}</span>`); }
  exportBtn.disabled = false;
  syncBtn.disabled = false;
  syncBtn.textContent = 'Sync';
});
```
