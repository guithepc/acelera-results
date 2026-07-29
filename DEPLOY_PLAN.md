# Plano: Deploy do acelera-results + Traefik global na VPS

## Contexto

A aplicação acelera-results (globo 3D com alunos do AceleraDev) precisa ir pra produção na VPS (Debian 13). O site principal `aceleradev.com.br` roda na Hostinger e **não pode cair**. Usaremos o subdomínio `resultados.aceleradev.com.br` apontando pra VPS.

O roadmap-board já está rodando em produção na VPS com Traefik embutido. A abordagem correta é **extrair o Traefik para infra global** (repo privado separado) e fazer ambos os projetos se conectarem nele via labels.

Maior preocupação: **custo com Mapbox** — rate limit no Traefik + token restrito ao domínio + spending cap.

---

## Arquitetura final na VPS

```
/opt/traefik-proxy/          ← repo privado — infra global
├── docker-compose.yml       ← só traefik
├── traefik/
│   ├── traefik.yml
│   └── dynamic.yml          ← rate limit, headers, WAF
├── coraza/
│   ├── coraza.conf
│   └── crs-setup.conf
├── get-crs.sh
└── .env

/opt/roadmap-board/          ← repo público — só app + db
├── deploy/
│   ├── docker-compose.prod.yml  ← sem traefik, com labels
│   └── .env
└── ...

/opt/acelera-results/        ← repo público — só app + db
├── deploy/
│   ├── docker-compose.prod.yml  ← sem traefik, com labels
│   └── .env
└── ...
```

Rede Docker compartilhada: `traefik_proxy` (external)

---

## Parte 1: Criar repo traefik-proxy (privado)

Criar em `/Users/pctheone/repositories/traefik-proxy/` com os arquivos copiados/adaptados do roadmap-board.

### 1.1 — `docker-compose.yml`
```yaml
services:
  traefik:
    image: traefik:v3
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik/traefik.yml:/etc/traefik/traefik.yml:ro
      - ./traefik/dynamic.yml:/etc/traefik/dynamic.yml:ro
      - ./coraza:/coraza:ro
      - letsencrypt:/letsencrypt
    networks:
      - proxy

networks:
  proxy:
    name: traefik_proxy

volumes:
  letsencrypt:
```

### 1.2 — `traefik/traefik.yml`
Adaptado do roadmap-board, sem Cloudflare trustedIPs por enquanto.

### 1.3 — `traefik/dynamic.yml` (RATE LIMIT + SECURITY HEADERS + WAF)
```yaml
http:
  middlewares:
    # WAF — protege contra SQLi, XSS, LFI, etc.
    waf:
      plugin:
        coraza:
          directives:
            - Include /coraza/coraza.conf
            - Include /coraza/crs-setup.conf
            - SecAction "id:900200,phase:1,nolog,pass,t:none,setvar:'tx.allowed_methods=GET HEAD POST PUT PATCH DELETE OPTIONS'"
            - Include /coraza/rules/*.conf
            - SecRequestBodyAccess Off
            - SecRuleEngine On

    # RATE LIMIT — 20 req/s por IP, pico de 40
    # Impede spam de reloads (cada reload = tiles do Mapbox = custo)
    ratelimit:
      rateLimit:
        average: 20
        burst: 40

    # SECURITY HEADERS
    secheaders:
      headers:
        contentTypeNosniff: true
        frameDeny: true
        referrerPolicy: no-referrer-when-downgrade
```

### 1.4 — `coraza/`, `get-crs.sh`
Copiados do roadmap-board sem mudanças.

---

## Parte 2: Ajustar código do acelera-results

### 2.1 — `frontend/vite.config.ts`
`base: '/'` (remover `/resultados/`)

### 2.2 — `backend/src/main/resources/application.properties`
CORS: adicionar `https://resultados.aceleradev.com.br`

### 2.3 — `frontend/Dockerfile`
Adicionar `ARG VITE_MAPBOX_TOKEN` + `ENV`

### 2.4 — `.env.example`
Atualizar template:
```
DB_USER=aceleradev
DB_PASS=troca-isso-por-senha-forte
DB_NAME=aceleradev
ANTHROPIC_API_KEY=sk-ant-...
ADMIN_TOKEN=troca-isso-por-token-aleatorio-longo
VITE_MAPBOX_TOKEN=pk.xxx
```

### 2.5 — Remover `Caddyfile`

### 2.6 — Criar `deploy/docker-compose.prod.yml`
```yaml
services:
  backend:
    build: ../backend
    restart: unless-stopped
    environment:
      DB_USER: ${DB_USER}
      DB_PASS: ${DB_PASS}
      DB_HOST: postgres
      DB_NAME: ${DB_NAME}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      ADMIN_TOKEN: ${ADMIN_TOKEN}
    labels:
      traefik.enable: "true"
      traefik.http.routers.acelera-api.rule: "Host(`resultados.aceleradev.com.br`) && PathPrefix(`/api`)"
      traefik.http.routers.acelera-api.entrypoints: websecure
      traefik.http.routers.acelera-api.tls.certresolver: letsencrypt
      traefik.http.routers.acelera-api.middlewares: waf@file,ratelimit@file,secheaders@file
      traefik.http.services.acelera-api.loadbalancer.server.port: "8080"
    depends_on:
      postgres: { condition: service_healthy }
    networks: [traefik_proxy, internal]

  frontend:
    build:
      context: ../frontend
      args:
        VITE_MAPBOX_TOKEN: ${VITE_MAPBOX_TOKEN}
    restart: unless-stopped
    labels:
      traefik.enable: "true"
      traefik.http.routers.acelera-front.rule: "Host(`resultados.aceleradev.com.br`)"
      traefik.http.routers.acelera-front.entrypoints: websecure
      traefik.http.routers.acelera-front.tls.certresolver: letsencrypt
      traefik.http.routers.acelera-front.middlewares: ratelimit@file,secheaders@file
      traefik.http.services.acelera-front.loadbalancer.server.port: "80"
    networks: [traefik_proxy]

  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASS}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks: [internal]

networks:
  traefik_proxy:
    external: true
  internal:
    name: acelera_internal
    internal: true

volumes:
  pgdata:
```

### 2.7 — Criar `deploy/.env.example`

### 2.8 — `docker-compose.yml` (raiz)
Simplificar pra dev local (só postgres).

---

## Parte 3: Ajustar roadmap-board

### 3.1 — `deploy/docker-compose.prod.yml`
- Remover o service `traefik` e seus volumes
- Trocar rede `roadmap_web` por `traefik_proxy` (external)
- Labels continuam iguais (domínio `ideias.pctheone.com`)

---

## Parte 4: Proteger token Mapbox

### 4.1 — Dois tokens no painel do Mapbox
| Token | URL restriction | Uso |
|-------|----------------|-----|
| Dev | Nenhuma | `.env` local |
| Prod | `resultados.aceleradev.com.br` | `.env` da VPS |

O token de dev fica só na sua máquina, nunca vai pro GitHub (`.env` está no `.gitignore`). Se alguém roubar precisaria ter acesso à sua máquina — e nesse caso o token é o menor dos problemas.

### 4.2 — Spending cap no Mapbox
Definir teto de gasto mensal no painel do Mapbox. Se bater o limite, para de servir tiles em vez de cobrar.

### 4.3 — Camadas de proteção combinadas
- **Rate limit Traefik** (20 req/s por IP) → impede spam de reloads (cada reload = tiles do Mapbox = custo)
- **URL restriction no token** → impede alguém de copiar o token do JS e usar fora do domínio
- **Spending cap** → teto de gasto máximo, mesmo que tudo falhe
- **WAF Coraza + OWASP CRS** → bloqueia ataques conhecidos (SQLi, XSS, LFI)
- **Security headers** → previne clickjacking, MIME sniffing

---

## Parte 5: Segurança da VPS

### 5.1 — UFW
```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### 5.2 — Fail2ban + SSH hardening
```bash
apt install fail2ban && systemctl enable fail2ban
```
- Desabilitar login por senha (usar chave SSH)
- Desabilitar root login direto

---

## Parte 6: DNS na Hostinger

No painel da Hostinger, na zona DNS do domínio `aceleradev.com.br`:
1. Adicionar um **registro A** para `resultados` apontando para o **IP da VPS**
2. Aguardar propagação DNS (5-30 min, pode levar até 24h)

**Não afeta o site principal.**

---

## Passo a passo de deploy na VPS

### Passo 1 — Subir Traefik global (SEM DERRUBAR O ROADMAP-BOARD)
```bash
# 1. Clonar repo do traefik
cd /opt
git clone git@github.com:guithepc/traefik-proxy.git
cd traefik-proxy

# 2. Baixar regras OWASP CRS
bash get-crs.sh

# 3. Criar rede compartilhada
docker network create traefik_proxy

# 4. Subir traefik global
docker compose up -d
```

### Passo 2 — Migrar roadmap-board pro Traefik global
```bash
# 1. Conectar o app existente na rede traefik_proxy
docker network connect traefik_proxy deploy-app-1

# 2. Atualizar o docker-compose.prod.yml do roadmap-board
#    (remover traefik, usar rede traefik_proxy external)

# 3. Parar o traefik antigo do roadmap-board
docker stop deploy-traefik-1 && docker rm deploy-traefik-1

# 4. Recriar o stack do roadmap-board (sem traefik)
cd /opt/roadmap-board/deploy
docker compose -f docker-compose.prod.yml up -d

# 5. Verificar que ideias.pctheone.com continua funcionando
curl -I https://ideias.pctheone.com
```

### Passo 3 — Subir acelera-results
```bash
# 1. Clonar
cd /opt
git clone https://github.com/guithepc/acelera-results.git
cd acelera-results

# 2. Configurar env
cp deploy/.env.example deploy/.env
# editar com valores reais

# 3. Subir banco e restaurar dump
docker compose -f deploy/docker-compose.prod.yml up -d postgres
# esperar healthy, depois restaurar dump

# 4. Subir tudo
docker compose -f deploy/docker-compose.prod.yml up -d --build

# 5. Verificar
curl -I https://resultados.aceleradev.com.br
```

---

## Arquivos a criar/modificar

### Novo repo: `traefik-proxy` (privado)
| Arquivo | Ação |
|---------|------|
| `docker-compose.yml` | **Criar** |
| `traefik/traefik.yml` | **Criar** (adaptado do roadmap-board) |
| `traefik/dynamic.yml` | **Criar** (rate limit + headers + WAF) |
| `coraza/coraza.conf` | **Copiar** do roadmap-board |
| `coraza/crs-setup.conf` | **Copiar** do roadmap-board |
| `get-crs.sh` | **Copiar** do roadmap-board |
| `.gitignore` | **Criar** |

### Repo: `acelera-results` (público)
| Arquivo | Ação |
|---------|------|
| `Caddyfile` | **Remover** |
| `docker-compose.yml` (raiz) | Simplificar pra dev local |
| `frontend/vite.config.ts` | `base: '/'` |
| `frontend/Dockerfile` | ARG/ENV VITE_MAPBOX_TOKEN |
| `backend/.../application.properties` | CORS: subdomínio |
| `.env.example` | Atualizar |
| `deploy/docker-compose.prod.yml` | **Criar** |
| `deploy/.env.example` | **Criar** |

### Repo: `roadmap-board` (público)
| Arquivo | Ação |
|---------|------|
| `deploy/docker-compose.prod.yml` | Remover traefik, usar rede external |

---

## Verificação

1. `https://ideias.pctheone.com` continua funcionando (roadmap-board)
2. `https://resultados.aceleradev.com.br` funciona:
   - SSL (cadeado verde)
   - Globo 3D carrega
   - API responde em `/api/students`
   - Admin funciona em `/admin`
   - Headers de segurança presentes (`curl -I`)
3. Rate limit: rajada de requests retorna HTTP 429
4. `aceleradev.com.br` (Hostinger) inalterado
5. Spending cap ativo no Mapbox
