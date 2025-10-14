A detailed, step-by-step guide to building the Logistics DDD Platform from scratch
Logistics DDD Platform
What is the Logistics DDD Platform?
The Logistics DDD Platform is a comprehensive, event-driven microservices architecture designed for logistics and supply chain management. Built using Domain-Driven Design (DDD) principles, it provides:
🏗️ Core Capabilities
📦 Inventory Management - Stock tracking, reservations, and warehouse operations
🚚 Package Logistics - Package creation, tracking, and delivery management
📊 Backoffice Operations - Real-time tracking projections and analytics
🔄 Event-Driven Architecture - Asynchronous processing via RabbitMQ
🔍 Search & Analytics - Elasticsearch-powered querying and insights
🛠️ Technical Architecture
Multiple Bounded Contexts: Inventory, Logistics, Backoffice
Event Sourcing: Domain events drive business workflows
CQRS Pattern: Separate read/write operations for optimal performance
Microservices: Independent, scalable service deployment
TypeScript/Node.js: Type-safe, modern backend development
Why Domain-Driven Design (DDD)?
🎯 Strategic Design Benefits
📋 Ubiquitous Language - Common vocabulary between developers and domain experts
🏗️ Bounded Contexts - Clear separation of business capabilities
🔄 Domain Events - Explicit communication between contexts
📚 Rich Domain Model - Business logic lives in the domain, not in services
🏗️ Tactical Design Benefits
🧱 Aggregates - Consistency boundaries for business entities
💎 Value Objects - Immutable, validated business values
🏭 Factories - Controlled object creation
🗄️ Repositories - Abstraction from data persistence
🚀 Development Benefits
🧪 Testability - Pure domain logic is easily unit tested
🔄 Maintainability - Changes in one context don't affect others
📈 Scalability - Each context can evolve independently
🔧 Flexibility - Easy to adapt to changing business requirements
💼 Business Benefits
🎯 Domain Focus - Code reflects actual business needs
🔒 Data Integrity - Domain rules prevent invalid states
📊 Analytics Ready - Domain events enable rich reporting
🔮 Future-Proof - Architecture supports business evolution
Test-Driven Development (TDD)
Why Test-Driven Development (TDD)?
Test-Driven Development (TDD) is a software development practice where we write tests before writing the actual code. This approach may seem counterintuitive at first, but it delivers significant benefits for building robust, maintainable systems.
🎯 Key Benefits of TDD
1. Drives Better Design
When you write tests first, you naturally think about how your code will be used. This leads to:
Simpler, more focused classes - Each class has a single responsibility
Better interfaces - Tests reveal what methods and parameters are actually needed
Cleaner abstractions - You design for testability, which improves overall design
2. Provides Living Documentation
Tests serve as executable documentation that shows:
How to use each class - Real examples of expected behavior
What each method should return - Clear contract specifications
Edge cases and error conditions - Comprehensive usage scenarios
3. Enables Fearless Refactoring
With comprehensive tests in place:
Safe code changes - Tests catch regressions immediately
Confident improvements - You can refactor without breaking existing functionality
Continuous improvement - Tests support ongoing code evolution
4. Reduces Debugging Time
Tests help you:
Catch bugs early - Problems are found during development, not in production
Isolate issues quickly - Tests pinpoint exactly where failures occur
Prevent future regressions - Tests ensure fixes don't break other parts
5. Improves Code Quality
TDD promotes:
Higher test coverage - Every line of code is tested
Better error handling - Edge cases are explicitly tested
Defensive programming - Code is more resilient to unexpected inputs
🚀 TDD in Our DDD Architecture
In our Domain-Driven Design (DDD) platform, TDD is particularly valuable because:
Domain Logic Testing - Ensures our aggregates, value objects, and domain events behave correctly
Infrastructure Isolation - Tests domain logic independently of databases, HTTP servers, or external services
Refactoring Safety - Allows us to evolve our domain model while maintaining correctness
Documentation - Tests serve as specifications for domain behavior


1. Section: Foundation
Goal: Build the DDD infrastructure and first working aggregate
DDD Infrastructure vs Aggregates
🏗️ What is DDD Infrastructure?
DDD Infrastructure is the technical layer that handles all the "plumbing" and external concerns while keeping your domain logic pure and focused on business rules.
Core Responsibilities:
Data Persistence - Saving and loading objects from databases
External Communications - HTTP requests, message queues, email services
Cross-Cutting Concerns - Logging, security, caching, configuration
Third-Party Integrations - Payment processors, APIs, external services
Key Principle:
Infrastructure exists to support the domain but never dictate how the domain behaves. It's the "how" while the domain is the "what."
🏗️ What is an Aggregate?
Aggregates are the core business entities in your domain that group together related concepts and enforce business rules as a single unit.
Core Characteristics:
Consistency Boundary - Everything inside the aggregate stays consistent
Single Point of Entry - All changes happen through the aggregate root
Business Rule Enforcement - Maintains invariants and validates state changes
Event Generation - Records what happened for other parts of the system
Common Examples:
Order Aggregate - Contains order items, shipping address, payment info
Customer Aggregate - Contains contact info, preferences, account status
Product Aggregate - Contains pricing, inventory, product details
Dependency Rule:
Domain Layer defines interfaces (contracts)
Infrastructure Layer implements those interfaces
Domain Layer never depends on infrastructure details
Example Workflow:
User Request comes through infrastructure (HTTP API)
Application Layer coordinates the work
Domain Layer (Aggregate) enforces business rules
Infrastructure Layer persists changes and publishes events
💡 Why This Separation Matters:
Benefits:
Testability - Domain logic can be tested without databases or networks
Maintainability - Business rules are isolated from technical changes
Flexibility - You can swap databases or change APIs without touching domain logic
Clarity - Each layer has a single, clear responsibility
Common Pitfall to Avoid:
Don't put business logic in infrastructure code. Keep the "what" (business rules) separate from the "how" (technical implementation).


bun
express uuid
typescript @types/node @types/express @types/uuid
ts-node nodemon
jest @types/jest ts-jest
eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
prettier
🚀 Runtime & Language
bun - Fast JavaScript runtime and package manager
What: Modern alternative to Node.js with built-in bundler and test runner
Why: Significantly faster than npm/node for development, single tool for multiple tasks
typescript - Type-safe JavaScript
What: Adds static typing to JavaScript for better code reliability
Why: Prevents runtime errors, improves IDE support, essential for complex DDD architectures
🌐 Web Framework
express - Minimalist web framework for Node.js
What: Handles HTTP requests, routing, middleware
Why: Simple, unopinionated foundation for your REST APIs and HTTP interfaces
🔧 Development Tools
ts-node - Execute TypeScript files directly
What: Runs .ts files without pre-compilation
Why: Speeds up development workflow, no build step needed for quick testing
nodemon - Auto-restart development server
What: Monitors file changes and restarts server automatically
Why: Faster development cycle, immediate feedback on code changes
🆔 Utilities
uuid - Generate unique identifiers
What: Creates universally unique identifiers (UUIDs)
Why: Essential for entity IDs in DDD aggregates, ensures global uniqueness
📦 Type Definitions
@types/node, @types/express, @types/uuid - TypeScript type definitions
What: Provide type information for JavaScript libraries
Why: Enable IntelliSense, type checking, and better development experience
🧪 Testing
jest - JavaScript testing framework
What: Runs unit tests, provides assertions and mocking
Why: Essential for TDD approach, validates domain logic and business rules
@types/jest - TypeScript types for Jest
What: Type definitions for Jest functions and APIs
Why: Type safety in test files, better IDE support
ts-jest - Jest preprocessor for TypeScript
What: Transforms TypeScript test files for Jest execution
Why: Seamless integration between TypeScript and Jest testing
🏗️ Code Quality
eslint - JavaScript/TypeScript linter
What: Analyzes code for potential errors and style issues
Why: Maintains code consistency, catches bugs early, enforces best practices
@typescript-eslint/parser - ESLint parser for TypeScript
What: Allows ESLint to understand TypeScript syntax
Why: Enables linting of .ts/.tsx files with TypeScript-specific rules
@typescript-eslint/eslint-plugin - ESLint rules for TypeScript
What: Provides TypeScript-specific linting rules
Why: Enforces TypeScript best practices and catches type-related issues
prettier - Code formatter
What: Auto-formats code according to consistent style rules
Why: Eliminates style debates, ensures consistent formatting across team
🎯 Why This Stack?
This toolchain supports your DDD architecture by providing:
Type Safety - TypeScript prevents domain logic errors
Fast Development - Bun + ts-node + nodemon for quick iteration
Quality Assurance - Jest + ESLint + Prettier for reliable, maintainable code
Modern Standards - Industry-standard tools for scalable applications
This combination creates a robust, developer-friendly environment for building complex domain models while maintaining high code quality and development speed.


tsconfig.json
🎯 Modern & Current
ES2020 target/lib - Perfect for modern Node.js development
Strict mode enabled - Best practice for type safety
esModuleInterop - Essential for modern package compatibility
🏗️ Development-Friendly
Path mapping (@/*) - Clean imports throughout your codebase
Decorator support - Required for TypeORM and other libraries
JSON module resolution - Useful for config files
⚡ Performance Optimized
skipLibCheck - Faster compilation with many dependencies
isolatedModules - Enables modern build tools and faster incremental builds

jest.config.js
📋 What This Config Provides:
🚀 Fast Testing - Uses Bun's optimized test runner
📊 Coverage Reports - Tracks test coverage across your domain model
🔧 TypeScript Support - Proper transformation and module resolution
🏗️ DDD-Friendly - Works with your bounded contexts and layered architecture
🛠️ CI/CD Ready - Proper exit codes and timeout handling

.eslintrc.js
🎯 Key Features for Your DDD Platform:
🏗️ Architecture-Aware Rules:
Domain Layer: Strict rules for business logic (no magic numbers, no any)
Infrastructure Layer: More flexible for technical implementations
Test Files: Lenient rules for testing scenarios
📐 DDD Naming Conventions:
PascalCase for classes, interfaces (your aggregates, value objects)
camelCase for methods, variables
UPPER_CASE for constants
⚡ TypeScript-Optimized:
Type-checking rules to catch type errors early
Modern ES2020 features enabled
Bun/Node.js environment support
🔧 Development-Friendly:
Path-based overrides for different layers
Jest environment for test files
Custom logger support (allows console usage)
🚀 Benefits:
🛡️ Type Safety - Catches TypeScript errors before runtime
🏗️ DDD Consistency - Enforces naming and structural patterns
🐛 Bug Prevention - Identifies potential issues in domain logic
📏 Code Quality - Maintains consistent style across contexts
🔄 CI/CD Ready - Integrates with your automated workflows
bun run eslint src/
bun run lint
bun run format:check

.prettierrc
.gitignore
package.json

bun test
github workflows test.yml

Docker Infrastructure Setup
docker-compose.yml
Dockerfile
.dockerignore
docker-compose -f infra/docker-compose.yml up --build
🐳 Docker Infrastructure Setup
Containerizes your entire platform - Packages your Node.js/TypeScript application with all dependencies into isolated, portable containers that run consistently across development, testing, and production environments.
🚢 docker-compose.yml
Orchestrates your microservices ecosystem - Manages multiple interconnected services (Postgres database, RabbitMQ message broker, Elasticsearch search, your application containers) with a single command, ensuring they start in the correct order and can communicate with each other.
📦 Dockerfile
Defines your application container - Specifies how to build your Logistics platform container, including:
Multi-stage builds for smaller production images
Proper dependency installation
Source code copying
Environment configuration
Non-root user for security
🚫 .dockerignore
Optimizes build performance - Excludes unnecessary files (node_modules, tests, documentation) from the Docker build context, resulting in:
Faster builds
Smaller build contexts
Reduced security surface area
🎯 Benefits for Your DDD Architecture:
🔒 Isolation - Each bounded context runs in its own container
🔄 Consistency - Same environment across development/production
⚡ Scalability - Easy horizontal scaling of services
🛠️ Development Speed - Spin up entire platform with docker-compose up
🚀 Deployment - Ready for Kubernetes deployment
Together, these tools transform your complex DDD platform into a manageable, scalable, and deployment-ready system!
[ADD THE DOCKER CODE EXPLANATIONS]

bun add sqlite3
$env:DB_TYPE = "sqlite"
$env:NODE_ENV = "test"
bun test tests/Contexts/Inventory/StockItem/infrastructure/persistence/TypeOrmStockItemRepository.test.ts
💾 SQLite3 Purpose:
🧪 Development & Testing
Lightweight database - File-based, no server setup required
Fast for tests - In-memory option for quick test execution
Easy local development - Single .sqlite file instead of PostgreSQL server
 Benefits for Your DDD Architecture:
🚀 Development Speed
No database server setup - Just works out of the box
Fast iteration - No connection pooling or network overhead
Easy debugging - Direct file access for inspection
🧪 Testing Advantages
Isolated tests - Each test can use its own database file
No cleanup needed - Just delete the file
Faster test execution - No network roundtrips
🔄 Deployment Flexibility
Multiple environments - SQLite for dev, PostgreSQL for production
Easy containerization - Single file database
Backup simplicity - Just copy the .sqlite file

---

Shared Kernel - ValueObject
Base ValueObject Class
src/Shared/domain/ValueObject.ts

ValueObject.test.ts
tests/Shared/domain/ValueObject.test.ts
bun test

Shared Kernel - Uuid ValueObject
Uuid Class
Uuid.test.ts

Shared Kernel - DomainEvent
DomainEvent Base Class
EventBus Interface
DomainEvent.test.ts

Shared Kernel - AggregateRoot
AggregateRoot Class
AggregateRoot.test.ts

First Aggregate - StockItemId
StockItemId Value Object
StockItemId.test.ts

StockItem Value Objects
StockItemName
Create Quantity
Quantity.test.ts

StockItemAdded Domain Event
Create Event
StockItemAdded.test.ts

StockItem Aggregate
StockItem.test.ts

Repository Interface

AddStock Command & Handler
Command
Command Handler
AddStockCommandHandler.test.ts

TypeORM Setup
bun add typeorm pg reflect-metadata
bun add -d @types/pg

TypeORM Config
Entity
Repository Implementation
Integration Test with Real Database

docker-compose up -d
bun test -- TypeOrmStockItemRepository.test.ts

Express Server Setup
bun add express body-parser
bun add -d @types/express supertest @types/supertest

HTTP Server Wrapper
Controller
Routes
Main App
Start Script

bun run dev
curl.exe -X GET http://localhost:3000/health
curl.exe -X POST http://localhost:3000/stock-items -H "Content-Type: application/json" -d '{\"id\": \"550e8400-e29b-41d4-a716-446655440000\", \"name\": \"iPhone 15 Pro\", \"quantity\": 100}'

Acceptance Test with Supertest
add-stock.test.ts

---


Event-Driven Architecture
Integrate RabbitMQ and publish domain events
RabbitMQ Setup
Add RabbitMQ to docker-compose.yml
Install RabbitMQ Client
bun add amqplib
bun add -d @types/amqplib
Verify Connection
- Open http://localhost:15672
- Login: `logistics_user` / `logistics_pass`


RabbitMQ Connection Wrapper
Connection Class
RabbitMQConnection.test.ts

RabbitMQ EventBus Implementation
EventBus Implementation
RabbitMQEventBus.test.ts

Update Repository to Publish Events
Update TypeOrmStockItemRepository
Update Route to Include EventBus
Update InventoryBackendApp
Test Event Publishing

Invoke-WebRequest -Uri http://localhost:3000/stock-items | ConvertFrom-Json
$env:DB_TYPE="sqlite"
bun run dev

$json = '{"id": "550e8400-e29b-41d4-a716-446655440000", "name": "iPhone 15 Pro", "quantity": 100}'
Invoke-WebRequest -Method POST -Uri http://localhost:3000/stock-items -ContentType "application/json" -Body $json


Event Consumer Infrastructure
DomainEventSubscriber Interface
RabbitMQConsumer

First Event Subscriber 
Simple Logger Subscriber

Consumer App
Consumer Script to package.json
Test End-to-End







```bash
# Terminal 1: Start consumer
npm run consumer:inventory

# Terminal 2: Start API
npm run dev

# Terminal 3: Add stock item
curl -X POST http://localhost:3000/stock-items \
  -H "Content-Type: application/json" \
  -d '{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "iPhone 15 Pro",
    "quantity": 100
  }'

# Terminal 1 should show: "📦 Stock item added: iPhone 15 Pro (Qty: 100)"
```

**✅ Checkpoint**: Event-driven flow working end-to-end! 🎉

---

## Step 23: ReserveStock Use Case (1.5 hours)

### 23.1 Create StockItemReserved Event

**File**: `src/Contexts/Inventory/StockItem/domain/events/StockItemReserved.ts`

```typescript
import { DomainEvent } from '@Shared/domain/DomainEvent';

export class StockItemReserved extends DomainEvent {
  static EVENT_NAME = 'inventory.stock_item.reserved';

  constructor(
    public readonly id: string,
    public readonly quantity: number,
    public readonly reservationId: string,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({ aggregateId: id, eventId, occurredOn });
  }

  toPrimitives() {
    return {
      id: this.id,
      quantity: this.quantity,
      reservationId: this.reservationId,
    };
  }

  static fromPrimitives(params: {
    aggregateId: string;
    eventId: string;
    occurredOn: Date;
    attributes: { id: string; quantity: number; reservationId: string };
  }): StockItemReserved {
    return new StockItemReserved(
      params.attributes.id,
      params.attributes.quantity,
      params.attributes.reservationId,
      params.eventId,
      params.occurredOn
    );
  }
}
```

### 23.2 Update StockItem Aggregate

**File**: `src/Contexts/Inventory/StockItem/domain/StockItem.ts`

```typescript
// Add to StockItem class:

reserve(quantity: Quantity, reservationId: string): void {
  if (!this.quantity.isGreaterThanOrEqual(quantity)) {
    throw new Error('Insufficient stock');
  }

  this.quantity = this.quantity.subtract(quantity);

  this.record(
    new StockItemReserved(
      this.id.toString(),
      quantity.getValue(),
      reservationId
    )
  );
}
```

### 23.3 Create ReserveStockCommand

**File**: `src/Contexts/Inventory/StockItem/application/ReserveStock/ReserveStockCommand.ts`

```typescript
export class ReserveStockCommand {
  constructor(
    public readonly id: string,
    public readonly quantity: number,
    public readonly reservationId: string
  ) {}
}
```

### 23.4 Create ReserveStockCommandHandler

**File**: `src/Contexts/Inventory/StockItem/application/ReserveStock/ReserveStockCommandHandler.ts`

```typescript
import { StockItemId } from '../../domain/StockItemId';
import { Quantity } from '../../domain/Quantity';
import { StockItemRepository } from '../../domain/StockItemRepository';
import { ReserveStockCommand } from './ReserveStockCommand';

export class ReserveStockCommandHandler {
  constructor(private readonly repository: StockItemRepository) {}

  async handle(command: ReserveStockCommand): Promise<void> {
    const id = new StockItemId(command.id);
    const quantity = new Quantity(command.quantity);

    const stockItem = await this.repository.find(id);

    if (!stockItem) {
      throw new Error('Stock item not found');
    }

    stockItem.reserve(quantity, command.reservationId);

    await this.repository.save(stockItem);
  }
}
```

### 23.5 Create Controller

**File**: `src/Contexts/Inventory/StockItem/infrastructure/controllers/ReserveStockPutController.ts`

```typescript
import { Request, Response } from 'express';
import { ReserveStockCommandHandler } from '../../application/ReserveStock/ReserveStockCommandHandler';
import { ReserveStockCommand } from '../../application/ReserveStock/ReserveStockCommand';

export class ReserveStockPutController {
  constructor(private readonly handler: ReserveStockCommandHandler) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { quantity, reservationId } = req.body;

      const command = new ReserveStockCommand(id, quantity, reservationId);
      await this.handler.handle(command);

      res.status(200).json({ message: 'Stock reserved successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
```

### 23.6 Add Route

Update `src/apps/inventory/backend/routes/stock-items.route.ts`:

```typescript
// Add to createStockItemsRouter function:

const reserveHandler = new ReserveStockCommandHandler(repository);
const reserveController = new ReserveStockPutController(reserveHandler);

router.put('/stock-items/:id/reserve', (req, res) =>
  reserveController.run(req, res)
);
```

### 23.7 Write Tests

**File**: `tests/Contexts/Inventory/StockItem/domain/StockItem.test.ts`

```typescript
describe('StockItem.reserve', () => {
  it('should reserve stock', () => {
    const id = StockItemId.random();
    const stockItem = StockItem.add(
      id,
      new StockItemName('iPhone'),
      new Quantity(100)
    );

    stockItem.reserve(new Quantity(10), 'reservation-123');

    expect(stockItem.getQuantity().getValue()).toBe(90);
  });

  it('should record StockItemReserved event', () => {
    const id = StockItemId.random();
    const stockItem = StockItem.add(
      id,
      new StockItemName('iPhone'),
      new Quantity(100)
    );

    stockItem.pullDomainEvents(); // Clear creation event

    stockItem.reserve(new Quantity(10), 'reservation-123');

    const events = stockItem.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(StockItemReserved);
  });

  it('should throw error if insufficient stock', () => {
    const id = StockItemId.random();
    const stockItem = StockItem.add(
      id,
      new StockItemName('iPhone'),
      new Quantity(5)
    );

    expect(() => {
      stockItem.reserve(new Quantity(10), 'reservation-123');
    }).toThrow('Insufficient stock');
  });
});
```

### 23.8 Test Reserve API

```bash
# Add stock
curl -X POST http://localhost:3000/stock-items \
  -H "Content-Type: application/json" \
  -d '{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "iPhone 15 Pro",
    "quantity": 100
  }'

# Reserve stock
curl -X PUT http://localhost:3000/stock-items/550e8400-e29b-41d4-a716-446655440000/reserve \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 10,
    "reservationId": "order-12345"
  }'
```

**✅ Checkpoint**: PHASE 2 COMPLETE! Can reserve stock, events flowing! 🎉

---

# 📊 PHASE 3: CQRS & Projections (Week 3)

**Goal**: Build read-side projections in ElasticSearch

---

## Step 24: ElasticSearch Setup (30 min)

### 24.1 Add to docker-compose.yml

```yaml
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.10.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

volumes:
  postgres_data:
  rabbitmq_data:
  elasticsearch_data:
```

### 24.2 Install Client

```bash
npm install @elastic/elasticsearch
```

### 24.3 Start ElasticSearch

```bash
docker-compose up -d elasticsearch
```

### 24.4 Verify

```bash
curl http://localhost:9200
```

**✅ Checkpoint**: ElasticSearch responding

---

## Step 25: ElasticSearch Client Wrapper (45 min)

### 25.1 Create Client

**File**: `src/Shared/infrastructure/persistence/ElasticSearchClient.ts`

```typescript
import { Client } from '@elastic/elasticsearch';

export class ElasticSearchClient {
  private client: Client;

  constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
    });
  }

  async createIndex(index: string, mappings: any): Promise<void> {
    const exists = await this.client.indices.exists({ index });

    if (!exists) {
      await this.client.indices.create({
        index,
        body: { mappings },
      });
      console.log(`✅ Created index: ${index}`);
    }
  }

  async index(index: string, id: string, document: any): Promise<void> {
    await this.client.index({
      index,
      id,
      body: document,
      refresh: 'true',
    });
  }

  async get(index: string, id: string): Promise<any> {
    const result = await this.client.get({
      index,
      id,
    });
    return result._source;
  }

  async search(index: string, query: any): Promise<any[]> {
    const result = await this.client.search({
      index,
      body: { query },
    });
    return result.hits.hits.map((hit: any) => hit._source);
  }

  async update(index: string, id: string, document: any): Promise<void> {
    await this.client.update({
      index,
      id,
      body: { doc: document },
      refresh: 'true',
    });
  }

  getClient(): Client {
    return this.client;
  }
}
```

**✅ Checkpoint**: ElasticSearch client ready

---

## Step 26: Tracking Projection Read Model (45 min)

### 26.1 Create TrackingView Interface

**File**: `src/Contexts/Backoffice/TrackingProjection/domain/TrackingView.ts`

```typescript
export interface TrackingView {
  id: string;
  stockItemId: string;
  stockItemName: string;
  reservedQuantity: number;
  reservationId: string;
  status: 'reserved' | 'registered' | 'in_transit' | 'delivered';
  createdAt: Date;
  updatedAt: Date;
}
```

### 26.2 Create TrackingProjectionRepository

**File**: `src/Contexts/Backoffice/TrackingProjection/domain/TrackingProjectionRepository.ts`

```typescript
import { TrackingView } from './TrackingView';

export interface TrackingProjectionRepository {
  save(tracking: TrackingView): Promise<void>;
  find(id: string): Promise<TrackingView | null>;
  findByStockItemId(stockItemId: string): Promise<TrackingView[]>;
  update(id: string, data: Partial<TrackingView>): Promise<void>;
}
```

### 26.3 Create ElasticSearch Implementation

**File**: `src/Contexts/Backoffice/TrackingProjection/infrastructure/ElasticSearchTrackingProjectionRepository.ts`

```typescript
import { ElasticSearchClient } from '@Shared/infrastructure/persistence/ElasticSearchClient';
import { TrackingView } from '../domain/TrackingView';
import { TrackingProjectionRepository } from '../domain/TrackingProjectionRepository';

export class ElasticSearchTrackingProjectionRepository
  implements TrackingProjectionRepository
{
  private readonly indexName = 'tracking_projections';

  constructor(private readonly client: ElasticSearchClient) {
    this.initializeIndex();
  }

  private async initializeIndex(): Promise<void> {
    await this.client.createIndex(this.indexName, {
      properties: {
        id: { type: 'keyword' },
        stockItemId: { type: 'keyword' },
        stockItemName: { type: 'text' },
        reservedQuantity: { type: 'integer' },
        reservationId: { type: 'keyword' },
        status: { type: 'keyword' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },
      },
    });
  }

  async save(tracking: TrackingView): Promise<void> {
    await this.client.index(this.indexName, tracking.id, tracking);
  }

  async find(id: string): Promise<TrackingView | null> {
    try {
      return await this.client.get(this.indexName, id);
    } catch (error: any) {
      if (error.meta?.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  async findByStockItemId(stockItemId: string): Promise<TrackingView[]> {
    return await this.client.search(this.indexName, {
      match: { stockItemId },
    });
  }

  async update(id: string, data: Partial<TrackingView>): Promise<void> {
    await this.client.update(this.indexName, id, {
      ...data,
      updatedAt: new Date(),
    });
  }
}
```

**✅ Checkpoint**: Projection repository implemented

---

## Step 27: Projection Event Subscriber (1 hour)

### 27.1 Create StockItemReservedProjector

**File**: `src/Contexts/Backoffice/TrackingProjection/application/StockItemReservedProjector.ts`

```typescript
import { DomainEventSubscriber } from '@Shared/domain/DomainEventSubscriber';
import { StockItemReserved } from '../../../Inventory/StockItem/domain/events/StockItemReserved';
import { TrackingProjectionRepository } from '../domain/TrackingProjectionRepository';
import { TrackingView } from '../domain/TrackingView';

export class StockItemReservedProjector
  implements DomainEventSubscriber<StockItemReserved>
{
  constructor(private readonly repository: TrackingProjectionRepository) {}

  subscribedTo() {
    return [StockItemReserved];
  }

  async on(event: StockItemReserved): Promise<void> {
    const tracking: TrackingView = {
      id: event.reservationId,
      stockItemId: event.id,
      stockItemName: 'Unknown', // Will be updated when we have more data
      reservedQuantity: event.quantity,
      reservationId: event.reservationId,
      status: 'reserved',
      createdAt: event.occurredOn,
      updatedAt: event.occurredOn,
    };

    await this.repository.save(tracking);

    console.log(`📊 Projection updated: ${event.reservationId}`);
  }
}
```

### 27.2 Create Backoffice Consumer App

**File**: `src/apps/backoffice/consumers/start.ts`

```typescript
import 'reflect-metadata';
import { RabbitMQConnection } from '../../../Shared/infrastructure/event-bus/RabbitMQConnection';
import { RabbitMQConsumer } from '../../../Shared/infrastructure/event-bus/RabbitMQConsumer';
import { ElasticSearchClient } from '../../../Shared/infrastructure/persistence/ElasticSearchClient';
import { ElasticSearchTrackingProjectionRepository } from '../../../Contexts/Backoffice/TrackingProjection/infrastructure/ElasticSearchTrackingProjectionRepository';
import { StockItemReservedProjector } from '../../../Contexts/Backoffice/TrackingProjection/application/StockItemReservedProjector';

async function startBackofficeConsumer() {
  const connection = new RabbitMQConnection({
    hostname: 'localhost',
    port: 5672,
    username: 'logistics_user',
    password: 'logistics_pass',
  });

  await connection.connect();

  const esClient = new ElasticSearchClient();
  const repository = new ElasticSearchTrackingProjectionRepository(esClient);

  const consumer = new RabbitMQConsumer(connection);
  const subscribers = [new StockItemReservedProjector(repository)];

  await consumer.start(subscribers);

  console.log('✅ Backoffice consumer started');
}

startBackofficeConsumer().catch((error) => {
  console.error('❌ Failed to start backoffice consumer:', error);
  process.exit(1);
});
```

### 27.3 Add Script to package.json

```json
{
  "scripts": {
    "consumer:backoffice": "ts-node src/apps/backoffice/consumers/start.ts"
  }
}
```

**✅ Checkpoint**: Projection consumer ready

---

## Step 28: Query API for Read Side (1 hour)

### 28.1 Create TrackingFinder Query

**File**: `src/Contexts/Backoffice/TrackingProjection/application/Find/FindTrackingQuery.ts`

```typescript
export class FindTrackingQuery {
  constructor(public readonly id: string) {}
}
```

### 28.2 Create Query Handler

**File**: `src/Contexts/Backoffice/TrackingProjection/application/Find/FindTrackingQueryHandler.ts`

```typescript
import { TrackingProjectionRepository } from '../../domain/TrackingProjectionRepository';
import { TrackingView } from '../../domain/TrackingView';
import { FindTrackingQuery } from './FindTrackingQuery';

export class FindTrackingQueryHandler {
  constructor(private readonly repository: TrackingProjectionRepository) {}

  async handle(query: FindTrackingQuery): Promise<TrackingView | null> {
    return await this.repository.find(query.id);
  }
}
```

### 28.3 Create Controller

**File**: `src/Contexts/Backoffice/TrackingProjection/infrastructure/controllers/GetTrackingGetController.ts`

```typescript
import { Request, Response } from 'express';
import { FindTrackingQueryHandler } from '../../application/Find/FindTrackingQueryHandler';
import { FindTrackingQuery } from '../../application/Find/FindTrackingQuery';

export class GetTrackingGetController {
  constructor(private readonly handler: FindTrackingQueryHandler) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const query = new FindTrackingQuery(id);
      const tracking = await this.handler.handle(query);

      if (!tracking) {
        res.status(404).json({ error: 'Tracking not found' });
        return;
      }

      res.status(200).json(tracking);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
```

### 28.4 Create Backoffice API App

**File**: `src/apps/backoffice/backend/BackofficeBackendApp.ts`

```typescript
import 'reflect-metadata';
import { HttpServer } from '../../../Shared/infrastructure/http/HttpServer';
import { ElasticSearchClient } from '../../../Shared/infrastructure/persistence/ElasticSearchClient';
import { ElasticSearchTrackingProjectionRepository } from '../../../Contexts/Backoffice/TrackingProjection/infrastructure/ElasticSearchTrackingProjectionRepository';
import { FindTrackingQueryHandler } from '../../../Contexts/Backoffice/TrackingProjection/application/Find/FindTrackingQueryHandler';
import { GetTrackingGetController } from '../../../Contexts/Backoffice/TrackingProjection/infrastructure/controllers/GetTrackingGetController';
import { Router } from 'express';

export class BackofficeBackendApp {
  private server: HttpServer;

  constructor() {
    this.server = new HttpServer(3001);
  }

  async start(): Promise<void> {
    this.registerRoutes();
    await this.server.start();
  }

  private registerRoutes(): void {
    const router = Router();

    const esClient = new ElasticSearchClient();
    const repository = new ElasticSearchTrackingProjectionRepository(esClient);
    const queryHandler = new FindTrackingQueryHandler(repository);
    const controller = new GetTrackingGetController(queryHandler);

    router.get('/tracking/:id', (req, res) => controller.run(req, res));

    this.server.registerRouter(router);
  }
}
```

### 28.5 Create Start Script

**File**: `src/apps/backoffice/backend/start.ts`

```typescript
import { BackofficeBackendApp } from './BackofficeBackendApp';

const app = new BackofficeBackendApp();

app.start().catch((error) => {
  console.error('❌ Failed to start backoffice API:', error);
  process.exit(1);
});
```

### 28.6 Add Script to package.json

```json
{
  "scripts": {
    "dev:backoffice": "nodemon --watch src --exec ts-node src/apps/backoffice/backend/start.ts"
  }
}
```

### 28.7 Test CQRS End-to-End

```bash
# Terminal 1: Start Inventory API (write side)
npm run dev

# Terminal 2: Start Backoffice API (read side)
npm run dev:backoffice

# Terminal 3: Start Backoffice Consumer (projection builder)
npm run consumer:backoffice

# Terminal 4: Test flow

# 1. Add stock
curl -X POST http://localhost:3000/stock-items \
  -H "Content-Type: application/json" \
  -d '{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "iPhone 15 Pro",
    "quantity": 100
  }'

# 2. Reserve stock
curl -X PUT http://localhost:3000/stock-items/550e8400-e29b-41d4-a716-446655440000/reserve \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 10,
    "reservationId": "order-12345"
  }'

# 3. Query tracking (read side)
curl http://localhost:3001/tracking/order-12345
```

**✅ Checkpoint**: CQRS working! Write and read separated! 🎉

---

## Step 29: Health Check Service (30 min)

### 29.1 Create Health Check App

**File**: `src/apps/health-check/HealthCheckApp.ts`

```typescript
import { HttpServer } from '../../Shared/infrastructure/http/HttpServer';
import { Router } from 'express';
import { AppDataSource } from '../../Shared/infrastructure/persistence/TypeOrmConfig';
import { ElasticSearchClient } from '../../Shared/infrastructure/persistence/ElasticSearchClient';

export class HealthCheckApp {
  private server: HttpServer;

  constructor() {
    this.server = new HttpServer(3002);
  }

  async start(): Promise<void> {
    this.registerRoutes();
    await this.server.start();
  }

  private registerRoutes(): void {
    const router = Router();

    router.get('/health', async (req, res) => {
      const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
          postgres: await this.checkPostgres(),
          elasticsearch: await this.checkElasticSearch(),
        },
      };

      const isHealthy = Object.values(health.services).every((s) => s === 'ok');
      res.status(isHealthy ? 200 : 503).json(health);
    });

    this.server.registerRouter(router);
  }

  private async checkPostgres(): Promise<string> {
    try {
      await AppDataSource.query('SELECT 1');
      return 'ok';
    } catch (error) {
      return 'error';
    }
  }

  private async checkElasticSearch(): Promise<string> {
    try {
      const client = new ElasticSearchClient();
      await client.getClient().ping();
      return 'ok';
    } catch (error) {
      return 'error';
    }
  }
}
```

### 29.2 Create Start Script

**File**: `src/apps/health-check/start.ts`

```typescript
import 'reflect-metadata';
import { HealthCheckApp } from './HealthCheckApp';
import { AppDataSource } from '../../Shared/infrastructure/persistence/TypeOrmConfig';

async function start() {
  await AppDataSource.initialize();

  const app = new HealthCheckApp();
  await app.start();
}

start().catch((error) => {
  console.error('❌ Failed to start health check:', error);
  process.exit(1);
});
```

### 29.3 Test Health Check

```bash
curl http://localhost:3002/health
```

**✅ Checkpoint**: PHASE 3 COMPLETE! CQRS + Projections working! 🎉

---

# 📦 PHASE 4: Second Bounded Context - Logistics (Week 4)

**Goal**: Build Package aggregate and cross-context communication

---

## Step 30: Package Domain Model (1.5 hours)

### 30.1 Create PackageId

**File**: `src/Contexts/Logistics/Package/domain/PackageId.ts`

```typescript
import { Uuid } from '@Shared/domain/Uuid';

export class PackageId extends Uuid {
  static random(): PackageId {
    return new PackageId(super.random().toString());
  }
}
```

### 30.2 Create TrackingNumber

**File**: `src/Contexts/Logistics/Package/domain/TrackingNumber.ts`

```typescript
import { ValueObject } from '@Shared/domain/ValueObject';

export class TrackingNumber extends ValueObject<string> {
  constructor(value: string) {
    super(value);
    this.ensureIsValid(value);
  }

  private ensureIsValid(value: string): void {
    if (value.length !== 10) {
      throw new Error('Tracking number must be 10 characters');
    }
    if (!/^[A-Z0-9]+$/.test(value)) {
      throw new Error('Tracking number must be alphanumeric uppercase');
    }
  }

  static generate(): TrackingNumber {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return new TrackingNumber(result);
  }
}
```

### 30.3 Create PackageRegistered Event

**File**: `src/Contexts/Logistics/Package/domain/events/PackageRegistered.ts`

```typescript
import { DomainEvent } from '@Shared/domain/DomainEvent';

export class PackageRegistered extends DomainEvent {
  static EVENT_NAME = 'logistics.package.registered';

  constructor(
    public readonly id: string,
    public readonly trackingNumber: string,
    public readonly reservationId: string,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({ aggregateId: id, eventId, occurredOn });
  }

  toPrimitives() {
    return {
      id: this.id,
      trackingNumber: this.trackingNumber,
      reservationId: this.reservationId,
    };
  }

  static fromPrimitives(params: {
    aggregateId: string;
    eventId: string;
    occurredOn: Date;
    attributes: { id: string; trackingNumber: string; reservationId: string };
  }): PackageRegistered {
    return new PackageRegistered(
      params.attributes.id,
      params.attributes.trackingNumber,
      params.attributes.reservationId,
      params.eventId,
      params.occurredOn
    );
  }
}
```

### 30.4 Create Package Aggregate

**File**: `src/Contexts/Logistics/Package/domain/Package.ts`

```typescript
import { AggregateRoot } from '@Shared/domain/AggregateRoot';
import { PackageId } from './PackageId';
import { TrackingNumber } from './TrackingNumber';
import { PackageRegistered } from './events/PackageRegistered';

export class Package extends AggregateRoot {
  private status: 'registered' | 'in_transit' | 'delivered' = 'registered';

  private constructor(
    private readonly id: PackageId,
    private readonly trackingNumber: TrackingNumber,
    private readonly reservationId: string
  ) {
    super();
  }

  static register(
    id: PackageId,
    trackingNumber: TrackingNumber,
    reservationId: string
  ): Package {
    const pkg = new Package(id, trackingNumber, reservationId);

    pkg.record(
      new PackageRegistered(
        id.toString(),
        trackingNumber.toString(),
        reservationId
      )
    );

    return pkg;
  }

  getId(): PackageId {
    return this.id;
  }

  getTrackingNumber(): TrackingNumber {
    return this.trackingNumber;
  }

  getStatus(): string {
    return this.status;
  }

  toPrimitives() {
    return {
      id: this.id.toString(),
      trackingNumber: this.trackingNumber.toString(),
      reservationId: this.reservationId,
      status: this.status,
    };
  }
}
```

### 30.5 Write Tests

**File**: `tests/Contexts/Logistics/Package/domain/Package.test.ts`

```typescript
import { Package } from '../../../../../src/Contexts/Logistics/Package/domain/Package';
import { PackageId } from '../../../../../src/Contexts/Logistics/Package/domain/PackageId';
import { TrackingNumber } from '../../../../../src/Contexts/Logistics/Package/domain/TrackingNumber';
import { PackageRegistered } from '../../../../../src/Contexts/Logistics/Package/domain/events/PackageRegistered';

describe('Package', () => {
  it('should register package', () => {
    const id = PackageId.random();
    const trackingNumber = TrackingNumber.generate();
    const reservationId = 'order-123';

    const pkg = Package.register(id, trackingNumber, reservationId);

    expect(pkg.getId()).toEqual(id);
    expect(pkg.getTrackingNumber()).toEqual(trackingNumber);
    expect(pkg.getStatus()).toBe('registered');
  });

  it('should record PackageRegistered event', () => {
    const id = PackageId.random();
    const trackingNumber = TrackingNumber.generate();

    const pkg = Package.register(id, trackingNumber, 'order-123');
    const events = pkg.pullDomainEvents();

    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(PackageRegistered);
  });
});
```

**✅ Checkpoint**: Package aggregate complete with tests

---

## Step 31: Cross-Context Event Subscriber (1 hour)

### 31.1 Create Package Repository

**File**: `src/Contexts/Logistics/Package/domain/PackageRepository.ts`

```typescript
import { Package } from './Package';
import { PackageId } from './PackageId';

export interface PackageRepository {
  save(pkg: Package): Promise<void>;
  find(id: PackageId): Promise<Package | null>;
}
```

### 31.2 Create TypeORM Entity

**File**: `src/Contexts/Logistics/Package/infrastructure/persistence/PackageEntity.ts`

```typescript
import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('packages')
export class PackageEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column()
  trackingNumber!: string;

  @Column()
  reservationId!: string;

  @Column()
  status!: string;
}
```

### 31.3 Create Repository Implementation

**File**: `src/Contexts/Logistics/Package/infrastructure/persistence/TypeOrmPackageRepository.ts`

```typescript
import { Repository } from 'typeorm';
import { Package } from '../../domain/Package';
import { PackageId } from '../../domain/PackageId';
import { TrackingNumber } from '../../domain/TrackingNumber';
import { PackageRepository } from '../../domain/PackageRepository';
import { PackageEntity } from './PackageEntity';
import { AppDataSource } from '@Shared/infrastructure/persistence/TypeOrmConfig';
import { EventBus } from '@Shared/domain/EventBus';

export class TypeOrmPackageRepository implements PackageRepository {
  private repository: Repository<PackageEntity>;

  constructor(private readonly eventBus?: EventBus) {
    this.repository = AppDataSource.getRepository(PackageEntity);
  }

  async save(pkg: Package): Promise<void> {
    const primitives = pkg.toPrimitives();
    const entity = this.repository.create(primitives);

    await this.repository.save(entity);

    if (this.eventBus) {
      const events = pkg.pullDomainEvents();
      await this.eventBus.publish(events);
    }
  }

  async find(id: PackageId): Promise<Package | null> {
    const entity = await this.repository.findOne({
      where: { id: id.toString() },
    });

    if (!entity) {
      return null;
    }

    return Package.register(
      new PackageId(entity.id),
      new TrackingNumber(entity.trackingNumber),
      entity.reservationId
    );
  }
}
```

### 31.4 Create StockReserved to Package Subscriber

**File**: `src/Contexts/Logistics/Package/application/subscribers/CreatePackageOnStockReserved.ts`

```typescript
import { DomainEventSubscriber } from '@Shared/domain/DomainEventSubscriber';
import { StockItemReserved } from '../../../../Inventory/StockItem/domain/events/StockItemReserved';
import { Package } from '../../domain/Package';
import { PackageId } from '../../domain/PackageId';
import { TrackingNumber } from '../../domain/TrackingNumber';
import { PackageRepository } from '../../domain/PackageRepository';

export class CreatePackageOnStockReserved
  implements DomainEventSubscriber<StockItemReserved>
{
  constructor(private readonly repository: PackageRepository) {}

  subscribedTo() {
    return [StockItemReserved];
  }

  async on(event: StockItemReserved): Promise<void> {
    const pkg = Package.register(
      PackageId.random(),
      TrackingNumber.generate(),
      event.reservationId
    );

    await this.repository.save(pkg);

    console.log(`📦 Package created for reservation: ${event.reservationId}`);
  }
}
```

### 31.5 Update Logistics Consumer

**File**: `src/apps/logistics/consumers/start.ts`

```typescript
import 'reflect-metadata';
import { AppDataSource } from '../../../Shared/infrastructure/persistence/TypeOrmConfig';
import { RabbitMQConnection } from '../../../Shared/infrastructure/event-bus/RabbitMQConnection';
import { RabbitMQEventBus } from '../../../Shared/infrastructure/event-bus/RabbitMQEventBus';
import { RabbitMQConsumer } from '../../../Shared/infrastructure/event-bus/RabbitMQConsumer';
import { TypeOrmPackageRepository } from '../../../Contexts/Logistics/Package/infrastructure/persistence/TypeOrmPackageRepository';
import { CreatePackageOnStockReserved } from '../../../Contexts/Logistics/Package/application/subscribers/CreatePackageOnStockReserved';

async function startLogisticsConsumer() {
  await AppDataSource.initialize();

  const rabbitConnection = new RabbitMQConnection({
    hostname: 'localhost',
    port: 5672,
    username: 'logistics_user',
    password: 'logistics_pass',
  });

  await rabbitConnection.connect();

  const eventBus = new RabbitMQEventBus(rabbitConnection);
  const repository = new TypeOrmPackageRepository(eventBus);

  const consumer = new RabbitMQConsumer(rabbitConnection);
  const subscribers = [new CreatePackageOnStockReserved(repository)];

  await consumer.start(subscribers);

  console.log('✅ Logistics consumer started');
}

startLogisticsConsumer().catch((error) => {
  console.error('❌ Failed to start logistics consumer:', error);
  process.exit(1);
});
```

### 31.6 Add Script and Update TypeORM Config

Add to package.json:

```json
{
  "scripts": {
    "consumer:logistics": "ts-node src/apps/logistics/consumers/start.ts"
  }
}
```

Update TypeORM config to include PackageEntity:

```typescript
// src/Shared/infrastructure/persistence/TypeOrmConfig.ts
import { PackageEntity } from '../../../Contexts/Logistics/Package/infrastructure/persistence/PackageEntity';

export const AppDataSource = new DataSource({
  // ... existing config
  entities: [StockItemEntity, PackageEntity],
});
```

### 31.7 Test Cross-Context Flow

```bash
# Terminal 1: Inventory API
npm run dev

# Terminal 2: Logistics Consumer
npm run consumer:logistics

# Terminal 3: Test

# Add stock
curl -X POST http://localhost:3000/stock-items \
  -H "Content-Type: application/json" \
  -d '{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "iPhone 15 Pro",
    "quantity": 100
  }'

# Reserve stock (should trigger package creation)
curl -X PUT http://localhost:3000/stock-items/550e8400-e29b-41d4-a716-446655440000/reserve \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 10,
    "reservationId": "order-99999"
  }'

# Terminal 2 should show: "📦 Package created for reservation: order-99999"
```

**✅ Checkpoint**: Cross-context communication working! Inventory → Logistics! 🎉

---

## Step 32: Update Tracking Projection with Package Data (45 min)

### 32.1 Create PackageRegisteredProjector

**File**: `src/Contexts/Backoffice/TrackingProjection/application/PackageRegisteredProjector.ts`

```typescript
import { DomainEventSubscriber } from '@Shared/domain/DomainEventSubscriber';
import { PackageRegistered } from '../../../Logistics/Package/domain/events/PackageRegistered';
import { TrackingProjectionRepository } from '../domain/TrackingProjectionRepository';

export class PackageRegisteredProjector
  implements DomainEventSubscriber<PackageRegistered>
{
  constructor(private readonly repository: TrackingProjectionRepository) {}

  subscribedTo() {
    return [PackageRegistered];
  }

  async on(event: PackageRegistered): Promise<void> {
    await this.repository.update(event.reservationId, {
      status: 'registered',
      updatedAt: event.occurredOn,
    });

    console.log(
      `📊 Tracking projection updated with package: ${event.trackingNumber}`
    );
  }
}
```

### 32.2 Update Backoffice Consumer

**File**: `src/apps/backoffice/consumers/start.ts`

```typescript
// Add to imports:
import { PackageRegisteredProjector } from '../../../Contexts/Backoffice/TrackingProjection/application/PackageRegisteredProjector';

// Update subscribers array:
const subscribers = [
  new StockItemReservedProjector(repository),
  new PackageRegisteredProjector(repository),
];
```

### 32.3 Test Full Flow

```bash
# Start all services
npm run dev                      # Inventory API (port 3000)
npm run dev:backoffice           # Backoffice API (port 3001)
npm run consumer:logistics       # Logistics consumer
npm run consumer:backoffice      # Backoffice consumer

# Test complete flow:

# 1. Add stock
curl -X POST http://localhost:3000/stock-items \
  -H "Content-Type: application/json" \
  -d '{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "iPhone 15 Pro",
    "quantity": 100
  }'

# 2. Reserve stock
curl -X PUT http://localhost:3000/stock-items/550e8400-e29b-41d4-a716-446655440000/reserve \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 10,
    "reservationId": "order-final-test"
  }'

# 3. Query tracking (should show "registered" status)
curl http://localhost:3001/tracking/order-final-test
```

**✅ Checkpoint**: PHASE 4 COMPLETE! Full event-driven flow working! 🎉

---

# ☸️ PHASE 5: Kubernetes Deployment (Bonus Week)

**Goal**: Deploy to Kubernetes for production-ready infrastructure

---

## Step 33: Dockerize Applications (2 hours)

### 33.1 Create Multi-Stage Dockerfile

**File**: `Dockerfile`

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

RUN npm ci

COPY src ./src

RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production

# This will be overridden by k8s
CMD ["node", "dist/apps/inventory/backend/start.js"]
```

### 33.2 Create .dockerignore

**File**: `.dockerignore`

```
node_modules
dist
.git
.env
*.log
tests
.vscode
coverage
```

### 33.3 Build and Test Image

```bash
# Build
docker build -t logistics-platform:latest .

# Test
docker run -e DB_HOST=host.docker.internal \
  -e RABBITMQ_HOST=host.docker.internal \
  -p 3000:3000 \
  logistics-platform:latest
```

**✅ Checkpoint**: Docker image built and tested

---

## Step 34: Kubernetes Manifests - Databases (1.5 hours)

### 34.1 Create Namespace

**File**: `k8s/namespace.yaml`

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: logistics-platform
```

### 34.2 PostgreSQL StatefulSet

**File**: `k8s/postgres.yaml`

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: postgres-config
  namespace: logistics-platform
data:
  POSTGRES_DB: logistics
  POSTGRES_USER: logistics_user
  POSTGRES_PASSWORD: logistics_pass

---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: logistics-platform
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi

---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: logistics-platform
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:15-alpine
          ports:
            - containerPort: 5432
          envFrom:
            - configMapRef:
                name: postgres-config
          volumeMounts:
            - name: postgres-storage
              mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
    - metadata:
        name: postgres-storage
      spec:
        accessModes: ['ReadWriteOnce']
        resources:
          requests:
            storage: 5Gi

---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: logistics-platform
spec:
  selector:
    app: postgres
  ports:
    - port: 5432
      targetPort: 5432
  clusterIP: None
```

### 34.3 RabbitMQ StatefulSet

**File**: `k8s/rabbitmq.yaml`

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: rabbitmq-config
  namespace: logistics-platform
data:
  RABBITMQ_DEFAULT_USER: logistics_user
  RABBITMQ_DEFAULT_PASS: logistics_pass

---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: rabbitmq
  namespace: logistics-platform
spec:
  serviceName: rabbitmq
  replicas: 1
  selector:
    matchLabels:
      app: rabbitmq
  template:
    metadata:
      labels:
        app: rabbitmq
    spec:
      containers:
        - name: rabbitmq
          image: rabbitmq:3-management-alpine
          ports:
            - containerPort: 5672
              name: amqp
            - containerPort: 15672
              name: management
          envFrom:
            - configMapRef:
                name: rabbitmq-config
          volumeMounts:
            - name: rabbitmq-storage
              mountPath: /var/lib/rabbitmq
  volumeClaimTemplates:
    - metadata:
        name: rabbitmq-storage
      spec:
        accessModes: ['ReadWriteOnce']
        resources:
          requests:
            storage: 2Gi

---
apiVersion: v1
kind: Service
metadata:
  name: rabbitmq
  namespace: logistics-platform
spec:
  selector:
    app: rabbitmq
  ports:
    - port: 5672
      targetPort: 5672
      name: amqp
    - port: 15672
      targetPort: 15672
      name: management
  clusterIP: None
```

### 34.4 ElasticSearch StatefulSet

**File**: `k8s/elasticsearch.yaml`

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: elasticsearch
  namespace: logistics-platform
spec:
  serviceName: elasticsearch
  replicas: 1
  selector:
    matchLabels:
      app: elasticsearch
  template:
    metadata:
      labels:
        app: elasticsearch
    spec:
      containers:
        - name: elasticsearch
          image: docker.elastic.co/elasticsearch/elasticsearch:8.10.0
          env:
            - name: discovery.type
              value: single-node
            - name: xpack.security.enabled
              value: 'false'
            - name: ES_JAVA_OPTS
              value: '-Xms512m -Xmx512m'
          ports:
            - containerPort: 9200
          volumeMounts:
            - name: es-storage
              mountPath: /usr/share/elasticsearch/data
  volumeClaimTemplates:
    - metadata:
        name: es-storage
      spec:
        accessModes: ['ReadWriteOnce']
        resources:
          requests:
            storage: 5Gi

---
apiVersion: v1
kind: Service
metadata:
  name: elasticsearch
  namespace: logistics-platform
spec:
  selector:
    app: elasticsearch
  ports:
    - port: 9200
      targetPort: 9200
  clusterIP: None
```

### 34.5 Deploy Infrastructure

```bash
# Start minikube
minikube start --cpus=4 --memory=8192

# Apply manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/rabbitmq.yaml
kubectl apply -f k8s/elasticsearch.yaml

# Wait for ready
kubectl wait --for=condition=ready pod -l app=postgres -n logistics-platform --timeout=300s
kubectl wait --for=condition=ready pod -l app=rabbitmq -n logistics-platform --timeout=300s
kubectl wait --for=condition=ready pod -l app=elasticsearch -n logistics-platform --timeout=300s
```

**✅ Checkpoint**: Infrastructure deployed to Kubernetes

---

## Step 35: Kubernetes Manifests - Applications (2 hours)

### 35.1 Inventory API Deployment

**File**: `k8s/inventory-api.yaml`

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: inventory-config
  namespace: logistics-platform
data:
  DB_HOST: postgres
  DB_PORT: '5432'
  DB_USER: logistics_user
  DB_PASSWORD: logistics_pass
  DB_NAME: logistics
  RABBITMQ_HOST: rabbitmq
  RABBITMQ_PORT: '5672'
  RABBITMQ_USER: logistics_user
  RABBITMQ_PASSWORD: logistics_pass

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: inventory-api
  namespace: logistics-platform
spec:
  replicas: 2
  selector:
    matchLabels:
      app: inventory-api
  template:
    metadata:
      labels:
        app: inventory-api
    spec:
      containers:
        - name: inventory-api
          image: logistics-platform:latest
          imagePullPolicy: Never # For minikube
          command: ['node', 'dist/apps/inventory/backend/start.js']
          ports:
            - containerPort: 3000
          envFrom:
            - configMapRef:
                name: inventory-config
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: inventory-api
  namespace: logistics-platform
spec:
  selector:
    app: inventory-api
  ports:
    - port: 80
      targetPort: 3000
  type: ClusterIP
```

### 35.2 Logistics Consumer Deployment

**File**: `k8s/logistics-consumer.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: logistics-consumer
  namespace: logistics-platform
spec:
  replicas: 1
  selector:
    matchLabels:
      app: logistics-consumer
  template:
    metadata:
      labels:
        app: logistics-consumer
    spec:
      containers:
        - name: logistics-consumer
          image: logistics-platform:latest
          imagePullPolicy: Never
          command: ['node', 'dist/apps/logistics/consumers/start.js']
          envFrom:
            - configMapRef:
                name: inventory-config
```

### 35.3 Backoffice API Deployment

**File**: `k8s/backoffice-api.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backoffice-api
  namespace: logistics-platform
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backoffice-api
  template:
    metadata:
      labels:
        app: backoffice-api
    spec:
      containers:
        - name: backoffice-api
          image: logistics-platform:latest
          imagePullPolicy: Never
          command: ['node', 'dist/apps/backoffice/backend/start.js']
          ports:
            - containerPort: 3001
          env:
            - name: ELASTICSEARCH_URL
              value: http://elasticsearch:9200
          livenessProbe:
            httpGet:
              path: /health
              port: 3001
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 3001
            initialDelaySeconds: 10
            periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: backoffice-api
  namespace: logistics-platform
spec:
  selector:
    app: backoffice-api
  ports:
    - port: 80
      targetPort: 3001
  type: ClusterIP
```

### 35.4 Backoffice Consumer Deployment

**File**: `k8s/backoffice-consumer.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backoffice-consumer
  namespace: logistics-platform
spec:
  replicas: 1
  selector:
    matchLabels:
      app: backoffice-consumer
  template:
    metadata:
      labels:
        app: backoffice-consumer
    spec:
      containers:
        - name: backoffice-consumer
          image: logistics-platform:latest
          imagePullPolicy: Never
          command: ['node', 'dist/apps/backoffice/consumers/start.js']
          env:
            - name: ELASTICSEARCH_URL
              value: http://elasticsearch:9200
            - name: RABBITMQ_HOST
              value: rabbitmq
            - name: RABBITMQ_PORT
              value: '5672'
            - name: RABBITMQ_USER
              value: logistics_user
            - name: RABBITMQ_PASSWORD
              value: logistics_pass
```

### 35.5 Ingress Controller

**File**: `k8s/ingress.yaml`

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: logistics-ingress
  namespace: logistics-platform
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
    - host: logistics.local
      http:
        paths:
          - path: /api/inventory
            pathType: Prefix
            backend:
              service:
                name: inventory-api
                port:
                  number: 80
          - path: /api/backoffice
            pathType: Prefix
            backend:
              service:
                name: backoffice-api
                port:
                  number: 80
```

### 35.6 Deploy Applications

```bash
# Build and load image into minikube
eval $(minikube docker-env)
docker build -t logistics-platform:latest .

# Deploy applications
kubectl apply -f k8s/inventory-api.yaml
kubectl apply -f k8s/logistics-consumer.yaml
kubectl apply -f k8s/backoffice-api.yaml
kubectl apply -f k8s/backoffice-consumer.yaml
kubectl apply -f k8s/ingress.yaml

# Wait for ready
kubectl wait --for=condition=ready pod -l app=inventory-api -n logistics-platform --timeout=300s

# Check status
kubectl get pods -n logistics-platform
```

**✅ Checkpoint**: Applications deployed to Kubernetes

---

## Step 36: Health Checks and Monitoring (1.5 hours)

### 36.1 Update Health Check Endpoint

**File**: `src/apps/inventory/backend/routes/health.route.ts`

```typescript
import { Router } from 'express';
import { AppDataSource } from '../../../../Shared/infrastructure/persistence/TypeOrmConfig';

export function createHealthRouter(): Router {
  const router = Router();

  router.get('/health', async (req, res) => {
    try {
      await AppDataSource.query('SELECT 1');
      res.status(200).json({
        status: 'ok',
        service: 'inventory-api',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(503).json({
        status: 'error',
        service: 'inventory-api',
        error: (error as Error).message,
      });
    }
  });

  return router;
}
```

### 36.2 Add Health Route to App

Update `src/apps/inventory/backend/InventoryBackendApp.ts`:

```typescript
import { createHealthRouter } from './routes/health.route';

// In registerRoutes():
const healthRouter = createHealthRouter();
this.server.registerRouter(healthRouter);
```

### 36.3 Create Prometheus Metrics (Optional)

**File**: `k8s/prometheus.yaml`

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: logistics-platform
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
    scrape_configs:
      - job_name: 'kubernetes-pods'
        kubernetes_sd_configs:
          - role: pod
            namespaces:
              names:
                - logistics-platform

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
  namespace: logistics-platform
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      containers:
        - name: prometheus
          image: prom/prometheus:latest
          ports:
            - containerPort: 9090
          volumeMounts:
            - name: config
              mountPath: /etc/prometheus
      volumes:
        - name: config
          configMap:
            name: prometheus-config

---
apiVersion: v1
kind: Service
metadata:
  name: prometheus
  namespace: logistics-platform
spec:
  selector:
    app: prometheus
  ports:
    - port: 9090
      targetPort: 9090
  type: NodePort
```

### 36.4 Test Health Checks

```bash
# Port forward to test
kubectl port-forward -n logistics-platform svc/inventory-api 3000:80

# Test health endpoint
curl http://localhost:3000/health
```

**✅ Checkpoint**: Health checks working in Kubernetes

---

## Step 37: End-to-End Test in Kubernetes (45 min)

### 37.1 Port Forward Services

```bash
# Terminal 1: Inventory API
kubectl port-forward -n logistics-platform svc/inventory-api 3000:80

# Terminal 2: Backoffice API
kubectl port-forward -n logistics-platform svc/backoffice-api 3001:80
```

### 37.2 Run Complete Flow

```bash
# 1. Add stock
curl -X POST http://localhost:3000/stock-items \
  -H "Content-Type: application/json" \
  -d '{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "iPhone 15 Pro - K8s Test",
    "quantity": 100
  }'

# 2. Reserve stock
curl -X PUT http://localhost:3000/stock-items/550e8400-e29b-41d4-a716-446655440000/reserve \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 5,
    "reservationId": "k8s-order-123"
  }'

# 3. Wait 2 seconds for event processing

# 4. Query tracking
curl http://localhost:3001/tracking/k8s-order-123
```

### 37.3 Check Logs

```bash
# Check consumer logs
kubectl logs -n logistics-platform -l app=logistics-consumer --tail=50
kubectl logs -n logistics-platform -l app=backoffice-consumer --tail=50

# Check API logs
kubectl logs -n logistics-platform -l app=inventory-api --tail=50
```

**✅ Checkpoint**: PHASE 5 COMPLETE! Running in Kubernetes! 🎉

---

# 🎓 FINAL CHECKLIST

## ✅ What You've Built

### Phase 1: Foundation

- [x] TypeScript project with DDD base classes
- [x] First aggregate (StockItem) with value objects
- [x] Domain events
- [x] Repository pattern with TypeORM
- [x] REST API with Express
- [x] Unit and integration tests
- [x] Acceptance tests with Supertest

### Phase 2: Event-Driven Architecture

- [x] RabbitMQ integration
- [x] Event publishing after aggregate changes
- [x] Event consumers
- [x] Second use case (ReserveStock)
- [x] Asynchronous cross-context communication

### Phase 3: CQRS

- [x] ElasticSearch for read models
- [x] Projections from domain events
- [x] Separate read/write APIs
- [x] Query handlers for fast reads
- [x] Health check service

### Phase 4: Second Bounded Context

- [x] Package aggregate (Logistics)
- [x] Cross-context event subscribers
- [x] Auto-creation of packages from stock reservations
- [x] Multi-context projection updates

### Phase 5: Kubernetes

- [x] Dockerized applications
- [x] Kubernetes manifests for all services
- [x] StatefulSets for databases
- [x] Deployments for APIs and consumers
- [x] Health checks and readiness probes
- [x] Service discovery
- [x] Ingress controller

---

## 🚀 Next Steps for Production

### Security

1. Add authentication (JWT)
2. Add authorization (role-based access)
3. Use Kubernetes Secrets for passwords
4. Enable TLS/HTTPS
5. Add rate limiting

### Observability

1. Add structured logging (Winston/Pino)
2. Add distributed tracing (Jaeger/Zipkin)
3. Add metrics (Prometheus + Grafana dashboards)
4. Add alerting rules
5. Centralized log aggregation (ELK stack)

### Resilience

1. Add circuit breakers
2. Add retry policies with exponential backoff
3. Add dead letter queues for failed events
4. Add saga pattern for distributed transactions
5. Add chaos engineering tests

### Performance

1. Add caching (Redis)
2. Optimize database queries
3. Add database indexes
4. Implement pagination for queries
5. Add API rate limiting

### CI/CD

1. GitHub Actions for automated testing
2. Automated Docker builds
3. Automated Kubernetes deployments
4. Blue-green deployments
5. Rollback strategies

---

## 📚 What You've Learned

### Architectural Patterns

✅ Domain-Driven Design (DDD)
✅ Command Query Responsibility Segregation (CQRS)
✅ Event-Driven Architecture (EDA)
✅ Hexagonal Architecture (Ports & Adapters)
✅ Microservices Architecture

### Technical Skills

✅ TypeScript advanced patterns
✅ PostgreSQL with TypeORM
✅ RabbitMQ message broker
✅ ElasticSearch for search
✅ Docker containerization
✅ Kubernetes orchestration
✅ Test-Driven Development (TDD)

### Software Engineering

✅ Separation of concerns
✅ Dependency inversion
✅ Event sourcing basics
✅ Eventual consistency
✅ Service decoupling
✅ Production-ready code structure

---

## 🎯 Congratulations!

You've built a **production-grade, event-driven logistics platform** with:

- ✅ 2 bounded contexts (Inventory, Logistics)
- ✅ 1 read-side projection (Backoffice)
- ✅ 3 aggregates (StockItem, Package, TrackingView)
- ✅ Multiple domain events
- ✅ Asynchronous communication via RabbitMQ
- ✅ CQRS separation
- ✅ Kubernetes deployment
- ✅ Comprehensive tests

This is **enterprise-level architecture** used by companies like Amazon, Uber, and Netflix!

---

## 💼 Portfolio Impact

This project demonstrates:

1. **Senior-level architectural skills**
2. **Production-ready code quality**
3. **Deep understanding of distributed systems**
4. **DevOps/Infrastructure knowledge**
5. **Testing best practices**

**You can now confidently discuss:**

- Event-driven microservices
- CQRS trade-offs
- Domain-Driven Design patterns
- Kubernetes deployments
- Message broker patterns
- Read/write separation

---

**🔥 You're ready to build world-class software! 🔥**

Perfect! I've created a **complete, detailed implementation roadmap** with 37 sequential steps covering all 5 phases.

## 🎯 What You Now Have

### **A Complete Step-by-Step Guide** covering:

1. **Phase 1 (Week 1)**: Foundation - 16 steps

   - Project setup, Docker, Shared Kernel, First aggregate, REST API, Tests

2. **Phase 2 (Week 2)**: Event-Driven - 7 steps

   - RabbitMQ, Event publishing, Consumers, ReserveStock use case

3. **Phase 3 (Week 3)**: CQRS - 6 steps

   - ElasticSearch, Projections, Separate read/write, Health checks

4. **Phase 4 (Week 4)**: Second Context - 3 steps

   - Package aggregate, Cross-context events, Full tracking

5. **Phase 5 (Bonus)**: Kubernetes - 5 steps
   - Docker, K8s manifests, StatefulSets, Deployments, Production testing

---

## 💡 Key Features of This Guide

✅ **Exact order** - Each step builds on previous ones  
✅ **Time estimates** - Plan your coding sessions  
✅ **Test-driven** - Write tests first, then code  
✅ **Checkpoints** - Verify each milestone works  
✅ **Complete code** - Full implementations, not snippets  
✅ **Production patterns** - Real-world architecture

---

## 🚀 Ready to Start?

Pick your starting point:

1. **Start from Step 1** - Build everything from scratch
2. **Jump to Phase 2** - If you already have a basic TypeScript setup
3. **Ask for specific code** - I can generate any step's complete implementation

Which step should I help you implement first? Or would you like me to create a **quick-start script** that automates Steps 1-6 so you can jump right into the interesting DDD parts?
