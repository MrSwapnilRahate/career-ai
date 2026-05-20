# ─── Stage 1: Build frontend ──────────────────────────────────
FROM node:18-alpine AS frontend-build

WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci --production=false
COPY client/ ./
RUN npm run build

# ─── Stage 2: Production backend ─────────────────────────────
FROM node:18-alpine AS production

# Security: run as non-root user
RUN addgroup -g 1001 -S careerai && \
    adduser -S careerai -u 1001

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy backend source
COPY server.js ./
COPY src/ ./src/

# Copy built frontend from Stage 1
COPY --from=frontend-build /app/client/dist ./client/dist

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
