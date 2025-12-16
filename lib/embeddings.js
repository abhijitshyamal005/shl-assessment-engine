import fs from 'fs';
let pipeline;
try {
  // lazy require to avoid hard dependency failing at startup
  // @xenova/transformers may not be installed in lightweight test environments
  // so we try to import it when needed.
  // eslint-disable-next-line no-undef
  pipeline = require('@xenova/transformers').pipeline;
} catch (err) {
  pipeline = null;
}

export class EmbeddingManager {
  constructor() {
    this.embedder = null;
    this.embeddings = [];
  }

  async initialize() {
    if (this.embeddings && this.embeddings.length > 0) {
      // If embeddings already loaded from disk, skip model initialization
      return;
    }

    if (!this.embedder && pipeline) {
      try {
        console.log('Loading embedding model...');
        this.embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        console.log('Model loaded!');
      } catch (err) {
        console.warn('Failed to load embedding model, falling back to software embeddings:', err?.message || err);
        this.embedder = null;
      }
    }
  }

  async createEmbeddings(assessments) {
    await this.initialize();

    console.log('Generating embeddings...');
    const embeddings = [];

    const textToVector = (text, dim = 16) => {
      // deterministic lightweight embedding: hash characters into a fixed vector
      const vec = new Array(dim).fill(0);
      for (let i = 0; i < text.length; i++) {
        const ch = text.charCodeAt(i);
        vec[i % dim] += (ch % 31) / 31;
      }
      // normalize
      const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
      return vec.map(v => v / mag);
    };

    for (let i = 0; i < assessments.length; i++) {
      const text = assessments[i].combined_text || assessments[i].assessment_name || '';

      try {
        let embedding;
        if (this.embedder) {
          const output = await this.embedder(text, { pooling: 'mean', normalize: true });
          embedding = Array.from(output.data || output[0] || []);
        } else {
          embedding = textToVector(text, 16);
        }

        embeddings.push({
          id: i,
          assessment: assessments[i],
          embedding: embedding
        });

        if ((i + 1) % 50 === 0) {
          console.log(`Processed ${i + 1}/${assessments.length} embeddings`);
        }
      } catch (err) {
        console.error(`Error embedding item ${i}:`, err?.message || err);
      }
    }

    this.embeddings = embeddings;
    return embeddings;
  }

  cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  async findSimilar(query, topK = 10) {
    // If embeddings already loaded, no need to require model
    if (!this.embeddings || this.embeddings.length === 0) {
      // If no embeddings available, try to create from assessments in data
      try {
        const dataPath = './data/assessments.json';
        if (fs.existsSync(dataPath)) {
          const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
          await this.createEmbeddings(data);
        }
      } catch (err) {
        console.warn('Could not auto-create embeddings:', err?.message || err);
      }
    }

    const textToVector = (text, dim = 16) => {
      const vec = new Array(dim).fill(0);
      for (let i = 0; i < text.length; i++) {
        const ch = text.charCodeAt(i);
        vec[i % dim] += (ch % 31) / 31;
      }
      const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
      return vec.map(v => v / mag);
    };

    let queryEmbedding;
    if (this.embedder) {
      const queryOutput = await this.embedder(query, { pooling: 'mean', normalize: true });
      queryEmbedding = Array.from(queryOutput.data || queryOutput[0] || []);
    } else {
      queryEmbedding = textToVector(query, 16);
    }

    const similarities = (this.embeddings || []).map(item => ({
      ...item.assessment,
      similarity: this.cosineSimilarity(queryEmbedding, item.embedding)
    }));

    similarities.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
    return similarities.slice(0, topK);
  }

  saveEmbeddings(filepath) {
    fs.writeFileSync(filepath, JSON.stringify(this.embeddings, null, 2));
    console.log(`Embeddings saved to ${filepath}`);
  }

  loadEmbeddings(filepath) {
    const data = fs.readFileSync(filepath, 'utf8');
    this.embeddings = JSON.parse(data);
    console.log(`Loaded ${this.embeddings.length} embeddings`);
  }
}