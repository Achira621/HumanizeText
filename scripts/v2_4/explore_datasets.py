import json
import glob
import hashlib
import os

def get_sha256(text: str) -> str:
    return hashlib.sha256(text.encode('utf-8')).hexdigest()

def main():
    records = []

    # 1. Pilot records (10 samples)
    pilot_file = 'somedata/files/humanizetext_v2_2_7_ai_pilot_batch_candidate.jsonl'
    if os.path.exists(pilot_file):
        with open(pilot_file, 'r', encoding='utf-8') as f:
            for line in f:
                if not line.strip():
                    continue
                item = json.loads(line)
                records.append({
                    'source': 'pilot_v2_2_7',
                    'sampleId': item['sampleId'],
                    'baseId': item['promptId'],
                    'authorClass': 'ai',
                    'text': item['text'],
                    'sha256': item['textSha256'],
                    'license': 'Internal-Pilot-Restricted',
                    'provenanceStatus': 'workflow_validation_pilot',
                })

    # 2. somedata/files/detection.json (80 samples from 20 seed topics)
    seeds_file = 'somedata/files/detection.json'
    if os.path.exists(seeds_file):
        with open(seeds_file, 'r', encoding='utf-8') as f:
            items = json.load(f)
            for it in items:
                lbl = it['label']
                cls = 'human' if lbl == 'human' else ('ai' if lbl == 'ai' else 'collaborative')
                records.append({
                    'source': 'eval_harness_seeds',
                    'sampleId': f"seeds_{it['id']}",
                    'baseId': f"seed_{it['topic']}",
                    'authorClass': cls,
                    'text': it['text'],
                    'sha256': get_sha256(it['text']),
                    'license': 'MIT',
                    'provenanceStatus': 'synthetic_expansion' if it['id'].endswith(('_edit', '_mixed')) else 'verified_archival',
                })

    # 3. tests/eval/fixtures/detector_v2_2_benchmark.json (90 samples)
    bench_file = 'tests/eval/fixtures/detector_v2_2_benchmark.json'
    if os.path.exists(bench_file):
        with open(bench_file, 'r', encoding='utf-8') as f:
            items = json.load(f)
            for it in items:
                lbl = it['label']
                cls = 'human' if lbl == 'human_verified' else ('ai' if lbl == 'ai_generated' else 'collaborative')
                prov = it.get('provenance', {})
                records.append({
                    'source': 'detector_v2_2_benchmark',
                    'sampleId': f"v22_{it['id']}",
                    'baseId': it['id'],
                    'authorClass': cls,
                    'text': it['text'],
                    'sha256': it.get('sha256') or get_sha256(it['text']),
                    'license': 'Public Domain / CC-BY-4.0',
                    'provenanceStatus': 'verified_archival' if cls == 'human' else 'prompted_generation',
                })

    # 4. Note on tests/eval/fixtures/detector_v2_2_1_holdout.json (120 samples):
    # Historical holdout fixture - must be kept untouched as final evaluation holdout or separate
    holdout_file = 'tests/eval/fixtures/detector_v2_2_1_holdout.json'
    if os.path.exists(holdout_file):
        with open(holdout_file, 'r', encoding='utf-8') as f:
            items = json.load(f)
            for it in items:
                lbl = it['label']
                cls = 'human' if lbl == 'human_verified' else ('ai' if lbl == 'ai_generated' else 'collaborative')
                records.append({
                    'source': 'detector_v2_2_1_holdout',
                    'sampleId': f"v221_{it['id']}",
                    'baseId': it['id'],
                    'authorClass': cls,
                    'text': it['text'],
                    'sha256': it.get('sha256') or get_sha256(it['text']),
                    'license': 'Public Domain / Research Holdout',
                    'provenanceStatus': 'verified_archival' if cls == 'human' else 'prompted_generation',
                })

    print(f"Total surveyed records: {len(records)}")
    
    unique_hashes = set()
    exact_duplicates = 0
    by_class = {'human': [], 'ai': [], 'collaborative': []}
    by_source = {}
    
    for r in records:
        h = r['sha256']
        if h in unique_hashes:
            exact_duplicates += 1
        else:
            unique_hashes.add(h)
        by_class[r['authorClass']].append(r)
        by_source[r['source']] = by_source.get(r['source'], 0) + 1

    print(f"Exact duplicates across all surveyed sources: {exact_duplicates}")
    print(f"Unique passage hashes across all sources: {len(unique_hashes)}")
    print("\nSource breakdown:")
    for s, cnt in by_source.items():
        print(f"  {s}: {cnt}")

    print("\nClass breakdown (total instances):")
    for c, items in by_class.items():
        u_h = len(set(x['sha256'] for x in items))
        print(f"  {c}: {len(items)} items ({u_h} unique texts)")

if __name__ == '__main__':
    main()

