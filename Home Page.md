## Статистика

```dataviewjs
(async () => {
	const allFiles = app.vault.getMarkdownFiles().filter(f =>
		(f.path.startsWith("english-galaxy-titanium-course/") ||
		 f.path.startsWith("english-galaxy-turquoise-course/") ||
		 f.path.startsWith("learn-5000-english-words/")) &&
		f.name !== "Home Page.md"
	);

	const dates = [];
	for (const file of allFiles) {
		const content = await app.vault.cachedRead(file);
		const match = content.match(/\*\*Дата изучения:\*\*\s+(\d{2})\.(\d{2})\.(\d{4})/);
		if (match && match[1] !== "00") {
			dates.push(`${match[3]}-${match[2]}-${match[1]}`);
		}
	}

	// Today & boundaries
	const now = new Date();
	const todayStr = now.toISOString().slice(0, 10);
	const dayOfWeek = (now.getDay() + 6) % 7; // Mon=0
	const weekStart = new Date(now);
	weekStart.setDate(now.getDate() - dayOfWeek);
	const weekStartStr = weekStart.toISOString().slice(0, 10);
	const monthStartStr = todayStr.slice(0, 8) + "01";

	const thisWeek = dates.filter(d => d >= weekStartStr).length;
	const thisMonth = dates.filter(d => d >= monthStartStr).length;
	const today = dates.filter(d => d === todayStr).length;

	// Streak calculation
	const uniqueDays = [...new Set(dates)].sort().reverse();
	let streak = 0;
	let checkDate = new Date(now);
	// If nothing today, start checking from yesterday
	if (!uniqueDays.includes(todayStr)) {
		checkDate.setDate(checkDate.getDate() - 1);
	}
	for (let i = 0; i < 365; i++) {
		const ds = checkDate.toISOString().slice(0, 10);
		if (uniqueDays.includes(ds)) {
			streak++;
			checkDate.setDate(checkDate.getDate() - 1);
		} else {
			break;
		}
	}

	const streakIcon = streak >= 7 ? "🔥" : streak >= 3 ? "⚡" : "📅";

	dv.table(
		["Сегодня", "На этой неделе", "За месяц", `${streakIcon} Серия дней`],
		[[`**${today}**`, `**${thisWeek}**`, `**${thisMonth}**`, `**${streak}**`]]
	);
})()
```

## Продолжить обучение

```dataviewjs
(async () => {
	const courses = [
		{ name: "Turquoise", base: "english-galaxy-turquoise-course", levels: ["A2","B1","B2","C1"] },
		{ name: "Titanium", base: "english-galaxy-titanium-course", levels: ["A0","A1","A2","B1","B2","С1"] },
		{ name: "5000 Words", base: "learn-5000-english-words", levels: null },
	];

	const rows = [];

	for (const course of courses) {
		let found = false;
		const folders = course.levels
			? course.levels.map(l => ({ level: l, path: `${course.base}/${l}` }))
			: [{ level: "", path: course.base }];

		for (const { level, path } of folders) {
			const folder = app.vault.getAbstractFileByPath(path);
			if (!folder?.children) continue;

			const files = folder.children
				.filter(f => f.name.endsWith(".md"))
				.sort((a, b) => {
					const na = parseInt(a.name.match(/Lesson\s*(\d+)/)?.[1] || "999");
					const nb = parseInt(b.name.match(/Lesson\s*(\d+)/)?.[1] || "999");
					return na - nb;
				});

			for (const file of files) {
				const content = await app.vault.cachedRead(file);
				const match = content.match(/\*\*Дата изучения:\*\*\s+(\S+)/);
				if (!match || match[1].startsWith("00.00")) {
					const label = level ? `${course.name} — ${level}` : course.name;
					rows.push([label, dv.fileLink(file.path.replace(".md", ""))]);
					found = true;
					break;
				}
			}
			if (found) break;
		}
		if (!found) {
			rows.push([course.name, "✅ Все уроки пройдены!"]);
		}
	}

	dv.table(["Курс", "Следующий урок"], rows);
})()
```

## Turquoise Course

```dataviewjs
(async () => {
	const levels = ["A2", "B1", "B2", "C1"];
	const basePath = "english-galaxy-turquoise-course";
	const rows = [];
	let totalDone = 0, totalAll = 0;

	for (const level of levels) {
		const folder = app.vault.getAbstractFileByPath(`${basePath}/${level}`);
		if (!folder?.children) { rows.push([level, 0, 0, "░░░░░░░░░░ 0%"]); continue; }

		const files = folder.children.filter(f => f.name.endsWith(".md"));
		let done = 0;

		for (const file of files) {
			const content = await app.vault.cachedRead(file);
			const match = content.match(/\*\*Дата изучения:\*\*\s+(\S+)/);
			if (match && !match[1].startsWith("00.00")) done++;
		}

		const pct = files.length > 0 ? Math.round(done / files.length * 100) : 0;
		const filled = Math.round(pct / 10);
		const bar = "█".repeat(filled) + "░".repeat(10 - filled);
		rows.push([level, done, files.length, `${bar} ${pct}%`]);
		totalDone += done;
		totalAll += files.length;
	}

	const totalPct = totalAll > 0 ? Math.round(totalDone / totalAll * 100) : 0;
	const totalFilled = Math.round(totalPct / 10);
	const totalBar = "█".repeat(totalFilled) + "░".repeat(10 - totalFilled);
	rows.push(["**Итого**", `**${totalDone}**`, `**${totalAll}**`, `**${totalBar} ${totalPct}%**`]);

	dv.table(["Уровень", "Пройдено", "Всего", "Прогресс"], rows);
})()
```

## Titanium Course

```dataviewjs
(async () => {
	const levels = ["A0", "A1", "A2", "B1", "B2", "С1"];
	const basePath = "english-galaxy-titanium-course";
	const rows = [];
	let totalDone = 0, totalAll = 0;

	for (const level of levels) {
		const folder = app.vault.getAbstractFileByPath(`${basePath}/${level}`);
		if (!folder?.children) { rows.push([level, 0, 0, "░░░░░░░░░░ 0%"]); continue; }

		const files = folder.children.filter(f => f.name.endsWith(".md"));
		let done = 0;

		for (const file of files) {
			const content = await app.vault.cachedRead(file);
			const match = content.match(/\*\*Дата изучения:\*\*\s+(\S+)/);
			if (match && !match[1].startsWith("00.00")) done++;
		}

		const pct = files.length > 0 ? Math.round(done / files.length * 100) : 0;
		const filled = Math.round(pct / 10);
		const bar = "█".repeat(filled) + "░".repeat(10 - filled);
		rows.push([level, done, files.length, `${bar} ${pct}%`]);
		totalDone += done;
		totalAll += files.length;
	}

	const totalPct = totalAll > 0 ? Math.round(totalDone / totalAll * 100) : 0;
	const totalFilled = Math.round(totalPct / 10);
	const totalBar = "█".repeat(totalFilled) + "░".repeat(10 - totalFilled);
	rows.push(["**Итого**", `**${totalDone}**`, `**${totalAll}**`, `**${totalBar} ${totalPct}%**`]);

	dv.table(["Уровень", "Пройдено", "Всего", "Прогресс"], rows);
})()
```

## 5000 English Words

```dataviewjs
(async () => {
	const folder = app.vault.getAbstractFileByPath("learn-5000-english-words");
	if (!folder?.children) { dv.paragraph("Папка не найдена."); return; }

	const files = folder.children.filter(f => f.name.endsWith(".md"));
	let done = 0;

	for (const file of files) {
		const content = await app.vault.cachedRead(file);
		const match = content.match(/\*\*Дата изучения:\*\*\s+(\S+)/);
		if (match && !match[1].startsWith("00.00")) done++;
	}

	const pct = files.length > 0 ? Math.round(done / files.length * 100) : 0;
	const filled = Math.round(pct / 10);
	const bar = "█".repeat(filled) + "░".repeat(10 - filled);

	dv.table(["Пройдено", "Всего", "Прогресс"], [[done, files.length, `${bar} ${pct}%`]]);
})()
```

## Грамматика

```dataviewjs
(async () => {
	const sections = [
		{ name: "Времена", folder: "grammar/times", intro: "grammar/times/Времена в английском" },
		{ name: "Артикли и местоимения", folder: "grammar/articles-pronouns", intro: "grammar/articles-pronouns/Articles and Pronouns Introduction" },
		{ name: "Существительные", folder: "grammar/nouns", intro: "grammar/nouns/Nouns Introduction" },
		{ name: "Прилагательные", folder: "grammar/adjectives", intro: "grammar/adjectives/Adjectives Introduction" },
		{ name: "Модальные глаголы", folder: "grammar/modals", intro: "grammar/modals/Modals Introduction" },
		{ name: "Неличные формы", folder: "grammar/non-finite-forms", intro: "grammar/non-finite-forms/Non-Finite Forms Introduction" },
		{ name: "Залог", folder: "grammar/voices", intro: "grammar/voices/Voice Introduction" },
		{ name: "Условные предложения", folder: "grammar/conditionals", intro: "grammar/conditionals/Conditionals Introduction" },
		{ name: "Сложные конструкции", folder: "grammar/complex-constructions", intro: "grammar/complex-constructions/Complex Constructions Introduction" },
		{ name: "Фразовые глаголы", folder: "grammar/phrasal-Idiomatic", intro: "grammar/phrasal-Idiomatic/Complex Introduction" },
		{ name: "Разное", folder: "grammar/miscellaneous", intro: "grammar/miscellaneous/Miscellaneous Introduction" },
	];

	const rows = [];
	let total = 0;

	for (const sec of sections) {
		const folder = app.vault.getAbstractFileByPath(sec.folder);
		if (!folder?.children) { rows.push([sec.name, 0]); continue; }

		let count = 0;
		const countFiles = (f) => {
			if (f.children) f.children.forEach(countFiles);
			else if (f.name.endsWith(".md")) count++;
		};
		countFiles(folder);

		total += count;
		rows.push([dv.fileLink(sec.intro, false, sec.name), count]);
	}

	rows.push(["**Итого**", `**${total}**`]);
	dv.table(["Раздел", "Тем"], rows);
	dv.paragraph(`📚 [[Grammar Navigator]] · 📖 [[Grammar Reader]]`);
})()
```

## Anki

```dataviewjs
(async () => {
	const { requestUrl } = require('obsidian');

	async function ankiReq(action, params = {}) {
		const res = await requestUrl({ url: 'http://localhost:8765', method: 'POST', headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action, version: 6, params }) });
		return res.json.result;
	}

	try { await ankiReq('version'); }
	catch { dv.paragraph('🔌 Anki не запущен'); return; }

	// Inject styles once
	if (!document.getElementById('anki-dashboard-styles')) {
		const s = document.createElement('style');
		s.id = 'anki-dashboard-styles';
		s.textContent = `
			.ankid-wrap { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
			.ankid-hero { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; margin-bottom: 18px; }
			.ankid-stat {
				background: linear-gradient(135deg, var(--background-secondary) 0%, var(--background-modifier-form-field) 100%);
				border-radius: 12px; padding: 14px 16px;
				border: 1px solid var(--background-modifier-border);
				transition: transform 0.15s, box-shadow 0.15s;
			}
			.ankid-stat:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
			.ankid-stat-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
			.ankid-stat-value { font-size: 28px; font-weight: 800; line-height: 1; }
			.ankid-stat-sub { font-size: 12px; color: var(--text-muted); margin-top: 4px; }
			.ankid-streak {
				background: linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ffcc02 100%);
				color: #fff;
				border: none;
			}
			.ankid-streak .ankid-stat-label, .ankid-streak .ankid-stat-sub { color: rgba(255,255,255,0.85); }

			.ankid-section-title { font-size: 13px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin: 20px 0 10px; }

			.ankid-heatmap { display: flex; flex-direction: column; gap: 4px; padding: 12px; background: var(--background-secondary); border-radius: 10px; overflow-x: auto; }
			.ankid-months { display: flex; padding-left: 24px; gap: 0; }
			.ankid-month { font-size: 10px; color: var(--text-muted); flex: 1; min-width: 28px; }
			.ankid-grid-row { display: flex; gap: 3px; align-items: center; }
			.ankid-day-label { width: 20px; font-size: 9px; color: var(--text-muted); text-align: right; padding-right: 4px; }
			.ankid-cells { display: grid; grid-auto-flow: column; grid-template-rows: repeat(7, 11px); gap: 3px; }
			.ankid-cell { width: 11px; height: 11px; border-radius: 2px; cursor: pointer; transition: transform 0.1s; }
			.ankid-cell:hover { transform: scale(1.4); outline: 1px solid var(--text-normal); }
			.ankid-cell-tooltip { position: fixed; background: var(--background-primary); border: 1px solid var(--background-modifier-border); padding: 6px 10px; border-radius: 4px; font-size: 11px; pointer-events: none; z-index: 999; box-shadow: 0 4px 12px rgba(0,0,0,0.2); display: none; }
			.ankid-legend { display: flex; align-items: center; gap: 4px; font-size: 10px; color: var(--text-muted); margin-top: 8px; justify-content: flex-end; }

			.ankid-decks { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
			.ankid-deck {
				background: var(--background-secondary);
				border-radius: 10px;
				padding: 12px 14px;
				border: 1px solid var(--background-modifier-border);
				transition: border-color 0.15s;
			}
			.ankid-deck:hover { border-color: var(--interactive-accent); }
			.ankid-deck-name { font-weight: 600; font-size: 13px; margin-bottom: 6px; }
			.ankid-deck-bar-wrap { height: 6px; background: var(--background-modifier-border); border-radius: 3px; overflow: hidden; margin: 6px 0; }
			.ankid-deck-bar { height: 100%; background: linear-gradient(to right, #5cb85c, #8bc34a); border-radius: 3px; }
			.ankid-deck-meta { display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); }
			.ankid-due-badge { background: #f0ad4e; color: #fff; padding: 1px 6px; border-radius: 8px; font-size: 10px; font-weight: 600; }
			.ankid-due-zero { background: var(--background-modifier-border); color: var(--text-muted); }
		`;
		document.head.appendChild(s);
	}

	const root = dv.container.createEl('div', { cls: 'ankid-wrap' });

	// ── Heatmap data ──
	let reviewsByDay = {};
	try {
		const today = new Date();
		const startDate = new Date(today);
		startDate.setDate(today.getDate() - 364);
		const startMs = startDate.getTime();

		const cardIds = await ankiReq('findCards', { query: 'deck:EG*' });
		if (cardIds.length > 0) {
			const reviewsList = await ankiReq('getReviewsOfCards', { cards: cardIds.slice(0, 5000).map(String) });
			for (const cardReviews of Object.values(reviewsList || {})) {
				for (const rev of (cardReviews || [])) {
					if (rev.id < startMs) continue;
					const d = new Date(rev.id);
					const ds = d.toISOString().slice(0, 10);
					reviewsByDay[ds] = (reviewsByDay[ds] || 0) + 1;
				}
			}
		}
	} catch (e) { /* fallback to deck stats */ }

	// Calc streak, longest streak, totals
	const todayStr = new Date().toISOString().slice(0, 10);
	const yest = new Date(); yest.setDate(yest.getDate() - 1);
	const yestStr = yest.toISOString().slice(0, 10);

	let currentStreak = 0;
	let checkDate = new Date();
	if (!reviewsByDay[todayStr]) checkDate.setDate(checkDate.getDate() - 1);
	for (let i = 0; i < 365; i++) {
		const ds = checkDate.toISOString().slice(0, 10);
		if (reviewsByDay[ds]) {
			currentStreak++;
			checkDate.setDate(checkDate.getDate() - 1);
		} else break;
	}

	let longestStreak = 0, runStreak = 0;
	const sortedDays = Object.keys(reviewsByDay).sort();
	let prevDate = null;
	for (const ds of sortedDays) {
		if (prevDate) {
			const d1 = new Date(prevDate), d2 = new Date(ds);
			const diff = Math.round((d2 - d1) / 86400000);
			if (diff === 1) runStreak++;
			else runStreak = 1;
		} else runStreak = 1;
		if (runStreak > longestStreak) longestStreak = runStreak;
		prevDate = ds;
	}

	const totalReviews = Object.values(reviewsByDay).reduce((a, b) => a + b, 0);
	const activeDays = Object.keys(reviewsByDay).length;
	const todayReviews = reviewsByDay[todayStr] || 0;

	// ── Hero stats ──
	const hero = root.createEl('div', { cls: 'ankid-hero' });

	const streakIcon = currentStreak >= 7 ? '🔥' : currentStreak >= 3 ? '⚡' : currentStreak >= 1 ? '✨' : '💤';
	hero.createEl('div', { cls: 'ankid-stat ankid-streak' }).innerHTML =
		`<div class="ankid-stat-label">${streakIcon} Текущая серия</div>` +
		`<div class="ankid-stat-value">${currentStreak}</div>` +
		`<div class="ankid-stat-sub">${currentStreak === 1 ? 'день' : currentStreak < 5 ? 'дня' : 'дней'} подряд</div>`;

	hero.createEl('div', { cls: 'ankid-stat' }).innerHTML =
		`<div class="ankid-stat-label">📅 Сегодня</div>` +
		`<div class="ankid-stat-value">${todayReviews}</div>` +
		`<div class="ankid-stat-sub">карточек повторено</div>`;

	hero.createEl('div', { cls: 'ankid-stat' }).innerHTML =
		`<div class="ankid-stat-label">🏆 Рекорд</div>` +
		`<div class="ankid-stat-value">${longestStreak}</div>` +
		`<div class="ankid-stat-sub">самая длинная серия</div>`;

	hero.createEl('div', { cls: 'ankid-stat' }).innerHTML =
		`<div class="ankid-stat-label">∑ Всего за год</div>` +
		`<div class="ankid-stat-value">${totalReviews.toLocaleString('ru')}</div>` +
		`<div class="ankid-stat-sub">${activeDays} активных дней</div>`;

	// ── Heatmap ──
	root.createEl('div', { cls: 'ankid-section-title', text: 'Активность за последние 12 месяцев' });
	const heatmap = root.createEl('div', { cls: 'ankid-heatmap' });

	// Tooltip
	const tooltip = root.createEl('div', { cls: 'ankid-cell-tooltip' });

	// Build cells (53 weeks × 7 days)
	const cellsContainer = heatmap.createEl('div', { cls: 'ankid-cells' });
	const today = new Date();
	const startDay = new Date(today);
	startDay.setDate(today.getDate() - 364);
	// Adjust to start on Monday
	const dayOfWeek = (startDay.getDay() + 6) % 7;
	startDay.setDate(startDay.getDate() - dayOfWeek);

	const max = Math.max(1, ...Object.values(reviewsByDay));
	function colorFor(count) {
		if (!count) return 'var(--background-modifier-border)';
		const ratio = Math.min(1, count / max);
		if (ratio < 0.25) return '#9be9a8';
		if (ratio < 0.5) return '#40c463';
		if (ratio < 0.75) return '#30a14e';
		return '#216e39';
	}

	const monthsRow = [];
	let lastMonth = -1;
	for (let i = 0; i < 53 * 7; i++) {
		const d = new Date(startDay);
		d.setDate(startDay.getDate() + i);
		if (d > today) break;
		const ds = d.toISOString().slice(0, 10);
		const count = reviewsByDay[ds] || 0;
		const cell = cellsContainer.createEl('div', { cls: 'ankid-cell' });
		cell.style.background = colorFor(count);
		cell.dataset.date = ds;
		cell.dataset.count = String(count);

		cell.addEventListener('mouseenter', (e) => {
			const dateLocal = new Date(ds).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
			tooltip.innerHTML = `<b>${count}</b> ${count === 1 ? 'карточка' : count < 5 ? 'карточки' : 'карточек'}<br><span style="color:var(--text-muted)">${dateLocal}</span>`;
			tooltip.style.display = 'block';
			tooltip.style.left = (e.clientX + 10) + 'px';
			tooltip.style.top = (e.clientY - 30) + 'px';
		});
		cell.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });

		// Track first day of each month for header
		if (i % 7 === 0 && d.getMonth() !== lastMonth) {
			monthsRow.push({ col: Math.floor(i / 7), name: d.toLocaleDateString('ru-RU', { month: 'short' }) });
			lastMonth = d.getMonth();
		}
	}

	// Legend
	const legend = root.createEl('div', { cls: 'ankid-legend' });
	legend.innerHTML = 'Меньше';
	['var(--background-modifier-border)', '#9be9a8', '#40c463', '#30a14e', '#216e39'].forEach(c => {
		legend.innerHTML += `<span style="display:inline-block;width:11px;height:11px;border-radius:2px;background:${c};margin:0 1px"></span>`;
	});
	legend.innerHTML += 'Больше';

	// ── Deck progress cards ──
	root.createEl('div', { cls: 'ankid-section-title', text: 'Колоды' });
	const decksDiv = root.createEl('div', { cls: 'ankid-decks' });

	const deckNames = (await ankiReq('deckNames')).filter(d => d.startsWith('EG')).sort();
	let totalCards = 0, totalDue = 0;
	for (const deck of deckNames) {
		const all = await ankiReq('findCards', { query: `deck:"${deck}"` });
		const due = await ankiReq('findCards', { query: `deck:"${deck}" is:due` });
		const newC = await ankiReq('findCards', { query: `deck:"${deck}" is:new` });
		const total = all.length;
		if (total === 0) continue;
		const learned = total - newC.length;
		const pct = Math.round(learned / total * 100);

		totalCards += total;
		totalDue += due.length;

		const card = decksDiv.createEl('div', { cls: 'ankid-deck' });
		const dueClass = due.length === 0 ? 'ankid-due-badge ankid-due-zero' : 'ankid-due-badge';
		card.innerHTML =
			`<div class="ankid-deck-name">${deck.replace('EG — ', '')}</div>` +
			`<div class="ankid-deck-bar-wrap"><div class="ankid-deck-bar" style="width:${pct}%"></div></div>` +
			`<div class="ankid-deck-meta">` +
				`<span>${total} карточек · ${pct}%</span>` +
				`<span class="${dueClass}">${due.length} due</span>` +
			`</div>`;
	}

	const summary = root.createEl('div', { attr: { style: 'text-align:center;font-size:13px;color:var(--text-muted);margin-top:12px' } });
	summary.innerHTML = `<b>${totalCards.toLocaleString('ru')}</b> карточек всего · <b style="color:#f0ad4e">${totalDue}</b> к повторению сегодня`;

})()
```

## Словарные материалы

> [[Anki Decks]] — все колоды: idioms, collocations, phrasal verbs, false/true friends, dep. prepositions и др. Экспорт, синхронизация, аудио.
>
> [[Unknown Words]] — слова из уроков 5000 Words: сканирование, генерация предложений, экспорт в Anki.

## Последние занятия

```dataviewjs
(async () => {
	const allFiles = app.vault.getMarkdownFiles().filter(f =>
		(f.path.startsWith("english-galaxy-titanium-course/") ||
		 f.path.startsWith("english-galaxy-turquoise-course/") ||
		 f.path.startsWith("learn-5000-english-words/")) &&
		f.name !== "Home Page.md"
	);

	const studied = [];

	for (const file of allFiles) {
		const content = await app.vault.cachedRead(file);
		const match = content.match(/\*\*Дата изучения:\*\*\s+(\d{2})\.(\d{2})\.(\d{4})/);
		if (match && match[1] !== "00") {
			const dateStr = `${match[3]}-${match[2]}-${match[1]}`;
			studied.push({ name: file.basename, path: file.path, date: dateStr, display: `${match[1]}.${match[2]}.${match[3]}` });
		}
	}

	studied.sort((a, b) => b.date.localeCompare(a.date));
	const recent = studied.slice(0, 10);

	if (recent.length === 0) {
		dv.paragraph("Нет завершённых уроков.");
		return;
	}

	dv.table(
		["Урок", "Дата"],
		recent.map(r => [dv.fileLink(r.path.replace(".md", "")), r.display])
	);
})()
```
