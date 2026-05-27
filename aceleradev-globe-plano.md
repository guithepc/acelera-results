# AceleraDev Globe — Plano de Implementação Completo

> Documento para uso no Claude Code. Siga as fases em ordem. Não pule etapas.

---

## Visão Geral

Aplicação fullstack com:
- **Backend:** Quarkus 3.x + PostgreSQL + Flyway + Claude API (nomes) + DiceBear Open Peeps (avatares) + Nominatim (geocoding)
- **Frontend:** React 18 + Vite + TypeScript + Three.js (globo 3D) + Tailwind CSS + Framer Motion
- **Admin:** Rota `/admin` protegida por senha no mesmo projeto React
- **Domínio alvo:** `aceleradev.com.br/resultados`
- **Frase principal:** "AceleraDev conquistando o mundo"

---

## FASE 1 — Backend Quarkus

### 1.1 Criar projeto do zero

```bash
mvn io.quarkus.platform:quarkus-maven-plugin:3.9.0:create \
  -DprojectGroupId=br.com.aceleradev \
  -DprojectArtifactId=aceleradev-globe-api \
  -DprojectVersion=1.0.0 \
  -Dextensions="resteasy-reactive-jackson,hibernate-orm-panache,jdbc-postgresql,flyway,smallrye-openapi,vertx"
```

### 1.2 Estrutura de pastas

```
aceleradev-globe-api/
├── src/main/java/br/com/aceleradev/globe/
│   ├── domain/
│   │   ├── Aluno.java
│   │   ├── AlunoArea.java
│   │   ├── AlunoGender.java
│   │   └── AlunoRepository.java
│   ├── resource/
│   │   ├── AlunoResource.java        ← público (globo)
│   │   └── AdminAlunoResource.java   ← CRUD privado
│   ├── service/
│   │   ├── AlunoService.java
│   │   ├── NicknameService.java      ← Claude API
│   │   ├── AvatarService.java        ← DiceBear Open Peeps
│   │   └── GeocodingService.java     ← Nominatim + offset
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
│       └── V1__create_aluno.sql
└── pom.xml
```

### 1.3 Migration Flyway — `V1__create_aluno.sql`

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
```

### 1.4 Entidade — `Aluno.java`

```java
@Entity
@Table(name = "aluno")
public class Aluno extends PanacheEntityBase {

    @Id
    @GeneratedValue
    public UUID id;

    // dados informados no POST
    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "aluno_area")
    public AlunoArea area;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "aluno_gender")
    public AlunoGender gender;

    public String city;
    public String state;
    public String salary;          // texto livre: "R$ 5.000", "€ 2.800"
    public Boolean firstJobInIt;
    public String keyInsight;

    // gerado automaticamente
    public String anonymousName;
    public String avatarUrl;
    public Double lat;
    public Double lng;

    public LocalDateTime createdAt = LocalDateTime.now();
}
```

### 1.5 Enums

```java
public enum AlunoArea {
    FRONTEND, BACKEND, FULLSTACK, MOBILE, CYBER, DATA, DEVOPS
}

public enum AlunoGender {
    MALE, FEMALE, OTHER
}
```

### 1.6 DTOs

**`CreateAlunoRequest.java`** — body do POST admin:
```java
public class CreateAlunoRequest {
    @NotNull  public AlunoArea   area;
    @NotNull  public AlunoGender gender;
    @NotBlank public String city;
    @NotBlank public String state;       // "SP", "RJ", "MG"...
    @NotBlank public String salary;      // texto livre
    @NotNull  public Boolean firstJobInIt;
    @NotBlank public String keyInsight;
}
```

**`AlunoGlobeDTO.java`** — resposta pública (lista do globo):
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

**`AlunoCardDTO.java`** — resposta do clique no ponto:
```java
public record AlunoCardDTO(
    UUID    id,
    String  anonymousName,
    String  avatarUrl,
    String  area,
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

### 1.7 `AvatarService.java` — DiceBear Open Peeps

> URL base: `https://api.dicebear.com/9.x/open-peeps/svg`
> Seed determinístico: usa o `anonymousName` como seed — mesmo nome, mesmo avatar, sempre.

```java
@ApplicationScoped
public class AvatarService {

    private static final List<String> HEADS = List.of(
        "afro","buns","cornrows","cornrows2","dreads","dreads2",
        "mohawk","mohawk2","shortCurly","shortFlat","shortRound",
        "longBangs","long","straight01","straight02"
    );
    private static final List<String> FACES = List.of(
        "smile","cute","smileLOL","smileTeeth"
    );
    private static final List<String> ACCESSORIES = List.of(
        "glasses","glasses2","glasses3","sunglasses","none","none"
    );

    // cor de fundo por área (combina com as cores dos pontos no globo)
    private static final Map<AlunoArea, String> BG_COLORS = Map.of(
        AlunoArea.FRONTEND,  "b6d0fb",
        AlunoArea.BACKEND,   "9fe1cb",
        AlunoArea.FULLSTACK, "f5c4b3",
        AlunoArea.MOBILE,    "fac775",
        AlunoArea.CYBER,     "cecbf6",
        AlunoArea.DATA,      "d3d1c7",
        AlunoArea.DEVOPS,    "c0dd97"
    );

    public String generate(String anonymousName, AlunoGender gender, AlunoArea area) {
        var rnd = new Random(anonymousName.hashCode());

        String head      = pick(HEADS, rnd);
        String face      = pick(FACES, rnd);
        String accessory = pick(ACCESSORIES, rnd);
        String bg        = BG_COLORS.get(area);

        String facialHair = "";
        if (gender == AlunoGender.MALE && rnd.nextInt(10) < 4) {
            facialHair = "&facialHair=beard,beardMustache";
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

    private <T> T pick(List<T> list, Random rnd) {
        return list.get(rnd.nextInt(list.size()));
    }

    private String encode(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8);
    }
}
```

### 1.8 `NicknameService.java` — Claude API

> Sem SDK Java oficial. Chama a API REST diretamente via Vert.x WebClient (já incluso no Quarkus com a extensão `vertx`).

```java
@ApplicationScoped
public class NicknameService {

    @ConfigProperty(name = "anthropic.api.key")
    String apiKey;

    @Inject
    Vertx vertx;

    public Uni<String> generate(AlunoGender gender) {

        String genderPt = switch (gender) {
            case MALE   -> "masculino";
            case FEMALE -> "feminino";
            default     -> "neutro";
        };

        String prompt = """
            Gere um apelido anônimo engraçado para um dev brasileiro
            que acabou de conseguir sua primeira vaga em TI.
            Formato obrigatório: [Animal] [Adjetivo], ambos no gênero %s.
            Use animais brasileiros ou comuns.
            Exemplos masculinos: Golfinho Voador, Tamanduá Hacker,
              Jabuti Fullstack, Capivara Deployada.
            Exemplos femininos: Borboleta Brilhante, Arara Deployada,
              Capivara Curiosa, Jaguatirica Ágil.
            Retorne APENAS o apelido, nada mais, sem ponto final.
            """.formatted(genderPt);

        JsonObject body = new JsonObject()
            .put("model", "claude-haiku-4-5-20251001")
            .put("max_tokens", 30)
            .put("messages", new JsonArray()
                .add(new JsonObject()
                    .put("role", "user")
                    .put("content", prompt)));

        return WebClient.create(vertx)
            .postAbs("https://api.anthropic.com/v1/messages")
            .putHeader("x-api-key", apiKey)
            .putHeader("anthropic-version", "2023-06-01")
            .putHeader("content-type", "application/json")
            .sendJson(body)
            .map(resp -> resp.bodyAsJsonObject()
                .getJsonArray("content")
                .getJsonObject(0)
                .getString("text")
                .trim());
    }
}
```

### 1.9 `GeocodingService.java` — Nominatim + offset de bairro

```java
@ApplicationScoped
public class GeocodingService {

    @ConfigProperty(name = "geocoding.user-agent")
    String userAgent;

    @Inject
    Vertx vertx;

    public record Coords(double lat, double lng) {}

    public Uni<Coords> geocode(String city, String state) {
        String query = city + ", " + state + ", Brasil";
        String url = "https://nominatim.openstreetmap.org/search"
            + "?q=" + URLEncoder.encode(query, StandardCharsets.UTF_8)
            + "&format=json&limit=1";

        return WebClient.create(vertx)
            .getAbs(url)
            .putHeader("User-Agent", userAgent)
            .send()
            .map(resp -> {
                JsonArray arr = resp.bodyAsJsonArray();
                if (arr.isEmpty()) {
                    throw new RuntimeException("Cidade não encontrada: " + query);
                }
                JsonObject loc = arr.getJsonObject(0);
                double lat = Double.parseDouble(loc.getString("lat"));
                double lng = Double.parseDouble(loc.getString("lon"));

                // offset aleatório de bairro: ~0.01° a 0.04° (~1km a 4km)
                Random rnd = new Random();
                double offsetLat = (rnd.nextDouble() * 0.03 + 0.01) * (rnd.nextBoolean() ? 1 : -1);
                double offsetLng = (rnd.nextDouble() * 0.03 + 0.01) * (rnd.nextBoolean() ? 1 : -1);

                return new Coords(lat + offsetLat, lng + offsetLng);
            });
    }
}
```

### 1.10 `AlunoService.java` — orquestrador

```java
@ApplicationScoped
public class AlunoService {

    @Inject NicknameService  nicknameService;
    @Inject AvatarService    avatarService;
    @Inject GeocodingService geocodingService;

    @WithTransaction
    public Uni<Aluno> create(CreateAlunoRequest req) {
        return nicknameService.generate(req.gender)
            .flatMap(name -> {
                String avatarUrl = avatarService.generate(name, req.gender, req.area);
                return geocodingService.geocode(req.city, req.state)
                    .map(coords -> {
                        var aluno           = new Aluno();
                        aluno.area          = req.area;
                        aluno.gender        = req.gender;
                        aluno.city          = req.city;
                        aluno.state         = req.state;
                        aluno.salary        = req.salary;
                        aluno.firstJobInIt  = req.firstJobInIt;
                        aluno.keyInsight    = req.keyInsight;
                        aluno.anonymousName = name;
                        aluno.avatarUrl     = avatarUrl;
                        aluno.lat           = coords.lat();
                        aluno.lng           = coords.lng();
                        aluno.persist();
                        return aluno;
                    });
            });
    }
}
```

### 1.11 `AlunoResource.java` — endpoints públicos

```java
@Path("/api/alunos")
@Produces(MediaType.APPLICATION_JSON)
public class AlunoResource {

    // GET /api/alunos — lista todos (para o globo)
    @GET
    @CacheResult(cacheName = "alunos-globe")  // cache 5min
    public List<AlunoGlobeDTO> listAll() {
        return Aluno.<Aluno>listAll()
            .stream()
            .map(a -> new AlunoGlobeDTO(
                a.id, a.anonymousName, a.area.name(),
                a.lat, a.lng, a.avatarUrl))
            .toList();
    }

    // GET /api/alunos/{id} — card completo (clique no ponto)
    @GET
    @Path("/{id}")
    public AlunoCardDTO findById(@PathParam("id") UUID id) {
        Aluno a = Aluno.findById(id);
        if (a == null) throw new NotFoundException();
        return new AlunoCardDTO(
            a.id, a.anonymousName, a.avatarUrl,
            a.area.name(), a.city, a.state,
            a.salary, a.firstJobInIt, a.keyInsight);
    }

    // GET /api/alunos/stats — contador do header
    @GET
    @Path("/stats")
    public Map<String, Object> stats() {
        long total  = Aluno.count();
        long states = Aluno.find("SELECT DISTINCT a.state FROM Aluno a")
                           .stream().count();
        return Map.of("total", total, "states", states);
    }
}
```

### 1.12 `AdminAlunoResource.java` — CRUD privado

```java
@Path("/api/admin/alunos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AdminAlunoResource {

    @Inject AlunoService alunoService;
    @Inject AvatarService avatarService;
    @Inject NicknameService nicknameService;

    // GET — lista todos com dados completos
    @GET
    public List<AlunoAdminDTO> listAll() {
        return Aluno.<Aluno>listAll(Sort.by("createdAt").descending())
            .stream().map(this::toAdminDTO).toList();
    }

    // POST — cria novo aluno (dispara pipeline de IA + geocoding)
    @POST
    public Uni<Response> create(@Valid CreateAlunoRequest req) {
        return alunoService.create(req)
            .map(a -> Response.status(201).entity(toAdminDTO(a)).build());
    }

    // PUT — edita dados
    @PUT
    @Path("/{id}")
    @WithTransaction
    public Response update(@PathParam("id") UUID id, CreateAlunoRequest req) {
        Aluno a = Aluno.findById(id);
        if (a == null) throw new NotFoundException();
        a.area         = req.area;
        a.gender       = req.gender;
        a.city         = req.city;
        a.state        = req.state;
        a.salary       = req.salary;
        a.firstJobInIt = req.firstJobInIt;
        a.keyInsight   = req.keyInsight;
        return Response.ok(toAdminDTO(a)).build();
    }

    // DELETE
    @DELETE
    @Path("/{id}")
    @WithTransaction
    public Response delete(@PathParam("id") UUID id) {
        Aluno.deleteById(id);
        return Response.noContent().build();
    }

    // PATCH /{id}/regenerate — regera nome + avatar via IA
    @PATCH
    @Path("/{id}/regenerate")
    @WithTransaction
    public Uni<Response> regenerate(@PathParam("id") UUID id) {
        Aluno a = Aluno.findById(id);
        if (a == null) throw new NotFoundException();
        return nicknameService.generate(a.gender)
            .map(name -> {
                a.anonymousName = name;
                a.avatarUrl = avatarService.generate(name, a.gender, a.area);
                return Response.ok(toAdminDTO(a)).build();
            });
    }

    private AlunoAdminDTO toAdminDTO(Aluno a) {
        return new AlunoAdminDTO(a.id, a.anonymousName, a.avatarUrl,
            a.area, a.gender, a.city, a.state, a.salary,
            a.firstJobInIt, a.keyInsight, a.lat, a.lng, a.createdAt);
    }
}
```

### 1.13 `AdminAuthFilter.java` — proteção das rotas admin

```java
@Provider
@Priority(1)
public class AdminAuthFilter implements ContainerRequestFilter {

    @ConfigProperty(name = "admin.token")
    String adminToken;

    @Override
    public void filter(ContainerRequestContext ctx) {
        String path = ctx.getUriInfo().getPath();
        if (!path.startsWith("/api/admin")) return;

        String token = ctx.getHeaderString("X-Admin-Token");
        if (!adminToken.equals(token)) {
            ctx.abortWith(Response.status(401)
                .entity("{\"error\":\"Unauthorized\"}").build());
        }
    }
}
```

### 1.14 `application.properties`

```properties
# servidor
quarkus.http.port=8080

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

# cors
quarkus.http.cors=true
quarkus.http.cors.origins=http://localhost:5173,https://aceleradev.com.br
quarkus.http.cors.methods=GET,POST,PUT,PATCH,DELETE,OPTIONS

# cache
quarkus.cache.caffeine."alunos-globe".expire-after-write=5M

# segredos via env vars
anthropic.api.key=${ANTHROPIC_API_KEY}
admin.token=${ADMIN_TOKEN:dev-token-local}

# nominatim
geocoding.user-agent=aceleradev-globe/1.0
```

### 1.15 `docker-compose.yml` para dev local

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

## FASE 2 — Frontend React + Three.js (o globo)

### 2.1 Criar projeto do zero

```bash
npm create vite@latest aceleradev-globe -- --template react-ts
cd aceleradev-globe
npm install
npm install three @react-three/fiber @react-three/drei
npm install framer-motion
npm install @tanstack/react-query axios
npm install tailwindcss @tailwindcss/vite
npm install react-router-dom
```

### 2.2 Estrutura de pastas

```
aceleradev-globe/
├── public/
│   └── earth-texture.jpg         ← textura da Terra (2k, baixar do NASA Visible Earth)
├── src/
│   ├── components/
│   │   ├── Globe/
│   │   │   ├── GlobeScene.tsx     ← canvas Three.js principal
│   │   │   ├── EarthMesh.tsx      ← esfera com textura
│   │   │   ├── AlunoMarker.tsx    ← ponto luminoso pulsante
│   │   │   └── AtmosphereGlow.tsx ← halo azulado atmosférico
│   │   ├── UI/
│   │   │   ├── AlunoCard.tsx      ← card lateral ao clicar no ponto
│   │   │   ├── StatsCounter.tsx   ← contador pixel/game no canto superior
│   │   │   ├── FilterBar.tsx      ← filtro por área
│   │   │   └── LoadingScreen.tsx  ← tela de loading inicial
│   │   └── Admin/
│   │       ├── AdminLogin.tsx
│   │       ├── AdminTable.tsx
│   │       └── AdminForm.tsx
│   ├── hooks/
│   │   ├── useAlunos.ts           ← React Query: GET /api/alunos
│   │   ├── useAlunoCard.ts        ← React Query: GET /api/alunos/{id}
│   │   └── useStats.ts            ← React Query: GET /api/alunos/stats
│   ├── lib/
│   │   ├── api.ts                 ← axios instance
│   │   └── geoUtils.ts            ← lat/lng → posição 3D na esfera
│   ├── pages/
│   │   ├── GlobePage.tsx          ← página principal (/)
│   │   └── AdminPage.tsx          ← página admin (/admin)
│   ├── styles/
│   │   └── globals.css
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
```

### 2.3 Paleta de cores e tema

> Todo o visual é escuro — estilo espacial. Fundo quase preto com estrelas. Pontos e UI com cores vibrantes por área.

```typescript
// src/lib/colors.ts
export const AREA_COLORS: Record<string, string> = {
  FRONTEND:  '#60A5FA',  // azul brilhante
  BACKEND:   '#34D399',  // verde menta
  FULLSTACK: '#FB923C',  // laranja
  MOBILE:    '#FBBF24',  // âmbar
  CYBER:     '#A78BFA',  // roxo
  DATA:      '#94A3B8',  // cinza azulado
  DEVOPS:    '#4ADE80',  // verde limão
};

export const AREA_LABELS: Record<string, string> = {
  FRONTEND:  'Front-end',
  BACKEND:   'Back-end',
  FULLSTACK: 'Fullstack',
  MOBILE:    'Mobile',
  CYBER:     'Cyber',
  DATA:      'Data',
  DEVOPS:    'DevOps',
};
```

### 2.4 Utilitário — lat/lng para posição 3D

```typescript
// src/lib/geoUtils.ts
import * as THREE from 'three';

// converte coordenadas geográficas para posição XYZ na superfície da esfera
export function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi   = (90 - lat)  * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
     (radius * Math.cos(phi)),
     (radius * Math.sin(phi) * Math.sin(theta))
  );
}
```

### 2.5 Types

```typescript
// src/types/index.ts
export interface AlunoGlobe {
  id: string;
  anonymousName: string;
  area: string;
  lat: number;
  lng: number;
  avatarUrl: string;
}

export interface AlunoCard {
  id: string;
  anonymousName: string;
  avatarUrl: string;
  area: string;
  city: string;
  state: string;
  salary: string;
  firstJobInIt: boolean;
  keyInsight: string;
}

export interface Stats {
  total: number;
  states: number;
}
```

### 2.6 `GlobeScene.tsx` — canvas principal

> Este é o componente mais importante. Implementar com atenção total aos detalhes visuais.

```tsx
// src/components/Globe/GlobeScene.tsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { Suspense, useState } from 'react';
import EarthMesh from './EarthMesh';
import AlunoMarker from './AlunoMarker';
import AtmosphereGlow from './AtmosphereGlow';
import { AlunoGlobe } from '../../types';

interface Props {
  alunos: AlunoGlobe[];
  activeArea: string | null;
  onMarkerClick: (id: string) => void;
}

export default function GlobeScene({ alunos, activeArea, onMarkerClick }: Props) {
  return (
    <Canvas
      camera={{ position: [0, 0, 2.8], fov: 45 }}
      style={{ background: 'transparent' }}
      dpr={[1, 2]}
    >
      {/* iluminação */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 3, 5]} intensity={1.2} color="#ffffff" />
      <pointLight position={[-5, -3, -5]} intensity={0.3} color="#1a3a8f" />

      {/* estrelas ao fundo */}
      <Stars
        radius={100}
        depth={50}
        count={6000}
        factor={4}
        saturation={0.3}
        fade
        speed={0.3}
      />

      <Suspense fallback={null}>
        {/* Terra */}
        <EarthMesh />

        {/* halo atmosférico */}
        <AtmosphereGlow />

        {/* pontos dos alunos */}
        {alunos
          .filter(a => !activeArea || a.area === activeArea)
          .map(aluno => (
            <AlunoMarker
              key={aluno.id}
              aluno={aluno}
              onClick={() => onMarkerClick(aluno.id)}
            />
          ))}
      </Suspense>

      {/* controles de órbita — auto-rotação suave */}
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        minDistance={1.8}
        maxDistance={5}
        autoRotate
        autoRotateSpeed={0.4}
        rotateSpeed={0.5}
      />
    </Canvas>
  );
}
```

### 2.7 `EarthMesh.tsx` — esfera com textura

```tsx
// src/components/Globe/EarthMesh.tsx
import { useRef } from 'react';
import { useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';
import * as THREE from 'three';

export default function EarthMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useLoader(TextureLoader, '/earth-texture.jpg');

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshPhongMaterial
        map={texture}
        shininess={15}
        specular={new THREE.Color(0x1a3a8f)}
      />
    </mesh>
  );
}
```

### 2.8 `AlunoMarker.tsx` — ponto luminoso pulsante

> Ponto que pulsa com a cor da área do aluno. Ao passar o mouse, cresce. Ao clicar, dispara o card.

```tsx
// src/components/Globe/AlunoMarker.tsx
import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { latLngToVector3 } from '../../lib/geoUtils';
import { AREA_COLORS } from '../../lib/colors';
import { AlunoGlobe } from '../../types';

interface Props {
  aluno: AlunoGlobe;
  onClick: () => void;
}

export default function AlunoMarker({ aluno, onClick }: Props) {
  const meshRef  = useRef<THREE.Mesh>(null);
  const glowRef  = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const position = latLngToVector3(aluno.lat, aluno.lng, 1.01);
  const color    = new THREE.Color(AREA_COLORS[aluno.area] || '#ffffff');

  // animação de pulso
  useFrame(({ clock }) => {
    if (!meshRef.current || !glowRef.current) return;
    const t = clock.getElapsedTime();
    const pulse = Math.sin(t * 2 + aluno.lat) * 0.15 + 0.85;
    meshRef.current.scale.setScalar(hovered ? 2.2 : pulse);
    glowRef.current.scale.setScalar(hovered ? 3.5 : pulse * 2.2);
    (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
      hovered ? 0.5 : (Math.sin(t * 2 + aluno.lat) * 0.15 + 0.25);
  });

  return (
    <group position={position}>
      {/* halo externo */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>

      {/* ponto principal */}
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerEnter={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerLeave={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        <sphereGeometry args={[0.007, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}
```

### 2.9 `AtmosphereGlow.tsx` — halo atmosférico

```tsx
// src/components/Globe/AtmosphereGlow.tsx
import * as THREE from 'three';

export default function AtmosphereGlow() {
  return (
    <mesh>
      <sphereGeometry args={[1.06, 64, 64]} />
      <meshBasicMaterial
        color={new THREE.Color(0x1a6fff)}
        side={THREE.BackSide}
        transparent
        opacity={0.08}
      />
    </mesh>
  );
}
```

### 2.10 `AlunoCard.tsx` — card lateral animado

> Estilo escuro, flutuante, com animação de entrada pelo lado direito via Framer Motion.
> Pixel/game font no nome do aluno. Visual premium igual ao card do Datafast.

```tsx
// src/components/UI/AlunoCard.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { AlunoCard as AlunoCardType } from '../../types';
import { AREA_COLORS, AREA_LABELS } from '../../lib/colors';

interface Props {
  aluno: AlunoCardType | null;
  onClose: () => void;
  loading: boolean;
}

export default function AlunoCard({ aluno, onClose, loading }: Props) {
  const areaColor = aluno ? AREA_COLORS[aluno.area] : '#ffffff';

  return (
    <AnimatePresence>
      {(aluno || loading) && (
        <motion.div
          key="card"
          initial={{ opacity: 0, x: 60, scale: 0.95 }}
          animate={{ opacity: 1, x: 0,  scale: 1 }}
          exit={{   opacity: 0, x: 60,  scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="absolute right-6 top-1/2 -translate-y-1/2 z-10"
          style={{ width: '320px' }}
        >
          <div style={{
            background: 'rgba(8, 10, 20, 0.92)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${areaColor}33`,
            borderRadius: '16px',
            padding: '24px',
            boxShadow: `0 0 40px ${areaColor}22, 0 20px 60px rgba(0,0,0,0.6)`,
          }}>

            {loading ? (
              /* skeleton loader */
              <div className="space-y-3 animate-pulse">
                <div style={{ height: 80, width: 80, borderRadius: '50%', background: '#1a2030', margin: '0 auto 16px' }} />
                <div style={{ height: 20, background: '#1a2030', borderRadius: 6 }} />
                <div style={{ height: 14, background: '#1a2030', borderRadius: 6, width: '60%' }} />
                <div style={{ height: 60, background: '#1a2030', borderRadius: 6 }} />
              </div>
            ) : aluno && (
              <>
                {/* botão fechar */}
                <button
                  onClick={onClose}
                  style={{
                    position: 'absolute', top: 14, right: 14,
                    background: 'rgba(255,255,255,0.08)',
                    border: 'none', borderRadius: '50%',
                    width: 28, height: 28, cursor: 'pointer',
                    color: '#94a3b8', fontSize: 16, lineHeight: '28px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >×</button>

                {/* avatar */}
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <img
                    src={aluno.avatarUrl}
                    alt={aluno.anonymousName}
                    style={{
                      width: 80, height: 80, borderRadius: '50%',
                      display: 'inline-block',
                      border: `2px solid ${areaColor}66`,
                      boxShadow: `0 0 20px ${areaColor}44`,
                    }}
                  />
                </div>

                {/* nome — fonte pixel/game */}
                <h3 style={{
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: '11px',
                  color: '#ffffff',
                  textAlign: 'center',
                  marginBottom: 6,
                  lineHeight: 1.6,
                }}>
                  {aluno.anonymousName}
                </h3>

                {/* cidade + área */}
                <p style={{
                  textAlign: 'center', color: '#64748b',
                  fontSize: 12, marginBottom: 16
                }}>
                  {aluno.city}, {aluno.state}
                </p>

                {/* badges */}
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
                  <span style={{
                    background: `${areaColor}22`,
                    color: areaColor,
                    border: `1px solid ${areaColor}44`,
                    padding: '3px 10px', borderRadius: 20,
                    fontSize: 11, fontWeight: 600,
                  }}>
                    {AREA_LABELS[aluno.area]}
                  </span>
                  {aluno.firstJobInIt && (
                    <span style={{
                      background: 'rgba(251,191,36,0.15)',
                      color: '#fbbf24',
                      border: '1px solid rgba(251,191,36,0.3)',
                      padding: '3px 10px', borderRadius: 20,
                      fontSize: 11, fontWeight: 600,
                    }}>
                      1ª vaga em TI ⭐
                    </span>
                  )}
                </div>

                {/* salário */}
                <div style={{
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 8, padding: '8px 12px',
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: 16,
                }}>
                  <span style={{ color: '#64748b', fontSize: 12 }}>Salário</span>
                  <span style={{ color: '#ffffff', fontSize: 13, fontWeight: 600 }}>
                    {aluno.salary}
                  </span>
                </div>

                {/* insight */}
                <div style={{
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 8, padding: '12px',
                  borderLeft: `3px solid ${areaColor}`,
                }}>
                  <p style={{ color: '#94a3b8', fontSize: 11, lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>
                    "{aluno.keyInsight}"
                  </p>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

> **IMPORTANTE:** Adicionar no `index.html` a fonte pixel:
> ```html
> <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
> ```

### 2.11 `StatsCounter.tsx` — contador pixel no canto superior

> Estilo gamificado — fonte pixel, cor verde neон, bordas brilhantes. Animação de contagem ao carregar.

```tsx
// src/components/UI/StatsCounter.tsx
import { useEffect, useRef } from 'react';
import { Stats } from '../../types';

interface Props {
  stats: Stats | undefined;
}

// anima de 0 até o valor final
function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    let start = 0;
    const duration = 1500;
    const step = (timestamp: number, startTime: number) => {
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      if (ref.current) ref.current.textContent = Math.floor(eased * value).toString();
      if (progress < 1) requestAnimationFrame(t => step(t, startTime));
    };
    requestAnimationFrame(t => step(t, t));
  }, [value]);
  return <span ref={ref}>0</span>;
}

export default function StatsCounter({ stats }: Props) {
  if (!stats) return null;

  return (
    <div style={{
      position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)',
      zIndex: 10, pointerEvents: 'none',
    }}>
      {/* título principal */}
      <p style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '9px',
        color: '#34d399',
        textAlign: 'center',
        marginBottom: 10,
        letterSpacing: '0.05em',
        textShadow: '0 0 10px #34d39988',
      }}>
        🌍 AceleraDev conquistando o mundo
      </p>

      {/* contadores */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        {[
          { label: 'DEVS', value: stats.total },
          { label: 'ESTADOS', value: stats.states },
        ].map(({ label, value }) => (
          <div key={label} style={{
            background: 'rgba(8,10,20,0.85)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(52,211,153,0.3)',
            borderRadius: 8,
            padding: '6px 14px',
            textAlign: 'center',
            boxShadow: '0 0 15px rgba(52,211,153,0.1)',
          }}>
            <div style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '14px',
              color: '#34d399',
              textShadow: '0 0 8px #34d39966',
            }}>
              <AnimatedNumber value={value} />
            </div>
            <div style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '6px',
              color: '#475569',
              marginTop: 4,
              letterSpacing: '0.1em',
            }}>
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 2.12 `FilterBar.tsx` — filtro por área

```tsx
// src/components/UI/FilterBar.tsx
import { AREA_COLORS, AREA_LABELS } from '../../lib/colors';

interface Props {
  activeArea: string | null;
  onChange: (area: string | null) => void;
}

export default function FilterBar({ activeArea, onChange }: Props) {
  const areas = Object.keys(AREA_LABELS);

  return (
    <div style={{
      position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
      zIndex: 10, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center',
    }}>
      {/* botão "Todos" */}
      <button
        onClick={() => onChange(null)}
        style={{
          background: !activeArea ? 'rgba(255,255,255,0.15)' : 'rgba(8,10,20,0.7)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${!activeArea ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 20, padding: '6px 14px', cursor: 'pointer',
          color: !activeArea ? '#ffffff' : '#64748b',
          fontSize: 12, fontWeight: 600, transition: 'all 0.2s',
        }}
      >
        Todos
      </button>

      {areas.map(area => {
        const color   = AREA_COLORS[area];
        const active  = activeArea === area;
        return (
          <button
            key={area}
            onClick={() => onChange(active ? null : area)}
            style={{
              background: active ? `${color}22` : 'rgba(8,10,20,0.7)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${active ? `${color}66` : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 20, padding: '6px 14px', cursor: 'pointer',
              color: active ? color : '#64748b',
              fontSize: 12, fontWeight: 600, transition: 'all 0.2s',
              boxShadow: active ? `0 0 12px ${color}44` : 'none',
            }}
          >
            {AREA_LABELS[area]}
          </button>
        );
      })}
    </div>
  );
}
```

### 2.13 `GlobePage.tsx` — página principal

```tsx
// src/pages/GlobePage.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import GlobeScene from '../components/Globe/GlobeScene';
import AlunoCard from '../components/UI/AlunoCard';
import StatsCounter from '../components/UI/StatsCounter';
import FilterBar from '../components/UI/FilterBar';
import LoadingScreen from '../components/UI/LoadingScreen';
import { api } from '../lib/api';
import { AlunoGlobe, AlunoCard as AlunoCardType, Stats } from '../types';

export default function GlobePage() {
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [activeArea, setActiveArea]   = useState<string | null>(null);

  const { data: alunos, isLoading: loadingGlobe } = useQuery<AlunoGlobe[]>({
    queryKey: ['alunos'],
    queryFn:  () => api.get('/api/alunos').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: card, isFetching: loadingCard } = useQuery<AlunoCardType>({
    queryKey: ['aluno-card', selectedId],
    queryFn:  () => api.get(`/api/alunos/${selectedId}`).then(r => r.data),
    enabled:  !!selectedId,
  });

  const { data: stats } = useQuery<Stats>({
    queryKey: ['stats'],
    queryFn:  () => api.get('/api/alunos/stats').then(r => r.data),
    staleTime: 60 * 1000,
  });

  if (loadingGlobe) return <LoadingScreen />;

  return (
    <div style={{
      width: '100vw', height: '100vh', overflow: 'hidden',
      background: 'radial-gradient(ellipse at center, #0a0f1e 0%, #020408 100%)',
      position: 'relative',
    }}>
      <StatsCounter stats={stats} />

      <GlobeScene
        alunos={alunos || []}
        activeArea={activeArea}
        onMarkerClick={setSelectedId}
      />

      <AlunoCard
        aluno={card || null}
        loading={loadingCard}
        onClose={() => setSelectedId(null)}
      />

      <FilterBar
        activeArea={activeArea}
        onChange={setActiveArea}
      />
    </div>
  );
}
```

### 2.14 `LoadingScreen.tsx`

```tsx
export default function LoadingScreen() {
  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: 'radial-gradient(ellipse at center, #0a0f1e 0%, #020408 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        border: '3px solid transparent',
        borderTopColor: '#34d399',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: 10, color: '#34d399',
        textShadow: '0 0 10px #34d39988',
      }}>
        carregando o mapa...
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
```

### 2.15 `api.ts` — axios instance

```typescript
// src/lib/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
});

// injeta token admin nas rotas /admin
export const adminApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
});

adminApi.interceptors.request.use(config => {
  const token = sessionStorage.getItem('admin-token');
  if (token) config.headers['X-Admin-Token'] = token;
  return config;
});
```

### 2.16 `.env.local`

```env
VITE_API_URL=http://localhost:8080
```

---

## FASE 3 — Admin Panel (`/admin`)

### 3.1 `AdminLogin.tsx`

```tsx
import { useState } from 'react';
import { adminApi } from '../../lib/api';

interface Props { onLogin: () => void; }

export default function AdminLogin({ onLogin }: Props) {
  const [token, setToken]   = useState('');
  const [error, setError]   = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      sessionStorage.setItem('admin-token', token);
      await adminApi.get('/api/admin/alunos');
      onLogin();
    } catch {
      setError(true);
      sessionStorage.removeItem('admin-token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at center, #0a0f1e 0%, #020408 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'rgba(8,10,20,0.9)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(52,211,153,0.2)', borderRadius: 16,
        padding: 40, width: 340, textAlign: 'center',
      }}>
        <h1 style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 12, color: '#34d399', marginBottom: 24,
          textShadow: '0 0 10px #34d39988',
        }}>
          ADMIN
        </h1>
        <input
          type="password"
          placeholder="Token de acesso"
          value={token}
          onChange={e => { setToken(e.target.value); setError(false); }}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 8,
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${error ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
            color: '#ffffff', fontSize: 14, marginBottom: 12, outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {error && <p style={{ color: '#ef4444', fontSize: 12, marginBottom: 12 }}>Token inválido</p>}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%', padding: '10px', borderRadius: 8,
            background: '#34d399', border: 'none', color: '#000',
            fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </div>
    </div>
  );
}
```

### 3.2 `AdminForm.tsx` — formulário de inserção/edição

```tsx
// formulário completo com todos os campos do CreateAlunoRequest
// campos: area (select), gender (select), city (input), state (input),
//         salary (input texto livre), firstJobInIt (checkbox), keyInsight (textarea)
// ao submeter POST /api/admin/alunos, mostra preview do card gerado
// botão "Regenerar IA" chama PATCH /api/admin/alunos/{id}/regenerate
```

### 3.3 `AdminTable.tsx` — tabela de alunos

```tsx
// tabela com: avatar, anonymousName, area, city+state, salary, firstJobInIt, createdAt
// ações por linha: editar, deletar, regenerar IA
// busca por nome, filtro por área
```

---

## FASE 4 — Roteamento e App principal

### 4.1 `App.tsx`

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GlobePage  from './pages/GlobePage';
import AdminPage  from './pages/AdminPage';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/"      element={<GlobePage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

### 4.2 Textura da Terra

Baixar em: `https://visibleearth.nasa.gov/collection/1484/blue-marble`
- Usar a versão **2048x1024** (equilibrio tamanho/qualidade)
- Salvar em `public/earth-texture.jpg`

---

## FASE 5 — Deploy no VPS Debian + Docker

> Tudo em **um único VPS Debian** com Docker e Docker Compose. Stack: PostgreSQL + Quarkus (back) + nginx servindo o build do Vite (front) + Caddy como reverse proxy com auto-SSL via Let's Encrypt.
>
> **Roteamento final:**
> - `https://aceleradev.com.br/resultados/`        → frontend (nginx servindo o build do Vite)
> - `https://aceleradev.com.br/resultados/api/*`   → backend (Quarkus na porta 8080 interna)
>
> Caddy faz `uri strip_prefix /resultados` antes de bater nos containers — assim o Quarkus continua atendendo nas rotas `/api/...` que o plano já define, sem precisar de `quarkus.http.root-path`.

### 5.1 Estrutura no VPS

Cria a pasta `/opt/aceleradev-globe` no servidor (qualquer caminho serve, esse é só convenção):

```
/opt/aceleradev-globe/
├── docker-compose.yml
├── .env                          ← segredos (nunca commitar)
├── Caddyfile
├── backend/                      ← repo clonado do Quarkus
│   ├── Dockerfile
│   └── ... (código fonte)
├── frontend/                     ← repo clonado do React
│   ├── Dockerfile
│   ├── nginx.conf
│   └── ... (código fonte)
└── volumes/
    ├── pgdata/                   ← criado automaticamente pelo compose
    ├── caddy_data/
    └── caddy_config/
```

### 5.2 `backend/Dockerfile` — multi-stage (build + runtime JVM)

```dockerfile
# ---- build ----
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
RUN mvn -B -q package -DskipTests

# ---- runtime ----
FROM eclipse-temurin:21-jre-alpine
WORKDIR /work
COPY --from=build /app/target/quarkus-app/lib/      /work/lib/
COPY --from=build /app/target/quarkus-app/*.jar     /work/
COPY --from=build /app/target/quarkus-app/app/      /work/app/
COPY --from=build /app/target/quarkus-app/quarkus/  /work/quarkus/
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/work/quarkus-run.jar"]
```

> Não precisa rodar `mvn package` na sua máquina — o build acontece dentro do container.

### 5.3 `frontend/Dockerfile` — Vite build + nginx

```dockerfile
# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# build com base=/resultados/ embutido (ver 5.4)
RUN npm run build

# ---- runtime ----
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### 5.4 Configuração de subpath no frontend

O Vite precisa saber que os assets vão ser servidos em `/resultados/` no navegador, e o React Router precisa do mesmo `basename`. **Isso impacta arquivos da FASE 2:**

**`frontend/vite.config.ts`** — adicionar `base`:
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/resultados/',          // ← assets carregam de /resultados/assets/...
});
```

**`frontend/src/App.tsx`** — `BrowserRouter` com basename:
```tsx
<BrowserRouter basename="/resultados">
  <Routes>
    <Route path="/"      element={<GlobePage />} />
    <Route path="/admin" element={<AdminPage />} />
  </Routes>
</BrowserRouter>
```

**`frontend/.env.production`** — API na mesma origem (rota relativa via Caddy):
```env
VITE_API_URL=/resultados
```

> Em dev, `.env.local` continua com `VITE_API_URL=http://localhost:8080`. Em prod, `api.get('/api/alunos')` vira `/resultados/api/alunos` → Caddy strip → `/api/alunos` no Quarkus. Funciona em ambos os ambientes sem código condicional.

### 5.5 `frontend/nginx.conf` — serve SPA com fallback

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # cache longo pros assets versionados do Vite
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # SPA fallback — qualquer rota não-arquivo cai no index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

> O Caddy faz `strip_prefix /resultados` antes de chegar aqui, então o nginx vê paths como `/`, `/assets/main.js`, `/admin`. O `basename` do React Router cuida de reinterpretar `/resultados/admin` corretamente no client-side.

### 5.6 `docker-compose.yml` (raiz do `/opt/aceleradev-globe/`)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER:     ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASS}
      POSTGRES_DB:       ${DB_NAME}
    volumes:
      - ./volumes/pgdata:/var/lib/postgresql/data
    networks: [internal]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    restart: unless-stopped
    environment:
      DB_USER:            ${DB_USER}
      DB_PASS:            ${DB_PASS}
      DB_HOST:            postgres
      DB_NAME:            ${DB_NAME}
      ANTHROPIC_API_KEY:  ${ANTHROPIC_API_KEY}
      ADMIN_TOKEN:        ${ADMIN_TOKEN}
    depends_on:
      postgres:
        condition: service_healthy
    networks: [internal]

  frontend:
    build: ./frontend
    restart: unless-stopped
    networks: [internal]

  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - ./volumes/caddy_data:/data
      - ./volumes/caddy_config:/config
    depends_on:
      - backend
      - frontend
    networks: [internal, public]

networks:
  internal:
    driver: bridge
  public:
    driver: bridge
```

> O backend e o frontend **não expõem porta** para o host — só o Caddy. Tudo passa pela rede `internal`, então o backend só é acessível via reverse proxy.

### 5.7 `Caddyfile`

```caddyfile
aceleradev.com.br {
    encode zstd gzip

    # API — strip /resultados, mantém /api/...
    @api path /resultados/api/*
    handle @api {
        uri strip_prefix /resultados
        reverse_proxy backend:8080
    }

    # Frontend (SPA) — strip /resultados, nginx serve em /
    @front path /resultados /resultados/*
    handle @front {
        uri strip_prefix /resultados
        reverse_proxy frontend:80
    }

    # Tudo fora de /resultados — não é nosso. Devolve 404 pra não interferir
    # se você já tiver outra coisa em aceleradev.com.br no futuro.
    handle {
        respond 404
    }
}
```

> Se você **já tem outra coisa** rodando em `aceleradev.com.br` (site principal), troca o bloco `handle { respond 404 }` por um `reverse_proxy` apontando pro container/IP do site. Como o Caddy só roda nesse VPS, o site precisa estar acessível a partir daqui.

### 5.8 `.env` na raiz (NÃO commitar)

```env
DB_USER=aceleradev
DB_PASS=troca-isso-por-senha-forte
DB_NAME=aceleradev
ANTHROPIC_API_KEY=sk-ant-...
ADMIN_TOKEN=troca-isso-por-token-aleatorio-longo
```

Geração rápida dos segredos no próprio VPS:
```bash
openssl rand -base64 32        # senha postgres
openssl rand -hex  32          # admin token
```

Permissões:
```bash
chmod 600 /opt/aceleradev-globe/.env
```

### 5.9 DNS

No painel do registrador de `aceleradev.com.br`, garantir:

| Tipo | Host | Valor              |
|------|------|--------------------|
| A    | @    | `<IP do VPS>`      |
| A    | www  | `<IP do VPS>`      |

Sem subdomínios novos — tudo fica em `aceleradev.com.br/resultados`. O Caddy detecta o domínio e pede o certificado Let's Encrypt automaticamente na primeira request.

### 5.10 Subir pela primeira vez

No VPS:
```bash
# 1. dependências
sudo apt update
sudo apt install -y docker.io docker-compose-plugin git
sudo systemctl enable --now docker
sudo usermod -aG docker $USER     # logoff/logon depois disso

# 2. código
sudo mkdir -p /opt/aceleradev-globe && sudo chown $USER:$USER /opt/aceleradev-globe
cd /opt/aceleradev-globe
git clone <repo-do-backend>  backend
git clone <repo-do-frontend> frontend

# 3. configs (cria docker-compose.yml, Caddyfile, .env como acima)
nano .env
nano Caddyfile
nano docker-compose.yml

# 4. firewall — só 80/443 e SSH
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# 5. sobe
docker compose up -d --build
docker compose logs -f
```

Validar:
- `curl -I https://aceleradev.com.br/resultados/` → 200 (front)
- `curl https://aceleradev.com.br/resultados/api/alunos/stats` → JSON `{ "total":..., "states":... }`
- Acessar `https://aceleradev.com.br/resultados/admin` no navegador

### 5.11 Atualizações futuras (redeploy)

Sempre que mudar código:
```bash
cd /opt/aceleradev-globe/backend  && git pull
cd /opt/aceleradev-globe/frontend && git pull
cd /opt/aceleradev-globe
docker compose up -d --build backend frontend
```

Só backend ou só frontend dá pra rebuildar isolado, sem derrubar o resto.

### 5.12 Backup do banco

Cron diário (ex.: 03h da manhã) — adicionar em `crontab -e`:
```cron
0 3 * * * cd /opt/aceleradev-globe && docker compose exec -T postgres pg_dump -U aceleradev aceleradev | gzip > /opt/backups/aceleradev-$(date +\%Y\%m\%d).sql.gz
```

Reter ~30 dias:
```cron
0 4 * * * find /opt/backups -name 'aceleradev-*.sql.gz' -mtime +30 -delete
```

### 5.13 CORS — pode remover

Como front e API ficam na **mesma origem** (`aceleradev.com.br`), CORS não é mais necessário em produção. Pode deixar a config da FASE 1.14 do jeito que tá (cobre o dev em `localhost:5173`) ou remover totalmente as três linhas `quarkus.http.cors.*` se quiser simplificar. Não afeta o funcionamento em prod.

---

## Checklist de execução

- [ ] Docker Compose rodando PostgreSQL local
- [ ] Projeto Quarkus criado e rodando na porta 8080
- [ ] Migration Flyway executando ao subir
- [ ] `AvatarService` gerando URLs DiceBear corretamente
- [ ] `NicknameService` chamando Claude API e retornando nomes engraçados
- [ ] `GeocodingService` convertendo cidade+estado em lat/lng com offset
- [ ] CRUD admin funcionando (testar no Postman/Insomnia)
- [ ] Projeto React criado com Vite + TypeScript
- [ ] Fonte "Press Start 2P" carregando no `index.html`
- [ ] Textura da Terra em `public/earth-texture.jpg`
- [ ] Globo renderizando com Three.js + estrelas + atmosfera
- [ ] Pontos dos alunos aparecendo nas posições corretas
- [ ] Clique no ponto abrindo o card com animação
- [ ] `StatsCounter` aparecendo no topo com animação de contagem
- [ ] `FilterBar` filtrando os pontos por área em tempo real
- [ ] Rota `/admin` com login + CRUD completo
- [ ] `vite.config.ts` com `base: '/resultados/'`
- [ ] `BrowserRouter` com `basename="/resultados"`
- [ ] `.env.production` com `VITE_API_URL=/resultados`
- [ ] Dockerfile do backend (multi-stage) buildando OK
- [ ] Dockerfile + `nginx.conf` do frontend OK
- [ ] DNS de `aceleradev.com.br` apontando pro VPS
- [ ] `.env` no VPS com segredos (modo 600)
- [ ] `docker compose up -d --build` no VPS sem erro
- [ ] Caddy emitindo cert Let's Encrypt automaticamente
- [ ] `curl https://aceleradev.com.br/resultados/api/alunos/stats` retorna JSON
- [ ] Globo acessível em `https://aceleradev.com.br/resultados`
- [ ] Cron de backup do Postgres ativo
