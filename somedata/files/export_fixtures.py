"""Convert dataset/*.csv into typed JSON fixtures for the Vitest harness.
Usage: python scripts/export_fixtures.py <dataset_dir> <out_dir>
"""
import csv, json, sys, pathlib

src = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "../dataset")
out = pathlib.Path(sys.argv[2] if len(sys.argv) > 2 else "src/eval/fixtures")
out.mkdir(parents=True, exist_ok=True)

def rows(name):
    with open(src / f"{name}.csv", newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))

detection = [dict(id=r["id"], text=r["text"], label=r["label"], topic=r["topic"], split=r["split"])
             for r in rows("ai_detection")]
plagiarism = [dict(id=r["id"], sourceText=r["source_text"], candidateText=r["candidate_text"], type=r["type"],
                   isPlagiarised=r["label"] == "1", topic=r["source_topic"], split=r["split"])
              for r in rows("plagiarism")]
humanizer = [dict(id=r["id"], inputAiText=r["input_ai_text"], targetHumanizedText=r["target_humanized_text"],
                  topic=r["topic"], split=r["split"],
                  markers=[m.strip() for m in r["ai_markers_removed"].split(";") if m.strip()])
             for r in rows("humanizer")]

for name, data in [("detection", detection), ("plagiarism", plagiarism), ("humanizer", humanizer)]:
    (out / f"{name}.json").write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(name, len(data))
