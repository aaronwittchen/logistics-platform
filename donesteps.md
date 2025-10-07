```bash
bun run dev
bun run dev:backoffice
bun run consumer:backoffice

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