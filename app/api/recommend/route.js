import { AssessmentRecommender } from '../../../lib/recommender';

export async function POST(req) {
  try {
    const body = await req.json();
    const { query, top_k = 10 } = body;

    if (!query) {
      return new Response(JSON.stringify({ error: 'Query is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const recommender = new AssessmentRecommender(process.env.GEMINI_API_KEY);
    await recommender.initialize();
    const recommendations = await recommender.getRecommendations(query, Math.min(top_k, 10));

    // Return both keys: `recommendations` (used by the frontend) and
    // `recommended_assessments` (matches the external spec examples).
    return new Response(JSON.stringify({ query, recommendations, recommended_assessments: recommendations }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Recommendation route error:', err);
    return new Response(JSON.stringify({ error: 'Recommendation failed', message: err?.message || String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
