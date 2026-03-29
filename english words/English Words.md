---
cssclasses: [english-words-page]
---

```dataviewjs
// ════════════════════════════════════════════════════
//  ENGLISH WORDS — unified viewer
// ════════════════════════════════════════════════════

// ── Styles ──────────────────────────────────────────
if (!document.getElementById('ew-styles')) {
  const s = document.createElement('style');
  s.id = 'ew-styles';
  s.textContent = `
    .ew-wrap * { box-sizing: border-box; }

    .ew-title {
      font-size: 22px; font-weight: 700;
      color: var(--text-normal);
      margin-bottom: 16px;
    }

    .ew-search {
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
    .ew-search:focus { border-color: var(--interactive-accent); }
    .ew-search::placeholder { color: var(--text-muted); }

    .ew-tabs {
      display: flex; flex-wrap: wrap; gap: 7px;
      margin-bottom: 18px;
    }
    .ew-tab {
      padding: 6px 13px; border-radius: 20px; cursor: pointer;
      font-size: 12.5px; font-weight: 500;
      border: 1.5px solid var(--background-modifier-border);
      background: transparent; color: var(--text-muted);
      transition: all 0.15s; white-space: nowrap;
      display: flex; align-items: center; gap: 5px;
    }
    .ew-tab:hover { color: var(--text-normal); background: var(--background-secondary); }
    .ew-tab.ew-active {
      background: var(--ew-color, #3B82F6) !important;
      border-color: var(--ew-color, #3B82F6) !important;
      color: white !important;
    }
    .ew-tab-badge {
      background: rgba(255,255,255,0.3);
      border-radius: 10px; padding: 0 6px; font-size: 10px;
    }

    .ew-stats {
      font-size: 12px; color: var(--text-faint);
      margin-bottom: 12px;
    }

    .ew-table {
      width: 100%; border-collapse: collapse;
      font-size: 13.5px;
    }
    .ew-table th {
      text-align: left; padding: 8px 10px;
      font-size: 11px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.06em;
      color: var(--text-muted);
      border-bottom: 2px solid var(--background-modifier-border);
      position: sticky; top: 0;
      background: var(--background-primary);
      z-index: 1;
    }
    .ew-table td {
      padding: 7px 10px;
      border-bottom: 1px solid var(--background-modifier-border);
      vertical-align: top;
    }
    .ew-table tr:hover td {
      background: var(--background-secondary);
    }
    .ew-phrase {
      font-weight: 600; color: var(--text-normal);
    }
    .ew-detail {
      color: var(--interactive-accent); font-weight: 500;
    }
    .ew-example {
      color: var(--text-muted); font-style: italic; font-size: 12.5px;
    }
    .ew-translation {
      color: var(--text-normal); font-size: 12.5px;
    }

    .ew-empty {
      text-align: center; padding: 48px 0;
      color: var(--text-muted); font-size: 14px;
    }

    .ew-scroll {
      max-height: calc(100vh - 300px);
      overflow-y: auto;
      border-radius: 8px;
    }
  `;
  document.head.appendChild(s);
}

// ── Category config ─────────────────────────────────
const CATS = [
  { id: 'all', label: 'Все', icon: '📚', color: '#64748B' },
  { id: 'Глагол + предлог', label: 'Глагол + предлог', icon: '🔵', color: '#3B82F6' },
  { id: 'Прилагательное + предлог', label: 'Прилаг. + предлог', icon: '🟡', color: '#F59E0B' },
  { id: 'Существительное + предлог', label: 'Сущ. + предлог', icon: '🟢', color: '#10B981' },
  { id: 'Устойчивые выражения', label: 'Устойчивые выражения', icon: '🟣', color: '#8B5CF6' },
  { id: 'Make vs Do', label: 'Make vs Do', icon: '🔴', color: '#EF4444' },
  { id: 'Идиомы', label: 'Идиомы', icon: '🟠', color: '#F97316' },
  { id: 'Похожие слова (Confusing Words)', label: 'Похожие слова', icon: '⚪', color: '#6366F1' },
];

// ── Load CSV ────────────────────────────────────────
const csvFile = app.vault.getAbstractFileByPath("english words/english_words.csv");
if (!csvFile) { dv.paragraph("CSV файл не найден."); return; }

const raw = await app.vault.read(csvFile);
const lines = raw.split("\n").filter(l => l.trim());
const rows = [];

for (let i = 1; i < lines.length; i++) {
  // Parse CSV with quoted fields
  const parts = [];
  let current = "";
  let inQuotes = false;
  for (let c = 0; c < lines[i].length; c++) {
    const ch = lines[i][c];
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === ',' && !inQuotes) { parts.push(current); current = ""; continue; }
    current += ch;
  }
  parts.push(current);

  if (parts.length >= 5) {
    rows.push({
      category: parts[0].trim(),
      phrase: parts[1].trim(),
      detail: parts[2].trim(),
      example: parts[3].trim(),
      translation: parts[4].trim(),
    });
  }
}

// ── State ───────────────────────────────────────────
let activeId = 'all';
let query = '';

// ── Root ────────────────────────────────────────────
const root = dv.container;

function render() {
  root.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'ew-wrap';
  root.appendChild(wrap);

  // Title
  const title = document.createElement('div');
  title.className = 'ew-title';
  title.textContent = 'English Words';
  wrap.appendChild(title);

  // Search
  const searchEl = document.createElement('input');
  searchEl.type = 'text';
  searchEl.className = 'ew-search';
  searchEl.placeholder = 'Поиск по фразе, примеру или переводу...';
  searchEl.value = query;
  searchEl.addEventListener('input', e => {
    query = e.target.value;
    renderTabs();
    renderTable();
  });
  wrap.appendChild(searchEl);

  // Tabs
  const tabsEl = document.createElement('div');
  tabsEl.className = 'ew-tabs';
  wrap.appendChild(tabsEl);

  // Stats
  const statsEl = document.createElement('div');
  statsEl.className = 'ew-stats';
  wrap.appendChild(statsEl);

  // Table container
  const scrollEl = document.createElement('div');
  scrollEl.className = 'ew-scroll';
  wrap.appendChild(scrollEl);

  function filterRows() {
    let filtered = activeId === 'all' ? rows : rows.filter(r => r.category === activeId);
    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(r =>
        r.phrase.toLowerCase().includes(q) ||
        r.detail.toLowerCase().includes(q) ||
        r.example.toLowerCase().includes(q) ||
        r.translation.toLowerCase().includes(q)
      );
    }
    return filtered;
  }

  function renderTabs() {
    tabsEl.innerHTML = '';
    CATS.forEach(cat => {
      const catRows = cat.id === 'all' ? rows : rows.filter(r => r.category === cat.id);
      let count = catRows.length;
      if (query) {
        const q = query.toLowerCase();
        count = catRows.filter(r =>
          r.phrase.toLowerCase().includes(q) ||
          r.detail.toLowerCase().includes(q) ||
          r.example.toLowerCase().includes(q) ||
          r.translation.toLowerCase().includes(q)
        ).length;
      }
      if (query && count === 0 && cat.id !== 'all') return;

      const btn = document.createElement('button');
      btn.className = 'ew-tab' + (activeId === cat.id ? ' ew-active' : '');
      btn.style.setProperty('--ew-color', cat.color);
      if (activeId !== cat.id) {
        btn.addEventListener('mouseenter', () => {
          btn.style.borderColor = cat.color + '88';
          btn.style.color = cat.color;
        });
        btn.addEventListener('mouseleave', () => {
          btn.style.borderColor = '';
          btn.style.color = '';
        });
      }
      btn.innerHTML = `<span>${cat.icon}</span> <span>${cat.label}</span>` +
        `<span class="ew-tab-badge" style="${activeId !== cat.id ? `background:${cat.color}22;color:${cat.color}` : ''}">${count}</span>`;
      btn.addEventListener('click', () => { activeId = cat.id; renderTabs(); renderTable(); });
      tabsEl.appendChild(btn);
    });
  }

  function renderTable() {
    scrollEl.innerHTML = '';
    const filtered = filterRows();

    statsEl.textContent = `${filtered.length} из ${rows.length} записей`;

    if (filtered.length === 0) {
      scrollEl.innerHTML = `<div class="ew-empty">Ничего не найдено</div>`;
      return;
    }

    const hasDetail = filtered.some(r => r.detail && r.detail !== '—');

    const table = document.createElement('table');
    table.className = 'ew-table';

    const thead = document.createElement('thead');
    let headerHTML = '<tr><th>#</th><th>Phrase</th>';
    if (hasDetail) headerHTML += '<th>Detail</th>';
    headerHTML += '<th>Example</th><th>Перевод</th></tr>';
    thead.innerHTML = headerHTML;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    filtered.forEach((r, i) => {
      const tr = document.createElement('tr');
      let html = `<td style="color:var(--text-faint);font-size:11px;">${i + 1}</td>`;
      html += `<td class="ew-phrase">${r.phrase}</td>`;
      if (hasDetail) html += `<td class="ew-detail">${r.detail !== '—' ? r.detail : ''}</td>`;
      html += `<td class="ew-example">${r.example}</td>`;
      html += `<td class="ew-translation">${r.translation}</td>`;
      tr.innerHTML = html;
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    scrollEl.appendChild(table);
  }

  renderTabs();
  renderTable();

  if (query) {
    setTimeout(() => {
      const s = wrap.querySelector('.ew-search');
      if (s) { s.focus(); s.setSelectionRange(s.value.length, s.value.length); }
    }, 10);
  }
}

render();
```
