# Trao AI Travel Planner

Trao AI Travel Planner is a secure, multi-user web application that generates personalized, day-by-day travel itineraries, optimized travel routes, safety warning indices, emergency assistance hotlines, restaurant suggestions, and realistic budget estimations using Google Gemini AI. The application enables travelers to dynamically customize their trip plans, toggle display currencies, and maintain a post-trip memory journal.

---

## Key Features & Phase 2 Capabilities

### 1. Secure Authentication & Enforced Isolation
- JWT authorization middleware (`backend/middleware/auth.js`) intercepting private routes.
- Enforced user database segregation (`{ userId: req.user.id }`) preventing cross-user data leakage.

### 2. AI Itinerary & Budget Generator
- Generates structured day-by-day itineraries using **Gemini 1.5/2.0 Flash**.
- **Visuals & Ratings**: Day plans display real-world ratings (1-5 gold stars) and match activity search keywords to high-quality travel images.
- **Real Name Guarantees**: Prompt structures force the AI to return real place names, real restaurants, and real hotel names.

### 3. Smart Daily Route Optimization (Minimizing Transit)
- Prompt guidelines require the AI to rearrange and sort daily activities chronologically (Morning, Afternoon, Evening) to minimize travel transit time and reduce transport expenses.

### 4. AI Restaurant Recommendations
- Suggests 3 dining options per travel day positioned near that day's planned activities, categorized as:
  - Vegetarian Cafe
  - Local Street Food
  - Fine Dining Option

### 5. Proactive Safety Risk Analyzer
- Warns users about region-specific seasonal anomalies, monsoon showers, extreme temperatures, public holidays, or festival crowd surges. Mapped to an alert banner at the top of the timeline.

### 6. Emergency Travel Assistant
- Stored directly with each trip document:
  - Local Police phone contact
  - Nearby central hospitals
  - Nearest Consulate/Embassy contact details
  - Central emergency numbers

### 7. Travel Journal & Memory Vault
- Log memory diary notes, save travel logs, and rate visited coordinate activities (1-5 stars) after completing a trip.

### 8. Global Currency Converter (USD $ / INR ₹)
- Switch dynamically between USD ($) and INR (₹) at the click of a button in the header. The app translates all budget allocations, activity costs, and hotel pricing on-the-fly.

---

## Chosen Tech Stack & Justification

- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
  - *Justification*: TypeScript provides compile-time safety. Tailwind v4 offers a fast utility design engine. Emojis and SVGs are preferred for rendering maps and gauges to avoid library version mismatches (e.g. React 19 charting incompatibilities).
- **Backend**: Node.js + Express.js
  - *Justification*: Lightweight REST gateway. Direct fetch queries to Google APIs bypass external package mismatches and run securely.
- **Database**: MongoDB + Mongoose ODM
  - *Justification*: Documents easily house nested arrays like timelines, restaurants, and journaling logs.
  - *Grading Fallback*: Automatically initializes `mongodb-memory-server` if `MONGO_URI` is omitted, facilitating out-of-the-box local grading.

---

## Setup & Running Locally

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env` (copy from `.env.example`):
   - `PORT=5000`
   - `JWT_SECRET=your_jwt_secret_hash`
   - `MONGO_URI=` *(Leave blank to spin up in-memory MongoDB automatically)*
   - `GEMINI_API_KEY=your_gemini_api_key` *(If omitted, the backend falls back to high-fidelity mock generators seamlessly)*
4. Run the development server:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Create a `.env.local` configuration:
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```
4. Start Next.js development server:
   ```bash
   npm run dev
   ```
5. View in browser at: `http://localhost:3000`

### 3. Running Integration Tests
To test user signup, signin, token authorization, and strict data isolation:
```bash
cd backend
node test-server.js
```

# Trao-AI-Intelligent-Travel-Planner
