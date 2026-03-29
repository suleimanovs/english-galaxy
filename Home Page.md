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

## Словарные материалы

| Раздел | Описание |
| --- | --- |
| [[Устойчивые выражения (Fixed Phrases)]] | 100 устойчивых выражений с примерами |
| [[Глаголы + предлог (50 шт)]] | 50 глаголов с зависимыми предлогами |
| [[Прилагательные + предлог (50 шт)]] | 50 прилагательных с предлогами |
| [[Существительные + предлог (50 шт)]] | 50 существительных с предлогами |
| [[New]] | Новые слова |

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
