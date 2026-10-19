# Starter dataset: plagiarism, AI detection, humanizer

| File | Rows | Task | Labels |
|---|---|---|---|
| ai_detection.csv | 80 | text -> human / ai / mixed | label_id 0/1/2 |
| plagiarism.csv | 120 | (source_text, candidate_text) -> plagiarised? | label 1/0 + type |
| humanizer.csv | 20 | input_ai_text -> target_humanized_text | seq2seq pairs |

- `split` column (train/test) is done BY TOPIC, so no topic leaks from train into test.
- plagiarism `type`: verbatim_copy, synonym_swap, sentence_reorder, mosaic_partial (label 1);
  same_topic_different_text (hard negative), unrelated_original (label 0).
- `ngram_jaccard` and `seq_ratio` are baseline similarity features you can compare your model against.

This is a SMALL seed set for building and smoke-testing your pipeline. For real accuracy you need thousands+
of samples. Public corpora to scale up: HC3, RAID, M4, GPT-wiki-intro (AI detection); PAN plagiarism
corpora, MRPC, PAWS, Quora Question Pairs (paraphrase/plagiarism); ParaNMT, PAWS (rewriting).
Use the same schema and generate more AI text from several different models for variety.
