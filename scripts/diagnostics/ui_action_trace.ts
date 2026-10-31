import { defaultAdaptiveCoordinator } from '../../src/lib/intelligence/coordinator';
import { textModelManager } from '../../src/lib/detector/modelManager';

async function testUiAction() {
  console.log('================================================================');
  console.log('UI ACTION TRACE TEST (Testing coordinator + router + engine)');
  console.log('================================================================');

  const testText = `The historical trajectory of parliamentary governance in nineteenth-century Britain was shaped substantially by recurring fiscal crises and popular agitation for electoral reform. As traditional agrarian aristocracies confronted the mounting economic weight of industrial manufacturing centers, legislative debates grew increasingly polarized over tariff policies and franchise extension. Consequently, statutory reforms reflected uneasy compromises between entrenched landed interests and emerging bourgeois reformers.`;

  console.log('Initial textModelManager state:', textModelManager.getState());

  // Test 1: User has NOT consented to server, engine = v2_5_public_beta
  console.log('\n--- SCENARIO 1: First click (userConsentedToServer = false) ---');
  try {
    await defaultAdaptiveCoordinator.analyzeText(testText, {
      preferMode: 'auto',
      userConsentedToServer: false,
      allowServerFallback: true,
      engineId: 'v2_5_public_beta',
    });
    console.log('UNEXPECTED: Analysis succeeded without consent!');
  } catch (err: any) {
    console.log('Expected behavior: Error thrown ->', err.message);
  }

  // Test 2: User consented to server, engine = v2_5_public_beta
  console.log('\n--- SCENARIO 2: After consent modal, engine = v2_5_public_beta ---');
  const resV25 = await defaultAdaptiveCoordinator.analyzeText(testText, {
    preferMode: 'auto',
    userConsentedToServer: true,
    allowServerFallback: true,
    engineId: 'v2_5_public_beta',
  });
  console.log('V2.5 Result:');
  console.log('  mode:', resV25.mode);
  console.log('  modelId:', resV25.modelId);
  console.log('  provider in adaptiveMetadata:', resV25.adaptiveMetadata?.activeProviderId);
  console.log('  aiProbability:', resV25.score.aiProbability);
  console.log('  classification:', resV25.score.classification);

  // Test 3: User consented to server, engine = production_default
  console.log('\n--- SCENARIO 3: User switches to Production Baseline ---');
  const resDefault = await defaultAdaptiveCoordinator.analyzeText(testText, {
    preferMode: 'auto',
    userConsentedToServer: true,
    allowServerFallback: true,
    engineId: 'production_default',
  });
  console.log('Default Result:');
  console.log('  mode:', resDefault.mode);
  console.log('  modelId:', resDefault.modelId);
  console.log('  provider in adaptiveMetadata:', resDefault.adaptiveMetadata?.activeProviderId);
  console.log('  aiProbability:', resDefault.score.aiProbability);
  console.log('  classification:', resDefault.score.classification);

  console.log('\n--- SUMMARY COMPARISON ON SAME TEXT ---');
  console.log(`V2.5 Probability: ${resV25.score.aiProbability} (${resV25.score.classification})`);
  console.log(`Default Probability: ${resDefault.score.aiProbability} (${resDefault.score.classification})`);
  console.log(`Difference: ${Math.abs(resV25.score.aiProbability - resDefault.score.aiProbability).toFixed(3)}`);
}

testUiAction().catch(console.error);

