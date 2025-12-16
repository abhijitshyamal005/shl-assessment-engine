import { GoogleGenerativeAI } from '@google/generative-ai';
import { EmbeddingManager } from './embeddings.js';
import fs from 'fs';

export class AssessmentRecommender {
  constructor(apiKey) {
    this.embeddingManager = new EmbeddingManager();
    this.apiKey = apiKey || process.env.GEMINI_API_KEY;
    this.genAI = null;
    this.model = null;
    this.initialized = false;
  }

  async initialize() {
    if (!this.initialized) {
      try {
        // Try to load pre-computed embeddings
        if (fs.existsSync('./data/embeddings.json')) {
          this.embeddingManager.loadEmbeddings('./data/embeddings.json');
        } else {
          console.log('No embeddings found. Please run scraping first.');
        }
        this.initialized = true;
      } catch (err) {
        console.error('Initialization error:', err);
      }
    }
  }

  async extractRequirements(query) {
    try {
      // normalize some language tokens so extraction+embeddings match
      const normalizedQuery = String(query || '').replace(/c\+\+/gi, 'cpp').replace(/c#/gi, 'csharp');

      // If no API key, fall back to simple extraction
      if (!this.apiKey) {
        return this.simpleExtraction(normalizedQuery);
      }

      // Lazily initialize generative model if not ready. Wrap in try/catch
      // in case the library isn't installed or the API call fails.
      try {
        if (!this.genAI) {
          this.genAI = new GoogleGenerativeAI(this.apiKey);
        }
        if (!this.model) {
          this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
        }
      } catch (err) {
        console.warn('Generative AI unavailable, using simple extraction fallback:', err?.message || err);
        return this.simpleExtraction(query);
      }
      const prompt = `Analyze this hiring query and identify:
1. Technical skills needed (programming languages, tools)
2. Soft skills needed (collaboration, leadership, communication)
3. Job level (entry/mid/senior)
4. Key competencies to assess

    Query: "${normalizedQuery}"

Respond with a brief analysis focusing on what types of assessments would be most relevant.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (err) {
      console.error('LLM extraction error:', err);
      return this.simpleExtraction(query);
    }
  }

  simpleExtraction(query) {
    const lowerQuery = String(query || '').toLowerCase();
    // normalize common language tokens so regex matches (e.g. c++, c#)
    const normalized = lowerQuery.replace(/c\+\+/g, 'cpp').replace(/c#/g, 'csharp');
    const analysis = {
      needsTechnical: /java|python|sql|javascript|coding|programming|developer|technical|cpp|csharp/i.test(normalized),
      needsBehavioral: /collaborate|personality|behavioral|leadership|communication|soft skill/i.test(normalized),
      needsCognitive: /cognitive|analytical|problem.?solving|reasoning|ability/i.test(normalized),
      level: normalized.includes('senior') ? 'senior' : 
             normalized.includes('entry') ? 'entry' : 'mid'
    };
    return JSON.stringify(analysis);
  }

  async getRecommendations(query, topK = 10) {
    await this.initialize();
    
    // Step 1: Extract requirements
    const requirements = await this.extractRequirements(query);
    
    // Step 2: Get similar assessments
    const candidates = await this.embeddingManager.findSimilar(query, topK * 2);
    
    // Step 3: Balance recommendations
    const balanced = this.balanceRecommendations(candidates, query);
    
    // Step 4: Format results to include required fields
    return balanced.slice(0, topK).map(item => ({
      name: item.assessment_name || item.name || '',
      url: item.assessment_url || item.url || '',
      description: item.description || '',
      test_type: item.test_type || [],
      // Optional fields - set to null if not present in source data
      adaptive_support: item.adaptive_support || null,
      duration: item.duration || null,
      remote_support: item.remote_support || null,
      // Keep original fields for backward compatibility
      assessment_name: item.assessment_name,
      assessment_url: item.assessment_url,
      relevance_score: item.similarity || 0
    }));
  }

  balanceRecommendations(candidates, query) {
    const lowerQuery = String(query || '').toLowerCase();
    // normalize for language tokens
    const normalized = lowerQuery.replace(/c\+\+/g, 'cpp').replace(/c#/g, 'csharp');

    const needsTechnical = /java|python|sql|javascript|coding|programming|developer|cpp|csharp/i.test(normalized);
    const needsBehavioral = /collaborate|personality|behavioral|leadership|communication/i.test(normalized);
    
    // Separate by test type
    const kTests = candidates.filter(c => c.test_type === 'K');
    const pTests = candidates.filter(c => c.test_type === 'P');
    const otherTests = candidates.filter(c => c.test_type === 'O');
    
    let balanced = [];
    
    if (needsTechnical && needsBehavioral) {
      // 60-40 split
      balanced = [
        ...kTests.slice(0, 6),
        ...pTests.slice(0, 4)
      ];
    } else if (needsTechnical) {
      balanced = [
        ...kTests.slice(0, 8),
        ...otherTests.slice(0, 2)
      ];
    } else if (needsBehavioral) {
      balanced = [
        ...pTests.slice(0, 8),
        ...otherTests.slice(0, 2)
      ];
    } else {
      balanced = candidates;
    }
    
    // Sort by similarity
    balanced.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
    
    return balanced;
  }
}