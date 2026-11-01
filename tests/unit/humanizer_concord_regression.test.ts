import { describe, it, expect } from 'vitest';
import { RuleBasedHumanizerEngine } from '../../src/lib/humanizer/ruleEngine';

describe('Humanizer 2.0: Comprehensive Concord & Register Regression Suite', () => {
  const engine = new RuleBasedHumanizerEngine();

  // 1. Singular Subjects
  it('correctly conjugates singular subjects in present and past tense', () => {
    const presentSingular = 'The algorithm plays a pivotal role in cluster stability.';
    const resPres = engine.processSync(presentSingular, { mode: 'formal' });
    expect(resPres.improvedText).not.toMatch(/\bare central\b/i);
    expect(resPres.improvedText).not.toMatch(/\bmakes a big difference\b/i);
    expect(resPres.improvedText).toMatch(/\bis central to cluster stability\b/i);

    const pastSingular = 'The discovery played a pivotal role in twentieth-century physics.';
    const resPast = engine.processSync(pastSingular, { mode: 'formal' });
    expect(resPast.improvedText).not.toMatch(/\bwere central to\b/i);
    expect(resPast.improvedText).not.toMatch(/\bwas central to\b/i);
    expect(resPast.improvedText).toMatch(/\bproved central to\b/i);
  });

  // 2. Plural Subjects
  it('correctly conjugates plural subjects without singular agreement bugs', () => {
    const presentPlural = 'Central banks play a pivotal role in curbing inflationary pressures.';
    const resPres = engine.processSync(presentPlural, { mode: 'formal' });
    expect(resPres.improvedText).not.toMatch(/\bmakes a big difference\b/i);
    expect(resPres.improvedText).not.toMatch(/\bis central to\b/i);
    expect(resPres.improvedText).toMatch(/\bare central to curbing\b/i);

    const pastPlural = 'Cybernetic augmentations played a pivotal role in gang hierarchy.';
    const resPast = engine.processSync(pastPlural, { mode: 'natural' });
    // Crucial bug fix check: must NOT produce "augmentations was central to"
    expect(resPast.improvedText).not.toMatch(/\baugmentations was central to\b/i);
    expect(resPast.improvedText).toMatch(/\baugmentations proved central to gang hierarchy\b/i);
  });

  // 3. Collective Nouns
  it('respects collective noun agreement', () => {
    const text = 'Our engineering leadership delves into root cause telemetry to prevent recurrence.';
    const res = engine.processSync(text, { mode: 'natural' });
    // Must NOT produce "leadership examine"
    expect(res.improvedText).not.toMatch(/\bleadership examine\b/i);
    expect(res.improvedText).toMatch(/\bleadership examines root cause telemetry\b/i);

    const committeeText = 'The audit committee delves into billing discrepancies every quarter.';
    const resComm = engine.processSync(committeeText, { mode: 'formal' });
    expect(resComm.improvedText).toMatch(/\bcommittee examines billing discrepancies\b/i);
  });

  // 4. Present Tense Concord (delve vs delves)
  it('differentiates base and 3rd person singular in present tense', () => {
    const singular = 'The lead researcher delves into non-convex optimization landscapes.';
    const resSingular = engine.processSync(singular, { mode: 'formal' });
    expect(resSingular.improvedText).not.toMatch(/\bresearcher examine\b/i);
    expect(resSingular.improvedText).toMatch(/\bresearcher examines\b/i);

    const plural = 'Researchers delve into non-convex optimization landscapes.';
    const resPlural = engine.processSync(plural, { mode: 'formal' });
    expect(resPlural.improvedText).not.toMatch(/\bResearchers examines\b/i);
    expect(resPlural.improvedText).toMatch(/\bResearchers examine\b/i);
  });

  // 5. Past Tense Concord (delved)
  it('correctly handles past tense delved into and served as a testament to', () => {
    const text = 'The investigators delved into financial transaction logs.';
    const res = engine.processSync(text, { mode: 'formal' });
    expect(res.improvedText).toMatch(/\binvestigators examined financial transaction logs\b/i);

    const pastTestament = 'The towering cathedral served as a testament to medieval architectural prowess.';
    const resTest = engine.processSync(pastTestament, { mode: 'formal' });
    // Must NOT produce "served as a proof of"
    expect(resTest.improvedText).not.toMatch(/\bserv(?:ed|es) as a proof of\b/i);
    expect(resTest.improvedText).toMatch(/\bcathedral demonstrated medieval architectural prowess\b/i);
  });

  // 6. Technical Vocabulary & Invariant Preservation
  it('preserves technical vocabulary and RFC-grade transitions', () => {
    const techText =
      'Clients initiating an authorization code grant must generate an ephemeral cryptographically random code_verifier with a minimum entropy of 43 octets. The code_challenge is computed as code_challenge = BASE64URL-ENCODE(SHA256(ASCII(code_verifier))) when code_challenge_method is set to S256.';
    const res = engine.processSync(techText, { mode: 'formal', freezeQuotes: true });
    expect(res.improvedText).toContain('code_verifier');
    expect(res.improvedText).toContain('code_challenge');
    expect(res.improvedText).toContain('BASE64URL-ENCODE(SHA256(ASCII(code_verifier)))');
    expect(res.improvedText).toContain('S256');
    expect(res.improvedText).toContain('43 octets');

    const raftText = 'Furthermore, each server maintains a persistent currentTerm integer and votedFor candidateId in stable storage.';
    const resRaft = engine.processSync(raftText, { mode: 'formal' });
    // Formal mode should NOT start with conversational "Also,"
    expect(resRaft.improvedText).not.toMatch(/^Also,\s+/i);
  });

  // 7. Sensory and Metaphorical Language
  it('preserves physical and culinary uses of delve into without absurd literal substitutions', () => {
    // Critical bug fix: travelers dining in a tavern
    const foodText = 'In the warm tavern, weary travelers delved into hearty bowls of stew beside the hearth.';
    const resFood = engine.processSync(foodText, { mode: 'natural' });
    // Must NOT replace with "examined hearty bowls of stew"
    expect(resFood.improvedText).not.toMatch(/examined hearty bowls of stew/i);
    expect(resFood.improvedText).not.toMatch(/analyzed hearty bowls of stew/i);
    expect(resFood.improvedText).toContain('hearty bowls of stew');

    // Physical pocket
    const pocketText = 'The detective delved into his pocket for the brass key.';
    const resPocket = engine.processSync(pocketText, { mode: 'natural' });
    expect(resPocket.improvedText).not.toMatch(/examined his pocket for the brass key/i);
    expect(resPocket.improvedText).toContain('pocket for the brass key');
  });

  // 8. Academic Prose
  it('preserves scholarly register without injecting casual hedges or elementary colloquialisms', () => {
    const academicText =
      'In a cohort of 1,240 patients aged 55 to 74 years, serum troponin T concentrations exceeding 14 ng/L were associated with a 2.4-fold increase in 30-day cardiovascular events [1]. However, renal insufficiency significantly confounded baseline troponin levels.';
    const res = engine.processSync(academicText, { mode: 'formal' });
    expect(res.improvedText).not.toMatch(/Here's the thing:/i);
    expect(res.improvedText).not.toMatch(/Thing is,/i);
    expect(res.improvedText).not.toMatch(/Honestly,/i);
    expect(res.improvedText).toContain('[1]');
    expect(res.improvedText).toContain('14 ng/L');
    expect(res.improvedText).toContain('2.4-fold');
  });

  // 9. Conversational Writing
  it('handles conversational tone with natural rhythm and optional contractions', () => {
    const convText = 'Hey guys, are we still on for Mount Tammany this Saturday? The weather forecast is looking pretty sunny with a high of 68 degrees.';
    const res = engine.processSync(convText, { mode: 'conversational', smartContractions: true });
    expect(res.improvedText).toContain('Mount Tammany');
    expect(res.improvedText).toContain('68 degrees');
    expect(res.improvedText).not.toMatch(/Meanwhile, the/i);
  });
});

