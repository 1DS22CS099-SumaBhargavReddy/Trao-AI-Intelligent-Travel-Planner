import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col justify-between relative overflow-hidden font-sans">
      
      {/* Navigation Header */}
      <header className="max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between z-15">
        <div className="flex items-center gap-2">
          <span className="text-2xl">✈️</span>
          <span className="text-xl font-extrabold tracking-tight text-gray-900">
            Trao AI Travel
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="text-sm font-bold bg-black hover:bg-gray-800 text-white px-4 py-2.5 rounded-xl shadow-sm transition duration-200"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl w-full mx-auto px-6 py-12 md:py-24 flex flex-col items-center text-center space-y-8 flex-1 justify-center z-10">
        <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 text-gray-600 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase">
          <span>✨ Groq / OpenRouter / DeepSeek Powered Agent</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-gray-900 leading-tight max-w-4xl">
          Your Next Adventure,{' '}
          <span className="text-gray-900">
            Planned in Seconds.
          </span>
        </h1>

        <p className="text-base sm:text-xl text-gray-500 max-w-2xl leading-relaxed">
          Trao AI is an intelligent travel agent that designs user-isolated itineraries, constructs realistic budgets, matches hotel options, and compiles customized weather packing checklists.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full justify-center">
          <Link
            href="/register"
            className="bg-black hover:bg-gray-900 text-white font-bold px-8 py-4 rounded-xl shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
          >
            Create Your Itinerary Now
          </Link>
          <Link
            href="/login"
            className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 font-semibold px-8 py-4 rounded-xl transition duration-200"
          >
            Explore Dashboard
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 w-full text-left max-w-6xl">
          <div className="bg-gray-50 border border-gray-100 p-6 rounded-3xl space-y-3">
            <div className="text-3xl">📅</div>
            <h3 className="text-lg font-bold text-gray-900">Dynamic Itinerary Timeline</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Day-by-day plans built around your interests. Edit activities, swap times, or instruct the AI to rewrite a day.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-100 p-6 rounded-3xl space-y-3">
            <div className="text-3xl">📊</div>
            <h3 className="text-lg font-bold text-gray-900">Financial Ledger</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Cost estimations segmented across flights, lodging, transit, food, and activities. Recalculates dynamically as you update plans.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-100 p-6 rounded-3xl space-y-3">
            <div className="text-3xl">⛈️</div>
            <h3 className="text-lg font-bold text-gray-900">Weather-Aware Packing</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Our packing assistant inspects destination climate forecasts and planned activities to build a checklist.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white px-6 py-8 text-center text-xs text-gray-400">
        <p>© 2026 Trao AI Travel Planner Inc. Crafted for Full-Stack Assessment.</p>
      </footer>
    </div>
  );
}
