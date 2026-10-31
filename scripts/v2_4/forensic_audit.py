import json
import hashlib
import numpy as np

def get_3grams(text):
    words = [w for w in text.lower().replace('.', ' ').replace(',', ' ').split() if w]
    return set(zip(words, words[1:], words[2:]))

def jaccard(a, b):
    if not a or not b: return 0.0
    return len(a & b) / len(a | b)

def main():
    with open('data/v2_4/dataset_registry.jsonl', 'r', encoding='utf-8') as f:
        registry = [json.loads(line) for line in f]

    with open('tests/eval/fixtures/detector_v2_2_1_holdout.json', 'r', encoding='utf-8') as f:
        holdout_fixture = json.load(f)

    with open('tests/eval/fixtures/detector_v2_2_benchmark.json', 'r', encoding='utf-8') as f:
        benchmark_fixture = json.load(f)

    with open('data/v2_4/train.jsonl', 'r', encoding='utf-8') as f:
        train = [json.loads(line) for line in f]

    with open('data/v2_4/dev.jsonl', 'r', encoding='utf-8') as f:
        dev = [json.loads(line) for line in f]

    with open('data/v2_4/final_test.jsonl', 'r', encoding='utf-8') as f:
        test = [json.loads(line) for line in f]

    train_ids = set(r['sampleId'] for r in train)
    dev_ids = set(r['sampleId'] for r in dev)
    test_ids = set(r['sampleId'] for r in test)

    print(f"Total Registry Records: {len(registry)}")
    print(f"Holdout Fixture Count: {len(holdout_fixture)}")
    print(f"Benchmark Fixture Count: {len(benchmark_fixture)}")
    print(f"Train / Dev / Test Partition Counts: {len(train)} / {len(dev)} / {len(test)}")

    # 1. Historical Holdout Crosswalk
    print("\n--- 1. Historical Holdout Crosswalk Audit ---")
    holdout_registry = [r for r in registry if r['sourceDataset'] == 'detector_v2_2_1_holdout']
    print(f"Holdout records in registry: {len(holdout_registry)}")

    fixture_map = {item['id']: item for item in holdout_fixture}
    
    in_train_cnt = sum(1 for r in holdout_registry if r['sampleId'] in train_ids)
    in_dev_cnt = sum(1 for r in holdout_registry if r['sampleId'] in dev_ids)
    in_test_cnt = sum(1 for r in holdout_registry if r['sampleId'] in test_ids)

    print(f"Holdout records in Train: {in_train_cnt}")
    print(f"Holdout records in Dev: {in_dev_cnt}")
    print(f"Holdout records in Final Test: {in_test_cnt}")

    # Check matches with fixture
    exact_match = 0
    hash_match = 0
    for r in holdout_registry:
        orig_id = r['sourceDocumentId']
        if orig_id in fixture_map:
            exact_match += 1
            if r['sha256'] == fixture_map[orig_id].get('sha256'):
                hash_match += 1

    print(f"Holdout exact ID matches with fixture: {exact_match} / {len(holdout_registry)}")
    print(f"Holdout SHA256 matches with fixture: {hash_match} / {len(holdout_registry)}")

    # 2. V2.2 Benchmark Archive Audit (90 records)
    print("\n--- 2. V2.2 Benchmark Archive Audit (90 records) ---")
    bench_registry = [r for r in registry if r['sourceDataset'] == 'detector_v2_2_benchmark']
    bench_fixture_map = {item['id']: item for item in benchmark_fixture}
    print(f"Benchmark records in registry: {len(bench_registry)}")
    
    bench_unique_texts = len(set(r['sha256'] for r in bench_registry))
    bench_unique_base = len(set(r['baseDocumentId'] for r in bench_registry))
    bench_unique_groups = len(set(r['independenceGroupId'] for r in bench_registry))
    print(f"Benchmark unique texts: {bench_unique_texts}")
    print(f"Benchmark unique baseDocumentIds: {bench_unique_base}")
    print(f"Benchmark unique independenceGroupIds: {bench_unique_groups}")

    bench_train = sum(1 for r in bench_registry if r['sampleId'] in train_ids)
    bench_dev = sum(1 for r in bench_registry if r['sampleId'] in dev_ids)
    bench_test = sum(1 for r in bench_registry if r['sampleId'] in test_ids)
    print(f"Benchmark records in Train / Dev / Test: {bench_train} / {bench_dev} / {bench_test}")

    # 3. Eval Harness Seeds Audit (80 records)
    print("\n--- 3. Eval Harness Seeds Audit (80 records) ---")
    seed_registry = [r for r in registry if r['sourceDataset'] == 'eval_harness_seeds']
    seed_hashes = {}
    seed_dups = []
    for s in seed_registry:
        h = s['sha256']
        if h in seed_hashes:
            seed_dups.append((s['sampleId'], seed_hashes[h]))
        else:
            seed_hashes[h] = s['sampleId']

    print(f"Seed records: {len(seed_registry)}")
    print(f"Seed unique texts: {len(seed_hashes)}")
    print(f"Seed exact duplicates (synonym swap no-ops): {len(seed_dups)}")
    for d in seed_dups[:5]:
        print(f"  {d[0]} identical to {d[1]}")

    seed_train = sum(1 for r in seed_registry if r['sampleId'] in train_ids)
    seed_dev = sum(1 for r in seed_registry if r['sampleId'] in dev_ids)
    seed_test = sum(1 for r in seed_registry if r['sampleId'] in test_ids)
    print(f"Seed records in Train / Dev / Test: {seed_train} / {seed_dev} / {seed_test}")

    # 4. Pilot Batch Audit (10 records)
    print("\n--- 4. Pilot Batch Audit (10 records) ---")
    pilot_registry = [r for r in registry if r['sourceDataset'] == 'workflow_validation_pilot_v2_2_7']
    print(f"Pilot records: {len(pilot_registry)} (all in Dev: {sum(1 for r in pilot_registry if r['sampleId'] in dev_ids)})")

    # 5. Overlap between Holdout and Benchmark
    print("\n--- 5. Cross-Source Overlap Audit ---")
    holdout_hashes_set = set(r['sha256'] for r in holdout_registry)
    bench_hashes_set = set(r['sha256'] for r in bench_registry)
    seed_hashes_set = set(seed_hashes.keys())
    
    hb_overlap = holdout_hashes_set.intersection(bench_hashes_set)
    hs_overlap = holdout_hashes_set.intersection(seed_hashes_set)
    bs_overlap = bench_hashes_set.intersection(seed_hashes_set)
    print(f"Exact text hash overlap Holdout <-> Benchmark: {len(hb_overlap)}")
    print(f"Exact text hash overlap Holdout <-> Seeds: {len(hs_overlap)}")
    print(f"Exact text hash overlap Benchmark <-> Seeds: {len(bs_overlap)}")

if __name__ == '__main__':
    main()

