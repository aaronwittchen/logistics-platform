# Build stage - Compile TypeScript to JavaScript
FROM oven/bun:alpine AS builder

WORKDIR /app

COPY package.json bun.lock ./
COPY tsconfig.json ./

RUN bun install

COPY src ./src

RUN bun run build

# Development stage - Run TypeScript directly with hot reload
FROM oven/bun:alpine AS development

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./
COPY tsconfig.json ./

# Install all dependencies (including dev dependencies)
RUN bun install

# Copy source code
COPY src ./src

ENV NODE_ENV=development

# Health check for development
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD bun run health || exit 1

# Default command (can be overridden in docker-compose)
CMD ["bun", "--watch", "src/apps/inventory/backend/start.ts"]

# Test stage - Run tests
FROM oven/bun:alpine AS test

WORKDIR /app

COPY package.json bun.lock ./
COPY tsconfig.json ./

RUN bun install

COPY src ./src

ENV NODE_ENV=test

CMD ["bun", "test"]

# Production stage - Minimal image with only compiled code
FROM oven/bun:slim AS production

WORKDIR /app

# Create app directory and set proper ownership before switching user
RUN mkdir -p /app && chown -R bun:bun /app

# Copy only package files
COPY package.json bun.lock ./

# Install only production dependencies
RUN bun install --production

# Copy compiled code from builder
COPY --from=builder --chown=bun:bun /app/dist ./dist

ENV NODE_ENV=production

# Switch to non-root user for security
USER bun

# Health check for production
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD bun run health || exit 1

# Override in k8s or docker-compose as needed
CMD ["bun", "dist/apps/inventory/backend/start.js"]