---
name: itms-implementation
description: Generates a phased back-end implementation plan for the Intelligent Task Management System (ITMS) based on the FRD and TSD. Produces a table-formatted plan with effort, FRD traceability, parallelism, and background-agent flags.
agent: copilot
---

You are a senior software architect generating a detailed, phased implementation plan for the **Intelligent Task Management System (ITMS)**.

## Inputs

Read and analyse both documents before generating the plan:

- Functional requirements and use cases: [doc/frd.md](../../doc/frd.md)
- Technical architecture and API spec: [doc/tsd.md](../../doc/tsd.md)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript 5.0+ |
| Runtime | Node.js 18 LTS |
| Framework | Express.js 4.18+ |
| ORM | TypeORM 0.3+ |
| Database | PostgreSQL 14+ |
| Cache | Redis 7.0+ |
| Job Queue | Bull 4.10+ (Redis-backed) |
| Auth | JWT + Passport.js |
| Validation | express-validator 7.0+ |
| Logging | Winston 3.8+ |
| Testing | Jest 29+ + Supertest 6.3+ |
| API Docs | OpenAPI 3.0.1 / swagger-ui-express |

---

## Folder Structure Convention

All generated task file paths must reference this canonical src layout:

```
src/
├── routes/          # Express Router definitions (one file per resource)
├── controllers/     # Request handlers — parse req, call service, return res
├── services/        # Business logic (state machine, circular dep check, etc.)
├── repositories/    # TypeORM repository wrappers (data access only)
├── models/          # TypeORM entities (@Entity decorated classes)
├── middleware/      # Auth, RBAC, validation, logging, error handlers
├── jobs/            # Bull queue workers and job definitions
├── migrations/      # TypeORM migration files (numbered: XXXX-description)
├── types/           # Shared TypeScript interfaces, enums, DTOs
├── utils/           # Pure helpers (id generation, date checks, etc.)
└── config/          # App constants, env config, DB/Redis connection setup
```

---

## Migration Convention

Database migrations use **TypeORM CLI** naming format:

```
src/migrations/NNNN-<PascalCaseDescription>.ts
```

Examples:
- `0001-CreateUsersTable.ts`
- `0002-CreateTasksTable.ts`
- `0003-CreateTaskDependenciesTable.ts`
- `0004-CreateTaskHistoryTable.ts`
- `0005-CreateAuditLogTable.ts`
- `0006-CreateAssignmentsHistoryTable.ts`
- `0007-AddPerformanceIndexes.ts`

Each migration must be generated with:

```bash
npx typeorm migration:create src/migrations/NNNN-<Description>
```

And run with:

```bash
npx typeorm migration:run -d src/config/data-source.ts
```

---

## OpenAPI Convention

- Annotations are inline JSDoc using **tsoa** decorators on controllers.
- The compiled spec is written to `openapi.json` at project root.
- Swagger UI is served at `GET /api/docs` via `swagger-ui-express`.
- The spec is regenerated on every build:
  ```bash
  npx tsoa spec-and-routes
  ```
- Automated tests in `src/__tests__/openapi.spec.ts` verify the live API matches the spec.

---

## Output Format

Generate the implementation plan using the exact structure below.

- Use `##` H2 headers for each phase title (e.g. `## Phase 1: Foundation & Infrastructure`).
- Under each phase, include a task table with **exactly** these columns:

| ID | Task | Effort | FRD Ref | Parallel? | Background Agent? |
|----|------|--------|---------|-----------|-------------------|

Column semantics:
- **ID** — Sequential identifier: `P1-01`, `P1-02`, `P2-01`, etc.
- **Task** — Concise action description including the target file path where applicable.
- **Effort** — Story-point estimate using Fibonacci scale: `1`, `2`, `3`, `5`, `8`.
- **FRD Ref** — Comma-separated FRD requirement IDs (e.g. `FR-001`, `UC-001`) or `—` if infrastructure-only.
- **Parallel?** — `Yes` if the task can run in parallel with others in the same phase, `No` if it is a sequential blocker.
- **Background Agent?** — `Yes` if the task is well-defined and self-contained enough for autonomous background agent execution (file generation, boilerplate, migrations, spec output); `No` if it requires human judgment or cross-cutting decisions.

---

## Phases to Generate

Produce a plan covering exactly these eight phases, in order:

1. **Foundation & Infrastructure** — Project init, TypeScript config, Express app skeleton, Docker Compose for local Postgres + Redis, environment config, Winston logging setup, eslint/prettier/Husky.
2. **Database Migrations & Entities** — One migration file per table (referencing the schema in TSD §3.1), corresponding TypeORM `@Entity` classes in `src/models/`, and performance indexes from TSD §3.3.
3. **Repository Layer** — One TypeORM repository file per entity in `src/repositories/`, with typed finder methods needed by the service layer.
4. **Service Layer** — Business logic services in `src/services/` covering: task CRUD, status state machine (TO_DO → IN_PROGRESS → BLOCKED → COMPLETED per FR-004), circular dependency detection (UC-003), assignment logic (UC-002), and reporting aggregation (FR-006).
5. **Middleware & Auth** — JWT authentication middleware, RBAC role-guard middleware (using the permissions matrix in FRD §3.2), request validation middleware (express-validator schemas per TSD §4), rate limiting, and centralised error handler.
6. **Routes & Controllers** — Express routers in `src/routes/` and handlers in `src/controllers/` for every endpoint defined in TSD §4 (auth, users, tasks, assignment, dependencies, reporting).
7. **OpenAPI Spec & Documentation** — tsoa annotation pass over controllers, `npx tsoa spec-and-routes` integration in build, Swagger UI mount, and automated spec-conformance tests.
8. **Background Jobs, Testing & CI/CD** — Bull job workers in `src/jobs/` for async notifications (FR-002, FR-003), Jest unit tests for all services and repositories, Supertest integration tests for all routes, coverage enforcement (≥80%), GitHub Actions workflow, and Dockerfile.

---

## Additional Instructions

- For every service task in Phase 4, call out which **FRD business rules** (BR-R-*) must be enforced in that service.
- For every route task in Phase 6, reference the corresponding **TSD endpoint section** (e.g. "TSD §4.3.1").
- In Phase 7 (OpenAPI), explicitly list the controller files that need tsoa annotations.
- Flag any task that introduces a **cross-cutting concern** (e.g. audit logging, RBAC, notification triggering) with a note in the Task column so it is not overlooked during implementation.
- Do **not** include frontend (React) tasks — back-end only.