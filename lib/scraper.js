import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

export class SHLScraper {
  constructor() {
    this.baseUrl = 'https://www.shl.com/solutions/products/product-catalog/';
    this.assessments = [];
  }

  async scrapeCatalog() {
    try {
      console.log('Starting SHL catalog scraping...');
      
      const response = await axios.get(this.baseUrl);
      const $ = cheerio.load(response.data);
      
      // Parse assessment cards
      // Note: Update selectors based on actual HTML structure
      $('.product-item, .assessment-card').each((i, element) => {
        try {
          const name = $(element).find('h3, .product-title').text().trim();
          const url = $(element).find('a').attr('href') || '';
          const description = $(element).find('.description, p').first().text().trim();
          const category = $(element).find('.category, .product-category').text().trim();
          const testType = $(element).attr('data-type') || this.inferTestType(name, description);
          
          // Filter out pre-packaged solutions
          if (name && !category.toLowerCase().includes('pre-packaged')) {
            this.assessments.push({
              assessment_name: name,
              assessment_url: url.startsWith('http') ? url : `https://www.shl.com${url}`,
              description: description,
              category: category,
              test_type: testType,
              combined_text: `${name}. ${description}. Category: ${category}. Type: ${testType}`
            });
          }
        } catch (err) {
          console.warn('Error parsing element:', err.message);
        }
      });

      // If main scraping didn't work, try alternative approach
      if (this.assessments.length < 50) {
        await this.scrapeAlternative($);
      }

      console.log(`Successfully scraped ${this.assessments.length} assessments`);
      
      if (this.assessments.length < 377) {
        console.warn(`Warning: Expected 377+ assessments, got ${this.assessments.length}`);
      }
      
      return this.assessments;
    } catch (error) {
      console.error('Scraping error:', error);
      throw error;
    }
  }

  async scrapeAlternative($) {
    // Alternative scraping strategy
    $('a[href*="product"], a[href*="assessment"]').each((i, element) => {
      const name = $(element).text().trim();
      const url = $(element).attr('href');
      
      if (name.length > 10 && url) {
        this.assessments.push({
          assessment_name: name,
          assessment_url: url.startsWith('http') ? url : `https://www.shl.com${url}`,
          description: '',
          category: 'Individual Test Solution',
          test_type: this.inferTestType(name, ''),
          combined_text: name
        });
      }
    });
  }

  inferTestType(name, description) {
    const text = `${name} ${description}`.toLowerCase();
    
    if (text.includes('cognitive') || text.includes('ability') || 
        text.includes('numerical') || text.includes('verbal')) {
      return 'K'; // Knowledge/Cognitive
    } else if (text.includes('personality') || text.includes('behavioral') || 
               text.includes('motivation')) {
      return 'P'; // Personality
    } else if (text.includes('skill') || text.includes('technical') || 
               text.includes('programming') || text.includes('coding')) {
      return 'K'; // Skills
    }
    return 'O'; // Other
  }

  saveData(filepath) {
    fs.writeFileSync(filepath, JSON.stringify(this.assessments, null, 2));
    console.log(`Data saved to ${filepath}`);
    return this.assessments;
  }
}