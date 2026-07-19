# ── Deps ──────────────────────────────────────────────────────────────────────
FROM node:24-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ── Build ─────────────────────────────────────────────────────────────────────
FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_RECAPTCHA_SITE_KEY
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_RECAPTCHA_SITE_KEY=$NEXT_PUBLIC_RECAPTCHA_SITE_KEY
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_TELEMETRY_DISABLED=1
ENV DOCKER_BUILD=true

RUN npm run build

# ── Runner ────────────────────────────────────────────────────────────────────
FROM node:24-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

CMD ["node", "server.js"]
