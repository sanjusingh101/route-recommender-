const asyncHandler = require('express-async-handler');
const maps = require('../services/googleMapsService');
const { collectRoutes } = require('../services/routeCollectionService');
const { scoreAllRoutes } = require('../recommendation/scoringEngine');
const { explainAllRoutes, chatAboutRoutes } = require('../recommendation/aiExplainer');
const RouteSearch = require('../models/Route');
const Favorite = require('../models/Favorite');

// @desc  Search + collect + score + (optionally) explain routes
// @route POST /api/routes/search
const searchRoutes = asyncHandler(async (req, res) => {
  const { source, destination, preferences = {}, includeAiExplanation = true } = req.body;

  if (!source || !destination) {
    res.status(400);
    throw new Error('source and destination are required');
  }

  const sourceGeo = source.lat && source.lng ? source : await maps.geocode(source.address || source);
  const destGeo = destination.lat && destination.lng ? destination : await maps.geocode(destination.address || destination);

  const rawRoutes = await collectRoutes({ source: sourceGeo, destination: destGeo, preferences });

  if (rawRoutes.length === 0) {
    res.status(404);
    throw new Error('No routes could be found between these locations');
  }

  let scoredRoutes = scoreAllRoutes(rawRoutes, preferences);

  if (includeAiExplanation) {
    scoredRoutes = await explainAllRoutes(scoredRoutes);
  }

  const search = await RouteSearch.create({
    user: req.user._id,
    source: { address: source.address || source, ...sourceGeo },
    destination: { address: destination.address || destination, ...destGeo },
    preferences,
    options: scoredRoutes,
  });

  res.status(201).json(search);
});

// @desc  Get a saved search by id
// @route GET /api/routes/:id
const getRouteSearch = asyncHandler(async (req, res) => {
  const search = await RouteSearch.findOne({ _id: req.params.id, user: req.user._id });
  if (!search) {
    res.status(404);
    throw new Error('Route search not found');
  }
  res.json(search);
});

// @desc  Get the current user's search history
// @route GET /api/routes/history
const getHistory = asyncHandler(async (req, res) => {
  const searches = await RouteSearch.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .select('source destination createdAt options.label options.scores.overall');
  res.json(searches);
});

// @desc  Ask a free-form question about a previously collected route set
// @route POST /api/routes/:id/chat
const chatAboutSearch = asyncHandler(async (req, res) => {
  const { question } = req.body;
  if (!question) {
    res.status(400);
    throw new Error('question is required');
  }

  const search = await RouteSearch.findOne({ _id: req.params.id, user: req.user._id });
  if (!search) {
    res.status(404);
    throw new Error('Route search not found');
  }

  const answer = await chatAboutRoutes(question, search.options);
  res.json({ answer });
});

// @desc  Save a route option as a favorite
// @route POST /api/routes/:id/favorite
const favoriteRoute = asyncHandler(async (req, res) => {
  const { routeOptionId, note } = req.body;

  const search = await RouteSearch.findOne({ _id: req.params.id, user: req.user._id });
  if (!search) {
    res.status(404);
    throw new Error('Route search not found');
  }
  const exists = search.options.id(routeOptionId);
  if (!exists) {
    res.status(404);
    throw new Error('Route option not found in this search');
  }

  const favorite = await Favorite.create({
    user: req.user._id,
    routeSearch: search._id,
    routeOptionId,
    note,
  });

  res.status(201).json(favorite);
});

// @desc  List favorites
// @route GET /api/routes/favorites
const listFavorites = asyncHandler(async (req, res) => {
  const favorites = await Favorite.find({ user: req.user._id }).populate('routeSearch');
  res.json(favorites);
});

module.exports = {
  searchRoutes,
  getRouteSearch,
  getHistory,
  chatAboutSearch,
  favoriteRoute,
  listFavorites,
};
