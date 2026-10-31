import json
import math
import hashlib
import numpy as np

def wilson_ci(k, n, confidence=0.95):
    if n == 0:
        return 0.0, 0.0, 0.0
    z = 1.95996  # 95% CI
    p = k / n
    denom = 1 + z**2 / n
    center = (p + z**2 / (2 * n)) / denom
    margin = (z * math.sqrt(p * (1 - p) / n + z**2 / (4 * n**2))) / denom
    return p, max(0.0, center - margin), min(1.0, center + margin)

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

    with open('data/v2_4/final_test_features.json', 'r', encoding='utf-8') as f:
        test_features = json.load(f)

    with open('data/v2_4/model_artifact.json', 'r', encoding='utf-8') as f:
        artifact = json.load(f)

    # Crosswalk generation
    holdout_registry = [r for r in registry if r['sourceDataset'] == 'detector_v2_2_1_holdout']
    crosswalk = []
    for r in holdout_registry:
        sample_id = r['sampleId']
        orig_id = r['sourceDocumentId']
        sha = r['sha256']
        base_id = r['baseDocumentId']
        group_id = r['independenceGroupId']
        part = 'final_test'
        
        used_train = False
        used_norm = False
        used_featsel = False
        used_dev = False
        used_calib = False
        used_final_eval = True  # It was in final_test.jsonl and evaluated in tests/eval/detector_v2_4_comparative.eval.test.ts!
        
        crosswalk.append({
            'registrySampleId': sample_id,
            'originalSampleId': orig_id,
            'textSha256': sha,
            'baseDocumentId': base_id,
            'independenceGroupId': group_id,
            'assignedPartition': part,
            'usedInModelTraining': used_train,
            'usedInNormalizationFitting': used_norm,
            'usedInFeatureSelection': used_featsel,
            'usedInDevelopment': used_dev,
            'usedInCalibration': used_calib,
            'usedInFinalEvaluation': used_final_eval,
            'authorClass': r['authorClass'],
            'genre': r['genre'],
        })

    with open('data/v2_4/holdout_crosswalk.json', 'w', encoding='utf-8') as f:
        json.dump(crosswalk, f, indent=2)
    print(f"Generated holdout crosswalk with {len(crosswalk)} records.")

    # Reconcile final test metrics on N=103
    binary_test = [r for r in test_features if r['binaryLabel'] in (0, 1)]
    print(f"Binary test records: {len(binary_test)}")

    model_features = artifact['featureNames']
    intercept = artifact['intercept']
    coefs = artifact['coefficients']
    plattA = artifact['calibrationParams']['plattA']
    plattB = artifact['calibrationParams']['plattB']
    tau_ai = artifact['decisionThresholds']['aiThreshold']
    tau_human = artifact['decisionThresholds']['humanThreshold']

    y_true = []
    y_prob = []
    y_dense_pred = []
    y_sel_verdict = []  # 'ai', 'human', 'abstained'

    for r in binary_test:
        y = r['binaryLabel']
        y_true.append(y)
        norm = r['normalizedFeatures']
        margin = intercept + sum(coefs[f] * norm[f] for f in model_features)
        prob = 1.0 / (1.0 + math.exp(-(plattA * margin + plattB)))
        prob = max(0.0001, min(0.9999, prob))
        y_prob.append(prob)
        y_dense_pred.append(1 if prob >= 0.5 else 0)

        if prob >= tau_ai:
            y_sel_verdict.append('ai')
        elif prob <= tau_human:
            y_sel_verdict.append('human')
        else:
            y_sel_verdict.append('abstained')

    y_true = np.array(y_true)
    y_prob = np.array(y_prob)
    y_dense_pred = np.array(y_dense_pred)

    total_ai = int(np.sum(y_true == 1))
    total_human = int(np.sum(y_true == 0))
    total_samples = len(y_true)

    dense_tp = int(np.sum((y_true == 1) & (y_dense_pred == 1)))
    dense_fn = int(np.sum((y_true == 1) & (y_dense_pred == 0)))
    dense_tn = int(np.sum((y_true == 0) & (y_dense_pred == 0)))
    dense_fp = int(np.sum((y_true == 0) & (y_dense_pred == 1)))

    # Wilson CIs
    p_acc, p_acc_l, p_acc_h = wilson_ci(dense_tp + dense_tn, total_samples)
    p_prec, p_prec_l, p_prec_h = wilson_ci(dense_tp, dense_tp + dense_fp)
    p_rec, p_rec_l, p_rec_h = wilson_ci(dense_tp, total_ai)
    p_spec, p_spec_l, p_spec_h = wilson_ci(dense_tn, total_human)
    p_fpr, p_fpr_l, p_fpr_h = wilson_ci(dense_fp, total_human)
    p_fnr, p_fnr_l, p_fnr_h = wilson_ci(dense_fn, total_ai)

    # Selective metrics
    classified_idx = [i for i, v in enumerate(y_sel_verdict) if v != 'abstained']
    abstained_idx = [i for i, v in enumerate(y_sel_verdict) if v == 'abstained']
    
    sel_tp = sum(1 for i in classified_idx if y_true[i] == 1 and y_sel_verdict[i] == 'ai')
    sel_fn = sum(1 for i in classified_idx if y_true[i] == 1 and y_sel_verdict[i] == 'human')
    sel_tn = sum(1 for i in classified_idx if y_true[i] == 0 and y_sel_verdict[i] == 'human')
    sel_fp = sum(1 for i in classified_idx if y_true[i] == 0 and y_sel_verdict[i] == 'ai')

    human_abstained = sum(1 for i in abstained_idx if y_true[i] == 0)
    ai_abstained = sum(1 for i in abstained_idx if y_true[i] == 1)

    human_cov = (total_human - human_abstained) / total_human
    ai_cov = (total_ai - ai_abstained) / total_ai
    tot_cov = len(classified_idx) / total_samples

    p_sprec, p_sprec_l, p_sprec_h = wilson_ci(sel_tp, sel_tp + sel_fp)
    p_srec, p_srec_l, p_srec_h = wilson_ci(sel_tp, sel_tp + sel_fn)
    p_sfpr, p_sfpr_l, p_sfpr_h = wilson_ci(sel_fp, sel_tn + sel_fp)
    p_sfnr, p_sfnr_l, p_sfnr_h = wilson_ci(sel_fn, sel_tp + sel_fn)

    p_eff_rec, p_eff_rec_l, p_eff_rec_h = wilson_ci(sel_tp, total_ai)
    p_eff_fpr, p_eff_fpr_l, p_eff_fpr_h = wilson_ci(sel_fp, total_human)

    metrics_reconciliation = {
        'totalSamples': total_samples,
        'totalAi': total_ai,
        'totalHuman': total_human,
        'denseConfusionMatrix': {'tp': dense_tp, 'fp': dense_fp, 'tn': dense_tn, 'fn': dense_fn},
        'denseMetrics': {
            'accuracy': {'val': p_acc, 'ci95': [p_acc_l, p_acc_h]},
            'precision': {'val': p_prec, 'ci95': [p_prec_l, p_prec_h]},
            'recall': {'val': p_rec, 'ci95': [p_rec_l, p_rec_h]},
            'specificity': {'val': p_spec, 'ci95': [p_spec_l, p_spec_h]},
            'fpr': {'val': p_fpr, 'ci95': [p_fpr_l, p_fpr_h]},
            'fnr': {'val': p_fnr, 'ci95': [p_fnr_l, p_fnr_h]},
            'balancedAccuracy': (p_rec + p_spec) / 2,
        },
        'selectiveConfusionMatrix': {'tp': sel_tp, 'fp': sel_fp, 'tn': sel_tn, 'fn': sel_fn},
        'abstentionCounts': {
            'totalAbstained': len(abstained_idx),
            'humanAbstained': human_abstained,
            'aiAbstained': ai_abstained,
            'humanCoverage': human_cov,
            'aiCoverage': ai_cov,
            'overallCoverage': tot_cov,
        },
        'selectiveMetrics': {
            'selectivePrecision': {'val': p_sprec, 'ci95': [p_sprec_l, p_sprec_h]},
            'selectiveRecall': {'val': p_srec, 'ci95': [p_srec_l, p_srec_h]},
            'selectiveFpr': {'val': p_sfpr, 'ci95': [p_sfpr_l, p_sfpr_h]},
            'selectiveFnr': {'val': p_sfnr, 'ci95': [p_sfnr_l, p_sfnr_h]},
            'cohortWideEffectiveRecall': {'val': p_eff_rec, 'ci95': [p_eff_rec_l, p_eff_rec_h]},
            'cohortWideEffectiveFpr': {'val': p_eff_fpr, 'ci95': [p_eff_fpr_l, p_eff_fpr_h]},
        }
    }

    with open('data/v2_4/metrics_reconciliation.json', 'w', encoding='utf-8') as f:
        json.dump(metrics_reconciliation, f, indent=2)
    print("Metrics reconciliation written to data/v2_4/metrics_reconciliation.json")
    print(f"Dense: Acc={p_acc:.4f} [{p_acc_l:.4f}, {p_acc_h:.4f}], Rec={p_rec:.4f}, Spec={p_spec:.4f}, BalAcc={(p_rec+p_spec)/2:.4f}")
    print(f"Selective: Cov={tot_cov:.4f}, Prec={p_sprec:.4f} [{p_sprec_l:.4f}, {p_sprec_h:.4f}], Rec={p_srec:.4f} [{p_srec_l:.4f}, {p_srec_h:.4f}]")
    print(f"Cohort Effective: AI Recall={p_eff_rec:.4f} [{p_eff_rec_l:.4f}, {p_eff_rec_h:.4f}], Human FPR={p_eff_fpr:.4f} [{p_eff_fpr_l:.4f}, {p_eff_fpr_h:.4f}]")

if __name__ == '__main__':
    main()

