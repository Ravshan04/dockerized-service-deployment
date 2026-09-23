# Dockerized Service Deployment

Project page: [Dockerized Service](https://roadmap.sh/projects/dockerized-service-deployment)

Solution repository: https://github.com/Ravshan04/dockerized-service-deployment

Live service: http://54.194.155.56

A Node.js service packaged as a Docker image and deployed to a remote Linux
server by GitHub Actions. Images are stored in GitHub Container Registry and
runtime secrets are supplied only through environment variables.

## Routes

- `GET /` returns `Hello, world!`
- `GET /secret` uses HTTP Basic Auth and returns `SECRET_MESSAGE`
- `GET /health` reports container health

Invalid or missing credentials return `401 Unauthorized` and a
`WWW-Authenticate` header, so browsers display their username/password prompt.

## Run locally

```sh
cp .env.example .env
docker compose up --build
curl http://localhost/
curl -u captain:change-me http://localhost/secret
docker compose down
```

The `.dockerignore` file excludes `.env` and `.env.*` files from the Docker
build context. Secrets are never copied into the image.

## CI/CD

Every push to `main`:

1. Runs the Node.js tests.
2. Builds the Docker image.
3. Pushes immutable commit and `latest` tags to GHCR.
4. Connects to the remote server over SSH.
5. Pulls and replaces the running container.
6. Verifies the public health endpoint.

Configure the `production` environment with these GitHub Actions secrets:

| Secret | Purpose |
| --- | --- |
| `SERVER_HOST` | Remote server IP or hostname |
| `SSH_USER` | Remote SSH user |
| `SSH_PRIVATE_KEY` | Private deployment key |
| `SECRET_MESSAGE` | Message returned from `/secret` |
| `APP_USERNAME` | Basic Auth username |
| `APP_PASSWORD` | Basic Auth password |

The Linux server must have Docker and Nginx installed and port 80 open. The
deployment binds the container to `127.0.0.1:3001`; Nginx proxies public port
80 to that private listener.
