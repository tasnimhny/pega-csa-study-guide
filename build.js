// Merges content/*.json into docs/data.js for the static site.
const fs = require('fs');
const path = require('path');

const ORDER = [
  // Blueprint order (PEGACPSA25V1)
  'case-management',
  'data-integration',
  'security',
  'devops',
  'user-experience',
  'app-development',
  'insights',
  'genai',
];

const dir = path.join(__dirname, 'content');
const domains = ORDER.map((id) => {
  const file = path.join(dir, `${id}.json`);
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}`);
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  d.questions.forEach((q) => {
    if (!q.answer.length) throw new Error(`${q.id}: no answer`);
    q.answer.forEach((a) => {
      if (a < 0 || a >= q.options.length) throw new Error(`${q.id}: answer ${a} out of range`);
    });
    if (q.objective < 0 || q.objective >= d.objectives.length) throw new Error(`${q.id}: bad objective`);
  });
  return d;
});

const out = path.join(__dirname, 'docs', 'data.js');
fs.writeFileSync(out, `window.CSA_DATA = ${JSON.stringify({ domains })};\n`);
const total = domains.reduce((n, d) => n + d.questions.length, 0);
console.log(`Wrote ${out}: ${domains.length} domains, ${total} questions`);
domains.forEach((d) => console.log(`  ${d.title} (${d.weight}%): ${d.objectives.length} objectives, ${d.questions.length} questions`));
