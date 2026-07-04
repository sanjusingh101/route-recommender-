# AI Route Recommendation & Travel Decision System

An AI-assisted system that collects candidate routes between two points, scores them against
weighted, configurable criteria (budget, speed, safety, comfort, food, scenic, adventure), and
uses an LLM strictly as an *explainer* over that already-collected data (never as a source of
new facts).

## What's real vs. simulated in this build

Being upfront about this matters more than pretending everything is live:

| Feature | Status |
|---|---|
| Auth (register/login/JWT) | Real |
| Route collection (distance, time, steps) | Real — Google Directions API |
| Places along route (restaurants, hotels, fuel/EV, hospitals, police) | Real — Google Places API |
| Traffic | Real — Google Distance Matrix `duration_in_traffic` |
| Weather | Real — OpenWeatherMap API |
| Fuel cost | **Simulated** — no public real-time India/global fuel-price API exists that's free; we compute cost from distance × configurable price-per-liter × vehicle efficiency. Swap in a real provider (e.g. CollectAPI Gas Price) by editing `server/services/fuelPriceService.js`. |
| Tolls | **Heuristic** — Google doesn't return toll amounts in most regions via the free tier. We flag toll roads (`route.warnings` / `steps` containing toll indicators) and let you plug in a real toll API (e.g. TollGuru) in `server/services/tollService.js`. |
| Road quality / safety score / accident-prone sections | **Heuristic**, derived from road type, speed variance, and step count — there's no universal public API for this. |
| Scoring engine | Real — modular, configurable weights |
| AI explanation | Real — OpenAI API, fed only the structured route data, prompted not to invent facts |
| Comparison table, favorites, search history | Real (backend + basic frontend) |
| Full interactive multi-route colored map, AI chat, PDF export, analytics dashboard, dark mode | **Not yet built** — see Roadmap below. The architecture has clean slots for all of these. |

## Setup

### Backend
```bash
cd server
npm install
cp .env.example .env   # fill in your keys
npm run dev
```

### Frontend
```bash
cd client
npm install
npm run dev
```

### Required keys (.env)
- `MONGO_URI`
- `JWT_SECRET`
- `GOOGLE_MAPS_API_KEY` (Directions, Places, Distance Matrix, Geocoding enabled)
- `OPENWEATHER_API_KEY`
- `OPENAI_API_KEY`
- `FUEL_PRICE_PER_LITER` (fallback simulated value, e.g. 105 for INR/petrol)

## Roadmap (next increments)
1. Interactive map with colored route overlays (Google Maps JS SDK on the frontend)
2. AI chat endpoint (`POST /api/routes/:id/chat`) reusing the same "explain only collected data" guardrail
3. PDF export of a route summary (`pdfkit` on the backend)
4. Analytics dashboard (aggregate query over SearchHistory)
5. Dark mode + full Tailwind theming
6. Offline saved routes (service worker + IndexedDB cache)

Ask for any of these next and I'll build them into this same structure.
