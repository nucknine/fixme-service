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
