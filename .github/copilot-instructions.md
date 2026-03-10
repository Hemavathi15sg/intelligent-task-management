---
name: "REST API TypeScript + Express Workspace Standards"
description: "Workspace-wide coding standards for REST API project with TypeScript, Express, and in-memory storage"
---

# Workspace Coding Standards
## TypeScript + Express REST API with In-Memory Storage

This document establishes workspace-wide conventions for the REST API project. All code contributions must adhere to these standards.

---

## 1. Language & Framework Conventions

### TypeScript Configuration

**tsconfig.json requirements:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Naming Conventions

**Files and Directories:**
- Controllers: `*.controller.ts` (e.g., `user.controller.ts`)
- Services: `*.service.ts` (e.g., `user.service.ts`)
- Models: `*.model.ts` (e.g., `user.model.ts`)
- Routes: `*.routes.ts` (e.g., `user.routes.ts`)
- Middleware: `*.middleware.ts` (e.g., `auth.middleware.ts`)
- Utilities: `*.util.ts` (e.g., `validation.util.ts`)
- Constants: `*.constants.ts` (e.g., `app.constants.ts`)
- Tests: `*.spec.ts` or `*.test.ts` (e.g., `user.service.spec.ts`)
- Directory names: lowercase with hyphens (e.g., `src/api/v1/user-management/`)

**Variables and Functions:**
- Use camelCase for variables and functions: `const userId = 123;`, `function getUserById() {}`
- Use UPPER_SNAKE_CASE for constants: `const MAX_RETRY_ATTEMPTS = 3;`
- Use PascalCase for classes and types: `class UserService {}`, `interface UserPayload {}`
- Prefix boolean variables with `is`, `has`, `can`, `should`: `isActive`, `hasPermission`, `canDelete`
- Private methods/properties: prefix with `#` (ES2022) or `_`: `#validateInput()`, `_internalHelper()`

**Type Naming:**
- Request DTOs: `Create[Resource]Request` or `[Resource]CreatePayload` (e.g., `CreateUserRequest`)
- Response DTOs: `[Resource]Response` or `[Resource]DTO` (e.g., `UserResponse`)
- Database models: `[Resource]Model` or just `[Resource]` (e.g., `UserModel`)
- Error classes: `[Resource]Error` (e.g., `ValidationError`, `NotFoundError`)

### Module Organization

**Directory Structure:**
```
src/
├── app.ts                          # Express app initialization
├── index.ts                        # Server entry point
├── config/                         # Configuration files
│   ├── app.constants.ts           # Application constants
│   ├── database.config.ts         # In-memory DB config
│   └── env.config.ts              # Environment variables
├── middleware/                     # Express middleware
│   ├── error.middleware.ts        # Centralized error handler
│   ├── auth.middleware.ts         # Authentication
│   ├── validation.middleware.ts   # Request validation
│   └── logging.middleware.ts      # Request logging
├── api/
│   └── v1/                        # Version namespace
│       ├── routes.ts              # Route aggregation
│       └── [resource]/
│           ├── [resource].controller.ts
│           ├── [resource].service.ts
│           ├── [resource].model.ts
│           ├── [resource].routes.ts
│           ├── dto/
│           │   ├── create.[resource].request.ts
│           │   └── [resource].response.ts
│           └── [resource].spec.ts
├── storage/                       # In-memory storage layer
│   ├── store.ts                  # Store instance/singleton
│   └── store.spec.ts
├── types/                         # Shared types/interfaces
│   ├── errors.types.ts
│   ├── api.types.ts
│   └── express.types.ts
├── utils/                         # Utility functions
│   ├── validation.util.ts
│   ├── logger.util.ts
│   └── response.util.ts
└── __tests__/                     # Integration tests
    └── [integration-tests]
```

### Module Exports

**Avoid circular dependencies:**
- One service should not directly import another service's controller
- Use dependency injection or shared event/message bus
- Keep type definitions in separate files to avoid circular imports

**Export syntax:**
```typescript
// ✅ CORRECT
export class UserService {
  // ...
}

export interface CreateUserRequest {
  // ...
}

// ❌ AVOID
export { UserService, CreateUserRequest };  // Unless re-exporting
export * from './user.service';             // Prefer explicit imports
```

---

## 2. API Design Rules

### API Versioning

**Standard format:** `/api/v{major}/[resource]/[action]`

```
GET    /api/v1/users                        # List all users
GET    /api/v1/users/:id                    # Get single user
POST   /api/v1/users                        # Create user
PUT    /api/v1/users/:id                    # Update user (full replacement)
PATCH  /api/v1/users/:id                    # Partial update
DELETE /api/v1/users/:id                    # Delete user
POST   /api/v1/users/:id/activate           # Custom action
```

**Version strategy:**
- URL versioning only: `/api/v1/` (no header versioning for this project)
- Major version increments for breaking changes
- Deprecated versions require explicit sunset date
- Minimum 6-month notice before deprecation

### Response Envelope

**All responses MUST follow this envelope structure:**

```typescript
interface ApiResponse<T = null> {
  success: boolean;              // ✅ true | ❌ false
  data?: T;                      // Only present if success=true
  error?: {
    code: string;               // ERR_* identifier
    message: string;            // User-friendly message
    details?: Record<string, any>; // Validation errors, etc.
  };
  meta?: {
    timestamp: string;          // ISO 8601 format
    requestId: string;          // Correlation ID
    path: string;               // Request path
    method: string;             // HTTP method
  };
}
```

**Response Examples:**

```typescript
// ✅ Success (200)
{
  "success": true,
  "data": {
    "id": "usr_123abc",
    "email": "user@example.com",
    "createdAt": "2026-03-09T10:30:00Z"
  },
  "meta": {
    "timestamp": "2026-03-09T10:30:00Z",
    "requestId": "req_abc123xyz",
    "path": "/api/v1/users",
    "method": "GET"
  }
}

// ❌ Error (400 - Validation Failed)
{
  "success": false,
  "error": {
    "code": "ERR_VALIDATION_FAILED",
    "message": "Validation failed for the submitted data",
    "details": {
      "email": ["Email must be a valid email address"],
      "age": ["Age must be greater than 18"]
    }
  },
  "meta": {
    "timestamp": "2026-03-09T10:30:00Z",
    "requestId": "req_def456uvw",
    "path": "/api/v1/users",
    "method": "POST"
  }
}

// ❌ Error (404 - Not Found)
{
  "success": false,
  "error": {
    "code": "ERR_USER_NOT_FOUND",
    "message": "User with ID 'usr_invalid' does not exist"
  },
  "meta": {
    "timestamp": "2026-03-09T10:30:00Z",
    "requestId": "req_ghi789stu",
    "path": "/api/v1/users/usr_invalid",
    "method": "GET"
  }
}
```

**Response Helper:**

```typescript
// utils/response.util.ts
export function successResponse<T>(data: T, meta?: Partial<ApiResponse['meta']>): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  };
}

export function errorResponse(code: string, message: string, details?: any, meta?: Partial<ApiResponse['meta']>): ApiResponse {
  return {
    success: false,
    error: { code, message, details },
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  };
}
```

**Usage in Controller:**

```typescript
// ✅ CORRECT
export class UserController {
  constructor(
    private userService: UserService,
    private logger: Logger,
    private responseUtil: ResponseUtil
  ) {}

  async getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await this.userService.getUserById(req.params.id);
      res.json(this.responseUtil.success(user, { requestId: req.id }));
    } catch (error) {
      next(error);
    }
  }
}
```

---

## 3. Error Handling

### Custom Error Classes

**Base Error Class:**

```typescript
// types/errors.types.ts
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: Record<string, any>) {
    super('ERR_VALIDATION_FAILED', message, 400, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string, id?: string) {
    const message = id 
      ? `${resource} with ID '${id}' not found`
      : `${resource} not found`;
    super('ERR_NOT_FOUND', message, 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super('ERR_UNAUTHORIZED', message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden') {
    super('ERR_FORBIDDEN', message, 403);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends ApiError {
  constructor(message: string, code: string = 'ERR_CONFLICT') {
    super(code, message, 409);
    this.name = 'ConflictError';
  }
}
```

### Centralized Error Middleware

```typescript
// middleware/error.middleware.ts
export function errorMiddleware(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const logger = req.logger || createLogger('error-middleware');

  // Log error with request context
  logger.error({
    code: (error as ApiError).code || 'ERR_INTERNAL_SERVER_ERROR',
    message: error.message,
    requestId: req.id,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    stack: error.stack
  });

  // Handle known errors
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details && { details: error.details })
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
        path: req.path,
        method: req.method
      }
    });
    return;
  }

  // Handle unexpected errors
  res.status(500).json({
    success: false,
    error: {
      code: 'ERR_INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : error.message
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: req.id,
      path: req.path,
      method: req.method
    }
  });
}

// Register error middleware LAST in app.ts
app.use(errorMiddleware);
```

### HTTP Status Code Reference

| Status | Use Case | Error Code |
|--------|----------|-----------|
| 200 | Success | N/A |
| 201 | Resource created | N/A |
| 204 | No content / Delete success | N/A |
| 400 | Validation failed, bad request | ERR_VALIDATION_FAILED |
| 401 | Missing or invalid auth | ERR_UNAUTHORIZED |
| 403 | Auth valid but permission denied | ERR_FORBIDDEN |
| 404 | Resource not found | ERR_NOT_FOUND |
| 409 | Conflict (duplicate, constraint violation) | ERR_CONFLICT |
| 422 | Unprocessable entity | ERR_UNPROCESSABLE_ENTITY |
| 500 | Server error | ERR_INTERNAL_SERVER_ERROR |

---

## 4. Security

### Input Validation

**MANDATORY: All user input must be validated with a schema library.**

**Recommended schema libraries:**
- `zod` (lightweight, excellent TypeScript support)
- `joi` (more verbose but powerful)
- `yup` (similar to joi)

**Example with Zod:**

```typescript
// api/v1/users/dto/create.user.request.ts
import { z } from 'zod';

export const CreateUserRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  age: z.number().int().min(18, 'Must be at least 18 years old').optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[0-9]/, 'Password must contain digit'),
  role: z.enum(['user', 'admin']).default('user')
});

export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;
```

**Validation Middleware:**

```typescript
// middleware/validation.middleware.ts
export function validateRequest(schema: z.ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.errors.reduce((acc, err) => {
          const path = err.path.join('.');
          acc[path] = [err.message];
          return acc;
        }, {} as Record<string, string[]>);
        
        throw new ValidationError('Validation failed for the submitted data', details);
      }
      throw error;
    }
  };
}
```

**Controller Usage:**

```typescript
// ✅ CORRECT
export class UserController {
  async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // req.body is already validated by middleware
      const user = await this.userService.createUser(req.body);
      res.status(201).json(successResponse(user, { requestId: req.id }));
    } catch (error) {
      next(error);
    }
  }
}

// Routes
router.post('/users', 
  validateRequest(CreateUserRequestSchema),
  (req, res, next) => controller.createUser(req, res, next)
);
```

### Security Rules (CRITICAL)

✅ **DO:**
- Always validate input with schema validation library
- Always use environment variables for sensitive data (keys, passwords)
- Always use HTTPS in production
- Always implement rate limiting on public endpoints
- Always log security events (failed auth, validation errors) with request context
- Always sanitize error messages before sending to client (don't leak internal details)
- Always use strong password hashing (bcrypt, argon2)
- Always implement CORS properly (whitelist origins)
- Always keep dependencies updated and scan for vulnerabilities

❌ **NEVER:**
- Never trust user input - always validate/sanitize
- Never expose internal error details to clients in production
- Never log passwords or sensitive data
- Never hardcode secrets in code
- Never use `eval()` or `Function()` constructor
- Never concatenate user input into database queries (use parameterized queries - see Database section)
- Never store plain-text passwords
- Never allow directory traversal (validate file paths)

---

## 5. Database

### In-Memory Storage Implementation

**Singleton Store Pattern:**

```typescript
// storage/store.ts
export class InMemoryStore {
  private static instance: InMemoryStore;
  
  private data: Map<string, Map<string, any>> = new Map();

  private constructor() {
    this.initializeTables();
  }

  static getInstance(): InMemoryStore {
    if (!InMemoryStore.instance) {
      InMemoryStore.instance = new InMemoryStore();
    }
    return InMemoryStore.instance;
  }

  private initializeTables(): void {
    this.data.set('users', new Map());
    this.data.set('products', new Map());
    // ... initialize other tables
  }

  // Typed getter for type safety
  getTable<T>(tableName: string): Map<string, T> {
    const table = this.data.get(tableName);
    if (!table) {
      throw new Error(`Table '${tableName}' not found`);
    }
    return table as Map<string, T>;
  }

  // Query-like interface (query builder pattern)
  async find<T>(tableName: string, predicate?: (item: T) => boolean): Promise<T[]> {
    const table = this.getTable<T>(tableName);
    const items = Array.from(table.values());
    return predicate ? items.filter(predicate) : items;
  }

  async findById<T>(tableName: string, id: string): Promise<T | null> {
    const table = this.getTable<T>(tableName);
    return table.get(id) || null;
  }

  async create<T>(tableName: string, id: string, data: T): Promise<T> {
    const table = this.getTable<T>(tableName);
    if (table.has(id)) {
      throw new ConflictError(`${tableName} with ID '${id}' already exists`);
    }
    table.set(id, data);
    return data;
  }

  async update<T>(tableName: string, id: string, data: Partial<T>): Promise<T> {
    const table = this.getTable<T>(tableName);
    const existing = table.get(id);
    if (!existing) {
      throw new NotFoundError(tableName, id);
    }
    const updated = { ...existing, ...data };
    table.set(id, updated);
    return updated;
  }

  async delete<T>(tableName: string, id: string): Promise<boolean> {
    const table = this.getTable<T>(tableName);
    return table.delete(id);
  }

  async count(tableName: string): Promise<number> {
    const table = this.data.get(tableName);
    return table ? table.size : 0;
  }

  // For testing: clear all data
  clear(): void {
    this.data.clear();
    this.initializeTables();
  }
}

export const store = InMemoryStore.getInstance();
```

### Query Builder Pattern (No Raw Queries)

**Never use raw string queries. Always use the store interface or a query builder:**

```typescript
// ✅ CORRECT - Using store interface
export class UserService {
  constructor(private store: InMemoryStore) {}

  async getUserById(id: string): Promise<UserModel | null> {
    return this.store.findById<UserModel>('users', id);
  }

  async getUserByEmail(email: string): Promise<UserModel | null> {
    const users = await this.store.find<UserModel>('users', 
      (user) => user.email === email
    );
    return users[0] || null;
  }

  async createUser(payload: CreateUserRequest): Promise<UserModel> {
    const userId = `usr_${generateId()}`;
    const user: UserModel = {
      id: userId,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      password: await hashPassword(payload.password),
      role: payload.role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return this.store.create('users', userId, user);
  }
}

// ❌ WRONG - Never do this
function getUserByEmail(email: string) {
  const query = `SELECT * FROM users WHERE email = '${email}'`;  // ❌ STRING CONCATENATION!
  return executeRawQuery(query);  // ❌ NO RAW QUERIES
}
```

### Schema Migrations (For Future Scaling)

When transitioning to a real database, maintain migration files:

```typescript
// migrations/001_create_users_table.ts
export async function up(db: Database): Promise<void> {
  await db.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('email').unique().notNullable();
    table.string('firstName').notNullable();
    table.string('lastName').notNullable();
    table.string('password').notNullable();
    table.enum('role', ['user', 'admin']).defaultTo('user');
    table.timestamps(true, true);
    table.index('email');
  });
}

export async function down(db: Database): Promise<void> {
  await db.schema.dropTableIfExists('users');
}
```

---

## 6. Testing

### Unit Testing Requirements

**MANDATORY: Every new function must have a unit test.**

**Testing Framework:**
- Use `jest` for unit tests
- Use `supertest` for API integration tests
- Use `sinon` or `jest.mock()` for mocking

**Test File Naming:**
- `*.spec.ts` or `*.test.ts` - Tests should be colocated with source files or in `__tests__/` directory

**Test Structure:**

```typescript
// services/user.service.spec.ts
import { UserService } from './user.service';
import { InMemoryStore } from '../../storage/store';
import { ValidationError, ConflictError } from '../../types/errors.types';

describe('UserService', () => {
  let userService: UserService;
  let store: InMemoryStore;

  beforeEach(() => {
    store = InMemoryStore.getInstance();
    store.clear(); // Reset for each test
    userService = new UserService(store);
  });

  describe('createUser', () => {
    it('should create a new user with valid input', async () => {
      const payload = {
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'SecurePass123'
      };

      const user = await userService.createUser(payload);

      expect(user).toMatchObject({
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        role: 'user'
      });
      expect(user.id).toBeDefined();
      expect(user.password).not.toBe(payload.password); // Should be hashed
    });

    it('should throw ConflictError if email already exists', async () => {
      const payload = {
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'SecurePass123'
      };

      await userService.createUser(payload);

      await expect(userService.createUser(payload))
        .rejects
        .toThrow(ConflictError);
    });

    it('should hash password before storing', async () => {
      const payload = {
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'SecurePass123'
      };

      const user = await userService.createUser(payload);

      expect(user.password).not.toBe(payload.password);
    });
  });

  describe('getUserById', () => {
    it('should return user if found', async () => {
      const created = await userService.createUser({
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'SecurePass123'
      });

      const found = await userService.getUserById(created.id);

      expect(found).toEqual(created);
    });

    it('should return null if user not found', async () => {
      const found = await userService.getUserById('invalid-id');
      expect(found).toBeNull();
    });
  });
});
```

### API Integration Testing

```typescript
// __tests__/api/users.integration.spec.ts
import request from 'supertest';
import { app } from '../../app';
import { InMemoryStore } from '../../storage/store';

describe('User API Endpoints', () => {
  let store: InMemoryStore;

  beforeEach(() => {
    store = InMemoryStore.getInstance();
    store.clear();
  });

  describe('POST /api/v1/users', () => {
    it('should create a new user with valid payload', async () => {
      const payload = {
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'SecurePass123'
      };

      const response = await request(app)
        .post('/api/v1/users')
        .send(payload)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName
      });
      expect(response.body.meta.requestId).toBeDefined();
    });

    it('should return validation error with invalid email', async () => {
      const payload = {
        email: 'invalid-email',
        firstName: 'John',
        lastName: 'Doe',
        password: 'SecurePass123'
      };

      const response = await request(app)
        .post('/api/v1/users')
        .send(payload)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ERR_VALIDATION_FAILED');
      expect(response.body.error.details.email).toBeDefined();
    });

    it('should return conflict error if email already exists', async () => {
      const payload = {
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'SecurePass123'
      };

      // Create first user
      await request(app)
        .post('/api/v1/users')
        .send(payload)
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/v1/users')
        .send(payload)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ERR_CONFLICT');
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('should return user if found', async () => {
      // Create user first
      const createRes = await request(app)
        .post('/api/v1/users')
        .send({
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          password: 'SecurePass123'
        })
        .expect(201);

      const userId = createRes.body.data.id;

      // Fetch user
      const response = await request(app)
        .get(`/api/v1/users/${userId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(userId);
    });

    it('should return 404 if user not found', async () => {
      const response = await request(app)
        .get('/api/v1/users/invalid-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ERR_NOT_FOUND');
    });
  });
});
```

### Test Coverage Requirements

**Minimum coverage targets:**
- **Overall:** 80% line coverage
- **Functions:** 100% of exported functions must have at least one test
- **Edge cases:** All error paths must be tested
- **Business logic:** All branches must be covered

**Jest Configuration (jest.config.js):**

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.spec.ts', '**/*.spec.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/**/*.spec.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
```

---

## 7. Logging

### Structured JSON Logging

**MANDATORY: All logs must be structured JSON with context information.**

**Logger Utility:**

```typescript
// utils/logger.util.ts
export interface LogContext {
  requestId?: string;
  userId?: string;
  operation?: string;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  requestId?: string;
  userId?: string;
  operation?: string;
  [key: string]: any;
}

export class Logger {
  constructor(private module: string) {}

  private formatLog(level: string, message: string, context?: LogContext): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level: level as LogEntry['level'],
      module: this.module,
      message,
      ...context
    };
  }

  info(message: string, context?: LogContext): void {
    console.log(JSON.stringify(this.formatLog('info', message, context)));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(JSON.stringify(this.formatLog('warn', message, context)));
  }

  error(message: string, context?: LogContext): void {
    console.error(JSON.stringify(this.formatLog('error', message, context)));
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.DEBUG) {
      console.debug(JSON.stringify(this.formatLog('debug', message, context)));
    }
  }
}

export function createLogger(module: string): Logger {
  return new Logger(module);
}
```

### Request Logging Middleware

```typescript
// middleware/logging.middleware.ts
export function loggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Generate request ID
  req.id = `req_${generateId()}`;
  
  // Attach logger to request
  req.logger = createLogger(req.path);

  // Log incoming request
  req.logger.info('Incoming request', {
    requestId: req.id,
    method: req.method,
    path: req.path,
    userId: req.user?.id,
    userAgent: req.get('user-agent')
  });

  // Log response after it's sent
  const originalSend = res.send;
  res.send = function(data: any) {
    res.logger?.info('Response sent', {
      requestId: req.id,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      userId: req.user?.id,
      responseTime: `${Date.now() - (req as any).startTime}ms`
    });
    return originalSend.call(this, data);
  };

  (req as any).startTime = Date.now();
  next();
}
```

### Logging Examples

```typescript
// ✅ CORRECT
logger.info('User created successfully', {
  requestId: req.id,
  userId: user.id,
  operation: 'user.create',
  email: user.email
});

logger.error('Database connection failed', {
  requestId: req.id,
  operation: 'db.connect',
  errorCode: error.code,
  retryCount: 3
});

// ❌ WRONG
logger.info('User created');  // Missing context
console.log('User:', user);  // Not structured JSON, has user data
logger.error('Error:', error);  // Not JSON formatted
logger.info(`User ${user.email} created`);  // String interpolation, not structured
```

---

## 8. Code Style

### Function Size & Complexity

**Rule: Functions must be under 30 lines.**

```typescript
// ✅ CORRECT - Focused, single responsibility
async function createUser(payload: CreateUserRequest): Promise<UserResponse> {
  validateUserPayload(payload);
  const hashedPassword = await hashPassword(payload.password);
  const userId = generateUserId();
  
  const user: UserModel = {
    id: userId,
    email: payload.email,
    firstName: payload.firstName,
    lastName: payload.lastName,
    password: hashedPassword,
    role: payload.role,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return store.create('users', userId, user);
}

// ❌ WRONG - Too long, multiple responsibilities
async function createUser(payload: CreateUserRequest): Promise<UserResponse> {
  // Validation, creation, hashing all mixed together...
  // Function exceeds 30 lines
}
```

### Console.log & Debug Statements

**RULE: No `console.log()` in production code.**

```typescript
// ✅ CORRECT - Use logger
logger.info('User created', { userId: user.id, email: user.email });

// ❌ WRONG - Console.log in production code
console.log('User created:', user);

// ⚠️ ACCEPTABLE - Only in local development/debugging
if (process.env.DEBUG) {
  console.log('Debug info:', data);  // Should be removed before commit
}
```

### TODO Comments

**RULE: No TODO comments without ticket numbers.**

```typescript
// ✅ CORRECT - Ticket referenced
// TODO: JIRA-1234 Implement refresh token rotation
// TODO: GITHUB-567 Add rate limiting to password reset endpoint

// ❌ WRONG - No ticket number
// TODO: Fix this later
// TODO: Optimize database queries
```

### Naming Clarity

```typescript
// ✅ CORRECT
const isUserActive = user.active === true;
const hasAdminPermission = user.role === 'admin';
const canDeleteResource = user.role === 'admin' || user.id === resource.ownerId;

// ✅ CORRECT
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_ROLE = 'user';
const PASSWORD_MIN_LENGTH = 8;
```

---

## 9. Documentation

### JSDoc Requirements

**MANDATORY: All exported functions, classes, and interfaces must have JSDoc comments.**

```typescript
/**
 * Creates a new user in the system.
 * 
 * @param payload - The user creation payload
 * @returns Promise resolving to created user (without password)
 * @throws {ValidationError} If payload validation fails
 * @throws {ConflictError} If email already exists
 * @example
 * ```typescript
 * const user = await userService.createUser({
 *   email: 'user@example.com',
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   password: 'SecurePass123'
 * });
 * ```
 */
async function createUser(payload: CreateUserRequest): Promise<UserResponse> {
  // implementation
}

/**
 * Represents a user in the system.
 */
interface UserModel {
  /** Unique user identifier */
  id: string;
  
  /** User's email address (must be unique) */
  email: string;
  
  /** User's role in the system */
  role: 'user' | 'admin';
}
```

---

## 10. Git Workflow

### Conventional Commits

**All commits MUST follow Conventional Commits format.**

**Format:** `<type>(<scope>): <subject>`

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Adding or updating tests
- `chore:` Build process, dependencies, tooling
- `refactor:` Code restructuring without feature changes
- `perf:` Performance improvements

**Examples:**

```bash
# ✅ CORRECT
git commit -m "feat(user): add user creation endpoint"
git commit -m "fix(auth): prevent token reuse in refresh flow"
git commit -m "test(user): add test coverage for edge cases"
git commit -m "docs: update API documentation for v1 endpoints"

# ❌ WRONG
git commit -m "update"
git commit -m "Fixed bugs"
git commit -m "added stuff"
```

### Pre-commit Verification

Before pushing code:

```bash
npm run lint && npm run build && npm test -- --coverage
```

---

## Summary of Critical Rules

| Category | Rule |
|----------|------|
| **Naming** | camelCase for functions/variables, UPPER_SNAKE_CASE for constants, PascalCase for classes |
| **API Response** | All responses use standard envelope: { success, data, error, meta } |
| **Validation** | MUST use schema library for ALL user input |
| **Database** | No raw SQL queries - use query builder only |
| **Testing** | Every function MUST have a unit test, 80%+ coverage required |
| **Logging** | Structured JSON logs with requestId, userId, operation |
| **Functions** | Maximum 30 lines per function |
| **Console** | No console.log() in production code |
| **Documentation** | JSDoc for all exported functions and interfaces |
| **Commits** | Conventional commits (feat:, fix:, docs:, test:, chore:) |

---

**Document Version:** 1.0  
**Last Updated:** 2026-03-09  
**Status:** In Effect

For questions or clarifications, contact the project tech lead.
