## Что нужно

**Obsidian** с плагинами: Dataview (обязательно, включить dataviewjs в настройках), obsidian-git (опционально для бэкапа). **Anki** с плагином AnkiConnect (код 2055492159, поставить из меню Tools > Add-ons). Anki должен быть запущен при синхронизации.

**Node.js** нужен только для `audio-sync.js` (batch-загрузка аудио из терминала). Для обычной работы через Obsidian не требуется.

## Gemini API ключ

Для генерации предложений в Unknown Words.md используется Gemini. Создай файл `learn-5000-english-words/secrets.json`:
```json
{"GEMINI_API_KEY": "твой_ключ"}
```
Получить ключ: зайди на ai.google.dev, нажми "Get API key", создай проект, скопируй ключ. Бесплатный план хватает.

## Структура

`english words/anki/` — все CSV трекеры (12 колод), аудио файлы, скрипты. `Anki Decks.md` — UI для экспорта, синхронизации статусов и аудио по всем колодам. Вкладки сверху переключают колоды, кнопки: Export (в Anki), Sync (статусы), Audio Sync (добавить недостающее аудио), Audio Force (перезагрузить всё).

`learn-5000-english-words/` — уроки 5000 Words. `Unknown Words.md` — сканирует красные слова из уроков, генерирует предложения через Gemini, экспортирует в Anki с аудио. Три кнопки: Export+Gemini (новые слова), Sync Statuses (проверка выученных), Audio Sync.

`grammar/` — 129 тем по грамматике. `Home Page.md` — статистика, прогресс по курсам, Anki дашборд.

## Колоды Anki

Idioms (122), Collocations (110), Prepositional Phrases (93), Linking Words (61), Confusing Words (49), Irregular Verbs (108), False Friends (48), True Friends (234), Phrasal Verbs (368), Phrasal Nouns (47), Dependent Prepositions (378), All Words (~185). Каждая колода имеет обычные карточки + cloze (заморожены, можно разморозить когда слово выучено). Аудио (Google TTS) на всех карточках, MP3 хранятся локально в `english words/anki/audio/`.

## Как красить слова

В уроках 5000 Words слова помечаются красным через `<font color="#c0504d">word - перевод</font>`. При синхронизации Unknown Words.md подхватывает их, создаёт карточки в Anki. Когда интервал в Anki достигает 8 дней, слово считается выученным, красный убирается автоматически.

## audio-sync.js

CLI-скрипт для batch-операций с аудио. Использование: `node audio-sync.js` (интерактивное меню), `node audio-sync.js list` (статус), `node audio-sync.js sync` (добавить недостающее), `node audio-sync.js force` (перезагрузить всё). Аудио скачивается из Google TTS, сохраняется локально в `audio/`, загружается в Anki. Имена файлов без префикса колоды (`eg_word.mp3`) чтобы переиспользовать между колодами.
