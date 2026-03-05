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
