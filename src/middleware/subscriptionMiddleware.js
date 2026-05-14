/**
 * Subscription Middleware
 * 
 * Enforces subscription tier requirements and usage limits.
 * Attach after authMiddleware to access req.user.
 */

const User = require('../models/User');
const Usage = require('../models/Usage');

// ─── Plan Limits ──────────────────────────────────────────────

const PLAN_LIMITS = {
  free: {
    analyses: 3,
    jobMatches: 1,
    resumeGenerations: 0,
    linkedinAnalyses: 0,
    photoGenerations: 0,
    coverPhotoGenerations: 0,
  },
  pro: {
    analyses: 30,
    jobMatches: 15,
    resumeGenerations: 5,
    linkedinAnalyses: 10,
    photoGenerations: 3,
    coverPhotoGenerations: 3,
  },
  enterprise: {
    analyses: Infinity,
    jobMatches: Infinity,
    resumeGenerations: Infinity,
    linkedinAnalyses: Infinity,
    photoGenerations: 20,
    coverPhotoGenerations: 20,
  },
};

/**
 * Get the current month string (e.g. "2026-05").
 */
function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Get or create the usage record for a user's current month.
 */
async function getOrCreateUsage(userId) {
  const month = getCurrentMonth();
  let usage = await Usage.findOne({ userId, month });
  if (!usage) {
    usage = await Usage.create({ userId, month });
  }
  return usage;
}

/**
 * Middleware: Require a specific subscription plan.
 * Usage: router.post('/route', authMiddleware, requirePlan('pro'), handler)
 * 
 * @param {string} minPlan - Minimum plan required ('pro' or 'enterprise')
 */
function requirePlan(minPlan) {
  const planHierarchy = { free: 0, pro: 1, enterprise: 2 };

  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);
      const userPlan = user?.subscription?.plan || 'free';
      const userStatus = user?.subscription?.status;

      // Free users or expired subscriptions
      if (planHierarchy[userPlan] < planHierarchy[minPlan]) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'PLAN_REQUIRED',
            message: `This feature requires a ${minPlan} subscription or higher.`,
            requiredPlan: minPlan,
            currentPlan: userPlan,
          },
        });
      }

      // Check if subscription is actually active
      if (userPlan !== 'free' && !['active', 'trialing'].includes(userStatus)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'SUBSCRIPTION_INACTIVE',
            message: 'Your subscription is not active. Please update your payment method.',
            status: userStatus,
          },
        });
      }

      // Attach plan info to request for downstream use
      req.userPlan = userPlan;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware: Check usage limit for a specific feature.
 * Usage: router.post('/route', authMiddleware, checkUsage('analyses'), handler)
 * 
 * @param {string} feature - Feature key from PLAN_LIMITS
 */
function checkUsage(feature) {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);
      const userPlan = user?.subscription?.plan || 'free';
      const limit = PLAN_LIMITS[userPlan]?.[feature];

      if (limit === undefined) {
        return next(); // Unknown feature, allow through
      }

      if (limit === 0) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'PLAN_REQUIRED',
            message: `This feature requires a Pro or Enterprise subscription.`,
            currentPlan: userPlan,
          },
        });
      }

      const usage = await getOrCreateUsage(req.user.id);
      const currentUsage = usage[feature] || 0;

      if (currentUsage >= limit) {
        return res.status(429).json({
          success: false,
          error: {
            code: 'USAGE_LIMIT_REACHED',
            message: `You've reached your monthly limit of ${limit} ${feature}. Upgrade your plan for more.`,
            limit,
            used: currentUsage,
            currentPlan: userPlan,
          },
        });
      }

      // Attach usage info for downstream increment
      req.usage = usage;
      req.userPlan = userPlan;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Increment usage counter after successful action.
 * Call this in controllers after the operation succeeds.
 * @param {string} userId
 * @param {string} feature
 */
async function incrementUsage(userId, feature) {
  const month = getCurrentMonth();
  await Usage.findOneAndUpdate(
    { userId, month },
    { $inc: { [feature]: 1 } },
    { upsert: true }
  );
}

/**
 * Get usage summary for a user.
 * @param {string} userId
 * @returns {Promise<Object>}
 */
async function getUsageSummary(userId) {
  const user = await User.findById(userId);
  const plan = user?.subscription?.plan || 'free';
  const limits = PLAN_LIMITS[plan];
  const usage = await getOrCreateUsage(userId);

  const summary = {};
  for (const [feature, limit] of Object.entries(limits)) {
    summary[feature] = {
      used: usage[feature] || 0,
      limit: limit === Infinity ? 'unlimited' : limit,
      remaining: limit === Infinity ? 'unlimited' : Math.max(0, limit - (usage[feature] || 0)),
    };
  }

  return { plan, usage: summary };
}

module.exports = {
  requirePlan,
  checkUsage,
  incrementUsage,
  getUsageSummary,
  PLAN_LIMITS,
};
