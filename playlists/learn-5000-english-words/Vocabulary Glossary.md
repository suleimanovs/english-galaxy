
> Автоматически собранный глоссарий из всех пройденных уроков курса "5000 English Words". Показывает только слова из завершённых уроков.

```dataviewjs
const TARGET_COLOR = "#c0504d"; // красный = unknown
const regexFont = /<font\s+color=["'](#?[0-9a-fA-F]{6})["'][^>]*>(.*?)<\/font>/gi;
const MAX_WORDS = 5000;

const currentFolder = dv.current().file.folder;

let knownTotal = 0;
let unknownTotal = 0;

for (const page of dv.pages(`"${currentFolder}"`)) {
  const file = app.vault.getAbstractFileByPath(page.file.path);
  if (!file) continue;

  const content = await app.vault.read(file);

  // Считаем все элементы нумерованного списка как слова
  const listMatches = content.match(/^\s*\d+\..+$/gm) || [];
  const totalCount = listMatches.length;

  // Считаем красные слова
  let match;
  let unknownCount = 0;
  while ((match = regexFont.exec(content)) !== null) {
    if (match[1].toLowerCase() === TARGET_COLOR) unknownCount++;
  }

  unknownTotal += unknownCount;
  knownTotal += totalCount - unknownCount;
}

const totalWords = 5000;
const progressPercent = Math.min((totalWords / MAX_WORDS) * 100, 100).toFixed(1);
const knownPercent = totalWords ? ((knownTotal / totalWords) * 100).toFixed(1) : 0;
const unknownPercent = totalWords ? ((unknownTotal / totalWords) * 100).toFixed(1) : 0;

// HTML для прогресс-бара
dv.paragraph(`
<div style="
    width: 100%;
    max-width: 500px;
    height: 25px;
    border: 1px solid #ccc;
    border-radius: 5px;
    overflow: hidden;
    background: #eee;
    margin-bottom: 5px;
">
  <div style="
      width: ${knownPercent}%;
      height: 100%;
      background: #4caf50;
      float: left;
  "></div>
  <div style="
      width: ${unknownPercent}%;
      height: 100%;
      background: ${TARGET_COLOR};
      float: left;
  "></div>
</div>
<span style="font-weight:bold;">Known: ${knownTotal}, Unknown: ${unknownTotal}, Total: ${totalWords} / ${MAX_WORDS}</span>
`);
```



```dataviewjs
(async () => {
	const folder = app.vault.getAbstractFileByPath("learn-5000-english-words");
	if (!folder?.children) { dv.paragraph("Папка не найдена."); return; }

	const files = folder.children
		.filter(f => f.name.endsWith(".md") && f.name.startsWith("Lesson"))
		.sort((a, b) => {
			const na = parseInt(a.name.match(/Lesson\s*(\d+)/)?.[1] || "999");
			const nb = parseInt(b.name.match(/Lesson\s*(\d+)/)?.[1] || "999");
			return na - nb;
		});

	const allWords = [];
	let lessonCount = 0;

	for (const file of files) {
		const content = await app.vault.cachedRead(file);
		const dateMatch = content.match(/\*\*Дата изучения:\*\*\s+(\S+)/);
		if (!dateMatch || dateMatch[1].startsWith("00.00")) continue;

		lessonCount++;
		const lines = content.split("\n");
		for (const line of lines) {
			const m = line.match(/^\s*\d+\.\s+(.+?)\s+-\s+(.+)$/);
			if (m) {
				allWords.push({ en: m[1].trim(), ru: m[2].trim() });
			}
		}
	}

	if (allWords.length === 0) {
		dv.paragraph("Нет пройденных уроков со словами.");
		return;
	}

	dv.paragraph(`**${allWords.length}** слов из **${lessonCount}** пройденных уроков`);

	// Search input
	const container = dv.container;
	const searchBox = document.createElement("input");
	searchBox.type = "text";
	searchBox.placeholder = "Поиск слова (EN или RU)...";
	searchBox.style.cssText = "width:100%;padding:8px 12px;margin:8px 0 12px;border-radius:8px;border:1.5px solid var(--background-modifier-border);background:var(--background-secondary);color:var(--text-normal);font-size:14px;outline:none;box-sizing:border-box;";
	container.appendChild(searchBox);

	const tableContainer = document.createElement("div");
	container.appendChild(tableContainer);

	function renderTable(filter) {
		tableContainer.innerHTML = "";
		const q = (filter || "").toLowerCase();
		const filtered = q
			? allWords.filter(w => w.en.toLowerCase().includes(q) || w.ru.toLowerCase().includes(q))
			: allWords;

		if (filtered.length === 0) {
			tableContainer.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:20px;">Ничего не найдено</p>`;
			return;
		}

		const table = document.createElement("table");
		table.className = "dataview table-view-table";
		table.innerHTML = `<thead><tr><th>#</th><th>English</th><th>Русский</th></tr></thead>`;
		const tbody = document.createElement("tbody");

		const show = filtered.slice(0, 500);
		show.forEach((w, i) => {
			const tr = document.createElement("tr");
			tr.innerHTML = `<td>${i + 1}</td><td><strong>${w.en}</strong></td><td>${w.ru}</td>`;
			tbody.appendChild(tr);
		});

		table.appendChild(tbody);
		tableContainer.appendChild(table);

		if (filtered.length > 500) {
			const more = document.createElement("p");
			more.style.cssText = "color:var(--text-muted);text-align:center;font-size:12px;";
			more.textContent = `Показано 500 из ${filtered.length}. Используйте поиск для фильтрации.`;
			tableContainer.appendChild(more);
		}
	}

	renderTable("");
	searchBox.addEventListener("input", e => renderTable(e.target.value));
})()
```
