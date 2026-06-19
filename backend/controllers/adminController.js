const mongoose = require('mongoose');

// GET /api/admin/health
exports.getApiHealth = async (req, res) => {
  const diagnostics = {};
  const responseFormat = {};

  const runTest = async (key, testFn, suggestedFix) => {
    const start = Date.now();
    try {
      const raw = await testFn();
      const duration = Date.now() - start;
      diagnostics[key] = {
        status: 'PASS',
        responseTimeMs: duration,
        rawResponse: raw,
        error: null,
        suggestedFix: null
      };
      responseFormat[key] = true;
    } catch (err) {
      const duration = Date.now() - start;
      diagnostics[key] = {
        status: 'FAIL',
        responseTimeMs: duration,
        rawResponse: null,
        error: err.message || String(err),
        suggestedFix
      };
      responseFormat[key] = false;
    }
  };

  // 1. MongoDB Connection
  await runTest(
    'mongodb',
    async () => {
      if (mongoose.connection.readyState !== 1) {
        throw new Error('Database connection is not ready (state is not connected)');
      }
      const adminDb = mongoose.connection.db.admin();
      const pingResult = await adminDb.ping();
      return pingResult;
    },
    'Ensure MONGO_URI in backend/.env is correct, the MongoDB server is running, and the network is not blocked.'
  );

  // 2. OpenRouter API
  await runTest(
    'openrouter',
    async () => {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) throw new Error('OPENROUTER_API_KEY is not defined in env');
      const url = 'https://openrouter.ai/api/v1/chat/completions';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.3-70b-instruct',
          messages: [{ role: 'user', content: 'Return ONLY the word OK' }],
          temperature: 0
        })
      });
      if (!response.ok) {
        throw new Error(`OpenRouter returned status ${response.status}: ${await response.text()}`);
      }
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content?.trim();
      if (text !== 'OK') {
        throw new Error(`Expected 'OK', got '${text}'`);
      }
      return data;
    },
    'Verify OPENROUTER_API_KEY in backend/.env is active, correct, and has quota.'
  );

  // 2b. DeepSeek API
  await runTest(
    'deepseek',
    async () => {
      const apiKey = process.env.DEEPSEEK_API_KEY;
      if (!apiKey) throw new Error('DEEPSEEK_API_KEY is not defined in env');
      const url = 'https://api.deepseek.com/chat/completions';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: 'Return ONLY the word OK' }],
          temperature: 0
        })
      });
      if (!response.ok) {
        throw new Error(`DeepSeek returned status ${response.status}: ${await response.text()}`);
      }
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content?.trim();
      if (text !== 'OK') {
        throw new Error(`Expected 'OK', got '${text}'`);
      }
      return data;
    },
    'Verify DEEPSEEK_API_KEY in backend/.env is active, correct, and has quota.'
  );

  // 3. Grok API (via Groq Llama-3 model as per environment key prefix 'gsk_')
  await runTest(
    'grok',
    async () => {
      const apiKey = process.env.GROQ_API_KEY || process.env.GROK_API_KEY;
      if (!apiKey) throw new Error('GROQ_API_KEY or GROK_API_KEY is not defined in env');
      const url = 'https://api.groq.com/openai/v1/chat/completions';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: 'Return ONLY the word OK' }],
          temperature: 0
        })
      });
      if (!response.ok) {
        throw new Error(`Grok/Groq API returned status ${response.status}: ${await response.text()}`);
      }
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content?.trim();
      if (text !== 'OK') {
        throw new Error(`Expected 'OK', got '${text}'`);
      }
      return data;
    },
    "Verify GROQ_API_KEY in backend/.env is active and correct. Groq API keys start with 'gsk_'. Check connection to api.groq.com."
  );

  // 4. Google Places API
  await runTest(
    'googlePlaces',
    async () => {
      const apiKey = process.env.GOOGLE_PLACES_API_KEY;
      if (!apiKey) throw new Error('GOOGLE_PLACES_API_KEY is not defined in env');
      const query = 'Bangalore Palace';
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.status && data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(`Google Places API error: ${data.status} - ${data.error_message || ''}`);
      }
      if (!data.results || data.results.length === 0) {
        throw new Error('No results returned from Places API for Bangalore Palace');
      }
      return data;
    },
    "Verify GOOGLE_PLACES_API_KEY in backend/.env has the 'Places API' enabled in the Google Cloud Console and billing is active."
  );

  // 5. Google Geocoding API
  await runTest(
    'geocoding',
    async () => {
      const apiKey = process.env.GOOGLE_PLACES_API_KEY;
      if (!apiKey) throw new Error('GOOGLE_PLACES_API_KEY is not defined in env');
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent("Bangalore India")}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.status && data.status !== 'OK') {
        throw new Error(`Google Geocoding API error: ${data.status} - ${data.error_message || ''}`);
      }
      if (!data.results || data.results.length === 0) {
        throw new Error('No results returned from Geocoding API');
      }
      const location = data.results[0]?.geometry?.location;
      if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
        throw new Error('No valid latitude/longitude coordinates returned');
      }
      return data;
    },
    "Verify GOOGLE_PLACES_API_KEY in backend/.env has the 'Geocoding API' enabled in the Google Cloud Console."
  );

  // 6. Google Directions API
  await runTest(
    'directions',
    async () => {
      const apiKey = process.env.GOOGLE_PLACES_API_KEY;
      if (!apiKey) throw new Error('GOOGLE_PLACES_API_KEY is not defined in env');
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent("Bangalore Palace")}&destination=${encodeURIComponent("Cubbon Park")}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.status && data.status !== 'OK') {
        throw new Error(`Google Directions API error: ${data.status} - ${data.error_message || ''}`);
      }
      if (!data.routes || data.routes.length === 0) {
        throw new Error('No routes returned from Directions API');
      }
      return data;
    },
    "Verify GOOGLE_PLACES_API_KEY in backend/.env has the 'Directions API' enabled in the Google Cloud Console."
  );

  // 7. OpenweatherAPI
  await runTest(
    'weather',
    async () => {
      const apiKey = process.env.OPENWEATHER_API_KEY;
      if (!apiKey) throw new Error('OPENWEATHER_API_KEY is not defined in env');
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=12.9716&lon=77.5946&appid=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      if (response.status !== 200) {
        throw new Error(`OpenWeather API error: ${data.message || 'Status Code ' + response.status}`);
      }
      if (!data.main || typeof data.main.temp !== 'number') {
        throw new Error('No valid current temperature returned');
      }
      return data;
    },
    "Verify OPENWEATHER_API_KEY in backend/.env is correct and active. Check connection to api.openweathermap.org."
  );

  return res.status(200).json({
    mongodb: responseFormat.mongodb,
    openrouter: responseFormat.openrouter,
    deepseek: responseFormat.deepseek,
    grok: responseFormat.grok,
    googlePlaces: responseFormat.googlePlaces,
    geocoding: responseFormat.geocoding,
    directions: responseFormat.directions,
    weather: responseFormat.weather,
    diagnostics
  });
};
