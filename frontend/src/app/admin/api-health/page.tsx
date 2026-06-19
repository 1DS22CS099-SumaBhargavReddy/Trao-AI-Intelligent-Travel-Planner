'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../components/navigation/Sidebar';
import Header from '../../../components/navigation/Header';
import { apiRequest } from '../../../utils/api';

interface DiagnosticResult {
  status: 'PASS' | 'FAIL';
  responseTimeMs: number;
  rawResponse: any;
  error: string | null;
  suggestedFix: string | null;
}

interface HealthResponse {
  mongodb: boolean;
  openrouter: boolean;
  deepseek: boolean;
  grok: boolean;
  googlePlaces: boolean;
  geocoding: boolean;
  directions: boolean;
  weather: boolean;
  diagnostics: {
    [key: string]: DiagnosticResult;
  };
}

const API_KEYS = [
  'mongodb',
  'openrouter',
  'deepseek',
  'grok',
  'googlePlaces',
  'geocoding',
  'directions',
  'weather'
];

const API_NAMES: { [key: string]: string } = {
  mongodb: 'MongoDB Connection',
  openrouter: 'OpenRouter API',
  deepseek: 'DeepSeek API',
  grok: 'Grok API',
  googlePlaces: 'Google Places API',
  geocoding: 'Google Geocoding API',
  directions: 'Google Directions API',
  weather: 'OpenweatherAPI'
};

const API_DESCRIPTIONS: { [key: string]: string } = {
  mongodb: 'Performs connection check and ping command against Atlas database',
  openrouter: 'Sends prompt "Return ONLY the word OK" to Llama-3.3-70b-instruct',
  deepseek: 'Sends prompt "Return ONLY the word OK" to deepseek-chat',
  grok: 'Sends prompt "Return ONLY the word OK" to Llama-3.3-70b-versatile',
  googlePlaces: 'Queries Places search for "Bangalore Palace" (expects results)',
  geocoding: 'Queries Geocoding search for "Bangalore India" (expects coordinates)',
  directions: 'Queries routing between Bangalore Palace and Cubbon Park',
  weather: 'Queries current temperature for Bangalore (12.9716, 77.5946)'
};

export default function ApiHealthPage() {
  const router = useRouter();
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedResponse, setExpandedResponse] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    // Load initial health diagnostics
    runDiagnostics();
  }, [router]);

  const runDiagnostics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiRequest<HealthResponse>('/api/admin/health');
      setData(res);
    } catch (err: any) {
      console.error('Failed to run diagnostics:', err);
      setError(err.message || 'System failed to query diagnostic endpoint.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (key: string) => {
    setExpandedResponse((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header currency={currency} setCurrency={setCurrency} />

      <div className="flex-1 flex flex-col lg:flex-row">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 space-y-8 max-w-6xl w-full mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-900 pb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
                <span className="p-2 bg-indigo-600/20 text-indigo-400 rounded-2xl text-xl">🛠️</span>
                API Diagnostics Board
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Real-time validation, latency checks, and debugging endpoints for all external API integrations
              </p>
            </div>
            <button
              onClick={runDiagnostics}
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg shadow-indigo-500/10 transition duration-200 self-start sm:self-auto flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Running Diagnostics...
                </>
              ) : (
                <>⚡ Run Diagnostics</>
              )}
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-4 rounded-xl">
              <span className="font-bold">General Error: </span>{error}
            </div>
          )}

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {API_KEYS.map((key) => {
              const working = data ? (data as any)[key] === true : false;
              const diag: DiagnosticResult | undefined = data?.diagnostics?.[key];
              const isExpanded = expandedResponse[key] || false;

              return (
                <div
                  key={key}
                  className={`bg-slate-900/60 border rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all duration-300 flex flex-col justify-between space-y-4 ${data
                    ? working
                      ? 'border-emerald-500/10 hover:border-emerald-500/20'
                      : 'border-red-500/20 hover:border-red-500/30'
                    : 'border-slate-850'
                    }`}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-black text-white text-base leading-tight">
                        {API_NAMES[key]}
                      </h4>
                      {data ? (
                        working ? (
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/45 px-2.5 py-1 rounded-lg border border-emerald-900/50">
                            🟢 Working
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-red-400 bg-red-950/45 px-2.5 py-1 rounded-lg border border-red-500/30">
                            🔴 Failed
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-slate-500 bg-slate-950 px-2.5 py-1 rounded-lg">
                          ⚪ Untested
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 leading-normal">
                      {API_DESCRIPTIONS[key]}
                    </p>
                  </div>

                  {/* Timing & Error Panel */}
                  {data && diag && (
                    <div className="space-y-3 pt-2">
                      <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-2">
                        <span className="text-slate-400">Response Time</span>
                        <span className="font-mono font-bold text-slate-200">{diag.responseTimeMs} ms</span>
                      </div>

                      {!working && (
                        <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-3.5 space-y-2.5 text-xs">
                          <div>
                            <p className="text-[10px] uppercase font-bold text-red-400 tracking-wider">Reason</p>
                            <p className="text-slate-350 font-medium mt-0.5 leading-relaxed break-all">{diag.error}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Suggested Fix</p>
                            <p className="text-slate-350 font-medium mt-0.5 leading-relaxed">{diag.suggestedFix}</p>
                          </div>
                        </div>
                      )}

                      {/* Expandable Panel */}
                      {diag.rawResponse && (
                        <div className="pt-2">
                          <button
                            onClick={() => toggleExpand(key)}
                            className="text-[10px] font-bold text-indigo-400 hover:text-indigo-305 flex items-center gap-1 transition"
                          >
                            {isExpanded ? '▼ Hide Raw Response' : '▶ Show Raw Response'}
                          </button>

                          {isExpanded && (
                            <pre className="text-[10px] font-mono bg-slate-950/80 border border-slate-850 p-3 rounded-xl overflow-x-auto text-slate-400 mt-2 max-h-40 leading-relaxed shadow-inner">
                              {JSON.stringify(diag.rawResponse, null, 2)}
                            </pre>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
