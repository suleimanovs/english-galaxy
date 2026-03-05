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

const totalWords = knownTotal + unknownTotal;
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



