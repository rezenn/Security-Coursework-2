# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:24-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production=false

COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build

# ── Production stage ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 gyankosh

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

RUN mkdir -p logs && chown -R gyankosh:nodejs logs

USER gyankosh

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => process.exit(r.statusCode===200?0:1))"

CMD ["node", "dist/server.js"]
