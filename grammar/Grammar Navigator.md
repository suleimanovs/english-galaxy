---
cssclasses: [grammar-navigator]
---

```dataviewjs
// ─────────────────────────────────────────────────────────────────
//  GRAMMAR NAVIGATOR
// ─────────────────────────────────────────────────────────────────

// Inject styles once
if (!document.getElementById('gn-styles')) {
  const s = document.createElement('style');
  s.id = 'gn-styles';
  s.textContent = `
    .gn-wrap * { box-sizing: border-box; }

    .gn-title {
      font-size: 22px; font-weight: 700;
      color: var(--text-normal);
      margin-bottom: 16px;
    }

    .gn-search {
      display: block; width: 100%; padding: 10px 16px 10px 40px;
      border-radius: 10px; margin-bottom: 16px;
      border: 1.5px solid var(--background-modifier-border);
      background: var(--background-secondary);
      color: var(--text-normal); font-size: 14px;
      outline: none; transition: border-color 0.2s;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23888' viewBox='0 0 16 16'%3E%3Cpath d='M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.099zm-5.242 1.656a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: 14px center;
    }
    .gn-search:focus { border-color: var(--interactive-accent); }
    .gn-search::placeholder { color: var(--text-muted); }

    .gn-tabs {
      display: flex; flex-wrap: wrap; gap: 7px;
      margin-bottom: 22px;
    }
    .gn-tab {
      padding: 6px 13px; border-radius: 20px; cursor: pointer;
      font-size: 12.5px; font-weight: 500;
      border: 1.5px solid var(--background-modifier-border);
      background: transparent; color: var(--text-muted);
      transition: all 0.15s; white-space: nowrap;
      display: flex; align-items: center; gap: 5px;
    }
    .gn-tab:hover { color: var(--text-normal); background: var(--background-secondary); }
    .gn-tab.gn-active {
      background: var(--gn-color, #3B82F6) !important;
      border-color: var(--gn-color, #3B82F6) !important;
      color: white !important;
    }
    .gn-tab-badge {
      background: rgba(255,255,255,0.3);
      border-radius: 10px; padding: 0 6px; font-size: 10px;
    }

    .gn-section-label {
      font-size: 11px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.08em; color: var(--text-muted);
      margin: 28px 0 10px; display: flex; align-items: center; gap: 7px;
    }
    .gn-section-label-dot {
      width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
    }

    .gn-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(195px, 1fr));
      gap: 9px; margin-bottom: 4px;
    }

    .gn-card {
      background: var(--background-secondary);
      border-radius: 10px; padding: 13px 15px;
      border-left: 3px solid var(--gn-color, #888);
      cursor: pointer; transition: transform 0.13s, box-shadow 0.13s;
      user-select: none;
    }
    .gn-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 18px rgba(0,0,0,0.13);
    }
    .gn-card-en {
      font-size: 13.5px; font-weight: 600;
      color: var(--text-normal); margin-bottom: 3px; line-height: 1.3;
    }
    .gn-card-ru {
      font-size: 11.5px; color: var(--text-muted); line-height: 1.3;
    }

    .gn-empty {
      text-align: center; padding: 48px 0; color: var(--text-muted);
      font-size: 14px;
    }

    .gn-stats {
      font-size: 12px; color: var(--text-faint);
      margin-bottom: 18px;
    }
  `;
  document.head.appendChild(s);
}

// ─── DATA ─────────────────────────────────────────────────────────

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
      { en: 'Modal Passive', ru: 'пассив + модальный глагол', file: 'Modal Passive — пассивный залог с модальными глаголами' },
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
      { en: 'Reported Speech', ru: 'косвенная речь', file: 'grammar/сomplex-сonstructions/Reported Speech — косвенная речь' },
      { en: 'Questions', ru: 'типы вопросов', file: 'grammar/сomplex-сonstructions/Questions — типы вопросов' },
      { en: 'Relative Clauses', ru: 'who, which, that, whose...', file: 'grammar/сomplex-сonstructions/Relative Clauses — относительные придаточные' },
      { en: 'Inversion', ru: 'инверсия', file: 'grammar/сomplex-сonstructions/Inversion — инверсия' },
      { en: 'Comparisons', ru: 'степени сравнения', file: 'grammar/сomplex-сonstructions/Comparisons — степени сравнения' },
      { en: 'Causative', ru: 'have / get something done', file: 'Causative — have, get something done' },
      { en: 'Subjunctive', ru: 'сослагательное наклонение', file: 'Subjunctive — сослагательное наклонение' },
      { en: 'Cleft Sentences', ru: 'расщеплённые предложения', file: 'Cleft Sentences — расщеплённые предложения' },
      { en: 'Emphasis', ru: 'конструкции усиления', file: 'Emphasis — конструкции усиления' },
      { en: 'Ellipsis & Substitution', ru: 'эллипсис и подстановка', file: 'Ellipsis & Substitution — эллипсис и подстановка' },
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

// ─── STATE ────────────────────────────────────────────────────────
let activeId = 'all';
let query = '';

// ─── ROOT ─────────────────────────────────────────────────────────
const root = dv.container;

function render() {
  root.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'gn-wrap';
  root.appendChild(wrap);

  // Title
  const title = document.createElement('div');
  title.className = 'gn-title';
  title.textContent = '📚 Grammar Navigator';
  wrap.appendChild(title);

  // Search
  const searchEl = document.createElement('input');
  searchEl.type = 'text';
  searchEl.className = 'gn-search';
  searchEl.placeholder = 'Поиск темы на английском или русском...';
  searchEl.value = query;
  searchEl.addEventListener('input', e => {
    query = e.target.value;
    renderTabs();
    renderCards();
  });
  wrap.appendChild(searchEl);

  // Tabs container
  const tabsEl = document.createElement('div');
  tabsEl.className = 'gn-tabs';
  wrap.appendChild(tabsEl);

  // Stats + cards container
  const statsEl = document.createElement('div');
  statsEl.className = 'gn-stats';
  wrap.appendChild(statsEl);

  const cardsEl = document.createElement('div');
  wrap.appendChild(cardsEl);

  // ── Render tabs ────────────────────────────────────
  function renderTabs() {
    tabsEl.innerHTML = '';

    const allCount = SECTIONS.reduce((sum, s) => sum + filterTopics(s.topics).length, 0);

    const allBtn = makeTab('📚', 'Все', allCount, activeId === 'all', '#888');
    allBtn.addEventListener('click', () => { activeId = 'all'; renderTabs(); renderCards(); });
    tabsEl.appendChild(allBtn);

    SECTIONS.forEach(sec => {
      const count = filterTopics(sec.topics).length;
      if (query && count === 0) return;
      const btn = makeTab(sec.icon, sec.label, query ? count : null, activeId === sec.id, sec.color);
      btn.addEventListener('click', () => { activeId = sec.id; renderTabs(); renderCards(); });
      tabsEl.appendChild(btn);
    });
  }

  function makeTab(icon, label, count, isActive, color) {
    const btn = document.createElement('button');
    btn.className = 'gn-tab' + (isActive ? ' gn-active' : '');
    btn.style.setProperty('--gn-color', color);
    if (isActive) {
      btn.style.setProperty('--gn-color', color);
    } else {
      btn.addEventListener('mouseenter', () => {
        btn.style.borderColor = color + '88';
        btn.style.color = color;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.borderColor = '';
        btn.style.color = '';
      });
    }
    const iconSpan = document.createElement('span');
    iconSpan.textContent = icon;
    btn.appendChild(iconSpan);
    const labelSpan = document.createElement('span');
    labelSpan.textContent = ' ' + label;
    btn.appendChild(labelSpan);
    if (count !== null) {
      const badge = document.createElement('span');
      badge.className = 'gn-tab-badge';
      badge.textContent = count;
      if (!isActive) {
        badge.style.background = color + '22';
        badge.style.color = color;
      }
      btn.appendChild(badge);
    }
    return btn;
  }

  // ── Filter helper ──────────────────────────────────
  function filterTopics(topics) {
    if (!query) return topics;
    const q = query.toLowerCase();
    return topics.filter(t => t.en.toLowerCase().includes(q) || t.ru.toLowerCase().includes(q));
  }

  // ── Render cards ───────────────────────────────────
  function renderCards() {
    cardsEl.innerHTML = '';
    statsEl.textContent = '';

    const visibleSecs = activeId === 'all'
      ? SECTIONS
      : SECTIONS.filter(s => s.id === activeId);

    let totalCount = 0;
    const frags = [];

    visibleSecs.forEach(sec => {
      const filtered = filterTopics(sec.topics);
      if (filtered.length === 0) return;
      totalCount += filtered.length;

      const frag = document.createDocumentFragment();

      if (activeId === 'all') {
        const lbl = document.createElement('div');
        lbl.className = 'gn-section-label';
        const dot = document.createElement('div');
        dot.className = 'gn-section-label-dot';
        dot.style.background = sec.color;
        lbl.appendChild(dot);
        lbl.appendChild(document.createTextNode(sec.icon + ' ' + sec.label));
        frag.appendChild(lbl);
      }

      const grid = document.createElement('div');
      grid.className = 'gn-grid';

      filtered.forEach(topic => {
        const card = document.createElement('div');
        card.className = 'gn-card';
        card.style.setProperty('--gn-color', sec.color);

        const enDiv = document.createElement('div');
        enDiv.className = 'gn-card-en';
        enDiv.textContent = topic.en;

        const ruDiv = document.createElement('div');
        ruDiv.className = 'gn-card-ru';
        ruDiv.textContent = topic.ru;

        card.appendChild(enDiv);
        card.appendChild(ruDiv);

        card.addEventListener('click', e => {
          app.workspace.openLinkText(topic.file, '', e.ctrlKey || e.metaKey);
        });

        grid.appendChild(card);
      });

      frag.appendChild(grid);
      frags.push(frag);
    });

    if (totalCount === 0) {
      const empty = document.createElement('div');
      empty.className = 'gn-empty';
      empty.innerHTML = '🔍 Ничего не найдено по запросу <strong>"' + query + '"</strong>';
      cardsEl.appendChild(empty);
      return;
    }

    statsEl.textContent = totalCount + (totalCount === 1 ? ' тема' : totalCount < 5 ? ' темы' : ' тем');
    frags.forEach(f => cardsEl.appendChild(f));
  }

  // Initial render
  renderTabs();
  renderCards();

  // Restore search focus if query exists
  if (query) {
    setTimeout(() => {
      const s = wrap.querySelector('.gn-search');
      if (s) { s.focus(); s.setSelectionRange(s.value.length, s.value.length); }
    }, 10);
  }
}

render();
```
