# Microservices

The microservices are located in a separate repository at `../server/`. This folder is kept for reference only.

## Service Locations

| Service | Path |
|---------|------|
| Gateway | `../server/1-gateway-service` |
| Notification | `../server/2-notification-service` |
| Auth | `../server/3-auth-service` |
| Users | `../server/4-users-service` |
| Gig | `../server/5-gig-service` |
| Shared Library | `../server/fixme-shared` |

## Running Locally

Start the required infrastructure services first:

```bash
docker compose up -d redis mongodb mysql postgres rabbitmq elasticsearch
```

Then start the microservices in this order:
1. notification service
2. auth service
3. users service
4. gig service
5. gateway service (start last, after all other services are running)

## Using as a Monorepo

This folder can be used as a monorepo to keep all services in one place. To set it up:

1. Copy each service into this folder:
   ```bash
   cp -r ../server/1-gateway-service ./
   cp -r ../server/2-notification-service ./
   cp -r ../server/3-auth-service ./
   cp -r ../server/4-users-service ./
   cp -r ../server/5-gig-service ./
   cp -r ../server/fixme-shared ./
   ```

2. Update `docker-compose.yaml` to use local paths instead of `../server/`:
   ```yaml
   build:
     context: ./2-notification-service  # instead of ../server/2-notification-service
   ```

3. Update `env_file` paths in docker-compose.yaml accordingly.

4. Keep services in sync or remove the separate `../server/` repositories to avoid duplication.

## Shared node_modules (True Monorepo)

To use a single `node_modules` folder with shared dependencies, set up npm/pnpm/yarn workspaces:

### Option 1: npm Workspaces

1. Create a root `package.json` in this folder:
   ```json
   {
     "name": "fixme-monorepo",
     "private": true,
     "workspaces": [
       "1-gateway-service",
       "2-notification-service",
       "3-auth-service",
       "4-users-service",
       "5-gig-service",
       "fixme-shared"
     ]
   }
   ```

2. Run `npm install` from the root — dependencies are hoisted to a single `node_modules/`.

### Option 2: pnpm Workspaces (recommended)

1. Create `pnpm-workspace.yaml` in this folder:
   ```yaml
   packages:
     - '1-gateway-service'
     - '2-notification-service'
     - '3-auth-service'
     - '4-users-service'
     - '5-gig-service'
     - 'fixme-shared'
   ```

2. Run `pnpm install` — faster and stricter dependency management.

### After Setup

- Reference shared library in services: `"@nucknine/fixme-shared": "workspace:*"`
- Run scripts across all services: `npm run dev --workspaces` or `pnpm -r dev`
- Update Dockerfiles to copy from root `node_modules/` or use multi-stage builds.

The gateway is the API entry point that routes requests to all other services. If you start it before the backend services are ready, it'll fail health checks or throw connection errors when trying to reach them.

With restart: always in docker-compose, the order matters less since containers will keep restarting until dependencies are available.

## Scaling Microservices

### PM2 Cluster Mode vs Container Replicas

**PM2 `-i 5`** runs 5 instances of your app in one container using Node's cluster module:
- One master process binds to the port, distributes requests to workers via round-robin
- Good for bare-metal/VM deployments without orchestration
- All instances share the same port — the master handles routing

**Docker/Kubernetes replicas** run separate containers:
- Each container is isolated with its own process
- Orchestrator handles load balancing, restarts, and scaling
- Better for containerized environments — don't use PM2 clustering inside containers

**Rule of thumb:** Total instances shouldn't exceed 2× your CPU cores. More processes = more context switching overhead.

### Stateless Services & Shared State

Multiple instances can't share in-memory state. If Worker 1 caches data in a variable, Worker 3 won't see it.

**Solution:** Keep services stateless. Store shared state externally:
- **Database** (PostgreSQL, MongoDB) — persistent data, handles concurrent access
- **Redis** — sessions, cache, pub/sub messaging

All instances connect to the same external stores, so any instance can handle any request.

### Socket.IO with Redis Adapter

WebSocket connections are persistent — a user connects to one specific instance. Problem: Instance 1 can't send messages to users connected to Instance 3.

**Redis adapter** (`@socket.io/redis-adapter`) solves this:
```
Instance 1 emits → Redis Pub/Sub → All instances receive → Instance 3 delivers to its connected user
```

Setup:
```typescript
import { createAdapter } from '@socket.io/redis-adapter';
io.adapter(createAdapter(pubClient, subClient));
```

After this, `io.emit()` and `io.to(room).emit()` work across all instances automatically.

### HTTP vs WebSocket Scaling

| Aspect | HTTP Requests | WebSocket (Socket.IO) |
|--------|---------------|----------------------|
| Connection | Stateless, any instance handles it | Persistent, tied to one instance |
| Load balancing | Simple round-robin works | Needs sticky sessions or Redis adapter |
| Scaling | Just add instances | Requires Redis adapter for cross-instance messaging |
