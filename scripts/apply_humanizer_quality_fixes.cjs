const fs = require('fs');
const path = require('path');

const ruleEnginePath = path.resolve('src/lib/humanizer/ruleEngine.ts');
let code = fs.readFileSync(ruleEnginePath, 'utf8');

// 1. Furthermore & Ultimately in first CLICHE_POOLS
code = code.replace(
  `  {\n    pattern: /\\bfurthermore,?\\s*/gi,\n    pool: ['Also, ', 'Plus, ', 'Beyond that, ', 'Along with this, '],`,
  `  {\n    pattern: /\\bfurthermore,?\\s*/gi,\n    pool: ['In addition, ', 'Additionally, ', 'Beyond this, ', 'Along with this, '],`
);

code = code.replace(
  `  {\n    pattern: /\\bultimately,?\\s*/gi,\n    pool: ['In the end, ', 'At the end of the day, ', 'When all is said and done, '],`,
  `  {\n    pattern: /\\bultimately,?\\s*/gi,\n    pool: ['In the end, ', 'Eventually, ', 'Over time, '],`
);

// 2. Add past tense to serves as a testament to
code = code.replace(
  `  {\n    pattern: /\\b(?:serves as a testament to|stands as a testament to|is a testament to)\\s*/gi,\n    pool: ['demonstrates ', 'highlights ', 'proves ', 'attests to '],\n    reason: 'Replaced AI cliché "testament to"',\n    category: 'phrasing',\n    modes: ['natural', 'conversational', 'concise', 'flow', 'formal'],\n  },`,
  `  {\n    pattern: /\\b(?:serves as a testament to|stands as a testament to|is a testament to)\\s*/gi,\n    pool: ['demonstrates ', 'highlights ', 'attests to ', 'provides evidence of '],\n    reason: 'Replaced AI cliché "testament to"',\n    category: 'phrasing',\n    modes: ['natural', 'conversational', 'concise', 'flow', 'formal'],\n  },\n  {\n    pattern: /\\b(?:served as a testament to|stood as a testament to|was a testament to)\\s*/gi,\n    pool: ['demonstrated ', 'highlighted ', 'attested to ', 'provided evidence of '],\n    reason: 'Replaced past AI cliché "served as a testament to"',\n    category: 'phrasing',\n    modes: ['natural', 'conversational', 'concise', 'flow', 'formal'],\n  },`
);

// 3. Fix plays? a pivotal role in with plural, singular, and past tense concord
code = code.replace(
  `  {\n    pattern: /\\bplays? a (?:pivotal|crucial|vital|key|significant) role in\\b/gi,\n    pool: [\n      'makes a big difference in',\n      'is key to',\n      'really matters for',\n      'heavily impacts',\n      'is central to',\n    ],\n    reason: 'Replaced overused "plays a pivotal role"',\n    category: 'phrasing',\n    modes: ['natural', 'conversational', 'concise', 'flow', 'formal'],\n  },`,
  `  {\n    pattern: /\\bplay a (?:pivotal|crucial|vital|key|significant) role in\\b/gi,\n    pool: [\n      'are central to',\n      'heavily impact',\n      'play a key part in',\n      'are fundamental to',\n      'significantly influence',\n    ],\n    reason: 'Replaced plural overused "play a pivotal role"',\n    category: 'phrasing',\n    modes: ['natural', 'conversational', 'concise', 'flow', 'formal'],\n  },\n  {\n    pattern: /\\bplays a (?:pivotal|crucial|vital|key|significant) role in\\b/gi,\n    pool: [\n      'is central to',\n      'heavily impacts',\n      'plays a key part in',\n      'is fundamental to',\n      'significantly influences',\n    ],\n    reason: 'Replaced singular overused "plays a pivotal role"',\n    category: 'phrasing',\n    modes: ['natural', 'conversational', 'concise', 'flow', 'formal'],\n  },\n  {\n    pattern: /\\bplayed a (?:pivotal|crucial|vital|key|significant) role in\\b/gi,\n    pool: [\n      'was central to',\n      'heavily impacted',\n      'played a key part in',\n      'was fundamental to',\n      'significantly influenced',\n    ],\n    reason: 'Replaced past overused "played a pivotal role"',\n    category: 'phrasing',\n    modes: ['natural', 'conversational', 'concise', 'flow', 'formal'],\n  },`
);

// 4. Fix delve(?:s)? into with singular, plural, and past conjugation
code = code.replace(
  `  {\n    pattern: /\\bdelve(?:s)? into\\b/gi,\n    pool: ['examine', 'explore', 'look at', 'dig into', 'unpack', 'investigate', 'break down', 'analyze'],\n    reason: 'Replaced top-ranked AI cliché "delve into"',\n    category: 'phrasing',\n    modes: ['natural', 'formal', 'concise', 'flow', 'conversational'],\n  },`,
  `  {\n    pattern: /\\bdelves into\\b/gi,\n    pool: ['examines', 'explores', 'investigates', 'analyzes', 'studies'],\n    reason: 'Replaced singular AI cliché "delves into"',\n    category: 'phrasing',\n    modes: ['natural', 'formal', 'concise', 'flow', 'conversational'],\n  },\n  {\n    pattern: /\\bdelve into\\b/gi,\n    pool: ['examine', 'explore', 'investigate', 'analyze', 'study'],\n    reason: 'Replaced base AI cliché "delve into"',\n    category: 'phrasing',\n    modes: ['natural', 'formal', 'concise', 'flow', 'conversational'],\n  },\n  {\n    pattern: /\\bdelved into\\b/gi,\n    pool: ['examined', 'explored', 'investigated', 'analyzed', 'studied'],\n    reason: 'Replaced past AI cliché "delved into"',\n    category: 'phrasing',\n    modes: ['natural', 'formal', 'concise', 'flow', 'conversational'],\n  },`
);

// 5. Fix serves? as a testament to (lines 873+)
code = code.replace(
  `  {\n    pattern: /\\bserves?\\s+as\\s+a\\s+testament\\s+to\\b/gi,\n    pool: ['reflects', 'proves', 'shows', 'demonstrates', 'speaks to'],\n    reason: 'Replaced formulaic "serves as a testament to"',\n    category: 'phrasing',\n    modes: ['natural', 'formal', 'concise', 'flow', 'conversational'],\n  },`,
  `  {\n    pattern: /\\bserves?\\s+as\\s+a\\s+testament\\s+to\\b/gi,\n    pool: ['reflects', 'shows', 'demonstrates', 'speaks to', 'attests to'],\n    reason: 'Replaced formulaic "serves as a testament to"',\n    category: 'phrasing',\n    modes: ['natural', 'formal', 'concise', 'flow', 'conversational'],\n  },\n  {\n    pattern: /\\bserv(?:ed|t)\\s+as\\s+a\\s+testament\\s+to\\b/gi,\n    pool: ['demonstrated', 'reflected', 'attested to', 'showed', 'stood as evidence of'],\n    reason: 'Replaced past formulaic "served as a testament to"',\n    category: 'phrasing',\n    modes: ['natural', 'formal', 'concise', 'flow', 'conversational'],\n  },`
);

// 6. Fix testament to pool from 'proof of' to 'evidence of'
code = code.replace(
  `  {\n    pattern: /\\btestament to\\b/gi,\n    pool: ['proof of', 'evidence of', 'sign of', 'reflection of', 'indicator of'],`,
  `  {\n    pattern: /\\btestament to\\b/gi,\n    pool: ['evidence of', 'reflection of', 'sign of', 'mark of', 'indicator of'],`
);

// 7. Fix furthermore and moreover in second pool (lines 1288+)
code = code.replace(
  `  {\n    pattern: /\\bfurthermore,?\\s*/gi,\n    pool: ['Also, ', 'On top of that, ', 'Beyond this, ', 'What\\'s more, ', 'Plus, '],`,
  `  {\n    pattern: /\\bfurthermore,?\\s*/gi,\n    pool: ['In addition, ', 'Additionally, ', 'Beyond this, ', 'Along with this, '],`
);

code = code.replace(
  `  {\n    pattern: /\\bmoreover,?\\s*/gi,\n    pool: ['Also, ', 'On top of that, ', 'Beyond that, ', 'Plus, ', 'What\\'s more, '],`,
  `  {\n    pattern: /\\bmoreover,?\\s*/gi,\n    pool: ['In addition, ', 'Additionally, ', 'Beyond that, ', 'What\\'s more, '],`
);

// 8. In HEDGES, remove 'Here\'s the thing: ', 'The short answer: '
code = code.replace(
  `const HEDGES = [\n  'In practice, ', 'To be fair, ', 'Generally speaking, ', 'That said, ',\n  'Admittedly, ', 'As a rule, ', 'For the most part, ', 'In most cases, ',\n  'Broadly speaking, ', 'By and large, ', 'As things stand, ',\n  'Here\\'s the thing: ', 'Worth noting: ', 'The short answer: ',\n];`,
  `const HEDGES = [\n  'In practice, ', 'To be fair, ', 'Generally speaking, ', 'That said, ',\n  'Admittedly, ', 'As a rule, ', 'For the most part, ', 'In most cases, ',\n  'Broadly speaking, ', 'By and large, ', 'As things stand, ',\n  'Worth noting: ',\n];`
);

// 9. In varyMonotonousStarters, remove 'Meanwhile, the' and 'In addition, the'
code = code.replace(
  `        const demonstrative = plural ? 'These' : 'This';\n        const startersPool = [demonstrative, 'Meanwhile, the', 'In addition, the', 'At the same time, the'];\n        const chosen = pick(startersPool, i);`,
  `        const demonstrative = plural ? 'These' : 'This';\n        const startersPool = plural ? ['These', 'Such', 'The'] : ['This', 'Such a', 'The'];\n        const chosen = pick(startersPool, i);`
);

// 10. In transformBlockText, guard maybeAddHedge so it NEVER runs in academic/formal modes
code = code.replace(
  `        // 3d. Add hedges for natural/conversational modes (balanced, strong, extensive only)\n        if ((mode === 'natural' || mode === 'conversational') && (strength === 'balanced' || strength === 'strong' || strength === 'extensive')) {\n          sentences = sentences.map((s, i) => maybeAddHedge(s, i, sentences.length, mode === 'conversational', consistencyTracker));\n        }`,
  `        // 3d. Add hedges strictly for conversational mode (balanced, strong, extensive only; never academic/formal)\n        if (!isAcademic && mode === 'conversational' && (strength === 'balanced' || strength === 'strong' || strength === 'extensive')) {\n          sentences = sentences.map((s, i) => maybeAddHedge(s, i, sentences.length, true, consistencyTracker));\n        }`
);

fs.writeFileSync(ruleEnginePath, code, 'utf8');
console.log('Applied quality fixes to ruleEngine.ts successfully.');

