const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

async function main() {
  const testPath = path.join(process.cwd(), 'data', 'unlabeled_test.json');
  if (!fs.existsSync(testPath)) {
    console.error('Missing data/unlabeled_test.json — create with an array of queries');
    process.exit(1);
  }

  const queries = JSON.parse(fs.readFileSync(testPath, 'utf8'));

  // Dynamically import the ES module recommender so this script can run under
  // a CommonJS Node project setup.
  const recommenderPath = path.join(process.cwd(), 'lib', 'recommender.js');
  const mod = await import(pathToFileURL(recommenderPath).href);
  const AssessmentRecommender = mod.AssessmentRecommender || mod.default;

  const recommender = new AssessmentRecommender(process.env.GEMINI_API_KEY);
  if (typeof recommender.initialize === 'function') await recommender.initialize();

  const rows = [];
  for (const q of queries) {
    const recs = await recommender.getRecommendations(q, 10);
    const urls = recs.map(r => r.assessment_url || r.assessment_url || '');
    rows.push([q, ...urls]);
  }

  const header = ['Query', 'Recommendation_1','Recommendation_2','Recommendation_3','Recommendation_4','Recommendation_5','Recommendation_6','Recommendation_7','Recommendation_8','Recommendation_9','Recommendation_10'];
  const csvLines = [header.join(',')];
  for (const r of rows) {
    const escaped = r.map(cell => '"' + String(cell).replace(/"/g, '""') + '"');
    while (escaped.length < 11) escaped.push('""');
    csvLines.push(escaped.join(','));
  }

  const outPath = path.join(process.cwd(), 'predictions.csv');
  fs.writeFileSync(outPath, csvLines.join('\n'));
  console.log('Predictions written to', outPath);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
