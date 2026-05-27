# AceleraDev Globe — Plano de Implementacao Completo

> Documento para uso no Claude Code. Reflete o estado ATUAL da implementacao (atualizado em 2026-05-27).

---

## Visao Geral

Aplicacao fullstack com:
- **Backend:** Quarkus 3.9 + PostgreSQL + Flyway + DiceBear Open Peeps (avatares) + Nominatim (geocoding)
- **Frontend:** React 18 + Vite + TypeScript + Mapbox GL JS (globo 3D escuro) + Tailwind CSS + TanStack React Query + Framer Motion
- **Admin:** Rota `/admin` protegida por senha no mesmo projeto React
- **Dominio alvo:** `aceleradev.com.br/resultados`
- **Frase principal:** "AceleraDev conquistando o mundo"

### Mudancas em relacao ao plano original
- **Globo:** trocado de Three.js para **Mapbox GL JS** com projecao `globe` e estilo `dark-v11`
- **Nomes anonimos:** removida a integracao com Claude API (Anthropic) para gerar nomes — agora o nome anonimo (`anonymousName`) e enviado diretamente no JSON do POST
- **Markers:** os pontos no mapa sao avatares DiceBear circulares (60px) com borda cinza escura e glow verde, nao mais pontos luminosos 3D
- **Card:** exibido como Mapbox Popup (anchor `top-left`, offset `-51, -51`) sobrepondo o marker, nao como card lateral flutuante
- **Areas:** expandidas de 7 para 10 — adicionadas QA, IA_AUTOMACOES, SUPORTE
- **Seniority:** campo novo adicionado — TRAINEE, ESTAGIO, JUNIOR, PLENO, SENIOR, ASSISTENTE
- **Geocoding:** aceita `neighborhood` (bairro) opcional para maior precisao; offset reduzido para ~100-400m; removido sufixo `, Brasil`
- **AvatarService:** atualizado para DiceBear v9 com valores validos de heads, faces, accessories e facialHair

---

## FASE 1 — Backend Quarkus (IMPLEMENTADO)

### 1.1 Estrutura de pastas (estado atual)

```
backend/
├── src/main/java/br/com/aceleradev/globe/
│   ├── domain/
│   │   ├── Aluno.java
│   │   ├── AlunoArea.java
│   │   ├── AlunoGender.java
│   │   └── AlunoSeniority.java
│   ├── resource/
│   │   ├── AlunoResource.java        ← publico (globo + card + stats)
│   │   └── AdminAlunoResource.java   ← CRUD privado
│   ├── service/
│   │   ├── AlunoService.java         ← orquestrador (avatar + geocoding + persist)
│   │   ├── NicknameService.java      ← Claude API (existe mas NAO e usado no fluxo de criacao)
│   │   ├── AvatarService.java        ← DiceBear Open Peeps v9
│   │   └── GeocodingService.java     ← Nominatim + offset ~100-400m
│   ├── dto/
│   │   ├── AlunoGlobeDTO.java
│   │   ├── AlunoCardDTO.java
│   │   ├── AlunoAdminDTO.java
│   │   └── CreateAlunoRequest.java
│   └── filter/
│       └── AdminAuthFilter.java
├── src/main/resources/
│   ├── application.properties
│   └── db/migration/
│       ├── V1__create_aluno.sql
│       ├── V2__add_areas_qa_ia_suporte.sql
│       └── V3__add_seniority.sql
├── .env                              ← segredos locais (no .gitignore)
└── pom.xml
```

### 1.2 Migrations Flyway

**`V1__create_aluno.sql`:**
```sql
CREATE TYPE aluno_area AS ENUM (
    'FRONTEND','BACKEND','FULLSTACK','MOBILE','CYBER','DATA','DEVOPS'
);
CREATE TYPE aluno_gender AS ENUM ('MALE','FEMALE','OTHER');

CREATE TABLE aluno (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anonymous_name   VARCHAR(80)   NOT NULL,
    avatar_url       TEXT          NOT NULL,
    area             aluno_area    NOT NULL,
    gender           aluno_gender  NOT NULL,
    first_job_in_it  BOOLEAN       NOT NULL DEFAULT false,
    salary           VARCHAR(50),
    city             VARCHAR(100)  NOT NULL,
    state            CHAR(2)       NOT NULL,
    lat              DECIMAL(9,6)  NOT NULL,
    lng              DECIMAL(9,6)  NOT NULL,
    key_insight      TEXT,
    created_at       TIMESTAMP     NOT NULL DEFAULT now()
);

CREATE INDEX idx_aluno_created_at ON aluno(created_at DESC);
CREATE INDEX idx_aluno_area       ON aluno(area);
CREATE INDEX idx_aluno_state      ON aluno(state);
```

**`V2__add_areas_qa_ia_suporte.sql`:**
```sql
ALTER TYPE aluno_area ADD VALUE 'QA';
ALTER TYPE aluno_area ADD VALUE 'IA_AUTOMACOES';
ALTER TYPE aluno_area ADD VALUE 'SUPORTE';
```

**`V3__add_seniority.sql`:**
```sql
CREATE TYPE aluno_seniority AS ENUM ('TRAINEE','ESTAGIO','JUNIOR','PLENO','SENIOR','ASSISTENTE');
ALTER TABLE aluno ADD COLUMN seniority aluno_seniority;
```

### 1.3 Entidade — `Aluno.java`

```java
@Entity
@Table(name = "aluno")
public class Aluno extends PanacheEntityBase {

    @Id
    @GeneratedValue
    public UUID id;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "area", columnDefinition = "aluno_area")
    public AlunoArea area;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "gender", columnDefinition = "aluno_gender")
    public AlunoGender gender;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "seniority", columnDefinition = "aluno_seniority")
    public AlunoSeniority seniority;

    @Column(name = "city", nullable = false)
    public String city;

    @Column(name = "state", nullable = false, columnDefinition = "bpchar(2)")
    public String state;

    @Column(name = "salary")
    public String salary;

    @Column(name = "first_job_in_it", nullable = false)
    public Boolean firstJobInIt = false;

    @Column(name = "key_insight", columnDefinition = "TEXT")
    public String keyInsight;

    @Column(name = "anonymous_name", nullable = false, length = 80)
    public String anonymousName;

    @Column(name = "avatar_url", nullable = false, columnDefinition = "TEXT")
    public String avatarUrl;

    @Column(name = "lat", nullable = false, columnDefinition = "numeric")
    public Double lat;

    @Column(name = "lng", nullable = false, columnDefinition = "numeric")
    public Double lng;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt = LocalDateTime.now();
}
```

> **Notas de implementacao:**
> - `state` usa `columnDefinition = "bpchar(2)"` para compatibilidade com `CHAR(2)` do Postgres
> - `lat`/`lng` usam `columnDefinition = "numeric"` para compatibilidade com `DECIMAL(9,6)`
> - Enums usam `@JdbcTypeCode(SqlTypes.NAMED_ENUM)` para mapear direto para PostgreSQL ENUMs

### 1.4 Enums

```java
public enum AlunoArea {
    FRONTEND, BACKEND, FULLSTACK, MOBILE, CYBER, DATA, DEVOPS, QA, IA_AUTOMACOES, SUPORTE
}

public enum AlunoGender {
    MALE, FEMALE, OTHER
}

public enum AlunoSeniority {
    TRAINEE, ESTAGIO, JUNIOR, PLENO, SENIOR, ASSISTENTE
}
```

### 1.5 DTOs

**`CreateAlunoRequest.java`** — body do POST admin:
```java
public class CreateAlunoRequest {
    @NotNull  public AlunoArea      area;
    @NotNull  public AlunoGender    gender;
              public AlunoSeniority seniority;     // opcional
    @NotBlank public String city;
    @NotBlank @Size(min = 2, max = 2) public String state;
    @NotBlank public String salary;
    @NotNull  public Boolean firstJobInIt;
    @NotBlank public String keyInsight;
    @NotBlank public String anonymousName;         // enviado pelo admin, nao gerado por IA
              public String neighborhood;           // opcional, melhora precisao do geocoding
}
```

**`AlunoGlobeDTO.java`** — resposta publica (lista do globo):
```java
public record AlunoGlobeDTO(
    UUID   id,
    String anonymousName,
    String area,
    Double lat,
    Double lng,
    String avatarUrl
) {}
```

**`AlunoCardDTO.java`** — resposta do clique no marker:
```java
public record AlunoCardDTO(
    UUID    id,
    String  anonymousName,
    String  avatarUrl,
    String  area,
    String  seniority,
    String  city,
    String  state,
    String  salary,
    Boolean firstJobInIt,
    String  keyInsight
) {}
```

**`AlunoAdminDTO.java`** — resposta admin (dados completos):
```java
public record AlunoAdminDTO(
    UUID            id,
    String          anonymousName,
    String          avatarUrl,
    AlunoArea       area,
    AlunoGender     gender,
    AlunoSeniority  seniority,
    String          city,
    String          state,
    String          salary,
    Boolean         firstJobInIt,
    String          keyInsight,
    Double          lat,
    Double          lng,
    LocalDateTime   createdAt
) {}
```

### 1.6 `AvatarService.java` — DiceBear Open Peeps v9

```java
@ApplicationScoped
public class AvatarService {

    private static final List<String> HEADS = List.of(
            "afro", "buns", "cornrows", "cornrows2", "dreads1", "dreads2",
            "mohawk", "mohawk2", "long", "longBangs", "longCurly", "longAfro",
            "short1", "short2", "short3", "short4", "short5",
            "medium1", "medium2", "medium3", "mediumBangs", "mediumStraight",
            "flatTop", "pomp", "bun", "bun2", "twists", "twists2"
    );
    private static final List<String> FACES = List.of(
            "smile", "smileBig", "cute", "smileLOL", "cheeky",
            "calm", "lovingGrin1", "lovingGrin2", "driven", "awe"
    );
    private static final List<String> ACCESSORIES = List.of(
            "glasses", "glasses2", "glasses3", "glasses4", "glasses5",
            "sunglasses", "sunglasses2"
    );

    // cor de fundo por area (combina com as cores dos pontos no globo)
    private static final Map<AlunoArea, String> BG_COLORS = Map.ofEntries(
            Map.entry(AlunoArea.FRONTEND,       "b6d0fb"),
            Map.entry(AlunoArea.BACKEND,        "9fe1cb"),
            Map.entry(AlunoArea.FULLSTACK,      "f5c4b3"),
            Map.entry(AlunoArea.MOBILE,         "fac775"),
            Map.entry(AlunoArea.CYBER,          "cecbf6"),
            Map.entry(AlunoArea.DATA,           "d3d1c7"),
            Map.entry(AlunoArea.DEVOPS,         "c0dd97"),
            Map.entry(AlunoArea.QA,             "f9a8d4"),
            Map.entry(AlunoArea.IA_AUTOMACOES,  "a7f3d0"),
            Map.entry(AlunoArea.SUPORTE,        "fda4af")
    );

    public String generate(String anonymousName, AlunoGender gender, AlunoArea area) {
        Random rnd = new Random(anonymousName.hashCode());

        String head      = pick(HEADS, rnd);
        String face      = pick(FACES, rnd);
        String accessory = pick(ACCESSORIES, rnd);
        String bg        = BG_COLORS.get(area);

        String facialHair = "";
        if (gender == AlunoGender.MALE && rnd.nextInt(10) < 4) {
            facialHair = "&facialHair=full,goatee1,moustache1";
        }

        return "https://api.dicebear.com/9.x/open-peeps/svg"
            + "?seed="            + encode(anonymousName)
            + "&head="            + head
            + "&face="            + face
            + "&accessories="     + accessory
            + "&backgroundColor=" + bg
            + "&radius=50"
            + "&size=128"
            + facialHair;
    }
}
```

> **Notas:** Usa `Map.ofEntries()` por ter mais de 10 entradas. Seed deterministico pelo `anonymousName` garante mesmo avatar sempre. Valores de heads/faces/accessories validados contra a documentacao DiceBear v9.

### 1.7 `GeocodingService.java` — Nominatim + offset de privacidade

```java
@ApplicationScoped
public class GeocodingService {

    @ConfigProperty(name = "geocoding.user-agent")
    String userAgent;

    @Inject ObjectMapper mapper;

    public record Coords(double lat, double lng) {}

    public Coords geocode(String city, String state, String neighborhood) {
        // se tem bairro, busca "bairro, cidade, UF"; senao "cidade, UF"
        String query = (neighborhood != null && !neighborhood.isBlank())
                ? neighborhood + ", " + city + ", " + state
                : city + ", " + state;

        // ... chamada HTTP sincrona via java.net.http.HttpClient ...

        // offset aleatorio ~100-400m para privacidade
        double offsetLat = (rnd.nextDouble() * 0.003 + 0.001) * (rnd.nextBoolean() ? 1 : -1);
        double offsetLng = (rnd.nextDouble() * 0.003 + 0.001) * (rnd.nextBoolean() ? 1 : -1);

        return new Coords(lat + offsetLat, lng + offsetLng);
    }
}
```

> **Notas:**
> - Chamadas HTTP sao **sincronas** (java.net.http.HttpClient), nao reativas (nao usa Vert.x WebClient/Uni)
> - Sem sufixo `, Brasil` na query (evita falsos positivos no Nominatim, ex: cafe "Brasil" em Cascais)
> - Offset reduzido de ~1-4km para ~100-400m para melhor precisao

### 1.8 `AlunoService.java` — orquestrador

```java
@ApplicationScoped
public class AlunoService {

    @Inject AvatarService    avatarService;
    @Inject GeocodingService geocodingService;

    public Aluno create(CreateAlunoRequest req) {
        // 1. nome vem direto do request (nao gera via IA)
        String name = req.anonymousName;

        // 2. chamadas externas FORA da transacao (evita timeout)
        String avatarUrl = avatarService.generate(name, req.gender, req.area);
        GeocodingService.Coords coords = geocodingService.geocode(req.city, req.state, req.neighborhood);

        // 3. persiste dentro de @Transactional
        return persist(req, name, avatarUrl, coords);
    }

    @Transactional
    Aluno persist(CreateAlunoRequest req, String name, String avatarUrl, GeocodingService.Coords coords) {
        Aluno aluno          = new Aluno();
        aluno.area           = req.area;
        aluno.gender         = req.gender;
        aluno.seniority      = req.seniority;
        aluno.city           = req.city;
        aluno.state          = req.state.toUpperCase();
        aluno.salary         = req.salary;
        aluno.firstJobInIt   = req.firstJobInIt;
        aluno.keyInsight     = req.keyInsight;
        aluno.anonymousName  = name;
        aluno.avatarUrl      = avatarUrl;
        aluno.lat            = coords.lat();
        aluno.lng            = coords.lng();
        aluno.persist();
        return aluno;
    }
}
```

> **IMPORTANTE:** Chamadas externas (DiceBear, Nominatim) ficam FORA do `@Transactional`. A transacao so abre no `persist()`. Isso evita timeout de transacao por latencia de APIs externas.

### 1.9 `NicknameService.java` — Claude API (nao usado no fluxo principal)

O servico existe e funciona, mas **nao e injetado no `AlunoService`**. E usado apenas pelo `AdminAlunoResource.regenerate()` para regenerar nome+avatar de um aluno existente.

### 1.10 `AlunoResource.java` — endpoints publicos

```java
@Path("/api/alunos")
@Produces(MediaType.APPLICATION_JSON)
public class AlunoResource {

    @GET
    @CacheResult(cacheName = "alunos-globe")
    public List<AlunoGlobeDTO> listAll() { ... }

    @GET @Path("/{id}")
    public AlunoCardDTO findById(@PathParam("id") UUID id) {
        // inclui seniority: a.seniority != null ? a.seniority.name() : null
    }

    @GET @Path("/stats")
    public Map<String, Object> stats() {
        // retorna { "total": N, "states": N }
        // states usa: SELECT COUNT(DISTINCT a.state) FROM Aluno a
    }
}
```

### 1.11 `AdminAlunoResource.java` — CRUD privado

```java
@Path("/api/admin/alunos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AdminAlunoResource {

    @Inject AlunoService    alunoService;
    @Inject AvatarService   avatarService;
    @Inject NicknameService nicknameService;

    @GET
    public List<AlunoAdminDTO> listAll() { ... }

    @POST
    @CacheInvalidateAll(cacheName = "alunos-globe")
    public Response create(@Valid CreateAlunoRequest req) { ... }

    @PUT @Path("/{id}")
    @Transactional
    @CacheInvalidateAll(cacheName = "alunos-globe")
    public Response update(@PathParam("id") UUID id, @Valid CreateAlunoRequest req) {
        // atualiza: area, gender, seniority, city, state, salary, firstJobInIt, keyInsight
    }

    @DELETE @Path("/{id}")
    @Transactional
    @CacheInvalidateAll(cacheName = "alunos-globe")
    public Response delete(@PathParam("id") UUID id) { ... }

    @PATCH @Path("/{id}/regenerate")
    @Transactional
    @CacheInvalidateAll(cacheName = "alunos-globe")
    public Response regenerate(@PathParam("id") UUID id) {
        // usa nicknameService.generate() + avatarService.generate()
    }
}
```

### 1.12 `application.properties`

```properties
# servidor
quarkus.http.port=8080
quarkus.http.host=0.0.0.0

# banco
quarkus.datasource.db-kind=postgresql
quarkus.datasource.username=${DB_USER:postgres}
quarkus.datasource.password=${DB_PASS:postgres}
quarkus.datasource.jdbc.url=jdbc:postgresql://${DB_HOST:localhost}:5432/${DB_NAME:aceleradev}
quarkus.hibernate-orm.database.generation=none
quarkus.hibernate-orm.log.sql=false

# flyway
quarkus.flyway.migrate-at-start=true
quarkus.flyway.locations=classpath:db/migration

# cors (dev local; em prod front e API ficam na mesma origem via Caddy)
quarkus.http.cors=true
quarkus.http.cors.origins=http://localhost:5173,https://aceleradev.com.br
quarkus.http.cors.methods=GET,POST,PUT,PATCH,DELETE,OPTIONS
quarkus.http.cors.headers=accept,authorization,content-type,x-admin-token

# cache
quarkus.cache.caffeine."alunos-globe".expire-after-write=5M

# segredos via env vars
anthropic.api.key=${ANTHROPIC_API_KEY:}
admin.token=${ADMIN_TOKEN:dev-token-local}

# nominatim
geocoding.user-agent=aceleradev-globe/1.0 (contato: guilhermepclol056@gmail.com)
```

### 1.13 `docker-compose.yml` para dev local

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: aceleradev
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

---

## FASE 2 — Frontend React + Mapbox GL JS (IMPLEMENTADO)

### 2.1 Stack real

```bash
# libs instaladas
react + react-dom
react-router-dom
@tanstack/react-query
axios
mapbox-gl                   # globo 3D (substituiu three.js/@react-three)
framer-motion
tailwindcss + @tailwindcss/vite
```

> Three.js / @react-three/fiber / @react-three/drei existem no projeto mas **nao sao usados na pagina principal** — o componente ativo e o `MapboxGlobe.tsx`.

### 2.2 Estrutura de pastas (estado atual)

```
frontend/
├── src/
│   ├── components/
│   │   ├── Globe/
│   │   │   ├── MapboxGlobe.tsx     ← componente principal do mapa (Mapbox GL JS)
│   │   │   ├── GlobeScene.tsx      ← canvas Three.js (NAO USADO)
│   │   │   ├── EarthMesh.tsx       ← esfera Three.js (NAO USADO)
│   │   │   ├── AlunoMarker.tsx     ← ponto Three.js (NAO USADO)
│   │   │   └── AtmosphereGlow.tsx  ← halo Three.js (NAO USADO)
│   │   ├── UI/
│   │   │   ├── AlunoCard.tsx       ← card lateral Framer Motion (NAO USADO — substituido por Mapbox Popup)
│   │   │   ├── StatsCounter.tsx    ← contador no topo
│   │   │   ├── FilterBar.tsx       ← filtro por area no rodape
│   │   │   └── LoadingScreen.tsx   ← tela de loading
│   │   └── Admin/
│   │       ├── AdminLogin.tsx
│   │       ├── AdminTable.tsx
│   │       └── AdminForm.tsx
│   ├── hooks/
│   │   ├── useAlunos.ts
│   │   ├── useAlunoCard.ts
│   │   └── useStats.ts
│   ├── lib/
│   │   ├── api.ts                  ← axios instance
│   │   ├── colors.ts               ← AREA_COLORS, AREA_LABELS, SENIORITY_LABELS
│   │   └── geoUtils.ts             ← lat/lng -> posicao 3D (NAO USADO com Mapbox)
│   ├── pages/
│   │   ├── GlobePage.tsx            ← pagina principal
│   │   └── AdminPage.tsx            ← pagina admin
│   ├── styles/
│   │   └── globals.css              ← estilos globais + popup Mapbox
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── .env                             ← VITE_MAPBOX_TOKEN
└── vite.config.ts
```

### 2.3 Paleta de cores, labels e seniority

```typescript
// src/lib/colors.ts
import type { AlunoArea, AlunoSeniority } from '../types';

export const AREA_COLORS: Record<AlunoArea, string> = {
  FRONTEND:      '#60A5FA',
  BACKEND:       '#34D399',
  FULLSTACK:     '#FB923C',
  MOBILE:        '#FBBF24',
  CYBER:         '#A78BFA',
  DATA:          '#94A3B8',
  DEVOPS:        '#4ADE80',
  QA:            '#F472B6',
  IA_AUTOMACOES: '#6EE7B7',
  SUPORTE:       '#FB7185',
};

export const AREA_LABELS: Record<AlunoArea, string> = {
  FRONTEND:      'Front-end',
  BACKEND:       'Back-end',
  FULLSTACK:     'Fullstack',
  MOBILE:        'Mobile',
  CYBER:         'Cyber',
  DATA:          'Data',
  DEVOPS:        'DevOps',
  QA:            'QA',
  IA_AUTOMACOES: 'I.A/Automacoes',
  SUPORTE:       'Suporte',
};

export const SENIORITY_LABELS: Record<AlunoSeniority, string> = {
  TRAINEE:    'Trainee',
  ESTAGIO:    'Estagio',
  JUNIOR:     'Junior',
  PLENO:      'Pleno',
  SENIOR:     'Senior',
  ASSISTENTE: 'Assistente',
};
```

### 2.4 Types

```typescript
// src/types/index.ts
export type AlunoArea =
  | 'FRONTEND' | 'BACKEND' | 'FULLSTACK' | 'MOBILE' | 'CYBER'
  | 'DATA' | 'DEVOPS' | 'QA' | 'IA_AUTOMACOES' | 'SUPORTE';

export type AlunoGender = 'MALE' | 'FEMALE' | 'OTHER';

export type AlunoSeniority =
  | 'TRAINEE' | 'ESTAGIO' | 'JUNIOR' | 'PLENO' | 'SENIOR' | 'ASSISTENTE';

export interface AlunoGlobe {
  id: string;
  anonymousName: string;
  area: AlunoArea;
  lat: number;
  lng: number;
  avatarUrl: string;
}

export interface AlunoCard {
  id: string;
  anonymousName: string;
  avatarUrl: string;
  area: AlunoArea;
  seniority: AlunoSeniority | null;
  city: string;
  state: string;
  salary: string;
  firstJobInIt: boolean;
  keyInsight: string;
}

export interface AlunoAdmin extends AlunoCard {
  gender: AlunoGender;
  lat: number;
  lng: number;
  createdAt: string;
}

export interface Stats {
  total: number;
  states: number;
}

export interface CreateAlunoRequest {
  area: AlunoArea;
  gender: AlunoGender;
  city: string;
  state: string;
  salary: string;
  firstJobInIt: boolean;
  keyInsight: string;
}
```

### 2.5 Hooks (React Query)

```typescript
// useAlunos.ts — GET /api/alunos (staleTime 5min)
// useAlunoCard.ts — GET /api/alunos/{id} (enabled quando selectedId != null)
// useStats.ts — GET /api/alunos/stats (staleTime 1min)
```

### 2.6 `MapboxGlobe.tsx` — componente principal do mapa

Configuracao do mapa:
- Estilo: `mapbox://styles/mapbox/dark-v11`
- Projecao: `globe`
- Centro inicial: `[-9.14, 38.74]` (Portugal)
- Zoom inicial: `3`
- Fog: espacial (fundo quase preto, estrelas, horizon blend)

Markers:
- Wrapper: `60px x 60px`, cursor pointer
- Inner div: `border-radius: 50%`, `border: 2px solid #2a2a2e`, `box-shadow: 0 0 8px #34d39988`
- Imagem: avatar DiceBear SVG, `object-fit: cover`
- Hover: `inner.style.transform = 'scale(1.15)'` + glow mais forte (`0 0 12px #34d399, 0 0 24px #34d39988`)
- **IMPORTANTE:** scale NUNCA no wrapper (quebra posicionamento Mapbox), sempre no inner div

Popup (card):
- `anchor: 'top-left'`, `offset: [-51, -51]` — sobrepoe o avatar do marker
- Avatar no popup: `69px` (mesmo tamanho do marker em hover `60px * 1.15`)
- `closeButton: true`, `closeOnClick: true`
- Classe CSS: `aluno-popup`
- Ao abrir popup: marker fica `visibility: hidden`
- Ao fechar popup: marker volta `visibility: visible`
- `replacingPopupRef` flag evita loop de close/reopen ao trocar de popup
- `popupAlunoIdRef` rastreia qual marker restaurar ao fechar

Conteudo do popup:
- Avatar circular com borda e glow verde
- Nome anonimo em branco
- Localizacao (cidade, UF)
- Tags: area (cor da area), seniority (cinza claro, opcional), "1a vaga em TI" (amarelo, condicional)
- Salario em caixa escura
- Key insight em caixa com borda lateral na cor da area

### 2.7 Estilos do popup — `globals.css`

```css
.aluno-popup .mapboxgl-popup-content {
  background: rgba(8, 10, 20, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  color: #fff;
}

.aluno-popup .mapboxgl-popup-tip {
  display: none;
}
```

### 2.8 `GlobePage.tsx` — pagina principal

```tsx
export default function GlobePage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeArea, setActiveArea] = useState<string | null>(null);

  const { data: alunos, isLoading } = useAlunos();
  const { data: card, isFetching: loadingCard } = useAlunoCard(selectedId);
  const { data: stats } = useStats();

  if (isLoading) return <LoadingScreen />;

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <MapboxGlobe
        alunos={alunos || []}
        activeArea={activeArea}
        onMarkerClick={setSelectedId}
        selectedId={selectedId}
        card={card || null}
        loadingCard={loadingCard}
        onClose={() => setSelectedId(null)}
      />
      <StatsCounter stats={stats} />
      <FilterBar activeArea={activeArea} onChange={setActiveArea} />
    </div>
  );
}
```

> **Nota:** Nao usa mais o componente `AlunoCard.tsx` (Framer Motion lateral). O card e renderizado como Mapbox Popup direto no `MapboxGlobe.tsx`.

### 2.9 `api.ts`

```typescript
const baseURL = import.meta.env.VITE_API_URL || '';

export const api = axios.create({ baseURL });

export const adminApi = axios.create({ baseURL });
adminApi.interceptors.request.use(config => {
  const token = sessionStorage.getItem('admin-token');
  if (token) config.headers['X-Admin-Token'] = token;
  return config;
});
```

### 2.10 `App.tsx`

```tsx
const basename = import.meta.env.VITE_BASE || '/';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={basename}>
        <Routes>
          <Route path="/"      element={<GlobePage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

### 2.11 `.env` (frontend)

```env
VITE_MAPBOX_TOKEN=<seu-token-mapbox>
VITE_API_URL=http://localhost:8080
```

---

## FASE 3 — Admin Panel (`/admin`)

Componentes existentes: `AdminLogin.tsx`, `AdminTable.tsx`, `AdminForm.tsx`. Implementacao segue o plano original.

---

## FASE 4 — Roteamento e App principal (IMPLEMENTADO)

Coberto na secao 2.10 acima. `basename` configuravel via `VITE_BASE` env var.

---

## FASE 5 — Deploy no VPS Debian + Docker

> Sem mudancas significativas em relacao ao plano original. A stack de deploy continua:
> PostgreSQL + Quarkus (back) + nginx servindo o build do Vite (front) + Caddy como reverse proxy com auto-SSL.
>
> Roteamento:
> - `https://aceleradev.com.br/resultados/` → frontend
> - `https://aceleradev.com.br/resultados/api/*` → backend (Quarkus)

Consultar plano original para detalhes de Dockerfile, nginx.conf, Caddyfile, docker-compose.yml de producao, DNS, firewall e backup.

---

## Decisoes tecnicas e licoes aprendidas

### Problemas resolvidos durante a implementacao

1. **Hibernate schema validation** — `lat`/`lng` como `numeric` vs `float(53)` e `state` como `bpchar` vs `varchar` precisaram de `columnDefinition` explicito na entidade

2. **Transaction timeout** — chamadas externas (DiceBear, Nominatim) dentro de `@Transactional` causavam timeout. Solucao: separar em metodo nao-transacional (`create()`) + metodo transacional (`persist()`)

3. **Marker voando pro canto ao hover** — `transform: scale()` no wrapper do Mapbox conflitava com o posicionamento. Solucao: scale apenas no inner div

4. **Avatar nao carregando** — `crossOrigin = 'anonymous'` bloqueava SVG do DiceBear. Solucao: remover atributo

5. **DiceBear 400 errors** — parametros invalidos para v9 (`none` em accessories, `shortCurly` em heads, `smileTeeth` em faces, `beard` em facialHair). Solucao: atualizar para valores validos da documentacao v9

6. **Geocoding resolvendo para Cascais** — sufixo `, Brasil` fazia Nominatim encontrar cafe "Brasil" em Cascais. Solucao: remover sufixo

7. **Markers no mar** — offset grande (~1-4km). Solucao: reduzir para ~100-400m e aceitar `neighborhood` opcional

8. **Loop de close/reopen do popup** — remover popup para atualizar disparava `onClose` que limpava `selectedId`. Solucao: flag `replacingPopupRef` + `setHTML` para atualizar popup existente

9. **Avatar duplicado** — popup mostrava avatar + marker visivel embaixo. Solucao: esconder marker quando popup abre, restaurar ao fechar

---

## Checklist de execucao

### Backend
- [x] Docker Compose rodando PostgreSQL local
- [x] Projeto Quarkus criado e rodando na porta 8080
- [x] Migrations Flyway executando ao subir (V1 + V2 + V3)
- [x] `AvatarService` gerando URLs DiceBear v9 corretamente (10 areas)
- [x] `NicknameService` chamando Claude API (existe, usado so no regenerate)
- [x] `GeocodingService` convertendo cidade+estado+bairro em lat/lng com offset ~100-400m
- [x] `AlunoService` orquestrando criacao fora de transacao
- [x] CRUD admin funcionando com seniority
- [x] Cache `alunos-globe` com invalidacao automatica

### Frontend
- [x] Projeto React criado com Vite + TypeScript
- [x] Mapbox GL JS configurado com estilo dark-v11, projecao globe
- [x] Markers: avatares DiceBear 60px com hover scale + glow
- [x] Popup sobrepondo marker (anchor top-left, offset -51,-51)
- [x] Card com: nome, localizacao, area, seniority, "1a vaga em TI", salario, key insight
- [x] `StatsCounter` no topo com animacao de contagem
- [x] `FilterBar` filtrando markers por area
- [x] 10 areas com cores e labels
- [x] 6 senioridades com labels em portugues
- [x] Centro inicial em Portugal, zoom 3

### Deploy (PENDENTE)
- [ ] `vite.config.ts` com `base: '/resultados/'`
- [ ] `.env.production` com `VITE_API_URL=/resultados` e `VITE_BASE=/resultados`
- [ ] Dockerfile do backend (multi-stage) buildando OK
- [ ] Dockerfile + `nginx.conf` do frontend OK
- [ ] DNS de `aceleradev.com.br` apontando pro VPS
- [ ] `.env` no VPS com segredos (modo 600)
- [ ] `docker compose up -d --build` no VPS sem erro
- [ ] Caddy emitindo cert Let's Encrypt automaticamente
- [ ] `curl https://aceleradev.com.br/resultados/api/alunos/stats` retorna JSON
- [ ] Globo acessivel em `https://aceleradev.com.br/resultados`
- [ ] Cron de backup do Postgres ativo
