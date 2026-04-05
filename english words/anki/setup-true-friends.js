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
  "album":       ["She bought a new music **album**.", "We looked at the photo **album**.", "His **album** is very popular."],
  "alphabet":    ["The English **alphabet** has 26 letters.", "Children learn the **alphabet** at school.", "A is the first letter of the **alphabet**."],
  "architect":   ["The **architect** designed a beautiful house.", "She wants to become an **architect**.", "The **architect** showed us the plan."],
  "atmosphere":  ["The **atmosphere** in the café was nice.", "Earth has a thin **atmosphere**.", "The party had a great **atmosphere**."],
  "automatic":   ["The door is **automatic**.", "She drives an **automatic** car.", "The light turns on **automatically**."],
  "ballet":      ["She dances **ballet** since she was five.", "We went to see a **ballet** last night.", "The **ballet** was beautiful."],
  "banana":      ["I eat a **banana** every morning.", "She put **bananas** in the salad.", "This **banana** is very sweet."],
  "bank":        ["I need to go to the **bank** today.", "The **bank** is closed on Sunday.", "She works at a big **bank**."],
  "bar":         ["Let's meet at the **bar** after work.", "There is a small **bar** near the hotel.", "He ordered a drink at the **bar**."],
  "baseball":    ["**Baseball** is popular in America.", "He plays **baseball** at school.", "We watched a **baseball** game."],
  "basketball":  ["She plays **basketball** every week.", "**Basketball** is a fast sport.", "We watched a **basketball** match."],
  "biology":     ["She studies **biology** at university.", "**Biology** is my favourite subject.", "The **biology** test was easy."],
  "boss":        ["My **boss** is very kind.", "The **boss** called a meeting today.", "She is the **boss** of the company."],
  "brand":       ["This is a popular **brand**.", "She only buys this **brand** of coffee.", "The **brand** is known worldwide."],
  "budget":      ["We need to plan our **budget**.", "The **budget** for the project is small.", "She keeps a strict **budget**."],
  "buffet":      ["The hotel has a breakfast **buffet**.", "We ate at the **buffet**.", "The **buffet** had many dishes."],
  "bus":         ["I take the **bus** to work every day.", "The **bus** was late again.", "We waited for the **bus** in the rain."],
  "business":    ["He runs a small **business**.", "**Business** is going well this year.", "She studies **business** at college."],
  "café":        ["Let's have lunch at a **café**.", "There is a nice **café** on the corner.", "She reads books in the **café**."],
  "calendar":    ["Check the **calendar** for the date.", "She marked the day on the **calendar**.", "I need a new **calendar** for next year."],
  "career":      ["She has a successful **career**.", "He wants to start a new **career**.", "Teaching is a rewarding **career**."],
  "catalog":     ["Look at the products in the **catalog**.", "She ordered from the **catalog**.", "The **catalog** has 200 pages."],
  "category":    ["This book is in the fiction **category**.", "Choose a **category** from the list.", "There are five **categories**."],
  "cement":      ["The wall is made of **cement**.", "They used **cement** to fix the road.", "The **cement** is still wet."],
  "center":      ["The shop is in the city **center**.", "There is a pool in the **center**.", "She works at a medical **center**."],
  "champion":    ["He is the world **champion**.", "She became a **champion** at 18.", "The **champion** won again this year."],
  "channel":     ["What **channel** is the film on?", "She watches the news **channel**.", "This **channel** shows only sports."],
  "character":   ["He is the main **character** in the film.", "She has a strong **character**.", "The book has many **characters**."],
  "check":       ["Can I have the **check**, please?", "She wrote a **check** for the rent.", "He paid by **check**."],
  "chess":       ["He plays **chess** every evening.", "**Chess** is a game of strategy.", "She taught me to play **chess**."],
  "chocolate":   ["I love dark **chocolate**.", "She bought a box of **chocolate**.", "Would you like some **chocolate**?"],
  "cigarette":   ["He smokes a **cigarette** after lunch.", "**Cigarettes** are bad for health.", "She quit smoking **cigarettes**."],
  "class":       ["Our English **class** starts at nine.", "There are 20 students in the **class**.", "She is the best in the **class**."],
  "classic":     ["This is a **classic** film.", "She reads **classic** literature.", "The song is a real **classic**."],
  "climate":     ["The **climate** here is warm and dry.", "**Climate** change is a big problem.", "She prefers a cold **climate**."],
  "club":        ["He goes to a sports **club** every week.", "They opened a new **club** in town.", "She joined the book **club**."],
  "cocktail":    ["She ordered a fruit **cocktail**.", "He makes great **cocktails**.", "The **cocktail** party was fun."],
  "coffee":      ["I drink **coffee** every morning.", "Would you like a cup of **coffee**?", "This **coffee** is very strong."],
  "colleague":   ["My **colleague** helped me with the report.", "She is a friendly **colleague**.", "I had lunch with a **colleague**."],
  "collection":  ["He has a large stamp **collection**.", "The museum has a great art **collection**.", "She showed us her **collection**."],
  "comfort":     ["This chair gives great **comfort**.", "She likes **comfort** and warmth.", "The hotel offers modern **comfort**."],
  "comment":     ["He left a nice **comment** online.", "She made a **comment** about the food.", "Do you have any **comments**?"],
  "communication": ["Good **communication** is very important.", "**Communication** between teams is key.", "She studies **communication**."],
  "company":     ["She works for a big **company**.", "The **company** has 500 workers.", "He started his own **company**."],
  "compass":     ["Use a **compass** to find north.", "The **compass** pointed east.", "She always carries a **compass**."],
  "competition": ["He won the **competition**.", "There is strong **competition** in the market.", "She entered a singing **competition**."],
  "computer":    ["I work on a **computer** all day.", "My **computer** is very old.", "She bought a new **computer**."],
  "concert":     ["We went to a **concert** last night.", "The **concert** starts at eight.", "She plays the piano at **concerts**."],
  "conflict":    ["There is a **conflict** between them.", "We need to solve this **conflict**.", "The **conflict** lasted many years."],
  "constitution": ["The **constitution** protects our rights.", "They wrote a new **constitution**.", "The **constitution** is very old."],
  "contact":     ["She is my **contact** at the company.", "Keep in **contact** with your friends.", "I lost **contact** with him."],
  "content":     ["The **content** of the article is good.", "She creates online **content**.", "Check the **content** of the box."],
  "contract":    ["He signed a new **contract**.", "The **contract** is for two years.", "She read the **contract** carefully."],
  "corridor":    ["Walk down the **corridor** to the left.", "The **corridor** is long and dark.", "His office is at the end of the **corridor**."],
  "credit":      ["She paid by **credit** card.", "He has good **credit**.", "The bank gave him **credit**."],
  "crisis":      ["The country is in a **crisis**.", "We need to solve this **crisis**.", "The **crisis** affected many people."],
  "culture":     ["I love learning about other **cultures**.", "Music is part of our **culture**.", "The **culture** here is very different."],
  "database":    ["The **database** has all the records.", "She built a new **database**.", "Check the **database** for his name."],
  "debate":      ["There was a long **debate** about the plan.", "She won the **debate**.", "We had a **debate** in class."],
  "deficit":     ["The country has a big **deficit**.", "The budget **deficit** is growing.", "They need to reduce the **deficit**."],
  "democracy":   ["**Democracy** is important for freedom.", "They fight for **democracy**.", "The country became a **democracy**."],
  "design":      ["She studies **design** at college.", "I like the **design** of this phone.", "He works in web **design**."],
  "detail":      ["Please explain in **detail**.", "Every **detail** is important.", "She noticed a small **detail**."],
  "dialog":      ["The **dialog** in the film is great.", "They started a **dialog** about peace.", "Read the **dialog** out loud."],
  "diet":        ["She is on a healthy **diet**.", "A good **diet** is important.", "He changed his **diet** last month."],
  "diploma":     ["She got her **diploma** last year.", "He has a **diploma** in engineering.", "The **diploma** is on the wall."],
  "disco":       ["They went to a **disco** on Friday.", "The **disco** plays loud music.", "She loves to dance at the **disco**."],
  "discount":    ["The shop gives a 20% **discount**.", "She asked for a **discount**.", "Students get a **discount** here."],
  "doctor":      ["I need to see a **doctor**.", "The **doctor** said I am fine.", "She wants to become a **doctor**."],
  "document":    ["Sign this **document**, please.", "She lost an important **document**.", "The **document** is on the desk."],
  "dollar":      ["It costs ten **dollars**.", "She saved a hundred **dollars**.", "The **dollar** is strong today."],
  "drama":       ["She studies **drama** at school.", "The **drama** was very exciting.", "He acts in **drama** films."],
  "economy":     ["The **economy** is growing slowly.", "She studies **economy** at university.", "A strong **economy** helps everyone."],
  "effect":      ["The medicine had a good **effect**.", "What is the **effect** of this change?", "The **effect** was immediate."],
  "element":     ["Water is an important **element**.", "There are many **elements** in the table.", "Time is a key **element** of success."],
  "emotion":     ["She hid her **emotions** well.", "The film is full of **emotion**.", "He showed no **emotion** at all."],
  "energy":      ["I have a lot of **energy** today.", "Solar **energy** is clean.", "She drinks coffee for **energy**."],
  "engineer":    ["He works as an **engineer**.", "She wants to be an **engineer**.", "The **engineer** fixed the machine."],
  "episode":     ["I watched the first **episode**.", "The new **episode** comes out today.", "Each **episode** is 30 minutes."],
  "evolution":   ["**Evolution** takes millions of years.", "She studies **evolution** in biology.", "The **evolution** of technology is fast."],
  "exam":        ["She passed the **exam** with a high mark.", "The **exam** is next Monday.", "I need to study for the **exam**."],
  "experiment":  ["The **experiment** was a success.", "She did an **experiment** in the lab.", "Let's try a new **experiment**."],
  "export":      ["They **export** coffee to Europe.", "**Export** is important for the economy.", "The country's main **export** is oil."],
  "fact":        ["That is an interesting **fact**.", "In **fact**, she is very smart.", "Check the **facts** before you write."],
  "fan":         ["She is a big **fan** of this band.", "He is a football **fan**.", "The **fans** were very loud."],
  "fantasy":     ["She likes **fantasy** books.", "That is just a **fantasy**.", "The film is a **fantasy** adventure."],
  "festival":    ["We went to a music **festival**.", "The **festival** lasts three days.", "She loves the film **festival**."],
  "film":        ["We watched a great **film** yesterday.", "This **film** is two hours long.", "He makes **films** about nature."],
  "final":       ["This is the **final** game.", "She reached the **final** of the contest.", "The **final** exam is next week."],
  "football":    ["He plays **football** every weekend.", "**Football** is very popular here.", "We watched a **football** match on TV."],
  "format":      ["What **format** is the file?", "She changed the **format** of the report.", "The **format** is easy to read."],
  "formula":     ["This is a simple math **formula**.", "She knows the **formula** for success.", "The **formula** is very complex."],
  "gallery":     ["We visited an art **gallery**.", "The **gallery** has beautiful paintings.", "She works at a **gallery**."],
  "garage":      ["The car is in the **garage**.", "He cleaned the **garage** yesterday.", "The **garage** is full of boxes."],
  "generation":  ["The younger **generation** uses technology more.", "She is from a different **generation**.", "Every **generation** is different."],
  "geography":   ["She studies **geography** at school.", "**Geography** is about places and maps.", "I love **geography** class."],
  "golf":        ["He plays **golf** on Sundays.", "**Golf** is a quiet sport.", "She started learning **golf**."],
  "group":       ["We work in a small **group**.", "The **group** has ten members.", "She joined a study **group**."],
  "guitar":      ["She plays the **guitar** very well.", "He bought a new **guitar**.", "I want to learn the **guitar**."],
  "history":     ["She teaches **history** at school.", "**History** is my favourite subject.", "The town has a long **history**."],
  "hobby":       ["Reading is my **hobby**.", "She has many **hobbies**.", "What is your **hobby**?"],
  "hockey":      ["He plays **hockey** in winter.", "**Hockey** is a fast sport.", "We watched a **hockey** game."],
  "horizon":     ["The sun set on the **horizon**.", "She looked at the **horizon**.", "A ship appeared on the **horizon**."],
  "hotel":       ["We stayed at a nice **hotel**.", "The **hotel** has a big pool.", "She booked a **hotel** for two nights."],
  "humor":       ["He has a great sense of **humor**.", "**Humor** helps in difficult times.", "The book is full of **humor**."],
  "idea":        ["That is a great **idea**!", "I have no **idea** what to do.", "She came up with a new **idea**."],
  "import":      ["We **import** fruit from Spain.", "The **import** of goods is growing.", "**Import** taxes are very high."],
  "industry":    ["The car **industry** is very big.", "She works in the food **industry**.", "**Industry** creates many jobs."],
  "information": ["I need more **information**.", "The **information** is on the website.", "She gave me useful **information**."],
  "innovation":  ["**Innovation** drives the economy.", "This is an important **innovation**.", "She works in **innovation**."],
  "instrument":  ["She plays a musical **instrument**.", "The doctor used a special **instrument**.", "The **instrument** is very old."],
  "interest":    ["I have an **interest** in art.", "The story is very **interesting**.", "She lost **interest** in the topic."],
  "internet":    ["The **internet** is very fast here.", "I found it on the **internet**.", "We have no **internet** at home today."],
  "interview":   ["She has a job **interview** today.", "The **interview** went very well.", "He watched an **interview** on TV."],
  "invest":      ["She wants to **invest** in a business.", "They **invest** money in technology.", "It is smart to **invest** early."],
  "jazz":        ["She loves **jazz** music.", "We went to a **jazz** concert.", "He listens to **jazz** every evening."],
  "jeans":       ["She wears **jeans** every day.", "I bought new **jeans** yesterday.", "These **jeans** are very comfortable."],
  "journalist":  ["The **journalist** asked many questions.", "She works as a **journalist**.", "A **journalist** wrote about the event."],
  "kilometer":   ["The school is one **kilometer** away.", "He runs five **kilometers** a day.", "It is 100 **kilometers** to the city."],
  "lamp":        ["Turn on the **lamp**, please.", "There is a **lamp** on the table.", "The **lamp** in my room is broken."],
  "landscape":   ["The **landscape** here is beautiful.", "She paints **landscapes**.", "The **landscape** changed after the storm."],
  "lecture":     ["The **lecture** starts at ten.", "She gave a great **lecture**.", "I fell asleep during the **lecture**."],
  "lemon":       ["I like tea with **lemon**.", "She squeezed a **lemon** into the water.", "This **lemon** is very sour."],
  "liberal":     ["He has **liberal** views.", "The **liberal** party won the vote.", "She is very **liberal** in her ideas."],
  "limit":       ["There is a speed **limit** here.", "She reached her **limit**.", "We have a time **limit**."],
  "logo":        ["The company has a new **logo**.", "I like the **logo** on the shirt.", "She designed the **logo**."],
  "machine":     ["The **machine** is very loud.", "She learned to use the **machine**.", "The washing **machine** is broken."],
  "manager":     ["The **manager** of the shop helped me.", "She is a good **manager**.", "I spoke to the **manager** about the problem."],
  "marathon":    ["He ran a **marathon** last year.", "The **marathon** starts at seven.", "She is training for a **marathon**."],
  "marketing":   ["She works in **marketing**.", "**Marketing** is key for business.", "The **marketing** campaign was great."],
  "material":    ["The **material** is very soft.", "She bought **material** for a dress.", "We need more **material** for the project."],
  "mechanism":   ["The **mechanism** is very complex.", "She explained the **mechanism**.", "The clock **mechanism** is broken."],
  "media":       ["The **media** reported the news.", "Social **media** is very popular.", "She works in the **media** industry."],
  "medicine":    ["She studies **medicine** at university.", "Take your **medicine** twice a day.", "**Medicine** has improved a lot."],
  "melody":      ["The **melody** is very beautiful.", "She played a simple **melody**.", "I can't forget this **melody**."],
  "method":      ["This is a new **method** of teaching.", "She uses an old **method**.", "The **method** is very effective."],
  "million":     ["The city has two **million** people.", "He won a **million** dollars.", "**Millions** of people watched the show."],
  "minute":      ["Wait a **minute**, please.", "The film starts in five **minutes**.", "It takes ten **minutes** to walk there."],
  "modern":      ["The building is very **modern**.", "She likes **modern** art.", "**Modern** life is fast."],
  "moment":      ["Wait a **moment**, please.", "That was a special **moment**.", "At that **moment**, the phone rang."],
  "monitor":     ["She stared at her **monitor** all day.", "The **monitor** is too small.", "He bought a new **monitor**."],
  "museum":      ["We visited a **museum** yesterday.", "The **museum** is free on Sundays.", "There are old paintings in the **museum**."],
  "music":       ["I listen to **music** every day.", "She studies **music** at school.", "What kind of **music** do you like?"],
  "nation":      ["The whole **nation** celebrated.", "She is proud of her **nation**.", "Every **nation** has its own culture."],
  "normal":      ["This is **normal** for winter.", "Everything returned to **normal**.", "It is **normal** to make mistakes."],
  "object":      ["What is that **object** on the table?", "The **object** of the game is to win.", "She found a strange **object**."],
  "office":      ["He works in an **office**.", "The **office** opens at nine.", "She left her bag in the **office**."],
  "opera":       ["We went to the **opera** last night.", "She sings in the **opera**.", "The **opera** house is very beautiful."],
  "operation":   ["The **operation** was a success.", "She had an **operation** on her knee.", "The **operation** took three hours."],
  "optimist":    ["She is a real **optimist**.", "An **optimist** sees the bright side.", "Be an **optimist** — things will get better."],
  "orchestra":   ["The **orchestra** played beautifully.", "She plays violin in the **orchestra**.", "The **orchestra** has 80 musicians."],
  "park":        ["We walk in the **park** every evening.", "The **park** is very beautiful in spring.", "Children play in the **park**."],
  "parliament":  ["The **parliament** passed a new law.", "She is a member of **parliament**.", "The **parliament** building is very old."],
  "partner":     ["He is my business **partner**.", "She danced with her **partner**.", "They are **partners** in the project."],
  "passport":    ["Don't forget your **passport**.", "My **passport** is valid for ten years.", "She lost her **passport** at the airport."],
  "pause":       ["Let's take a short **pause**.", "She made a **pause** before speaking.", "**Pause** the video, please."],
  "period":      ["This was a difficult **period**.", "The **period** of the exam is two hours.", "She studied the Victorian **period**."],
  "pessimist":   ["He is a **pessimist** about the future.", "Don't be such a **pessimist**.", "A **pessimist** always expects the worst."],
  "philosophy":  ["She studies **philosophy** at university.", "His **philosophy** of life is simple.", "**Philosophy** makes you think deeply."],
  "photo":       ["She took a **photo** of the sunset.", "Can I see your **photo**?", "He posted the **photo** online."],
  "physics":     ["He studies **physics** at university.", "**Physics** explains how things work.", "She is good at **physics**."],
  "piano":       ["She plays the **piano** very well.", "He bought a new **piano**.", "The **piano** sounds beautiful."],
  "pilot":       ["The **pilot** landed the plane safely.", "She wants to be a **pilot**.", "The **pilot** spoke to the passengers."],
  "pizza":       ["Let's order a **pizza**.", "This **pizza** is very tasty.", "She makes great **pizza** at home."],
  "planet":      ["Earth is our **planet**.", "Mars is a red **planet**.", "There are eight **planets** in our system."],
  "plastic":     ["The bag is made of **plastic**.", "We should use less **plastic**.", "**Plastic** takes years to break down."],
  "platform":    ["The train is on **platform** five.", "She spoke from the **platform**.", "The **platform** was very crowded."],
  "police":      ["Call the **police** right now!", "The **police** arrived in five minutes.", "She works for the **police**."],
  "political":   ["It is a **political** question.", "She has strong **political** views.", "The **political** situation is difficult."],
  "popular":     ["This song is very **popular**.", "She is **popular** at school.", "Pizza is a **popular** food."],
  "position":    ["She got a new **position** at work.", "What is your **position** on this topic?", "He changed his **position**."],
  "president":   ["The **president** gave a speech.", "She is the **president** of the company.", "The **president** met with world leaders."],
  "problem":     ["That is a big **problem**.", "We need to solve this **problem**.", "No **problem**, I can help you."],
  "process":     ["The **process** takes a long time.", "She explained the **process** step by step.", "Learning is a slow **process**."],
  "product":     ["This is our best **product**.", "The **product** is made in Japan.", "She tested the new **product**."],
  "profession":  ["Teaching is a noble **profession**.", "She chose her **profession** early.", "What is your **profession**?"],
  "professor":   ["The **professor** teaches history.", "She is a famous **professor**.", "I asked the **professor** a question."],
  "program":     ["This **program** is very useful.", "She wrote a computer **program**.", "The TV **program** starts at eight."],
  "progress":    ["She is making good **progress**.", "**Progress** takes time.", "We need to check our **progress**."],
  "project":     ["He is working on a big **project**.", "The **project** is almost done.", "She started a new **project**."],
  "protest":     ["People went to the **protest**.", "She joined the **protest** march.", "The **protest** was peaceful."],
  "psychology":  ["She studies **psychology**.", "**Psychology** helps us understand people.", "He has a degree in **psychology**."],
  "radio":       ["I listen to the **radio** in the car.", "Turn on the **radio**, please.", "She works at a **radio** station."],
  "reaction":    ["His **reaction** was very quick.", "What was her **reaction**?", "The **reaction** surprised everyone."],
  "reform":      ["The government plans a **reform**.", "Education **reform** is needed.", "She supports the **reform**."],
  "religion":    ["**Religion** is important to many people.", "She studies **religion** at university.", "People of all **religions** live here."],
  "resort":      ["We stayed at a beach **resort**.", "The **resort** has a nice pool.", "It is a ski **resort** in the mountains."],
  "restaurant":  ["We had dinner at a **restaurant**.", "The **restaurant** is very popular.", "She works in a French **restaurant**."],
  "result":      ["The **result** of the test was good.", "We are waiting for the **results**.", "Hard work brings good **results**."],
  "revolution":  ["The **revolution** changed the country.", "It was a technology **revolution**.", "She studied the French **Revolution**."],
  "risk":        ["There is a **risk** of rain today.", "She took a big **risk**.", "Is it worth the **risk**?"],
  "robot":       ["The **robot** can clean the house.", "He built a small **robot**.", "**Robots** help in factories."],
  "role":        ["She plays the main **role** in the film.", "He has an important **role** at work.", "What is your **role** in the team?"],
  "salad":       ["I had a green **salad** for lunch.", "She makes a great fruit **salad**.", "Would you like some **salad**?"],
  "scandal":     ["The **scandal** was in all the news.", "It was a big **scandal**.", "The **scandal** shocked everyone."],
  "season":      ["Winter is my favourite **season**.", "The new **season** starts in September.", "What **season** do you like?"],
  "second":      ["Wait one **second**, please.", "She finished **second** in the race.", "It took only a few **seconds**."],
  "secret":      ["Can you keep a **secret**?", "She told me a **secret**.", "It is no longer a **secret**."],
  "semester":    ["The **semester** starts in September.", "She failed one exam this **semester**.", "The spring **semester** is shorter."],
  "service":     ["The **service** at this hotel is great.", "He works in customer **service**.", "The internet **service** is slow."],
  "signal":      ["The phone has no **signal** here.", "Wait for my **signal** to start.", "The **signal** was very weak."],
  "situation":   ["The **situation** is getting better.", "She is in a difficult **situation**.", "We need to understand the **situation**."],
  "sofa":        ["She sat down on the **sofa**.", "The **sofa** is very comfortable.", "He fell asleep on the **sofa**."],
  "sport":       ["**Sport** is good for your health.", "What is your favourite **sport**?", "She does **sport** every morning."],
  "standard":    ["The **standard** of living is high here.", "She set a high **standard**.", "This is the **standard** size."],
  "strategy":    ["We need a new **strategy**.", "The team changed their **strategy**.", "She has a good **strategy** for the exam."],
  "structure":   ["The **structure** of the building is strong.", "She explained the **structure** of the essay.", "The **structure** is very old."],
  "student":     ["She is a university **student**.", "The **students** are in the classroom.", "He is a very good **student**."],
  "style":       ["She has a nice **style** of clothes.", "I like your **style**.", "The **style** of the house is modern."],
  "subject":     ["Math is my favourite **subject**.", "What is the **subject** of the book?", "She changed the **subject**."],
  "system":      ["The **system** is easy to use.", "We need a better **system**.", "The school **system** is different here."],
  "talent":      ["She has a great **talent** for music.", "He is full of **talent**.", "The show looks for young **talent**."],
  "taxi":        ["Let's take a **taxi** to the airport.", "The **taxi** arrived in two minutes.", "She called a **taxi**."],
  "technology":  ["**Technology** changes very fast.", "She works in **technology**.", "Modern **technology** makes life easier."],
  "telephone":   ["The **telephone** is ringing.", "She answered the **telephone**.", "There is a **telephone** on the desk."],
  "television":  ["I watch **television** in the evening.", "There is a big **television** in the room.", "She turned off the **television**."],
  "temperature": ["The **temperature** is 30 degrees today.", "Check the **temperature** before you go.", "The **temperature** drops at night."],
  "tennis":      ["He plays **tennis** twice a week.", "She won the **tennis** match.", "We watched **tennis** on TV."],
  "territory":   ["This is their **territory**.", "The **territory** of the country is large.", "Animals protect their **territory**."],
  "test":        ["I have a **test** tomorrow.", "She passed the **test** easily.", "The **test** was very difficult."],
  "text":        ["Read the **text** carefully.", "She sent me a **text** message.", "The **text** is very short."],
  "theory":      ["In **theory**, it should work.", "She has a new **theory**.", "The **theory** was proven right."],
  "tourist":     ["The city is full of **tourists**.", "She works as a **tourist** guide.", "Many **tourists** visit the museum."],
  "tradition":   ["It is a family **tradition**.", "This **tradition** is very old.", "She follows the **tradition** every year."],
  "transport":   ["Public **transport** is cheap here.", "She uses **transport** to get to work.", "The city has good **transport**."],
  "university":  ["She studies at the **university**.", "The **university** is very old.", "He wants to go to **university**."],
  "veteran":     ["He is a war **veteran**.", "The **veteran** told us his story.", "**Veterans** deserve our respect."],
  "video":       ["She made a **video** about cooking.", "I watched a funny **video** online.", "He records **videos** every week."],
  "virus":       ["The **virus** spread very quickly.", "She caught a **virus** last week.", "The computer has a **virus**."],
  "vitamin":     ["Take your **vitamins** every day.", "This juice has a lot of **vitamins**.", "**Vitamin** C is good for you."],
  "volleyball":  ["She plays **volleyball** at school.", "We had a **volleyball** game on the beach.", "**Volleyball** is fun to play."],
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
