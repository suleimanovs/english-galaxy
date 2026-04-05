#!/usr/bin/env node
// setup-true-friends.js — One-time setup: writes sentences to CSV,
// exports to Anki, adds audio, generates cloze cards, adds word families.

const fs   = require('fs');
const path = require('path');

const ANKI_DIR  = __dirname;
const CSV_PATH  = path.join(ANKI_DIR, 'true-friends-tracker.csv');
const AUDIO_DIR = path.join(ANKI_DIR, 'audio');
const ANKI_URL  = 'http://localhost:8765';
const DECK_NAME = 'EG — True Friends';
const ANKI_MODEL = 'Простая';
const CLOZE_MODEL = 'Задание с пропусками';
const TAG_PREFIX = 'tf';

const SENTENCES = {
  "airport":     ["The **airport** is 20 minutes from the city.", "We arrived at the **airport** early.", "The new **airport** is very modern."],
  "bank":        ["I need to go to the **bank** today.", "The **bank** is closed on Sunday.", "She works at a big **bank**."],
  "bar":         ["Let's meet at the **bar** after work.", "There is a small **bar** near the hotel.", "He ordered a drink at the **bar**."],
  "boss":        ["My **boss** is very kind.", "The **boss** called a meeting today.", "She is the **boss** of the company."],
  "bus":         ["I take the **bus** to work every day.", "The **bus** was late again.", "We waited for the **bus** in the rain."],
  "café":        ["Let's have lunch at a **café**.", "There is a nice **café** on the corner.", "She reads books in the **café**."],
  "chocolate":   ["I love dark **chocolate**.", "She bought a box of **chocolate**.", "Would you like some **chocolate**?"],
  "class":       ["Our English **class** starts at nine.", "There are 20 students in the **class**.", "She is the best in the **class**."],
  "club":        ["He goes to a sports **club** every week.", "They opened a new **club** in town.", "She joined the book **club**."],
  "coffee":      ["I drink **coffee** every morning.", "Would you like a cup of **coffee**?", "This **coffee** is very strong."],
  "computer":    ["I work on a **computer** all day.", "My **computer** is very old.", "She bought a new **computer**."],
  "concert":     ["We went to a **concert** last night.", "The **concert** starts at eight.", "She plays the piano at **concerts**."],
  "doctor":      ["I need to see a **doctor**.", "The **doctor** said I am fine.", "She wants to become a **doctor**."],
  "film":        ["We watched a great **film** yesterday.", "This **film** is two hours long.", "He makes **films** about nature."],
  "football":    ["He plays **football** every weekend.", "**Football** is very popular here.", "We watched a **football** match on TV."],
  "guitar":      ["She plays the **guitar** very well.", "He bought a new **guitar**.", "I want to learn the **guitar**."],
  "hotel":       ["We stayed at a nice **hotel**.", "The **hotel** has a big pool.", "She booked a **hotel** for two nights."],
  "idea":        ["That is a great **idea**!", "I have no **idea** what to do.", "She came up with a new **idea**."],
  "internet":    ["The **internet** is very fast here.", "I found it on the **internet**.", "We have no **internet** at home today."],
  "jazz":        ["She loves **jazz** music.", "We went to a **jazz** concert.", "He listens to **jazz** every evening."],
  "jeans":       ["She wears **jeans** every day.", "I bought new **jeans** yesterday.", "These **jeans** are very comfortable."],
  "journalist":  ["The **journalist** asked many questions.", "She works as a **journalist**.", "A **journalist** wrote about the event."],
  "lamp":        ["Turn on the **lamp**, please.", "There is a **lamp** on the table.", "The **lamp** in my room is broken."],
  "lemon":       ["I like tea with **lemon**.", "She squeezed a **lemon** into the water.", "This **lemon** is very sour."],
  "marathon":    ["He ran a **marathon** last year.", "The **marathon** starts at seven.", "She is training for a **marathon**."],
  "manager":     ["The **manager** of the shop helped me.", "She is a good **manager**.", "I spoke to the **manager** about the problem."],
  "minute":      ["Wait a **minute**, please.", "The film starts in five **minutes**.", "It takes ten **minutes** to walk there."],
  "museum":      ["We visited a **museum** yesterday.", "The **museum** is free on Sundays.", "There are old paintings in the **museum**."],
  "music":       ["I listen to **music** every day.", "She studies **music** at school.", "What kind of **music** do you like?"],
  "office":      ["He works in an **office**.", "The **office** opens at nine.", "She left her bag in the **office**."],
  "park":        ["We walk in the **park** every evening.", "The **park** is very beautiful in spring.", "Children play in the **park**."],
  "passport":    ["Don't forget your **passport**.", "My **passport** is valid for ten years.", "She lost her **passport** at the airport."],
  "photo":       ["She took a **photo** of the sunset.", "Can I see your **photo**?", "He posted the **photo** online."],
  "pilot":       ["The **pilot** landed the plane safely.", "She wants to be a **pilot**.", "The **pilot** spoke to the passengers."],
  "pizza":       ["Let's order a **pizza**.", "This **pizza** is very tasty.", "She makes great **pizza** at home."],
  "planet":      ["Earth is our **planet**.", "Mars is a red **planet**.", "There are eight **planets** in our system."],
  "police":      ["Call the **police** right now!", "The **police** arrived in five minutes.", "She works for the **police**."],
  "president":   ["The **president** gave a speech.", "She is the **president** of the company.", "The **president** met with world leaders."],
  "problem":     ["That is a big **problem**.", "We need to solve this **problem**.", "No **problem**, I can help you."],
  "professor":   ["The **professor** teaches history.", "She is a famous **professor**.", "I asked the **professor** a question."],
  "program":     ["This **program** is very useful.", "She wrote a computer **program**.", "The TV **program** starts at eight."],
  "radio":       ["I listen to the **radio** in the car.", "Turn on the **radio**, please.", "She works at a **radio** station."],
  "restaurant":  ["We had dinner at a **restaurant**.", "The **restaurant** is very popular.", "She works in a French **restaurant**."],
  "robot":       ["The **robot** can clean the house.", "He built a small **robot**.", "**Robots** help in factories."],
  "salad":       ["I had a green **salad** for lunch.", "She makes a great fruit **salad**.", "Would you like some **salad**?"],
  "signal":      ["The phone has no **signal** here.", "Wait for my **signal** to start.", "The **signal** was very weak."],
  "sport":       ["**Sport** is good for your health.", "What is your favourite **sport**?", "She does **sport** every morning."],
  "student":     ["She is a university **student**.", "The **students** are in the classroom.", "He is a very good **student**."],
  "system":      ["The **system** is easy to use.", "We need a better **system**.", "The school **system** is different here."],
  "taxi":        ["Let's take a **taxi** to the airport.", "The **taxi** arrived in two minutes.", "She called a **taxi**."],
  "telephone":   ["The **telephone** is ringing.", "She answered the **telephone**.", "There is a **telephone** on the desk."],
  "television":  ["I watch **television** in the evening.", "There is a big **television** in the room.", "She turned off the **television**."],
  "tennis":      ["He plays **tennis** twice a week.", "She won the **tennis** match.", "We watched **tennis** on TV."],
  "test":        ["I have a **test** tomorrow.", "She passed the **test** easily.", "The **test** was very difficult."],
  "text":        ["Read the **text** carefully.", "She sent me a **text** message.", "The **text** is very short."],
  "tourist":     ["The city is full of **tourists**.", "She works as a **tourist** guide.", "Many **tourists** visit the museum."],
  "university":  ["She studies at the **university**.", "The **university** is very old.", "He wants to go to **university**."],
  "video":       ["She made a **video** about cooking.", "I watched a funny **video** online.", "He records **videos** every week."],
  "vitamin":     ["Take your **vitamins** every day.", "This juice has a lot of **vitamins**.", "**Vitamin** C is good for you."],
  "yoga":        ["She does **yoga** every morning.", "**Yoga** helps me relax.", "I started a **yoga** class last week."],
  "zoo":         ["We took the kids to the **zoo**.", "The **zoo** has many animals.", "She loves going to the **zoo**."],
};

// ─── ANKI ────────────────────────────────────────────────────────────────────
async function ankiReq(action, params = {}) {
  const res = await fetch(ANKI_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, version: 6, params }) });
  const data = await res.json();
  if (data.error) throw new Error(`AnkiConnect [${action}]: ${data.error}`);
  return data.result;
}

function toTag(word) {
  return TAG_PREFIX + '_' + word.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

function buildFront(word, sentences) {
  const items = sentences.map(s => `<li>${s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')}</li>`).join('');
  return `<div style="font-size:1.4em;font-weight:bold;margin-bottom:0.8em">${word}</div><ol>${items}</ol>`;
}

// ─── CSV ─────────────────────────────────────────────────────────────────────
function readCSV() {
  const lines = fs.readFileSync(CSV_PATH, 'utf8').trim().split('\n');
  const header = lines[0];
  const entries = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('|');
    entries.push({
      word: cols[0]?.trim(), russian: cols[1]?.trim(),
      exportedAt: cols[2]?.trim(), status: cols[3]?.trim(),
      knownAt: cols[4]?.trim(),
      s1: cols[5]?.trim(), s2: cols[6]?.trim(), s3: cols[7]?.trim(),
      family: cols[8]?.trim(), _raw: cols
    });
  }
  return { header, entries };
}

function saveCSV(header, entries) {
  const esc = x => (x || '').replace(/\r/g, '').replace(/\n/g, '\\n').replace(/\|/g, ' ');
  const lines = [header];
  for (const e of entries) {
    lines.push([e.word, e.russian, e.exportedAt||'', e.status||'', e.knownAt||'',
      esc(e.s1), esc(e.s2), esc(e.s3), e.family||''].join('|'));
  }
  fs.writeFileSync(CSV_PATH, lines.join('\n'), 'utf8');
}

// ─── AUDIO ───────────────────────────────────────────────────────────────────
async function downloadAudio(word, filepath) {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(word)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 100) throw new Error('empty');
  fs.writeFileSync(filepath, buf);
  return buf;
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== setup-true-friends.js ===\n');

  const ver = await ankiReq('version');
  console.log(`AnkiConnect v${ver} ✓`);

  // Ensure deck exists
  const decks = await ankiReq('deckNames');
  if (!decks.includes(DECK_NAME)) {
    await ankiReq('createDeck', { deck: DECK_NAME });
    console.log(`Created deck "${DECK_NAME}"`);
  }

  if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

  // 1. Write sentences to CSV
  console.log('\n── Step 1: Writing sentences to CSV...');
  const { header, entries } = readCSV();
  for (const e of entries) {
    const s = SENTENCES[e.word];
    if (s) { e.s1 = s[0]; e.s2 = s[1]; e.s3 = s[2]; }
  }
  saveCSV(header, entries);
  console.log(`  ${entries.length} entries updated`);

  // 2. Export to Anki
  console.log('\n── Step 2: Exporting to Anki...');
  let exported = 0;
  for (const e of entries) {
    const sentences = [e.s1, e.s2, e.s3].filter(Boolean);
    if (sentences.length === 0) continue;

    const tag = toTag(e.word);
    const existing = await ankiReq('findNotes', { query: `deck:"${DECK_NAME}" tag:${tag}` });
    if (existing.length > 0) { continue; } // already exists

    const front = buildFront(e.word, sentences);
    const back = `<div style="font-size:1.2em">${e.russian}</div>` +
      `<div style="color:#5cb85c;margin-top:0.3em;font-size:0.9em">✓ True Friend — звучит как в русском!</div>` +
      (e.family ? `<div style="margin-top:0.6em;padding-top:0.5em;border-top:1px solid #444;font-size:0.9em;color:#aaa">Word family: ${e.family.replace(/(\w[\w\s-]*?) \(/g, '<b>$1</b> (')}</div>` : '');

    try {
      await ankiReq('addNote', {
        note: { deckName: DECK_NAME, modelName: ANKI_MODEL,
          fields: { Front: front, Back: back },
          tags: ['true-friends', tag],
          options: { allowDuplicate: false } }
      });
      e.exportedAt = new Date().toISOString().split('T')[0];
      e.status = 'learning';
      exported++;
      process.stdout.write(`  ${e.word} ✓  `);
    } catch (err) {
      if (err.message.includes('duplicate')) { e.exportedAt = e.exportedAt || new Date().toISOString().split('T')[0]; e.status = 'learning'; }
      else console.log(`  ${e.word} ✗ ${err.message}`);
    }
  }
  saveCSV(header, entries);
  console.log(`\n  Exported: ${exported}`);

  // 3. Audio
  console.log('\n── Step 3: Downloading audio...');
  let audioOk = 0;
  for (const e of entries) {
    const slug = e.word.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const fname = `eg_tf_${slug}.mp3`;
    const fpath = path.join(AUDIO_DIR, fname);

    try {
      if (!fs.existsSync(fpath)) {
        await downloadAudio(e.word, fpath);
        await new Promise(r => setTimeout(r, 100));
      }
      // Upload + update card
      const base64 = fs.readFileSync(fpath).toString('base64');
      await ankiReq('storeMediaFile', { filename: fname, data: base64 });
      const tag = toTag(e.word);
      const noteIds = await ankiReq('findNotes', { query: `deck:"${DECK_NAME}" tag:${tag}` });
      if (noteIds.length > 0) {
        const info = await ankiReq('notesInfo', { notes: [noteIds[0]] });
        if (!info[0].fields.Front.value.includes(`[sound:${fname}]`)) {
          const clean = info[0].fields.Front.value.replace(/\[sound:[^\]]+\]/g, '').trim();
          await ankiReq('updateNoteFields', { note: { id: noteIds[0], fields: { Front: clean + `\n[sound:${fname}]` } } });
        }
      }
      audioOk++;
      process.stdout.write('.');
    } catch (err) {
      process.stdout.write('x');
    }
  }
  console.log(`\n  Audio: ${audioOk}/${entries.length}`);

  // 4. Cloze cards
  console.log('\n── Step 4: Generating cloze cards...');
  let clozeOk = 0;
  for (const e of entries) {
    const sentences = [e.s1, e.s2, e.s3].filter(s => s && s.includes('**'));
    if (sentences.length === 0) continue;

    const clozeTag = toTag(e.word) + '_cloze';
    const existing = await ankiReq('findNotes', { query: `deck:"${DECK_NAME}" tag:${clozeTag}` });
    if (existing.length > 0) continue;

    const clozeLines = sentences.map((s, i) => `${i+1}. ${s.replace(/\*\*(.+?)\*\*/g, '{{c1::$1}}')}`).join('<br>');
    const clozeText = `<div style="font-size:1.1em;line-height:2">${clozeLines}</div>`;
    const slug = e.word.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const audioFile = `eg_tf_${slug}.mp3`;
    const hasAudio = fs.existsSync(path.join(AUDIO_DIR, audioFile));

    const backText = `<div style="font-size:1.1em;color:#888">${e.word} — ${e.russian}</div>` +
      (e.family ? `<div style="margin-top:0.6em;padding-top:0.5em;border-top:1px solid #444;font-size:0.9em;color:#aaa">Word family: ${e.family.replace(/(\w[\w\s-]*?) \(/g, '<b>$1</b> (')}</div>` : '');

    try {
      await ankiReq('addNote', {
        note: { deckName: DECK_NAME, modelName: CLOZE_MODEL,
          fields: { 'Текст': (hasAudio ? clozeText + `\n[sound:${audioFile}]` : clozeText), 'Дополнение оборота': backText },
          tags: ['true-friends', toTag(e.word), clozeTag],
          options: { allowDuplicate: false } }
      });
      clozeOk++;
    } catch {}
  }
  console.log(`  Cloze: ${clozeOk}`);

  console.log('\n═══ Done! ═══');
}

main().catch(e => { console.error(e); process.exit(1); });
