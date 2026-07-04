/**
 * Modular, configurable scoring engine.
 * Every individual score is normalized to 0-100. The overall score is a weighted
 * sum of the individual scores, using either default weights or weights derived
 * from the user's stated priorities.
 */

const DEFAULT_WEIGHTS = {
  budget: 0.25,
  speed: 0.2,
  safety: 0.15,
  comfort: 0.15,
  food: 0.1,
  scenic: 0.1,
  adventure: 0.05,
};

/** Normalize a raw value into 0-100, inverted if lower-is-better. */
function normalize(value, min, max, invert = false) {
  if (max === min) return 50;
  const clamped = Math.max(min, Math.min(max, value));
  const pct = ((clamped - min) / (max - min)) * 100;
  return invert ? 100 - pct : pct;
}

function buildWeightsFromPreferences(preferences) {
  const p = preferences?.priorities || {};
  const raw = {
    speed: p.fastest ?? 1,
    budget: p.cheapest ?? 1,
    comfort: p.comfort ?? 1,
    safety: p.safety ?? 1,
    food: p.food ?? 0.5,
    scenic: p.scenic ?? 0.5,
    adventure: p.adventure ?? 0.3,
  };
  const total = Object.values(raw).reduce((s, v) => s + v, 0) || 1;
  const normalized = {};
  Object.entries(raw).forEach(([k, v]) => {
    normalized[k] = v / total;
  });
  return normalized;
}

/**
 * Score a single enriched route option against the full set (for relative normalization
 * of distance/time/cost, which only make sense compared against alternatives).
 */
function scoreRoute(route, allRoutes, preferences = {}) {
  const distances = allRoutes.map((r) => r.distanceMeters);
  const durations = allRoutes.map((r) => r.durationInTrafficSeconds);
  const costs = allRoutes.map((r) => r.estimatedFuelCost + r.estimatedTollCost);

  const totalCost = route.estimatedFuelCost + route.estimatedTollCost;

  const speed = normalize(route.durationInTrafficSeconds, Math.min(...durations), Math.max(...durations), true);
  const budget = normalize(totalCost, Math.min(...costs), Math.max(...costs), true);
  const safety = route.safetyScore; // already 0-100
  const roadQuality = route.roadQualityScore; // already 0-100

  const comfort = Math.round(
    roadQuality * 0.5 + safety * 0.2 + (route.nightDrivingSuitable ? 15 : 0) + (route.hasHighways ? 15 : 0)
  );

  const restaurantCount = route.places.filter((p) => p.type === 'restaurant').length;
  const hotelCount = route.places.filter((p) => p.type === 'hotel').length;
  const food = Math.min(100, restaurantCount * 12);
  const familyFriendly = Math.min(100, hotelCount * 15 + restaurantCount * 5 + safety * 0.3);

  // Scenic/adventure have no dedicated data source in this build; derive a light
  // heuristic from route complexity and place diversity rather than inventing data.
  const placeDiversity = new Set(route.places.map((p) => p.type)).size;
  const scenic = Math.min(100, placeDiversity * 12 + (route.hasHighways ? 0 : 20));
  const adventure = Math.min(100, (100 - roadQuality) * 0.6 + placeDiversity * 5);

  const scores = {
    speed: Math.round(speed),
    budget: Math.round(budget),
    comfort: Math.round(comfort),
    safety: Math.round(safety),
    food: Math.round(food),
    scenic: Math.round(scenic),
    adventure: Math.round(adventure),
    familyFriendly: Math.round(familyFriendly),
    roadQuality: Math.round(roadQuality),
  };

  const weights = preferences.useCustomWeights
    ? preferences.customWeights
    : buildWeightsFromPreferences(preferences);

  const overall = Object.entries(weights).reduce((sum, [key, weight]) => {
    return sum + (scores[key] ?? 0) * weight;
  }, 0);

  scores.overall = Math.round(overall);

  return scores;
}

function scoreAllRoutes(routes, preferences = {}) {
  return routes.map((route) => ({
    ...route,
    scores: scoreRoute(route, routes, preferences),
  }));
}

module.exports = { scoreAllRoutes, scoreRoute, DEFAULT_WEIGHTS, buildWeightsFromPreferences };
