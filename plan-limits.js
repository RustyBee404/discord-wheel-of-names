/**
 * Plan Limits Configuration for Discord Bot
 * Matches the UNIFIED_LIMITS in uplup-frontend/utils/toolLimits.js
 */

// Plan limits by level
// Now matches the updated API limits where Free tier has API access
export const PLAN_LIMITS = {
  // Guest (no API key configured - bot running without Uplup API)
  guest: {
    maxEntries: 50,
    maxPicks: 5,
    maxWinners: 5,
    maxWheels: 0,
    requestsPerHour: 0,
    planName: 'Guest',
    planLevel: 0
  },
  // Free (plan_level = 1) - Now has API access with limits
  free: {
    maxEntries: 100,
    maxPicks: 10,
    maxWinners: 10,
    maxWheels: 3,
    requestsPerHour: 100,
    planName: 'Free',
    planLevel: 1
  },
  // Boost (plan_level = 2)
  boost: {
    maxEntries: -1, // Unlimited
    maxPicks: -1,
    maxWinners: -1,
    maxWheels: -1,
    requestsPerHour: 1000,
    planName: 'Boost',
    planLevel: 2
  },
  // Elevate (plan_level = 5)
  elevate: {
    maxEntries: -1,
    maxPicks: -1,
    maxWinners: -1,
    maxWheels: -1,
    requestsPerHour: 5000,
    planName: 'Elevate',
    planLevel: 5
  },
  // Ultimate (plan_level = 8)
  ultimate: {
    maxEntries: -1,
    maxPicks: -1,
    maxWinners: -1,
    maxWheels: -1,
    requestsPerHour: -1, // Unlimited
    planName: 'Ultimate',
    planLevel: 8
  }
};

/**
 * Get limits for a plan level
 * Plan levels: 0=Guest, 1=Free, 2-4=Boost, 5-7=Elevate, 8+=Ultimate
 */
export function getLimitsForPlanLevel(planLevel) {
  if (planLevel <= 0) return PLAN_LIMITS.guest;
  if (planLevel === 1) return PLAN_LIMITS.free;
  if (planLevel >= 2 && planLevel <= 4) return PLAN_LIMITS.boost;
  if (planLevel >= 5 && planLevel <= 7) return PLAN_LIMITS.elevate;
  if (planLevel >= 8) return PLAN_LIMITS.ultimate;
  return PLAN_LIMITS.free;
}

/**
 * Check if a value exceeds a limit
 * @param {number} limit - The limit (-1 for unlimited)
 * @param {number} value - The current value
 * @returns {boolean} - True if within limit
 */
export function isWithinLimit(limit, value) {
  return limit === -1 || value <= limit;
}

/**
 * Format a limit for display
 */
export function formatLimit(limit) {
  return limit === -1 ? 'Unlimited' : limit.toLocaleString();
}

/**
 * Generate upgrade message
 */
export function getUpgradeMessage(limitType, current, planName) {
  const limits = PLAN_LIMITS.free;
  const boostLimits = PLAN_LIMITS.boost;

  const labels = {
    maxEntries: { singular: 'entry', plural: 'entries', limit: limits.maxEntries },
    maxPicks: { singular: 'spin', plural: 'spins', limit: limits.maxPicks },
    maxWinners: { singular: 'winner', plural: 'winners', limit: limits.maxWinners },
    maxWheels: { singular: 'saved wheel', plural: 'saved wheels', limit: limits.maxWheels }
  };

  const label = labels[limitType];
  if (!label) return null;

  const boostLimit = boostLimits[limitType];
  const boostLimitText = boostLimit === -1 ? 'unlimited' : boostLimit.toLocaleString();

  return {
    title: `${planName} Plan Limit Reached`,
    description: `You have **${current}** ${current === 1 ? label.singular : label.plural}.\n\n` +
      `Your **${planName}** plan allows up to **${label.limit}** ${label.plural}.\n\n` +
      `Upgrade to **Boost** for **${boostLimitText}** ${label.plural}!`,
    upgradeUrl: 'https://uplup.com/pricing'
  };
}

/**
 * Create an embed for limit exceeded error
 */
export function createLimitExceededEmbed(limitType, current, planName, EmbedBuilder) {
  const msg = getUpgradeMessage(limitType, current, planName);
  if (!msg) return null;

  return new EmbedBuilder()
    .setColor(0xFF6B6B) // Red
    .setTitle(`⚠️ ${msg.title}`)
    .setDescription(msg.description)
    .addFields({
      name: '🚀 Upgrade Now',
      value: `[View Pricing](${msg.upgradeUrl})`
    })
    .setFooter({
      text: 'Uplup • uplup.com',
      iconURL: 'https://uplup.com/favicon.ico'
    });
}
