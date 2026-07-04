/**
 * There is no free, universally-available real-time fuel price API.
 * This service is deliberately isolated so a real provider (e.g. CollectAPI Gas Price,
 * or a regional government open-data feed) can be swapped in without touching callers.
 */

const VEHICLE_EFFICIENCY_KMPL = {
  car: 15,
  bike: 40,
  truck: 6,
  ev: null, // EVs handled separately, in km/kWh terms
};

const EV_EFFICIENCY_KM_PER_KWH = 6;
const EV_PRICE_PER_KWH = 8; // fallback simulated electricity price

function getFuelPricePerLiter() {
  return Number(process.env.FUEL_PRICE_PER_LITER) || 105;
}

function estimateFuelCost({ distanceMeters, vehicle = 'car', customEfficiencyKmpl }) {
  const distanceKm = distanceMeters / 1000;

  if (vehicle === 'ev') {
    const kwhUsed = distanceKm / EV_EFFICIENCY_KM_PER_KWH;
    return {
      estimatedFuelLiters: 0,
      estimatedFuelCost: Math.round(kwhUsed * EV_PRICE_PER_KWH),
      unit: 'kWh',
      amountUsed: Number(kwhUsed.toFixed(2)),
    };
  }

  const efficiency = customEfficiencyKmpl || VEHICLE_EFFICIENCY_KMPL[vehicle] || 15;
  const litersUsed = distanceKm / efficiency;
  const cost = litersUsed * getFuelPricePerLiter();

  return {
    estimatedFuelLiters: Number(litersUsed.toFixed(2)),
    estimatedFuelCost: Math.round(cost),
    unit: 'liters',
    amountUsed: Number(litersUsed.toFixed(2)),
  };
}

module.exports = { estimateFuelCost, getFuelPricePerLiter };
