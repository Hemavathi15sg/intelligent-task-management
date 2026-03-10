# ITMS API — Intelligent Task Management System

REST API built with **Node.js 18 LTS · TypeScript 5 · Express 4.18**

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18.0.0 |
| npm | ≥ 9.0.0 |

---

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/Hemavathi15sg/intelligent-task-management.git
cd intelligent-task-management

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env — at minimum set JWT_SECRET to a secure random value

# 4. Start the development server (hot-reload)
npm run dev
```

The server starts on **http://localhost:3000** by default.

### Verify it's running

```bash
curl http://localhost:3000/api/v1/health
```

Expected response:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-03-10T10:00:00.000Z",
    "version": "1.0.0"
  },
  "meta": {
    "timestamp": "2026-03-10T10:00:00.000Z"
  }
}
```

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with hot-reload (`ts-node-dev`) |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Run compiled production build |
| `npm test` | Run Jest test suite |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Run ESLint across `src/` |
| `npm run lint:fix` | Auto-fix ESLint violations |
| `npm run format` | Format source files with Prettier |

---

## Project Structure

```
.
├── src/
│   ├── index.ts                    # Server entry point (port 3000)
│   ├── app.ts                      # Express app — middleware & route wiring
│   │
│   ├── config/
│   │   ├── env.config.ts           # Typed environment variable loader
│   │   └── app.constants.ts        # Application-wide constants
│   │
│   ├── api/
│   │   └── v1/
│   │       ├── routes.ts           # Aggregates all v1 resource routers
│   │       ├── health/
│   │       │   ├── health.controller.ts
│   │       │   └── health.routes.ts
│   │       └── users/              # (existing) User resource scaffolding
│   │           ├── user.model.ts
│   │           ├── user.service.ts
│   │           └── user.service.spec.ts
│   │
│   ├── middleware/
│   │   ├── error.middleware.ts     # Centralised error handler (must be last)
│   │   └── logging.middleware.ts   # Request ID generation + structured logging
│   │
│   ├── utils/
│   │   ├── logger.util.ts          # Winston-backed structured logger
│   │   └── response.util.ts        # successResponse / errorResponse helpers
│   │
│   ├── types/
│   │   ├── api.types.ts            # ApiResponse<T> envelope type
│   │   ├── errors.types.ts         # ApiError / ValidationError / NotFoundError …
│   │   └── express.types.ts        # Express Request augmentation (req.id, req.user)
│   │
│   ├── storage/
│   │   └── store.ts                # Singleton in-memory data store (Phase 1)
│   │
│   ├── routes/                     # Placeholder — non-versioned routes
│   ├── controllers/                # Placeholder — future extracted controllers
│   ├── services/                   # Placeholder — future extracted services
│   ├── repositories/               # Placeholder — future data-access layer
│   └── models/                     # Placeholder — future domain models
│
├── .env.example                    # Environment variable template
├── package.json
├── tsconfig.json
├── jest.config.js
├── .eslintrc.json
└── .prettierrc
```

---

## API Endpoints

### Health

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/health` | Liveness check — returns status, timestamp, version |

### Planned (upcoming sprints)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/auth/login` | Authenticate and receive JWT tokens |
| `POST` | `/api/v1/auth/refresh` | Refresh access token |
| `POST` | `/api/v1/auth/logout` | Invalidate refresh token |
| `GET` | `/api/v1/users` | List active users |
| `GET` | `/api/v1/users/:id` | Get a single user |
| `POST` | `/api/v1/tasks` | Create a task |
| `GET` | `/api/v1/tasks` | List / filter tasks |
| `GET` | `/api/v1/tasks/:id` | Get task detail with history |
| `PATCH` | `/api/v1/tasks/:id` | Update task fields / status |
| `POST` | `/api/v1/tasks/:id/assign` | Assign / reassign a task |
| `POST` | `/api/v1/tasks/:id/dependencies` | Add a blocking dependency |
| `DELETE` | `/api/v1/tasks/:id/dependencies/:depId` | Remove a dependency |
| `GET` | `/api/v1/reports/project-progress` | Project progress dashboard |
| `GET` | `/api/v1/reports/task-dependency-graph` | Dependency graph data |

Full specification: [doc/tsd.md](doc/tsd.md)

---

## Environment Variables

See [.env.example](.env.example) for the complete list with descriptions.

**Required before deployment:**

| Variable | Purpose |
|----------|---------|
| `JWT_SECRET` | HS256 signing secret — use a random 256-bit value |
| `ALLOWED_ORIGINS` | Comma-separated CORS whitelist |

---

## Testing

```bash
# Run all tests
npm test

# Run with coverage (80% threshold required)
npm run test:coverage
```

Tests are co-located with source files: `*.spec.ts`

---

## Code Quality

```bash
# Lint
npm run lint

# Format
npm run format

# Full pre-push check (matches CI)
npm run lint && npm run build && npm test -- --coverage
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18 LTS |
| Language | TypeScript 5 |
| Framework | Express 4.18 |
| Logging | Winston 3 |
| Validation | Zod 3 |
| Authentication | JWT (jsonwebtoken) |
| Testing | Jest 29 + Supertest |
| Linting | ESLint 8 + Prettier 3 |
| Storage (Phase 1) | In-memory (`Map`-based singleton) |
| Storage (Phase 2) | PostgreSQL 14 via TypeORM |
| Cache (Phase 2) | Redis 7 |

---

## Related Documents

- [Business Requirements Document](doc/brd.md)
- [Functional Requirements Document](doc/frd.md)
- [Technical Specification Document](doc/tsd.md)
- [Implementation Plan](doc/implementation-plan.md)
