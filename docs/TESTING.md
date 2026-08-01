# Testing Guide

Setup de testes automáticos (backend + frontend) e testes de performance (k6) para a plataforma AceleraDev Globe.

## Resumo

| Camada | Framework | Suites | Resultado |
|--------|-----------|--------|-----------|
| Backend | Quarkus Test (JUnit 5) + REST Assured + Mockito | 3 arquivos | 17/17 passando |
| Frontend | Vitest + Testing Library (React) | 3 arquivos | 11/11 passando |
| Performance | k6 (smoke + load) | 1 script | thresholds ok, 0% falhas |

## 1. Testes do Backend

### Dependências (já no `pom.xml`)

- `quarkus-junit5` — infraestrutura de teste do Quarkus
- `quarkus-junit5-mockito` — `@InjectMock` para mockar o GeocodingService (sem chamadas externas)
- `io.rest-assured:rest-assured` — testes HTTP de integração
- `org.junit.jupiter:junit-jupiter` — assertions

### Configuração

O perfil de teste usa um PostgreSQL dedicado (não o dev). Config em `backend/src/test/resources/application.properties`:

- `quarkus.datasource.jdbc.url=jdbc:postgresql://127.0.0.1:15432/aceleradev_test`
- `quarkus.datasource.username=test`, `quarkus.datasource.password=test`
- `admin.token=test-token` (token determinístico para os testes de admin)
- `quarkus.http.test-port=8081`

### Pré-requisito: PostgreSQL de teste

O Docker Desktop 29 é incompatível com Testcontainers (erro `BadRequestException` da docker-java), então usamos um container estático:

```bash
docker run -d --name acelera-test-pg -p 15432:5432 \
  -e POSTGRES_USER=test -e POSTGRES_PASSWORD=test -e POSTGRES_DB=aceleradev_test \
  postgres:16-alpine
```

### Rodando

```powershell
cd backend
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.20.8-hotspot"
$env:PATH = "$env:JAVA_HOME\bin;C:\Users\flazo0\tools\apache-maven-3.9.11\bin;$env:PATH"
$env:MAVEN_OPTS = "-Djava.net.preferIPv6Addresses=true"
mvn test
```

> **Nota de rede:** a rede da máquina bloqueia IPv4 do Maven Central (HTTP 403) e do Docker Hub (rate limit 429). O Maven precisa de `-Djava.net.preferIPv6Addresses=true` para resolver via IPv6, e `~/.m2/settings.xml` usa o mirror Aliyun. Se a rede normalizar, os dois podem ser revertidos.

### Suites

- **`StudentResourceTest`** (4 testes): listagem pública, stats com cache, UUID inválido → 400, UUID inexistente → 404
- **`AdminStudentResourceTest`** (10 testes): autenticação (401 sem token / token inválido), criação de aluno, validação de payload → 400, update preservando stacks e regenerando avatar ao trocar área, delete, regenerate de avatar
- **`AvatarServiceTest`** (3 testes): determinismo do avatar (mesmo aluno → mesma URL) e cores por área

## 2. Testes do Frontend

### Dependências (já no `package.json`)

- `vitest`, `jsdom` — runner e ambiente DOM
- `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event` — Testing Library

### Configuração

- `vite.config.ts` → `test: { environment: 'jsdom', setupFiles: './src/test/setup.ts' }`
- `frontend/src/test/setup.ts` → imports do `@testing-library/jest-dom`
- Scripts: `npm test` (uma vez) e `npm run test:watch`

### Suites

- **`src/lib/popup.test.ts`** (7 testes): XSS neutralizado no popup do globo — `keyInsight`, `name`, `stacks` e `avatarUrl` maliciosos são escapados por `escapeHTML`/`buildPopupHTML`
- **`src/components/Admin/AdminForm.test.tsx`** (2 testes): create envia `stacks`/`courseTime`; edit preserva os dados existentes
- **`src/hooks/hooks.test.tsx`** (2 testes): hooks `useStudents`, `useStudentCard`, `useStats` chamam as URLs corretas

### Rodando

```bash
cd frontend
npm install
npm test
```

## 3. Testes de Performance (k6)

### Script

`perf/load-test.js` cobre os endpoints públicos e admin:

- **Smoke**: 5 VUs, 15s — valida o fluxo básico
- **Load**: rampa 10 → 100 VUs, 60s de platô, ramp-down — capacidade sob carga
- Endpoints: `GET /api/students`, `/api/students/{id}`, `/api/students/stats`, `GET /api/admin/students` (com token)

### Thresholds

| Métrica | Limite |
|---------|--------|
| `http_req_failed` | < 1% |
| p(95) `students` / `stats` | < 300ms |
| p(95) `card` / `admin` | < 400ms |

### Rodando

```bash
# 1. Container de teste do Postgres (se necessário)
docker start acelera-test-pg

# 2. Backend apontando para o DB de teste
cd backend
$env:QUARKUS_DATASOURCE_JDBC_URL = "jdbc:postgresql://127.0.0.1:15432/aceleradev_test"
$env:QUARKUS_DATASOURCE_USERNAME = "test"
$env:QUARKUS_DATASOURCE_PASSWORD = "test"
$env:ADMIN_TOKEN = "perf-token"
mvn package -DskipTests
java -jar target\quarkus-app\quarkus-run.jar

# 3. k6
k6 run -e BASE_URL=http://localhost:8080 -e ADMIN_TOKEN=perf-token perf\load-test.js
```

### Último resultado (referência)

100 VUs simultâneos, ~268 req/s, 33.664 requisições, 0% de falhas:

| Endpoint | p(95) |
|----------|-------|
| students | 2.3ms |
| stats | 2.1ms |
| card | 9.0ms |
| admin | 9.0ms |

## Ferramentas instaladas localmente

| Ferramenta | Caminho |
|------------|---------|
| JDK 17 (Eclipse Adoptium) | `C:\Program Files\Eclipse Adoptium\jdk-17.0.20.8-hotspot` |
| Maven 3.9.11 | `C:\Users\flazo0\tools\apache-maven-3.9.11` |
| k6 2.1.0 | `C:\Users\flazo0\tools\k6\k6-v2.1.0-windows-amd64\k6.exe` |
