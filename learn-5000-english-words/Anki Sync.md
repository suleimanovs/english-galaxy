# Anki Sync

> Синхронизация неизвестных слов с Anki. Запускай кнопкой ниже или из терминала.

---

## Статус

```dataviewjs
const trackerPath = app.vault.getAbstractFileByPath(
  dv.current().file.folder + '/word-tracker.json'
);

if (!trackerPath) {
  dv.paragraph('**word-tracker.json не найден** — запусти синхронизацию впервые.');
} else {
  const raw     = await app.vault.read(trackerPath);
  const tracker = JSON.parse(raw);
  const entries = Object.entries(tracker);

  const byStatus = entries.reduce((acc, [word, d]) => {
    acc[d.status] = (acc[d.status] || []);
    acc[d.status].push(word);
    return acc;
  }, {});

  const learning = byStatus.learning || [];
  const known    = byStatus.known    || [];
  const removed  = byStatus.removed  || [];

  dv.paragraph(
    `| Статус | Кол-во |\n` +
    `|--------|--------|\n` +
    `| Learning (в Anki) | **${learning.length}** |\n` +
    `| Known (выучено) | **${known.length}** |\n` +
    `| Removed (убрано из уроков) | **${removed.length}** |`
  );

  if (learning.length > 0) {
    dv.header(4, 'Learning');
    dv.list(learning);
  }

  if (known.length > 0) {
    dv.header(4, 'Known');
    dv.list(known);
  }
}
```

---

## Запуск синхронизации

### Через Templater (рекомендуется)

Установи плагин **Templater**, затем создай шаблон с содержимым:

```
<%* await tp.system.exec("GEMINI_API_KEY=ВАШ_КЛЮЧ node '" + app.vault.adapter.basePath + "/learn-5000-english-words/sync-anki.js'") %>
```

Или запускай напрямую из терминала:

```bash
cd /Users/osman/Projects/obsidian/english-galaxy/learn-5000-english-words
GEMINI_API_KEY=ВАШ_КЛЮЧ node sync-anki.js
```

### Через Shell Commands plugin

1. Установи плагин **Shell Commands**
2. Добавь новую команду:
   ```
   GEMINI_API_KEY=ВАШ_КЛЮЧ node /Users/osman/Projects/obsidian/english-galaxy/learn-5000-english-words/sync-anki.js
   ```
3. Присвой горячую клавишу (например `Ctrl+Shift+A`)

---

## Как это работает

1. Скрипт сканирует все файлы `Lesson *.md` на предмет слов в красном цвете `#c0504d`
2. **Новые слова** (которых нет в `word-tracker.json`) → Gemini генерирует 3 предложения → карточка добавляется в Anki (дек **English Galaxy**)
3. Повторный запуск **не дублирует** уже экспортированные слова
4. Если карточка в Anki достигла интервала **≥ 7 дней** → красный цвет убирается из урока автоматически
5. Если слово вручную убрали из урока (убрали красный цвет) → трекер помечает его как `removed`

---

## Требования

- [ ] Node.js 18+
- [ ] Anki открыт
- [ ] Плагин [AnkiConnect](https://ankiweb.net/shared/info/2055492159) установлен в Anki
- [ ] Переменная `GEMINI_API_KEY` установлена
- [ ] В Anki существует нотип **Basic** (есть по умолчанию)
