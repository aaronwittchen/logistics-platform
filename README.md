# Logistics DDD Platform

A production-grade Domain-Driven Design (DDD) logistics and inventory tracking system demonstrating enterprise-level software architecture patterns.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-FF6600?style=flat&logo=rabbitmq&logoColor=white)](https://www.rabbitmq.com/)
[![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?style=flat&logo=kubernetes&logoColor=white)](https://kubernetes.io/)
[![Jest](https://img.shields.io/badge/Jest-323330?style=flat&logo=jest&logoColor=white)](https://jestjs.io/)
[![GitHub Actions](https://github.com/aaronwittchen/logistics-platform/workflows/CI%20-%20Tests%20%26%20Code%20Quality/badge.svg)](https://github.com/aaronwittchen/logistics-platform/actions)
[![codecov](https://codecov.io/gh/aaronwittchen/logistics-platform/branch/main/graph/badge.svg)](https://codecov.io/gh/aaronwittchen/logistics-platform)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Development Sections](#development-sections)
- [APIs](#apis)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Learning Resources](#learning-resources)

---

## Overview

This project demonstrates enterprise-level architecture patterns used by companies like Amazon, FedEx, and Uber. It's a complete implementation of Domain-Driven Design with CQRS, Event-Driven Architecture, and Hexagonal Architecture applied to a realistic logistics domain.

**Use Cases**: E-commerce fulfillment, supply chain management, warehouse operations, package tracking, and distributed inventory control.

**Key Features**:
- Multiple bounded contexts with independent domain models
- Event sourcing for complete audit trails
- CQRS pattern with separate read/write models
- Eventual consistency across contexts
- Asynchronous messaging with RabbitMQ
- Microservices-ready architecture
- Comprehensive test coverage (unit, integration, acceptance)
- Production-ready Kubernetes deployment

---

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Git
- Bun

### Installation

```bash
# Clone the repository
git clone https://github.com/aaronwittchen/logistics-platform.git
cd logistics-platform

# Install dependencies
bun install

# Start infrastructure
docker-compose -f infra/docker-compose.yml up -d

# Run migrations
bun run migrate

# Start development server
bun run dev
# API available at http://localhost:3000

# In separate terminal, start event consumer
bun run consumer:inventory

# Run tests
bun test
```

### First API Requests

Add stock:
```bash
curl -X POST http://localhost:3000/stock-items \
  -H "Content-Type: application/json" \
  -d '{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "iPhone 15 Pro",
    "quantity": 100
  }'
```

Reserve stock:
```bash
curl -X PUT http://localhost:3000/stock-items/550e8400-e29b-41d4-a716-446655440000/reserve \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 2,
    "reservationId": "order-12345",
    "expiresAt": "2024-12-31T23:59:59Z",
    "reason": "Customer order"
  }'
```

---

## Architecture

### Core Patterns

**Domain-Driven Design**: Model complex business logic with Aggregates, Value Objects, and Domain Events aligned to business domains.

**CQRS Pattern**: Separate read and write operations. Write models enforce business rules; read models provide fast queries.

**Event-Driven Architecture**: Decouple services with asynchronous messaging through immutable domain events rather than direct calls.

**Hexagonal Architecture**: Build testable, framework-independent code with domain logic containing zero dependencies on databases or HTTP frameworks.

### Bounded Contexts

**Inventory Context** - Manages warehouse stock operations and reservations. Aggregates: StockItem, Warehouse. Events: StockItemAdded, StockItemReserved, StockQuantityAdjusted.

**Logistics Context** - Tracks packages through the delivery network. Aggregates: Package, Route, Shipment. Events: PackageRegistered, PackageDispatched, LocationUpdated, PackageDelivered.

**Backoffice Context** - Provides fast queries for tracking and reporting. Projections: TrackingView, InventoryView, RouteProgressView. Storage: Elasticsearch.

### Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Runtime | TypeScript + Node.js | Type-safe backend |
| Web Framework | Express.js | REST API |
| Write Database | PostgreSQL 15 + TypeORM | ACID transactions |
| Read Database | Elasticsearch 8.x | Fast queries |
| Message Broker | RabbitMQ 3.x | Async events |
| Testing | Jest + Supertest | Unit, integration, acceptance |
| Quality | ESLint + Prettier | Code standards |
| Deployment | Docker + Kubernetes | Production |
| Monitoring | Prometheus + Grafana | Observability |

---

## Project Structure

```
src/
├── Contexts/
│   ├── Inventory/
│   │   └── StockItem/
│   │       ├── application/      # Use cases
│   │       ├── domain/           # Pure business logic
│   │       │   ├── StockItem.ts
│   │       │   ├── Quantity.ts
│   │       │   └── events/
│   │       └── infrastructure/   # Database & HTTP
│   ├── Logistics/
│   └── Backoffice/
├── Shared/
│   ├── domain/                   # DDD building blocks
│   │   ├── AggregateRoot.ts
│   │   ├── ValueObject.ts
│   │   ├── DomainEvent.ts
│   │   └── EventBus.ts
│   └── infrastructure/           # Shared services
└── apps/
    ├── inventory/backend
    ├── inventory/consumers
    ├── logistics/
    └── backoffice/
```

Screaming Architecture: Folder names reveal business purpose. Opening the project immediately shows it's about Inventory, Logistics, and Backoffice operations.

---

## Development Sections

### Foundation

Establish DDD infrastructure and the StockItem aggregate. Implement domain model, command handlers, PostgreSQL persistence, and REST endpoints. Learn: DDD tactical patterns, value objects, aggregate roots, repository pattern, TDD.

### RabbitMQ

Decouple contexts with asynchronous messaging. Integrate RabbitMQ for event publishing, implement event consumers, and enable cross-context communication. Learn: event-driven architecture, message brokers, eventual consistency, error handling in distributed systems.

### Elasticsearch

Separate read and write concerns with CQRS. Integrate Elasticsearch for read models, implement tracking projections, and build fast query APIs. Learn: CQRS pattern, eventual consistency in practice, search optimization, projection maintenance.

### Logistics

Complete the package tracking domain. Implement Package and Route aggregates, add package use cases, and coordinate between contexts. Learn: multi-context architecture, context boundaries, cross-context workflows.

### Kubernetes

Production-ready deployment with container orchestration. Create multi-stage Dockerfiles, write Kubernetes manifests, implement health checks and monitoring. Learn: container orchestration, deployment strategies, observability.

---

## APIs

### Inventory

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/stock-items` | POST | Add stock |
| `/stock-items/:id/reserve` | PUT | Reserve stock |
| `/stock-items/:id` | GET | Get stock status |
| `/stock-items/:id/reservations/:reservationId` | DELETE | Release reservation |

### Logistics

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/packages` | POST | Register package |
| `/packages/:id/location` | PUT | Update location |
| `/packages/:id/tracking` | GET | Get tracking info |

### Backoffice

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/tracking` | GET | Search packages |
| `/inventory/warehouses/:id` | GET | Warehouse inventory |
| `/analytics/delivery-performance` | GET | Delivery metrics |

---

## Testing

```bash
# Run all tests
bun test

# Watch mode
bun run test:watch

# With coverage
bun run test:coverage

# Specific file
bun test -- StockItem.spec.ts
```

Test Structure:
- **Unit Tests**: Domain logic, aggregates, value objects
- **Integration Tests**: Repository persistence, event publishing
- **Acceptance Tests**: HTTP API endpoints, end-to-end workflows

Current Coverage: 85%+, 150+ tests, 100% pass rate.

---

## Deployment

### Docker

```bash
# Build image
docker build -t logistics-platform:latest .

# Using Docker Compose
docker-compose -f infra/docker-compose.yml up -d
```

### Kubernetes

```bash
# Apply configuration
kubectl apply -f k8s/

# View deployments
kubectl get deployments

# Scale deployment
kubectl scale deployment logistics-backend --replicas=3

# Check logs
kubectl logs -f deployment/logistics-backend
```

### Environment Variables

```bash
DATABASE_URL=postgresql://user:password@postgres:5432/logistics
RABBITMQ_URL=amqp://rabbitmq:5672
ELASTICSEARCH_URL=http://elasticsearch:9200
NODE_ENV=production
PORT=3000
```

---

## Contributing

### Code Standards

- Write tests first (TDD approach)
- Use business terminology (ubiquitous language)
- Keep domain logic framework-free
- Use past-tense event naming (StockItemReserved, not ReserveStockItem)

### Process

1. Create feature branch: `git checkout -b feature/my-feature`
2. Write failing tests first
3. Implement the feature
4. Run tests: `bun test`
5. Lint: `bun run lint`
6. Format: `bun run format`
7. Submit pull request

### Reporting Issues

Use GitHub Issues with:
- Clear reproduction steps
- Expected vs. actual behavior
- Relevant logs or screenshots

---

## Learning Resources

### Domain-Driven Design

- "Domain-Driven Design" by Eric Evans (foundational)
- "Implementing Domain-Driven Design" by Vaughn Vernon (practical)

### CQRS & Event Sourcing

- Microsoft CQRS Journey
- Transcript of Greg Young's Talk at Code on the Beach 2014: CQRS and Event Sourcing

### Event-Driven Architecture

- "Building Event-Driven Microservices" by Adam Bellemare
- Enterprise Integration Patterns guide

### Kubernetes

- "Kubernetes Up & Running" by Kelsey Hightower
- Official Kubernetes documentation

---

## Build Status

| Pipeline | Status |
|----------|--------|
| Unit Tests | [![Unit Tests](https://github.com/aaronwittchen/logistics-platform/workflows/CI%20-%20Tests%20%26%20Code%20Quality/badge.svg)](https://github.com/aaronwittchen/logistics-platform/actions) |
| Integration Tests | [![Integration Tests](https://github.com/aaronwittchen/logistics-platform/actions/workflows/test.yml/badge.svg)](https://github.com/aaronwittchen/logistics-platform/actions) |
| Code Coverage | [![codecov](https://codecov.io/gh/aaronwittchen/logistics-platform/branch/main/graph/badge.svg)](https://codecov.io/gh/aaronwittchen/logistics-platform) |

---

## License

MIT License - Free to use for learning and portfolio projects.

[Star on GitHub](https://github.com/aaronwittchen/logistics-platform) | [Read the Docs](./docs) | [Report Issues](https://github.com/aaronwittchen/logistics-platform/issues)