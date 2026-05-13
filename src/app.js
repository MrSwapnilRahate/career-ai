/**
 * Express Application Setup
 * 
 * Configures middleware, routes, and error handling.
 * This file ONLY sets up the Express app — no server listening here.
 */

const express = require('express');
const cors = require('cors');
const { config } = require('./config/environment');

const app = express();

// ─── Middleware Imports ───────────────────────────────────────
const { apiLimiter } = require('./middleware/rateLimitMiddleware');
const errorMiddleware = require('./middleware/errorMiddleware');
const requestLogger = require('./middleware/requestLogger');

// ─── Route Imports ────────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const resumeRoutes = require('./routes/resumeRoutes');

// ─── Global Middleware ────────────────────────────────────────

// Trust proxy (required for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// CORS
app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging (before routes, after body parsing)
app.use(requestLogger);

// General rate limiter for all API routes
app.use('/api', apiLimiter);

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/resume', resumeRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Resume Analyzer API running',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Health check with dependencies status
app.get('/health', (req, res) => {
  const mongoose = require('mongoose');
  res.json({
    success: true,
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 Handler ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
});

// ─── Error Handler (always last) ──────────────────────────────
app.use(errorMiddleware);

module.exports = app;
