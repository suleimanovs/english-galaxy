



```dataview
const TARGET_COLOR = "#c0504d".toLowerCase();
const regex = /<font\s+color=["'](#?[0-9a-fA-F]{6})["'][^>]*>(.*?)<\/font>/gi;

let results = [];

for (const page of dv.pages()) {
  const file = app.vault.getAbstractFileByPath(page.file.path);
  if (!file) continue;

  const content = await app.vault.read(file);
  let match;

  while ((match = regex.exec(content)) !== null) {
    const color = match[1].toLowerCase();
    const text = match[2].trim();

    if (color === TARGET_COLOR) {
      results.push({
        file: page.file.link,
        text: text
      });
    }
  }
}

dv.table(
  ["File", "Content"],
  results.map(r => [r.file, r.text])
);

```

