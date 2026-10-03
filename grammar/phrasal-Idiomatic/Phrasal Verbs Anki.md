> Фразовые глаголы учатся в Anki через общую панель [[Anki Decks]] (вкладка **Phrasal Verbs**, колода `EG — Phrasal Verbs`). Здесь только сводка по трекеру и ссылки — отдельного экспортёра у фразовых глаголов больше нет, чтобы не плодить вторую колоду и расходящиеся теги.

← [[Complex Introduction|Назад к разделу]] · [[Phrasal Verbs Dictionary — Introduction|Словарь]] · [[Particles Reference|Частицы]]

---

#### Как это устроено

| Что | Где |
|---|---|
| Список глаголов для карточек | `english words/anki/phrasal-verbs-tracker.csv` (колонки `phrasal_verb \| translation \| exportedAt \| status \| knownAt \| s1 \| s2 \| s3 \| note`) |
| Экспорт в Anki, синхронизация статусов, аудио | [[Anki Decks]] → вкладка **Phrasal Verbs** → кнопки Export / Sync / Audio Sync |
| Колода и теги в Anki | `EG — Phrasal Verbs`, теги `phrasal_v` + `pv_<глагол>` |
| Теория и справочники | [[Phrasal Verbs — фразовые глаголы]], [[Particles Reference]], [[Common Phrasal Verbs — общая таблица]] |

Чтобы добавить новый фразовый глагол в Anki: допиши строку в трекер (`phrasal_verb|translation|||` + три примера через `|`), затем в [[Anki Decks]] нажми **Export** на вкладке Phrasal Verbs.

---

#### Сводка по трекеру

```dataviewjs
// Только чтение трекера — без обращения к Anki.
const TRACKER_PATH = 'english words/anki/phrasal-verbs-tracker.csv';
const file = app.vault.getAbstractFileByPath(TRACKER_PATH);
if (!file) {
  dv.paragraph('⚠ Трекер не найден: ' + TRACKER_PATH);
} else {
  const lines = (await app.vault.read(file)).trim().split('\n').filter(l => l.trim());
  const header = lines[0].split('|').map(h => h.trim());
  const col = name => header.indexOf(name);
  const rows = lines.slice(1).map(l => l.split('|'));
  const get = (r, name) => (r[col(name)] || '').trim();

  const stats = { new: 0, learning: 0, known: 0, removed: 0 };
  for (const r of rows) {
    const st = get(r, 'exportedAt') ? (get(r, 'status') || 'learning') : 'new';
    stats[st] = (stats[st] || 0) + 1;
  }
  const total = rows.length;
  const pct = total ? Math.round(stats.known / total * 100) : 0;

  const box = dv.el('div', '');
  box.innerHTML =
    `<div style="display:flex;gap:16px;flex-wrap:wrap;font-size:0.95em;margin-bottom:6px">` +
    `<span>Всего: <b>${total}</b></span>` +
    `<span style="color:#5cb85c">Выучено: <b>${stats.known}</b></span>` +
    `<span style="color:#f0ad4e">Учу: <b>${stats.learning}</b></span>` +
    `<span style="color:var(--text-muted)">Не в Anki: <b>${stats.new}</b></span>` +
    (stats.removed ? `<span style="color:var(--text-faint)">Убрано: <b>${stats.removed}</b></span>` : '') +
    `</div>` +
    `<div style="width:100%;height:8px;background:var(--background-modifier-border);border-radius:4px;overflow:hidden">` +
    `<div style="width:${pct}%;height:100%;background:#5cb85c"></div></div>` +
    `<div style="font-size:0.8em;color:var(--text-muted);margin-top:2px">${pct}% выучено</div>`;

  const pending = rows.filter(r => !get(r, 'exportedAt')).map(r => [get(r, 'phrasal_verb'), get(r, 'translation')]);
  if (pending.length) {
    dv.header(5, `Ещё не экспортированы в Anki (${pending.length})`);
    dv.table(['Фразовый глагол', 'Перевод'], pending);
  }
}
```
