export class Evaluator {
  static calculateRecallAtK(predictions, groundTruth, k = 10) {
    const predSet = new Set(predictions.slice(0, k));
    const truthSet = new Set(groundTruth);
    
    if (truthSet.size === 0) return 0;
    
    let hits = 0;
    for (const url of truthSet) {
      if (predSet.has(url)) hits++;
    }
    
    return hits / truthSet.size;
  }

  static calculateMeanRecallAtK(results, k = 10) {
    const recalls = results.map(r => 
      this.calculateRecallAtK(r.predictions, r.groundTruth, k)
    );
    
    const sum = recalls.reduce((acc, val) => acc + val, 0);
    return sum / recalls.length;
  }

  static async evaluateOnTrainSet(recommender, trainData) {
    const results = [];
    
    for (const item of trainData) {
      const recommendations = await recommender.getRecommendations(item.query, 10);
      const predictedUrls = recommendations.map(r => r.assessment_url);
      
      const recall = this.calculateRecallAtK(
        predictedUrls,
        item.ground_truth_urls,
        10
      );
      
      results.push({
        query: item.query,
        recall_at_10: recall,
        predictions: predictedUrls,
        groundTruth: item.ground_truth_urls
      });
    }
    
    const meanRecall = this.calculateMeanRecallAtK(results, 10);
    
    return {
      mean_recall_at_10: meanRecall,
      detailed_results: results
    };
  }
}