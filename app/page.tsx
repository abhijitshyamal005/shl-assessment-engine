"use client"

import React, { useState } from 'react';
import { Search, Upload, ExternalLink, AlertCircle, CheckCircle, Loader2, Database, RefreshCw, Users, FileText, Layers } from 'lucide-react';

export default function SHLRecommendationSystem() {
  const [inputType, setInputType] = useState<'query' | 'jd' | 'url'>('query');
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [scraping, setScraping] = useState<boolean>(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [apiStatus, setApiStatus] = useState<string | null>(null);
  const [scrapingStatus, setScrapingStatus] = useState<string>('');

  // Check API health
  const checkApiHealth = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setApiStatus(data.status === 'healthy' ? 'healthy' : 'unhealthy');
    } catch (err) {
      setApiStatus('unreachable');
    }
  };

  // Scrape and prepare data
  const handleScrapeData = async () => {
    setScraping(true);
    setScrapingStatus('Starting scraping process...');
    setError('');

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Scraping failed: ${response.status}`);
      }

      const data = await response.json();
      setScrapingStatus(`Success! Scraped ${data.assessments_count} assessments and generated embeddings`);
      checkApiHealth();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Failed to scrape data');
      setScrapingStatus('');
    } finally {
      setScraping(false);
    }
  };

  // Get recommendations (optionally with an override query)
  const getRecommendations = async (overrideQuery?: string) => {
    const query = overrideQuery ?? input;
    setLoading(true);
    setError('');
    setRecommendations([]);

    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          top_k: 10
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API Error: ${response.status}`);
      }

      const data = await response.json();
      setRecommendations(data.recommendations || []);
      // if we searched by an override, show it in the input
      if (overrideQuery) setInput(overrideQuery);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!input.trim()) {
      setError('Please enter a query or job description');
      return;
    }
    getRecommendations();
  };

  React.useEffect(() => {
    checkApiHealth();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="bg-gradient-to-r from-[#0670c5] to-[#06366a] text-white">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => { setInput(''); setRecommendations([]); }} aria-label="Reset search" className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center text-white font-bold shadow-md hover:scale-105 transition-transform">SH</button>
            <div>
              <div className="text-sm opacity-90">SHL Assessment</div>
              <div className="text-lg font-semibold">Recommendation System</div>
            </div>
          </div>
          <div className="text-sm opacity-90">Professional assessment recommendations</div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <section className="hero-gradient rounded-3xl p-8 glass-card shadow-soft fade-in">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="md:w-2/3">
                <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-sky-700 to-blue-600">Find the right SHL assessment for any vacancy</h1>
                <p className="text-slate-700 mt-2">Paste a job description or write a short summary. Our recommender ranks assessments by relevance and test-type balance.</p>

              <div className="mt-6 flex gap-3">
                <div className="relative flex-1">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Paste job description or brief summary..."
                    className="w-full h-36 rounded-2xl border border-slate-200 p-4 shadow-sm focus:ring-4 focus:ring-sky-100 resize-none text-blue-600"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <button onClick={handleSubmit} className={`inline-flex items-center gap-2 px-5 py-3 rounded-full text-white font-semibold bg-gradient-to-r from-sky-600 to-blue-700 shadow hover:scale-[1.01] transition-transform ${loading ? 'opacity-70' : ''}`} disabled={loading}>
                    {loading ? <><Loader2 className="animate-spin h-4 w-4" />Analyzing...</> : <><Search className="h-4 w-4" />Recommend</>}
                  </button>

                  <button onClick={handleScrapeData} className="inline-flex items-center gap-2 px-4 py-3 rounded-full border border-slate-200 text-slate-700 bg-white hover:bg-slate-50" disabled={scraping}>
                    {scraping ? <Loader2 className="animate-spin h-4 w-4" /> : <Database className="h-4 w-4" />} Initialize
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3 flex-wrap">
                <button type="button" onClick={() => getRecommendations('Technical')} className="pill bg-sky-50 text-sky-700 hover:underline" aria-label="Search Technical">Technical</button>
                <button type="button" onClick={() => getRecommendations('Behavioral')} className="pill bg-amber-50 text-amber-700 hover:underline" aria-label="Search Behavioral">Behavioral</button>
                <button type="button" onClick={() => getRecommendations('Cognitive')} className="pill bg-green-50 text-green-700 hover:underline" aria-label="Search Cognitive">Cognitive</button>
              </div>
            </div>

            <aside className="md:w-1/3">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                <h4 className="font-semibold">System status</h4>
                <div className="mt-2 text-sm text-slate-600">API: <span className="font-medium">{apiStatus || 'Checking...'}</span></div>
                {scrapingStatus && <div className="mt-3 text-sm text-green-700">{scrapingStatus}</div>}
                <div className="mt-4 text-xs text-slate-500">Tip: include level and key skills for better recommendations.</div>
              </div>
            </aside>
          </div>
        </section>

        {/* Features — SHL-like highlights */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <button type="button" onClick={() => getRecommendations('Assessment library')} onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') getRecommendations('Assessment library'); }} className="bg-white rounded-2xl p-6 shadow-sm flex flex-col gap-3 text-left hover:shadow-md transition-shadow hover:translate-y-0.5 cursor-pointer" aria-label="Search Assessment Library">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-sky-50 text-sky-700">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-lg">Assessment Library</h3>
            <p className="text-sm text-slate-600">Access validated SHL-aligned assessments covering cognitive, personality and skills.</p>
          </button>

          <button type="button" onClick={() => getRecommendations('Role match')} onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') getRecommendations('Role match'); }} className="bg-white rounded-2xl p-6 shadow-sm flex flex-col gap-3 text-left hover:shadow-md transition-shadow hover:translate-y-0.5 cursor-pointer" aria-label="Search Role Match">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-amber-50 text-amber-700">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-lg">Role Match</h3>
            <p className="text-sm text-slate-600">Smart matching recommends assessments tailored to the job profile and seniority.</p>
          </button>

          <button type="button" onClick={() => getRecommendations('Balanced selection')} onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') getRecommendations('Balanced selection'); }} className="bg-white rounded-2xl p-6 shadow-sm flex flex-col gap-3 text-left hover:shadow-md transition-shadow hover:translate-y-0.5 cursor-pointer" aria-label="Search Balanced Selection">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-green-50 text-green-700">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-lg">Balanced Selection</h3>
            <p className="text-sm text-slate-600">Maintain test-type balance for fairer hiring decisions.</p>
          </button>
        </div>
        

        {/* Results */}
        {recommendations.length > 0 && (
          <section className="mt-8 grid grid-cols-1 gap-4">
            {recommendations.map((rec, idx) => (
              <article key={idx} onClick={() => getRecommendations(rec.assessment_name)} onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') getRecommendations(rec.assessment_name); }} role="button" tabIndex={0} className="bg-white rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow hover:translate-y-0.5 cursor-pointer" title="Click to search using this recommendation">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center text-white font-bold">T</div>
                  <div>
                    <div className="font-semibold text-slate-800">{rec.assessment_name}</div>
                    <a className="text-sm text-slate-500 truncate max-w-xs block" href={rec.assessment_url} target="_blank" rel="noreferrer">{rec.assessment_url}</a>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="px-3 py-1 rounded-full text-sm font-bold bg-sky-50 text-sky-700">{((rec.relevance_score||rec.similarity||0)*100).toFixed(0)}%</div>
                  <a href={rec.assessment_url} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-full bg-sky-600 text-white hover:scale-105 transition-transform">View</a>
                </div>
              </article>
            ))}
          </section>
        )}

        {!recommendations.length && (
          <div className="mt-8 text-center text-slate-500">No recommendations yet — enter a job description and click Recommend.</div>
        )}

        <footer className="site-footer text-center mt-12">Powered by SHL prototype • Built with Next.js</footer>
      </main>
    </div>
  );
}