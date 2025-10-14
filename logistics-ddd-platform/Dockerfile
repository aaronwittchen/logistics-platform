# Build stage
FROM oven/bun:alpine AS builder

WORKDIR /app

COPY package.json bun.lock ./
COPY tsconfig.json ./

RUN bun install

COPY src ./src

RUN bun run build

# Development stage (for running TypeScript directly)
FROM oven/bun:alpine AS development

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./
COPY tsconfig.json ./

# Install all dependencies (including dev dependencies)
RUN bun install

# Copy source code
COPY src ./src

# Set development environment
ENV NODE_ENV=development

# Default command for development (can be overridden in docker-compose)
CMD ["bun", "--watch", "src/apps/inventory/backend/start.ts"]

# Production stage - much smaller
FROM oven/bun:alpine AS production

WORKDIR /app

# Create app directory and set proper ownership before switching user
RUN mkdir -p /app && chown -R bun:bun /app

COPY package.json bun.lock ./

RUN bun install --production

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production

# Switch to non-root user
USER bun

# This will be overridden by k8s
CMD ["bun", "dist/apps/inventory/backend/start.js"]