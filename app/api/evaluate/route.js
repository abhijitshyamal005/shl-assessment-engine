import { AssessmentRecommender } from '../../../lib/recommender';
import { Evaluator } from '../../../lib/evaluator';
import { readFile, utils } from 'xlsx';
import fs from 'fs';

export async function POST(req) {
  try {
    const workbook = readFile('./data/train_data.xlsx');
    const sheetName = workbook.SheetNames[0];
    const trainData = utils.sheet_to_json(workbook.Sheets[sheetName]);

    const recommender = new AssessmentRecommender(process.env.GEMINI_API_KEY);
    await recommender.initialize();

    const results = await Evaluator.evaluateOnTrainSet(recommender, trainData);

    return new Response(JSON.stringify(results), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Evaluation route error:', error);
    return new Response(JSON.stringify({ error: 'Evaluation failed', message: error?.message || String(error) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
