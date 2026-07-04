const express = require('express');
const {
  searchRoutes,
  getRouteSearch,
  getHistory,
  chatAboutSearch,
  favoriteRoute,
  listFavorites,
} = require('../controllers/routeController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/search', searchRoutes);
router.get('/history', getHistory);
router.get('/favorites', listFavorites);
router.get('/:id', getRouteSearch);
router.post('/:id/chat', chatAboutSearch);
router.post('/:id/favorite', favoriteRoute);

module.exports = router;
