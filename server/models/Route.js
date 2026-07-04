const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema(
  {
    name: String,
    type: String, // restaurant | hotel | fuel | ev_charging | hospital | police | rest_stop
    location: { lat: Number, lng: Number },
    rating: Number,
    distanceFromRouteMeters: Number,
  },
  { _id: false }
);

const routeOptionSchema = new mongoose.Schema(
  {
    label: String, // "Route A", "Route B" ...
    summary: String, // Google's route summary (main roads used)
    distanceMeters: Number,
    durationSeconds: Number,
    durationInTrafficSeconds: Number,
    polyline: String,
    hasTolls: Boolean,
    hasHighways: Boolean,
    hasFerries: Boolean,
    estimatedFuelLiters: Number,
    estimatedFuelCost: Number,
    estimatedTollCost: Number,
    weather: {
      condition: String,
      tempC: Number,
      description: String,
    },
    roadQualityScore: Number, // 0-100 heuristic
    safetyScore: Number, // 0-100 heuristic
    nightDrivingSuitable: Boolean,
    places: [placeSchema],
    scores: {
      speed: Number,
      budget: Number,
      comfort: Number,
      safety: Number,
      food: Number,
      scenic: Number,
      adventure: Number,
      familyFriendly: Number,
      roadQuality: Number,
      overall: Number,
    },
    aiExplanation: String,
  },
  { _id: true }
);

const routeSearchSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    source: { address: String, lat: Number, lng: Number },
    destination: { address: String, lat: Number, lng: Number },
    preferences: { type: mongoose.Schema.Types.Mixed },
    options: [routeOptionSchema],
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RouteSearch', routeSearchSchema);
