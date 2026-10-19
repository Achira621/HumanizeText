import csv, random, re, difflib, os

random.seed(42)
OUT = "/mnt/user-data/outputs/dataset"
os.makedirs(OUT, exist_ok=True)

# topic: (human_text, ai_text)  -- same topic/content, different voice
SEEDS = {
 "remote_work": (
  "I switched to working from home two years ago and honestly, the commute is what I miss least. My back hurts more now though, because the kitchen chair is not an office chair. Still, I'd never go back to five days in the office.",
  "Remote work has become increasingly popular in recent years. It offers numerous benefits, including flexibility, reduced commuting time, and improved work-life balance. However, it is important to note that it can also present challenges such as isolation and ergonomic concerns."),
 "coffee": (
  "My grandfather drank his coffee black and burnt, straight from a dented steel pot. I tried it once at twelve and nearly gagged. These days I make a flat white every morning and pretend I'm not copying him.",
  "Coffee is one of the most widely consumed beverages in the world. It plays a crucial role in many cultures and daily routines. Moreover, moderate consumption has been associated with several health benefits, making it a popular choice for millions of people."),
 "climate_change": (
  "Last July the river behind our house dried up completely, something the old farmers said they'd never seen. Nobody argues about whether it's changing anymore, at least not around here. We just argue about who should pay for the pumps.",
  "Climate change is one of the most pressing challenges facing humanity today. Rising global temperatures contribute to extreme weather events, sea level rise, and loss of biodiversity. Therefore, it is essential for governments and individuals to take decisive action to reduce greenhouse gas emissions."),
 "social_media": (
  "I deleted Instagram in March and for about a week I kept reaching for my phone out of habit. Then it got quiet in a good way. I still check in on my sister's page through her husband's account, which feels slightly shady.",
  "Social media has transformed the way people communicate and share information. While it provides opportunities for connection and self-expression, it also raises concerns related to privacy and mental health. In conclusion, users should engage with these platforms mindfully and responsibly."),
 "exercise": (
  "I hate running but I love having run. That's the whole secret, really. Twenty minutes around the block before the kids wake up, and the rest of the day feels easier somehow.",
  "Regular physical exercise is essential for maintaining overall health and well-being. It helps improve cardiovascular fitness, strengthen muscles, and boost mental health. Furthermore, incorporating even a small amount of daily activity can lead to significant long-term benefits."),
 "public_transport": (
  "The 47 bus is always late, except on the one day I decide to walk, then it sails past me. Even so, I'd rather deal with that than parking downtown. Plus I get to read, which is the only reading I get done all week.",
  "Public transportation plays a vital role in modern urban environments. It reduces traffic congestion, lowers carbon emissions, and provides affordable mobility for residents. Additionally, investing in efficient transit systems can enhance the overall quality of life in cities."),
 "languages": (
  "I've been learning Portuguese for eight months and I can order food, argue about football, and absolutely nothing else. My teacher says that's normal. Last week a taxi driver complimented my accent and I floated for an hour.",
  "Learning a new language is a rewarding endeavor that offers numerous cognitive and cultural benefits. It enhances memory, improves problem-solving skills, and opens doors to new opportunities. Consistent practice and immersion are key factors in achieving fluency."),
 "sleep": (
  "Sleep was never a problem until I turned thirty-five. Now I'm awake at 3 a.m. replaying an awkward thing I said in 2011. The doctor says cut the late coffee, which is rude because it's the best part of my evening.",
  "Sleep is a fundamental aspect of human health that is often overlooked. Adequate rest supports memory consolidation, immune function, and emotional regulation. It is therefore recommended that adults aim for seven to nine hours of quality sleep each night."),
 "electric_cars": (
  "My neighbour bought an electric car and now I know his charging schedule better than my own. He loves it, though, and says he hasn't seen a petrol station in months. I'm tempted, but the nearest fast charger is forty minutes away.",
  "Electric vehicles are gaining significant traction as a sustainable alternative to traditional gasoline-powered cars. They produce zero tailpipe emissions and offer lower operating costs over time. Nevertheless, challenges such as charging infrastructure and battery costs remain important considerations."),
 "online_shopping": (
  "I ordered a lamp last month and it arrived in a box the size of a fridge. The lamp itself was fine. What I can't get over is the packaging, three layers of plastic around a thing that weighs nothing.",
  "Online shopping has revolutionized the retail industry by offering convenience and a wide selection of products. Consumers can compare prices and read reviews from the comfort of their homes. However, concerns regarding packaging waste and delivery emissions continue to grow."),
 "reading": (
  "I used to finish a book a week, back before I had a phone that did everything. Now it takes me a month and I feel guilty the whole time. Last Sunday I left the phone in the other room and read for three hours straight, and it felt like a small miracle.",
  "Reading is a valuable habit that fosters imagination, empathy, and critical thinking. Studies suggest that regular readers tend to have larger vocabularies and better concentration. Consequently, parents and educators are encouraged to cultivate a love of reading in children from an early age."),
 "meditation": (
  "I'm bad at meditating. My mind wanders to what's for dinner about four seconds in. But my therapist says noticing the wandering is the actual exercise, so apparently I've been succeeding at failing this whole time.",
  "Meditation is an ancient practice that has gained widespread popularity in the modern world. It can reduce stress, improve focus, and promote emotional well-being. By dedicating just a few minutes each day, individuals can experience meaningful improvements in their mental health."),
 "recycling": (
  "We have four bins in the garage and I still get it wrong. Apparently pizza boxes are a crime. The council sends a stern leaflet every spring, and every spring I stick it on the fridge and forget about it.",
  "Recycling is an important practice that helps conserve natural resources and reduce landfill waste. By sorting materials such as paper, glass, and plastic, communities can significantly lower their environmental impact. It is crucial that individuals understand local guidelines to ensure effective recycling."),
 "video_games": (
  "My dad thought video games would rot my brain. Funny thing, he now plays a farming sim for an hour every night and talks about his virtual cows like they're real. I haven't had the heart to tell him I told you so.",
  "Video games have evolved into a major form of entertainment and cultural expression. They can improve hand-eye coordination, problem-solving abilities, and social connections. Moreover, the industry has become a significant contributor to the global economy."),
 "home_cooking": (
  "Cooking at home saves money, sure, but that's not why I do it. It's the forty minutes where nobody asks me anything. Chopping onions is basically therapy, minus the invoice.",
  "Cooking at home offers a variety of benefits, including cost savings and healthier eating habits. It allows individuals to control ingredients and portion sizes while exploring new cuisines. Additionally, preparing meals together can strengthen family bonds."),
 "city_vs_country": (
  "We moved out to the countryside for the quiet and now I'm kept awake by owls. The nearest shop is a twenty-minute drive and I miss being able to get noodles at midnight. But the stars are ridiculous, I'll give it that.",
  "The decision between urban and rural living involves weighing numerous factors. Cities offer greater access to employment, culture, and services, while rural areas provide tranquility and closer connection to nature. Ultimately, the ideal choice depends on individual priorities and lifestyle preferences."),
 "phones_in_school": (
  "Our school banned phones last term and the corridors got loud again, in a good way. Kids actually talk at lunch. A few of them complained for about a week, then someone started a card game and that was that.",
  "The use of smartphones in schools is a topic of ongoing debate among educators and parents. Proponents argue that devices can serve as valuable learning tools, while critics highlight concerns about distraction and cyberbullying. As a result, many institutions are implementing clear policies to balance these considerations."),
 "volunteering": (
  "I started volunteering at the food bank because my company gave us a day off for it. I kept going because of a woman named Marta who bosses everyone around and keeps a tin of toffees under the counter. Best Saturday job I've ever had, and it pays nothing.",
  "Volunteering is a meaningful way to give back to the community and make a positive impact. It provides individuals with opportunities to develop new skills, build relationships, and gain a sense of purpose. Furthermore, organizations rely heavily on volunteers to carry out their missions."),
 "minimalism": (
  "I read one book about minimalism and threw out half my wardrobe in a weekend. Two months later I bought most of it back, in slightly different colours. I think the lesson is that I'm not a minimalist, I just like a tidy drawer.",
  "Minimalism is a lifestyle philosophy that emphasizes simplicity and intentional living. By reducing material possessions, individuals can free up time, space, and financial resources. In essence, minimalism encourages people to focus on what truly adds value to their lives."),
 "space_exploration": (
  "When I was nine my uncle took me to see a rocket launch from a beach, miles away, and the sound arrived a full ten seconds after the light. I still remember my ribs buzzing. I don't care what it costs, I want kids to see that.",
  "Space exploration represents one of humanity's most ambitious and inspiring endeavors. It drives technological innovation, expands scientific knowledge, and fosters international collaboration. Looking ahead, continued investment in this field is likely to yield benefits that extend far beyond our planet."),
}

topics = list(SEEDS)
random.shuffle(topics)
split = {t: ("test" if i < 4 else "train") for i, t in enumerate(topics)}  # 16 train / 4 test, split by topic (no leakage)

def sents(t): return [s.strip() for s in re.split(r'(?<=[.!?])\s+', t) if s.strip()]
def toks(t): return re.findall(r"[a-z0-9']+", t.lower())
def ngrams(t, n=3):
    w = toks(t); return {tuple(w[i:i+n]) for i in range(len(w)-n+1)}
def jaccard(a, b):
    A, B = ngrams(a), ngrams(b); return round(len(A & B)/len(A | B), 3) if A | B else 0.0
def seq(a, b): return round(difflib.SequenceMatcher(None, toks(a), toks(b)).ratio(), 3)

SYN = {"nearly":"almost","still":"yet","hate":"dislike","love":"adore","small":"tiny","big":"large","really":"truly",
 "actually":"in fact","kids":"children","apparently":"seemingly","every":"each","quiet":"calm","best":"finest",
 "started":"began","moved":"relocated","bought":"purchased","stern":"strict","tidy":"neat","whole":"entire",
 "week":"seven days","month":"four weeks","honestly":"frankly","never":"not once","feels":"seems","felt":"seemed",
 "keep":"continue","kept":"continued","think":"believe","loud":"noisy","drive":"trip","shop":"store","said":"stated"}

def synonym_swap(t):
    def rep(m):
        w = m.group(0); r = SYN.get(w.lower())
        return (r.capitalize() if w[0].isupper() else r) if r else w
    return re.sub(r"[A-Za-z']+", rep, t)

def shuffle_sentences(t):
    s = sents(t); random.shuffle(s); return " ".join(s)

# ---------- 1. AI detection ----------
ai_rows = []
for t, (h, a) in SEEDS.items():
    ai_rows.append(dict(id=f"{t}_h", text=h, label="human", label_id=0, topic=t, split=split[t]))
    ai_rows.append(dict(id=f"{t}_a", text=a, label="ai", label_id=1, topic=t, split=split[t]))
    # hard-ish positives/negatives: lightly edited AI text, and AI text with one human-ish sentence mixed in
    ai_rows.append(dict(id=f"{t}_a_edit", text=synonym_swap(a), label="ai", label_id=1, topic=t, split=split[t]))
    mixed = sents(a)[0] + " " + " ".join(sents(h)[1:])
    ai_rows.append(dict(id=f"{t}_mixed", text=mixed, label="mixed", label_id=2, topic=t, split=split[t]))
for r in ai_rows:
    r["word_count"] = len(toks(r["text"]))

# ---------- 2. Plagiarism ----------
pl_rows, n = [], 0
def add(src_t, cand, kind, label, split_name):
    global n; n += 1
    pl_rows.append(dict(id=f"pl{n:03d}", source_text=SEEDS[src_t][0], candidate_text=cand, type=kind,
        label=label, ngram_jaccard=jaccard(SEEDS[src_t][0], cand), seq_ratio=seq(SEEDS[src_t][0], cand),
        source_topic=src_t, split=split_name))
for t in topics:
    h, a = SEEDS[t]; sp = split[t]
    other = random.choice([x for x in topics if x != t and split[x] == sp])
    add(t, h, "verbatim_copy", 1, sp)
    add(t, synonym_swap(h), "synonym_swap", 1, sp)
    add(t, shuffle_sentences(h), "sentence_reorder", 1, sp)
    add(t, sents(h)[0] + " " + " ".join(sents(SEEDS[other][0])[1:]), "mosaic_partial", 1, sp)
    add(t, a, "same_topic_different_text", 0, sp)          # hard negative
    add(t, SEEDS[other][0], "unrelated_original", 0, sp)  # easy negative

# ---------- 3. Humanizer pairs ----------
hm_rows = []
for t, (h, a) in SEEDS.items():
    hm_rows.append(dict(id=f"hm_{t}", input_ai_text=a, target_humanized_text=h, topic=t, split=split[t],
        style_notes="contractions; first-person anecdote; concrete detail; uneven sentence length; no formulaic transitions",
        ai_markers_removed="; ".join(m for m in ["however","moreover","furthermore","additionally","therefore","in conclusion",
            "it is important to note","plays a crucial role","it is essential","nevertheless","consequently","ultimately","in essence"]
            if m in a.lower())))

def write(name, rows):
    with open(f"{OUT}/{name}.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0])); w.writeheader(); w.writerows(rows)
    print(name, len(rows))
write("ai_detection", ai_rows); write("plagiarism", pl_rows); write("humanizer", hm_rows)
