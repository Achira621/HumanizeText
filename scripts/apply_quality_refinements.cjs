const fs = require('fs');
const path = require('path');

const ruleEnginePath = path.resolve('src/lib/humanizer/ruleEngine.ts');
let code = fs.readFileSync(ruleEnginePath, 'utf8');

// 1. Fix played a ... role in pool to be number-invariant
const oldPlayedPool = `  {\n    pattern: /\\bplayed a (?:pivotal|crucial|vital|key|significant) role in\\b/gi,\n    pool: [\n      'was central to',\n      'heavily impacted',\n      'played a key part in',\n      'was fundamental to',\n      'significantly influenced',\n    ],\n    reason: 'Replaced past overused "played a pivotal role"',\n    category: 'phrasing',\n    modes: ['natural', 'conversational', 'concise', 'flow', 'formal'],\n  },`;

const newPlayedPool = `  {\n    pattern: /\\bplayed a (?:pivotal|crucial|vital|key|significant) role in\\b/gi,\n    pool: [\n      'proved central to',\n      'heavily impacted',\n      'played a key part in',\n      'proved fundamental to',\n      'significantly influenced',\n    ],\n    reason: 'Replaced past overused "played a pivotal role"',\n    category: 'phrasing',\n    modes: ['natural', 'conversational', 'concise', 'flow', 'formal'],\n  },`;

if (!code.includes(oldPlayedPool)) {
  console.error('Could not find oldPlayedPool');
} else {
  code = code.replace(oldPlayedPool, newPlayedPool);
  console.log('Replaced oldPlayedPool successfully.');
}

// 2. Remove redundant line 171 delve into rule
const oldLine171 = `  {\n    pattern: /\\bdelve into\\s*/gi,\n    pool: ['examine ', 'analyze ', 'investigate ', 'explore '],\n    reason: 'Replaced AI cliché "delve into"',\n    category: 'phrasing',\n    modes: ['natural', 'conversational', 'concise', 'flow', 'formal'],\n  },\n`;

if (code.includes(oldLine171)) {
  code = code.replace(oldLine171, '');
  console.log('Removed duplicate line 171 delve into rule.');
} else {
  console.log('Line 171 not matched as exact block; checking variations.');
}

// 3. Add negative lookahead guard to delves/delve/delved into
const oldDelveRules = `  {\n    pattern: /\\bdelves into\\b/gi,\n    pool: ['examines', 'explores', 'investigates', 'analyzes', 'studies'],\n    reason: 'Replaced singular AI cliché "delves into"',\n    category: 'phrasing',\n    modes: ['natural', 'formal', 'concise', 'flow', 'conversational'],\n  },\n  {\n    pattern: /\\bdelve into\\b/gi,\n    pool: ['examine', 'explore', 'investigate', 'analyze', 'study'],\n    reason: 'Replaced base AI cliché "delve into"',\n    category: 'phrasing',\n    modes: ['natural', 'formal', 'concise', 'flow', 'conversational'],\n  },\n  {\n    pattern: /\\bdelved into\\b/gi,\n    pool: ['examined', 'explored', 'investigated', 'analyzed', 'studied'],\n    reason: 'Replaced past AI cliché "delved into"',\n    category: 'phrasing',\n    modes: ['natural', 'formal', 'concise', 'flow', 'conversational'],\n  },`;

const newDelveRules = `  {\n    pattern: /\\bdelves into\\b(?!\\s+(?:pockets?|bags?|backpacks?|purses?|drawers?|chests?|boxes?|hearty|bowls?|plates?|dishes|food|meals?|stew|soup|supper|dinner|lunch|caverns?|caves?)\\b)/gi,\n    pool: ['examines', 'explores', 'investigates', 'analyzes', 'studies'],\n    reason: 'Replaced singular AI cliché "delves into"',\n    category: 'phrasing',\n    modes: ['natural', 'formal', 'concise', 'flow', 'conversational'],\n  },\n  {\n    pattern: /\\bdelve into\\b(?!\\s+(?:pockets?|bags?|backpacks?|purses?|drawers?|chests?|boxes?|hearty|bowls?|plates?|dishes|food|meals?|stew|soup|supper|dinner|lunch|caverns?|caves?)\\b)/gi,\n    pool: ['examine', 'explore', 'investigate', 'analyze', 'study'],\n    reason: 'Replaced base AI cliché "delve into"',\n    category: 'phrasing',\n    modes: ['natural', 'formal', 'concise', 'flow', 'conversational'],\n  },\n  {\n    pattern: /\\bdelved into\\b(?!\\s+(?:pockets?|bags?|backpacks?|purses?|drawers?|chests?|boxes?|hearty|bowls?|plates?|dishes|food|meals?|stew|soup|supper|dinner|lunch|caverns?|caves?)\\b)/gi,\n    pool: ['examined', 'explored', 'investigated', 'analyzed', 'studied'],\n    reason: 'Replaced past AI cliché "delved into"',\n    category: 'phrasing',\n    modes: ['natural', 'formal', 'concise', 'flow', 'conversational'],\n  },`;

if (!code.includes(oldDelveRules)) {
  console.error('Could not find oldDelveRules');
} else {
  code = code.replace(oldDelveRules, newDelveRules);
  console.log('Replaced oldDelveRules with guarded rules successfully.');
}

fs.writeFileSync(ruleEnginePath, code, 'utf8');
console.log('Done applying quality refinements.');

