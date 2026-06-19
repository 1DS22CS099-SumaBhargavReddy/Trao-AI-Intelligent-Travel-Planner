# 🌍 Trao — AI Intelligent Travel Planner

> A full-stack, multi-user web application that generates fully personalized, day-by-day travel itineraries using real geocoded data, live weather, and a cascading AI provider pipeline.

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Tech Stack & Justification](#-tech-stack--justification)
3. [Setup Instructions](#-setup-instructions)
4. [High-Level Architecture](#-high-level-architecture)
5. [Authentication & Authorization](#-authentication--authorization)
6. [AI Agent Design & Purpose](#-ai-agent-design--purpose)
7. [Creative / Custom Features](#-creative--custom-features)
8. [Key Design Decisions & Trade-offs](#-key-design-decisions--trade-offs)
9. [Known Limitations](#-known-limitations)
10. [API Reference](#-api-reference)

---

## 🎯 Project Overview

**Trao** is an intelligent travel planning platform that removes the guesswork from trip planning. A user enters a destination, travel duration, budget tier, number of travelers, and interests — and Trao:

- **Geocodes** the destination and origin using Google Maps APIs
- **Discovers real attractions and hotels** via Google Places API
- **Fetches live weather forecasts** for packing recommendations
- **Asks an AI** (Groq Llama 3.3 → OpenRouter → DeepSeek fallback chain) to organize those real attractions into a logical, chronological day-by-day itinerary
- **Computes directions routes** per day using Google Directions API
- **Estimates a realistic budget** broken down by transport, accommodation, food, and activities — calibrated per country cost index, city, budget tier, and number of travelers
- **Generates a weather-aware packing list** and an emergency assistance card

The result is a single cohesive trip document stored in MongoDB per user, with full CRUD control, day-level AI regeneration, a travel journal, hotel comparisons, and an admin API health dashboard.

---

## 🛠 Tech Stack & Justification

### Frontend

| Technology | Version | Justification |
|---|---|---|
| **Next.js** | 16.2 (App Router) | File-based routing, SSR/SSG capabilities, and React Server Components for performance |
| **React** | 19.2 | Latest concurrent features; no extra overhead from class components |
| **TypeScript** | 5.x | Compile-time type safety across all API response shapes and UI state |
| **Tailwind CSS** | v4 | Utility-first CSS eliminates context-switching; v4 uses native CSS variables and is faster than v3 |
| **TanStack Query** | 5.x | Server-state management with automatic caching and background refetching |

### Backend

| Technology | Version | Justification |
|---|---|---|
| **Node.js + Express** | 5.x | Lightweight, async-first REST gateway; native `fetch` available without polyfills in Node 18+ |
| **MongoDB + Mongoose** | 9.x | Document model maps naturally to nested trip structures (itinerary → day → activity → location) |
| **mongodb-memory-server** | 11.x | Auto-spins an in-memory MongoDB if `MONGO_URI` is omitted — zero-config grading fallback |
| **jsonwebtoken** | 9.x | Stateless JWT-based auth; no server-side session storage required |
| **bcryptjs** | 3.x | Password hashing with configurable salt rounds |
| **Zod** | 4.x | Runtime schema validation of all incoming request bodies |
| **Helmet + express-rate-limit** | latest | HTTP security headers and brute-force protection out of the box |

### AI Providers (Cascading Fallback)

| Priority | Provider | Model |
|---|---|---|
| 1st (Primary) | **Groq** | `llama-3.3-70b-versatile` |
| 2nd (Fallback) | **OpenRouter** | `meta-llama/llama-3.3-70b-instruct` |
| 3rd (Emergency) | **DeepSeek** | `deepseek-chat` |

> **Justification**: Groq offers the fastest inference (~500 tok/s). OpenRouter provides model diversity. DeepSeek offers low-cost emergency fallback. All three expose an OpenAI-compatible chat completions API, enabling a single shared `callOpenAIChatAPI()` function across all providers.

### External APIs

| API | Purpose |
|---|---|
| Google Places API | Discover real hotels, attractions, restaurants, hospitals, embassies |
| Google Geocoding API | Resolve city/country names to precise lat/lng coordinates |
| Google Directions API | Compute driving routes and polylines between daily activity waypoints |
| OpenWeather API | Live 5-day weather forecast for packing list generation |

---

## ⚙️ Setup Instructions

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- MongoDB Atlas account OR leave `MONGO_URI` blank for auto-in-memory DB
- API keys (see `.env.example`)

---

### Local Setup — Backend

```bash
# 1. Enter backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Configure environment (copy the example, then fill in your keys)
copy .env.example .env
```

Edit `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/
JWT_SECRET=any_long_random_secret_string

# AI Providers (at least one required)
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxx
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxx
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx

# Google APIs (one key with Places + Geocoding + Directions enabled)
GOOGLE_PLACES_API_KEY=AIzaSy_xxxxxxxxxxxxxxxx

# Weather
OPENWEATHER_API_KEY=xxxxxxxxxxxxxxxx
```

```bash
# 4. Start the development server (with hot-reload)
npm run dev

# OR start production server
npm start
```

Backend runs at: **http://localhost:5000**

---

### Local Setup — Frontend

```bash
# 1. Enter frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Configure environment
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local

# 4. Start the Next.js dev server
npm run dev
```

Frontend runs at: **http://localhost:3000**

---

### Running Integration Tests

```bash
cd backend
node test-server.js
```

This runs automated tests for: user registration, login, JWT auth, trip CRUD, and cross-user data isolation.

---

### Deployed Setup

Replace `NEXT_PUBLIC_API_URL` in frontend environment with your deployed backend URL:

```env
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

Recommended deployment targets:
- **Backend**: Render, Railway, or any Node.js host
- **Frontend**: Vercel (zero-config Next.js deployment)
- **Database**: MongoDB Atlas (free M0 cluster)

---

## 🏗 High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                     │
│  Next.js 16 App Router + TypeScript + Tailwind CSS v4  │
│                                                         │
│  Pages: /, /login, /register, /dashboard,              │
│         /trips/create, /trips/[id], /trips/[id]/budget  │
│         /trips/[id]/itinerary, /trips/[id]/map,         │
│         /trips/[id]/hotels, /trips/[id]/packing,        │
│         /trips/[id]/journal, /trips/[id]/weather,       │
│         /admin/api-health                               │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP REST (JSON)
                           │ Authorization: Bearer <JWT>
┌──────────────────────────▼──────────────────────────────┐
│              Express.js REST API Gateway                │
│                    (Port 5000)                          │
│                                                         │
│  Routes:                                                │
│  POST /api/auth/register  POST /api/auth/login          │
│  GET/POST/PUT/DELETE /api/trips/*                       │
│  GET /api/admin/health                                  │
│                                                         │
│  Middleware: JWT Auth → Zod Validation → Controller     │
└────┬───────────────┬──────────────────┬─────────────────┘
     │               │                  │
     ▼               ▼                  ▼
┌─────────┐  ┌──────────────┐  ┌──────────────────────────┐
│ MongoDB │  │  AI Service  │  │   External API Services  │
│  Atlas  │  │  (Cascading) │  │                          │
│         │  │              │  │  • Google Places API     │
│ Users   │  │ 1. Groq      │  │  • Google Geocoding API  │
│ Trips   │  │    (Primary) │  │  • Google Directions API │
│         │  │ 2. OpenRouter│  │  • OpenWeather API       │
│         │  │    (Fallback)│  │                          │
│         │  │ 3. DeepSeek  │  └──────────────────────────┘
│         │  │  (Emergency) │
└─────────┘  └──────────────┘
```

### Request Lifecycle — Trip Generation

```
User submits form
       │
       ▼
POST /api/trips  →  JWT Auth  →  Zod Validation
       │
       ▼
1. Geocode destination + origin (Google Geocoding)
2. Fetch real hotels (Google Places)
3. Fetch real attractions (Google Places)
4. Fetch weather forecast (OpenWeather)
5. AI organizes attractions → structured itinerary (Groq/OpenRouter/DeepSeek)
6. For each day: fetch nearby restaurants (Google Places)
7. For each day: compute driving route (Google Directions)
8. Calculate Haversine intercity distance → transport cost
9. Compute budget breakdown (accommodation + food + transport + activities)
10. Generate weather-aware packing list
11. Lookup nearby hospitals + embassy (Google Places)
12. Save complete Trip document to MongoDB
13. Return 201 JSON response to client
```

---

## 🔐 Authentication & Authorization

### Mechanism

- **Registration**: Password hashed with `bcryptjs` (10 salt rounds). JWT signed with `JWT_SECRET` (7-day expiry).
- **Login**: Email + bcrypt comparison → JWT returned.
- **Protected Routes**: All `/api/trips/*` routes pass through `middleware/auth.js` which:
  1. Extracts `Authorization: Bearer <token>` header
  2. Verifies the JWT with `jsonwebtoken.verify()`
  3. Attaches `req.user = { id, email }` to the request
  4. Returns `401 Unauthorized` if token is missing, expired, or tampered

### Data Isolation

Every database query on the trip resource is scoped to the authenticated user:

```js
// Read — user can only see their own trips
Trip.find({ userId: req.user.id })

// Update/Delete — user can only modify their own trip
Trip.findOne({ _id: req.params.id, userId: req.user.id })
```

This prevents any cross-user data leakage at the database query level (not just middleware).

### Frontend Token Storage

JWT is stored in `localStorage` and attached as a Bearer header in every API call via `src/utils/api.ts`. On logout, the token is cleared and the user is redirected to `/login`.

---

## 🤖 AI Agent Design & Purpose

### Architecture: Single Prompt Agent with Cascading Providers

The AI layer (`backend/services/aiService.js`) is a **single-prompt AI agent** that solves a constrained optimization problem: *given a list of real geocoded attractions, how should they be arranged across N days to maximize interest and minimize travel transit time?*

### Why Not Let AI Invent Place Names?

Previous versions allowed the AI to generate attraction names freely. This caused:
- Hallucinated names ("Luxury Palace Resort", "Tokyo Skytree in Bangalore")
- Broken geocoding (can't map invented places to lat/lng)
- Budget estimation errors (no real cost data)

**Solution**: The backend first queries Google Places for real, geocoded attractions. These are then passed as a **strict allowlist** to the AI prompt:

```
You MUST ONLY use the attractions provided in the list below.
DO NOT invent any attraction names.
[Attraction 1] Name: "Bangalore Palace", Lat: 12.9988, Lng: 77.5921
[Attraction 2] Name: "Cubbon Park", Lat: 12.9763, Lng: 77.5929
...
```

### Two AI Functions

| Function | Input | Output |
|---|---|---|
| `generateItinerary()` | Destination, duration, budget, interests, attractions list | Full day-by-day itinerary JSON + risk warnings |
| `regenerateDay()` | Trip, day number, user instruction, attractions list | Single regenerated day JSON |

### Cascading Fallback Logic

```js
async function runAIWithFallback(prompt) {
  // Try Groq first (fastest)
  try { return await callGroq(prompt); } catch {}

  // Fall back to OpenRouter
  try { return await callOpenRouter(prompt); } catch {}

  // Emergency fallback: DeepSeek
  try { return await callDeepSeek(prompt); } catch {}

  throw new Error("All AI providers failed");
}
```

All three providers use the same `callOpenAIChatAPI()` helper since they all implement the OpenAI chat completions format.

---

## ✨ Creative / Custom Features

### 1. Zero-Demo Strategy — Real Data Only

No mock data. No hardcoded "Tokyo" or "Spain" sample trips. Every attraction, hotel, restaurant, and route is fetched live from Google APIs. If an API fails, the trip generation fails with a clear error rather than showing fake data.

### 2. Country Cost Index Budget Engine

Budget estimation is calibrated using a country cost index multiplier:

| Region | Index |
|---|---|
| India, SE Asia | 0.35 |
| Europe, USA, UK | 1.25 |
| Japan, Singapore, Australia | 1.0 |
| All others | 0.8 |

Combined with budget tier multipliers (Low=0.6×, Medium=1.0×, High=2.5×) and specific city overrides (e.g. exact INR pricing for Bangalore), the system produces realistic local-market budget estimates rather than global averages.

### 3. Intercity Transport Mode Detection

The system automatically determines whether you would fly or take a train:

```
International trip?           → Flight
Domestic + High budget + >120 miles → Flight
Domestic + Medium + >450 miles     → Flight
Domestic + Low + >800 miles        → Flight
Otherwise                          → Train/Bus
```

This prevents the classic bug of showing "₹20,000 flight" for a 30km local trip.

### 4. Weather-Aware Packing List Generator

Packing list items are dynamically selected based on:
- Temperature (< 55°F → thermals, > 80°F → sunscreen & hat)
- Rain probability (> 30% → umbrella + raincoat)
- Wind speed (> 15 mph → windbreaker)
- International travel (→ passport, visa, insurance)
- User interests (Nature/Adventure → hiking boots; Food → sanitizer)

### 5. Emergency Assistance Card

Each trip stores a country-specific emergency card:
- Local police number (112 / 911 / 110 / 999)
- Ambulance number
- Nearest hospitals (from Google Places)
- Embassy contact (for international trips, from Google Places)

### 6. Live API Health Dashboard

`GET /api/admin/health` runs live connectivity tests against all 8 external services and returns pass/fail status with response times and suggested fixes for each failure. Displayed in the frontend at `/admin/api-health`.

### 7. Global Currency Toggle (USD ↔ INR)

The budget display can be toggled between USD and INR at runtime in the header. All budget values (transport, hotel, food, activities) are re-rendered in the selected currency without re-fetching data.

### 8. Travel Journal & Memory Vault

After completing a trip, users can:
- Write diary-style journal notes
- Rate individual activities (1–5 stars)
- Attach photo URLs
- Save and update journal entries through the standard `PUT /api/trips/:id` endpoint

---

## ⚖️ Key Design Decisions & Trade-offs

| Decision | Choice | Trade-off |
|---|---|---|
| **AI provider architecture** | Cascading fallback chain | More complex than a single provider; but resilient to rate limits and outages |
| **Place data source** | Google Places API only | Highest quality real-world data; costs money at scale (free tier covers dev usage) |
| **AI role** | Organizer, not inventor | AI can only arrange real places; loses creative freedom but eliminates hallucination |
| **Database** | MongoDB document model | Nested trip data fits naturally; joins would be complex in SQL |
| **Auth strategy** | Stateless JWT (7d) | No session storage needed; downside is tokens can't be invalidated server-side before expiry |
| **Budget engine** | Custom rule-based engine | More transparent and correctable than asking AI to estimate budgets (AI budgets were wildly inaccurate) |
| **Frontend framework** | Next.js App Router | Built-in SSR, layouts, and routing; tradeoff is React 19 + Tailwind v4 ecosystem is newer with fewer resources |
| **In-memory fallback DB** | `mongodb-memory-server` | Enables zero-config local grading; not suitable for production |
| **No ORM query builder** | Raw Mongoose queries | Simpler, more explicit; less abstraction overhead for this project size |

---

## ⚠️ Known Limitations

1. **Google API rate limits**: Google Places API has a free tier limit. Heavy concurrent use may hit quota errors. Each trip generation calls Places API ~5 times (geocode, hotels, attractions, restaurants per day, hospitals).

2. **AI JSON reliability**: Although the prompt instructs the AI to return only valid JSON, occasionally a provider may return malformed JSON (especially on complex multi-day trips). The backend catches parse errors and returns a 400.

3. **No token invalidation**: JWTs cannot be revoked server-side. Logout is client-side only (token cleared from localStorage). A Redis-based blocklist would be needed for production.

4. **No image upload**: Journal photo entries accept URL strings only — no file upload capability is implemented.

5. **Single currency conversion**: The USD ↔ INR toggle uses a hardcoded exchange rate (83.5). A live forex API would make this accurate.

6. **No trip sharing**: Trips are strictly private to their owner. No public share links or collaborative planning.

7. **Weather forecast limited to 5 days**: OpenWeather free tier only provides a 5-day forecast. Trips longer than 5 days will use the first available forecast data for packing recommendations.

---

## 📡 API Reference

Base URL: `http://localhost:5000`

All protected routes require: `Authorization: Bearer <jwt_token>`

---

### 🔑 Authentication Routes

#### `POST /api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response `201`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "64abc...", "email": "user@example.com" }
}
```

**Errors:** `400` (missing fields), `400` (email already exists), `500` (server error)

---

#### `POST /api/auth/login`
Authenticate and receive a JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response `200`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "64abc...", "email": "user@example.com" }
}
```

**Errors:** `400` (missing fields), `400` (invalid credentials), `500` (server error)

---

### 🗺️ Trip Routes (All Protected — JWT Required)

#### `GET /api/trips`
Get all trips belonging to the authenticated user.

**Query Parameters (optional):**
| Param | Type | Description |
|---|---|---|
| `search` | string | Filter by destination name (case-insensitive regex) |
| `budget` | string | Filter by budget tier (`Low`, `Medium`, `High`) |

**Response `200`:** Array of Trip objects, sorted by `startDate` descending.

---

#### `GET /api/trips/:id`
Get a single trip by ID. Returns `404` if the trip doesn't belong to the authenticated user.

**Response `200`:** Full Trip object with itinerary, hotels, routes, budget, packing list, journal, emergency info, and weather.

---

#### `POST /api/trips`
Generate a new AI-powered trip plan. This is the primary endpoint that orchestrates all external APIs.

**Request Body:**
```json
{
  "originCity": "Hyderabad",
  "destination": "Bangalore",
  "country": "India",
  "durationDays": 3,
  "budgetTier": "Medium",
  "travelers": 2,
  "interests": ["Culture", "Food", "Nature"],
  "startDate": "2026-08-01",
  "endDate": "2026-08-03"
}
```

| Field | Type | Required | Values |
|---|---|---|---|
| `originCity` | string | Yes | Departure city |
| `destination` | string | Yes | Target city |
| `country` | string | Yes | Target country |
| `durationDays` | number | Yes | 1–30 |
| `budgetTier` | string | Yes | `Low`, `Medium`, `High` |
| `travelers` | number | No | Default: 1 |
| `interests` | string[] | No | e.g. `["Culture", "Adventure", "Food", "Nature", "Shopping"]` |
| `startDate` | ISO date | No | Trip start date |
| `endDate` | ISO date | No | Trip end date |

**Response `201`:** Complete Trip object.

**Errors:** `400` (validation error or geocoding failure), `500` (AI or DB error)

---

#### `PUT /api/trips/:id`
Update a trip. Supports partial updates for itinerary, packing list, and journal entries.

**Request Body (any combination):**
```json
{
  "itinerary": [...],
  "packingList": [...],
  "journalEntries": [
    {
      "notes": "Amazing first day!",
      "photos": [],
      "activityRatings": [{ "activityId": "act1", "rating": 5 }]
    }
  ]
}
```

**Response `200`:** Updated Trip object.

**Errors:** `404` (not found/unauthorized), `500` (save failure)

---

#### `DELETE /api/trips/:id`
Permanently delete a trip.

**Response `200`:**
```json
{ "message": "Trip deleted" }
```

**Errors:** `404` (not found/unauthorized), `500` (delete failure)

---

#### `POST /api/trips/:id/regenerate-day`
Use AI to regenerate the activities for a specific day based on user instructions.

**Request Body:**
```json
{
  "dayNumber": 2,
  "promptText": "Focus on outdoor parks and gardens, avoid museums"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `dayNumber` | number | Yes | Day to regenerate (1-indexed) |
| `promptText` | string | Yes | User instructions for the AI |

**Response `200`:** Updated Trip object with the regenerated day and recalculated budget/routes.

**Errors:** `404` (trip not found), `500` (AI or routing failure)

---

### 🛡️ Admin Routes

#### `GET /api/admin/health`
Run live connectivity diagnostics against all external services. No authentication required.

**Response `200`:**
```json
{
  "mongodb": true,
  "openrouter": true,
  "deepseek": false,
  "grok": true,
  "googlePlaces": true,
  "geocoding": true,
  "directions": true,
  "weather": true,
  "diagnostics": {
    "mongodb": {
      "status": "PASS",
      "responseTimeMs": 12,
      "error": null,
      "suggestedFix": null
    },
    "deepseek": {
      "status": "FAIL",
      "responseTimeMs": 4001,
      "error": "DeepSeek returned status 401: Unauthorized",
      "suggestedFix": "Verify DEEPSEEK_API_KEY in backend/.env is active..."
    }
  }
}
```

Services tested: `mongodb`, `openrouter`, `deepseek`, `grok`, `googlePlaces`, `geocoding`, `directions`, `weather`

---

### 🖥️ System Routes

#### `GET /health`
Simple server liveness check.

**Response `200`:**
```json
{ "status": "healthy", "timestamp": "2026-06-19T17:45:00.000Z" }
```

---

### 📱 Frontend Pages & Routes

| Route | Description |
|---|---|
| `/` | Landing page — hero section, feature overview |
| `/login` | User login form |
| `/register` | User registration form |
| `/dashboard` | Overview of all user trips + quick stats |
| `/trips/create` | Multi-step trip creation form |
| `/trips` | Full list of user trips with search/filter |
| `/trips/[id]` | Trip overview — summary, risk warnings, emergency card |
| `/trips/[id]/itinerary` | Day-by-day itinerary with AI regeneration per day |
| `/trips/[id]/budget` | Budget breakdown by category + per-traveler estimate |
| `/trips/[id]/hotels` | Hotel options filtered by budget tier |
| `/trips/[id]/map` | Interactive route map with daily polylines |
| `/trips/[id]/packing` | Weather-aware packing checklist |
| `/trips/[id]/journal` | Travel diary with activity ratings |
| `/trips/[id]/weather` | Weather forecast for trip duration |
| `/profile` | User profile settings |
| `/settings` | App preferences |
| `/admin/api-health` | Live API connectivity dashboard |

---

## 👥 Authors

**K. Bhargav Reddy & Suma** — 1DS22CS099  
Dayananda Sagar College of Engineering

---

## 📄 License

This project is for academic/educational purposes.
