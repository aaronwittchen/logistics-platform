# Logistics DDD Platform - Application Overview

## Executive Summary

The Logistics DDD Platform is a production-grade inventory and logistics tracking system demonstrating enterprise-level software architecture patterns. Built with Domain-Driven Design, CQRS, and Event-Driven Architecture, it provides a blueprint for complex logistics operations at scale.

**Target Use Cases**: E-commerce fulfillment, supply chain management, warehouse operations, package tracking, inventory control across distributed locations.

**Architecture Highlights**: Multiple bounded contexts, event sourcing, eventual consistency, microservices-ready deployment, comprehensive testing strategy.

---

## Learning Outcomes

This project demonstrates architectural patterns used by companies like Amazon, FedEx, and Uber:

**Domain-Driven Design (DDD)**: Model complex business logic with Aggregates (consistency boundaries), Value Objects (immutable domain concepts), and Domain Events (audit trails). Learn to align code structure with business domains.

**CQRS (Command Query Responsibility Segregation)**: Separate read and write operations for optimal performance. Write models enforce business rules with transactional databases. Read models provide fast queries with denormalized data in search engines.

**Event-Driven Architecture**: Decouple services with asynchronous messaging. Services communicate through domain events rather than direct calls, enabling independent scaling and resilience to failures.

**Hexagonal Architecture**: Build testable, framework-independent code. Domain logic remains pure with zero dependencies on databases, HTTP frameworks, or external services. Infrastructure adapters handle technical concerns.

**Test-Driven Development**: Write tests before implementation. Tests serve as executable documentation and enable fearless refactoring. Comprehensive coverage across unit, integration, and acceptance tests.

**Kubernetes Deployment**: Deploy microservices to production with container orchestration. Learn service discovery, load balancing, health checks, and horizontal scaling.

---

## Real-World Applications

### Logistics and Shipping

Track packages across multiple warehouses, distribution hubs, and delivery routes. Handle complex workflows like package consolidation, route optimization, and delivery exceptions. Support real-time tracking with location updates.

### Inventory Management

Manage stock across distributed locations with sophisticated reservation systems. Handle multi-warehouse operations with transfer workflows. Support expiration-based reservations and automatic cleanup. Maintain accurate inventory with comprehensive audit trails.

### E-commerce Fulfillment

Process orders with stock reservations tied to customer purchases. Coordinate between inventory and shipping contexts. Handle order cancellations with automatic reservation release. Support complex fulfillment scenarios like partial shipments and backorders.

### Financial Systems

Process transactions with complete audit trails through event sourcing. Every state change generates an immutable event for compliance and forensic analysis. Support complex transaction workflows with compensating actions.

### Healthcare Operations

Track patient records and medical supplies with strict audit requirements. Manage inventory of time-sensitive materials with expiration handling. Support compliance reporting with complete event history.

---

## System Architecture

### Bounded Contexts

The system divides complex logistics operations into three independent bounded contexts, each with its own domain model and data storage.

#### Inventory Context

**Purpose**: Manage warehouse stock operations and reservations

**Core Aggregates**:
- **StockItem**: Represents physical inventory with sophisticated reservation management. Tracks total quantity, reserved quantity, and available quantity separately. Supports expiration-based reservations with automatic cleanup. Enforces business rules like preventing over-reservation and maintaining consistency between total and reserved quantities.
- **Warehouse**: Physical storage location with capacity constraints and operational metadata.

**Key Use Cases**:
- Add stock with audit reasons (receiving shipments, returns, adjustments)
- Reserve stock for orders with expiration times and business reasons
- Release reservations when orders cancel or expire
- Adjust inventory with comprehensive validation (prevents negative totals, respects reservations)
- Check stock availability across multiple dimensions

**Domain Events**:
- **StockItemAdded**: New inventory entered the system with initial quantity
- **StockItemReserved**: Stock allocated to an order with reservation metadata
- **StockItemReservationReleased**: Reservation freed for other use
- **StockQuantityAdjusted**: Inventory corrected with before/after state and reason
- **StockLevelLow**: Alert triggered when inventory falls below reorder threshold

#### Logistics Context

**Purpose**: Track packages through the delivery network from warehouse to customer

**Core Aggregates**:
- **Package**: Individual shipment with tracking capabilities. Maintains location history, status transitions, and delivery metadata. Supports exception handling for damaged or lost packages.
- **Route**: Planned path through distribution hubs with estimated timelines. Optimizes delivery efficiency while maintaining delivery promises.
- **Shipment**: Group of packages traveling together for operational efficiency. Manages batch operations and consolidated tracking.

**Key Use Cases**:
- Register new package from stock reservation
- Assign package to optimal route based on destination
- Update package location as it moves through hubs (scan events)
- Mark package as delivered with proof of delivery
- Handle delivery exceptions (address issues, damage reports, lost packages)
- Reroute packages based on operational needs

**Domain Events**:
- **PackageRegistered**: Package entered tracking system with initial details
- **PackageDispatched**: Package departed warehouse or distribution center
- **LocationUpdated**: Package scanned at new location with timestamp
- **PackageDelivered**: Package reached final destination with delivery confirmation
- **DeliveryFailed**: Delivery attempt unsuccessful with failure reason
- **PackageRerouted**: Package assigned to different route

#### Backoffice Context (Read Side)

**Purpose**: Provide fast, flexible queries for tracking and reporting without impacting write performance

**Read Models (Projections)**:
- **TrackingView**: Real-time package status aggregating data from multiple events. Provides customer-facing tracking information with estimated delivery times and location history.
- **InventoryView**: Current stock levels per warehouse with reservation details. Supports inventory analysis and reorder decisions.
- **RouteProgressView**: Shipments in transit with real-time progress. Monitors delivery performance and identifies delays.

**Key Use Cases**:
- Retrieve package tracking status with complete history
- Query warehouse inventory levels with reservation breakdowns
- Search packages by customer, date, status, or location
- Generate analytics reports (delivery performance, inventory turnover, warehouse efficiency)
- Build dashboards with real-time metrics

**Event Consumption**:
- Subscribes to ALL events from Inventory and Logistics contexts
- Rebuilds denormalized projections in ElasticSearch for fast queries
- Maintains eventual consistency with write side
- Supports projection rebuilding from event history

---

## Event-Driven Flow

### Example Scenario: Customer Orders a Product

The following sequence demonstrates how bounded contexts communicate through domain events:

1. **Customer Request**: Order placed through e-commerce system
2. **Inventory Context**: Receives reservation request, validates stock availability
3. **Business Logic**: StockItem aggregate executes reserve() method, updating quantities
4. **Event Recording**: Aggregate records StockItemReserved event internally
5. **Persistence**: Repository saves aggregate to PostgreSQL database
6. **Event Publishing**: Repository publishes StockItemReserved event to RabbitMQ
7. **Event Routing**: RabbitMQ routes event to subscribers based on routing keys
8. **Logistics Context**: Receives StockItemReserved event via subscription
9. **Package Creation**: Logistics creates Package aggregate for shipment
10. **Event Cascade**: Package aggregate records PackageRegistered event
11. **Event Publishing**: PackageRegistered published to RabbitMQ
12. **Backoffice Updates**: Both contexts' events update tracking projections in ElasticSearch
13. **Customer Query**: Tracking request queries fast read model for instant response

**Key Benefits**:
- **Loose Coupling**: Inventory doesn't know Logistics exists. They communicate only through events.
- **Resilience**: If Logistics is down, Inventory continues working. Events queue up and process when Logistics recovers.
- **Performance**: Tracking queries hit ElasticSearch (optimized for reads) while Inventory uses PostgreSQL (optimized for transactions).
- **Auditability**: Complete event history enables rebuilding projections from scratch or investigating issues.

---

## Technology Stack

### Core Platform

**TypeScript 5.x**: Adds static typing to JavaScript for compile-time error detection. Critical for complex DDD systems where type confusion between different aggregate IDs or value objects would cause subtle bugs. Enables excellent IDE support with autocomplete and refactoring.

**Bun**: Modern JavaScript runtime and package manager. Faster than Node.js for development workflows. Built-in test runner eliminates additional dependencies. Single tool for running code, installing packages, and executing tests.

### HTTP Layer

**Express.js**: Minimal web framework for Node.js. Unopinionated design allows implementing clean architecture without fighting the framework. Large ecosystem of middleware for common needs. Production-proven at scale.

**REST API**: Standard HTTP endpoints following REST principles. Predictable URL patterns (resources as nouns, HTTP verbs for actions). Standard status codes for error handling. Easy integration with any HTTP client.

### Write-Side Storage

**PostgreSQL 15**: ACID-compliant relational database for write operations. Transactional guarantees ensure data consistency during complex operations. Strong typing with schema enforcement. Excellent for modeling relationships between aggregates.

**TypeORM**: Object-Relational Mapping for TypeScript. Decorators provide clean syntax for entity mapping. Migration support for schema evolution. Type-safe query building prevents SQL injection and runtime errors.

**Transaction Support**: Critical for maintaining consistency. Example: Reserving stock decrements quantity and records reservation in single atomic operation. Rollback on any failure ensures data integrity.

### Read-Side Storage

**ElasticSearch 8.x**: Distributed search and analytics engine for read models. Handles millions of queries with sub-second response times. Full-text search with relevance scoring. Aggregations for analytics without impacting write database.

**Why Separate Read Database**: CQRS pattern separates read and write concerns. Write database optimized for consistency and transactions. Read database optimized for query flexibility and speed. Each can scale independently based on different load characteristics.

### Message Broker

**RabbitMQ 3.x**: Message broker implementing AMQP protocol. Routes events between publishers and subscribers. Durable queues survive broker restarts. Dead letter exchanges handle failed messages. Topic-based routing enables flexible subscription patterns.

**Why RabbitMQ Over Kafka**: RabbitMQ excels at traditional message queue patterns needed for DDD event-driven architecture. Simpler to operate than Kafka. Lower latency for individual messages. Per-message acknowledgments provide better guarantees. Smaller resource footprint suitable for microservices deployment.

### Testing Infrastructure

**Jest**: Comprehensive testing framework with excellent TypeScript support. Fast test execution with intelligent caching. Snapshot testing for component verification. Built-in mocking and spying capabilities. Coverage reporting tracks test completeness.

**Supertest**: HTTP assertion library for testing REST APIs. Makes real HTTP requests to your server. Chainable assertions for readable tests. Supports all HTTP methods and headers. Integrates seamlessly with Jest.

**Docker Compose**: Orchestrates test environment with real databases. Integration tests run against actual PostgreSQL and RabbitMQ. Ensures tests reflect production behavior. Isolated environments prevent test interference.

### Deployment Platform

**Docker**: Containerization packages application with all dependencies. Consistent environment from development to production. Isolation prevents conflicts between applications. Efficient resource usage compared to virtual machines.

**Kubernetes**: Container orchestration for production deployment. Automatic scaling based on load. Self-healing with pod restart on failure. Rolling updates enable zero-downtime deployments. Service discovery and load balancing built-in.

**Prometheus & Grafana**: Monitoring stack for production observability. Prometheus collects metrics from applications. Grafana visualizes metrics with dashboards. Alert rules notify on-call teams of issues.

### Code Quality

**ESLint**: Static analysis identifies code issues before runtime. DDD-specific rules enforce architectural patterns. Naming conventions maintain consistency. Integration with CI/CD fails builds on violations.

**Prettier**: Opinionated code formatter eliminates style debates. Automatic formatting on save in IDE. Consistent style across team. Focus on code logic instead of formatting.

**Husky**: Git hooks enforce quality gates before commit. Pre-commit hook runs linters and formatters. Pre-push hook runs tests. Prevents bad code from entering repository.

---

## Project Structure

### Architectural Organization

The folder structure implements Screaming Architecture—the structure reveals business intent rather than technical layers.

```
src/
├── Contexts/              # Business domains (Bounded Contexts)
│   ├── Inventory/         # Stock management domain
│   │   └── StockItem/     # Aggregate with all related code
│   │       ├── application/      # Use cases (commands/queries)
│   │       │   ├── AddStock/     # Command handler for adding stock
│   │       │   └── ReserveStock/ # Command handler for reservations
│   │       ├── domain/           # Pure business logic
│   │       │   ├── StockItem.ts        # Aggregate root
│   │       │   ├── Quantity.ts         # Value object
│   │       │   ├── StockItemName.ts    # Value object
│   │       │   └── events/             # Domain events
│   │       │       ├── StockItemAdded.ts
│   │       │       └── StockItemReserved.ts
│   │       └── infrastructure/   # Technical implementations
│   │           ├── persistence/        # Database adapters
│   │           │   ├── StockItemEntity.ts
│   │           │   └── TypeOrmStockItemRepository.ts
│   │           └── controllers/        # HTTP endpoints
│   │               └── AddStockPostController.ts
│   ├── Logistics/         # Package tracking domain
│   └── Backoffice/        # Read-side projections
├── Shared/                # Reusable kernel across contexts
│   ├── domain/                   # DDD building blocks
│   │   ├── AggregateRoot.ts     # Base for aggregates
│   │   ├── ValueObject.ts       # Base for value objects
│   │   ├── DomainEvent.ts       # Base for events
│   │   └── EventBus.ts          # Event publishing interface
│   └── infrastructure/           # Shared infrastructure
│       ├── persistence/
│       │   └── TypeOrmConfig.ts # Database configuration
│       └── event-bus/
│           ├── RabbitMQConnection.ts
│           ├── RabbitMQEventBus.ts
│           └── RabbitMQConsumer.ts
└── apps/                  # Runnable applications
    ├── inventory/
    │   ├── backend/              # HTTP API server
    │   │   ├── InventoryBackendApp.ts
    │   │   ├── start.ts
    │   │   └── routes/
    │   └── consumers/            # Event consumers
    │       └── start.ts
    ├── logistics/
    └── backoffice/
```

### Design Principles

**Screaming Architecture**: Folder names reveal business purpose. Opening the project immediately shows it's about Inventory, Logistics, and Backoffice operations—not technical layers like "controllers" and "services."

**Context Independence**: Each bounded context is self-contained with its own domain model, application layer, and infrastructure. Contexts can be extracted into separate microservices without refactoring.

**Hexagonal Layers**: Domain layer has zero dependencies on frameworks. It doesn't import Express, TypeORM, or RabbitMQ. Business logic remains pure and testable without infrastructure.

**Test Proximity**: Tests live next to the code they test. Domain tests in domain folder, controller tests in controllers folder. Makes it obvious what's tested and what's missing.

**Aggregate Organization**: Each aggregate gets its own folder with all related code. StockItem folder contains its use cases, domain logic, events, and infrastructure adapters. Everything about StockItem lives together.

---

## Development Sections

### Foundation

**Goal**: Establish DDD infrastructure and first working aggregate

**Deliverables**:
- Shared kernel with base classes (AggregateRoot, ValueObject, DomainEvent)
- StockItem aggregate with complete domain model
- AddStock use case with command handler
- PostgreSQL persistence with TypeORM
- HTTP API endpoint for adding stock
- Comprehensive test coverage (unit, integration, acceptance)

**What You Learn**: DDD tactical patterns, value objects, aggregate roots, repository pattern, command pattern, clean architecture layers, test-driven development.

### RabbitMQ

**Goal**: Decouple contexts with asynchronous messaging

**Deliverables**:
- RabbitMQ integration with connection management
- Event bus for publishing domain events
- Event consumers for processing events
- ReserveStock use case with event publishing
- Cross-context communication (Inventory to Logistics)
- Dead letter queues and retry logic

**What You Learn**: Event-driven architecture, message brokers, publish-subscribe pattern, eventual consistency, error handling in distributed systems, dead letter queues.

### ElasticSearch

**Goal**: Separate read and write concerns for optimal performance

**Deliverables**:
- ElasticSearch integration for read models
- Tracking projections updated from domain events
- Query API with fast read operations
- Projection rebuilding from event history
- Performance testing comparing approaches

**What You Learn**: CQRS pattern, read models vs write models, eventual consistency in practice, search engine optimization, projection maintenance, event replay.

### Logistics

**Goal**: Complete logistics domain with package tracking

**Deliverables**:
- Package aggregate with tracking capabilities
- Package use cases (register, update location, deliver)
- Route aggregate with optimization logic
- Logistics API endpoints
- End-to-end flow from stock reservation to delivery

**What You Learn**: Multi-context architecture, context boundaries, shared kernel usage, cross-context workflows, bounded context integration.

### Kubernetes

**Goal**: Production-ready deployment to container orchestration platform

**Deliverables**:
- Multi-stage Dockerfiles with optimized images
- Kubernetes manifests (deployments, services, configmaps, secrets)
- StatefulSets for stateful services (databases, message broker)
- Ingress for traffic routing with TLS
- Health checks (liveness and readiness probes)
- Monitoring with Prometheus and Grafana

**What You Learn**: Container orchestration, Kubernetes architecture, deployment strategies, service discovery, load balancing, monitoring and observability in production.

---

## Quick Start Guide

### Prerequisites

- **Node.js 20+**: JavaScript runtime for backend services
- **Docker & Docker Compose**: Container platform for local development
- **Git**: Version control for source code
- **Bun** (optional): Faster alternative to npm/Node.js
- **Minikube** (optional): Local Kubernetes cluster for Kubernetes section

### Initial Setup

```bash
# Clone repository
git clone https://github.com/aaronwittchen/logistics-ddd-platform.git
cd logistics-ddd-platform

# Install dependencies
npm install  # or: bun install

# Start infrastructure services
docker-compose -f infra/docker-compose.yml up -d

# Run database migrations
npm run migrate

# Start development server
npm run dev  # Backend API starts on http://localhost:3000

# In separate terminal, start event consumer
npm run consumer:inventory

# Run tests
npm test
```

### First API Interactions

**Add Stock to Warehouse**:
```bash
curl -X POST http://localhost:3000/stock-items \
  -H "Content-Type: application/json" \
  -d '{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "iPhone 15 Pro",
    "quantity": 100
  }'

# Response: {"id": "550e8400-e29b-41d4-a716-446655440000"}
# Consumer logs: Stock item added: iPhone 15 Pro (Qty: 100)
```

**Reserve Stock for Order**:
```bash
curl -X PUT http://localhost:3000/stock-items/550e8400-e29b-41d4-a716-446655440000/reserve \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 2,
    "reservationId": "order-12345",
    "expiresAt": "2024-12-31T23:59:59Z",
    "reason": "Customer order"
  }'

# Response: {"message": "Stock reserved successfully", ...}
# Consumer logs: Stock reserved: order-12345 (Qty: 2)
```

**Check Package Tracking** (after ElasticSearch section):
```bash
curl http://localhost:3000/packages/tracking

# Response: Array of tracking information from ElasticSearch
```

---

## RFID Integration Possibility

### Overview

RFID (Radio-Frequency Identification) functionality extends the platform with real-time asset tracking using physical RFID tags and readers. This enhancement demonstrates how the event-driven architecture accommodates new capabilities without modifying existing code.

### Use Cases

**Asset Tracking**: Attach RFID tags to stock items for unique identification. Automatically scan items in/out of warehouses. Track location in real-time as items move through facilities.

**Supply Chain Integration**: Monitor items through fulfillment pipeline without manual scanning. Verify correct items are shipped by automatically reading tags during packaging. Update inventory on arrival by scanning deliveries at receiving dock.

**Manufacturing Integration**: Track items through assembly line with automatic stations. Verify components and final products for quality control. Maintain batch tracking to trace product origins and components for recalls.

### Architecture Integration

RFID fits naturally into the existing event-driven architecture:

1. **RFID Readers** (IoT devices) publish tag read events when scanning items
2. **RFID Service** processes raw tag reads and publishes domain events
3. **Domain Events** (RFIDTagRead) flow through RabbitMQ to subscribers
4. **Inventory Context** updates item locations based on RFID events
5. **Projections** maintain real-time location tracking in ElasticSearch
6. **Dashboards** display live item locations with WebSocket updates

### Implementation Approach

**RFID Integration Section** (to be completed before Logistics section)

**Domain Foundation**:
- RFIDTag aggregate with tag ID, item ID, and location
- RFIDTagRead domain event with timestamp and location data
- Value objects for RFIDTagId and Location

**Hardware Integration**:
- RFIDReaderService for communicating with physical readers
- Serial port or network protocol handling
- Tag data parsing and validation
- Error handling for read failures

**Event Processing**:
- Event subscribers update item locations in real-time
- Projections maintain location history in ElasticSearch
- Geofencing alerts when items leave designated areas

**Real-time Dashboard**:
- WebSocket server for live location updates
- Frontend dashboard showing item locations on facility map
- Alert system for missing items or unauthorized movement

### Technical Considerations

**Hardware**: USB/Serial RFID readers or network-based readers. Passive or active RFID tags depending on range requirements. Support for EPC Gen2, NFC, or other RFID protocols.

**Software**: Node.js serial port libraries for device communication. Real-time event processing with RabbitMQ. WebSocket server for live dashboard updates. RFID tag metadata in PostgreSQL database.

### Business Value

**Operational Efficiency**: Eliminate manual counting with automated inventory. Reduce human error from manual data entry. Gain real-time visibility into exact item locations.

**Advanced Features**: Geofencing alerts when items leave designated areas. Anti-theft tracking of unauthorized item movement. Analytics on item movement patterns for warehouse optimization. Mobile app integration for field operations.

### Recommended Timing

Implement RFID as a section before the Logistics section because:
- Works with existing Inventory context without dependencies
- Immediate business value for asset tracking
- Demonstrates event-driven architecture flexibility
- Easier to test with current system before adding complexity
- Provides foundation for future IoT integrations

---

## Contributing Guidelines

This project welcomes contributions as a learning resource for the community.

### How to Contribute

**Report Bugs**: Open GitHub issues with detailed descriptions. Include steps to reproduce, expected behavior, and actual behavior. Attach relevant logs or screenshots.

**Suggest Features**: Explain the business use case and value proposition. Describe how it fits into existing bounded contexts. Consider impact on other parts of the system.

**Submit Pull Requests**: Follow DDD principles in implementation. Write tests before code (TDD approach). Update documentation for new features. Ensure all tests pass and linters succeed.

**Improve Documentation**: Help others learn by clarifying complex concepts. Add diagrams for visual learners. Create tutorials for common tasks. Fix typos and broken links.

### Code Standards

**Test-Driven Development**: Write failing tests first to define behavior. Implement minimum code to pass tests. Refactor while keeping tests green. Aim for high test coverage across layers.

**Ubiquitous Language**: Use business terminology in code, not technical jargon. Class and method names should make sense to domain experts. Event names describe business occurrences in past tense.

**Aggregate Focus**: Keep aggregates small and focused on single business concept. Each aggregate enforces its own consistency boundaries. Avoid large aggregates with many responsibilities.

**Framework Independence**: Domain layer must have zero framework dependencies. Don't import Express, TypeORM, or RabbitMQ in domain code. Keep business logic pure and testable.

**Immutable Events**: Domain events are immutable records of past occurrences. Use past-tense naming (StockItemReserved, not ReserveStockItem). Include all relevant context in event payload.

---

## Learning Resources

### Domain-Driven Design

**Books**: "Domain-Driven Design" by Eric Evans (the original blue book), "Implementing Domain-Driven Design" by Vaughn Vernon (practical patterns), "Domain-Driven Design Distilled" by Vaughn Vernon (concise introduction).

**Courses**: CodelyTV Pro (excellent Spanish content with DDD/Hexagonal Architecture focus), Domain-Driven Design Fundamentals by Pluralsight, Advanced Distributed Systems Design by Udi Dahan.

**Blogs**: Martin Fowler's DDD articles (foundational concepts), Vaughn Vernon's blog (practical implementation), CodelyTV blog (modern DDD patterns).

### CQRS and Event Sourcing

**Books**: "Versioning in an Event Sourced System" by Greg Young, "Exploring CQRS and Event Sourcing" by Microsoft patterns & practices, "Event Sourcing" by Martin Fowler.

**Talks**: "CQRS and Event Sourcing" by Greg Young (foundational talk), "Event Sourcing" by Martin Fowler (conceptual overview), "The Many Meanings of Event-Driven Architecture" by Martin Fowler.

**Resources**: Microsoft's CQRS Journey (free online book), EventStore blog (practical event sourcing), Microservices.io (patterns catalog).

### Event-Driven Architecture

**Books**: "Building Event-Driven Microservices" by Adam Bellemare (comprehensive guide), "Enterprise Integration Patterns" by Gregor Hohpe (messaging patterns), "Designing Event-Driven Systems" by Ben Stopford.

**Talks**: "The Many Meanings of Event-Driven Architecture" by Martin Fowler, "Events Are Not Just for Notifications" by Greg Young, "Microservices and the Inverse Conway Maneuver" by James Lewis.

### Kubernetes

**Books**: "Kubernetes in Action" by Marko Lukša (comprehensive guide), "Kubernetes Up & Running" by Kelsey Hightower (practical introduction), "Production Kubernetes" by Josh Rosso (operations focus).

**Courses**: "Kubernetes for Developers" on Udemy, "Scalable Microservices with Kubernetes" on Coursera, Kubernetes official tutorials and documentation.

---

## License and Acknowledgments

**License**: MIT License - Free to use for learning and portfolio projects

**Inspired By**:
- **CodelyTV**: Excellent DDD and Hexagonal Architecture examples in modern TypeScript
- **Vaughn Vernon**: DDD thought leader and author of seminal implementation books
- **Martin Fowler**: Software architecture wisdom and pattern documentation
- **Greg Young**: CQRS and Event Sourcing pioneer with practical insights

---

## Support and Community

### Getting Help

**GitHub Issues**: Ask questions about architecture decisions, implementation patterns, or specific code sections. The community can provide guidance on DDD best practices.

**Documentation**: Check the `/docs` folder for deep dives into specific patterns. Read section guides for step-by-step implementation details.

**Tests as Documentation**: Tests demonstrate expected behavior and usage patterns. They're executable documentation that's always up-to-date.

### Project Philosophy

**Learning Over Perfection**: The goal is understanding architectural patterns, not building a perfect system. Make mistakes, refactor, and learn from the process.

**Incremental Progress**: Build one feature at a time. Understand each pattern before moving forward. Don't rush through sections.

**Community Learning**: Share your learnings and help others. Document challenges you faced and how you solved them. Contribute back to help future learners.

---

## Glossary

**Aggregate**: Cluster of domain objects treated as single unit for consistency. All changes go through the aggregate root which enforces business rules.

**Bounded Context**: Distinct domain area with its own models and terminology. In this system: Inventory, Logistics, and Backoffice are separate contexts with their own meaning of terms.

**CQRS**: Command Query Responsibility Segregation. Pattern separating write operations (commands) from read operations (queries) with different models for each.

**Domain Event**: Immutable record of something significant that happened in the business. Named in past tense (StockItemReserved) and includes all relevant context.

**Event Sourcing**: Storing complete history of state changes as events rather than just current state. Events become the source of truth for rebuilding state.

**Hexagonal Architecture**: Also called Ports and Adapters. Architecture pattern where business logic is independent of frameworks, databases, and external services.

**Value Object**: Object with no identity where only the value matters. Two value objects with same data are interchangeable. Always immutable.

**Ubiquitous Language**: Shared vocabulary between developers and domain experts used consistently in code, documentation, and conversations.