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

````bash
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
bun run consumer:logistics       # Logistics consumer
bun run consumer:backoffice      # Backoffice consumer

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
````

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
