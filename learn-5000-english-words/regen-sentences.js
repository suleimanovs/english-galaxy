#!/usr/bin/env node
// regen-sentences.js — updates word-tracker.csv and Anki with simple hardcoded sentences.
// Usage: node regen-sentences.js

const fs   = require('fs');
const path = require('path');

const DIR      = __dirname;
const CSV_PATH = path.join(DIR, 'word-tracker.csv');
const ANKI_URL = 'http://localhost:8765';
const ANKI_DECK  = 'English Galaxy';
const ANKI_MODEL = 'Простая';

// ─── SENTENCES ───────────────────────────────────────────────────────────────
// Format: word → [s1, s2, s3]   (**word** marks bold)
const SENTENCES = {
  "corner":        ["The cat sleeps in the **corner**.", "Turn the **corner** to find the park.", "There is a lamp in the **corner**."],
  "tiring":        ["The long walk was very **tiring**.", "Work can be **tiring** sometimes.", "The trip was **tiring** but fun."],
  "yard":          ["The kids play in the **yard**.", "We have a big **yard** at home.", "The dog runs in the **yard**."],
  "rope":          ["He tied the box with a **rope**.", "She held the **rope** tightly.", "We need a **rope** to climb."],
  "ground":        ["The apple fell on the **ground**.", "We sat on the **ground** to eat.", "The **ground** was wet after rain."],
  "butter":        ["I put **butter** on my bread.", "She cooked eggs with **butter**.", "Can you pass the **butter**?"],
  "desert":        ["The **desert** is very hot and dry.", "Camels live in the **desert**.", "There is no water in the **desert**."],
  "circus":        ["We went to the **circus** last night.", "The clown was funny at the **circus**.", "My kids loved the **circus** show."],
  "accent":        ["She has a nice French **accent**.", "I like his Spanish **accent**.", "He speaks English with an **accent**."],
  "appreciate":    ["I really **appreciate** your help.", "We **appreciate** your kindness.", "She **appreciated** the gift very much."],
  "cycling":       ["I go **cycling** every morning.", "**Cycling** is good for your health.", "We went **cycling** in the park."],
  "vocabulary":    ["Reading helps you grow your **vocabulary**.", "She has a big **vocabulary** in English.", "I learn new **vocabulary** every day."],
  "shop assistant":["The **shop assistant** helped me find shoes.", "She works as a **shop assistant**.", "I asked the **shop assistant** for help."],
  "profitable":    ["The small café is very **profitable**.", "This idea can be **profitable**.", "His shop became **profitable** in a year."],
  "vegetables":    ["I eat **vegetables** every day.", "She bought fresh **vegetables** at the market.", "**Vegetables** are good for your health."],
  "amazing.":      ["The show was **amazing**!", "She has an **amazing** voice.", "We had an **amazing** time together."],
  "close":         ["Please **close** the window.", "She is my **close** friend.", "**Close** the door when you leave."],
  "vet":           ["I took my cat to the **vet**.", "The **vet** said my dog is healthy.", "She wants to be a **vet**."],
  "nurse":         ["The **nurse** took my temperature.", "A kind **nurse** helped my mother.", "She works as a **nurse** at a hospital."],
  "skiing":        ["I love **skiing** in winter.", "We went **skiing** last weekend.", "**Skiing** is fun but hard to learn."],
  "thief":         ["The police caught the **thief**.", "A **thief** took her bag.", "Never leave your bag alone — a **thief** may take it."],
  "towel":         ["I need a **towel** after my shower.", "She dried her hair with a **towel**.", "Bring a **towel** to the beach."],
  "slim":          ["She has a **slim** figure.", "He looks very **slim** now.", "The chance of winning is very **slim**."],
  "mark":          ["I got a good **mark** in English.", "She got a bad **mark** on the test.", "He wants to get a high **mark**."],
  "generous":      ["She is very **generous** with her time.", "He is a **generous** friend.", "Thank you for being so **generous**."],
  "lovely":        ["What a **lovely** day!", "She has a **lovely** smile.", "The garden looks **lovely** in spring."],
  "roof":          ["The cat sat on the **roof**.", "There is snow on the **roof**.", "We need to fix our **roof**."],
  "greatly":       ["I **greatly** enjoy reading books.", "The weather **greatly** improved today.", "She **greatly** helped the team."],
  "hang":          ["I will **hang** the picture on the wall.", "She **hung** her coat by the door.", "He likes to **hang** out with friends."],
  "inspire":       ["Good teachers **inspire** their students.", "Music can **inspire** you to create.", "Her story can **inspire** many people."],
  "confidence":    ["He spoke with great **confidence**.", "She has a lot of **confidence**.", "Practice builds your **confidence**."],
  "neсklace":      ["She wore a beautiful **necklace**.", "He gave her a gold **necklace**.", "I lost my **necklace** at the park."],
  "sick":          ["I stayed home because I was **sick**.", "She feels **sick** today.", "The **sick** child stayed in bed."],
  "condition":     ["The car is in good **condition**.", "She is in poor **condition** after the fall.", "What are the **conditions** of the job?"],
  "consider":      ["I will **consider** your idea.", "We **consider** him a good friend.", "Please **consider** all options before deciding."],
  "satisfaction":  ["She smiled with **satisfaction** after the test.", "He felt great **satisfaction** at work.", "The meal gave me real **satisfaction**."],
  "skirt":         ["She wears a red **skirt** to school.", "I bought a new **skirt** at the shop.", "Her **skirt** is very pretty."],
  "weigh":         ["I **weigh** myself every morning.", "How much does this bag **weigh**?", "The apples **weigh** two kilograms."],
  "composition":   ["I wrote a **composition** about my family.", "Her **composition** got a high mark.", "The teacher liked my **composition**."],
  "tall":          ["He is very **tall** for his age.", "That building is very **tall**.", "She is the **tallest** person in the class."],
  "tax":           ["We all pay **tax** on our income.", "The price includes **tax**.", "He forgot to pay his **tax**."],
  "windy":         ["It is very **windy** today.", "The **windy** weather blew away my hat.", "We stayed inside on the **windy** day."],
  "tongue":        ["She bit her **tongue** by accident.", "The dog licked my hand with its **tongue**.", "A **tongue** is used for tasting food."],
  "acquaintance":  ["He is an old **acquaintance** of mine.", "I met an **acquaintance** at the shop.", "She is an **acquaintance**, not a close friend."],
  "district":      ["She lives in a nice **district**.", "The school is in our **district**.", "This is a busy **district** of the city."],
  "membership":    ["I have a gym **membership**.", "She renewed her club **membership**.", "A library **membership** is free here."],
  "overcrowded":   ["The bus was very **overcrowded**.", "The city center is **overcrowded** at noon.", "The school is **overcrowded** with students."],
  "spacious":      ["Their new flat is very **spacious**.", "We need a **spacious** room for the party.", "The kitchen is big and **spacious**."],
  "confident":     ["She felt **confident** before the exam.", "He is a very **confident** speaker.", "Be **confident** when you talk to people."],
  "pregnant":      ["She is **pregnant** with her first child.", "The **pregnant** woman sat on the bench.", "My sister is **pregnant** and very happy."],
  "accurate":      ["The map was very **accurate**.", "Please give an **accurate** answer.", "Her work is always **accurate**."],
  "frighten":      ["The loud noise **frightened** the dog.", "Don't **frighten** the children with stories.", "Thunder can **frighten** small animals."],
  "breathe":       ["**Breathe** slowly and stay calm.", "It is hard to **breathe** in smoke.", "She took a deep breath and smiled."],
  "calories":      ["This cake has many **calories**.", "I count my **calories** every day.", "Exercise helps you burn **calories**."],
  "karate":        ["My son does **karate** after school.", "She got a black belt in **karate**.", "**Karate** keeps you fit and focused."],
  "soccer":        ["We play **soccer** in the park.", "He watches **soccer** every weekend.", "**Soccer** is popular all over the world."],
  "resort":        ["We spent our holiday at a beach **resort**.", "The **resort** had a big pool.", "It is a lovely ski **resort**."],
  "scissors":      ["Can I use your **scissors**?", "She cut the paper with **scissors**.", "The **scissors** are on the table."],
  "count on":      ["You can always **count on** me.", "I **counted on** her to help.", "Can we **count on** you tomorrow?"],
  "in front of":   ["She stood **in front of** the class.", "Park the car **in front of** the house.", "He sat **in front of** me on the bus."],
  "post":          ["I need to **post** this letter today.", "She works at the local **post** office.", "Can you **post** this for me?"],
  "pretty":        ["She is very **pretty**.", "It is a **pretty** small problem.", "He bought her a **pretty** scarf."],
  "belt":          ["He forgot to wear a **belt** today.", "She bought a new leather **belt**.", "Fasten your **belt** before driving."],
  "dishes":        ["I wash the **dishes** after dinner.", "All the **dishes** are clean now.", "She cooked two **dishes** for lunch."],
  "inform":        ["Please **inform** me when you arrive.", "She **informed** the teacher of the problem.", "We will **inform** you about the result."],
  "broaden":       ["Travel can **broaden** your mind.", "Reading books **broadens** your knowledge.", "This course will **broaden** your skills."],
  "innocent":      ["The man was **innocent** of the crime.", "She looked **innocent** and surprised.", "The child was **innocent** and kind."],
  "outdoors":      ["I love spending time **outdoors**.", "We had lunch **outdoors** in the garden.", "**Outdoors** is a great place to exercise."],
  "poverty":       ["Many families live in **poverty**.", "**Poverty** is a big problem in some cities.", "Education can help people escape **poverty**."],
  "pronunciation": ["Your **pronunciation** is getting better.", "Good **pronunciation** helps people understand you.", "She practices her **pronunciation** every day."],
  "seldom":        ["I **seldom** eat fast food.", "She **seldom** comes to class late.", "He **seldom** watches TV at night."],
  "sight":         ["The view was a beautiful **sight**.", "She has poor **sight** and wears glasses.", "We lost **sight** of the bird in the sky."],
  "thoroughly":    ["She cleaned the room **thoroughly**.", "Please read the text **thoroughly**.", "He **thoroughly** checked his work."],
  "certainly":     ["I will **certainly** help you.", "She is **certainly** right about that.", "This is **certainly** a good idea."],
  "harmfull":      ["Smoking is **harmful** to your health.", "Too much sun can be **harmful**.", "**Harmful** food is bad for children."],
  "polite":        ["Always be **polite** to your teachers.", "She is very **polite** and kind.", "It is **polite** to say thank you."],
  "anniversary":   ["Today is our wedding **anniversary**.", "We celebrate our **anniversary** every year.", "He forgot their **anniversary** again."],
  "get rid of":    ["I need to **get rid of** old clothes.", "She wants to **get rid of** her old phone.", "Let's **get rid of** this broken chair."],
  "rise":          ["The sun will **rise** at six.", "Prices **rise** every year.", "She watched the balloon **rise** in the sky."],
  "silly":         ["Don't be **silly** — just ask for help.", "He made a **silly** mistake.", "She laughed at his **silly** joke."],
  "go up":         ["Prices **go up** every year.", "We watched the balloon **go up**.", "The lift will **go up** to floor ten."],
  "go down":       ["The temperature will **go down** tonight.", "The price **went down** this week.", "She watched the sun **go down**."],
  "contest":       ["She won the singing **contest**.", "I entered a photo **contest** last week.", "He came second in the **contest**."],
  "guess":         ["Can you **guess** my age?", "I **guessed** the right answer.", "**Guess** who I saw at the shop!"],
  "perhaps":       ["**Perhaps** we can meet tomorrow.", "It will **perhaps** rain today.", "She is **perhaps** the best student in class."],
  "attend":        ["All students must **attend** the class.", "She **attended** the meeting on Monday.", "He wants to **attend** college next year."],
  "bargain":       ["I found a great **bargain** at the market.", "That jacket is a real **bargain**.", "She is good at finding **bargains**."],
  "foot":          ["My **foot** hurts after the walk.", "She kicked the ball with her **foot**.", "He has a blister on his **foot**."],
  "fit":           ["Does this shirt **fit** you?", "These shoes don't **fit** me.", "She keeps **fit** by running every day."],
  "divorced":      ["Her parents got **divorced** last year.", "He is **divorced** and lives alone.", "She is **divorced** but very happy."],
  "citizen":       ["She is a **citizen** of France.", "Every **citizen** has the right to vote.", "He became a **citizen** after ten years."],
  "impress":       ["She wanted to **impress** her teacher.", "He **impressed** everyone at the meeting.", "The show **impressed** me very much."],
  "unpleasant":    ["The smell was very **unpleasant**.", "It was an **unpleasant** situation for all.", "She had an **unpleasant** experience at the shop."],
  "wise":          ["He is a very **wise** old man.", "It is **wise** to save your money.", "She gave me **wise** advice."],
  "prеdictable":   ["The story was too **predictable**.", "His jokes are very **predictable** now.", "The weather here is very **predictable**."],
  "ideal":         ["This is the **ideal** place for a picnic.", "She is the **ideal** student.", "The weather is **ideal** for a walk."],
  "notice":        ["Did you **notice** the new sign?", "I **noticed** she was not feeling well.", "He didn't **notice** me in the crowd."],
  "seat":          ["Is this **seat** free?", "She took a **seat** near the window.", "Please find your **seat** quickly."],
  "luckily":       ["**Luckily**, I had an umbrella.", "She didn't fall, **luckily**.", "**Luckily**, the shop was still open."],
  "ridiculous":    ["That price is **ridiculous**!", "He wore a **ridiculous** hat to the party.", "It looks **ridiculous** to wear shorts in winter."],
  "splendid":      ["The view was **splendid** from the top.", "She did a **splendid** job on the project.", "What a **splendid** idea!"],
  "save up":       ["I am **saving up** for a new phone.", "She **saved up** to buy a car.", "Let's **save up** for a holiday."],
  "although":      ["**Although** it rained, we had fun.", "She went out **although** she was tired.", "**Although** he is young, he is very smart."],
  "majority":      ["The **majority** of students passed the test.", "A **majority** of people like warm weather.", "The **majority** voted yes."],
  "paint":         ["I will **paint** the wall white.", "She likes to **paint** pictures.", "He used red **paint** for the door."],
  "speedy":        ["She made a **speedy** recovery.", "We need a **speedy** answer.", "He is a very **speedy** runner."],
  "cheek":         ["She kissed his **cheek** gently.", "The baby has rosy **cheeks**.", "He had a cut on his **cheek**."],
  "fortunately":   ["**Fortunately**, nobody was hurt.", "**Fortunately**, the train was on time.", "She arrived late, but **fortunately** the meeting had not started."],
  "peacefully":    ["The baby slept **peacefully** all night.", "They solved the problem **peacefully**.", "He sat **peacefully** by the river."],
  "tour":          ["We went on a city **tour** yesterday.", "She booked a **tour** of the museum.", "The **tour** lasted two hours."],
  "thought":       ["She had a good **thought** about the plan.", "I just had a **thought** — let's go today!", "He shared his **thought** with the group."],
  "customer":      ["The **customer** asked about the price.", "She is our best **customer**.", "Every **customer** gets a free coffee."],
  "midday":        ["We met at **midday** for lunch.", "The sun is very hot at **midday**.", "The meeting starts at **midday**."],
  "noon":          ["Let's have lunch at **noon**.", "It was almost **noon** when I woke up.", "The park is full of people at **noon**."],
  "stone":         ["She picked up a small **stone** from the path.", "The wall was made of **stone**.", "He threw a **stone** into the pond."],
  "hurry up":      ["**Hurry up**, or we will miss the bus!", "She told him to **hurry up**.", "Please **hurry up**, we are late."],
  "blow":          ["The wind began to **blow** hard.", "She **blew** out the candles on the cake.", "The cold wind **blew** down the street."],
  "cave":          ["The explorers found a dark **cave**.", "Bats live in a **cave**.", "The children hid in a small **cave**."],
  "grow up":       ["She wants to be a doctor when she **grows up**.", "He **grew up** in a small town.", "Children **grow up** so fast."],
  "hit":           ["The ball **hit** the window.", "He **hit** his head on the door.", "She **hit** the table by accident."],
  "at once":       ["Please come here **at once**!", "She understood the problem **at once**.", "He left **at once** after the call."],
  "otherwise":     ["Eat your dinner, **otherwise** you'll be hungry.", "Be careful, **otherwise** you may fall.", "Study hard, **otherwise** you won't pass."],
  "overcome":      ["She **overcame** her fear of flying.", "He worked hard to **overcome** the problem.", "You can **overcome** any challenge with effort."],
  "steal":         ["Someone tried to **steal** her bag.", "It is wrong to **steal** from others.", "The dog tried to **steal** food from the table."],
  "treasure":      ["They found a hidden **treasure** on the island.", "Friendship is a true **treasure**.", "He kept the old coin like a **treasure**."],
  "withdraw":      ["She went to the bank to **withdraw** money.", "I need to **withdraw** some cash today.", "He **withdrew** money from the ATM."],
  "accidentally":  ["She **accidentally** spilled her tea.", "He **accidentally** deleted the file.", "I **accidentally** called the wrong number."],
  "across":        ["She walked **across** the street.", "He swam **across** the river.", "The shop is just **across** the road."],
  "courageously":  ["She **courageously** spoke in front of everyone.", "He **courageously** jumped into the cold water.", "The firefighter **courageously** entered the building."],
  "forgive":       ["Please **forgive** me for being late.", "She **forgave** him for his mistake.", "It is hard to **forgive**, but it helps."],
  "hurt":          ["I **hurt** my knee while running.", "She fell and **hurt** her arm.", "Be careful not to **hurt** yourself."],
  "knee":          ["She hurt her **knee** playing football.", "He knelt on one **knee**.", "I have a bruise on my **knee**."],
  "pond":          ["The ducks swim in the **pond**.", "We sat by the **pond** and watched the fish.", "There is a small **pond** in the park."],
  "supplier":      ["We need a new **supplier** for fresh fruit.", "The **supplier** delivered the order on time.", "She called the **supplier** to check the price."],
  "potatoes":      ["I eat **potatoes** almost every day.", "She made soup with **potatoes** and carrots.", "We bought a bag of **potatoes** at the market."],
};

// ─── ANKI ────────────────────────────────────────────────────────────────────
async function ankiReq(action, params = {}) {
  const res = await fetch(ANKI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, version: 6, params })
  });
  const data = await res.json();
  if (data.error) throw new Error(`AnkiConnect [${action}]: ${data.error}`);
  return data.result;
}

function wordToTag(word) {
  return 'egw_' + word.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

function buildFront(word, sentences) {
  const items = sentences
    .map(s => `<li>${s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')}</li>`)
    .join('');
  return `<div style="font-size:1.4em;font-weight:bold;margin-bottom:0.8em">${word}</div><ol>${items}</ol>`;
}

async function upsertAnki(word, translation, filename, sentences) {
  const tag  = wordToTag(word);
  const front = buildFront(word, sentences);
  const back  = `<div style="font-size:1.2em">${translation}</div>`;
  const noteIds = await ankiReq('findNotes', { query: `deck:"${ANKI_DECK}" tag:${tag}` });
  if (noteIds.length > 0) {
    await ankiReq('updateNoteFields', { note: { id: noteIds[0], fields: { Front: front } } });
    return 'updated';
  } else {
    await ankiReq('addNote', {
      note: {
        deckName: ANKI_DECK, modelName: ANKI_MODEL,
        fields: { Front: front, Back: back },
        tags: ['english-galaxy', filename.replace(/\s+/g, '_'), tag],
        options: { allowDuplicate: false }
      }
    });
    return 'added';
  }
}

// ─── CSV ─────────────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split('\n').filter(l => l.trim());
  const tracker = {};
  for (let i = 1; i < lines.length; i++) {
    const p = lines[i].split('|');
    const word = p[0]?.trim();
    if (!word) continue;
    const unesc = s => (s || '').trim().replace(/\\n/g, '\n');
    tracker[word] = {
      translation: p[1]?.trim() || '',
      filename:    p[2]?.trim() || '',
      exportedAt:  p[3]?.trim() || '',
      status:      p[4]?.trim() || 'learning',
      knownAt:     p[5]?.trim() || '',
      sentences:   [unesc(p[6]), unesc(p[7]), unesc(p[8])].filter(s => s)
    };
  }
  return tracker;
}

function toCSV(tracker) {
  const rows = ['word|translation|filename|exportedAt|status|knownAt|s1|s2|s3'];
  for (const [word, d] of Object.entries(tracker)) {
    const s = d.sentences || [];
    const esc = x => (x || '').replace(/\r/g, '').replace(/\n/g, '\\n').replace(/\|/g, ' ');
    rows.push([word, d.translation, d.filename, d.exportedAt, d.status, d.knownAt || '',
               esc(s[0]), esc(s[1]), esc(s[2])].join('|'));
  }
  return rows.join('\n');
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== regen-sentences.js (hardcoded) ===\n');

  const tracker = parseCSV(fs.readFileSync(CSV_PATH, 'utf8'));
  console.log(`Loaded ${Object.keys(tracker).length} words from CSV`);

  try {
    const ver = await ankiReq('version');
    console.log(`AnkiConnect v${ver} ✓\n`);
  } catch {
    console.error('ERROR: Anki is not running! Start Anki and try again.');
    process.exit(1);
  }

  const words = Object.keys(tracker);
  let ok = 0, skipped = 0, errors = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const data = tracker[word];
    const sentences = SENTENCES[word];

    if (!sentences) {
      console.log(`[${i+1}/${words.length}] "${word}" — no sentences defined, skipping`);
      skipped++;
      continue;
    }

    process.stdout.write(`[${i+1}/${words.length}] "${word}" — `);
    try {
      const action = await upsertAnki(word, data.translation, data.filename, sentences);
      tracker[word].sentences = sentences;
      if (!tracker[word].exportedAt)
        tracker[word].exportedAt = new Date().toISOString().split('T')[0];
      fs.writeFileSync(CSV_PATH, toCSV(tracker), 'utf8');
      console.log(`✓ (${action})`);
      ok++;
    } catch (e) {
      console.log(`✗ ERROR: ${e.message}`);
      errors++;
    }
  }

  console.log(`\nDone! ✓ ${ok}  skipped ${skipped}  errors ${errors}`);
}

main().catch(e => { console.error(e); process.exit(1); });
