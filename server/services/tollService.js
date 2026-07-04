/**
 * Google's free Directions API does not return toll amounts in most regions.
 * For a real number, integrate a dedicated provider such as TollGuru
 * (https://tollguru.com/) here — it accepts an encoded polyline and vehicle type
 * and returns actual toll costs. This heuristic estimates a rough cost per toll
 * road segment as a placeholder that keeps scoring functional out of the box.
 */

const AVG_TOLL_COST_PER_TOLL_ROAD_SEGMENT = 65; // flat estimate, local currency

function estimateTolls({ legs, vehicle = 'car' }) {
  let tollSegments = 0;

  for (const leg of legs) {
    for (const step of leg.steps || []) {
      const instruction = (step.html_instructions || '').toLowerCase();
      if (instruction.includes('toll')) tollSegments += 1;
    }
  }

  const multiplier = vehicle === 'truck' ? 2 : vehicle === 'bike' ? 0.5 : 1;
  const estimatedTollCost = Math.round(tollSegments * AVG_TOLL_COST_PER_TOLL_ROAD_SEGMENT * multiplier);

  return { tollSegments, estimatedTollCost, hasTolls: tollSegments > 0 };
}

module.exports = { estimateTolls };
