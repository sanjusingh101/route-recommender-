const axios = require('axios');

const BASE = 'https://maps.googleapis.com/maps/api';
const key = () => process.env.GOOGLE_MAPS_API_KEY;

/**
 * Geocode a free-text address into lat/lng.
 */
async function geocode(address) {
  const { data } = await axios.get(`${BASE}/geocode/json`, {
    params: { address, key: key() },
  });
  if (!data.results || data.results.length === 0) {
    throw new Error(`Could not geocode address: ${address}`);
  }
  const { lat, lng } = data.results[0].geometry.location;
  return { lat, lng, formattedAddress: data.results[0].formatted_address };
}

/**
 * Fetch all alternative routes between origin and destination.
 * Returns Google's raw `routes[]` array (each with legs, overview_polyline, warnings, summary).
 */
async function getDirections({ origin, destination, avoid = [], mode = 'driving', departureTime }) {
  const params = {
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    alternatives: true,
    mode,
    key: key(),
  };

  if (avoid.length > 0) {
    // Google supports: tolls, highways, ferries
    params.avoid = avoid.join('|');
  }
  if (departureTime) {
    params.departure_time = Math.floor(new Date(departureTime).getTime() / 1000);
  }

  const { data } = await axios.get(`${BASE}/directions/json`, { params });

  if (data.status !== 'OK') {
    throw new Error(`Directions API error: ${data.status} - ${data.error_message || ''}`);
  }

  return data.routes;
}

/**
 * Get live + traffic-predicted duration for a specific origin/destination pair.
 */
async function getDistanceMatrix({ origin, destination, departureTime }) {
  const params = {
    origins: `${origin.lat},${origin.lng}`,
    destinations: `${destination.lat},${destination.lng}`,
    departure_time: departureTime ? Math.floor(new Date(departureTime).getTime() / 1000) : 'now',
    traffic_model: 'best_guess',
    key: key(),
  };

  const { data } = await axios.get(`${BASE}/distancematrix/json`, { params });
  if (data.status !== 'OK') {
    throw new Error(`Distance Matrix API error: ${data.status}`);
  }
  return data.rows[0].elements[0];
}

/**
 * Search for places of a given type near a lat/lng point (used at intervals along a route).
 */
async function nearbyPlaces({ lat, lng, type, radius = 3000, keyword }) {
  const params = {
    location: `${lat},${lng}`,
    radius,
    type,
    key: key(),
  };
  if (keyword) params.keyword = keyword;

  const { data } = await axios.get(`${BASE}/place/nearbysearch/json`, { params });
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Places API error: ${data.status}`);
  }
  return (data.results || []).map((p) => ({
    name: p.name,
    location: p.geometry.location,
    rating: p.rating || null,
    placeId: p.place_id,
  }));
}

/**
 * Sample N evenly-spaced points along a Google encoded polyline, for POI lookups.
 */
function decodePolyline(encoded) {
  let points = [];
  let index = 0,
    lat = 0,
    lng = 0;

  while (index < encoded.length) {
    let b,
      shift = 0,
      result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

function sampleEvenlySpaced(points, count) {
  if (points.length <= count) return points;
  const step = Math.floor(points.length / count);
  const sampled = [];
  for (let i = 0; i < points.length; i += step) {
    sampled.push(points[i]);
  }
  return sampled.slice(0, count);
}

module.exports = {
  geocode,
  getDirections,
  getDistanceMatrix,
  nearbyPlaces,
  decodePolyline,
  sampleEvenlySpaced,
};
