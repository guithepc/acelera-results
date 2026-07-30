# aceleradev-globe-api

Backend Quarkus do projeto AceleraDev Globe.

## Dev local

```bash
# 1. sobe o postgres
docker compose up -d


export ADMIN_TOKEN="dev-token-local"

# 3. roda em dev mode (hot reload)
mvn quarkus:dev
```

API em `http://localhost:8080`. Swagger UI em `http://localhost:8080/q/swagger-ui`.

## Endpoints públicos

- `GET  /api/alunos`         — lista para o globo
- `GET  /api/alunos/{id}`    — card detalhado
- `GET  /api/alunos/stats`   — contadores

## Endpoints admin (requer header `X-Admin-Token`)

- `GET    /api/admin/alunos`
- `POST   /api/admin/alunos`               — body: CreateAlunoRequest
- `PUT    /api/admin/alunos/{id}`
- `DELETE /api/admin/alunos/{id}`
- `PATCH  /api/admin/alunos/{id}/regenerate`

## Build de prod

```bash
mvn package
java -jar target/quarkus-app/quarkus-run.jar
```
