# Implementation Plan
## Intelligent Task Management System (ITMS)

**Document Version:** 1.0
**Date Created:** March 10, 2026
**Status:** Approved for Development
**Classification:** Internal Use

---

## Legend

- **Effort:** S = <4 h | M = 4–8 h | L = 8–16 h
- **Execution:** `SEQ` = blocked on listed dependency | `PAR` = independently startable
- **BG Agent:** `Yes` = well-scoped, mechanical/boilerplate work | `No` = requires design judgment, algorithms, or security decisions

---

## Phase 0 — Project Setup & Infrastructure Skeleton

| Task ID | Title | Effort | FRD / TSD Ref | Execution | Depends On | BG Agent? |
|---------|-------|--------|---------------|-----------|------------|-----------|
| T-001 | Scaffold npm workspaces monorepo (`backend/`, `frontend/`, `shared/`) | S | TSD §5.3 | PAR | — | Yes |
| T-002 | Configure strict `tsconfig.json` (ES2020, noImplicitAny, noUnusedLocals, all strict flags) | S | TSD §5.1 | SEQ | T-001 | Yes |
| T-003 | ESLint + Prettier config with Husky pre-commit hooks (`lint && build && test`) | S | TSD §5.1 | SEQ | T-001 | Yes |
| T-004 | Docker Compose for local dev — PostgreSQL 14, Redis 7, pgAdmin | M | TSD §5.2, §5.3 | SEQ | T-001 | Yes |
| T-005 | TypeORM setup + migration runner script (baseline `000_init` migration, `npm run migrate`) | M | TSD §5.1 | SEQ | T-004 | No |
| T-006 | GitHub Actions CI skeleton — checkout, `npm ci`, TypeScript compile, artifact upload | M | TSD §7.2 Stage 1 | SEQ | T-002 | Yes |
| T-007 | Environment config — `dotenv`, `.env.example` with all required secret keys (DB, Redis, JWT, SendGrid) | S | TSD §6.1/A02 | SEQ | T-001 | Yes |
| T-008 | Express app shell — `app.ts` middleware chain, `index.ts` server bootstrap, `GET /health` endpoint | S | TSD §5.1 | SEQ | T-002 | Yes |
| T-009 | `authenticate()` JWT-verify middleware + `authorize(roles[])` RBAC middleware (wires into all subsequent routes) | M | FR-054–056, TSD §6.1/A01 | SEQ | T-008 | No |
| T-010 | OpenAPI/Swagger scaffold — `swagger-jsdoc` + `swagger-ui-express`, base spec at `/api/docs`, empty tag stubs for all 6 resource groups | S | NFR-003, TSD §4.8 | SEQ | T-008 | Yes |

---

## Phase 1 — Authentication & User Management

| Task ID | Title | Effort | FRD / TSD Ref | Execution | Depends On | BG Agent? |
|---------|-------|--------|---------------|-----------|------------|-----------|
| T-011 | `USERS` table migration — UUID PK, username, email, display_name, is_active, user_source (LDAP\|LOCAL), timestamps + 3 indexes | S | FR-010, TSD §3.1 | SEQ | T-005 | No |
| T-012 | `UserModel` TypeScript interface + `UserService.findByEmail()`, `UserService.listActive()` | S | FR-010, TSD §4.2 | SEQ | T-011 | No |
| T-013 | `POST /api/v1/auth/login` — Zod body schema, bcrypt credential verify, issue JWT access token (1 h) + refresh token (7 d), store refresh in Redis | M | IS-002, TSD §4.1, §6.1/A07 | SEQ | T-011 | No |
| T-014 | `POST /api/v1/auth/refresh` — verify refresh token, rotate (invalidate old, issue new), return new access token | S | IS-002, TSD §4.1 | SEQ | T-013 | No |
| T-015 | `POST /api/v1/auth/logout` — delete refresh token from Redis blacklist, 204 response | S | IS-002, TSD §4.1 | SEQ | T-013 | No |
| T-016 | Failed-login lockout — 5 attempts → 15-minute lockout, attempt counter in Redis with TTL | S | TSD §6.1/A07 | SEQ | T-013 | No |
| T-017 | `GET /api/v1/users` — paginated list, `is_active` filter, wire T-009 auth middleware | S | FR-010, FR-033, TSD §4.2 | SEQ | T-012 | No |
| T-018 | Local dev seed script — 4 users (one per role: Developer, Team Lead, PM, QA) with hashed passwords | S | TSD §5.3 | PAR | T-011 | Yes |
| T-019 | Auth unit tests + integration tests — login success/fail, lockout, refresh rotation, logout, RBAC middleware, 4-role matrix | M | NFR-002, TSD §7.2 Stage 2 | SEQ | T-013–T-017 | No |

---

## Phase 2 — Task Management (Core)

| Task ID | Title | Effort | FRD / TSD Ref | Execution | Depends On | BG Agent? |
|---------|-------|--------|---------------|-----------|------------|-----------|
| T-020 | `TASKS` table migration — all columns, priority/status enums, FKs to USERS, + 13 partial indexes from TSD §3.3 | S | FR-001–007, TSD §3.2–3.3 | SEQ | T-005 | No |
| T-021 | `TASK_DEPENDENCIES` table migration — UUID PK, blocking/dependent FK, `deleted_at` soft-delete column | S | FR-015–023, TSD §3.2 | SEQ | T-020 | No |
| T-022 | `TASK_HISTORY` table migration — change_type enum, `previous_values` / `new_values` JSONB, FK to USERS | S | FR-050–053, TSD §3.2 | SEQ | T-020 | No |
| T-023 | `ASSIGNMENTS_HISTORY` table migration — assigned_by, recipient_user, previous_assignee FKs, reason, timestamp | S | FR-013–014, TSD §3.2 | SEQ | T-020 | No |
| T-024 | `AUDIT_LOG` table migration — entity_type/action enums, entity_id, user_id FK, change_details JSONB, ip_address, user_agent | S | FR-050–053, TSD §3.2 | SEQ | T-020 | No |
| T-025 | Atomic task-number generator — sequential `T-NNN` counter (DB sequence or Redis INCR), immutable after creation (BR-R-003) | S | FR-002, BR-R-003 | SEQ | T-020 | No |
| T-026 | `TaskModel` interface + `CreateTaskRequest` Zod schema — all FRD §7.1 validation rules (title min/max, description min/max, priority enum, future date, assignee UUID) | M | FR-001–007, FRD §7.1 | SEQ | T-020 | No |
| T-027 | `POST /api/v1/tasks` — validate body, check assignee is_active, circular-dep pre-check, generate T-NNN, persist, write TASK_HISTORY CREATED entry, 201 response | M | FR-001–008, UC-001, TSD §4.3.1 | SEQ | T-025, T-026 | No |
| T-028 | `GET /api/v1/tasks` — paginated list, all query params (status, priority, assigned_to, due_before, due_after, search, sort_by, sort_order) with cumulative AND logic | M | FR-031–040, UC-005, TSD §4.3.2 | SEQ | T-027 | No |
| T-029 | `GET /api/v1/tasks/:id` — full detail with nested `blocking_on[]` + `blocked_by[]` dependency arrays and `history[]` array | S | FR-001, FR-050, TSD §4.3.3 | SEQ | T-027 | No |
| T-030 | `PATCH /api/v1/tasks/:id` — partial field update (title, description, priority, due date); enforce immutability of task_id, task_number, created_at; RBAC: creator or assignee for own, TL/PM for any | S | FR-001, FR-054, TSD §4.3.4 | SEQ | T-027 | No |
| T-031 | Status state machine validator — `canTransitionStatus(from, to, hasPendingDeps)` implementing all FRD §7.3 valid/invalid transitions; rejects BLOCKED→manual, COMPLETED→any, invalid hops | M | FR-024–026, BR-R-006–008, FRD §7.3 | SEQ | T-020 | No |
| T-032 | Status change handler — receive PATCH status, run T-031, auto-set `actual_completion` on COMPLETED (BR-R-012), write TASK_HISTORY STATUS_CHANGED entry, trigger T-037 if now COMPLETED | M | FR-024–030, BR-R-011–012, TSD §4.3.4 | SEQ | T-031 | No |
| T-033 | `DependencyService` — DFS/BFS circular dependency detection, add-dependency (dup check + circular check), soft-delete remove, all rules from FRD §7.2 | L | FR-015–023, BR-R-004–005, FRD §7.2 | SEQ | T-021 | No |
| T-034 | `POST /api/v1/tasks/:id/dependencies` — add blocking dep, run T-033 validation, re-evaluate dependent task status (auto-block if dep incomplete), RBAC: all roles | M | FR-015–021, UC-003, TSD §4.5.1 | SEQ | T-033 | No |
| T-035 | `DELETE /api/v1/tasks/:id/dependencies/:depId` — soft delete (`deleted_at`), re-evaluate blocked status, RBAC: TL/PM only (FR-056) | S | FR-022, FR-056, TSD §4.5.3 | SEQ | T-033 | No |
| T-036 | `GET /api/v1/tasks/:id/dependencies` — return `blocking_on[]` + `blocked_by[]` with current status of each | S | FR-015, TSD §4.5.2 | SEQ | T-033 | No |
| T-037 | Cascade unblock logic — on task COMPLETED transition, query all active dependents, re-evaluate each; auto-transition BLOCKED→TO_DO if all deps now complete (BR-R-007, FR-020) | M | FR-019–020, BR-R-007, UC-003/UC-004 | SEQ | T-032 | No |
| T-038 | `POST /api/v1/tasks/:id/assign` — validate assignee is_active (BR-R-010), write ASSIGNMENTS_HISTORY row, update task.assigned_to, RBAC: TL/PM only (FR-055) | M | FR-008–014, FR-055, UC-002, TSD §4.4.1 | SEQ | T-023 | No |
| T-039 | `GET /api/v1/tasks/:id/assignment-history` + `GET /api/v1/tasks/:id/history` | S | FR-013, FR-050–052, TSD §4.3.5, §4.4.2 | SEQ | T-038 | No |
| T-040 | `AuditLogService` — append-only writer called on every mutation (CREATE, UPDATE, DELETE, ASSIGN, BLOCK, UNBLOCK); captures entity_type, entity_id, user_id, ip_address, user_agent, change_details JSONB | M | FR-050–053, NFR-008, TSD §6.2 | SEQ | T-024 | No |
| T-041 | Task service unit tests + API integration tests — covers FR-001–056, all state machine paths, RBAC matrix, full 80%+ line coverage | L | NFR-002, TSD §7.2 Stage 2 | SEQ | T-027–T-040 | No |

---

## Phase 3 — Filtering, Search & Progress Dashboard

| Task ID | Title | Effort | FRD / TSD Ref | Execution | Depends On | BG Agent? |
|---------|-------|--------|---------------|-----------|------------|-----------|
| T-042 | Full-text case-insensitive search on task title + description — PostgreSQL `ILIKE` or `tsvector` GIN index, integrate into `GET /tasks` `search` param (FR-036, <2 s — FR-037) | M | FR-036–037, UC-005, TSD §3.3 | SEQ | T-028 | No |
| T-043 | Dashboard aggregation query — total tasks, completed%, in-progress%, blocked%, overdue high-priority list, team workload per user (assigned/completed/in-progress/blocked) | M | FR-041–049, UC-006, TSD §4.6.1 | SEQ | T-020 | No |
| T-044 | `GET /api/v1/reports/project-progress` — expose T-043 aggregation, `time_range` query param (TODAY\|THIS_WEEK\|THIS_MONTH), target <1 s response (NFR-004) | M | FR-006, FR-041–049, TSD §4.6.1 | SEQ | T-043 | No |
| T-045 | `GET /api/v1/reports/task-dependency-graph` — nodes (task_id, task_number, title, status, priority) + edges (from, to, dependency_id, status) for visualisation | M | FR-044, TSD §4.6.2 | SEQ | T-033 | No |
| T-046 | Redis cache layer for dashboard — 30 s TTL cache-aside, invalidate on any task mutation, `cache_max_age` override param | M | FR-047–048, NFR-004, TSD §5.1 | SEQ | T-044 | No |
| T-047 | Saved filter views — `user_filter_views` table (user_id, name, filter_json), CRUD endpoints, load saved view by name in UI (FR-039) | M | FR-039, FRD §4.5.10 | PAR | T-028 | No |
| T-048 | Dashboard + filtering unit and integration tests | S | NFR-002 | SEQ | T-042–T-047 | No |

---

## Phase 4 — Notifications

| Task ID | Title | Effort | FRD / TSD Ref | Execution | Depends On | BG Agent? |
|---------|-------|--------|---------------|-----------|------------|-----------|
| T-049 | Bull job queue initialisation — Redis-backed, named queue `notifications`, dead-letter queue, retry policy | S | TSD §5.1 | SEQ | T-004 | Yes |
| T-050 | `NOTIFICATIONS` table migration — user_id FK, type enum (10 types from FRD §8.1), payload JSONB, read_at, expires_at (30 d) | S | FR-011–012, FR-029, FRD §8.3 | SEQ | T-011 | No |
| T-051 | `NotificationService` — event-driven dispatcher for all 10 trigger types from FRD §8.1 matrix, enqueues Bull jobs with typed payload | L | FR-011–012, FR-029, FRD §8.1 | SEQ | T-049, T-050 | No |
| T-052 | SendGrid email adapter — integrate SDK, implement NT-001 through NT-005 templates (FRD §8.2), environment-gated in dev | M | FR-011–012, FR-029, FRD §8.2 | SEQ | T-051 | Yes |
| T-053 | Assignment notification hooks — call T-051 on task create (new assignee) and reassign (new + previous assignee), BR-R-009 | S | FR-011–012, BR-R-009 | SEQ | T-051, T-038 | No |
| T-054 | Dependency notification hooks — task blocked (FR-019), task unblocked (FR-020), multiple-blocker reminder | S | FR-019–020, FRD §8.1 | SEQ | T-051, T-037 | No |
| T-055 | Status-change notification hooks — In Progress → notify creator/TL/PM; Completed → notify creator/TL/PM/watchers | S | FR-029, FRD §8.1 | SEQ | T-051, T-032 | No |
| T-056 | Scheduled overdue-alert Bull cron jobs — daily 5 PM (all overdue), daily 8 AM + 4 PM (H-priority ≥3 days overdue, SMS to PM) | M | FRD §8.1 | SEQ | T-051 | No |
| T-057 | Notification unit tests — all 10 trigger types, queue enqueue/process, SendGrid mock, cron fire assertions | S | NFR-002 | SEQ | T-051–T-056 | No |

---

## Phase 5 — Reporting & Export

| Task ID | Title | Effort | FRD / TSD Ref | Execution | Depends On | BG Agent? |
|---------|-------|--------|---------------|-----------|------------|-----------|
| T-058 | Extended project-progress report endpoint — PM-audience metadata (percent complete trend, days-blocked per task) beyond dashboard aggregation | M | FRD §11.1, FR-006 | SEQ | T-044 | No |
| T-059 | CSV task-list export — streaming response (`Content-Disposition: attachment`), apply active filters from query params, columns match list-view display | M | FRD §11.3 | SEQ | T-028 | Yes |
| T-060 | PDF progress report export — `pdfmake` or `puppeteer` layout matching Project Progress Summary (FRD §11.1), triggered via `GET /api/v1/reports/project-progress?format=pdf` | L | FRD §11.3 | SEQ | T-058 | Yes |
| T-061 | Report rate-limiting + Redis cache — per-user token bucket (prevent expensive re-queries), short TTL cache keyed on filters + user | S | NFR-004 | SEQ | T-058 | No |

---

## Phase 6 — Security Hardening, Testing & Documentation

| Task ID | Title | Effort | FRD / TSD Ref | Execution | Depends On | BG Agent? |
|---------|-------|--------|---------------|-----------|------------|-----------|
| T-062 | Security headers — `helmet.js`, CORS allowlist from env, disable `x-powered-by`, trust-proxy flag for Azure App Service | S | TSD §6.1/A05 | PAR | T-008 | Yes |
| T-063 | Global rate-limiting middleware — `express-rate-limit` 100 req/15 min on `/api/` prefix, stricter 10 req/min on `/api/v1/auth/` | S | TSD §6.1/A04 | PAR | T-008 | Yes |
| T-064 | Input sanitisation audit — verify every endpoint has a Zod schema, no raw `req.body` pass-through; add missing schemas; document coverage | M | OWASP A03, TSD §6.1/A03 | SEQ | T-027–T-040 | No |
| T-065 | SonarQube SAST + Snyk SCA stages added to GitHub Actions pipeline (block merge on HIGH findings) | M | NFR-009, TSD §7.2 Stage 3 | SEQ | T-006 | Yes |
| T-066 | 80% coverage gate in CI — Jest `--coverage`, fail pipeline below threshold, Codecov report upload | S | NFR-002, TSD §7.2 Stage 2 | SEQ | T-041 | Yes |
| T-067 | OWASP ZAP DAST scan script — run against staging URL on schedule (weekly + pre-release), alert on MEDIUM+ findings | S | TSD §6.3 | SEQ | T-068, T-069 | No |
| T-068 | Multi-stage Dockerfile — `node:18-alpine` builder stage, non-root `nodejs` user, `--only=production`, health-check `CMD` | M | TSD §7.2 Stage 4 | PAR | T-008 | Yes |
| T-069 | Azure App Service deployment pipeline — ACR push, auto-deploy to staging + smoke test, manual approval gate for production, rollback step | L | BO-005, NFR-009, TSD §5.2, §7.2 Stage 5 | SEQ | T-068 | No |
| T-070 | OpenAPI spec completion + validation — fill all `@openapi` JSDoc annotations across Phases 1–5 endpoints, schema-match tests (`openapi-validator-middleware`) | M | NFR-003, TSD §4.8 | SEQ | T-027–T-058 | Yes |
| T-071 | README + deployment runbook — local setup, `npm run dev`, migration commands, test commands, Docker, Azure deploy steps | S | — | PAR | — | Yes |

---

## Summary

| Phase | Tasks | Key Deliverable | Total Effort |
|-------|-------|----------------|-------------|
| 0 — Setup | T-001 – T-010 | Compilable monorepo, Docker, CI green, auth middleware, Swagger shell | ~2 days |
| 1 — Auth/Users | T-011 – T-019 | Login, JWT, refresh, RBAC, `/users` list | ~2.5 days |
| 2 — Task Management | T-020 – T-041 | Full task CRUD, dependencies, state machine, audit log | ~7 days |
| 3 — Dashboard/Filters | T-042 – T-048 | Dashboard live, full-text search, Redis cache, saved views | ~2.5 days |
| 4 — Notifications | T-049 – T-057 | All 10 notification types firing via Bull + SendGrid | ~2 days |
| 5 — Reporting/Export | T-058 – T-061 | CSV/PDF export, rate-limited report endpoints | ~2 days |
| 6 — Hardening/Docs | T-062 – T-071 | OWASP mitigated, 80% CI gate, deployed to Azure, docs complete | ~2.5 days |
| **Total** | **71 tasks** | | **~20.5 dev-days** |

---

## Critical Path

Strictly sequential chain:

```
T-001 → T-005 → T-008 → T-009 → T-011 → T-013 → T-020 → T-026 → T-027 → T-031 → T-032 → T-033 → T-037 → T-040 → T-041
```

**Highest-risk task:** T-033 (`DependencyService` — DFS cycle detection). Rated L, no safe parallelism available; blocks T-034–T-036, T-045, and all dependency notification hooks in Phase 4. Plan a full day for this task with pair review before merge.
