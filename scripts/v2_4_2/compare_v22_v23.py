import json
import re
import hashlib

def get_sha(t):
    return hashlib.sha256(t.encode('utf-8')).hexdigest()

def get_norm_sha(t):
    n = re.sub(r'\s+', ' ', re.sub(r'[^\w\s]', '', t.lower())).strip()
    return hashlib.sha256(n.encode('utf-8')).hexdigest()

def main():
    with open('tests/eval/fixtures/detector_v2_2_benchmark.json', 'r', encoding='utf-8') as f:
        v22_bench = json.load(f)

    print(f"V2.2 Benchmark samples in fixture: {len(v22_bench)}")
    
    # Check base passages and texts in v22_bench
    v22_map = {}
    for item in v22_bench:
        sid = item['id']
        sha = item.get('sha256') or get_sha(item['text'])
        nsha = get_norm_sha(item['text'])
        v22_map[sid] = {
            'id': sid,
            'sha256': sha,
            'normSha256': nsha,
            'text': item['text'],
            'label': item['label'],
            'genre': item.get('genre'),
            'split': item.get('split') or item.get('partition'),
        }

    # Now let's see what is inside detector_v2_3_comparative.eval.test.ts
    with open('tests/eval/detector_v2_3_comparative.eval.test.ts', 'r', encoding='utf-8') as f:
        code = f.read()

    # Find base passages defined in detector_v2_3_comparative.eval.test.ts
    base_matches = re.findall(r"baseId:\s*'([^']+)'[\s\S]*?text:\s*'([^']+)'", code)
    print(f"Base passages found in V2.3 comparative test: {len(base_matches)}")
    for b_id, b_text in base_matches:
        print(f"  {b_id}: {b_text[:60]}... (len={len(b_text)})")

    # Let's check how many samples are generated in buildComparativeEvaluationCorpora()
    # Let's inspect the groups: Group A (N=60), Group B (N=60), Group C (N=60)
    print("\nLet's check the overlap between V2.2 benchmark fixture (90 samples) and V2.3 comparative test base passages:")
    v22_hashes = set(x['sha256'] for x in v22_map.values())
    v22_norm_hashes = set(x['normSha256'] for x in v22_map.values())

    matched_bases = 0
    for b_id, b_text in base_matches:
        b_sha = get_sha(b_text)
        b_nsha = get_norm_sha(b_text)
        if b_sha in v22_hashes or b_nsha in v22_norm_hashes:
            matched_bases += 1
            print(f"  Match found for V2.3 base {b_id} in V2.2 benchmark!")
        else:
            # Check substring
            sub = False
            for v_id, v_item in v22_map.items():
                if b_text[:40] in v_item['text'] or v_item['text'][:40] in b_text:
                    sub = True
                    print(f"  Partial/Substring match: V2.3 base {b_id} <-> V2.2 item {v_id}")
                    break

if __name__ == '__main__':
    main()

