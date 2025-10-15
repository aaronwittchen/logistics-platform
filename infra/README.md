# Infrastructure Setup

This directory contains Docker Compose configuration for local development of the logistics DDD platform.

## Quick Start

### Prerequisites

- Docker & Docker Compose (v2.0+)
- Git

### Setup

1. **Clone the environment file:**

   ```bash
   cp .env.example .env
   ```

2. **Start all services:**

   ```bash
   docker-compose up -d
   ```

3. **Verify services are running:**
   ```bash
   docker-compose ps
   ```

You should see all services in a healthy state. The backends will be available at:

- Inventory backend: http://localhost:3000
- Backoffice backend: http://localhost:3001
- Health check service: http://localhost:3002

## Services

### Backend Services

**inventory (backend)** - Port 3000

- Runs with `bun --watch` for live reloading
- Starts immediately when dependencies are healthy

**backoffice** - Port 3001

- Runs with `bun --watch` for live reloading
- Includes tracking endpoints
- Waits for all infrastructure to be healthy before starting

**health-check** - Port 3002

- Monitoring and health check service
- Runs with `bun --watch` for live reloading

### Infrastructure Services

**postgres** - Port 5432

- PostgreSQL 15 database
- Database: `logistics`
- Credentials: from `.env`
- Data persisted in `postgres_data` volume
- Health checks run every 10 seconds

**rabbitmq** - Ports 5672 (AMQP), 15672 (Management UI)

- Message broker for async operations
- Management UI: http://localhost:15672
- Credentials: from `.env`
- Data persisted in `rabbitmq_data` volume
- Health checks run every 10 seconds

**elasticsearch** - Port 9200

- Search and analytics engine
- Single-node configuration
- 1GB memory allocated (2GB limit)
- Data persisted in `elasticsearch_data` volume
- Health checks run every 30 seconds

## Environment Variables

Create a `.env` file in this directory. See `.env.example` for required variables:

```bash
# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=logistics
DB_USERNAME=logistics_user
DB_PASSWORD=logistics_pass
DB_TYPE=postgres
DB_SSL=false

# RabbitMQ
RABBITMQ_USER=logistics_user
RABBITMQ_PASS=logistics_pass
RABBITMQ_PORT=5672

# Elasticsearch
ELASTICSEARCH_URL=http://elasticsearch:9200
```

## Common Commands

### Start services

```bash
docker-compose up -d
```

### Stop services

```bash
docker-compose down
```

### Stop and remove volumes (reset all data)

```bash
docker-compose down -v
```

### View logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail 100
```

### Rebuild after Dockerfile changes

```bash
docker-compose build
docker-compose up -d
```

### Run tests

```bash
docker-compose run test
```

### Access database

```bash
docker-compose exec postgres psql -U logistics_user -d logistics
```

### Access RabbitMQ Management UI

Open http://localhost:15672 in your browser

- Username: logistics_user
- Password: (from `.env`)

## Resource Limits

Each service has CPU and memory limits to prevent resource exhaustion:

| Service       | CPU Limit | Memory Limit |
| ------------- | --------- | ------------ |
| backend       | 1         | 512M         |
| backoffice    | 1         | 512M         |
| health-check  | 1         | 512M         |
| postgres      | 1         | 512M         |
| rabbitmq      | 1         | 512M         |
| elasticsearch | 2         | 2G           |

Adjust in `docker-compose.yml` if needed for your system.

## Troubleshooting

### Services not starting

Check logs:

```bash
docker-compose logs -f
```

### Port conflicts

If ports are already in use, modify in `docker-compose.yml`:

```yaml
ports:
  - '3000:3000' # Change first number (host port)
```

### Database connection errors

Ensure postgres health check passed:

```bash
docker-compose ps
```

Look for postgres to show "(healthy)" status.

### Out of memory errors

Elasticsearch might need more memory. Increase in `.env` or `docker-compose.yml`:

```yaml
elasticsearch:
  environment:
    - 'ES_JAVA_OPTS=-Xms2g -Xmx2g'
```

### File watch not working

The services use volume mounts for live reloading. If changes aren't detected:

```bash
# Restart the service
docker-compose restart backend
```

## Development Workflow

1. **Local code changes** - Services automatically reload via `bun --watch`
2. **Database changes** - Restart postgres: `docker-compose restart postgres`
3. **Dependency changes** - Rebuild: `docker-compose build && docker-compose up -d`
4. **Run tests** - `docker-compose run test`

## Production Considerations

This setup is for **local development only**. For production:

- Use `docker-compose.prod.yml` with different resource limits
- Enable Elasticsearch security: set `xpack.security.enabled=true`
- Use Docker secrets or environment variable management instead of `.env`
- Enable database SSL: set `DB_SSL=true`
- Use external managed services (RDS, ElastiCache, etc.)
- Configure proper backup and disaster recovery

## Architecture

```
┌─────────────────────────────────────────┐
│   Backend Services                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐│
│  │ Inventory│ │Backoffice│ │  Health  ││
│  │ Backend  │ │ Backend  │ │ Check    ││
│  └─────┬────┘ └─────┬────┘ └─────┬────┘│
└────────┼─────────────┼─────────────┼─────┘
         │             │             │
    ┌────┴─────────────┼─────────────┼────┐
    │                  │             │    │
┌───▼──────┐  ┌────────▼───┐  ┌────┴───┐ │
│ Postgres │  │  RabbitMQ  │  │Elasticsearch
└──────────┘  └────────────┘  └────────┘ │
                                         │
            backend-network ─────────────┘
```

# Docker Architecture Guide

## Overview

This document explains how the Docker infrastructure is structured and how each component works together to create a scalable, isolated development and production environment for the Logistics DDD platform.

## Docker Compose: Orchestrating Your Microservices

Docker Compose manages multiple interconnected services with a single command. It defines and runs your entire platform ecosystem, ensuring services start in the correct order and can communicate with each other.

### What docker-compose.yml Does

- Orchestrates 7 containers (4 application services + 3 infrastructure services)
- Implements proper startup order with health checks and dependencies
- Creates isolated networking between services
- Manages persistent data with named volumes
- Centralizes environment configuration

### Services Architecture

#### Application Services

**backend** (Port 3000)

- Inventory backend service
- Runs with `bun --watch` for hot reloading during development
- Waits for postgres and rabbitmq to be healthy before starting
- Handles core inventory operations

**backoffice** (Port 3001)

- Read-only backoffice operations and tracking endpoints
- Runs with `bun --watch` for development
- Requires postgres, rabbitmq, and elasticsearch to be healthy
- Includes restart policy for production reliability

**health-check** (Port 3002)

- Monitoring and health check service
- Runs with `bun --watch` for development
- Depends on all infrastructure services being healthy
- Provides system-wide health status

#### Infrastructure Services

**postgres** (Port 5432)

- PostgreSQL 15 database
- Stores all persistent application data
- Health checks verify database availability every 10 seconds
- Data persisted in `postgres_data` volume across container restarts

**rabbitmq** (Ports 5672, 15672)

- Message broker for asynchronous operations
- Port 5672: AMQP protocol for application communication
- Port 15672: Management UI for monitoring queues
- Health checks verify broker connectivity every 10 seconds
- Data persisted in `rabbitmq_data` volume

**elasticsearch** (Port 9200)

- Search and analytics engine
- Configured for single-node development
- Allocates 1GB memory with 2GB limit
- Health checks verify cluster health every 30 seconds
- Data persisted in `elasticsearch_data` volume

**test** (No external port)

- Runs your test suite
- Waits for all infrastructure services to be healthy
- Isolated container for reproducible test execution

## Dockerfile: Multi-Stage Building Strategy

The Dockerfile uses three distinct stages to optimize for both development experience and production deployment.

### Stage 1: Builder

Purpose: Compile TypeScript to JavaScript

```
Starting point: oven/bun:alpine (small, secure base)
Install dependencies: bun install
Copy source code: src/
Compile TypeScript: bun run build
Output: /app/dist/ (compiled JavaScript)
```

This stage creates the optimized production code. Its artifacts are reused in the production stage but the stage itself is discarded, keeping the final image small.

### Stage 2: Development

Purpose: Create an environment for rapid development with hot reloading

```
Starting point: oven/bun:alpine (fresh container)
Install all dependencies: bun install (includes dev tools)
Copy source code: src/
Configure: NODE_ENV=development
Command: bun --watch (hot reloading)
Volume mounts: Source code for live changes
```

This stage includes all development dependencies and is optimized for the development workflow. The `--watch` flag enables hot reloading, so code changes immediately reflect without container restarts.

### Stage 3: Production

Purpose: Minimal, secure container for production deployment

```
Starting point: oven/bun:slim (even smaller base image)
Create app user: bun:bun (non-root for security)
Copy only production dependencies: bun install --production
Copy compiled code: COPY --from=builder /app/dist ./dist
Configure: NODE_ENV=production
Security: USER bun (runs as non-root)
Command: bun dist/apps/inventory/backend/start.js
```

This stage is optimized for size and security. It only includes production dependencies and runs as a non-root user to prevent privilege escalation attacks.

## How They Work Together

### Build Process

1. **docker-compose build** reads the Dockerfile
2. **Stage 1 (builder)** compiles your TypeScript code
3. **Stage 2 (development)** or **Stage 3 (production)** is built based on target
4. Docker uses layer caching to speed up subsequent builds

### Runtime Process

1. **docker-compose up** creates the network `backend-network`
2. **Infrastructure services** start first (postgres, rabbitmq, elasticsearch)
3. Health checks verify each service is ready
4. **Application services** start once dependencies pass health checks
5. All services communicate via the backend-network
6. Data is persisted in named volumes across restarts

### Development Workflow

```
You edit src/app.ts
  ↓
Volume mount detects change
  ↓
bun --watch automatically recompiles
  ↓
Service hot reloads
  ↓
Browser/API client sees changes
```

### Production Workflow

```
bun run build (TypeScript → JavaScript)
  ↓
docker build --target production
  ↓
Production stage copies /app/dist
  ↓
Container runs compiled JavaScript (fast startup)
  ↓
Non-root user prevents security issues
```

## Key Features

### Isolation

Each bounded context runs in its own container with its own environment. Services cannot directly access each other's filesystem or ports—they communicate through well-defined network channels.

### Consistency

The same docker-compose.yml and Dockerfile work identically across:

- Your local development machine
- CI/CD pipelines
- Production servers

This eliminates "works on my machine" problems.

### Scalability

Services are loosely coupled via message queues and APIs. You can easily scale individual services up or down without affecting others.

### Performance

Multi-stage builds ensure:

- Fast development with hot reloading
- Minimal production images (no dev dependencies)
- Layer caching speeds up rebuilds
- Alpine base images reduce attack surface

### Security

- Non-root user prevents privilege escalation
- Minimal attack surface (no dev tools in production)
- Isolated networks prevent unauthorized access
- Named volumes protect persistent data

## Connecting It All

### Service Discovery

Services find each other by name on the backend-network:

```
backend service → postgres (uses hostname "postgres")
backend service → rabbitmq (uses hostname "rabbitmq")
```

### Health Checks

Each service monitors its own health:

```yaml
healthcheck:
  test: ['CMD-SHELL', 'pg_isready -U user -d db']
  interval: 10s # Check every 10 seconds
  timeout: 5s # Fail if no response in 5 seconds
  retries: 5 # Require 5 consecutive failures to mark unhealthy
```

### Dependency Management

Services wait for dependencies using health conditions:

```yaml
depends_on:
  postgres:
    condition: service_healthy # Wait for postgres to be healthy
```

This prevents timing issues where a service starts before its dependencies are ready.

### Data Persistence

Named volumes survive container restarts:

```yaml
volumes:
  postgres_data: # Stored on host machine
  rabbitmq_data:
  elasticsearch_data:
```

When containers restart, they reconnect to the same volume, preserving all data.

## Building and Running

### Development

```bash
# Build and start all services
docker-compose up --build

# Services hot reload as you edit code
# Access at http://localhost:3000, 3001, 3002
```

### Production

```bash
# Build production-optimized images
docker build --target production -t logistics:latest .

# Run production container
docker run -e NODE_ENV=production logistics:latest
```

### Testing

```bash
# Run tests in isolated container
docker-compose run test

# Tests wait for all infrastructure services
# Run in consistent environment every time
```

## Why This Architecture Matters

This setup provides the foundation for a production-ready platform that:

1. Runs identically across all environments
2. Scales horizontally by adding service replicas
3. Is easy for new developers to understand and run locally
4. Supports rapid development with hot reloading
5. Minimizes production image size and attack surface
6. Gracefully handles service failures and restarts
7. Can be deployed to any container orchestration platform (Kubernetes, Docker Swarm, etc.)

The combination of docker-compose.yml for orchestration, multi-stage Dockerfile for optimization, and .dockerignore for build efficiency creates a robust, scalable foundation for the Logistics DDD platform.
