const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    routeSearch: { type: mongoose.Schema.Types.ObjectId, ref: 'RouteSearch', required: true },
    routeOptionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    note: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Favorite', favoriteSchema);
