# English watchlist

Прокачка английского через американский контент. Вся информация — в карточках ниже; данные лежат в `watchlist.csv`. **Статус меняется кнопками на карточке** (`очередь` / `смотрю` / `готово`) — клик сразу пишется в CSV. Повторный клик по активной кнопке снимает статус (обратно в каталог).

**Как это работает.** Язык усваивается, когда много слушаешь интересное и чуть выше своего уровня — смысл достраивается из контекста. Правило одно: смотреть регулярно и помногу. Маршрут по сложности: мультсериалы → ситкомы → драмы и фильмы.

**Субтитры.** A2–B1 — английские включены; B1–B2 — английские, но опирайся на слух; B2+ — без субтитров, важные сцены пересматривай с ними. Русские субтитры не использовать.

**Не застревай на словах.** Цель — понимать, не останавливаясь на каждом слове. Не выписывай всё подряд; если слово реально мешает и повторяется — пара штук за серию в [[word-tracker|базу слов]], не больше.

Акцент перепроверен вручную (не-американские помечены). Уровень — с рекомендаций платформ изучения языка (наведи на бейдж уровня — увидишь источник).

```dataviewjs
const CSV = "english-watchlist/watchlist.csv";
const root = dv.container.createDiv();
const lvlColor={A1:"#16a34a",A2:"#16a34a",B1:"#0891b2",B2:"#ea580c",C1:"#dc2626",C2:"#dc2626"};
const mediaRu={cartoon:"мультсериал",anime:"аниме (дубляж)",sitcom:"ситком",drama:"сериал",movie:"фильм",learner:"для изучающих"};
const lvlOrder={A1:1,A2:2,B1:3,B2:4,C1:5,C2:6};
const esc=s=>(s==null?"":s.toString()).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

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
async function setStatus(title,status){
  const {header,rows}=parseCSV(await app.vault.adapter.read(CSV));
  const ti=header.indexOf("title"), si=header.indexOf("status");
  for(const r of rows){ if(r[ti]===title){ r[si]=(r[si]===status?"backlog":status); } }
  await app.vault.adapter.write(CSV, toCSV(header,rows));
  await render();
}
function statusBtns(p){
  const opts=[["planned","очередь","#6b7280"],["watching","смотрю","#0891b2"],["watched","готово","#16a34a"]];
  return `<div style="display:flex;gap:4px;margin-top:6px">`+opts.map(([v,l,on])=>{
    const act=p.status===v;
    return `<button data-title="${esc(p.title)}" data-act="${v}" style="flex:1;cursor:pointer;font-size:.68em;padding:3px 0;border:1px solid var(--background-modifier-border);border-radius:6px;background:${act?on:'transparent'};color:${act?'#fff':'var(--text-muted)'}">${l}</button>`;
  }).join("")+`</div>`;
}
const accent=a=>{a=(a||"").toString();const c=a==="British"?"#dc2626":a==="Mixed"?"#ea580c":"#7c8699";return `<span style="color:${c};font-size:.72em">${esc(a)}</span>`;};
function card(p){
  const lc=lvlColor[p.level]||"#64748b";
  const cover=p.cover?`<img src="${esc(p.cover)}" loading="lazy" style="width:100%;aspect-ratio:2/3;object-fit:cover;display:block">`
    :`<div style="aspect-ratio:2/3;display:flex;align-items:center;justify-content:center;background:#1f2430;color:#7c8699;font-size:.78em">нет обложки</div>`;
  const amount=p.episodes?`${p.episodes} эп.`:(p.runtime||"");
  return `<div style="border:1px solid var(--background-modifier-border);border-radius:10px;overflow:hidden;background:var(--background-secondary-alt);display:flex;flex-direction:column;${p.status==='watched'?'opacity:.55':''}">
    <div style="position:relative">${cover}<span style="position:absolute;top:6px;right:6px;background:${lc};color:#fff;font-weight:700;font-size:.72em;padding:2px 7px;border-radius:20px" title="${esc(p.level_src||'')}">${esc(p.level)}</span></div>
    <div style="padding:9px 10px;display:flex;flex-direction:column;gap:4px;flex:1">
      <div style="font-weight:700;font-size:.92em;line-height:1.2">${esc(p.title)}</div>
      <div style="display:flex;justify-content:space-between;gap:6px;color:var(--text-muted);font-size:.72em"><span>${mediaRu[p.media]||esc(p.media)} · ${esc(p.year)}${amount?` · ${amount}`:""}</span>${accent(p.accent)}</div>
      <div style="color:var(--text-normal);font-size:.76em;line-height:1.35;opacity:.85;flex:1">${esc(p.desc)}</div>
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
  for(const lvl of ["A1","A2","B1","B2","C1","C2"]){const arr=backlog.filter(r=>r.level===lvl);if(arr.length) sect(`Уровень ${lvl}`,arr);}
  root.innerHTML=html;
}
root.addEventListener("click", async e=>{
  const b=e.target.closest("button[data-act]");
  if(!b) return;
  b.disabled=true;
  try{ await setStatus(b.dataset.title, b.dataset.act); }catch(err){ new Notice("Ошибка записи статуса: "+err.message); }
});
await render();
```
