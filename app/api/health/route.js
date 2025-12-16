export async function GET() {
  return new Response(JSON.stringify({
    status: 'healthy',
    service: 'SHL Recommendation API',
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
