# syntax=docker/dockerfile:1

# ─────────────────────────────────────────────
# EcoTrace — Production Dockerfile
# ─────────────────────────────────────────────
# Multi-stage build:
#   1. Builder   → compiles the TanStack Start app with Bun
#   2. Runner    → serves the built Nitro node-server output
# ─────────────────────────────────────────────

# ═════════════════════════════════════════════
# STAGE 1: Builder
# ═════════════════════════════════════════════
FROM oven/bun:1-slim AS builder

WORKDIR /app

# Copy lockfile + manifest first for layer caching
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source and build
COPY . .

# Vite inlines VITE_* variables into the client bundle at build time.
# Supply real values via --build-arg when building the image.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_PROJECT_ID

ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_PUBLISHABLE_KEY=${VITE_SUPABASE_PUBLISHABLE_KEY}
ENV VITE_SUPABASE_PROJECT_ID=${VITE_SUPABASE_PROJECT_ID}

# Build production bundle (outputs to .output/ via Nitro node-server preset)
RUN bun run build

# ═════════════════════════════════════════════
# STAGE 2: Runner
# ═════════════════════════════════════════════
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NITRO_PORT=3000

# Only copy the compiled Nitro output — nothing else is needed at runtime
COPY --from=builder /app/.output ./.output

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
