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

// Единый реестр разделов и тем: grammar/grammar-sections.json
// (общий для Grammar Navigator, Grammar Reader и Home Page — правим в одном месте)
const REGISTRY_PATH = 'grammar/grammar-sections.json';
const SECTIONS = JSON.parse(await app.vault.adapter.read(REGISTRY_PATH)).sections
  .map(sec => ({
    ...sec,
    topics: [
      ...(sec.intro ? [{ en: 'Введение', ru: sec.label + ' — обзор раздела', file: sec.intro, isIntro: true }] : []),
      ...sec.topics,
    ],
  }));

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

  // Links to the other two hubs
  const hubs = document.createElement('div');
  hubs.style.cssText = 'display:flex;gap:14px;margin:-8px 0 14px;font-size:12.5px';
  [['🗺 Grammar Map — по уровням', 'Grammar Map'], ['📖 Grammar Reader — чтение внутри', 'Grammar Reader']].forEach(([txt, file]) => {
    const a = document.createElement('a');
    a.textContent = txt;
    a.style.cssText = 'cursor:pointer;color:var(--text-muted)';
    a.addEventListener('click', e => app.workspace.openLinkText(file, '', e.ctrlKey || e.metaKey));
    hubs.appendChild(a);
  });
  wrap.appendChild(hubs);

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
