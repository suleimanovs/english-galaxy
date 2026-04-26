```dataviewjs
// ════════════════════════════════════════════════════
//  HOME PAGE — unified dashboard
// ════════════════════════════════════════════════════

const { requestUrl } = require('obsidian');

// ── Styles ──
if (!document.getElementById('hp-styles')) {
	const s = document.createElement('style');
	s.id = 'hp-styles';
	s.textContent = `
		.hp-wrap { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
		.hp-h1 { font-size: 32px; font-weight: 800; margin: 8px 0 4px; letter-spacing: -0.5px; }
		.hp-sub { font-size: 14px; color: var(--text-muted); margin-bottom: 20px; }

		.hp-section-title {
			font-size: 12px; font-weight: 700; color: var(--text-muted);
			text-transform: uppercase; letter-spacing: 0.1em;
			margin: 24px 0 10px;
			display: flex; align-items: center; gap: 8px;
		}
		.hp-section-title:first-child { margin-top: 0; }

		.hp-hero { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 12px; margin-bottom: 20px; }
		.hp-card {
			background: var(--background-secondary);
			border-radius: 12px; padding: 16px 18px;
			border: 1px solid var(--background-modifier-border);
			transition: transform 0.15s, box-shadow 0.15s;
		}
		.hp-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
		.hp-card-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
		.hp-card-value { font-size: 28px; font-weight: 800; line-height: 1; }
		.hp-card-sub { font-size: 12px; color: var(--text-muted); margin-top: 4px; }
		.hp-streak {
			background: linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ffcc02 100%);
			color: #fff; border: none;
		}
		.hp-streak .hp-card-label, .hp-streak .hp-card-sub { color: rgba(255,255,255,0.9); }
		.hp-hero-main {
			background: linear-gradient(135deg, var(--interactive-accent) 0%, #6366f1 100%);
			color: #fff; border: none;
		}
		.hp-hero-main .hp-card-label, .hp-hero-main .hp-card-sub { color: rgba(255,255,255,0.85); }

		.hp-continue { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px; }
		.hp-continue-card {
			background: var(--background-secondary);
			border: 1px solid var(--background-modifier-border);
			border-radius: 12px; padding: 14px 16px;
			text-decoration: none !important; color: var(--text-normal) !important;
			display: flex; align-items: center; gap: 12px;
			transition: all 0.15s;
		}
		.hp-continue-card:hover {
			border-color: var(--interactive-accent);
			transform: translateY(-2px);
			box-shadow: 0 4px 12px rgba(99,102,241,0.15);
		}
		.hp-continue-icon { font-size: 28px; }
		.hp-continue-content { flex: 1; min-width: 0; }
		.hp-continue-course { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
		.hp-continue-lesson { font-size: 14px; font-weight: 600; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
		.hp-continue-arrow { font-size: 18px; color: var(--text-muted); }

		.hp-courses { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
		.hp-course {
			background: var(--background-secondary);
			border: 1px solid var(--background-modifier-border);
			border-radius: 12px; padding: 14px 16px;
		}
		.hp-course-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
		.hp-course-name { font-weight: 700; font-size: 14px; display: flex; align-items: center; gap: 8px; }
		.hp-course-icon { font-size: 18px; }
		.hp-course-pct { font-size: 16px; font-weight: 700; color: var(--interactive-accent); }
		.hp-course-bar-wrap { height: 8px; background: var(--background-modifier-border); border-radius: 4px; overflow: hidden; margin-bottom: 8px; }
		.hp-course-bar { height: 100%; border-radius: 4px; transition: width 0.3s; }
		.hp-course-meta { font-size: 11px; color: var(--text-muted); margin-bottom: 6px; }
		.hp-level-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(50px, 1fr)); gap: 4px; margin-top: 8px; }
		.hp-level {
			text-align: center; padding: 4px 6px; border-radius: 6px;
			font-size: 11px; font-weight: 600;
			background: var(--background-modifier-border);
		}
		.hp-level-done { background: linear-gradient(135deg, #5cb85c, #4caf50); color: #fff; }
		.hp-level-progress { background: linear-gradient(135deg, #f0ad4e, #ff9800); color: #fff; }

		.hp-grammar { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; }
		.hp-grammar-card {
			background: var(--background-secondary);
			border: 1px solid var(--background-modifier-border);
			border-radius: 10px; padding: 12px 14px;
			text-decoration: none !important; color: var(--text-normal) !important;
			display: flex; align-items: center; gap: 10px;
			transition: all 0.15s;
		}
		.hp-grammar-card:hover { border-color: var(--interactive-accent); background: var(--background-modifier-hover); }
		.hp-grammar-icon { font-size: 22px; }
		.hp-grammar-name { font-size: 13px; font-weight: 500; flex: 1; }
		.hp-grammar-count { font-size: 11px; color: var(--text-muted); }

		.hp-recent { display: flex; flex-direction: column; gap: 6px; }
		.hp-recent-item {
			display: flex; align-items: center; gap: 12px;
			padding: 8px 12px; border-radius: 8px;
			background: var(--background-secondary);
			text-decoration: none !important; color: var(--text-normal) !important;
			transition: background 0.15s;
		}
		.hp-recent-item:hover { background: var(--background-modifier-hover); }
		.hp-recent-date {
			font-size: 11px; font-weight: 600; color: var(--interactive-accent);
			min-width: 80px;
		}
		.hp-recent-name { flex: 1; font-size: 13px; }

		.hp-links { display: flex; gap: 10px; flex-wrap: wrap; }
		.hp-link-pill {
			background: var(--background-secondary);
			border: 1px solid var(--background-modifier-border);
			border-radius: 24px; padding: 8px 16px;
			text-decoration: none !important; color: var(--text-normal) !important;
			font-size: 13px; font-weight: 500;
			transition: all 0.15s;
		}
		.hp-link-pill:hover { border-color: var(--interactive-accent); background: var(--background-modifier-hover); }

		/* Anki dashboard inherited styles */
		.ankid-wrap { font-family: inherit; }
		.ankid-hero { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; margin-bottom: 18px; }
		.ankid-stat {
			background: var(--background-secondary);
			border-radius: 12px; padding: 14px 16px;
			border: 1px solid var(--background-modifier-border);
			transition: transform 0.15s, box-shadow 0.15s;
		}
		.ankid-stat:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
		.ankid-stat-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
		.ankid-stat-value { font-size: 28px; font-weight: 800; line-height: 1; }
		.ankid-stat-sub { font-size: 12px; color: var(--text-muted); margin-top: 4px; }
		.ankid-streak { background: linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ffcc02 100%); color: #fff; border: none; }
		.ankid-streak .ankid-stat-label, .ankid-streak .ankid-stat-sub { color: rgba(255,255,255,0.85); }
		.ankid-heatmap { display: flex; flex-direction: column; gap: 4px; padding: 12px; background: var(--background-secondary); border-radius: 10px; overflow-x: auto; border: 1px solid var(--background-modifier-border); }
		.ankid-cells { display: grid; grid-auto-flow: column; grid-template-rows: repeat(7, 11px); gap: 3px; }
		.ankid-cell { width: 11px; height: 11px; border-radius: 2px; cursor: pointer; transition: transform 0.1s; }
		.ankid-cell:hover { transform: scale(1.4); outline: 1px solid var(--text-normal); }
		.ankid-cell-tooltip { position: fixed; background: var(--background-primary); border: 1px solid var(--background-modifier-border); padding: 6px 10px; border-radius: 4px; font-size: 11px; pointer-events: none; z-index: 999; box-shadow: 0 4px 12px rgba(0,0,0,0.2); display: none; }
		.ankid-legend { display: flex; align-items: center; gap: 4px; font-size: 10px; color: var(--text-muted); margin-top: 8px; justify-content: flex-end; }
		.ankid-decks { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
		.ankid-deck { background: var(--background-secondary); border-radius: 10px; padding: 12px 14px; border: 1px solid var(--background-modifier-border); transition: border-color 0.15s; }
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

const root = dv.container.createEl('div', { cls: 'hp-wrap' });

// ════════════════════════════════════════════════════
// HEADER
// ════════════════════════════════════════════════════
const now = new Date();
const hour = now.getHours();
const greeting = hour < 6 ? '🌙 Доброй ночи' : hour < 12 ? '☀️ Доброе утро' : hour < 18 ? '👋 Добрый день' : '🌆 Добрый вечер';
root.createEl('div', { cls: 'hp-h1', text: 'English Galaxy' });
root.createEl('div', { cls: 'hp-sub', text: `${greeting}, готов к новому дню обучения?` });

// ════════════════════════════════════════════════════
// HERO STATS — lessons studied
// ════════════════════════════════════════════════════
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

const todayStr = now.toISOString().slice(0, 10);
const dayOfWeek = (now.getDay() + 6) % 7;
const weekStart = new Date(now);
weekStart.setDate(now.getDate() - dayOfWeek);
const weekStartStr = weekStart.toISOString().slice(0, 10);
const monthStartStr = todayStr.slice(0, 8) + "01";

const todayCount = dates.filter(d => d === todayStr).length;
const weekCount = dates.filter(d => d >= weekStartStr).length;
const monthCount = dates.filter(d => d >= monthStartStr).length;

const uniqueDays = [...new Set(dates)].sort().reverse();
let lessonStreak = 0;
let checkDate = new Date(now);
if (!uniqueDays.includes(todayStr)) checkDate.setDate(checkDate.getDate() - 1);
for (let i = 0; i < 365; i++) {
	const ds = checkDate.toISOString().slice(0, 10);
	if (uniqueDays.includes(ds)) { lessonStreak++; checkDate.setDate(checkDate.getDate() - 1); }
	else break;
}

const streakIcon = lessonStreak >= 7 ? '🔥' : lessonStreak >= 3 ? '⚡' : lessonStreak >= 1 ? '✨' : '💤';
const hero = root.createEl('div', { cls: 'hp-hero' });
hero.createEl('div', { cls: 'hp-card hp-streak' }).innerHTML =
	`<div class="hp-card-label">${streakIcon} Серия дней с уроками</div>` +
	`<div class="hp-card-value">${lessonStreak}</div>` +
	`<div class="hp-card-sub">${lessonStreak === 1 ? 'день' : lessonStreak < 5 ? 'дня' : 'дней'} подряд</div>`;
hero.createEl('div', { cls: 'hp-card' }).innerHTML =
	`<div class="hp-card-label">📅 Сегодня</div>` +
	`<div class="hp-card-value">${todayCount}</div>` +
	`<div class="hp-card-sub">уроков</div>`;
hero.createEl('div', { cls: 'hp-card' }).innerHTML =
	`<div class="hp-card-label">📆 На неделе</div>` +
	`<div class="hp-card-value">${weekCount}</div>` +
	`<div class="hp-card-sub">уроков</div>`;
hero.createEl('div', { cls: 'hp-card' }).innerHTML =
	`<div class="hp-card-label">🗓 За месяц</div>` +
	`<div class="hp-card-value">${monthCount}</div>` +
	`<div class="hp-card-sub">уроков</div>`;

// ════════════════════════════════════════════════════
// CONTINUE LEARNING
// ════════════════════════════════════════════════════
root.createEl('div', { cls: 'hp-section-title', text: '▶ Продолжить обучение' });

const courses = [
	{ name: "Titanium", icon: "🎯", base: "english-galaxy-titanium-course", levels: ["A0","A1","A2","B1","B2","С1"] },
	{ name: "Turquoise", icon: "💎", base: "english-galaxy-turquoise-course", levels: ["A2","B1","B2","C1"] },
	{ name: "5000 Words", icon: "📖", base: "learn-5000-english-words", levels: null },
];

const continueGrid = root.createEl('div', { cls: 'hp-continue' });
for (const course of courses) {
	let foundFile = null, foundLevel = '';
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
				foundFile = file;
				foundLevel = level;
				break;
			}
		}
		if (foundFile) break;
	}

	const card = continueGrid.createEl('a', { cls: 'hp-continue-card' });
	card.href = foundFile ? foundFile.path.replace('.md', '') : '#';
	if (!foundFile) card.style.opacity = '0.6';
	card.innerHTML =
		`<div class="hp-continue-icon">${course.icon}</div>` +
		`<div class="hp-continue-content">` +
			`<div class="hp-continue-course">${course.name}${foundLevel ? ' · ' + foundLevel : ''}</div>` +
			`<div class="hp-continue-lesson">${foundFile ? foundFile.basename : '✅ Все пройдено!'}</div>` +
		`</div>` +
		(foundFile ? `<div class="hp-continue-arrow">→</div>` : '');
}

// ════════════════════════════════════════════════════
// COURSES PROGRESS
// ════════════════════════════════════════════════════
root.createEl('div', { cls: 'hp-section-title', text: '📊 Прогресс по курсам' });

const coursesGrid = root.createEl('div', { cls: 'hp-courses' });

const courseConfigs = [
	{ name: "Turquoise", icon: "💎", base: "english-galaxy-turquoise-course", levels: ["A2","B1","B2","C1"], color: '#06b6d4' },
	{ name: "Titanium", icon: "🎯", base: "english-galaxy-titanium-course", levels: ["A0","A1","A2","B1","B2","С1"], color: '#8b5cf6' },
	{ name: "5000 Words", icon: "📖", base: "learn-5000-english-words", levels: null, color: '#10b981' },
];

for (const c of courseConfigs) {
	const card = coursesGrid.createEl('div', { cls: 'hp-course' });
	let totalDone = 0, totalAll = 0;
	const levelStats = [];

	const folders = c.levels
		? c.levels.map(l => ({ level: l, path: `${c.base}/${l}` }))
		: [{ level: "", path: c.base }];

	for (const { level, path } of folders) {
		const folder = app.vault.getAbstractFileByPath(path);
		if (!folder?.children) { levelStats.push({ level, done: 0, total: 0 }); continue; }
		const files = folder.children.filter(f => f.name.endsWith(".md"));
		let done = 0;
		for (const file of files) {
			const content = await app.vault.cachedRead(file);
			const match = content.match(/\*\*Дата изучения:\*\*\s+(\S+)/);
			if (match && !match[1].startsWith("00.00")) done++;
		}
		levelStats.push({ level, done, total: files.length });
		totalDone += done;
		totalAll += files.length;
	}

	const pct = totalAll > 0 ? Math.round(totalDone / totalAll * 100) : 0;

	card.innerHTML =
		`<div class="hp-course-head">` +
			`<div class="hp-course-name"><span class="hp-course-icon">${c.icon}</span>${c.name}</div>` +
			`<div class="hp-course-pct" style="color:${c.color}">${pct}%</div>` +
		`</div>` +
		`<div class="hp-course-bar-wrap"><div class="hp-course-bar" style="width:${pct}%;background:linear-gradient(to right, ${c.color}, ${c.color}aa)"></div></div>` +
		`<div class="hp-course-meta">${totalDone} из ${totalAll} уроков</div>`;

	if (c.levels) {
		const grid = card.createEl('div', { cls: 'hp-level-grid' });
		for (const ls of levelStats) {
			const lpct = ls.total > 0 ? Math.round(ls.done / ls.total * 100) : 0;
			const cls = lpct === 100 ? 'hp-level hp-level-done' : lpct > 0 ? 'hp-level hp-level-progress' : 'hp-level';
			grid.createEl('div', { cls, text: `${ls.level} ${lpct}%` });
		}
	}
}

// ════════════════════════════════════════════════════
// ANKI DASHBOARD
// ════════════════════════════════════════════════════
root.createEl('div', { cls: 'hp-section-title', text: '🎴 Anki' });

async function ankiReq(action, params = {}) {
	const res = await requestUrl({ url: 'http://localhost:8765', method: 'POST', headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ action, version: 6, params }) });
	return res.json.result;
}

let ankiOk = true;
try { await ankiReq('version'); } catch { ankiOk = false; }

if (!ankiOk) {
	const off = root.createEl('div', { cls: 'hp-card', attr: { style: 'text-align:center;padding:20px' } });
	off.innerHTML = `<div style="font-size:24px;margin-bottom:6px">🔌</div><div style="color:var(--text-muted)">Anki не запущен</div>`;
} else {
	const ankiRoot = root.createEl('div', { cls: 'ankid-wrap' });

	// Heatmap data
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
	} catch (e) {}

	const todayStrA = new Date().toISOString().slice(0, 10);
	let currentStreak = 0;
	let cd = new Date();
	if (!reviewsByDay[todayStrA]) cd.setDate(cd.getDate() - 1);
	for (let i = 0; i < 365; i++) {
		const ds = cd.toISOString().slice(0, 10);
		if (reviewsByDay[ds]) { currentStreak++; cd.setDate(cd.getDate() - 1); } else break;
	}

	let longestStreak = 0, runStreak = 0;
	const sortedDays = Object.keys(reviewsByDay).sort();
	let prevDate = null;
	for (const ds of sortedDays) {
		if (prevDate) {
			const diff = Math.round((new Date(ds) - new Date(prevDate)) / 86400000);
			runStreak = diff === 1 ? runStreak + 1 : 1;
		} else runStreak = 1;
		if (runStreak > longestStreak) longestStreak = runStreak;
		prevDate = ds;
	}

	const totalReviews = Object.values(reviewsByDay).reduce((a, b) => a + b, 0);
	const activeDays = Object.keys(reviewsByDay).length;
	const todayReviews = reviewsByDay[todayStrA] || 0;

	const ankiHero = ankiRoot.createEl('div', { cls: 'ankid-hero' });
	const sIcon = currentStreak >= 7 ? '🔥' : currentStreak >= 3 ? '⚡' : currentStreak >= 1 ? '✨' : '💤';
	ankiHero.createEl('div', { cls: 'ankid-stat ankid-streak' }).innerHTML =
		`<div class="ankid-stat-label">${sIcon} Серия Anki</div>` +
		`<div class="ankid-stat-value">${currentStreak}</div>` +
		`<div class="ankid-stat-sub">${currentStreak === 1 ? 'день' : currentStreak < 5 ? 'дня' : 'дней'} подряд</div>`;
	ankiHero.createEl('div', { cls: 'ankid-stat' }).innerHTML =
		`<div class="ankid-stat-label">📅 Сегодня</div>` +
		`<div class="ankid-stat-value">${todayReviews}</div>` +
		`<div class="ankid-stat-sub">карточек повторено</div>`;
	ankiHero.createEl('div', { cls: 'ankid-stat' }).innerHTML =
		`<div class="ankid-stat-label">🏆 Рекорд</div>` +
		`<div class="ankid-stat-value">${longestStreak}</div>` +
		`<div class="ankid-stat-sub">самая длинная серия</div>`;
	ankiHero.createEl('div', { cls: 'ankid-stat' }).innerHTML =
		`<div class="ankid-stat-label">∑ За год</div>` +
		`<div class="ankid-stat-value">${totalReviews.toLocaleString('ru')}</div>` +
		`<div class="ankid-stat-sub">${activeDays} активных дней</div>`;

	// Heatmap
	const heatmap = ankiRoot.createEl('div', { cls: 'ankid-heatmap' });
	const tooltip = ankiRoot.createEl('div', { cls: 'ankid-cell-tooltip' });
	const cellsContainer = heatmap.createEl('div', { cls: 'ankid-cells' });
	const today = new Date();
	const startDay = new Date(today);
	startDay.setDate(today.getDate() - 364);
	startDay.setDate(startDay.getDate() - ((startDay.getDay() + 6) % 7));
	const max = Math.max(1, ...Object.values(reviewsByDay));
	function colorFor(count) {
		if (!count) return 'var(--background-modifier-border)';
		const ratio = Math.min(1, count / max);
		if (ratio < 0.25) return '#9be9a8';
		if (ratio < 0.5) return '#40c463';
		if (ratio < 0.75) return '#30a14e';
		return '#216e39';
	}
	for (let i = 0; i < 53 * 7; i++) {
		const d = new Date(startDay);
		d.setDate(startDay.getDate() + i);
		if (d > today) break;
		const ds = d.toISOString().slice(0, 10);
		const count = reviewsByDay[ds] || 0;
		const cell = cellsContainer.createEl('div', { cls: 'ankid-cell' });
		cell.style.background = colorFor(count);
		cell.addEventListener('mouseenter', (e) => {
			const dl = new Date(ds).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
			tooltip.innerHTML = `<b>${count}</b> ${count === 1 ? 'карточка' : count < 5 ? 'карточки' : 'карточек'}<br><span style="color:var(--text-muted)">${dl}</span>`;
			tooltip.style.display = 'block';
			tooltip.style.left = (e.clientX + 10) + 'px';
			tooltip.style.top = (e.clientY - 30) + 'px';
		});
		cell.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });
	}

	const legend = ankiRoot.createEl('div', { cls: 'ankid-legend' });
	legend.innerHTML = 'Меньше';
	['var(--background-modifier-border)', '#9be9a8', '#40c463', '#30a14e', '#216e39'].forEach(c => {
		legend.innerHTML += `<span style="display:inline-block;width:11px;height:11px;border-radius:2px;background:${c};margin:0 1px"></span>`;
	});
	legend.innerHTML += 'Больше';

	// Decks
	const decksDiv = ankiRoot.createEl('div', { cls: 'ankid-decks', attr: { style: 'margin-top:14px' } });
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
				`<span>${total} · ${pct}%</span>` +
				`<span class="${dueClass}">${due.length} due</span>` +
			`</div>`;
	}
	const summary = ankiRoot.createEl('div', { attr: { style: 'text-align:center;font-size:13px;color:var(--text-muted);margin-top:12px' } });
	summary.innerHTML = `<b>${totalCards.toLocaleString('ru')}</b> карточек всего · <b style="color:#f0ad4e">${totalDue}</b> к повторению сегодня`;
}

// ════════════════════════════════════════════════════
// GRAMMAR
// ════════════════════════════════════════════════════
root.createEl('div', { cls: 'hp-section-title', text: '📚 Грамматика' });

const sections = [
	{ name: "Времена", icon: "⏰", folder: "grammar/times", intro: "grammar/times/Времена в английском" },
	{ name: "Артикли и местоимения", icon: "🔤", folder: "grammar/articles-pronouns", intro: "grammar/articles-pronouns/Articles and Pronouns Introduction" },
	{ name: "Существительные", icon: "📦", folder: "grammar/nouns", intro: "grammar/nouns/Nouns Introduction" },
	{ name: "Прилагательные", icon: "✨", folder: "grammar/adjectives", intro: "grammar/adjectives/Adjectives Introduction" },
	{ name: "Модальные глаголы", icon: "🎭", folder: "grammar/modals", intro: "grammar/modals/Modals Introduction" },
	{ name: "Неличные формы", icon: "🌀", folder: "grammar/non-finite-forms", intro: "grammar/non-finite-forms/Non-Finite Forms Introduction" },
	{ name: "Залог", icon: "🔄", folder: "grammar/voices", intro: "grammar/voices/Voice Introduction" },
	{ name: "Условные предложения", icon: "❓", folder: "grammar/conditionals", intro: "grammar/conditionals/Conditionals Introduction" },
	{ name: "Сложные конструкции", icon: "🧩", folder: "grammar/complex-constructions", intro: "grammar/complex-constructions/Complex Constructions Introduction" },
	{ name: "Фразовые глаголы", icon: "🔗", folder: "grammar/phrasal-Idiomatic", intro: "grammar/phrasal-Idiomatic/Complex Introduction" },
	{ name: "Разное", icon: "🎲", folder: "grammar/miscellaneous", intro: "grammar/miscellaneous/Miscellaneous Introduction" },
];

const grammarGrid = root.createEl('div', { cls: 'hp-grammar' });
let grammarTotal = 0;
for (const sec of sections) {
	const folder = app.vault.getAbstractFileByPath(sec.folder);
	let count = 0;
	if (folder?.children) {
		const countFiles = (f) => {
			if (f.children) f.children.forEach(countFiles);
			else if (f.name.endsWith(".md")) count++;
		};
		countFiles(folder);
	}
	grammarTotal += count;
	const card = grammarGrid.createEl('a', { cls: 'hp-grammar-card' });
	card.href = sec.intro;
	card.innerHTML =
		`<div class="hp-grammar-icon">${sec.icon}</div>` +
		`<div class="hp-grammar-name">${sec.name}</div>` +
		`<div class="hp-grammar-count">${count}</div>`;
}

const navRow = root.createEl('div', { cls: 'hp-links', attr: { style: 'margin-top:12px' } });
const nav1 = navRow.createEl('a', { cls: 'hp-link-pill', text: '🗺 Grammar Navigator' });
nav1.href = 'Grammar Navigator';
const nav2 = navRow.createEl('a', { cls: 'hp-link-pill', text: '📖 Grammar Reader' });
nav2.href = 'Grammar Reader';

// ════════════════════════════════════════════════════
// WORD RESOURCES
// ════════════════════════════════════════════════════
root.createEl('div', { cls: 'hp-section-title', text: '🎓 Словарные материалы' });
const resourceLinks = root.createEl('div', { cls: 'hp-links' });
const link1 = resourceLinks.createEl('a', { cls: 'hp-link-pill', text: '🎴 Anki Decks — все колоды' });
link1.href = 'english words/anki/Anki Decks';
const link2 = resourceLinks.createEl('a', { cls: 'hp-link-pill', text: '🎯 Unknown Words — слова из уроков' });
link2.href = 'learn-5000-english-words/Unknown Words';
const link3 = resourceLinks.createEl('a', { cls: 'hp-link-pill', text: '📋 Backlog — идеи' });
link3.href = 'Backlog';
const link4 = resourceLinks.createEl('a', { cls: 'hp-link-pill', text: '⚙️ Setup' });
link4.href = 'Setup';

// ════════════════════════════════════════════════════
// RECENT LESSONS
// ════════════════════════════════════════════════════
root.createEl('div', { cls: 'hp-section-title', text: '🕐 Последние занятия' });

const studied = [];
for (const file of allFiles) {
	const content = await app.vault.cachedRead(file);
	const match = content.match(/\*\*Дата изучения:\*\*\s+(\d{2})\.(\d{2})\.(\d{4})/);
	if (match && match[1] !== "00") {
		studied.push({
			name: file.basename, path: file.path,
			date: `${match[3]}-${match[2]}-${match[1]}`,
			display: `${match[1]}.${match[2]}.${match[3]}`
		});
	}
}
studied.sort((a, b) => b.date.localeCompare(a.date));

if (studied.length === 0) {
	root.createEl('p', { text: 'Нет завершённых уроков.', attr: { style: 'color:var(--text-muted)' } });
} else {
	const recentList = root.createEl('div', { cls: 'hp-recent' });
	for (const r of studied.slice(0, 8)) {
		const item = recentList.createEl('a', { cls: 'hp-recent-item' });
		item.href = r.path.replace('.md', '');
		item.innerHTML =
			`<div class="hp-recent-date">${r.display}</div>` +
			`<div class="hp-recent-name">${r.name}</div>`;
	}
}
```
