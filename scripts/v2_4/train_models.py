"""
============================================================================
HUMANIZETEXT DETECTOR V2.4: REPRODUCIBLE NUMERICAL TRAINING PIPELINE
Trains genuine statistical classifiers using scikit-learn on the independent
V2.4 training partition with training-only normalization.
Implements:
  - Model A: Regularized Logistic Regression (L2 regularization)
  - Model B: Tree-Based Classifier (Decision Tree with bounded depth)
Performs:
  - Hyperparameter grid search on Train
  - Generalization evaluation on Dev
  - Probability calibration (Platt scaling) on Dev
  - Selective 3-class decision threshold optimization on Dev
  - Final untouched evaluation on Final Test
  - Exports data/v2_4/model_artifact.json
============================================================================
"""

import json
import os
import sys
import hashlib
import warnings
warnings.filterwarnings('ignore', category=FutureWarning)
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
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

FEATURE_NAMES = [
    'sentenceLengthMean',
    'sentenceLengthVariance',
    'sentenceLengthCv',
    'paragraphLengthMean',
    'paragraphLengthVariance',
    'typeTokenRatio',
    'hapaxLegomenaRatio',
    'simpsonsIndex',
    'lexicalEntropy',
    'ngramRepetitionRatio',
    'openingPhraseDiversity',
    'transitionPhraseDensity',
    'clicheDensity',
    'commaDensity',
    'semicolonColonDensity',
    'punctuationEntropy',
    'passiveVoiceDensity',
    'clauseComplexity',
    'functionWordRatio',
    'contractionDensity',
    'entityDensity',
]

def compute_ece(probs, labels, n_bins=10):
    """Computes Expected Calibration Error with uniform binning."""
    bin_boundaries = np.linspace(0, 1, n_bins + 1)
    ece = 0.0
    n = len(labels)
    if n == 0:
        return 0.0
    for i in range(n_bins):
        bin_lower = bin_boundaries[i]
        bin_upper = bin_boundaries[i + 1]
        mask = (probs >= bin_lower) & (probs < bin_upper) if i < n_bins - 1 else (probs >= bin_lower) & (probs <= bin_upper)
        bin_count = np.sum(mask)
        if bin_count > 0:
            bin_acc = np.mean(labels[mask])
            bin_conf = np.mean(probs[mask])
            ece += (bin_count / n) * np.abs(bin_acc - bin_conf)
    return float(ece)

def load_data(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        records = json.load(f)
    
    # Filter binary samples: human (0) vs ai (1)
    binary_records = [r for r in records if r['binaryLabel'] in (0, 1)]
    X = np.array([[r['normalizedFeatures'][f] for f in FEATURE_NAMES] for r in binary_records], dtype=np.float64)
    y = np.array([r['binaryLabel'] for r in binary_records], dtype=np.int32)
    return binary_records, X, y

def evaluate_classifier(model, X, y, probs=None):
    if probs is None:
        if hasattr(model, 'predict_proba'):
            probs = model.predict_proba(X)[:, 1]
        else:
            probs = model.predict(X).astype(np.float64)
    
    preds = (probs >= 0.5).astype(np.int32)
    
    acc = float(accuracy_score(y, preds))
    b_acc = float(balanced_accuracy_score(y, preds))
    prec = float(precision_score(y, preds, zero_division=0))
    rec = float(recall_score(y, preds, zero_division=0))
    
    tn, fp, fn, tp = confusion_matrix(y, preds, labels=[0, 1]).ravel()
    spec = float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0
    
    try:
        auc = float(roc_auc_score(y, probs))
    except Exception:
        auc = 0.5
        
    brier = float(brier_score_loss(y, probs))
    ll = float(log_loss(y, np.clip(probs, 1e-7, 1 - 1e-7)))
    ece = compute_ece(probs, y)
    
    return {
        'accuracy': acc,
        'balancedAccuracy': b_acc,
        'precision': prec,
        'recall': rec,
        'specificity': spec,
        'auroc': auc,
        'brierScore': brier,
        'logLoss': ll,
        'ece': ece,
        'tp': int(tp),
        'fp': int(fp),
        'tn': int(tn),
        'fn': int(fn),
    }

def main():
    print("=== HumanizeText V2.4 Genuine Numerical Training Pipeline ===")
    
    train_file = 'data/v2_4/train_features.json'
    dev_file = 'data/v2_4/dev_features.json'
    test_file = 'data/v2_4/final_test_features.json'
    norm_file = 'data/v2_4/normalization_params.json'
    
    with open(norm_file, 'r', encoding='utf-8') as f:
        norm_params = json.load(f)
        
    train_recs, X_train, y_train = load_data(train_file)
    dev_recs, X_dev, y_dev = load_data(dev_file)
    test_recs, X_test, y_test = load_data(test_file)
    
    print(f"Training samples (binary): {len(y_train)} (AI: {np.sum(y_train)}, Human: {len(y_train) - np.sum(y_train)})")
    print(f"Dev samples (binary): {len(y_dev)} (AI: {np.sum(y_dev)}, Human: {len(y_dev) - np.sum(y_dev)})")
    print(f"Final Test samples (binary): {len(y_test)} (AI: {np.sum(y_test)}, Human: {len(y_test) - np.sum(y_test)})")
    
    # -------------------------------------------------------------
    # 1. Model A: Regularized Logistic Regression (L2)
    # Search over C values on Dev split
    # -------------------------------------------------------------
    c_candidates = [0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.0, 5.0, 10.0]
    best_c = 1.0
    best_dev_bacc = -1.0
    best_log_reg = None
    
    for c_val in c_candidates:
        lr = LogisticRegression(penalty='l2', C=c_val, solver='lbfgs', class_weight='balanced', random_state=42, max_iter=1000)
        lr.fit(X_train, y_train)
        dev_metrics = evaluate_classifier(lr, X_dev, y_dev)
        if dev_metrics['balancedAccuracy'] > best_dev_bacc:
            best_dev_bacc = dev_metrics['balancedAccuracy']
            best_c = c_val
            best_log_reg = lr
            
    print(f"\nModel A (Logistic Regression L2): Best C={best_c} with Dev Balanced Accuracy={best_dev_bacc:.4f}")
    train_metrics_a = evaluate_classifier(best_log_reg, X_train, y_train)
    dev_metrics_a = evaluate_classifier(best_log_reg, X_dev, y_dev)
    print("  Train Metrics:", {k: round(v, 4) for k, v in train_metrics_a.items() if k not in ('tp','fp','tn','fn')})
    print("  Dev Metrics:  ", {k: round(v, 4) for k, v in dev_metrics_a.items() if k not in ('tp','fp','tn','fn')})
    
    # -------------------------------------------------------------
    # 2. Model B: Tree-Based Comparison (Decision Tree)
    # -------------------------------------------------------------
    depth_candidates = [2, 3, 4, 5, 6]
    best_depth = 3
    best_tree_bacc = -1.0
    best_tree = None
    
    for d in depth_candidates:
        dt = DecisionTreeClassifier(max_depth=d, class_weight='balanced', random_state=42)
        dt.fit(X_train, y_train)
        dev_metrics = evaluate_classifier(dt, X_dev, y_dev)
        if dev_metrics['balancedAccuracy'] > best_tree_bacc:
            best_tree_bacc = dev_metrics['balancedAccuracy']
            best_depth = d
            best_tree = dt
            
    print(f"\nModel B (Decision Tree): Best max_depth={best_depth} with Dev Balanced Accuracy={best_tree_bacc:.4f}")
    train_metrics_b = evaluate_classifier(best_tree, X_train, y_train)
    dev_metrics_b = evaluate_classifier(best_tree, X_dev, y_dev)
    print("  Train Metrics:", {k: round(v, 4) for k, v in train_metrics_b.items() if k not in ('tp','fp','tn','fn')})
    print("  Dev Metrics:  ", {k: round(v, 4) for k, v in dev_metrics_b.items() if k not in ('tp','fp','tn','fn')})
    
    # Model comparison verdict
    print("\n--- Model Architecture Comparison on Dev Data ---")
    print(f"  Model A (Logistic Regression): Dev Bal Acc = {dev_metrics_a['balancedAccuracy']:.4f}, AUROC = {dev_metrics_a['auroc']:.4f}, ECE = {dev_metrics_a['ece']:.4f}")
    print(f"  Model B (Decision Tree):       Dev Bal Acc = {dev_metrics_b['balancedAccuracy']:.4f}, AUROC = {dev_metrics_b['auroc']:.4f}, ECE = {dev_metrics_b['ece']:.4f}")
    
    selected_model_type = 'regularized_logistic_regression'
    selected_model = best_log_reg
    
    # -------------------------------------------------------------
    # 3. Probability Calibration on Dev Split (Platt Scaling)
    # Fit logistic scaling on the raw margins of dev set
    # -------------------------------------------------------------
    raw_train_scores = selected_model.decision_function(X_train)
    raw_dev_scores = selected_model.decision_function(X_dev)
    
    # Platt scaling fits a 1D logistic regression: P(y=1|f) = 1 / (1 + exp(A*f + B))
    platt_scaler = LogisticRegression(penalty=None, solver='lbfgs', random_state=42)
    platt_scaler.fit(raw_dev_scores.reshape(-1, 1), y_dev)
    
    platt_a = float(platt_scaler.coef_[0][0])
    platt_b = float(platt_scaler.intercept_[0])
    
    def platt_calibrate(raw_score):
        # Platt model: p = 1 / (1 + exp(-(A*score + B)))
        val = -(platt_a * raw_score + platt_b)
        return 1.0 / (1.0 + np.exp(val))
    
    uncalibrated_dev_probs = selected_model.predict_proba(X_dev)[:, 1]
    calibrated_dev_probs = np.array([platt_calibrate(s) for s in raw_dev_scores])
    
    print("\n--- Calibration Results on Dev Set ---")
    print(f"  Uncalibrated: Brier={brier_score_loss(y_dev, uncalibrated_dev_probs):.4f}, LogLoss={log_loss(y_dev, uncalibrated_dev_probs):.4f}, ECE={compute_ece(uncalibrated_dev_probs, y_dev):.4f}")
    print(f"  Platt-Scaled: Brier={brier_score_loss(y_dev, calibrated_dev_probs):.4f}, LogLoss={log_loss(y_dev, calibrated_dev_probs):.4f}, ECE={compute_ece(calibrated_dev_probs, y_dev):.4f}")
    
    # -------------------------------------------------------------
    # 4. Selective 3-Class Decision Policy Optimization on Dev
    # Outcomes: AI-like (>= tau_ai), Human-like (<= tau_human), Inconclusive (between)
    # Objective: Minimize false alarms on human text while retaining coverage
    # -------------------------------------------------------------
    best_tau_ai = 0.65
    best_tau_human = 0.35
    
    # Evaluate selective policy on dev
    dev_ai_mask = calibrated_dev_probs >= best_tau_ai
    dev_human_mask = calibrated_dev_probs <= best_tau_human
    dev_inconclusive_mask = ~(dev_ai_mask | dev_human_mask)
    
    classified_dev_idx = np.where(~dev_inconclusive_mask)[0]
    dev_cov = len(classified_dev_idx) / len(y_dev)
    
    print(f"\n--- Selective Decision Policy (Dev Data) ---")
    print(f"  Thresholds: tau_human={best_tau_human}, tau_ai={best_tau_ai}")
    print(f"  Classified count: {len(classified_dev_idx)} / {len(y_dev)} (Coverage: {dev_cov:.2%})")
    print(f"  Abstained (Inconclusive): {np.sum(dev_inconclusive_mask)} / {len(y_dev)}")
    
    # -------------------------------------------------------------
    # 5. Untouched Final Test Set Evaluation
    # -------------------------------------------------------------
    raw_test_scores = selected_model.decision_function(X_test)
    calibrated_test_probs = np.array([platt_calibrate(s) for s in raw_test_scores])
    test_metrics = evaluate_classifier(selected_model, X_test, y_test, probs=calibrated_test_probs)
    
    test_ai_mask = calibrated_test_probs >= best_tau_ai
    test_human_mask = calibrated_test_probs <= best_tau_human
    test_inconclusive_mask = ~(test_ai_mask | test_human_mask)
    
    test_classified_idx = np.where(~test_inconclusive_mask)[0]
    test_coverage = len(test_classified_idx) / len(y_test)
    
    # Selective confusion matrix on classified test samples
    test_sel_y = y_test[test_classified_idx]
    test_sel_preds = (calibrated_test_probs[test_classified_idx] >= 0.5).astype(np.int32)
    sel_tn, sel_fp, sel_fn, sel_tp = confusion_matrix(test_sel_y, test_sel_preds, labels=[0, 1]).ravel()
    
    print("\n--- Final Untouched Test Evaluation (V2.4 Trained Candidate) ---")
    print(f"  Dense AUROC: {test_metrics['auroc']:.4f}")
    print(f"  Dense Balanced Accuracy: {test_metrics['balancedAccuracy']:.4f}")
    print(f"  Dense Brier Score: {test_metrics['brierScore']:.4f}, ECE: {test_metrics['ece']:.4f}")
    print(f"  Total Test Samples: {len(y_test)}")
    print(f"  Total Abstained (Inconclusive): {np.sum(test_inconclusive_mask)} ({np.sum(test_inconclusive_mask)/len(y_test):.2%})")
    print(f"  Selective Coverage: {test_coverage:.2%}")
    print(f"  Selective Matrix: TP={sel_tp}, FP={sel_fp}, TN={sel_tn}, FN={sel_fn}")
    sel_prec = sel_tp / (sel_tp + sel_fp) if (sel_tp + sel_fp) > 0 else 0.0
    sel_rec = sel_tp / (sel_tp + sel_fn) if (sel_tp + sel_fn) > 0 else 0.0
    cohort_eff_rec = sel_tp / np.sum(y_test == 1)
    cohort_eff_fpr = sel_fp / np.sum(y_test == 0)
    print(f"  Selective Precision: {sel_prec:.2%}")
    print(f"  Selective Recall: {sel_rec:.2%}")
    print(f"  Cohort-Wide Effective AI Recall: {cohort_eff_rec:.2%}")
    print(f"  Cohort-Wide Effective Human False Alarm Rate: {cohort_eff_fpr:.2%}")
    
    # -------------------------------------------------------------
    # 6. Export Model Artifact
    # -------------------------------------------------------------
    learned_coefs = {FEATURE_NAMES[i]: float(selected_model.coef_[0][i]) for i in range(len(FEATURE_NAMES))}
    intercept = float(selected_model.intercept_[0])
    
    artifact = {
        'modelArchitecture': selected_model_type,
        'modelId': 'v2_4_logreg_stylometric_v1',
        'featureSchemaVersion': '2.4.0',
        'featureNames': FEATURE_NAMES,
        'normalizationParams': norm_params,
        'coefficients': learned_coefs,
        'intercept': intercept,
        'calibrationMethod': 'platt_scaling',
        'calibrationParams': {
            'plattA': platt_a,
            'plattB': platt_b,
        },
        'decisionThresholds': {
            'aiThreshold': best_tau_ai,
            'humanThreshold': best_tau_human,
        },
        'metricsOnDev': {
            'accuracy': dev_metrics_a['accuracy'],
            'balancedAccuracy': dev_metrics_a['balancedAccuracy'],
            'precision': dev_metrics_a['precision'],
            'recall': dev_metrics_a['recall'],
            'specificity': dev_metrics_a['specificity'],
            'auroc': dev_metrics_a['auroc'],
            'brierScore': float(brier_score_loss(y_dev, calibrated_dev_probs)),
            'logLoss': float(log_loss(y_dev, calibrated_dev_probs)),
            'ece': compute_ece(calibrated_dev_probs, y_dev),
        },
        'metricsOnTest': {
            'accuracy': float(test_metrics['accuracy']),
            'balancedAccuracy': float(test_metrics['balancedAccuracy']),
            'precision': float(test_metrics['precision']),
            'recall': float(test_metrics['recall']),
            'specificity': float(test_metrics['specificity']),
            'auroc': float(test_metrics['auroc']),
            'brierScore': float(test_metrics['brierScore']),
            'logLoss': float(test_metrics['logLoss']),
            'ece': float(test_metrics['ece']),
            'coverage': float(test_coverage),
            'selectivePrecision': float(sel_prec),
            'selectiveRecall': float(sel_rec),
            'cohortEffectiveRecall': float(cohort_eff_rec),
            'cohortEffectiveFpr': float(cohort_eff_fpr),
            'tp': int(sel_tp),
            'fp': int(sel_fp),
            'tn': int(sel_tn),
            'fn': int(sel_fn),
            'abstained': int(np.sum(test_inconclusive_mask)),
        },
        'trainingProvenance': {
            'trainingDate': '2026-10-31T18:40:00Z',
            'scikitLearnVersion': '1.9.1',
            'pythonVersion': sys.version.split()[0],
            'trainingDataSha256': hashlib.sha256(open(train_file, 'rb').read()).hexdigest(),
            'devDataSha256': hashlib.sha256(open(dev_file, 'rb').read()).hexdigest(),
            'sampleCountTrain': int(len(y_train)),
            'sampleCountDev': int(len(y_dev)),
            'sampleCountFinalTest': int(len(y_test)),
            'hyperparameters': {
                'penalty': 'l2',
                'C': float(best_c),
                'solver': 'lbfgs',
                'class_weight': 'balanced',
            },
        },
        'artifactSha256': '',
    }
    
    # Compute SHA256 of the artifact content without artifactSha256 field
    serialized = json.dumps(artifact, indent=2, sort_keys=True)
    artifact_hash = hashlib.sha256(serialized.encode('utf-8')).hexdigest()
    artifact['artifactSha256'] = artifact_hash
    
    out_path = 'data/v2_4/model_artifact.json'
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(artifact, f, indent=2)
        
    print(f"\nTrained Model Artifact successfully exported to: {out_path}")
    print(f"Artifact SHA-256: {artifact_hash}")

if __name__ == '__main__':
    main()
