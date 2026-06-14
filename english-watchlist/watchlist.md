# English watchlist

Прокачка английского через американский контент. Вся информация — в карточках ниже; данные лежат в `watchlist.csv`. Статус тайтла меняется в CSV в колонке `status`: `backlog` → `planned` → `watching` → `watched`.

**Как это работает.** Язык усваивается, когда много слушаешь интересное и чуть выше своего уровня — смысл достраивается из контекста. Правило одно: смотреть регулярно и помногу. Маршрут по сложности: мультсериалы → ситкомы → драмы и фильмы.

**Субтитры.** A2–B1 — английские включены; B1–B2 — английские, но опирайся на слух; B2+ — без субтитров, важные сцены пересматривай с ними. Русские субтитры не использовать.

**Не застревай на словах.** Цель — понимать, не останавливаясь на каждом слове. Не выписывай всё подряд; если слово реально мешает и повторяется — пара штук за серию в [[word-tracker|базу слов]], не больше.

Акцент перепроверен вручную (не-американские помечены). Уровень — предварительная оценка, внешними источниками пока не сверено.

```dataviewjs
const rows = await dv.io.csv("english-watchlist/watchlist.csv");
const lvlColor={A1:"#16a34a",A2:"#16a34a",B1:"#0891b2",B2:"#ea580c",C1:"#dc2626",C2:"#dc2626"};
const mediaRu={cartoon:"мультсериал",anime:"аниме (дубляж)",sitcom:"ситком",drama:"сериал",movie:"фильм",learner:"для изучающих"};
const lvlOrder={A1:1,A2:2,B1:3,B2:4,C1:5,C2:6};
const esc=s=>(s==null?"":s.toString()).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
function accent(a){a=(a||"").toString();const c=a==="British"?"#dc2626":a==="Mixed"?"#ea580c":"#7c8699";return `<span style="color:${c};font-size:.72em">${esc(a)}</span>`;}
function card(p){
  const lc=lvlColor[p.level]||"#64748b";
  const cover=p.cover?`<img src="${esc(p.cover)}" loading="lazy" style="width:100%;aspect-ratio:2/3;object-fit:cover;display:block">`
    :`<div style="aspect-ratio:2/3;display:flex;align-items:center;justify-content:center;background:#1f2430;color:#7c8699;font-size:.78em">нет обложки</div>`;
  const amount=p.episodes?`${p.episodes} эп.`:(p.runtime||"");
  return `<div style="border:1px solid var(--background-modifier-border);border-radius:10px;overflow:hidden;background:var(--background-secondary-alt);display:flex;flex-direction:column">
    <div style="position:relative">${cover}<span style="position:absolute;top:6px;right:6px;background:${lc};color:#fff;font-weight:700;font-size:.72em;padding:2px 7px;border-radius:20px">${esc(p.level)}</span></div>
    <div style="padding:9px 10px;display:flex;flex-direction:column;gap:4px">
      <div style="font-weight:700;font-size:.92em;line-height:1.2">${esc(p.title)}</div>
      <div style="display:flex;justify-content:space-between;gap:6px;color:var(--text-muted);font-size:.72em"><span>${mediaRu[p.media]||esc(p.media)} · ${esc(p.year)}${amount?` · ${amount}`:""}</span>${accent(p.accent)}</div>
      <div style="color:var(--text-normal);font-size:.76em;line-height:1.35;opacity:.85">${esc(p.desc)}</div>
    </div></div>`;
}
const grid=arr=>arr.length?`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:14px;margin:6px 0 22px">${arr.map(card).join("")}</div>`:"<p style='color:var(--text-muted)'>— пусто —</p>";
const sec=(t,arr)=>{dv.header(3,`${t} (${arr.length})`);dv.container.createDiv().innerHTML=grid(arr);};
const byStatus=s=>rows.where(r=>r.status===s).sort(r=>lvlOrder[r.level]||9).array();
sec("Сейчас смотрю",byStatus("watching"));
sec("В очереди",byStatus("planned"));
sec("Просмотрено",byStatus("watched"));
const backlog=rows.where(r=>r.status==="backlog").sort(r=>lvlOrder[r.level]||9);
dv.header(2,`Каталог по уровням (${backlog.length})`);
for(const lvl of ["A2","B1","B2","C1"]){const arr=backlog.where(r=>r.level===lvl).array();if(arr.length)sec(lvl,arr);}
```
