const OpenAI = require('openai');
const client = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' });

const SYSTEM_PROMPT = `You are a route-recommendation explainer.
You will be given structured, already-collected data about one or more candidate routes:
distance, duration, traffic, fuel cost, toll cost, weather, road quality score, safety score,
and nearby places (restaurants, hotels, fuel stations, hospitals).

Rules you must follow strictly:
- Only reference facts present in the provided JSON. Never invent a distance, cost, place name,
  or condition that isn't in the data.
- If a field is missing or null, do not guess a value for it; simply omit it from your explanation.
- Be concise: 2-4 sentences per route.
- Write for a traveler deciding between routes, not a developer reading a database.`;

/**
 * Generate a natural-language explanation for one scored route, grounded strictly
 * in its own data. Returns plain text.
 */
async function explainRoute(route) {
  const routeData = {
    label: route.label,
    distanceKm: Math.round(route.distanceMeters / 1000),
    durationMinutes: Math.round(route.durationInTrafficSeconds / 60),
    fuelCost: route.estimatedFuelCost,
    tollCost: route.estimatedTollCost,
    hasTolls: route.hasTolls,
    weather: route.weather,
    roadQualityScore: route.roadQualityScore,
    safetyScore: route.safetyScore,
    restaurantCount: route.places.filter((p) => p.type === 'restaurant').length,
    hotelCount: route.places.filter((p) => p.type === 'hotel').length,
    fuelStationCount: route.places.filter((p) => p.type === 'fuel').length,
    scores: route.scores,
  };

  const response = await client.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    temperature: 0.4,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Explain why this route is or isn't a good choice, using only this data:\n${JSON.stringify(
          routeData
        )}`,
      },
    ],
  });

  return response.choices[0].message.content.trim();
}

/**
 * Explain every route in a set, in parallel, and attach the explanation to each.
 */
async function explainAllRoutes(routes) {
  const explanations = await Promise.all(
    routes.map((r) =>
      explainRoute(r).catch((err) => {
        console.warn(`AI explanation failed for ${r.label}:`, err.message);
        return null; // never block the response over the LLM being down
      })
    )
  );
  return routes.map((r, i) => ({ ...r, aiExplanation: explanations[i] }));
}

/**
 * Free-form chat over an already-collected route set. Same no-invented-facts guardrail.
 */
async function chatAboutRoutes(question, routes) {
  const dataset = routes.map((r) => ({
    label: r.label,
    distanceKm: Math.round(r.distanceMeters / 1000),
    durationMinutes: Math.round(r.durationInTrafficSeconds / 60),
    fuelCost: r.estimatedFuelCost,
    tollCost: r.estimatedTollCost,
    weather: r.weather,
    roadQualityScore: r.roadQualityScore,
    safetyScore: r.safetyScore,
    places: r.places,
    scores: r.scores,
  }));

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.3,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Here is the full dataset of candidate routes: ${JSON.stringify(dataset)}\n\nUser question: ${question}`,
      },
    ],
  });

  return response.choices[0].message.content.trim();
}

module.exports = { explainRoute, explainAllRoutes, chatAboutRoutes };
