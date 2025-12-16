// app/page.tsx
"use client";

import { useState } from "react";
// We import the type from the lib folder we created earlier
import { Assessment } from "@/lib/shl-logic";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Assessment[] | null>(null);
  
  const [formData, setFormData] = useState({
    level: "entry",
    role: "general",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResults(null);

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      setResults(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-indigo-900 tracking-tight">
            SHL Assessment Engine
          </h1>
          <p className="mt-2 text-lg text-slate-600">
            Define your role requirements to generate a validated assessment battery.
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          
          {/* Input Section */}
          <div className="p-8 border-b border-slate-100">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Level Selector */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Seniority Level
                </label>
                <select
                  className="w-full rounded-lg border-slate-300 border p-3 text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                >
                  <option value="entry">Early Careers / Graduate</option>
                  <option value="mid">Professional / Experienced</option>
                  <option value="senior">Manager / Executive</option>
                </select>
              </div>

              {/* Role Selector */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Job Family
                </label>
                <select
                  className="w-full rounded-lg border-slate-300 border p-3 text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="general">General Admin / HR</option>
                  <option value="tech">Software & Engineering</option>
                  <option value="finance">Finance & Analytics</option>
                </select>
              </div>

              {/* Submit Button */}
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-lg transition-all duration-200 shadow-md disabled:opacity-50"
                >
                  {loading ? "Analyzing Requirements..." : "Generate Recommendation"}
                </button>
              </div>
            </form>
          </div>

          {/* Results Section */}
          {results && (
            <div className="p-8 bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                Recommended Bundle
                <span className="ml-3 bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {results.length} Assessments
                </span>
              </h2>

              <div className="grid gap-4">
                {results.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wider
                          ${item.category === 'Cognitive' ? 'bg-blue-100 text-blue-700' : 
                            item.category === 'Behavioral' ? 'bg-purple-100 text-purple-700' :
                            'bg-emerald-100 text-emerald-700'}`}>
                          {item.category}
                        </span>
                        <h3 className="font-bold text-slate-900">{item.name}</h3>
                      </div>
                      <p className="text-slate-600 text-sm">{item.description}</p>
                    </div>
                    
                    <div className="mt-3 sm:mt-0 flex items-center text-slate-500 text-sm font-medium">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      {item.duration}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
        </div>
      </div>
    </main>
  );
}