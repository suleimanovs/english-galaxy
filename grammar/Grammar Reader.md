---
cssclasses: [grammar-reader-page]
---

```dataviewjs
// ════════════════════════════════════════════════════
//  GRAMMAR READER  —  Inline reading experience
// ════════════════════════════════════════════════════

// ── Styles ───────────────────────────────────────────
if (!document.getElementById('gr2-styles')) {
  const s = document.createElement('style');
  s.id = 'gr2-styles';
  s.textContent = `
    .gr-app {
      display: flex;
      height: calc(100vh - 180px);
      min-height: 520px;
      border: 1px solid var(--background-modifier-border);
      border-radius: 14px;
      overflow: hidden;
      font-family: var(--font-interface);
      background: var(--background-primary);
    }

    /* ── Sidebar ── */
    .gr-sidebar {
      width: 242px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      background: var(--background-secondary);
      border-right: 1px solid var(--background-modifier-border);
      overflow: hidden;
    }
    .gr-sb-top {
      padding: 13px 12px 10px;
      border-bottom: 1px solid var(--background-modifier-border);
      flex-shrink: 0;
    }
    .gr-sb-title {
      font-size: 10.5px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.09em;
      color: var(--text-faint); margin-bottom: 9px;
    }
    .gr-sb-search {
      width: 100%; box-sizing: border-box;
      padding: 7px 10px 7px 30px;
      border-radius: 7px; font-size: 12px;
      border: 1.5px solid var(--background-modifier-border);
      background: var(--background-primary);
      color: var(--text-normal); outline: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='13' height='13' fill='%23999' viewBox='0 0 16 16'%3E%3Cpath d='M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM6.5 12a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: 10px center;
    }
    .gr-sb-search:focus { border-color: var(--interactive-accent); }

    .gr-sb-list {
      flex: 1; overflow-y: auto; padding: 6px 0 12px;
    }
    .gr-sb-list::-webkit-scrollbar { width: 3px; }
    .gr-sb-list::-webkit-scrollbar-thumb {
      background: var(--background-modifier-border); border-radius: 3px;
    }

    .gr-sec-hd {
      display: flex; align-items: center; gap: 6px;
      padding: 7px 12px 4px; cursor: pointer;
      user-select: none;
    }
    .gr-sec-hd:hover .gr-sec-label { color: var(--text-normal); }
    .gr-sec-dot {
      width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
    }
    .gr-sec-label {
      font-size: 10.5px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.08em; color: var(--text-faint); flex: 1;
    }
    .gr-sec-arrow {
      font-size: 8px; color: var(--text-faint);
      transition: transform 0.15s;
    }
    .gr-sec-arrow.open { transform: rotate(90deg); }

    .gr-sec-items { }
    .gr-sec-items.closed { display: none; }

    .gr-item {
      padding: 4px 12px 4px 22px; cursor: pointer;
      border-left: 2px solid transparent;
      transition: background 0.1s;
    }
    .gr-item:hover { background: var(--background-modifier-hover); }
    .gr-item.active {
      background: var(--background-modifier-hover);
      border-left-color: var(--gr-item-color, var(--interactive-accent));
    }
    .gr-item-en {
      font-size: 12.5px; font-weight: 500;
      color: var(--text-normal); line-height: 1.3;
    }
    .gr-item.active .gr-item-en {
      color: var(--gr-item-color, var(--interactive-accent));
    }
    .gr-item-ru {
      font-size: 11px; color: var(--text-faint); line-height: 1.2;
    }

    /* ── Main panel ── */
    .gr-main {
      flex: 1; min-width: 0;
      display: flex; flex-direction: column;
      overflow: hidden;
    }

    .gr-topbar {
      padding: 11px 22px 10px;
      border-bottom: 1px solid var(--background-modifier-border);
      display: flex; align-items: center; gap: 10px;
      flex-shrink: 0; min-height: 44px;
    }
    .gr-breadcrumb {
      display: flex; align-items: center; gap: 5px;
      font-size: 12px; color: var(--text-muted);
    }
    .gr-bc-dot {
      width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
    }
    .gr-bc-section { font-weight: 600; }
    .gr-bc-sep { opacity: 0.4; }
    .gr-bc-topic { color: var(--text-normal); font-weight: 600; }

    .gr-nav-btns {
      margin-left: auto; display: flex; gap: 6px;
    }
    .gr-nav-btn {
      padding: 4px 10px; border-radius: 6px; font-size: 11.5px;
      border: 1px solid var(--background-modifier-border);
      background: transparent; color: var(--text-muted);
      cursor: pointer; transition: all 0.12s;
    }
    .gr-nav-btn:hover:not(:disabled) {
      background: var(--background-secondary);
      color: var(--text-normal);
    }
    .gr-nav-btn:disabled { opacity: 0.3; cursor: default; }

    .gr-scroll {
      flex: 1; overflow-y: auto; padding: 28px 32px 40px;
    }
    .gr-scroll::-webkit-scrollbar { width: 5px; }
    .gr-scroll::-webkit-scrollbar-thumb {
      background: var(--background-modifier-border); border-radius: 4px;
    }

    /* Welcome screen */
    .gr-welcome {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; height: 100%;
      color: var(--text-muted); text-align: center; padding: 40px;
    }
    .gr-welcome-icon { font-size: 52px; margin-bottom: 16px; }
    .gr-welcome-h { font-size: 18px; font-weight: 700; color: var(--text-normal); margin-bottom: 8px; }
    .gr-welcome-p { font-size: 13px; line-height: 1.6; max-width: 300px; }

    /* Loading */
    .gr-loading {
      display: flex; align-items: center; justify-content: center;
      height: 100px; color: var(--text-muted); font-size: 13px;
    }

    /* ── Rendered document ── */
    .gr-doc { max-width: 720px; }
    .gr-doc > *:first-child { margin-top: 0 !important; }

    .gr-doc h1 {
      font-size: 24px; font-weight: 800; line-height: 1.2;
      margin: 0 0 6px !important;
      color: var(--text-normal);
      padding-bottom: 14px;
      border-bottom: 2.5px solid var(--gr-accent, var(--interactive-accent));
    }
    .gr-doc h2 {
      font-size: 17px; font-weight: 700;
      margin: 32px 0 12px !important;
      color: var(--text-normal);
      display: flex; align-items: center; gap: 9px;
    }
    .gr-doc h2::before {
      content: ''; display: inline-block;
      width: 4px; height: 17px; border-radius: 2px; flex-shrink: 0;
      background: var(--gr-accent, var(--interactive-accent));
    }
    .gr-doc h3 {
      font-size: 14.5px; font-weight: 700;
      margin: 22px 0 9px !important; color: var(--text-normal);
    }
    .gr-doc h4 {
      font-size: 12px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.06em;
      color: var(--text-muted); margin: 18px 0 8px !important;
    }

    .gr-doc p { margin: 0 0 13px !important; line-height: 1.68; font-size: 14px; }

    .gr-doc ul, .gr-doc ol {
      margin: 0 0 14px !important; padding-left: 22px;
    }
    .gr-doc li { margin-bottom: 4px; line-height: 1.65; font-size: 14px; }

    .gr-doc code {
      background: var(--background-secondary);
      border-radius: 4px; padding: 1px 6px;
      font-size: 12.5px; font-family: var(--font-monospace);
      color: var(--gr-accent, var(--text-accent));
      border: 1px solid var(--background-modifier-border);
    }
    .gr-doc pre {
      background: var(--background-secondary);
      border-radius: 9px; padding: 15px 18px; margin: 0 0 16px !important;
      overflow-x: auto; border: 1px solid var(--background-modifier-border);
    }
    .gr-doc pre code {
      background: none; padding: 0; border: none; font-size: 13px;
      border-radius: 0; color: var(--text-normal);
    }

    .gr-doc blockquote {
      border-left: 3.5px solid var(--gr-accent, var(--interactive-accent));
      margin: 0 0 16px !important; padding: 11px 16px;
      background: var(--gr-accent-bg, var(--background-secondary));
      border-radius: 0 8px 8px 0; font-size: 13.5px; line-height: 1.65;
      color: var(--text-normal);
    }
    .gr-doc blockquote p { margin: 0 !important; }

    .gr-doc table {
      width: 100%; border-collapse: collapse;
      margin: 0 0 20px !important; font-size: 13px;
      border-radius: 9px; overflow: hidden;
      border: 1px solid var(--background-modifier-border);
    }
    .gr-doc thead { background: var(--gr-accent, var(--interactive-accent)); }
    .gr-doc thead th {
      color: white; padding: 9px 13px; text-align: left;
      font-weight: 600; font-size: 12px; letter-spacing: 0.02em;
    }
    .gr-doc tbody tr {
      border-bottom: 1px solid var(--background-modifier-border);
    }
    .gr-doc tbody tr:last-child { border-bottom: none; }
    .gr-doc tbody tr:nth-child(even) { background: var(--background-secondary); }
    .gr-doc tbody td { padding: 8px 13px; vertical-align: top; line-height: 1.5; }

    .gr-doc hr {
      border: none;
      border-top: 1px solid var(--background-modifier-border);
      margin: 22px 0 !important;
    }

    .gr-doc strong { font-weight: 700; }

    /* Callout / admonition boxes */
    .gr-doc .callout {
      border-radius: 8px; margin: 0 0 16px; overflow: hidden;
    }

    /* Bottom navigation */
    .gr-doc-footer {
      display: flex; justify-content: space-between; align-items: center;
      margin-top: 40px; padding-top: 20px;
      border-top: 1px solid var(--background-modifier-border);
    }
    .gr-doc-nav-btn {
      display: flex; flex-direction: column;
      padding: 10px 16px; border-radius: 8px; cursor: pointer;
      border: 1px solid var(--background-modifier-border);
      background: transparent; transition: all 0.12s;
      max-width: 220px; text-align: left;
    }
    .gr-doc-nav-btn:hover { background: var(--background-secondary); }
    .gr-doc-nav-btn.right { text-align: right; }
    .gr-doc-nav-btn.disabled { opacity: 0.3; cursor: default; pointer-events: none; }
    .gr-doc-nav-hint { font-size: 10.5px; color: var(--text-faint); margin-bottom: 2px; }
    .gr-doc-nav-title { font-size: 13px; font-weight: 600; color: var(--text-normal); }
  `;
  document.head.appendChild(s);
}

// ── Data ─────────────────────────────────────────────
const SECTIONS = [
  {
    id: 'times', icon: '⏱', label: 'Времена', color: '#3B82F6',
    topics: [
      { en: 'Обзор всех времён', ru: 'Полная сравнительная таблица', file: 'Времена в английском' },
      { en: 'Present Simple', ru: 'Настоящее простое', file: 'Present Simple — Настоящее простое время' },
      { en: 'Present Continuous', ru: 'Настоящее продолженное', file: 'Present Continuous — Настоящее продолженное время' },
      { en: 'Present Perfect', ru: 'Настоящее совершённое', file: 'Present Perfect — Настоящее совершённое время' },
      { en: 'Present Perfect Continuous', ru: 'Настоящее совер. продолженное', file: 'Present Perfect Continuous — Настоящее совершённое продолженное время' },
      { en: 'Past Simple', ru: 'Прошедшее простое', file: 'Past Simple — Прошедшее простое время' },
      { en: 'Past Continuous', ru: 'Прошедшее продолженное', file: 'Past Continuous — Прошедшее продолженное время' },
      { en: 'Past Perfect', ru: 'Прошедшее совершённое', file: 'Past Perfect — Прошедшее совершённое время' },
      { en: 'Past Perfect Continuous', ru: 'Прошедшее совер. продолженное', file: 'Past Perfect Continuous — Прошедшее совершённое продолженное время' },
      { en: 'Future Simple — will', ru: 'Будущее простое', file: 'Future Simple — will' },
      { en: 'Future Continuous', ru: 'will be + V-ing', file: 'Future Continuous — will be + ing' },
      { en: 'Future Perfect', ru: 'will have + V3', file: 'Future Perfect — will have + V3' },
      { en: 'Future Perfect Continuous', ru: 'will have been + ing', file: 'Future Perfect Continuous — will have been + ing' },
      { en: 'Be Going To', ru: 'намерение / предсказание', file: 'Be Going To — намерение и предсказание по признакам' },
      { en: 'Present Cont. → будущее', ru: 'конкретные договорённости', file: 'Present Continuous для будущего — конкретные договорённости' },
      { en: 'Shall', ru: 'предложения и формальный стиль', file: 'Shall — предложения и формальный стиль' },
      { en: 'Future in the Past', ru: 'будущее в прошедшем', file: 'Future in the Past — будущее в прошедшем' },
    ]
  },
  {
    id: 'articles', icon: '📌', label: 'Артикли и Местоимения', color: '#8B5CF6',
    topics: [
      { en: 'Articles', ru: 'a, an, the, нулевой артикль', file: 'Articles — артикли (a, an, the, нулевой)' },
      { en: 'Possessive Pronouns', ru: 'my, your, his, her...', file: 'Possessive Pronouns — притяжательные местоимения' },
      { en: 'Reflexive Pronouns', ru: 'myself, yourself...', file: 'Reflexive Pronouns — возвратные местоимения' },
      { en: 'Demonstrative Pronouns', ru: 'this, that, these, those', file: 'Demonstrative Pronouns — указательные местоимения (this, that, these, those)' },
      { en: 'Indefinite Pronouns', ru: 'some, any, every, no...', file: 'Indefinite Pronouns — неопределённые местоимения и квантификаторы' },
      { en: 'Determiners', ru: 'each, every, all, both...', file: 'Determiners — определители (each, every, all, whole, both, either, neither)' },
    ]
  },
  {
    id: 'nouns', icon: '📦', label: 'Существительные', color: '#10B981',
    topics: [
      { en: 'Countable & Uncountable', ru: 'исчисляемые и неисчисляемые', file: 'Countable and Uncountable Nouns — исчисляемые и неисчисляемые' },
      { en: 'Plural Forms', ru: 'множественное число', file: 'Plural Forms — множественное число' },
      { en: 'Possessive Case', ru: "'s и of", file: "Possessive Case — притяжательный падеж ('s vs of)" },
    ]
  },
  {
    id: 'adj', icon: '🎨', label: 'Прилагательные', color: '#F59E0B',
    topics: [
      { en: 'Adjective Order', ru: 'порядок прилагательных', file: 'Adjective Order — порядок прилагательных' },
      { en: 'Adjectives -ed / -ing', ru: 'boring vs bored', file: 'Adjectives -ed and -ing — прилагательные на -ed и -ing' },
      { en: 'Adjective + Preposition', ru: 'afraid of, good at...', file: 'Adjective Preposition Patterns — прилагательное + предлог' },
    ]
  },
  {
    id: 'modals', icon: '🔧', label: 'Модальные глаголы', color: '#EF4444',
    topics: [
      { en: 'Can / Could', ru: 'умение, возможность, разрешение', file: 'Can и Could — умение, возможность, разрешение' },
      { en: 'May / Might', ru: 'разрешение, вероятность', file: 'May и Might — разрешение, вероятность' },
      { en: 'Must', ru: 'необходимость, запрет, уверенность', file: 'Must — необходимость, запрет, уверенное предположение' },
      { en: 'Shall / Should', ru: 'советы, обязанность', file: 'Shall и Should — предложения, советы, обязанность' },
      { en: 'Will / Would', ru: 'будущее, вежливость, привычки', file: 'Will и Would — будущее, вежливость, привычки' },
      { en: 'Ought To', ru: 'моральная обязанность', file: 'Ought To — моральная обязанность' },
      { en: 'Need / Dare', ru: 'необходимость и смелость', file: 'Need и Dare — необходимость и смелость' },
    ]
  },
  {
    id: 'nonfinite', icon: '🔄', label: 'Неличные формы', color: '#06B6D4',
    topics: [
      { en: 'Infinitive', ru: 'инфинитив (to do)', file: 'Infinitive — инфинитив' },
      { en: 'Gerund', ru: 'герундий (doing)', file: 'Gerund — герундий' },
      { en: 'Participle', ru: 'причастие I и II', file: 'Participle — причастие (Participle I и Participle II)' },
    ]
  },
  {
    id: 'voices', icon: '🔊', label: 'Залог', color: '#EC4899',
    topics: [
      { en: 'Active Voice', ru: 'активный залог', file: 'Active Voice — активный залог' },
      { en: 'Passive Voice', ru: 'пассивный залог', file: 'Passive Voice — пассивный залог' },
      { en: 'Modal Passive', ru: 'пассив + модальный', file: 'Modal Passive — пассивный залог с модальными глаголами' },
    ]
  },
  {
    id: 'cond', icon: '❓', label: 'Условные предложения', color: '#D97706',
    topics: [
      { en: 'Zero Conditional', ru: 'нулевое условие', file: 'Zero Conditional — нулевое условие' },
      { en: 'First Conditional', ru: 'реальное условие', file: 'First Conditional — первое условие (реальное)' },
      { en: 'Second Conditional', ru: 'нереальное настоящее', file: 'Second Conditional — второе условие (нереальное настоящее)' },
      { en: 'Third Conditional', ru: 'нереальное прошлое', file: 'Third Conditional — третье условие (нереальное прошлое)' },
      { en: 'Mixed Conditionals', ru: 'смешанные условия', file: 'Mixed Conditionals — смешанные условия' },
      { en: 'Wish Constructions', ru: 'I wish / If only', file: 'Wish Constructions — конструкции с wish' },
    ]
  },
  {
    id: 'complex', icon: '🏗', label: 'Сложные конструкции', color: '#6366F1',
    topics: [
      { en: 'Reported Speech', ru: 'косвенная речь', file: 'grammar/complex-constructions/Reported Speech — косвенная речь' },
      { en: 'Questions', ru: 'типы вопросов', file: 'grammar/complex-constructions/Questions — типы вопросов' },
      { en: 'Relative Clauses', ru: 'who, which, that, whose...', file: 'grammar/complex-constructions/Relative Clauses — относительные придаточные' },
      { en: 'Inversion', ru: 'инверсия', file: 'grammar/complex-constructions/Inversion — инверсия' },
      { en: 'Comparisons', ru: 'степени сравнения', file: 'grammar/complex-constructions/Comparisons — степени сравнения' },
      { en: 'Causative', ru: 'have / get something done', file: 'Causative — have, get something done' },
      { en: 'Subjunctive', ru: 'сослагательное наклонение', file: 'Subjunctive — сослагательное наклонение' },
      { en: 'Cleft Sentences', ru: 'расщеплённые предложения', file: 'Cleft Sentences — расщеплённые предложения' },
      { en: 'Emphasis', ru: 'конструкции усиления', file: 'Emphasis — конструкции усиления' },
      { en: 'Ellipsis & Substitution', ru: 'эллипсис и подстановка', file: 'Ellipsis & Substitution — эллипсис и подстановка' },
      { en: 'Noun Clauses', ru: 'придаточные существительные', file: 'Noun Clauses — придаточные существительные' },
      { en: 'Embedded Questions', ru: 'косвенные вопросы', file: 'Embedded Questions — косвенные вопросы' },
    ]
  },
  {
    id: 'misc', icon: '🗂', label: 'Разное', color: '#64748B',
    topics: [
      { en: 'Adverbs', ru: 'наречия', file: 'Adverbs — наречия' },
      { en: 'Prepositions', ru: 'предлоги', file: 'Prepositions — предлоги' },
      { en: 'Conjunctions', ru: 'союзы', file: 'Conjunctions — союзы' },
      { en: 'Purpose Clauses', ru: 'to / in order to / so that', file: 'Purpose Clauses — конструкции выражения цели' },
      { en: 'Tenses in Adverbial Clauses', ru: 'времена в придаточных', file: 'Tenses in Adverbial Clauses — времена в придаточных предложениях' },
      { en: 'Reported Requests', ru: 'косвенные просьбы и приказы', file: 'Reported Requests — косвенные просьбы и приказы' },
      { en: 'Used To', ru: 'привычки и адаптация', file: 'Used To — used to, would, be used to, get used to' },
      { en: 'Word Order', ru: 'порядок слов (SVO, SVOMPT)', file: 'Word Order — порядок слов' },
      { en: 'So / Such / Too / Enough', ru: 'усилители и ограничители', file: 'So, Such, Too, Enough — усилители и ограничители' },
      { en: 'There Is / It Is', ru: 'вводные конструкции', file: 'There Is, It Is — вводные конструкции' },
      { en: 'Linking Words', ru: 'however, therefore, moreover...', file: 'Linking Words — дискурсивные маркеры' },
      { en: 'Word Formation', ru: 'словообразование', file: 'Word Formation — словообразование' },
    ]
  },
  {
    id: 'phrasal', icon: '💬', label: 'Фразовые глаголы', color: '#16A34A',
    topics: [
      { en: 'Phrasal Verbs', ru: 'break up, give in, look after...', file: 'Phrasal Verbs — фразовые глаголы' },
    ]
  },
];

// flat list of all topics with section info
const ALL_TOPICS = [];
SECTIONS.forEach(sec => sec.topics.forEach((t, i) => ALL_TOPICS.push({ ...t, sec, idx: i })));

// ── State ─────────────────────────────────────────────
let activeTopic = null;  // { ...topic, sec, idx }
let query = '';
const openSections = new Set(SECTIONS.map(s => s.id)); // all open by default

// ── DOM refs (set after render) ───────────────────────
let sbListEl, mainScrollEl, topbarEl;

// ── Helpers ───────────────────────────────────────────
function hexAlpha(hex, a) {
  // hex: '#RRGGBB', a: 0-1  →  rgba string
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}

function findVaultFile(fileRef) {
  // Try metadataCache first (handles wiki-link style names)
  const file = app.metadataCache.getFirstLinkpathDest(fileRef, '');
  if (file) return file;
  // Fallback: search by basename
  const name = fileRef.split('/').pop();
  return app.vault.getMarkdownFiles().find(f => f.basename === name) || null;
}

function getAdjacentTopic(dir) {
  if (!activeTopic) return null;
  const list = ALL_TOPICS.filter(t => !query || matchQuery(t));
  const ci = list.findIndex(t => t.file === activeTopic.file);
  if (ci === -1) return null;
  const ni = ci + dir;
  return ni >= 0 && ni < list.length ? list[ni] : null;
}

function matchQuery(t) {
  const q = query.toLowerCase();
  return t.en.toLowerCase().includes(q) || t.ru.toLowerCase().includes(q);
}

// ── Build DOM ─────────────────────────────────────────
const root = dv.container;
root.innerHTML = '';

const app_el = document.createElement('div');
app_el.className = 'gr-app';
root.appendChild(app_el);

// ─ Sidebar ────────────────────────────────────────────
const sidebar = document.createElement('div');
sidebar.className = 'gr-sidebar';
app_el.appendChild(sidebar);

// Sidebar top
const sbTop = document.createElement('div');
sbTop.className = 'gr-sb-top';
sbTop.innerHTML = '<div class="gr-sb-title">Grammar Topics</div>';

const searchEl = document.createElement('input');
searchEl.type = 'text';
searchEl.className = 'gr-sb-search';
searchEl.placeholder = 'Поиск...';
searchEl.addEventListener('input', e => {
  query = e.target.value;
  renderSidebar();
});
sbTop.appendChild(searchEl);
sidebar.appendChild(sbTop);

// Sidebar list
sbListEl = document.createElement('div');
sbListEl.className = 'gr-sb-list';
sidebar.appendChild(sbListEl);

// ─ Main panel ─────────────────────────────────────────
const mainEl = document.createElement('div');
mainEl.className = 'gr-main';
app_el.appendChild(mainEl);

topbarEl = document.createElement('div');
topbarEl.className = 'gr-topbar';
mainEl.appendChild(topbarEl);

mainScrollEl = document.createElement('div');
mainScrollEl.className = 'gr-scroll';
mainEl.appendChild(mainScrollEl);

// ── Render sidebar ────────────────────────────────────
function renderSidebar() {
  sbListEl.innerHTML = '';

  SECTIONS.forEach(sec => {
    const filteredTopics = sec.topics.filter(t => !query || matchQuery(t));
    if (query && filteredTopics.length === 0) return;

    // Section header
    const hd = document.createElement('div');
    hd.className = 'gr-sec-hd';

    const dot = document.createElement('div');
    dot.className = 'gr-sec-dot';
    dot.style.background = sec.color;

    const lbl = document.createElement('span');
    lbl.className = 'gr-sec-label';
    lbl.textContent = sec.icon + ' ' + sec.label;

    const arr = document.createElement('span');
    arr.className = 'gr-sec-arrow' + (openSections.has(sec.id) ? ' open' : '');
    arr.textContent = '▶';

    hd.appendChild(dot);
    hd.appendChild(lbl);
    hd.appendChild(arr);

    const itemsEl = document.createElement('div');
    itemsEl.className = 'gr-sec-items' + (openSections.has(sec.id) ? '' : ' closed');

    hd.addEventListener('click', () => {
      if (openSections.has(sec.id)) openSections.delete(sec.id);
      else openSections.add(sec.id);
      arr.className = 'gr-sec-arrow' + (openSections.has(sec.id) ? ' open' : '');
      itemsEl.className = 'gr-sec-items' + (openSections.has(sec.id) ? '' : ' closed');
    });

    (query ? filteredTopics : sec.topics).forEach((topic, i) => {
      const item = document.createElement('div');
      item.className = 'gr-item' + (activeTopic && activeTopic.file === topic.file ? ' active' : '');
      item.style.setProperty('--gr-item-color', sec.color);

      const en = document.createElement('div');
      en.className = 'gr-item-en';
      en.textContent = topic.en;

      const ru = document.createElement('div');
      ru.className = 'gr-item-ru';
      ru.textContent = topic.ru;

      item.appendChild(en);
      item.appendChild(ru);
      item.addEventListener('click', () => selectTopic({ ...topic, sec }));
      itemsEl.appendChild(item);
    });

    sbListEl.appendChild(hd);
    sbListEl.appendChild(itemsEl);
  });
}

// ── Render topbar ─────────────────────────────────────
function renderTopbar() {
  topbarEl.innerHTML = '';

  if (!activeTopic) {
    const hint = document.createElement('div');
    hint.style.cssText = 'font-size:12px;color:var(--text-faint)';
    hint.textContent = 'Выберите тему в списке слева';
    topbarEl.appendChild(hint);
    return;
  }

  const bc = document.createElement('div');
  bc.className = 'gr-breadcrumb';

  const dot = document.createElement('span');
  dot.className = 'gr-bc-dot';
  dot.style.background = activeTopic.sec.color;

  const secSpan = document.createElement('span');
  secSpan.className = 'gr-bc-section';
  secSpan.style.color = activeTopic.sec.color;
  secSpan.textContent = activeTopic.sec.label;

  const sep = document.createElement('span');
  sep.className = 'gr-bc-sep';
  sep.textContent = '/';

  const topicSpan = document.createElement('span');
  topicSpan.className = 'gr-bc-topic';
  topicSpan.textContent = activeTopic.en;

  bc.appendChild(dot);
  bc.appendChild(secSpan);
  bc.appendChild(sep);
  bc.appendChild(topicSpan);
  topbarEl.appendChild(bc);

  // Nav buttons
  const navBtns = document.createElement('div');
  navBtns.className = 'gr-nav-btns';

  const prev = getAdjacentTopic(-1);
  const next = getAdjacentTopic(1);

  const prevBtn = document.createElement('button');
  prevBtn.className = 'gr-nav-btn' + (prev ? '' : '');
  prevBtn.textContent = '← Назад';
  prevBtn.disabled = !prev;
  if (prev) prevBtn.title = prev.en;
  prevBtn.addEventListener('click', () => prev && selectTopic(prev));

  const nextBtn = document.createElement('button');
  nextBtn.className = 'gr-nav-btn';
  nextBtn.textContent = 'Вперёд →';
  nextBtn.disabled = !next;
  if (next) nextBtn.title = next.en;
  nextBtn.addEventListener('click', () => next && selectTopic(next));

  navBtns.appendChild(prevBtn);
  navBtns.appendChild(nextBtn);
  topbarEl.appendChild(navBtns);
}

// ── Welcome screen ────────────────────────────────────
function showWelcome() {
  mainScrollEl.innerHTML = '';
  const w = document.createElement('div');
  w.className = 'gr-welcome';
  w.innerHTML = `
    <div class="gr-welcome-icon">📖</div>
    <div class="gr-welcome-h">Grammar Reader</div>
    <div class="gr-welcome-p">Выберите тему в списке слева — содержание откроется здесь с красивым форматированием.</div>
  `;
  mainScrollEl.appendChild(w);
}

// ── Select & load topic ───────────────────────────────
async function selectTopic(topic) {
  activeTopic = topic;
  renderSidebar();
  renderTopbar();

  // Loading state
  mainScrollEl.innerHTML = '';
  const loading = document.createElement('div');
  loading.className = 'gr-loading';
  loading.textContent = '⏳ Загрузка...';
  mainScrollEl.appendChild(loading);

  // Find file
  const vFile = findVaultFile(topic.file);
  if (!vFile) {
    mainScrollEl.innerHTML = `<div class="gr-loading">⚠️ Файл не найден: ${topic.file}</div>`;
    return;
  }

  // Read content
  let content;
  try {
    content = await app.vault.cachedRead(vFile);
  } catch(e) {
    mainScrollEl.innerHTML = `<div class="gr-loading">⚠️ Ошибка чтения файла</div>`;
    return;
  }

  // Render
  mainScrollEl.innerHTML = '';

  const doc = document.createElement('div');
  doc.className = 'gr-doc';

  // Set accent color for this section
  doc.style.setProperty('--gr-accent', topic.sec.color);
  doc.style.setProperty('--gr-accent-bg', hexAlpha(topic.sec.color, 0.08));

  mainScrollEl.appendChild(doc);
  mainScrollEl.scrollTop = 0;

  // Use Obsidian's MarkdownRenderer
  try {
    const { MarkdownRenderer, Component } = require('obsidian');
    const comp = new Component();
    comp.load();

    if (typeof MarkdownRenderer.render === 'function') {
      await MarkdownRenderer.render(app, content, doc, vFile.path, comp);
    } else if (typeof MarkdownRenderer.renderMarkdown === 'function') {
      await MarkdownRenderer.renderMarkdown(content, doc, vFile.path, comp);
    }
  } catch(e) {
    // Fallback: simple pre
    doc.innerHTML = `<pre style="white-space:pre-wrap;font-size:13px;line-height:1.6">${content.replace(/</g,'&lt;')}</pre>`;
  }

  // Append prev/next footer
  const prev = getAdjacentTopic(-1);
  const next = getAdjacentTopic(1);

  const footer = document.createElement('div');
  footer.className = 'gr-doc-footer';

  const prevBox = document.createElement('div');
  prevBox.className = 'gr-doc-nav-btn' + (prev ? '' : ' disabled');
  prevBox.innerHTML = `<div class="gr-doc-nav-hint">← Предыдущая</div><div class="gr-doc-nav-title">${prev ? prev.en : '—'}</div>`;
  if (prev) prevBox.addEventListener('click', () => selectTopic(prev));

  const nextBox = document.createElement('div');
  nextBox.className = 'gr-doc-nav-btn right' + (next ? '' : ' disabled');
  nextBox.innerHTML = `<div class="gr-doc-nav-hint">Следующая →</div><div class="gr-doc-nav-title">${next ? next.en : '—'}</div>`;
  if (next) nextBox.addEventListener('click', () => selectTopic(next));

  footer.appendChild(prevBox);
  footer.appendChild(nextBox);
  doc.appendChild(footer);
}

// ── Init ──────────────────────────────────────────────
renderSidebar();
renderTopbar();
showWelcome();
```
