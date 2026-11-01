const fs = require('fs');
let c = fs.readFileSync('tests/fixtures/baseline/ruleEngine.baseline.ts', 'utf8');
c = c.replace(/from '\.\.\/\.\.\/types/g, "from '../../../src/types");
c = c.replace(/from '\.\.\/pipeline\//g, "from '../../../src/lib/pipeline/");
fs.writeFileSync('tests/fixtures/baseline/ruleEngine.baseline.ts', c, 'utf8');
console.log('Fixed relative imports in baseline engine.');

