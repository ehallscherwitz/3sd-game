import { DROP_TIER_CAP } from '../game/constants.js';

/**
 * Drop table.
 * The unlocked ceiling grows with the biggest fruit the player has created,
 * and it never passes DROP_TIER_CAP. Each larger tier weighs (steps above it)^2,
 * so it is strictly less likely than every smaller tier in the same roll.
 *
 * highest 0 → 100% tier 0
 * highest 1 → tier 0 = 4, tier 1 = 1
 * highest 4+ → 25, 16, 9, 4, 1
 */
export function dropWeights(highestTierCreated) {
  const unlocked = Math.min(DROP_TIER_CAP, Math.max(0, highestTierCreated));
  const weights = [];
  for (let tier = 0; tier <= unlocked; tier += 1) {
    const stepsAbove = unlocked - tier + 1;
    weights.push(stepsAbove * stepsAbove);
  }
  return weights;
}

export function rollDropTier(highestTierCreated, random = Math.random) {
  const weights = dropWeights(highestTierCreated);
  let total = 0;
  for (const weight of weights) total += weight;

  let roll = random() * total;
  for (let tier = 0; tier < weights.length; tier += 1) {
    roll -= weights[tier];
    if (roll < 0) return tier;
  }
  return 0;
}
