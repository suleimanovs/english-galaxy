#!/usr/bin/env node
// word-families-data.js — Hardcoded word families. Saves to CSV + updates Anki cards.
// Usage: node word-families-data.js

const fs   = require('fs');
const path = require('path');

const ANKI_DIR = __dirname;
const ROOT     = path.resolve(ANKI_DIR, '..', '..');
const ANKI_URL = 'http://localhost:8765';

// ─── WORD FAMILIES ───────────────────────────────────────────────────────────
// Format: word → "related1 (pos), related2 (pos), ..."
const FAMILIES = {
  // ── False Friends ──
  "accurate":    "accuracy (n.), accurately (adv.), inaccurate (adj.)",
  "actual":      "actually (adv.), actuality (n.)",
  "magazine":    "",
  "fabric":      "fabricate (v.), fabrication (n.)",
  "prospect":    "prospective (adj.), prospector (n.)",
  "sympathy":    "sympathize (v.), sympathetic (adj.), sympathetically (adv.)",
  "intelligent": "intelligence (n.), intelligently (adv.), unintelligent (adj.)",
  "cabinet":     "",
  "camera":      "",
  "data":        "database (n.)",
  "genial":      "geniality (n.), genially (adv.)",
  "complexion":  "",
  "conductor":   "conduct (v., n.), conduction (n.), conductive (adj.)",
  "list":        "listing (n.)",
  "novel":       "novelist (n.), novelty (n.)",
  "paragraph":   "",
  "patron":      "patronage (n.), patronize (v.)",
  "receipt":     "receive (v.), receiver (n.), reception (n.)",
  "replica":     "replicate (v.), replication (n.)",
  "resume":      "resumption (n.)",
  "stamp":       "",
  "brilliant":   "brilliance (n.), brilliantly (adv.)",
  "dramatic":    "dramatically (adv.), drama (n.), dramatize (v.)",
  "figure":      "figurative (adj.), figuratively (adv.), disfigure (v.)",
  "focus":       "focused (adj.), unfocused (adj.)",
  "insult":      "insulting (adj.), insultingly (adv.)",
  "lunatic":     "lunacy (n.)",
  "minister":    "ministry (n.), ministerial (adj.)",
  "original":    "originally (adv.), originality (n.), originate (v.), origin (n.)",
  "pretend":     "pretence (n.), pretension (n.), pretentious (adj.)",
  "realize":     "realization (n.), realistic (adj.), reality (n.), really (adv.)",
  "routine":     "routinely (adv.)",
  "scholar":     "scholarly (adj.), scholarship (n.)",
  "speculate":   "speculation (n.), speculative (adj.), speculator (n.)",
  "technique":   "technical (adj.), technically (adv.), technician (n.)",
  "trace":       "traceable (adj.), untraceable (adj.)",
  "translate":   "translation (n.), translator (n.)",
  "urban":       "urbanize (v.), urbanization (n.), suburban (adj.)",
  "baton":       "",
  "control":     "controller (n.), controllable (adj.), uncontrollable (adj.)",
  "decade":      "",
  "decoration":  "decorate (v.), decorative (adj.), decorator (n.)",
  "direction":   "direct (v., adj.), directly (adv.), director (n.), indirect (adj.)",
  "expert":      "expertise (n.), expertly (adv.)",
  "harmony":     "harmonious (adj.), harmonize (v.), harmoniously (adv.)",
  "mayor":       "mayoral (adj.)",
  "monitor":     "monitoring (n.)",
  "physician":   "physical (adj.), physically (adv.), physics (n.)",

  // ── Irregular Verbs ──
  "be":          "being (n.)",
  "beat":        "beating (n.), unbeaten (adj.)",
  "become":      "becoming (adj.)",
  "begin":       "beginner (n.), beginning (n.)",
  "bend":        "bent (adj.)",
  "bet":         "",
  "bite":        "biting (adj.)",
  "bleed":       "bleeding (n., adj.)",
  "blow":        "blower (n.)",
  "break":       "breakage (n.), breakable (adj.), unbreakable (adj.)",
  "breed":       "breeder (n.), breeding (n.)",
  "bring":       "",
  "build":       "builder (n.), building (n.), rebuild (v.)",
  "burn":        "burning (adj.), burner (n.)",
  "burst":       "",
  "buy":         "buyer (n.)",
  "catch":       "catchy (adj.), catcher (n.)",
  "choose":      "choice (n.), choosy (adj.)",
  "come":        "income (n.), outcome (n.), upcoming (adj.)",
  "cost":        "costly (adj.)",
  "cut":         "cutter (n.), cutting (n., adj.)",
  "deal":        "dealer (n.), dealing (n.)",
  "dig":         "digger (n.)",
  "do":          "doer (n.), doing (n.), undo (v.)",
  "draw":        "drawer (n.), drawing (n.)",
  "dream":       "dreamer (n.), dreamy (adj.)",
  "drink":       "drinker (n.), drinkable (adj.)",
  "drive":       "driver (n.), driving (n., adj.)",
  "eat":         "eater (n.), edible (adj.), overeating (n.)",
  "fall":        "fallen (adj.), downfall (n.)",
  "feed":        "feeder (n.), feedback (n.)",
  "feel":        "feeling (n.), unfeeling (adj.)",
  "fight":       "fighter (n.), fighting (n.)",
  "find":        "finder (n.), finding (n.)",
  "fly":         "flight (n.), flyer (n.)",
  "forbid":      "forbidden (adj.)",
  "forget":      "forgetful (adj.), unforgettable (adj.)",
  "forgive":     "forgiveness (n.), forgivable (adj.), unforgivable (adj.)",
  "freeze":      "freezer (n.), freezing (adj.), frozen (adj.)",
  "get":         "",
  "give":        "giver (n.), given (adj.), forgiving (adj.)",
  "go":          "going (n.), ongoing (adj.)",
  "grow":        "growth (n.), grower (n.), grown-up (n.)",
  "hang":        "hanger (n.), hanging (n.)",
  "have":        "",
  "hear":        "hearing (n.), hearer (n.), unheard (adj.)",
  "hide":        "hiding (n.), hidden (adj.)",
  "hit":         "",
  "hold":        "holder (n.), holding (n.), household (n.)",
  "hurt":        "hurtful (adj.)",
  "keep":        "keeper (n.), keeping (n.)",
  "know":        "knowledge (n.), knowledgeable (adj.), unknown (adj.)",
  "lay":         "layer (n.), layout (n.)",
  "lead":        "leader (n.), leadership (n.), leading (adj.), mislead (v.)",
  "learn":       "learner (n.), learning (n.)",
  "leave":       "",
  "lend":        "lender (n.), lending (n.)",
  "let":         "",
  "lie":         "liar (n.)",
  "light":       "lighter (n.), lighting (n.), lighten (v.)",
  "lose":        "loser (n.), loss (n.)",
  "make":        "maker (n.), making (n.), remake (v.)",
  "mean":        "meaning (n.), meaningful (adj.), meaningless (adj.)",
  "meet":        "meeting (n.)",
  "mistake":     "mistaken (adj.), mistakenly (adv.)",
  "overcome":    "",
  "pay":         "payment (n.), payer (n.), payable (adj.), underpaid (adj.)",
  "prove":       "proof (n.), proven (adj.), disprove (v.)",
  "put":         "",
  "read":        "reader (n.), reading (n.), readable (adj.), unreadable (adj.)",
  "ride":        "rider (n.), riding (n.)",
  "ring":        "ringer (n.)",
  "rise":        "rising (adj., n.)",
  "run":         "runner (n.), running (n., adj.), rerun (n.)",
  "say":         "saying (n.), unsaid (adj.)",
  "see":         "seeing (n.), seer (n.), unseen (adj.)",
  "sell":        "seller (n.), bestseller (n.)",
  "send":        "sender (n.)",
  "set":         "setting (n.), reset (v.), setup (n.)",
  "shake":       "shaky (adj.), shakily (adv.)",
  "shine":       "shiny (adj.), shining (adj.)",
  "shoot":       "shooter (n.), shooting (n.)",
  "show":        "showing (n.), showy (adj.), showroom (n.)",
  "shut":        "shutdown (n.)",
  "sing":        "singer (n.), singing (n.), song (n.)",
  "sit":         "sitting (n., adj.), sitter (n.)",
  "sleep":       "sleeper (n.), sleepy (adj.), sleepless (adj.)",
  "slide":       "sliding (adj.)",
  "speak":       "speaker (n.), speech (n.), outspoken (adj.)",
  "spend":       "spending (n.), spender (n.)",
  "stand":       "standing (n., adj.), standpoint (n.), outstanding (adj.)",
  "steal":       "stealth (n.), stealthy (adj.)",
  "stick":       "sticker (n.), sticky (adj.)",
  "strike":      "striker (n.), striking (adj.), strikingly (adv.)",
  "swear":       "swearing (n.)",
  "sweep":       "sweeper (n.), sweeping (adj.)",
  "swim":        "swimmer (n.), swimming (n.)",
  "take":        "taker (n.), taking (n.), intake (n.), overtake (v.)",
  "teach":       "teacher (n.), teaching (n.)",
  "tear":        "tearful (adj.)",
  "tell":        "telling (adj.), teller (n.)",
  "think":       "thinker (n.), thinking (n.), thoughtful (adj.), thoughtless (adj.)",
  "throw":       "thrower (n.)",
  "understand":  "understanding (n., adj.), misunderstand (v.)",
  "wake":        "waking (adj.), awaken (v.)",
  "wear":        "wearable (adj.), wearer (n.)",
  "win":         "winner (n.), winning (adj., n.)",
  "write":       "writer (n.), writing (n.), rewrite (v.), written (adj.)",

  // ── Phrasal Nouns ──
  "breakdown":   "break down (v.)",
  "breakthrough": "break through (v.)",
  "breakup":     "break up (v.)",
  "outbreak":    "break out (v.)",
  "takeoff":     "take off (v.)",
  "takeover":    "take over (v.)",
  "outcome":     "come out (v.)",
  "income":      "",
  "comeback":    "come back (v.)",
  "downfall":    "fall down (v.)",
  "setback":     "set back (v.)",
  "setup":       "set up (v.)",
  "layout":      "lay out (v.)",
  "lookout":     "look out (v.)",
  "outlook":     "look out (v.)",
  "turnover":    "turn over (v.)",
  "turnaround":  "turn around (v.)",
  "turnout":     "turn out (v.)",
  "dropout":     "drop out (v.)",
  "feedback":    "feed back (v.)",
  "output":      "put out (v.), input (n.)",
  "input":       "output (n.)",
  "ongoing":     "go on (v.)",
  "outstanding": "stand out (v.)",
  "outgoing":    "go out (v.), incoming (adj.)",
  "incoming":    "come in (v.), outgoing (adj.)",
  "update":      "updated (adj.), outdated (adj.)",
  "upgrade":     "downgrade (v., n.)",
  "upbringing":  "bring up (v.)",
  "downside":    "upside (n.)",
  "downtime":    "",
  "download":    "upload (n., v.)",
  "upload":      "download (n., v.)",
  "backup":      "back up (v.)",
  "checkout":    "check out (v.)",
  "handout":     "hand out (v.)",
  "workout":     "work out (v.)",
  "letdown":     "let down (v.)",
  "layoff":      "lay off (v.)",
  "standout":    "stand out (v.)",
  "rundown":     "run down (v.)",
  "fallout":     "fall out (v.)",
  "getaway":     "get away (v.)",
  "giveaway":    "give away (v.)",
  "crackdown":   "crack down (v.)",
  "followup":    "follow up (v.)",
  "startup":     "start up (v.)",

  // ── EGW (5000 Words) ──
  "corner":      "",
  "tiring":      "tire (v.), tired (adj.), tiresome (adj.)",
  "yard":        "",
  "rope":        "",
  "ground":      "grounding (n.), grounded (adj.), underground (adj., n.)",
  "butter":      "buttery (adj.)",
  "desert":      "deserted (adj.), desertion (n.)",
  "circus":      "",
  "accent":      "accented (adj.), accentuate (v.)",
  "appreciate":  "appreciation (n.), appreciative (adj.)",
  "cycling":     "cycle (n., v.), cyclist (n.), bicycle (n.)",
  "vocabulary":  "",
  "shop assistant": "",
  "profitable":  "profit (n., v.), profitability (n.), unprofitable (adj.)",
  "vegetables":  "vegetable (n., adj.), vegetarian (n., adj.)",
  "amazing.":    "amaze (v.), amazed (adj.), amazement (n.), amazingly (adv.)",
  "close":       "closely (adv.), closeness (n.), closure (n.)",
  "vet":         "veterinary (adj.)",
  "nurse":       "nursing (n.)",
  "skiing":      "ski (v., n.), skier (n.)",
  "thief":       "theft (n.), thieve (v.)",
  "towel":       "",
  "slim":        "slimmer (adj.), slimming (n.)",
  "mark":        "marker (n.), marking (n.), remarkable (adj.), remarkably (adv.)",
  "generous":    "generosity (n.), generously (adv.)",
  "lovely":      "love (n., v.), loveliness (n.), lover (n.)",
  "roof":        "rooftop (n.)",
  "greatly":     "great (adj.), greatness (n.)",
  "hang":        "hanger (n.), hanging (n.)",
  "inspire":     "inspiration (n.), inspiring (adj.), inspired (adj.)",
  "confidence":  "confident (adj.), confidently (adv.), confidential (adj.)",
  "neсklace":    "neck (n.)",
  "sick":        "sickness (n.), sickly (adj.)",
  "condition":   "conditional (adj.), unconditional (adj.), conditioning (n.)",
  "consider":    "consideration (n.), considerable (adj.), considerably (adv.)",
  "satisfaction":"satisfy (v.), satisfactory (adj.), satisfied (adj.), dissatisfied (adj.)",
  "skirt":       "",
  "weigh":       "weight (n.), weighty (adj.), overweight (adj.)",
  "composition": "compose (v.), composer (n.), composite (adj.)",
  "tall":        "tallness (n.)",
  "tax":         "taxation (n.), taxable (adj.), taxpayer (n.)",
  "windy":       "wind (n.)",
  "tongue":      "",
  "acquaintance":"acquaint (v.), acquainted (adj.)",
  "district":    "",
  "membership":  "member (n.)",
  "overcrowded": "crowd (n., v.), crowded (adj.)",
  "spacious":    "space (n.), spaciousness (n.)",
  "confident":   "confidence (n.), confidently (adv.), confidential (adj.)",
  "pregnant":    "pregnancy (n.)",
  "accurate":    "accuracy (n.), accurately (adv.), inaccurate (adj.)",
  "frighten":    "fright (n.), frightened (adj.), frightening (adj.), frightful (adj.)",
  "breathe":     "breath (n.), breathing (n.), breathless (adj.)",
  "calories":    "calorie (n.)",
  "karate":      "",
  "soccer":      "",
  "resort":      "",
  "scissors":    "",
  "count on":    "",
  "in front of": "",
  "post":        "postal (adj.), postage (n.)",
  "pretty":      "prettiness (n.), prettier (adj.)",
  "belt":        "",
  "dishes":      "dish (n.)",
  "inform":      "information (n.), informative (adj.), informer (n.), misinform (v.)",
  "broaden":     "broad (adj.), broadly (adv.), breadth (n.)",
  "innocent":    "innocence (n.), innocently (adv.)",
  "outdoors":    "outdoor (adj.), indoors (adv.)",
  "poverty":     "poor (adj.), impoverished (adj.)",
  "pronunciation":"pronounce (v.), pronounced (adj.)",
  "seldom":      "",
  "sight":       "sightseeing (n.), insight (n.), oversight (n.)",
  "thoroughly":  "thorough (adj.), thoroughness (n.)",
  "certainly":   "certain (adj.), certainty (n.), uncertain (adj.), uncertainty (n.)",
  "harmfull":    "harm (n., v.), harmless (adj.), harmful (adj.)",
  "polite":      "politely (adv.), politeness (n.), impolite (adj.)",
  "anniversary": "",
  "get rid of":  "",
  "rise":        "rising (adj., n.), arise (v.)",
  "silly":       "silliness (n.)",
  "go up":       "",
  "go down":     "",
  "contest":     "contestant (n.), contested (adj.)",
  "guess":       "guesswork (n.)",
  "perhaps":     "",
  "attend":      "attendance (n.), attendant (n.), attention (n.), attentive (adj.)",
  "bargain":     "",
  "foot":        "footprint (n.), footstep (n.), footage (n.)",
  "fit":         "fitness (n.), fitting (adj., n.), unfit (adj.)",
  "divorced":    "divorce (n., v.), divorcee (n.)",
  "citizen":     "citizenship (n.), citizenry (n.)",
  "impress":     "impression (n.), impressive (adj.), impressively (adv.), unimpressed (adj.)",
  "unpleasant":  "pleasant (adj.), pleasantly (adv.), pleasure (n.), displeasure (n.)",
  "wise":        "wisdom (n.), wisely (adv.), unwise (adj.)",
  "prеdictable": "predict (v.), prediction (n.), unpredictable (adj.), predictably (adv.)",
  "ideal":       "ideally (adv.), idealist (n.), idealize (v.)",
  "notice":      "noticeable (adj.), noticeably (adv.), unnoticed (adj.)",
  "seat":        "seating (n.), seated (adj.)",
  "luckily":     "luck (n.), lucky (adj.), unlucky (adj.), unluckily (adv.)",
  "ridiculous":  "ridiculously (adv.), ridicule (n., v.)",
  "splendid":    "splendidly (adv.), splendour (n.)",
  "save up":     "",
  "although":    "",
  "majority":    "major (adj., n.), minority (n.)",
  "paint":       "painter (n.), painting (n.), repaint (v.)",
  "speedy":      "speed (n., v.), speedily (adv.)",
  "cheek":       "cheeky (adj.)",
  "fortunately": "fortunate (adj.), fortune (n.), unfortunate (adj.), unfortunately (adv.)",
  "peacefully":  "peace (n.), peaceful (adj.), peacemaker (n.)",
  "tour":        "tourist (n.), tourism (n.)",
  "thought":     "thoughtful (adj.), thoughtless (adj.), thoughtfully (adv.)",
  "customer":    "custom (n.), customize (v.)",
  "midday":      "midnight (n.)",
  "noon":        "afternoon (n.)",
  "stone":       "stony (adj.)",
  "hurry up":    "",
  "blow":        "blower (n.)",
  "cave":        "",
  "grow up":     "",
  "hit":         "",
  "at once":     "",
  "otherwise":   "",
  "overcome":    "",
  "steal":       "stealth (n.), stealthy (adj.)",
  "treasure":    "treasury (n.), treasurer (n.)",
  "withdraw":    "withdrawal (n.)",
  "accidentally":"accident (n.), accidental (adj.)",
  "across":      "",
  "courageously":"courage (n.), courageous (adj.), discourage (v.), encourage (v.)",
  "forgive":     "forgiveness (n.), forgivable (adj.), unforgivable (adj.)",
  "hurt":        "hurtful (adj.)",
  "knee":        "kneel (v.)",
  "pond":        "",
  "supplier":    "supply (v., n.), supplies (n.)",
  "potatoes":    "potato (n.)",
  "addicted":    "addiction (n.), addictive (adj.), addict (n.)",
  "drugs":       "drug (n., v.), drugstore (n.)",
  "fed up":      "",
  "gambling":    "gamble (v., n.), gambler (n.)",
  "heavily":     "heavy (adj.), heaviness (n.)",
  "nice":        "nicely (adv.), niceness (n.)",
  "pity":        "pitiful (adj.), pitiless (adj.)",
  "ruin":        "ruined (adj.), ruinous (adj.)",
  "bitterly":    "bitter (adj.), bitterness (n.)",
  "castle":      "",
  "excited":     "excite (v.), excitement (n.), exciting (adj.), excitedly (adv.)",
  "mess":        "messy (adj.)",
  "accuse":      "accusation (n.), accused (n.), accuser (n.)",
  "robbery":     "rob (v.), robber (n.)",
  "backache":    "ache (n., v.), headache (n.)",
  "numerous":    "number (n., v.)",
  "insist":      "insistence (n.), insistent (adj.)",
  "rely":        "reliable (adj.), reliability (n.), reliance (n.), unreliable (adj.)",
  "shout":       "",
  "consist":     "consistent (adj.), consistency (n.), inconsistent (adj.)",
  "attitude":    "",
  "cure":        "curable (adj.), incurable (adj.)",
  "lack":        "lacking (adj.)",
  "cathedral":   "",
  "east":        "eastern (adj.), eastward (adv.)",
  "general":     "generally (adv.), generalize (v.), generalization (n.)",
  "north":       "northern (adj.), northward (adv.)",
  "rate":        "rating (n.), overrate (v.), underrate (v.)",
  "south":       "southern (adj.), southward (adv.)",
  "west":        "western (adj., n.), westward (adv.)",
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

function toTag(prefix, word) {
  return prefix + '_' + word.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

// ─── CSV ─────────────────────────────────────────────────────────────────────
function ensureFamilyColumn(csvPath) {
  const text = fs.readFileSync(csvPath, 'utf8');
  const lines = text.trim().split('\n');
  if (lines[0].includes('|family')) return;
  const newLines = [lines[0] + '|family'];
  for (let i = 1; i < lines.length; i++) newLines.push(lines[i] + '|');
  fs.writeFileSync(csvPath, newLines.join('\n'), 'utf8');
}

function saveFamilyToCSV(csvPath, word, familyStr) {
  const lines = fs.readFileSync(csvPath, 'utf8').trim().split('\n');
  const familyCol = lines[0].split('|').indexOf('family');
  if (familyCol < 0) return;
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('|');
    if (cols[0]?.trim() === word) {
      while (cols.length <= familyCol) cols.push('');
      cols[familyCol] = familyStr.replace(/\|/g, ';');
      lines[i] = cols.join('|');
      break;
    }
  }
  fs.writeFileSync(csvPath, lines.join('\n'), 'utf8');
}

// ─── DECK CONFIGS ────────────────────────────────────────────────────────────
const DECKS = [
  { id: 'false',     name: 'EG — False Friends',     file: 'false-friends-tracker.csv', dir: ANKI_DIR, tagPrefix: 'ff' },
  { id: 'irregular', name: 'EG — Irregular Verbs',   file: 'irregular-verbs-tracker.csv', dir: ANKI_DIR, tagPrefix: 'iv' },
  { id: 'phrasal_n', name: 'EG — Phrasal Nouns',     file: 'phrasal-nouns-tracker.csv', dir: ANKI_DIR, tagPrefix: 'pn' },
  { id: 'egw',       name: 'EG — All Words',         file: 'word-tracker.csv',
    dir: path.join(ROOT, 'learn-5000-english-words'), tagPrefix: 'egw' },
];

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== word-families-data.js ===\n');

  try {
    const ver = await ankiReq('version');
    console.log(`AnkiConnect v${ver} ✓\n`);
  } catch {
    console.error('ERROR: Anki is not running!');
    process.exit(1);
  }

  let totalOk = 0, totalSkip = 0;

  for (const deck of DECKS) {
    const csvPath = path.join(deck.dir, deck.file);
    if (!fs.existsSync(csvPath)) continue;

    ensureFamilyColumn(csvPath);

    const lines = fs.readFileSync(csvPath, 'utf8').trim().split('\n');
    const keys = [];
    for (let i = 1; i < lines.length; i++) {
      const k = lines[i].split('|')[0]?.trim();
      if (k) keys.push(k);
    }

    console.log(`── ${deck.id} (${deck.name}): ${keys.length} words`);
    let ok = 0, skip = 0;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const family = FAMILIES[key];
      if (family === undefined || family === '') { skip++; continue; }

      process.stdout.write(`  [${i+1}/${keys.length}] "${key}" — `);

      // 1. Save to CSV
      saveFamilyToCSV(csvPath, key, family);

      // 2. Update Anki cards
      const familyHtml = `<div style="margin-top:0.6em;padding-top:0.5em;border-top:1px solid #444;font-size:0.9em;color:#aaa">Word family: ${family.replace(/(\w+) \(/g, '<b>$1</b> (')}</div>`;
      const tag = toTag(deck.tagPrefix, key);

      // Regular card — Back field
      try {
        const noteIds = await ankiReq('findNotes', { query: `deck:"${deck.name}" tag:${tag} -tag:*_cloze` });
        for (const nid of noteIds) {
          const info = await ankiReq('notesInfo', { notes: [nid] });
          const back = info[0].fields.Back?.value || '';
          // Remove old family if exists, then add new
          const cleanBack = back.replace(/<div[^>]*>Word family:.*?<\/div>/g, '').trim();
          await ankiReq('updateNoteFields', { note: { id: nid, fields: { Back: cleanBack + familyHtml } } });
        }
      } catch {}

      // Cloze card — Дополнение оборота
      try {
        const clozeIds = await ankiReq('findNotes', { query: `deck:"${deck.name}" tag:${tag}_cloze` });
        for (const nid of clozeIds) {
          const info = await ankiReq('notesInfo', { notes: [nid] });
          const extra = info[0].fields['Дополнение оборота']?.value || '';
          const cleanExtra = extra.replace(/<div[^>]*>Word family:.*?<\/div>/g, '').trim();
          await ankiReq('updateNoteFields', { note: { id: nid, fields: { 'Дополнение оборота': cleanExtra + familyHtml } } });
        }
      } catch {}

      console.log(`✓ (${family})`);
      ok++;
    }

    console.log(`  → ok: ${ok}  skip: ${skip}\n`);
    totalOk += ok; totalSkip += skip;
  }

  console.log(`═══ TOTAL: ✓ ${totalOk}  skip: ${totalSkip} ═══`);
}

main().catch(e => { console.error(e); process.exit(1); });
