const mongoose = require('mongoose');

/**
 * User Model
 * 
 * Enhanced with:
 * - Refresh token storage for JWT rotation
 * - Automatic timestamps (createdAt, updatedAt)
 * - Compound index on email for fast lookups
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Never return password by default
    },

    refreshToken: {
      type: String,
      select: false, // Never return refresh token by default
    },

    // ─── Subscription Fields ────────────────────────────────
    subscription: {
      plan: {
        type: String,
        enum: ['free', 'pro', 'career_pro', 'enterprise'],
        default: 'free',
      },
      stripeCustomerId: { type: String, default: null },
      stripeSubscriptionId: { type: String, default: null },
      status: {
        type: String,
        enum: ['active', 'canceled', 'past_due', 'trialing', 'none'],
        default: 'none',
      },
      currentPeriodEnd: { type: Date, default: null },
    },
  },
  {
    timestamps: true, // Auto createdAt and updatedAt
  }
);

// ─── Indexes ─────────────────────────────────────────────────
// Email index for login lookups (unique already creates one, but explicit for clarity)
userSchema.index({ email: 1 });

module.exports = mongoose.model('User', userSchema);
