# Fixme-service

Fixme service for the public usage

## Run docker compose services

These services are required to be executed first with so as to prevent errors when you start your microservices.

- `redis`
  - `docker compose up -d redis`
- `mongodb`
  - `docker compose up -d mongodb`
- `mysql`
  - `docker compose up -d mysql`
- `postgres`
  - `docker compose up -d postgres`
- `rabbitmq`
  - `docker compose up -d rabbitmq`
- `elasticsearch`
  - `docker compose up -d elasticsearch`
  - It could take somewhere between 5 and 10 minutes for elasticsearch to be running.

## Setting up Kibana

- Using a kibana docker image greater than 8.10.x, the setup is a bit different.
  this setup is needed every time when installing fresh es or removing es volume
- **IMPORTANT**: Running `docker compose stop elasticsearch && docker compose rm -f elasticsearch` will reset the service token and require regenerating it.
- **IMPORTANT**: Removing elasticsearch volumes (e.g., `sudo rm -rf ./docker-volumes/elasticsearch`) will also reset the service token and require regenerating it.
- Once elasticsearch is running, open the elasticsearch container terminal and change the password of kibana_system
  - `curl -s -X POST -u elastic:admin1234 -H "Content-Type: application/json" http://localhost:9200/_security/user/kibana_system/_password -d "{\"password\":\"kibana\"}"`
  - OR `docker exec elasticsearch_container curl -s -X POST -u elastic:admin1234 -H "Content-Type: application/json" http://localhost:9200/_security/user/kibana_system/_password -d "{\"password\":\"kibana\"}"
{}`
  - If the update was successful, you should see a `{}` displayed in the terminal.
- Also from the elasticsearch container terminal, create a kibana service token
  - `bin/elasticsearch-service-tokens create elastic/kibana fixme-kibana`
  - OR `docker exec elasticsearch_container bin/elasticsearch-service-tokens create elastic/kibana fixme-kibana`
    \*\* Elasticsearch responded with: `SERVICE_TOKEN elastic/kibana/fixme-kibana = AAEAAWVsYXN0aWMva2liYW5hL2ZpeG1lLWtpYmFuYTp0bjBzTk5oV1JGZXJhNVFfaEFubllB`
  - If the service account token was generated, it will be displayed.
  - Once generated, copy and add it to the kibana environment variable `ELASTICSEARCH_SERVICEACCOUNT_TOKEN` inside your docker compose file

- `kibana`
  - `docker compose up -d kibana`
  - open `http://localhost:5601/` name: `elastic` pwd: `admin1234`

## Heartbeat file

- Replace `<your-ip-address>` with your own ip address inside the `heartbeat.yml`.

## Running microservices

- You can run the microservices using either docker compose or by opening a terminal for wach service and execute `npm run dev`.
- Personally, I prefer to run the microservices individually in the terminal because it allows me to easily monitor errors displayed.
- Whichever approach you intend to use to start the microservices, make sure the `gateway service` is always the last service you start. All other services should be running before starting the `gateway service`.

## Setting up Jenkins master and agent

- To see how to complete the setup, you can get the complete course on Udemy

## elasticdump npm package

elasticdump --input=/home/valmet/projects/fixme-service/gigs.json --output=http://elastic:admin1234@localhost:9200/gigs --type=data

## To update the notification container after changing package.json, you need to rebuild the Docker image. Here are the steps:

Why rebuild is needed:
The COPY package.json ./ step in Dockerfile.dev creates a layer with the old package.json
Docker caches layers, so it won't detect changes unless you rebuild
The RUN npm install step needs to run again with the new dependencies

Note: Docker Compose looks for .env in the docker-compose.yaml directory , not in the service directory

```
notifications:
  build:
    context: ./microservices/2-notification-service
    dockerfile: Dockerfile.dev
    args:
      NPM_TOKEN: ${NPM_TOKEN}  # ← !!Looks for NPM_TOKEN from docker-compose directory!!
  env_file: ./microservices/2-notification-service/.env  # ← !!Only for runtime!!
```

### Option 1: Rebuild and restart the specific service

```
cd /home/valmet/projects/fixme-service
docker compose up -d --build notifications
```

### Option 2: Stop, rebuild, and start

```
cd /home/valmet/projects/fixme-service
docker compose stop notifications
docker compose build notifications
docker compose up -d notifications
```

### Option 3: Force rebuild without cache (if dependencies aren't updating)

```
cd /home/valmet/projects/fixme-service
docker compose build --no-cache notifications
docker compose up -d notifications
```
