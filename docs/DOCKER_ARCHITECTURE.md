# Docker Infrastructure: Detailed Information Sheet

## What is Docker?

Docker is a containerization platform that packages your entire application with all its dependencies into isolated units called containers. Instead of running applications directly on your machine, Docker wraps them in lightweight, portable containers that behave identically across development, testing, and production environments.

### Key Concepts

**Containers** - Lightweight, standalone packages containing your application, runtime, libraries, and configuration. Think of them as mini virtual machines, but much faster and more efficient.

**Images** - Blueprints for containers. An image defines everything needed to run an application. You build an image once, then create multiple containers from it.

**Layers** - Images are built in layers, each layer representing a set of changes. Docker caches these layers, making rebuilds faster.

**Networks** - Virtual networks that allow containers to communicate with each other. Services discover each other by hostname on the same network.

**Volumes** - Persistent storage that survives container restarts. Without volumes, all data is lost when a container stops.

---

## Docker Compose: Orchestrating Multiple Services

### Purpose

Docker Compose simplifies managing multiple interconnected containers. Instead of running individual `docker run` commands for each service, you define everything in one YAML file and start the entire stack with a single command.

### What We're Using

Our `docker-compose.yml` orchestrates 7 containers:

- 4 Application Services (backend, backoffice, health-check, test)
- 3 Infrastructure Services (postgres, rabbitmq, elasticsearch)

### How It Works

```yaml
services:
  backend:
    build: # Instructions for building the image
    environment: # Environment variables passed to container
    depends_on: # Wait for other services before starting
    ports: # Map container ports to host ports
    volumes: # Mount storage
    networks: # Connect to virtual network
    restart: # Restart policy if container crashes
```

### Key Features in Our Setup

#### 1. Service Dependencies

```yaml
depends_on:
  postgres:
    condition: service_healthy
  rabbitmq:
    condition: service_healthy
```

This ensures services start in the correct order. The backend waits for postgres and rabbitmq to be healthy before starting. This prevents connection errors from timing issues.

#### 2. Health Checks

```yaml
healthcheck:
  test: ['CMD-SHELL', 'pg_isready -U logistics_user -d logistics']
  interval: 10s # Check every 10 seconds
  timeout: 5s # Fail if no response within 5 seconds
  retries: 5 # Mark unhealthy after 5 consecutive failures
```

Health checks continuously monitor service status. Docker uses these to determine when a service is ready for dependents.

#### 3. Networking

```yaml
networks:
  backend-network:
    driver: bridge
```

All services connect to `backend-network`. This isolated network allows:

- Services to communicate by hostname (e.g., `postgres` resolves to the postgres container)
- External access only through exposed ports
- Services can't reach each other without explicit configuration

#### 4. Persistent Volumes

```yaml
volumes:
  postgres_data: # Database persists between restarts
  rabbitmq_data: # Message queue state persists
  elasticsearch_data: # Search indices persist
```

Named volumes store data on your host machine. If you stop and restart containers, the data remains. This is critical for development—you don't lose your database when a container restarts.

#### 5. Port Mapping

```yaml
ports:
  - '3000:3000' # Host port : Container port
```

Maps container ports to your machine:

- Container port 3000 → Host port 3000
- Access your backend at `http://localhost:3000`

#### 6. Environment Variables

```yaml
environment:
  DB_HOST: postgres
  DB_PORT: ${DB_PORT} # Loaded from .env file
  DB_USERNAME: ${DB_USERNAME}
```

Centralized configuration that's easily changed per environment (dev/test/prod).

#### 7. YAML Anchors (DRY Principle)

```yaml
x-backend-env: &backend-env
  DB_HOST: postgres
  DB_PORT: ${DB_PORT}
  # ... more variables

services:
  backend:
    environment:
      <<: *backend-env # Reuse the anchor
```

The `<<: [*anchor1, *anchor2, *anchor3]` syntax merges multiple YAML anchors in one operation.

Anchors reduce duplication. Define common configuration once, reuse it across multiple services.

### Container Startup Order

When you run `docker-compose up`:

```
1. Create backend-network (isolated virtual network)
2. Start infrastructure services in parallel:
   - postgres (health check: pg_isready)
   - rabbitmq (health check: connectivity)
   - elasticsearch (health check: cluster health)
3. Wait for all health checks to pass
4. Start application services:
   - backend (waits for postgres, rabbitmq)
   - backoffice (waits for postgres, rabbitmq, elasticsearch)
   - health-check (waits for all infrastructure)
5. Application services now communicate via backend-network
6. All data persists in named volumes
```

---

## Dockerfile: Building Container Images

### Purpose

The Dockerfile defines how to build a Docker image for your application. It's a recipe that specifies:

- Base operating system/runtime
- Dependencies to install
- Application code to copy
- Environment configuration
- How the container starts

### Multi-Stage Builds: Our Strategy

Our Dockerfile uses three stages for different purposes:

```dockerfile
FROM oven/bun:alpine AS builder        # Stage 1
FROM oven/bun:alpine AS development    # Stage 2
FROM oven/bun:slim AS production       # Stage 3
```

Each stage starts fresh, allowing us to:

- Optimize for different use cases (dev vs production)
- Keep production images small
- Reuse build artifacts efficiently

### Understanding Layers

Docker images consist of layers. Each line in the Dockerfile creates a layer:

```dockerfile
FROM oven/bun:alpine          # Layer 1: Base image
WORKDIR /app                  # Layer 2: Set working directory
COPY package.json ./          # Layer 3: Copy package.json
RUN bun install               # Layer 4: Install dependencies
COPY src ./src                # Layer 5: Copy source code
RUN bun run build             # Layer 6: Compile code
```

Layers are **stacked** on top of each other to create the final image. Docker caches layers, so if you rebuild:

- Layers 1-3 use cache (unchanged)
- Layer 4+ rebuild (code changed)

This speeds up development rebuilds dramatically.

### Stage 1: Builder

**Purpose:** Compile TypeScript to JavaScript

**Base Image:** `oven/bun:alpine` (12MB - very small)

```dockerfile
FROM oven/bun:alpine AS builder

WORKDIR /app

COPY package.json bun.lock ./
COPY tsconfig.json ./
RUN bun install

COPY src ./src
RUN bun run build
```

What happens:

1. Start with Alpine Linux + Bun runtime
2. Set working directory to `/app`
3. Copy only package files (package.json, bun.lock, tsconfig.json)
4. Install all dependencies
5. Copy source code
6. Compile TypeScript → JavaScript (output: `/app/dist/`)

**Output:** `/app/dist/` folder with compiled JavaScript

**Why separate?** Building is resource-intensive and creates temporary files. This stage is thrown away after use, keeping the final image small.

### Stage 2: Development

**Purpose:** Fast development with hot reloading

**Base Image:** `oven/bun:alpine` (fresh container)

```dockerfile
FROM oven/bun:alpine AS development

WORKDIR /app

COPY package.json bun.lock ./
COPY tsconfig.json ./
RUN bun install

COPY src ./src
ENV NODE_ENV=development
HEALTHCHECK --interval=30s --timeout=10s CMD bun run health

CMD ["bun", "--watch", "src/apps/inventory/backend/start.ts"]
```

What happens:

1. Start fresh with Alpine + Bun
2. Copy and install all dependencies (including dev tools)
3. Copy source code
4. Set environment to development
5. Enable health checks
6. Command: `bun --watch` for hot reloading

**Key Features:**

- Includes dev dependencies (testing frameworks, linters, etc.)
- `bun --watch` automatically restarts when code changes
- Development mode configuration
- Health checks for docker-compose

**Why separate?** You want development tools that production doesn't need (test frameworks, debug utilities, etc.). Keeping it separate prevents bloating production images.

### Stage 3: Production

**Purpose:** Small, secure, fast production container

**Base Image:** `oven/bun:slim` (even smaller than alpine)

```dockerfile
FROM oven/bun:slim AS production

WORKDIR /app

RUN mkdir -p /app && chown -R bun:bun /app
COPY package.json bun.lock ./
RUN bun install --production

COPY --from=builder --chown=bun:bun /app/dist ./dist

ENV NODE_ENV=production
USER bun

HEALTHCHECK --interval=30s --timeout=10s CMD bun run health

CMD ["bun", "dist/apps/inventory/backend/start.js"]
```

What happens:

1. Start with slim Alpine + Bun
2. Create `/app` directory and set ownership to non-root `bun` user
3. Copy package files
4. Install **only production dependencies** (no dev tools)
5. Copy pre-compiled JavaScript from builder stage
6. Set production environment
7. Switch to non-root user (security)
8. Enable health checks
9. Command: Run compiled JavaScript

**Key Features:**

- **No dev dependencies** - Production image is small
- **Pre-compiled code** - Faster startup
- **Non-root user** - Security best practice
- **Reuses builder artifacts** - `COPY --from=builder` references stage 1
- **Smaller base image** - `slim` vs `alpine`

**Why separate?** Production needs speed and security, not development tools. By copying only the compiled code and production dependencies, the final image is:

- Smaller (less disk space)
- Faster to start
- More secure (no dev tools = fewer attack vectors)
- Ready to scale

### Building for Different Targets

```bash
# Build development image
docker build --target development -t logistics:dev .

# Build production image
docker build --target production -t logistics:latest .

# Build for testing
docker build --target test -t logistics:test .
```

---

## .dockerignore: Optimizing Build Context

### Purpose

`.dockerignore` specifies which files to exclude when building a Docker image. Without it, Docker would include unnecessary files, making builds slower and images larger.

Think of it like `.gitignore` for Docker—files listed here are ignored during `COPY` commands.

### What We Exclude and Why

```
# Git
.git                     # Repository history (not needed in container)
.gitignore              # Git configuration
.gitattributes

# Documentation
README.md               # Not needed at runtime
*.md
docs/

# Environment
.env                    # Secrets (use docker-compose instead)
.env.*

# Dependencies
node_modules            # Will be reinstalled in container
bun.lockb

# Build artifacts
dist                    # Rebuilt in production stage
build
*.tsbuildinfo

# Testing
coverage                # Only needed locally
.nyc_output
*.lcov

# Logs
npm-debug.log           # Not needed at runtime
yarn-error.log
*.log

# IDE & Editor
.vscode                 # Editor config
.idea
*.swp                   # Temporary files

# CI/CD
.github                 # GitHub Actions config
.gitlab-ci.yml         # Not needed in container

# Temporary
tmp/
temp/
```

### Build Context

When you run `docker build`, Docker creates a "build context"—the set of files available to the Dockerfile. By default, this includes everything in your directory.

**Without .dockerignore:**

- Build context: 500MB (includes node_modules, .git, test files, etc.)
- Build time: Slow (copying all files to Docker daemon)
- Network transfer: Wastes bandwidth

**With .dockerignore:**

- Build context: 50MB (only essential files)
- Build time: Fast
- Network transfer: Efficient

### Example Impact

```
# Without .dockerignore
docker build .
Sending build context to Docker daemon: 500.3MB

# With .dockerignore
docker build .
Sending build context to Docker daemon: 45.2MB
```

That's 10x faster!

---

## How They Work Together: Complete Flow

### Development Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Developer edits src/app.ts                              │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ 2. Volume mount detects file change                         │
│    (mounted: ../logistics-ddd-platform:/app)                │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ 3. bun --watch (running in development container) detects  │
│    the change and recompiles TypeScript                     │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ 4. Service hot reloads without container restart            │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ 5. Browser/API client sees changes immediately             │
└─────────────────────────────────────────────────────────────┘
```

### Production Build Workflow

```
┌──────────────────────────────────────────────────────────────┐
│ 1. Developer runs: docker build --target production         │
└────────────────────┬─────────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────────┐
│ 2. Docker reads Dockerfile and .dockerignore               │
│    - .dockerignore filters unnecessary files               │
│    - Build context is lean and fast                         │
└────────────────────┬─────────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────────┐
│ 3. Stage 1 (builder) executes                              │
│    - Installs all dependencies                              │
│    - Compiles TypeScript → JavaScript                       │
│    - Creates /app/dist/ with compiled code                  │
│    - Layer caching speeds up rebuilds                       │
└────────────────────┬─────────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────────┐
│ 4. Stage 3 (production) executes                            │
│    - Starts fresh with slim base image                      │
│    - Installs ONLY production dependencies                  │
│    - Copies /app/dist from builder stage                    │
│    - Result: Small, secure, optimized image                 │
└────────────────────┬─────────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────────┐
│ 5. Final image ready for deployment                         │
│    - Small size (only essentials)                           │
│    - Fast startup (pre-compiled code)                       │
│    - Secure (non-root user, no dev tools)                   │
└──────────────────────────────────────────────────────────────┘
```

### Docker Compose Startup Sequence

```
docker-compose up
    │
    ├─ Create backend-network
    │
    ├─ Start infrastructure (parallel):
    │  ├─ postgres: health check → ready in 2-5s
    │  ├─ rabbitmq: health check → ready in 3-8s
    │  └─ elasticsearch: health check → ready in 5-10s
    │
    ├─ Wait for all health checks to pass
    │
    └─ Start application services (sequential):
       ├─ backend: connects to postgres + rabbitmq
       ├─ backoffice: connects to all infrastructure
       └─ health-check: monitors entire system

All services now communicate via backend-network
All data persists in volumes
```

---

## Performance Optimization

### Layer Caching

Docker caches layers based on the Dockerfile content. When you rebuild:

```dockerfile
FROM oven/bun:alpine          # Layer 1 (cached if same)
COPY package.json ./          # Layer 2 (cached if same)
RUN bun install               # Layer 3 (re-runs if Layer 2 changed)
COPY src ./src                # Layer 4 (changed → Layer 4+ rebuild)
```

**Best practice:** Order COPY statements from least-changing to most-changing:

1. `package.json` (rarely changes)
2. `tsconfig.json` (rarely changes)
3. `src/` (frequently changes)

This ensures when you edit code, Docker can reuse cached layers and only rebuild the relevant ones.

### Build Time Improvements

With our setup:

- **First build:** 2-3 minutes (fresh install, compilation)
- **Subsequent builds:** 30-60 seconds (layer cache)
- **Code-only changes:** 5-10 seconds (most layers cached)

### Image Size

```
Development image:     ~250MB (includes dev dependencies)
Production image:      ~80MB (only essentials)
```

The production image is 3x smaller, reducing:

- Disk space needed
- Transfer time (important for CI/CD)
- Attack surface (fewer files = fewer vulnerabilities)

---

## Security Considerations

### Non-Root User

```dockerfile
USER bun  # Run as non-root user
```

If someone gains access to your container, they can't write to system files. They're confined to the `bun` user's permissions.

### Minimal Attack Surface

By excluding dev dependencies from production:

- No test frameworks to exploit
- No debug utilities to abuse
- Smaller codebase = fewer vulnerabilities

### Secrets Management

```dockerfile
# NEVER do this:
ENV DATABASE_PASSWORD=secret123

# Instead, use .env files (not copied to image)
# Docker Compose loads from .env at runtime
```

Our setup loads secrets from `.env` at runtime, not baking them into images.

---

## Common Commands Reference

### Building

```bash
# Build development image
docker-compose build backend

# Build all images
docker-compose build

# Build production-specific image
docker build --target production -t logistics:latest .
```

### Running

```bash
# Start all services
docker-compose up -d

# Start with logs
docker-compose up

# Rebuild and start
docker-compose up --build
```

### Monitoring

```bash
# View service status
docker-compose ps

# View logs
docker-compose logs -f backend

# View specific service logs
docker-compose logs -f postgres
```

### Debugging

```bash
# Access container shell
docker-compose exec backend sh

# Check image layers
docker history logistics:latest

# Inspect image details
docker inspect logistics:latest
```

---

### Monitoring and Container Sizes

Once your containers are running, you can monitor their resource usage:

#### Container Memory Usage Reference

| Container           | Typical Usage | Memory Limit | Percentage | Notes                    |
| ------------------- | ------------- | ------------ | ---------- | ------------------------ |
| **postgres-1**      | 35-40MB       | 512MB        | ~7-8%      | PostgreSQL database      |
| **rabbitmq-1**      | 150-160MB     | 512MB        | ~30%       | Message queue service    |
| **elasticsearch-1** | 1000-1100MB   | 2GB          | ~50%       | Search and analytics     |
| **backend-1**       | 50-70MB       | 512MB        | ~10-14%    | Main application API     |
| **backoffice-1**    | 45-55MB       | 512MB        | ~9-11%     | Administrative interface |
| **health-check-1**  | 50-60MB       | 512MB        | ~10-12%    | System monitoring        |
| **test-1**          | 0-10MB        | None         | ~0%        | Testing container        |

#### Commands for Monitoring

```bash
# View container sizes and status
docker ps -s

# Check image sizes
docker images

# Monitor overall disk usage
docker system df

# View real-time logs
docker-compose logs -f [service-name]

# Check specific container details
docker stats [container-name]
```

These sizes represent typical usage for a development environment. Production deployments may vary based on load and configuration.

---

## Summary

Our Docker setup provides:

- **Development Speed:** Hot reloading with `bun --watch`
- **Production Ready:** Multi-stage builds optimized for performance
- **Scalability:** Microservices architecture with service discovery
- **Reliability:** Health checks ensure services are ready before dependents start
- **Security:** Non-root users, minimal attack surface, isolated networks
- **Consistency:** Same environment across dev, test, and production
- **Efficiency:** Layer caching, build optimization, small images

This architecture transforms your complex DDD platform into a manageable, scalable, deployment-ready system.
