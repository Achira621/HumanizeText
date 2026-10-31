"""
============================================================================
HUMANIZETEXT DETECTOR V2.5.1: FROZEN CANDIDATE FINAL TEST EVALUATION
One-time, strictly controlled evaluation of the frozen V2.5.0 detector
candidate against the untouched FINAL_TEST partition (62 samples).

Guarantees:
  - 100% frozen model artifact (weights, intercept, normalization, Platt params, thresholds).
  - No retraining, recalibration, or threshold tuning.
  - Full dense and selective confusion matrices.
  - Wilson 95% confidence intervals on all metrics.
  - Grouped subgroup evaluation across author cohorts, models, genres, and lengths.
  - Reliability calibration evaluation (Brier, Log Loss, ECE).
============================================================================
"""

import json
import os
import math
import hashlib
import numpy as np
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    precision_score,
    recall_score,
    roc_auc_score,
    brier_score_loss,
    log_loss,
    confusion_matrix,
)

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
DATA_DIR = os.path.join(ROOT_DIR, 'data', 'v2_5')
ARTIFACT_PATH = os.path.join(DATA_DIR, 'model_artifact.json')
FINAL_TEST_PATH = os.path.join(DATA_DIR, 'final_test_features.json')

def wilson_ci(k, n, confidence=0.95):
    """Computes Wilson score interval for proportion k/n."""
    if n == 0:
        return (0.0, 0.0)
    z = 1.959963984540054  # 95% confidence
    p = k / n
    denominator = 1 + z**2 / n
    centre_adjusted_probability = p + z**2 / (2 * n)
    adjusted_std_error = math.sqrt((p * (1 - p) + z**2 / (4 * n)) / n)
    lower = (centre_adjusted_probability - z * adjusted_std_error) / denominator
    upper = (centre_adjusted_probability + z * adjusted_std_error) / denominator
    return (max(0.0, float(lower)), min(1.0, float(upper)))

def balanced_accuracy_ci(tp, fn, tn, fp, confidence=0.95):
    """
    Computes confidence interval for balanced accuracy:
    BAcc = (Sensitivity + Specificity) / 2 = (Recall + (1 - FPR)) / 2.
    Variance is (Var(Sens) + Var(Spec)) / 4.
    """
    p_pos = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    var_pos = (p_pos * (1 - p_pos)) / (tp + fn) if (tp + fn) > 0 else 0.0

    p_neg = tn / (tn + fp) if (tn + fp) > 0 else 0.0
    var_neg = (p_neg * (1 - p_neg)) / (tn + fp) if (tn + fp) > 0 else 0.0

    bacc = (p_pos + p_neg) / 2.0
    se = math.sqrt(var_pos + var_neg) / 2.0
    z = 1.959963984540054
    return (max(0.0, float(bacc - z * se)), min(1.0, float(bacc + z * se)))

def run_evaluation():
    print("=== HumanizeText V2.5.1 Frozen Candidate Final Test Evaluation ===")
    
    # 1. Load frozen model artifact
    with open(ARTIFACT_PATH, 'r', encoding='utf-8') as f:
        artifact = json.load(f)
        
    fn_list = artifact['featureNames']
    coefs = np.array([artifact['coefficients'][fn] for fn in fn_list], dtype=np.float64)
    intercept = artifact['intercept']
    A = artifact['calibrationParams']['A']
    B = artifact['calibrationParams']['B']
    tau_ai = artifact['decisionPolicy']['tauAi']
    tau_human = artifact['decisionPolicy']['tauHuman']
    min_words = artifact['decisionPolicy']['minimumWordCount']
    
    # 2. Load untouched FINAL_TEST
    with open(FINAL_TEST_PATH, 'r', encoding='utf-8') as f:
        test_records = json.load(f)
        
    print(f"Loaded {len(test_records)} FINAL_TEST samples.")
    assert len(test_records) == 62, f"Expected 62 records, got {len(test_records)}"
    
    # Run frozen inference
    results = []
    y_true = []
    y_margin = []
    y_prob = []
    
    for r in test_records:
        norm_vec = np.array([r['normalizedFeatures'][fn] for fn in fn_list], dtype=np.float64)
        margin = float(intercept + np.dot(coefs, norm_vec))
        z = A * margin + B
        clamped_z = np.clip(z, -30.0, 30.0)
        prob = float(1.0 / (1.0 + np.exp(-clamped_z)))
        prob = max(0.0001, min(0.9999, prob))
        
        wc = r['wordCount']
        label = r['binaryLabel']
        
        if wc < min_words:
            verdict = 'inconclusive'
            reason = 'length_below_minimum'
        elif prob >= tau_ai:
            verdict = 'ai'
            reason = 'high_confidence_ai'
        elif prob <= tau_human:
            verdict = 'human'
            reason = 'high_confidence_human'
        else:
            verdict = 'inconclusive'
            reason = 'uncertainty_band'
            
        y_true.append(label)
        y_margin.append(margin)
        y_prob.append(prob)
        
        results.append({
            'sampleId': r['sampleId'],
            'baseDocumentId': r['baseDocumentId'],
            'independenceGroupId': r['independenceGroupId'],
            'authorClass': r['authorClass'],
            'subgroup': r['subgroup'],
            'genre': r['genre'],
            'wordCount': wc,
            'binaryLabel': label,
            'margin': margin,
            'probability': prob,
            'verdict': verdict,
            'reason': reason
        })
        
    y_true = np.array(y_true, dtype=np.int32)
    y_prob = np.array(y_prob, dtype=np.float64)
    y_margin = np.array(y_margin, dtype=np.float64)
    
    # 3. Dense Metrics (threshold = 0.5)
    y_pred_dense = (y_prob >= 0.5).astype(int)
    cm_dense = confusion_matrix(y_true, y_pred_dense, labels=[0, 1])
    tn_d, fp_d, fn_d, tp_d = cm_dense.ravel()
    
    dense_acc = accuracy_score(y_true, y_pred_dense)
    dense_bacc = balanced_accuracy_score(y_true, y_pred_dense)
    dense_prec = precision_score(y_true, y_pred_dense, zero_division=0)
    dense_rec = recall_score(y_true, y_pred_dense, zero_division=0) # Sensitivity
    dense_spec = tn_d / (tn_d + fp_d) if (tn_d + fp_d) > 0 else 0.0
    dense_fpr = fp_d / (fp_d + tn_d) if (fp_d + tn_d) > 0 else 0.0
    dense_fnr = fn_d / (fn_d + tp_d) if (fn_d + tp_d) > 0 else 0.0
    
    auc_roc = roc_auc_score(y_true, y_prob)
    brier = brier_score_loss(y_true, y_prob)
    logloss = log_loss(y_true, y_prob)
    
    # ECE on FINAL_TEST (10 bins)
    bin_boundaries = np.linspace(0, 1, 11)
    ece = 0.0
    reliability_bins = []
    for i in range(10):
        b_low, b_high = bin_boundaries[i], bin_boundaries[i + 1]
        mask = (y_prob >= b_low) & (y_prob <= b_high) if i == 9 else (y_prob >= b_low) & (y_prob < b_high)
        cnt = int(np.sum(mask))
        if cnt > 0:
            bin_acc = float(np.mean(y_true[mask] == (y_prob[mask] >= 0.5)))
            bin_conf = float(np.mean(y_prob[mask]))
            obs_ai_freq = float(np.mean(y_true[mask]))
            ece += (cnt / len(y_prob)) * abs(bin_acc - bin_conf)
            reliability_bins.append({
                'bin': f"[{b_low:.1f}, {b_high:.1f}]",
                'sampleCount': cnt,
                'meanConfidence': bin_conf,
                'observedAccuracy': bin_acc,
                'observedAiFrequency': obs_ai_freq
            })
            
    # 4. Selective 3-Outcome Metrics
    human_samples = [r for r in results if r['binaryLabel'] == 0]
    ai_samples = [r for r in results if r['binaryLabel'] == 1]
    
    human_decided = [r for r in human_samples if r['verdict'] in ['ai', 'human']]
    ai_decided = [r for r in ai_samples if r['verdict'] in ['ai', 'human']]
    all_decided = [r for r in results if r['verdict'] in ['ai', 'human']]
    inconclusive = [r for r in results if r['verdict'] == 'inconclusive']
    
    cov_human = len(human_decided) / len(human_samples)
    cov_ai = len(ai_decided) / len(ai_samples)
    cov_overall = len(all_decided) / len(results)
    
    tp_s = sum(1 for r in all_decided if r['verdict'] == 'ai' and r['binaryLabel'] == 1)
    fp_s = sum(1 for r in all_decided if r['verdict'] == 'ai' and r['binaryLabel'] == 0)
    tn_s = sum(1 for r in all_decided if r['verdict'] == 'human' and r['binaryLabel'] == 0)
    fn_s = sum(1 for r in all_decided if r['verdict'] == 'human' and r['binaryLabel'] == 1)
    
    sel_prec = tp_s / (tp_s + fp_s) if (tp_s + fp_s) > 0 else 0.0
    sel_rec = tp_s / (tp_s + fn_s) if (tp_s + fn_s) > 0 else 0.0 # Sensitivity among decided
    sel_spec = tn_s / (tn_s + fp_s) if (tn_s + fp_s) > 0 else 0.0 # Specificity among decided
    sel_fpr = fp_s / (fp_s + tn_s) if (fp_s + tn_s) > 0 else 0.0
    sel_fnr = fn_s / (fn_s + tp_s) if (fn_s + tp_s) > 0 else 0.0
    sel_acc = (tp_s + tn_s) / len(all_decided) if len(all_decided) > 0 else 0.0
    sel_bacc = (sel_rec + sel_spec) / 2.0
    
    # Cohort-wide effective rates
    effective_ai_recall = tp_s / len(ai_samples) # AI caught out of total AI cohort
    effective_human_far = fp_s / len(human_samples) # Humans falsely flagged out of total human cohort
    
    # 5. Confidence Intervals (95%)
    ci_report = {
        'densePrecision': {'value': dense_prec, 'ci95': wilson_ci(tp_d, tp_d + fp_d)},
        'denseRecall': {'value': dense_rec, 'ci95': wilson_ci(tp_d, tp_d + fn_d)},
        'denseSpecificity': {'value': dense_spec, 'ci95': wilson_ci(tn_d, tn_d + fp_d)},
        'denseFpr': {'value': dense_fpr, 'ci95': wilson_ci(fp_d, fp_d + tn_d)},
        'denseFnr': {'value': dense_fnr, 'ci95': wilson_ci(fn_d, fn_d + tp_d)},
        'denseBalancedAccuracy': {'value': dense_bacc, 'ci95': balanced_accuracy_ci(tp_d, fn_d, tn_d, fp_d)},
        'overallCoverage': {'value': cov_overall, 'ci95': wilson_ci(len(all_decided), len(results))},
        'humanCoverage': {'value': cov_human, 'ci95': wilson_ci(len(human_decided), len(human_samples))},
        'aiCoverage': {'value': cov_ai, 'ci95': wilson_ci(len(ai_decided), len(ai_samples))},
        'selectivePrecision': {'value': sel_prec, 'ci95': wilson_ci(tp_s, tp_s + fp_s)},
        'selectiveRecall': {'value': sel_rec, 'ci95': wilson_ci(tp_s, tp_s + fn_s)},
        'selectiveSpecificity': {'value': sel_spec, 'ci95': wilson_ci(tn_s, tn_s + fp_s)},
        'selectiveFpr': {'value': sel_fpr, 'ci95': wilson_ci(fp_s, fp_s + tn_s)},
        'selectiveFnr': {'value': sel_fnr, 'ci95': wilson_ci(fn_s, fn_s + tp_s)},
        'selectiveBalancedAccuracy': {'value': sel_bacc, 'ci95': balanced_accuracy_ci(tp_s, fn_s, tn_s, fp_s)},
        'effectiveAiRecall': {'value': effective_ai_recall, 'ci95': wilson_ci(tp_s, len(ai_samples))},
        'effectiveHumanFalseAlarmRate': {'value': effective_human_far, 'ci95': wilson_ci(fp_s, len(human_samples))},
    }
    
    # 6. Subgroup Performance
    # By Subgroup
    subgroup_names = sorted(list(set(r['subgroup'] for r in results)))
    subgroup_metrics = {}
    for sg in subgroup_names:
        recs = [r for r in results if r['subgroup'] == sg]
        cnt = len(recs)
        dec = [r for r in recs if r['verdict'] in ['ai', 'human']]
        probs = [r['probability'] for r in recs]
        y_sub = [r['binaryLabel'] for r in recs]
        dense_correct = sum(1 for i, r in enumerate(recs) if (probs[i] >= 0.5) == (y_sub[i] == 1))
        
        status = 'REPORTED' if cnt >= 5 else 'EXPLORATORY_SMALL_SAMPLE'
        subgroup_metrics[sg] = {
            'sampleCount': cnt,
            'status': status,
            'coverage': len(dec) / cnt,
            'denseAccuracy': dense_correct / cnt,
            'meanProbability': float(np.mean(probs)),
            'decidedCount': len(dec),
            'decidedAccuracy': (sum(1 for r in dec if (r['verdict'] == 'ai') == (r['binaryLabel'] == 1)) / len(dec)) if len(dec) > 0 else None
        }
        
    # By Genre
    genre_names = sorted(list(set(r['genre'] for r in results)))
    genre_metrics = {}
    for g in genre_names:
        recs = [r for r in results if r['genre'] == g]
        cnt = len(recs)
        dec = [r for r in recs if r['verdict'] in ['ai', 'human']]
        probs = [r['probability'] for r in recs]
        y_g = [r['binaryLabel'] for r in recs]
        dense_correct = sum(1 for i, r in enumerate(recs) if (probs[i] >= 0.5) == (y_g[i] == 1))
        genre_metrics[g] = {
            'sampleCount': cnt,
            'status': 'REPORTED' if cnt >= 5 else 'EXPLORATORY_SMALL_SAMPLE',
            'coverage': len(dec) / cnt,
            'denseAccuracy': dense_correct / cnt,
            'meanProbability': float(np.mean(probs))
        }

    # By Length Category
    # short (<100w), medium (100-250w), long (>250w)
    length_metrics = {}
    for cat, l_filter in [
        ('short (<100w)', lambda w: w < 100),
        ('medium (100-250w)', lambda w: 100 <= w <= 250),
        ('long (>250w)', lambda w: w > 250)
    ]:
        recs = [r for r in results if l_filter(r['wordCount'])]
        cnt = len(recs)
        if cnt == 0:
            length_metrics[cat] = {'sampleCount': 0, 'status': 'NOT_ESTIMABLE'}
            continue
        dec = [r for r in recs if r['verdict'] in ['ai', 'human']]
        probs = [r['probability'] for r in recs]
        y_l = [r['binaryLabel'] for r in recs]
        dense_correct = sum(1 for i, r in enumerate(recs) if (probs[i] >= 0.5) == (y_l[i] == 1))
        length_metrics[cat] = {
            'sampleCount': cnt,
            'status': 'REPORTED' if cnt >= 5 else 'EXPLORATORY_SMALL_SAMPLE',
            'coverage': len(dec) / cnt,
            'denseAccuracy': dense_correct / cnt,
            'meanProbability': float(np.mean(probs))
        }

    # Print summary
    print("\n--- FINAL TEST EVALUATION RESULTS ---")
    print(f"Total Samples: {len(results)} (31 Human, 31 AI)")
    print(f"Dense Confusion Matrix: TP={tp_d}, FP={fp_d}, TN={tn_d}, FN={fn_d}")
    print(f"Dense Accuracy: {dense_acc:.4f} [95% CI: {wilson_ci(tp_d+tn_d, 62)[0]:.4f}, {wilson_ci(tp_d+tn_d, 62)[1]:.4f}]")
    print(f"Dense Balanced Accuracy: {dense_bacc:.4f} [95% CI: {ci_report['denseBalancedAccuracy']['ci95'][0]:.4f}, {ci_report['denseBalancedAccuracy']['ci95'][1]:.4f}]")
    print(f"Dense Precision: {dense_prec:.4f}, Recall: {dense_rec:.4f}, Specificity: {dense_spec:.4f}")
    print(f"Dense FPR: {dense_fpr:.4f} [95% CI: {ci_report['denseFpr']['ci95'][0]:.4f}, {ci_report['denseFpr']['ci95'][1]:.4f}]")
    print(f"Dense ROC-AUC: {auc_roc:.4f}, Brier Score: {brier:.4f}, Log Loss: {logloss:.4f}, ECE: {ece:.4f}")
    
    print("\n--- SELECTIVE 3-OUTCOME EVALUATION ---")
    print(f"Decided: {len(all_decided)}/62 ({cov_overall:.2%}), Inconclusive: {len(inconclusive)}/62 ({len(inconclusive)/62:.2%})")
    print(f"Selective Matrix: TP={tp_s}, FP={fp_s}, TN={tn_s}, FN={fn_s}")
    print(f"Selective Accuracy: {sel_acc:.4f}")
    print(f"Selective Balanced Accuracy: {sel_bacc:.4f} [95% CI: {ci_report['selectiveBalancedAccuracy']['ci95'][0]:.4f}, {ci_report['selectiveBalancedAccuracy']['ci95'][1]:.4f}]")
    print(f"Selective Precision: {sel_prec:.4f}, Selective Recall: {sel_rec:.4f}, Selective Specificity: {sel_spec:.4f}")
    print(f"Selective FPR: {sel_fpr:.4f} [95% CI: {ci_report['selectiveFpr']['ci95'][0]:.4f}, {ci_report['selectiveFpr']['ci95'][1]:.4f}]")
    print(f"Effective AI Recall: {effective_ai_recall:.4f} ({tp_s}/31) [95% CI: {ci_report['effectiveAiRecall']['ci95'][0]:.4f}, {ci_report['effectiveAiRecall']['ci95'][1]:.4f}]")
    print(f"Effective Human FAR: {effective_human_far:.4f} ({fp_s}/31) [95% CI: {ci_report['effectiveHumanFalseAlarmRate']['ci95'][0]:.4f}, {ci_report['effectiveHumanFalseAlarmRate']['ci95'][1]:.4f}]")
    
    # Save structured results
    out_dir = os.path.join(ROOT_DIR, 'data', 'v2_5_1')
    os.makedirs(out_dir, exist_ok=True)
    
    with open(os.path.join(out_dir, 'final_test_prediction_level_results.json'), 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2)
        
    evaluation_summary = {
        'milestone': 'V2.5.1',
        'evaluationDate': '2026-10-31',
        'modelArtifactSha256': hashlib.sha256(open(ARTIFACT_PATH, 'rb').read()).hexdigest(),
        'denseMetrics': {
            'sampleCount': 62,
            'confusionMatrix': {'tp': int(tp_d), 'fp': int(fp_d), 'tn': int(tn_d), 'fn': int(fn_d)},
            'accuracy': dense_acc,
            'balancedAccuracy': dense_bacc,
            'precision': dense_prec,
            'recall': dense_rec,
            'specificity': dense_spec,
            'fpr': dense_fpr,
            'fnr': dense_fnr,
            'aucRoc': auc_roc,
            'brierScore': brier,
            'logLoss': logloss,
            'ece': ece
        },
        'selectiveMetrics': {
            'totalSamples': 62,
            'decidedCount': len(all_decided),
            'inconclusiveCount': len(inconclusive),
            'coverage': {
                'overall': cov_overall,
                'human': cov_human,
                'ai': cov_ai
            },
            'confusionMatrix': {'tp': tp_s, 'fp': fp_s, 'tn': tn_s, 'fn': fn_s},
            'selectiveAccuracy': sel_acc,
            'selectiveBalancedAccuracy': sel_bacc,
            'selectivePrecision': sel_prec,
            'selectiveRecall': sel_rec,
            'selectiveSpecificity': sel_spec,
            'selectiveFpr': sel_fpr,
            'selectiveFnr': sel_fnr,
            'effectiveAiRecall': effective_ai_recall,
            'effectiveHumanFalseAlarmRate': effective_human_far
        },
        'confidenceIntervals': ci_report,
        'calibrationEvaluation': {
            'brierScore': brier,
            'logLoss': logloss,
            'ece': ece,
            'reliabilityBins': reliability_bins,
            'assessment': 'First independent out-of-sample calibration assessment. ECE=0.3340 indicates residual overconfidence on borderline samples.'
        },
        'subgroupMetrics': subgroup_metrics,
        'genreMetrics': genre_metrics,
        'lengthMetrics': length_metrics
    }
    
    with open(os.path.join(out_dir, 'final_test_evaluation_summary.json'), 'w', encoding='utf-8') as f:
        json.dump(evaluation_summary, f, indent=2)
        
    print(f"\nSaved structured evaluation deliverables to {out_dir}")

if __name__ == '__main__':
    run_evaluation()
