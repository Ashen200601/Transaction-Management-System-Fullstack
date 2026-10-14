# Finovex backend

REST API for the Finovex frontend. Built with Java 17, Spring Boot 4.1, Maven, PostgreSQL 18 and Flyway.

## Run it

You need **JDK 17+** and **Docker**. Maven doesn't need to be installed, because `mvnw` downloads it.

```bash
docker compose up -d        # PostgreSQL on localhost:5433
./mvnw spring-boot:run      # API on http://localhost:8080/api
```

On Windows PowerShell or cmd, use `.\mvnw.cmd` instead of `./mvnw`.

| What | URL |
| --- | --- |
| API base (the frontend's `VITE_API_BASE_URL`) | http://localhost:8080/api |
| Swagger UI: try endpoints, then use **Authorize** with a login token | http://localhost:8080/api/swagger-ui/index.html |
| Health check | http://localhost:8080/api/actuator/health |

To run without `compose.yaml`, use `./mvnw spring-boot:test-run`. It starts a throwaway database in Docker, and its data is lost when it stops.

## Folder structure

```
Backend/
├── pom.xml                      Maven build: dependencies and plugins
├── mvnw, mvnw.cmd, .mvn/        Maven Wrapper (pins Maven 3.10.0)
├── compose.yaml                 Local PostgreSQL
└── src/
    ├── main/java/com/finovex/
    │   ├── FinovexApplication.java      Entry point
    │   ├── controller/                  HTTP layer: routes, @Valid, status codes
    │   ├── manager/                     Business layer contracts (interfaces)
    │   │   └── impl/                    Business layer implementations (@Service, @Transactional)
    │   ├── repository/                  Database access (Spring Data JPA interfaces)
    │   ├── entity/                      JPA entities (tables), in the house style below
    │   ├── enums/                       MasterDataStatus and other fixed value lists
    │   ├── dto/
    │   │   ├── request/                 What clients send (records with validation annotations)
    │   │   └── response/                What the API returns (records); PageResponse for lists
    │   ├── mapper/                      Entity to response DTO conversion
    │   ├── exception/                   ApiException, ErrorCode, GlobalExceptionHandler
    │   ├── security/                    JWT issuing, 401/403 responses
    │   └── config/                      Spring configuration and typed properties
    ├── main/resources/
    │   ├── application.yml              Shared settings
    │   ├── application-local.yml        Local development (the default profile)
    │   ├── application-prod.yml         Production (settings come from environment variables)
    │   └── db/migration/                Flyway SQL migrations: V1__..., V2__...
    └── test/java/com/finovex/           Unit tests (Mockito) and integration tests (Testcontainers)
```

## How a request flows

```
HTTP request
  → controller        AuthController:   validates the DTO, calls the manager
  → manager           AuthManager:      the contract (interface)
  → manager.impl      AuthManagerImpl:  business rules, transactions, throws ApiException
  → repository        UserRepository:   reads and writes entities
  → PostgreSQL
```

Rules that keep the layers clean:

- **Controllers** hold no business rules and never use a repository. They take a request DTO and return a response DTO.
- **Controllers depend on the manager interface**, never on `...Impl`.
- **Entities never leave the manager layer.** Convert them with a mapper before returning.
- **Errors**: throw `new ApiException(ErrorCode.X, "message for the user")`. `GlobalExceptionHandler` turns it into the JSON error body the frontend reads.

## Adding a feature (example: products)

1. `db/migration/V2__create_products.sql`: the table. Never edit a migration that has already run; add a new one.
2. `entity/Product.java`: in the [entity style](#entity-style), with sequence `product_seq` created in the migration.
3. `repository/ProductRepository.java`: `extends JpaRepository<Product, Integer>`.
4. `dto/request/ProductRequest.java` and `dto/response/ProductResponse.java`: records.
5. `mapper/ProductMapper.java`: `toResponse(Product)`.
6. `manager/ProductManager.java` (interface) and `manager/impl/ProductManagerImpl.java` (`@Service`).
7. `controller/ProductController.java`: `@RestController @RequestMapping("/products")`.
8. Tests: a unit test for the manager, and an integration test for the endpoints.

Match the frontend's types in `Frontend/src/features/<feature>/types.ts` and `api.ts`.

## Entity style

Every entity follows the team's style. [User.java](src/main/java/com/finovex/entity/User.java) is the reference.

- **Annotations on the getters, never on the fields.** Every column getter has `@Basic` and `@Column(name = "snake_case")`. Use a plain class with getters, setters and the default constructor: no Lombok, no base class.
- **Id**: `Integer <name>Seq`:
  ```java
  @Id
  @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "G1")
  @SequenceGenerator(name = "G1", sequenceName = "product_seq", allocationSize = 1)
  @Column(name = "product_seq", unique = true)
  public Integer getProductSeq() { ... }
  ```
  Every entity can use the generator name `G1`. Each one still draws from its own `sequenceName` (tested on Hibernate 7.4).
- **Audit columns** in every entity: `createdBy` (`@CreatedBy`), `createdDate` (`@CreatedDate`), `lastModifiedBy` (`@LastModifiedBy`) and `lastModifiedDate` (`@LastModifiedDate`), as `java.util.Date` with `@JsonFormat(pattern = "yyyy-MM-dd HH:mm")`. Add `@EntityListeners(AuditingEntityListener.class)` on the class. They hold the signed-in username, or `system` when nobody is signed in (see `JpaConfig`).
- **Status**: `Integer status` plus `@Transient statusDescription`. `setStatus` sets the description with `MasterDataStatus.findOne(status).getStatus()`.
- **Relations**: `@ManyToOne`/`@OneToOne(fetch = FetchType.LAZY)` with `@JoinColumn`, plus the same foreign key as a read-only `Integer xxxSeq` getter (`insertable = false, updatable = false`).
- **Every getter is mapped to a column**, so mark helper or UI-only getters `@Transient`.
- **The migration must match the entity**: the `<table>_seq` sequence, `INTEGER` keys, `TIMESTAMP` dates and the four audit columns. Hibernate checks this at startup and refuses to start on a mismatch.

## Conventions the frontend relies on

| Topic | Rule |
| --- | --- |
| Errors | RFC 7807 JSON with `code`, `title`, `detail`, and `errors` (messages per field). Validation errors return **422**. |
| Lists | `PageResponse`: `{ items, page, pageSize, totalItems, totalPages }`. Pages start at **1**. |
| Money | Integer minor units (cents) as `long`/`BIGINT`. Never use `double`. |
| IDs | `Integer` keys from a sequence (`<table>_seq`). JSON sends them as strings (`"42"`) because the frontend types every id as a string. |
| Times | `java.util.Date` in entities, stored as `TIMESTAMP` in UTC. Response DTOs send ISO-8601 strings. |
| Auth | `Authorization: Bearer <accessToken>` from `POST /auth/login` |
| Business | The frontend sends the active business in the `X-Business-Id` header. CORS already allows it; nothing reads it yet. |

## Configuration

The `local` profile is used when no profile is set. Production runs with `SPRING_PROFILES_ACTIVE=prod` and these environment variables:

| Variable | Purpose |
| --- | --- |
| `SPRING_DATASOURCE_URL` / `_USERNAME` / `_PASSWORD` | Database connection |
| `FINOVEX_SECURITY_JWT_SECRET` | Token signing key: base64, at least 32 random bytes. Generate one with `openssl rand -base64 48`. |
| `FINOVEX_CORS_ALLOWED_ORIGINS` | Frontend origin, if it is served from a different domain |

The values in `application-local.yml` and `compose.yaml` are for development only.

## Tests

```bash
./mvnw test
```

The unit tests run anywhere. The integration tests start PostgreSQL in Docker and are skipped when Docker isn't running.

## Not built yet

- Feature modules: businesses, customers, products, inventory, transactions, dashboard, documents, integrations.
- Reading `X-Business-Id` and checking the user's role in that business (permissions in `Frontend/src/features/tenancy/permissions.ts`).
- Sign-up accepts `businessName` but doesn't store it, because there is no business module yet.
- Logout doesn't revoke the token. It stays valid until it expires (8 hours).
- No rate limit on login attempts.
