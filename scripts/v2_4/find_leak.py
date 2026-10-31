import json

def get_3grams(text):
    words = [w for w in text.lower().replace('.', ' ').replace(',', ' ').split() if w]
    return set(zip(words, words[1:], words[2:]))

def jaccard(a, b):
    if not a or not b: return 0.0
    return len(a & b) / len(a | b)

with open('data/v2_4/train.jsonl', 'r', encoding='utf-8') as f:
    train = [json.loads(line) for line in f]
with open('data/v2_4/dev.jsonl', 'r', encoding='utf-8') as f:
    dev = [json.loads(line) for line in f]
with open('data/v2_4/final_test.jsonl', 'r', encoding='utf-8') as f:
    test = [json.loads(line) for line in f]

for d in dev:
    dg = get_3grams(d['text'])
    for t in train:
        tg = get_3grams(t['text'])
        sim = jaccard(dg, tg)
        if sim >= 0.40:
            print(f"Dev {d['sampleId']} vs Train {t['sampleId']}: Jaccard={sim:.3f}")
            print('  Dev:', d['text'][:80])
            print('  Train:', t['text'][:80])

for te in test:
    teg = get_3grams(te['text'])
    for t in train:
        tg = get_3grams(t['text'])
        sim = jaccard(teg, tg)
        if sim >= 0.40:
            print(f"Test {te['sampleId']} vs Train {t['sampleId']}: Jaccard={sim:.3f}")
            print('  Test:', te['text'][:80])
            print('  Train:', t['text'][:80])

