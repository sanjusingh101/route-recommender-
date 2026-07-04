const maps = require('./googleMapsService');
const weatherService = require('./weatherService');
const fuelService = require('./fuelPriceService');
const tollService = require('./tollService');

const PLACE_TYPES = [
  { type: 'restaurant', label: 'restaurant' },
  { type: 'lodging', label: 'hotel' },
  { type: 'gas_station', label: 'fuel' },
  { type: 'hospital', label: 'hospital' },
  { type: 'police', label: 'police' },
];

/**
 * Very rough heuristic road-quality/safety scorer based on step count density,
 * highway usage and number of maneuvers per km (more turns ~ more urban/complex driving).
 * Swap for a real source (e.g. government road-condition datasets) when available.
 */
function estimateRoadQualityAndSafety({ legs, distanceMeters }) {
  const totalSteps = legs.reduce((sum, leg) => sum + (leg.steps?.length || 0), 0);
  const distanceKm = distanceMeters / 1000;
  const maneuversPerKm = totalSteps / Math.max(distanceKm, 1);

  // Fewer maneuvers per km generally implies more highway/expressway driving -> smoother roads.
  const roadQualityScore = Math.max(0, Math.min(100, 100 - maneuversPerKm * 8));
  // Safety heuristic: penalize very high maneuver density (urban complexity) and very long distances.
  const safetyScore = Math.max(0, Math.min(100, 90 - maneuversPerKm * 5 - Math.min(distanceKm / 50, 15)));

  return {
    roadQualityScore: Math.round(roadQualityScore),
    safetyScore: Math.round(safetyScore),
  };
}

async function collectPlacesAlongRoute(polyline) {
  const points = maps.decodePolyline(polyline);
  const samplePoints = maps.sampleEvenlySpaced(points, 5); // check 5 points along the route

  const allPlaces = [];
  for (const point of samplePoints) {
    for (const { type, label } of PLACE_TYPES) {
      try {
        const results = await maps.nearbyPlaces({ lat: point.lat, lng: point.lng, type, radius: 4000 });
        results.slice(0, 3).forEach((p) => {
          allPlaces.push({
            name: p.name,
            type: label,
            location: p.location,
            rating: p.rating,
            distanceFromRouteMeters: null, // would need a proper point-to-polyline calc for a real number
          });
        });
      } catch (err) {
        // Don't let one place-type failure kill the whole route collection.
        console.warn(`Places lookup failed for type=${type}:`, err.message);
      }
    }
  }

  // De-duplicate by name+type
  const seen = new Set();
  return allPlaces.filter((p) => {
    const key = `${p.type}:${p.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Collect and enrich every alternative route between two geocoded points.
 */
async function collectRoutes({ source, destination, preferences }) {
  const avoid = [];
  if (preferences?.avoid?.tolls) avoid.push('tolls');
  if (preferences?.avoid?.highways) avoid.push('highways');
  if (preferences?.avoid?.ferries) avoid.push('ferries');

  const rawRoutes = await maps.getDirections({
    origin: source,
    destination,
    avoid,
    departureTime: preferences?.departureTime,
  });

  const enriched = [];
  let index = 0;

  for (const route of rawRoutes) {
    const label = `Route ${String.fromCharCode(65 + index)}`; // Route A, B, C...
    const leg = route.legs[0]; // single origin/destination -> one leg
    const distanceMeters = route.legs.reduce((s, l) => s + l.distance.value, 0);
    const durationSeconds = route.legs.reduce((s, l) => s + l.duration.value, 0);

    const [trafficData, weather, roadStats] = await Promise.all([
      maps
        .getDistanceMatrix({ origin: source, destination, departureTime: preferences?.departureTime })
        .catch(() => null),
      weatherService.getWeather(leg.end_location),
      Promise.resolve(estimateRoadQualityAndSafety({ legs: route.legs, distanceMeters })),
    ]);

    const fuel = fuelService.estimateFuelCost({
      distanceMeters,
      vehicle: preferences?.vehicle,
      customEfficiencyKmpl: preferences?.fuelEfficiencyKmpl,
    });
    const tolls = tollService.estimateTolls({ legs: route.legs, vehicle: preferences?.vehicle });
    const places = await collectPlacesAlongRoute(route.overview_polyline.points);

    enriched.push({
      label,
      summary: route.summary,
      distanceMeters,
      durationSeconds,
      durationInTrafficSeconds: trafficData?.duration_in_traffic?.value ?? durationSeconds,
      polyline: route.overview_polyline.points,
      hasTolls: tolls.hasTolls,
      hasHighways: /highway|expressway|NH-|SH-/i.test(route.summary || ''),
      hasFerries: (route.warnings || []).some((w) => /ferry/i.test(w)),
      estimatedFuelLiters: fuel.estimatedFuelLiters,
      estimatedFuelCost: fuel.estimatedFuelCost,
      estimatedTollCost: tolls.estimatedTollCost,
      weather,
      roadQualityScore: roadStats.roadQualityScore,
      safetyScore: roadStats.safetyScore,
      nightDrivingSuitable: roadStats.safetyScore >= 60,
      places,
    });

    index += 1;
  }

  return enriched;
}

module.exports = { collectRoutes };
