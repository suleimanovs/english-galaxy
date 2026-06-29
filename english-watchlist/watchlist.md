# English watchlist

Прокачка английского через американский **сериальный** контент. Вся информация — в карточках; данные в `watchlist.csv`. **Статус** меняется кнопками `очередь` / `смотрю` / `готово`. **Прогресс по сериям** — введи число в поле «N / всего эп.» на карточке: полоса заполнится, а статус сам станет «смотрю» (есть прогресс) или «готово» (досмотрел всё).

**Как это работает.** Язык усваивается, когда много слушаешь интересное и чуть выше своего уровня — смысл достраивается из контекста. Правило одно: смотреть регулярно и помногу. Маршрут по сложности: мультсериалы → ситкомы → драмы.

**Субтитры.** A1–B1 — английские включены; B1–B2 — английские, но опирайся на слух; выше — без субтитров, важные сцены пересматривай с ними. Русские субтитры не использовать.

**Не застревай на словах.** Цель — понимать, не останавливаясь на каждом слове. Не выписывай всё подряд; если слово реально мешает и повторяется — пара штук за серию в [[word-tracker|базу слов]], не больше.

Акцент перепроверен вручную (не-американские помечены). Уровень — с рекомендаций платформ изучения языка (наведи на бейдж уровня — увидишь источник).

```dataviewjs
const CSV = "english-watchlist/watchlist.csv";
const root = dv.container.createDiv();
const lvlColor={A1:"#16a34a",A2:"#16a34a",B1:"#0891b2",B2:"#ea580c",C1:"#dc2626",C2:"#dc2626"};
const mediaRu={cartoon:"мультсериал",anime:"аниме (дубляж)",sitcom:"ситком",drama:"сериал",learner:"для изучающих"};
const lvlOrder={A1:1,A2:2,B1:3,B2:4,C1:5,C2:6};
const esc=s=>(s==null?"":s.toString()).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const int=v=>{const n=parseInt(v);return isNaN(n)?0:n;};

function parseCSV(t){
  t=t.replace(/\r\n/g,"\n"); const rows=[]; let row=[],f="",q=false,i=0;
  while(i<t.length){const c=t[i];
    if(q){ if(c==='"'){ if(t[i+1]==='"'){f+='"';i+=2;continue;} q=false;i++; } else {f+=c;i++;} }
    else { if(c==='"'){q=true;i++;} else if(c===','){row.push(f);f="";i++;} else if(c==='\n'){row.push(f);rows.push(row);row=[];f="";i++;} else {f+=c;i++;} }
  }
  if(f.length||row.length){row.push(f);rows.push(row);}
  const header=rows.shift();
  return {header, rows: rows.filter(r=>r.length>1 || (r[0]&&r[0].length))};
}
const cell=v=>{v=(v==null?"":String(v)); return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;};
const toCSV=(h,rows)=>[h.map(cell).join(","),...rows.map(r=>r.map(cell).join(","))].join("\n")+"\n";
async function loadObjs(){
  const {header,rows}=parseCSV(await app.vault.adapter.read(CSV));
  return rows.map(r=>Object.fromEntries(header.map((h,i)=>[h,r[i]])));
}
async function mutate(title, fn){
  const {header,rows}=parseCSV(await app.vault.adapter.read(CSV));
  const idx=Object.fromEntries(header.map((h,i)=>[h,i]));
  for(const r of rows){ if(r[idx.title]===title) fn(r, idx); }
  await app.vault.adapter.write(CSV, toCSV(header,rows));
  await render();
}
function setStatus(title,status){
  return mutate(title,(r,idx)=>{
    const cur=r[idx.status]; const ns=(cur===status?"backlog":status);
    r[idx.status]=ns;
    const total=int(r[idx.episodes]);
    if(ns==="watched" && total) r[idx.watched_eps]=String(total);
    if(ns==="backlog") r[idx.watched_eps]="0";
  });
}
function setEps(title,n){
  return mutate(title,(r,idx)=>{
    const total=int(r[idx.episodes]);
    let w=Math.max(0,n); if(total) w=Math.min(total,w);
    r[idx.watched_eps]=String(w);
    if(total && w>=total) r[idx.status]="watched";
    else if(w>0) r[idx.status]="watching";
  });
}
function statusBtns(p){
  const opts=[["planned","очередь","#6b7280"],["watching","смотрю","#0891b2"],["watched","готово","#16a34a"]];
  return `<div style="display:flex;gap:4px;margin-top:6px">`+opts.map(([v,l,on])=>{
    const a=p.status===v;
    return `<button data-st="${v}" data-title="${esc(p.title)}" style="flex:1;cursor:pointer;font-size:.68em;padding:3px 0;border:1px solid var(--background-modifier-border);border-radius:6px;background:${a?on:'transparent'};color:${a?'#fff':'var(--text-muted)'}">${l}</button>`;
  }).join("")+`</div>`;
}
function progress(p){
  const total=int(p.episodes), w=int(p.watched_eps);
  if(!total) return "";
  const pct=Math.min(100,Math.round(w/total*100));
  return `<div style="margin-top:7px">
    <div style="height:5px;background:var(--background-modifier-border);border-radius:4px;overflow:hidden"><div style="height:100%;width:${pct}%;background:#0891b2"></div></div>
    <div style="display:flex;align-items:center;gap:5px;margin-top:4px;font-size:.7em;color:var(--text-muted)">
      <input type="number" min="0" max="${total}" value="${w}" data-eps="${esc(p.title)}" style="width:3.4em;font-size:1em;padding:1px 4px;background:var(--background-primary);border:1px solid var(--background-modifier-border);border-radius:4px;color:var(--text-normal)">
      <span>/ ${total} эп.</span>
    </div></div>`;
}
const accent=a=>{a=(a||"").toString();const c=a==="British"?"#dc2626":a==="Mixed"?"#ea580c":"#7c8699";return `<span style="color:${c};font-size:.72em">${esc(a)}</span>`;};
function card(p){
  const lc=lvlColor[p.level]||"#64748b";
  const cover=p.cover?`<img src="${esc(p.cover)}" loading="lazy" style="width:100%;aspect-ratio:2/3;object-fit:cover;display:block">`
    :`<div style="aspect-ratio:2/3;display:flex;align-items:center;justify-content:center;background:#1f2430;color:#7c8699;font-size:.78em">нет обложки</div>`;
  return `<div style="border:1px solid var(--background-modifier-border);border-radius:10px;overflow:hidden;background:var(--background-secondary-alt);display:flex;flex-direction:column;${p.status==='watched'?'opacity:.55':''}">
    <div style="position:relative">${cover}<span style="position:absolute;top:6px;right:6px;background:${lc};color:#fff;font-weight:700;font-size:.72em;padding:2px 7px;border-radius:20px" title="${esc(p.level_src||'')}">${esc(p.level)}</span></div>
    <div style="padding:9px 10px;display:flex;flex-direction:column;gap:4px;flex:1">
      <div style="font-weight:700;font-size:.92em;line-height:1.2">${esc(p.title)}</div>
      <div style="display:flex;justify-content:space-between;gap:6px;color:var(--text-muted);font-size:.72em"><span>${mediaRu[p.media]||esc(p.media)} · ${esc(p.year)}</span>${accent(p.accent)}</div>
      <div style="color:var(--text-normal);font-size:.76em;line-height:1.35;opacity:.85;flex:1">${esc(p.desc)}</div>
      ${progress(p)}
      ${statusBtns(p)}
    </div></div>`;
}
const grid=arr=>arr.length?`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:14px;margin:6px 0 22px">${arr.map(card).join("")}</div>`:"<p style='color:var(--text-muted)'>— пусто —</p>";

async function render(){
  const objs=await loadObjs();
  const by=s=>objs.filter(r=>r.status===s).sort((a,b)=>(lvlOrder[a.level]||9)-(lvlOrder[b.level]||9));
  const done=objs.filter(r=>r.status==="watched").length, total=objs.length;
  let html=`<div style="margin:4px 0 16px"><div style="font-size:.8em;color:var(--text-muted);margin-bottom:4px">Просмотрено ${done} из ${total}</div><div style="height:8px;background:var(--background-modifier-border);border-radius:6px;overflow:hidden"><div style="height:100%;width:${total?Math.round(done/total*100):0}%;background:#16a34a"></div></div></div>`;
  const sect=(t,arr)=>{ html+=`<h3>${t} (${arr.length})</h3>`+grid(arr); };
  sect("Сейчас смотрю",by("watching"));
  sect("В очереди",by("planned"));
  sect("Просмотрено",by("watched"));
  const backlog=objs.filter(r=>r.status==="backlog").sort((a,b)=>(lvlOrder[a.level]||9)-(lvlOrder[b.level]||9));
  html+=`<h2>Каталог по уровням (${backlog.length})</h2>`;
  for(const lvl of ["A1","A2","B1","B2"]){const arr=backlog.filter(r=>r.level===lvl);if(arr.length) sect(`Уровень ${lvl}`,arr);}
  root.innerHTML=html;
}
root.addEventListener("click", async e=>{
  const b=e.target.closest("button[data-st]");
  if(!b) return; b.disabled=true;
  try{ await setStatus(b.dataset.title,b.dataset.st); }catch(err){ new Notice("Ошибка: "+err.message); }
});
root.addEventListener("change", async e=>{
  const inp=e.target.closest("input[data-eps]");
  if(!inp) return;
  try{ await setEps(inp.dataset.eps, int(inp.value)); }catch(err){ new Notice("Ошибка: "+err.message); }
});
await render();
```
