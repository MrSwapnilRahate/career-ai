# ─── CareerAI Backend — Production Dockerfile ────────────────
# Optimized for Render deployment (backend API only)
# Frontend deploys separately to Vercel
# ──────────────────────────────────────────────────────────────

FROM node:20-alpine AS production

# Security: run as non-root user
RUN addgroup -g 1001 -S careerai && \
    adduser -S careerai -u 1001

WORKDIR /app

# Install production dependencies only (layer caching)
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy backend source
COPY server.js ./
COPY src/ ./src/

# Set ownership
RUN chown -R careerai:careerai /app
USER careerai

# Environment
ENV NODE_ENV=production
ENV PORT=5001

EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5001/health || exit 1

CMD ["node", "server.js"]
