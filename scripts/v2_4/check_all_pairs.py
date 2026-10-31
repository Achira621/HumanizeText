import json
from find_leak import get_3grams, jaccard

with open('data/v2_4/dataset_registry.jsonl', 'r', encoding='utf-8') as f:
    records = [json.loads(line) for line in f]

print(f'Total records in registry: {len(records)}')
pairs = []
for i in range(len(records)):
    gi = get_3grams(records[i]['text'])
    for j in range(i + 1, len(records)):
        gj = get_3grams(records[j]['text'])
        sim = jaccard(gi, gj)
        if sim >= 0.40:
            pairs.append((records[i], records[j], sim))

print(f'Found {len(pairs)} pairs with Jaccard >= 0.40')
for r1, r2, sim in pairs:
    print(f"{r1['sampleId']} ({r1['independenceGroupId']}) --- {r2['sampleId']} ({r2['independenceGroupId']}): sim={sim:.3f}")

