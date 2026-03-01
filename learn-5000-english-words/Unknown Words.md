



```dataviewjs
const TARGET_COLOR = "#c0504d";
const regex = /<font\s+color=["'](#?[0-9a-fA-F]{6})["'][^>]*>(.*?)<\/font>/gi;

const currentFolder = dv.current().file.folder;

let results = [];

for (const page of dv.pages(`"${currentFolder}"`)) {
  const file = app.vault.getAbstractFileByPath(page.file.path);
  if (!file) continue;

  const content = await app.vault.read(file);
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match[1].toLowerCase() === TARGET_COLOR) {
      results.push([page.file.link, match[2].trim()]);
    }
  }
}

dv.table(["File", "Content"], results);
```

