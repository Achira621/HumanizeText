import json

with open('data/v2_4/model_artifact.json', 'r', encoding='utf-8') as f:
    art = json.load(f)

with open('data/v2_4/final_test_features.json', 'r', encoding='utf-8') as f:
    test_feats = json.load(f)

print("First 5 human test samples probability:")
for it in [x for x in test_feats if x['binaryLabel'] == 0][:5]:
    norm = it['normalizedFeatures']
    margin = art['intercept'] + sum(art['coefficients'][k] * norm[k] for k in art['featureNames'])
    prob = 1.0 / (1.0 + pow(2.718281828, -(art['calibrationParams']['plattA'] * margin + art['calibrationParams']['plattB'])))
    print(f"  {it['sampleId']}: prob={prob:.4f}, margin={margin:.4f}")

print("\nFirst 5 AI test samples probability:")
for it in [x for x in test_feats if x['binaryLabel'] == 1][:5]:
    norm = it['normalizedFeatures']
    margin = art['intercept'] + sum(art['coefficients'][k] * norm[k] for k in art['featureNames'])
    prob = 1.0 / (1.0 + pow(2.718281828, -(art['calibrationParams']['plattA'] * margin + art['calibrationParams']['plattB'])))
    print(f"  {it['sampleId']}: prob={prob:.4f}, margin={margin:.4f}")

