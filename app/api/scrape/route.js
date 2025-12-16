import { SHLScraper } from '../../../lib/scraper';
import { EmbeddingManager } from '../../../lib/embeddings';
import fs from 'fs';
import path from 'path';

export async function POST(req) {
  try {
    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Step 1: Scrape
    const scraper = new SHLScraper();
    const assessments = await scraper.scrapeCatalog();
    scraper.saveData(path.join(dataDir, 'assessments.json'));

    // Step 2: Generate embeddings (will fallback to software embeddings if model unavailable)
    const embeddingManager = new EmbeddingManager();
    await embeddingManager.createEmbeddings(assessments);
    embeddingManager.saveEmbeddings(path.join(dataDir, 'embeddings.json'));

    return new Response(JSON.stringify({ success: true, assessments_count: assessments.length, message: 'Scraping and embedding generation completed' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Scraping route error:', error);
    return new Response(JSON.stringify({ error: 'Scraping failed', message: error?.message || String(error) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
