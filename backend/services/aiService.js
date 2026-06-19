const fetch = global.fetch;

async function callOpenAIChatAPI(url, apiKey, model, prompt) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2
    })
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} - ${await response.text()}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("No content returned from AI provider.");
  }
  
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.substring(7);
  else if (cleaned.startsWith('```')) cleaned = cleaned.substring(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.substring(0, cleaned.length - 3);

  return JSON.parse(cleaned.trim());
}

async function runAIWithFallback(prompt) {
  // 1. Groq (Llama 3.3 70B)
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      console.log("[AI] Trying Primary: Groq (llama-3.3-70b-versatile)");
      return await callOpenAIChatAPI(
        'https://api.groq.com/openai/v1/chat/completions',
        groqKey,
        'llama-3.3-70b-versatile',
        prompt
      );
    } catch (err) {
      console.warn("[WARN] Groq failed:", err.message);
    }
  }

  // 2. OpenRouter (Llama 3.3 70B)
  const orKey = process.env.OPENROUTER_API_KEY;
  if (orKey) {
    try {
      console.log("[AI] Trying Fallback: OpenRouter (meta-llama/llama-3.3-70b-instruct)");
      return await callOpenAIChatAPI(
        'https://openrouter.ai/api/v1/chat/completions',
        orKey,
        'meta-llama/llama-3.3-70b-instruct',
        prompt
      );
    } catch (err) {
      console.warn("[WARN] OpenRouter failed:", err.message);
    }
  }

  // 3. DeepSeek (DeepSeek Chat)
  const dsKey = process.env.DEEPSEEK_API_KEY;
  if (dsKey) {
    try {
      console.log("[AI] Trying Emergency Fallback: DeepSeek (deepseek-chat)");
      return await callOpenAIChatAPI(
        'https://api.deepseek.com/chat/completions',
        dsKey,
        'deepseek-chat',
        prompt
      );
    } catch (err) {
      console.warn("[WARN] DeepSeek failed:", err.message);
    }
  }

  throw new Error("All AI providers (Groq, OpenRouter, DeepSeek) failed or are missing API keys.");
}

// Organize the real attractions into a chronological day-by-day plan
exports.generateItinerary = async (destination, durationDays, budgetTier, interests, attractions) => {
  const attractionsText = attractions.map((a, i) => 
    `[Attraction ${i+1}] Name: "${a.name}", Address: "${a.address}", Rating: ${a.rating}, Latitude: ${a.lat}, Longitude: ${a.lng}`
  ).join('\n');

  const prompt = `
    You are an expert travel planner. Organize a ${durationDays}-day trip to ${destination}.
    The user's budget level is ${budgetTier}. Interests are: ${interests ? interests.join(', ') : 'sightseeing'}.

    Here is the EXCLUSIVE list of real geocoded attractions in the destination:
    ${attractionsText}

    Your tasks:
    1. Organize these specific attractions into a day-by-day plan of exactly ${durationDays} days.
    2. Arrange activities chronologically (Morning, Afternoon, Evening) for each day to minimize transit times.
    3. You MUST ONLY use the attractions provided in the list above. DO NOT invent any attraction names, do not use dummy names (e.g. "Luxury Palace Resort" or "Local Market"), and do not use attractions from other cities (e.g. no Tokyo Skytree in Bangalore).
    4. Provide a detailed, realistic "description" for each activity explaining what to do there.
    5. Return a valid JSON object matching this structure:
    {
      "itinerary": [
        {
          "dayNumber": 1,
          "activities": [
            { 
              "title": "Exact Attraction Name from the List", 
              "description": "Details on what to do"
            }
          ]
        }
      ],
      "riskWarnings": [
        "Monsoon/Weather alerts specific to this destination",
        "Extreme temperature warning or notice",
        "High tourist crowd alerts",
        "Public holiday notice or festival congestion alert"
      ]
    }

    Rules:
    - Choose at most 3 activities per day from the provided list.
    - Return ONLY valid JSON, do not wrap it in markdown code blocks.
  `;

  console.log(`[DEBUG] AI Prompt Compiled for Itinerary Generation`);
  return await runAIWithFallback(prompt);
};

// Regenerate a single day based on user instructions, using the real attractions
exports.regenerateDay = async (destination, dayNumber, promptText, attractions) => {
  const attractionsText = attractions.map((a, i) => 
    `[Attraction ${i+1}] Name: "${a.name}", Address: "${a.address}", Rating: ${a.rating}, Latitude: ${a.lat}, Longitude: ${a.lng}`
  ).join('\n');

  const prompt = `
    You are refining Day ${dayNumber} of an itinerary for a trip to ${destination}.
    The user wants you to modify the day according to these instructions: "${promptText}".

    Here is the EXCLUSIVE list of real geocoded attractions in the destination:
    ${attractionsText}

    Your tasks:
    1. Organize activities for Day ${dayNumber} keeping the user's instructions in mind.
    2. Arrange activities chronologically (Morning, Afternoon, Evening) to minimize transit times.
    3. You MUST ONLY use the attractions provided in the list above. DO NOT invent any attraction names.
    4. Return a valid JSON object matching this structure:
    {
      "dayNumber": ${dayNumber},
      "activities": [
        { 
          "title": "Exact Attraction Name from the List", 
          "description": "Details on what to do"
        }
      ]
    }

    Rules:
    - Return ONLY valid JSON, do not wrap it in markdown code blocks.
  `;

  console.log(`[DEBUG] AI Prompt Compiled for Day ${dayNumber} Regeneration`);
  return await runAIWithFallback(prompt);
};
