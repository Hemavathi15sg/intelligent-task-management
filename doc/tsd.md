# Technical Specification Document
## Intelligent Task Management System

**Document Version:** 1.0  
**Date Created:** March 9, 2026  
**Status:** Approved for Development  
**Classification:** Internal Use - Technical Team

---

## 1. Introduction

### 1.1 Purpose

This Technical Specification Document (TSD) defines the technical architecture, design, implementation approach, and technology choices for the Intelligent Task Management System. This document translates business requirements from the BRD into actionable technical specifications for the development team.

### 1.2 Scope

This document covers:
- System architecture and component design
- Database schema and data model
- REST API interface specifications
- Technology stack recommendations with justifications
- Security architecture addressing OWASP Top 10
- CI/CD pipeline design
- Traceability matrix linking all technical decisions to BRD requirements

### 1.3 Document Organization

- **Sections 2-4:** System design and architecture
- **Sections 5-6:** API and data specifications
- **Sections 7-8:** Technology stack and infrastructure
- **Section 9:** Security architecture
- **Section 10:** CI/CD pipeline
- **Section 11:** Traceability matrix

---

## 2. System Architecture

### 2.1 High-Level Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        WEB["Web Browser<br/>React SPA"]
        MOBILE["Mobile Browser<br/>Responsive UI"]
    end
    
    subgraph "API Gateway & Authentication"
        APIGW["API Gateway<br/>Rate Limiting, Routing"]
        AUTH["Authentication Service<br/>JWT Token Management"]
        OAUTH["OAuth Provider<br/>Integration"]
    end
    
    subgraph "Application Services"
        TASK["Task Service<br/>Task CRUD Operations"]
        DEP["Dependency Service<br/>Circular Check, Status Update"]
        ASSIGN["Assignment Service<br/>Task Assignment Logic"]
        REPORT["Reporting Service<br/>Dashboard, Aggregation"]
        USER["User Service<br/>Active User Management"]
    end
    
    subgraph "Business Logic Layer"
        TASKBIZ["Task Business Logic"]
        DEPBIZ["Dependency Validator"]
        STATUSBIZ["Status State Machine"]
    end
    
    subgraph "Data Persistence"
        DB[(PostgreSQL<br/>Primary Store)]
        CACHE["Redis Cache<br/>Session & Query Cache"]
        AUDIT["Audit Log Store<br/>Immutable Events"]
    end
    
    subgraph "External Services"
        LDAP["LDAP/Directory<br/>User Directory"]
        NOTIFY["Notification Service<br/>Async Events"]
    end
    
    subgraph "Observability & Operations"
        LOG["Centralized Logging<br/>Application Events"]
        MONITOR["Monitoring<br/>Metrics & Alerts"]
        TRACE["Distributed Tracing<br/>Request Flow"]
    end
    
    WEB -->|HTTP/HTTPS| APIGW
    MOBILE -->|HTTP/HTTPS| APIGW
    APIGW --> AUTH
    AUTH --> OAUTH
    APIGW --> TASK
    APIGW --> REPORT
    TASK --> TASKBIZ
    TASKBIZ --> DB
     DEP --> DEPBIZ
    ASSIGN --> TASKBIZ
    TASKBIZ --> CACHE
    TASKBIZ --> AUDIT
    USER --> LDAP
    TASKBIZ --> NOTIFY
    TASK --> LOG
    DEP --> LOG
    ASSIGN --> LOG
    LOG --> MONITOR
    TASK --> TRACE
```

**Traceability:** NFR-001 (Modular Architecture)

### 2.2 Component Responsibilities

| Component | Purpose | Responsibility | Traceability |
|-----------|---------|-----------------|--------------|
| **Web UI (React SPA)** | User interface | Render tasks, forms; collect user input; display dashboards | FR-001 to FR-006, NFR-010 |
| **API Gateway** | Request routing & rate limiting | Route requests; enforce rate limits; API versioning | NFR-004, NFR-005 |
| **Authentication Service** | Security & access control | Token validation; OAuth integration; user identity | NFR-007 |
| **Task Service** | Core task operations | CRUD operations for tasks; task retrieval | FR-001, FR-005 |
| **Dependency Service** | Dependency management | Manage dependencies; detect circular refs; update status | FR-003 |
| **Assignment Service** | Task assignment logic | Assign tasks; validate assignee; manage history | FR-002 |
| **Reporting Service** | Analytics & dashboards | Aggregate task data; generate progress reports | FR-006 |
| **PostgreSQL Database** | Primary data store | Persist all task, user, and relationship data | FR-001 to FR-006 |
| **Redis Cache** | Performance optimization | Cache queries; store sessions; reduce DB load | NFR-004, NFR-005 |
| **Audit Log Store** | Compliance & troubleshooting | Immutable record of all changes; enable forensics | NFR-008 |
| **Notification Service** | Event handling | Send notifications; manage async communications | FR-002, FR-003 |
| **Logging & Monitoring** | Operations | Centralized logs; metrics; alerting; health checks | NFR-006, NFR-009 |

---

## 3. Database Schema

### 3.1 Entity-Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ TASKS : "assigned_to"
    USERS ||--o{ TASK_HISTORY : "modified_by"
    USERS ||--o{ ASSIGNMENTS_HISTORY : "assigned_by"
    USERS ||--o{ ASSIGNMENTS_HISTORY : "recipient_user"
    TASKS ||--o{ TASK_DEPENDENCIES : "blocking_task_id"
    TASKS ||--o{ TASK_DEPENDENCIES : "dependent_task_id"
    TASKS ||--o{ TASK_HISTORY : "contains"
    TASKS ||--o{ AUDIT_LOG : "subject_of"
    ASSIGNMENTS_HISTORY ||--o{ AUDIT_LOG : "subject_of"
    TASK_DEPENDENCIES ||--o{ AUDIT_LOG : "subject_of"

    USERS {
        uuid user_id PK
        string username UK
        string email
        string display_name
        boolean is_active
        string user_source "LDAP|LOCAL"
        timestamp created_at
        timestamp updated_at
    }

    TASKS {
        uuid task_id PK
        string task_number UK "T-001 format"
        uuid project_id FK
        string title
        text description
        enum priority "LOW|MEDIUM|HIGH"
        enum status "TO_DO|IN_PROGRESS|BLOCKED|COMPLETED"
        uuid assigned_to FK
        date estimated_completion
        date actual_completion
        timestamp created_at
        timestamp updated_at
        uuid created_by FK
    }

    TASK_DEPENDENCIES {
        uuid dependency_id PK
        uuid blocking_task_id FK
        uuid dependent_task_id FK
        timestamp created_at
        uuid created_by FK
        timestamp deleted_at "null if active"
    }

    TASK_HISTORY {
        uuid history_id PK
        uuid task_id FK
        enum change_type "CREATED|UPDATED|STATUS_CHANGED"
        json previous_values
        json new_values
        uuid modified_by FK
        timestamp changed_at
    }

    ASSIGNMENTS_HISTORY {
        uuid assignment_id PK
        uuid task_id FK
        uuid assigned_by FK
        uuid recipient_user FK
        uuid previous_assignee FK "null if first assignment"
        timestamp assigned_at
        string reason
    }

    AUDIT_LOG {
        uuid audit_id PK
        enum entity_type "TASK|DEPENDENCY|ASSIGNMENT"
        uuid entity_id FK
        enum action "CREATE|UPDATE|DELETE|ASSIGN|BLOCK|UNBLOCK"
        uuid user_id FK
        json change_details
        string ip_address
        string user_agent
        timestamp timestamp
    }
```

**Traceability:** FR-001 to FR-006 (Task data model), NFR-008 (Audit logging)

### 3.2 Key Design Decisions

**Decision 1: PostgreSQL for Primary Store**
- **Rationale:** Relational model matches task/dependency structure; strong transaction support for task mutations; mature ecosystem
- **Traceability:** NFR-001 (Modular, testable architecture)

**Decision 2: Immutable Audit Log**
- **Rationale:** Separate table ensures audit data cannot be tampered with; supports compliance and forensics
- **Traceability:** NFR-008 (Audit logging requirement)

**Decision 3: Status Field on TASKS Table**
- **Rationale:** Denormalization for performance; enables fast filtering by status; derived from dependency state but cached for speed
- **Traceability:** FR-005 (Filtering requirement), NFR-004 (Performance targets)

**Decision 4: Soft Delete for Dependencies**
- **Rationale:** `deleted_at` field preserves audit trail; enables audit queries; maintains referential integrity
- **Traceability:** NFR-008 (Audit logging)

**Decision 5: Task Number Sequence**
- **Rationale:** Human-readable task identifiers (T-001, T-002) for user-facing references; UUID for internal references
- **Traceability:** FR-001 (Task ID requirement)

### 3.3 Indexing Strategy

```sql
-- Primary performance indexes
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to) WHERE is_deleted = false;
CREATE INDEX idx_tasks_status ON tasks(status) WHERE is_deleted = false;
CREATE INDEX idx_tasks_priority ON tasks(priority) WHERE is_deleted = false;
CREATE INDEX idx_tasks_estimated_completion ON tasks(estimated_completion) WHERE is_deleted = false;
CREATE INDEX idx_tasks_created_at ON tasks(created_at) WHERE is_deleted = false;

-- Dependency queries
CREATE INDEX idx_dependencies_blocking_task ON task_dependencies(blocking_task_id);
CREATE INDEX idx_dependencies_dependent_task ON task_dependencies(dependent_task_id);
CREATE INDEX idx_dependencies_active ON task_dependencies(blocking_task_id, dependent_task_id) WHERE deleted_at IS NULL;

-- Audit & history queries
CREATE INDEX idx_task_history_task_id ON task_history(task_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp DESC);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);

-- Projection indexes for common queries
CREATE INDEX idx_tasks_by_user_status ON tasks(assigned_to, status) WHERE is_deleted = false;
CREATE INDEX idx_tasks_by_project_status ON tasks(project_id, status) WHERE is_deleted = false;
```

**Traceability:** NFR-004 (Performance targets), NFR-005 (Scalability)

---

## 4. REST API Specification

### 4.1 Authentication Endpoints

#### 4.1.1 POST /api/v1/auth/login

**Traceability:** NFR-007 (Authentication requirement)

```json
Request:
{
  "username": "user@company.com",
  "password": "secure_password"
}

Response (200 OK):
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "refresh_token_value",
  "user": {
    "user_id": "uuid",
    "username": "user@company.com",
    "display_name": "John Developer"
  }
}

Error (401 Unauthorized):
{
  "error": "INVALID_CREDENTIALS",
  "message": "Username or password incorrect"
}
```

#### 4.1.2 POST /api/v1/auth/refresh

**Traceability:** NFR-007 (JWT token management)

```json
Request:
{
  "refresh_token": "refresh_token_value"
}

Response (200 OK):
{
  "access_token": "new_access_token",
  "expires_in": 3600
}
```

#### 4.1.3 POST /api/v1/auth/logout

```json
Request:
{
  "refresh_token": "refresh_token_value"
}

Response (204 No Content)
```

### 4.2 User Management Endpoints

#### 4.2.1 GET /api/v1/users (List Active Users)

**Traceability:** FR-002 (Task assignment requires active users), NFR-005 (Performance)

```json
Response (200 OK):
{
  "users": [
    {
      "user_id": "uuid-1",
      "username": "dev1@company.com",
      "display_name": "Developer One",
      "is_active": true
    },
    {
      "user_id": "uuid-2",
      "username": "dev2@company.com",
      "display_name": "Developer Two",
      "is_active": true
    }
  ],
  "total": 2,
  "page": 1,
  "per_page": 100
}

Query Parameters:
- page: int (default: 1)
- per_page: int (default: 100, max: 500)
- filter: string (search by username or display_name)
```

#### 4.2.2 GET /api/v1/users/{user_id}

```json
Response (200 OK):
{
  "user_id": "uuid",
  "username": "dev1@company.com",
  "display_name": "Developer One",
  "email": "dev1@company.com",
  "is_active": true,
  "user_source": "LDAP",
  "created_at": "2026-03-01T10:00:00Z",
  "updated_at": "2026-03-09T15:30:00Z"
}
```

### 4.3 Task Management Endpoints

#### 4.3.1 POST /api/v1/tasks (Create Task)

**Traceability:** FR-001 (Task creation), BR-R-002 (Date validation)

```json
Request:
{
  "title": "Implement Payment API",
  "description": "Develop RESTful API for payment processing",
  "priority": "HIGH",
  "assigned_to": "user-uuid-2",
  "estimated_completion": "2026-03-20",
  "depends_on": ["task-uuid-1"]
}

Response (201 Created):
{
  "task_id": "task-uuid-3",
  "task_number": "T-103",
  "title": "Implement Payment API",
  "description": "Develop RESTful API for payment processing",
  "priority": "HIGH",
  "status": "TO_DO",
  "assigned_to": "user-uuid-2",
  "estimated_completion": "2026-03-20",
  "actual_completion": null,
  "created_at": "2026-03-09T16:00:00Z",
  "dependencies": ["task-uuid-1"]
}

Validation:
- title: required, max 255 characters
- description: required, max 2000 characters
- priority: required, enum [LOW, MEDIUM, HIGH]
- assigned_to: required, must be active user
- estimated_completion: required, must be future date
- depends_on: optional array of task IDs (circular dependency check performed)

Error (400 Bad Request):
{
  "error": "ESTIMATED_DATE_INVALID",
  "message": "Estimated completion date must be in future"
}

Error (409 Conflict):
{
  "error": "CIRCULAR_DEPENDENCY",
  "message": "Adding this dependency creates circular reference"
}
```

#### 4.3.2 GET /api/v1/tasks

**Traceability:** FR-005 (Task filtering and retrieval), NFR-004 (Performance <500ms)

```json
Response (200 OK):
{
  "tasks": [
    {
      "task_id": "task-uuid-1",
      "task_number": "T-101",
      "title": "Complete Integration Testing",
      "priority": "HIGH",
      "status": "COMPLETED",
      "assigned_to": "user-uuid-1",
      "estimated_completion": "2026-03-10",
      "actual_completion": "2026-03-08",
      "depends_on": [],
      "blocking_tasks": ["task-uuid-3"]
    }
  ],
  "total": 342,
  "page": 1,
  "per_page": 50,
  "time_ms": 245
}

Query Parameters (all optional, AND logic):
- status: string (TO_DO|IN_PROGRESS|BLOCKED|COMPLETED, comma-separated for multiple)
- priority: string (LOW|MEDIUM|HIGH, comma-separated)
- assigned_to: string (user UUID)
- due_before: date (YYYY-MM-DD)
- due_after: date (YYYY-MM-DD)
- search: string (searches title and description)
- sort_by: string (default: estimated_completion)
- sort_order: string (ASC|DESC, default: ASC)
- page: int (default: 1)
- per_page: int (default: 50, max: 500)
```

#### 4.3.3 GET /api/v1/tasks/{task_id}

```json
Response (200 OK):
{
  "task_id": "task-uuid-1",
  "task_number": "T-101",
  "title": "Complete Integration Testing",
  "description": "Full integration test suite for payment module",
  "priority": "HIGH",
  "status": "COMPLETED",
  "assigned_to": "user-uuid-1",
  "estimated_completion": "2026-03-10",
  "actual_completion": "2026-03-08",
  "created_at": "2026-03-01T10:00:00Z",
  "updated_at": "2026-03-08T14:30:00Z",
  "dependencies": {
    "blocking": [],
    "blocked_by": ["task-uuid-3"]
  },
  "history": [
    {
      "change_type": "CREATED",
      "changed_at": "2026-03-01T10:00:00Z",
      "modified_by": "user-uuid-1"
    },
    {
      "change_type": "STATUS_CHANGED",
      "previous_values": {"status": "IN_PROGRESS"},
      "new_values": {"status": "COMPLETED"},
      "changed_at": "2026-03-08T14:30:00Z",
      "modified_by": "user-uuid-1"
    }
  ]
}
```

#### 4.3.4 PATCH /api/v1/tasks/{task_id}

**Traceability:** FR-001 (Update task), FR-004 (Status tracking), BR-R-006 (Dependency validation)

```json
Request:
{
  "title": "Complete Integration Testing (Updated)",
  "priority": "MEDIUM",
  "status": "IN_PROGRESS"
}

Response (200 OK):
{
  "task_id": "task-uuid-1",
  "task_number": "T-101",
  "title": "Complete Integration Testing (Updated)",
  "priority": "MEDIUM",
  "status": "IN_PROGRESS",
  "updated_at": "2026-03-09T16:15:00Z"
}

Validation Rules:
- Task ID is immutable (BR-R-003)
- Cannot modify completed tasks' core attributes
- Status transitions follow state machine (FR-004)
- Cannot mark COMPLETED if unresolved dependencies exist (BR-R-006)
- Cannot manually remove BLOCKED status (must resolve dependencies) (BR-R-008)

Error (400 Bad Request):
{
  "error": "INVALID_STATUS_TRANSITION",
  "message": "Cannot change status from COMPLETED to IN_PROGRESS"
}

Error (409 Conflict):
{
  "error": "UNRESOLVED_DEPENDENCIES",
  "message": "Task has 2 unresolved dependencies. Cannot mark as Completed"
}
```

#### 4.3.5 GET /api/v1/tasks/{task_id}/history

**Traceability:** FR-004 (Status history), NFR-008 (Audit logging)

```json
Response (200 OK):
{
  "history": [
    {
      "history_id": "hist-uuid-1",
      "change_type": "CREATED",
      "previous_values": null,
      "new_values": {
        "title": "Complete Integration Testing",
        "priority": "HIGH",
        "status": "TO_DO"
      },
      "modified_by": {
        "user_id": "user-uuid-1",
        "username": "dev1@company.com"
      },
      "changed_at": "2026-03-01T10:00:00Z"
    },
    {
      "history_id": "hist-uuid-2",
      "change_type": "STATUS_CHANGED",
      "previous_values": {"status": "TO_DO"},
      "new_values": {"status": "IN_PROGRESS"},
      "modified_by": {
        "user_id": "user-uuid-1",
        "username": "dev1@company.com"
      },
      "changed_at": "2026-03-01T11:00:00Z"
    }
  ]
}
```

### 4.4 Task Assignment Endpoints

#### 4.4.1 POST /api/v1/tasks/{task_id}/assign

**Traceability:** FR-002 (Task assignment), BR-R-009 (Notifications), NFR-008 (Audit logging)

```json
Request:
{
  "assigned_to": "user-uuid-2",
  "reason": "Reassigned based on availability"
}

Response (200 OK):
{
  "task_id": "task-uuid-1",
  "assigned_to": "user-uuid-2",
  "previous_assignee": "user-uuid-1",
  "assigned_at": "2026-03-09T16:20:00Z",
  "assigned_by": "user-uuid-3"
}

Notifications Triggered:
- Notification to new assignee (user-uuid-2): "Task T-101 assigned to you"
- Notification to previous assignee (user-uuid-1): "Task T-101 reassigned from you to Developer Two"
```

#### 4.4.2 GET /api/v1/tasks/{task_id}/assignment-history

**Traceability:** FR-002 (Assignment history), NFR-008 (Audit trail)

```json
Response (200 OK):
{
  "assignments": [
    {
      "assignment_id": "assign-uuid-1",
      "task_number": "T-101",
      "assigned_to": {
        "user_id": "user-uuid-1",
        "username": "dev1@company.com",
        "display_name": "Developer One"
      },
      "assigned_by": {
        "user_id": "user-uuid-3",
        "username": "pm@company.com",
        "display_name": "Project Manager"
      },
      "previous_assignee": null,
      "assigned_at": "2026-03-01T10:00:00Z",
      "reason": "Initial assignment"
    },
    {
      "assignment_id": "assign-uuid-2",
      "task_number": "T-101",
      "assigned_to": {
        "user_id": "user-uuid-2",
        "username": "dev2@company.com",
        "display_name": "Developer Two"
      },
      "assigned_by": {
        "user_id": "user-uuid-3",
        "username": "pm@company.com"
      },
      "previous_assignee": {
        "user_id": "user-uuid-1",
        "username": "dev1@company.com"
      },
      "assigned_at": "2026-03-09T16:20:00Z",
      "reason": "Reassigned based on availability"
    }
  ]
}
```

### 4.5 Task Dependency Endpoints

#### 4.5.1 POST /api/v1/tasks/{task_id}/dependencies

**Traceability:** FR-003 (Dependency management), BR-R-004 (Unidirectional), BR-R-005 (Circular check)

```json
Request:
{
  "blocking_task_id": "task-uuid-1"
}

Response (201 Created):
{
  "dependency_id": "dep-uuid-1",
  "blocking_task": {
    "task_id": "task-uuid-1",
    "task_number": "T-101",
    "title": "Complete Integration Testing"
  },
  "dependent_task": {
    "task_id": "task-uuid-3",
    "task_number": "T-103",
    "title": "Implement Payment API"
  },
  "created_at": "2026-03-09T16:30:00Z",
  "status": "ACTIVE"
}

Validation:
- Cannot create circular dependencies (BR-R-005)
- Cannot create duplicate dependencies
- blocking_task_id must exist and be different from task_id
- On creation, dependent task status re-evaluated (may change to BLOCKED)

Error (409 Conflict):
{
  "error": "CIRCULAR_DEPENDENCY_DETECTED",
  "message": "Creating this dependency would create circular reference: T-103 > T-101 > T-103"
}
```

#### 4.5.2 GET /api/v1/tasks/{task_id}/dependencies

```json
Response (200 OK):
{
  "task_id": "task-uuid-3",
  "task_number": "T-103",
  "blocking_on": [
    {
      "dependency_id": "dep-uuid-1",
      "blocking_task_id": "task-uuid-1",
      "task_number": "T-101",
      "title": "Complete Integration Testing",
      "status": "COMPLETED"
    },
    {
      "dependency_id": "dep-uuid-2",
      "blocking_task_id": "task-uuid-2",
      "task_number": "T-102",
      "title": "Complete Security Review",
      "status": "IN_PROGRESS"
    }
  ],
  "blocked_by": [],
  "current_status": "BLOCKED"
}
```

#### 4.5.3 DELETE /api/v1/tasks/{task_id}/dependencies/{dependency_id}

**Traceability:** FR-003 (Remove dependencies), BR-R-007 (Status re-evaluation)

```json
Response (200 OK):
{
  "dependency_id": "dep-uuid-1",
  "removed_at": "2026-03-09T16:35:00Z",
  "task_status_updated": true,
  "new_status": "TO_DO"
}
```

### 4.6 Reporting Endpoints

#### 4.6.1 GET /api/v1/reports/project-progress

**Traceability:** FR-006 (Project progress dashboard), NFR-004 (Performance <1 second)

```json
Response (200 OK):
{
  "project_id": "proj-uuid-1",
  "project_name": "Payment Module",
  "generated_at": "2026-03-09T16:40:00Z",
  "summary": {
    "total_tasks": 20,
    "completed_tasks": 8,
    "completed_percentage": 40,
    "in_progress": 6,
    "in_progress_percentage": 30,
    "blocked_tasks": 2,
    "blocked_percentage": 10,
    "pending_tasks": 4,
    "pending_percentage": 20
  },
  "blocked_tasks": [
    {
      "task_id": "task-uuid-3",
      "task_number": "T-103",
      "title": "Implement Payment API",
      "priority": "HIGH",
      "blocking_reasons": [
        {
          "blocking_task_number": "T-102",
          "blocking_task_title": "Complete Security Review",
          "blocking_status": "IN_PROGRESS"
        }
      ]
    }
  ],
  "overdue_high_priority": [
    {
      "task_id": "task-uuid-5",
      "task_number": "T-105",
      "title": "Database Schema Migration",
      "priority": "HIGH",
      "estimated_completion": "2026-03-05",
      "days_overdue": 4
    }
  ],
  "workload_distribution": [
    {
      "user_id": "user-uuid-1",
      "username": "dev1@company.com",
      "display_name": "Developer One",
      "assigned_tasks": 5,
      "completed": 3,
      "in_progress": 2,
      "blocked": 0
    },
    {
      "user_id": "user-uuid-2",
      "username": "dev2@company.com",
      "display_name": "Developer Two",
      "assigned_tasks": 4,
      "completed": 2,
      "in_progress": 2,
      "blocked": 1
    }
  ]
}

Query Parameters:
- time_range: string (TODAY|THIS_WEEK|THIS_MONTH, default: THIS_WEEK)
- cache_max_age: int (seconds, default: 30)
```

#### 4.6.2 GET /api/v1/reports/task-dependency-graph

**Traceability:** FR-006 (Dependency visualization)

```json
Response (200 OK):
{
  "project_id": "proj-uuid-1",
  "nodes": [
    {
      "task_id": "task-uuid-1",
      "task_number": "T-101",
      "title": "Complete Integration Testing",
      "status": "COMPLETED",
      "priority": "HIGH"
    },
    {
      "task_id": "task-uuid-3",
      "task_number": "T-103",
      "title": "Implement Payment API",
      "status": "BLOCKED",
      "priority": "HIGH"
    }
  ],
  "edges": [
    {
      "from": "task-uuid-1",
      "to": "task-uuid-3",
      "dependency_id": "dep-uuid-1",
      "status": "BLOCKING"
    }
  ]
}
```

### 4.7 API Response Codes

| Code | Meaning | Usage |
|------|---------|-------|
| **200** | OK | Successful GET, PATCH, DELETE |
| **201** | Created | Successful POST creating new resource |
| **204** | No Content | Successful DELETE with no response body |
| **400** | Bad Request | Invalid input, validation failure |
| **401** | Unauthorized | Missing/invalid authentication |
| **403** | Forbidden | Authenticated but lacks permission |
| **404** | Not Found | Resource does not exist |
| **409** | Conflict | Business logic violation (circular dependency, invalid status transition) |
| **429** | Too Many Requests | Rate limit exceeded |
| **500** | Internal Server Error | Unexpected server error |
| **503** | Service Unavailable | Server maintenance or overloaded |

### 4.8 API Documentation

**Traceability:** NFR-003 (API documentation requirement)

- **Format:** OpenAPI 3.0.1 / Swagger
- **Location:** `/api/docs` (interactive Swagger UI)
- **JSON Schema:** `/api/openapi.json`
- **Validation:** Automated tests verify schema matches implementation
- **Update Process:** Auto-generated from code annotations; docs regenerated on deployment

---

## 5. Technology Stack

### 5.1 Recommended Technology Stack

| Layer | Technology | Version | Justification | Traceability |
|-------|-----------|---------|--------------|--------------|
| **Frontend** | React | 18.2+ | Modern SPA framework; large ecosystem; strong TypeScript support | NFR-010 (Usability), BO-004 (Easy to learn) |
| **Frontend State** | Redux Toolkit | 1.9+ | Predictable state management; middleware support; DevTools | NFR-001 (Modular architecture) |
| **Frontend UI** | Material-UI v5 | 5.12+ | Pre-built accessible components; WCAG 2.1 AA compliance | NFR-010 (Accessibility) |
| **API Client** | Axios | 1.4+ | Promise-based HTTP client; request/response interceptors | NFR-007 (Security - interceptors for auth) |
| **Runtime** | Node.js | 18 LTS | Lightweight; event-driven; npm ecosystem | BO-004 (Lightweight solution) |
| **Backend Framework** | Express.js | 4.18+ | Minimal, unopinionated HTTP server; large middleware ecosystem | NFR-001 (Modularity - easy to organize middleware) |
| **API Validation** | Express Validator | 7.0+ | Middleware for input validation; chainable API | NFR-007 (Input validation for security) |
| **Database** | PostgreSQL | 14+ | ACID compliance; strong relational support; JSON types; performance | FR-001 to FR-006 (Relational data model), NFR-005 (Scalability) |
| **ORM** | Typeorm | 0.3+ | Type-safe queries; migration management; lazy loading support | NFR-001 (Modular architecture), NFR-002 (Testability) |
| **Connection Pool** | pgBouncer | 1.16+ | Lightweight connection pooling; statement multiplexing | NFR-005 (Scalability - handle 50+ concurrent users) |
| **Caching** | Redis | 7.0+ | In-memory data store; fast session management; cache invalidation | NFR-004, NFR-005 (Performance optimization) |
| **Message Queue** | Bull (Redis-backed) | 4.10+ | Reliable job queue for async notifications; built on Redis | FR-002 (Assignment notifications) |
| **Authentication** | JSON Web Tokens (JWT) | Standard | Stateless authentication; suitable for microservices; OAuth-compatible | NFR-007 (Secure authentication) |
| **OAuth Provider** | Passport.js | 0.6+ | Flexible authentication middleware; strategy pattern for multiple providers | DEP-001 (Directory integration) |
| **Logging** | Winston | 3.8+ | Structured logging; multiple transports; log levels | NFR-006, NFR-008 (Observability) |
| **Error Tracking** | Sentry | Latest | Real-time error reporting; release tracking; performance monitoring | NFR-006 (Reliability) |
| **Testing Framework** | Jest | 29+ | Zero-config testing; excellent coverage reporting; fast | NFR-002 (Unit test coverage) |
| **Mocking** | Sinon.js | 15+ | Spy, stub, mock utilities; works with Jest | NFR-002 (Testing requirement) |
| **API Testing** | Supertest | 6.3+ | HTTP assertions; agent-based; works with Express | NFR-003 (API documentation validation) |
| **Code Quality** | ESLint | 8.0+ | Pluggable linting; consistent code style | NFR-001 (Code quality) |
| **Code Format** | Prettier | 2.8+ | Opinionated code formatter; pre-commit integration | NFR-001 (Code quality) |
| **Type Checking** | TypeScript | 5.0+ | Static type checking; better IDE support; refactoring safety | NFR-001 (Modular, maintainable code) |
| **Build Tool** | Webpack 5 | 5.88+ | Module bundling; code splitting; asset optimization | NFR-005 (Scalability - optimized bundles) |
| **CI/CD** | GitHub Actions | Native | Git-integrated; free for public repos; secrets management | NFR-009 (CI/CD automation) |
| **Container** | Docker | Latest | Reproducible environments; easy deployment; Azure Container support | BO-004 (Easy deployment) |
| **Orchestration** | Azure Container Instances (Phase 1) / AKS (Phase 2) | Latest | Serverless containers or managed Kubernetes; Azure-native | BO-004 (Cloud-ready deployment) |

### 5.2 Azure Deployment Architecture

**Traceability:** BO-005 (Integration with existing workflows), NFR-006 (Reliability)

```
Azure Deployment Stack:
┌─────────────────────────────────────────────────────┐
│ Azure Front Door (Global CDN, DDoS Protection)      │
└────────────────────┬────────────────────────────────┘
                     │
┌─────────────────────────────────────────────────────┐
│ Azure App Service (Node.js Express Backend)         │
│ - Auto-scaling based on CPU/Memory                  │
│ - Built-in security (SSL/TLS 1.2+)                 │
│ - Health check endpoints                            │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
   ┌────────┐  ┌─────────┐  ┌──────────┐
   │ Azure  │  │ Azure   │  │ Azure    │
   │Database│  │ Cache   │  │ Blob     │
   │for     │  │for      │  │ Storage  │
   │Postgres│  │Redis    │  │(Logs)    │
   │(Primary)  │         │  │          │
   └────────┘  └─────────┘  └──────────┘
        │            │            │
        ▼            ▼            ▼
   Point-in-Time   Auto-purge   Archival
   Backup          Strategies   (12mo)
```

**Configuration:**
- **App Service Plan:** Premium tier for production reliability (NFR-006: 99.5% uptime)
- **Database:** Azure Database for PostgreSQL Flexible Server with georedundant backups (NFR-006: RTO <1 hour, RPO <15 min)
- **Cache:** Azure Cache for Redis with cluster mode enabled (NFR-004: Response time <500ms)
- **Storage:** Blob Storage for audit logs with immutable retention (NFR-008: Audit log integrity)
- **CDN:** Front Door for global distribution and origin protection (NFR-004: Performance optimization)

**Justification:** Azure-native services provide:
- Seamless integration with organization's Azure subscriptions (BO-005)
- Managed services reduce operational burden (BO-004: Lightweight)
- Built-in security, compliance, and monitoring (NFR-007, NFR-006)
- Automatic scaling without manual DevOps (NFR-005)

### 5.3 Development Environment

| Tool | Purpose |
|------|---------|
| Docker Compose | Local PostgreSQL, Redis, mock LDAP for development |
| Node Version Manager (nvm) | Node.js version consistency |
| dotenv | Environment variable management |
| Husky | Pre-commit hooks for code quality checks |
| npm workspaces | Monorepo structure (frontend, backend, shared) |

---

## 6. Security Architecture

### 6.1 OWASP Top 10 Mitigation Strategies

**Traceability:** NFR-007 (Data security and encryption), NFR-008 (Audit logging)

#### A01:2021 - Broken Access Control

**Mitigation:**
- Role-based access control (RBAC) middleware on all endpoints
- JWT token validation on every request
- Token expiration (1 hour access token, 7 day refresh token)
- User directory lookup for active status validation (BR-R-010)

**Implementation:**
```typescript
// Express middleware example
app.use(authenticate());  // Verify JWT
app.use(authorize('DEVELOPER'));  // Check role
```

**Traceability:** FR-002 (Only active users receive assignments), NFR-007

---

#### A02:2021 - Cryptographic Failures

**Mitigation:**
- All data in transit: TLS 1.2+ (enforced by Azure Front Door)
- All data at rest: AES-256 encryption
  - Database: Transparent Data Encryption (TDE) in Azure PostgreSQL
  - Passwords: bcrypt with salt rounds ≥ 12
  - Secrets: Azure Key Vault
- No sensitive data in logs (mask user emails, tokens)

**Implementation:**
```typescript
import bcrypt from 'bcrypt';
const hashedPassword = await bcrypt.hash(password, 12);

// Audit log redaction
const sanitizeLogData = (data) => {
  return {
    ...data,
    password: '***REDACTED***',
    email: data.email.split('@')[0] + '@***'
  };
};
```

**Traceability:** NFR-007 (Encryption required), NFR-008 (Audit logging without sensitive data)

---

#### A03:2021 - Injection

**Mitigation:**
- Parameterized queries (TypeORM with bound parameters)
- Input validation on all endpoints (Express Validator)
- WhiteList of allowed values for enums (priority, status)
- SQL injection prevention via ORM (never string concatenation)

**Implementation:**
```typescript
// Safe query with parameterized values
const tasks = await taskRepository.find({
  where: { status: In(['TO_DO', 'IN_PROGRESS']) }
});

// Input validation
const { body, validationResult } = require('express-validator');
router.post('/tasks',
  body('title').isString().trim().isLength({ max: 255 }),
  body('priority').isIn(['LOW', 'MEDIUM', 'HIGH']),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors });
  }
);
```

**Traceability:** NFR-007 (Security implementation)

---

#### A04:2021 - Insecure Design

**Mitigation:**
- Security requirements built into design (this TSD)
- Threat modeling for critical flows (dependency resolution)
- Secure defaults (deny-by-default authorization)
- Rate limiting on all public endpoints
- State machine validation (prevents invalid task status transitions)

**Implementation:**
```typescript
// Rate limiting middleware
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,  // Max 100 requests per IP
  message: 'Too many requests, please try again later'
});

app.use('/api/', limiter);
```

**Traceability:** BR-R-007 (State machine ensures data integrity), NFR-007

---

#### A05:2021 - Security Misconfiguration

**Mitigation:**
- Infrastructure as Code (Bicep templates for Azure)
- Centralized configuration via Azure Key Vault
- Security scanning in CI/CD (SAST: SonarQube, SCA: Snyk)
- Disable debug endpoints in production
- Security headers on all responses (helmet.js)

**Implementation:**
```typescript
import helmet from 'helmet';
app.use(helmet());  // Sets security headers

// Environment-based configuration
const isProduction = process.env.NODE_ENV === 'production';
app.set('trust proxy', isProduction);  // Behind reverse proxy
app.disable('x-powered-by');  // Hide server version
```

**Traceability:** NFR-006 (Reliable security posture), NFR-009 (CI/CD includes security scanning)

---

#### A06:2021 - Vulnerable and Outdated Components

**Mitigation:**
- Automated dependency scanning (npm audit, Snyk)
- Regular dependency updates (monthly cadence)
- Software Composition Analysis (SCA) in CI/CD
- Security advisories monitoring
- Lock dependency versions in package-lock.json

**Implementation:**
```yaml
# GitHub Actions workflow
- name: Run security audit
  run: npm audit --audit-level=moderate

- name: Update dependencies
  run: npm update
```

**Traceability:** NFR-009 (CI/CD security scanning), R-005 (External dependency risks)

---

#### A07:2021 - Identification and Authentication Failures

**Mitigation:**
- Multi-factor authentication (MFA) support via OAuth provider
- Session timeout (30 minutes inactivity)
- Failed login attempt limits (5 attempts then 15-minute lockout)
- Password policy enforcement (min 12 characters, complexity rules)
- OAuth 2.0 for third-party directory integration (LDAP)

**Implementation:**
```typescript
// Failed login tracking
const maxLoginAttempts = 5;
const lockoutMinutes = 15;

const loginAttempts = new Map();

app.post('/auth/login', async (req, res) => {
  const { username } = req.body;
  const attempts = loginAttempts.get(username) || { count: 0, lockedUntil: null };
  
  if (attempts.lockedUntil > Date.now()) {
    return res.status(429).json({ error: 'Account temporarily locked' });
  }
  
  // ... verify credentials
  if (validCredentials) {
    loginAttempts.delete(username);
  } else {
    attempts.count++;
    if (attempts.count >= maxLoginAttempts) {
      attempts.lockedUntil = Date.now() + lockoutMinutes * 60 * 1000;
    }
    loginAttempts.set(username, attempts);
  }
});
```

**Traceability:** NFR-007 (Authentication security), DEP-001 (Directory integration)

---

#### A08:2021 - Software and Data Integrity Failures

**Mitigation:**
- Code review required before merge (GitHub branch protection)
- Supply chain security (signed commits)
- Deployment verification (smoke tests post-deployment)
- Immutable infrastructure (container images tagged with hash)
- Audit logging of all deployments (NFR-008)

**Implementation:**
```yaml
# CI/CD verification
- name: Verify deployment
  run: |
    ./smoke-tests.sh
    echo "Deployment verification passed"

- name: Log deployment
  run: |
    curl -X POST https://auditlog.company.com/deployments \
      -H "Authorization: Bearer $AUDIT_LOG_TOKEN" \
      -d '{"deployment_id":"'"$GITHUB_RUN_ID"'", "status":"success"}'
```

**Traceability:** NFR-009 (CI/CD automation), NFR-008 (Audit logging)

---

#### A09:2021 - Logging and Monitoring Failures

**Mitigation:**
- Centralized logging (Winston → Azure Log Analytics)
- Security events logged (login attempts, authorization failures, dependency changes)
- Real-time alerting for critical events (5 consecutive failed logins)
- Audit trail immutability (database table with delete protection)
- Log retention policy: 12 months minimum (NFR-008)

**Implementation:**
```typescript
// Structured logging
const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new AzureLogAnalyticsTransport({
      workspaceId: process.env.LOG_WORKSPACE_ID,
      sharedKey: process.env.LOG_SHARED_KEY
    })
  ]
});

// Security event logging
logger.warn('UNAUTHORIZED_ACCESS_ATTEMPT', {
  user_id: req.user?.id,
  endpoint: req.path,
  ip_address: req.ip,
  timestamp: new Date().toISOString()
});
```

**Traceability:** NFR-008 (Audit logging), NFR-006 (Monitoring and alerting)

---

#### A10:2021 - Server-Side Request Forgery (SSRF)

**Mitigation:**
- No user input directly used in HTTP requests
- Whitelist of allowed external endpoints (LDAP server, OAuth provider)
- URL validation to prevent internal network access (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
- DNS rebinding protection via request library configuration

**Implementation:**
```typescript
import axios, { AxiosRequestConfig } from 'axios';

const safeAxios = axios.create({
  timeout: 5000,
  httpAgent: new http.Agent({ lookup: safeLookup }),
  httpsAgent: new https.Agent({ lookup: safeLookup })
});

// Whitelist of allowed hosts
const ALLOWED_HOSTS = [process.env.LDAP_SERVER, process.env.OAUTH_PROVIDER];

function isAllowedHost(url: string): boolean {
  const parsedUrl = new URL(url);
  return ALLOWED_HOSTS.some(host => host === parsedUrl.hostname);
}
```

**Traceability:** NFR-007 (Security implementation)

### 6.2 Data Classification and Protection

| Classification | Examples | Protection | Retention |
|----------------|----------|-----------|-----------|
| **Public** | Task titles, status, project name | No encryption | N/A |
| **Internal** | User emails, workload distribution | TLS in transit | 12 months |
| **Sensitive** | Passwords, Auth tokens, API keys | AES-256 at rest + TLS | 7 days (tokens) |
| **Audit** | All mutations, assignment changes | Immutable storage; encrypted | 12 months |

**Traceability:** NFR-007 (Data security), NFR-008 (Audit logging)

### 6.3 Security Testing Strategy

| Test Type | Tool | Frequency | Traceability |
|-----------|------|-----------|--------------|
| **SAST** (Static Analysis) | SonarQube | Every commit | NFR-009 (CI/CD) |
| **DAST** (Dynamic Analysis) | OWASP ZAP | Weekly + pre-release | NFR-007 |
| **SCA** (Dependency Scan) | Snyk | Every commit | R-005 (Dependency vulnerabilities) |
| **Penetration Testing** | External contractor | Quarterly | NFR-007 |
| **Compliance Scan** | Trivy container | Every deployment | NFR-009 (CI/CD) |

---

## 7. CI/CD Pipeline Architecture

### 7.1 Pipeline Overview

**Traceability:** NFR-009 (CI/CD automation), IS-011 (CI/CD requirement)

```mermaid
graph LR
    A["Developer<br/>Push Code"] --> B["GitHub<br/>Webhook"]
    B --> C["GitHub<br/>Actions Trigger"]
    C --> D["Build Job<br/>npm install<br/>TypeScript Compile"]
    D --> E{"Build<br/>Success?"}
    E -->|No| Z["Notify Dev<br/>Build Failed"]
    E -->|Yes| F["Test Job<br/>Jest<br/>Unit Tests"]
    F --> G{"Tests<br/>Pass?"}
    G -->|No| Z
    G -->|Yes| H["SAST Scan<br/>SonarQube"]
    H --> I{"Code Quality<br/>Pass?"}
    I -->|No| Z
    I -->|Yes| J["SCA Scan<br/>Snyk"]
    J --> K{"Dependencies<br/>Safe?"}
    K -->|No| Z
    K -->|Yes| L["Build Container<br/>Docker"]
    L --> M["Push to<br/>Azure Container<br/>Registry"]
    M --> N["Deploy to<br/>Staging"]
    N --> O["Smoke Tests<br/>Health Check"]
    O --> P{"Staging<br/>OK?"}
    P -->|No| Z
    P -->|Yes| Q["Manual<br/>Approval<br/>Production?"]
    Q -->|Approved| R["Deploy to<br/>Production"]
    Q -->|Rejected| S["Stop"]
    R --> T["Verify<br/>Production"]
    T --> U{"Production<br/>OK?"}
    U -->|No| V["Rollback"]
    U -->|Yes| W["Success"]
```

### 7.2 Pipeline Stages

#### Stage 1: Build (Target: <5 minutes)

```yaml
name: Build

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Compile TypeScript
        run: npm run build
      
      - name: Check build output
        run: test -f dist/index.js
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-output
          path: dist/
```

**Traceability:** NFR-009 (Build automation), NFR-001 (Modular, compilable architecture)

#### Stage 2: Unit Tests (Target: <5 minutes)

```yaml
name: Unit Tests

on-parent-success: build

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18.x
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test -- --coverage
        env:
          DATABASE_URL: postgresql://postgres:test@localhost/test
      
      - name: Verify coverage
        run: |
          npm test -- --coverage --collectCoverageFrom='src/**/*.ts'
          # Fail if coverage < 80%
          COVERAGE=$(npm test -- --coverage 2>&1 | grep 'Lines' | awk '{print $3}' | sed 's/%//')
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "Coverage $COVERAGE% is below 80% threshold"
            exit 1
          fi
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
      
      - name: Report test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: coverage/
```

**Traceability:** NFR-002 (Unit test coverage 80% minimum)

#### Stage 3: Code Quality Scan (Target: <10 minutes)

```yaml
name: Code Quality

on-parent-success: test

jobs:
  quality:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18.x
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: SAST Scan (SonarQube)
        uses: SonarSource/sonarqube-scan-action@master
        env:
          SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
          SONAR_LOGIN: ${{ secrets.SONAR_TOKEN }}
      
      - name: SCA Scan (Snyk)
        uses: snyk/actions/node@master
        with:
          args: --severity-threshold=high
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      
      - name: Dependency audit
        run: npm audit --audit-level=high || exit 1
      
      - name: Lint
        run: npm run lint -- --format json --output-file lint-results.json || true
      
      - name: Report quality
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: quality-results
          path: lint-results.json
```

**Traceability:** NFR-009 (Security scanning in pipeline), R-005 (Dependency vulnerabilities)

#### Stage 4: Build Container & Push Registry (Target: <5 minutes)

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY src ./src
COPY tsconfig.json ./
RUN npm run build

FROM node:18-alpine
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
USER nodejs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => { if (r.statusCode !== 200) throw new Error(r.statusCode) })"
CMD [ "node", "dist/index.js" ]
```

```yaml
name: Container Build & Push

on-parent-success: quality

jobs:
  container:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to ACR
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ secrets.ACR_USERNAME }}
          password: ${{ secrets.ACR_PASSWORD }}
      
      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: |
            ${{ env.REGISTRY }}/itms:${{ github.sha }}
            ${{ env.REGISTRY }}/itms:latest
          cache-from: type=registry,ref=${{ env.REGISTRY }}/itms:buildcache
      
      - name: Scan container
        run: |
          docker pull ${{ env.REGISTRY }}/itms:${{ github.sha }}
          docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
            aquasec/trivy image --severity HIGH,CRITICAL \
            ${{ env.REGISTRY }}/itms:${{ github.sha }}
```

**Traceability:** NFR-009 (Automated deployment), NFR-006 (Container security scanning)

#### Stage 5: Deploy to Staging (Target: <10 minutes)

```yaml
name: Deploy to Staging

on-parent-success: container

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      
      - name: Deploy to App Service
        uses: azure/webapps-deploy@v2
        with:
          app-name: itms-staging
          images: ${{ env.REGISTRY }}/itms:${{ github.sha }}
      
      - name: Smoke tests
        run: |
          max_attempts=10
          attempt=1
          while [ $attempt -le $max_attempts ]; do
            STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
              https://itms-staging.azurewebsites.net/health)
            if [ "$STATUS" = "200" ]; then
              echo "Health check passed"
              break
            fi
            echo "Attempt $attempt: Status $STATUS"
            sleep 10
            attempt=$((attempt + 1))
          done
          
          if [ "$STATUS" != "200" ]; then
            echo "Staging deployment failed health check"
            exit 1
          fi
      
      - name: Run integration tests
        run: |
          npm run test:integration -- \
            --baseUrl https://itms-staging.azurewebsites.net
        env:
          TEST_API_KEY: ${{ secrets.STAGING_TEST_KEY }}
      
      - name: Log deployment
        run: |
          az monitor metrics list --resource itms-staging \
            --metric-names HttpResponseTime | head -20
```

**Traceability:** NFR-009 (Automated staging deployment)

#### Stage 6: Manual Approval & Production Deployment (On-Demand)

```yaml
name: Deploy to Production

on:
  workflow_dispatch:  # Manual trigger required

jobs:
  deploy-production:
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://itms.company.com
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      
      - name: Create backup slot
        run: |
          az webapp deployment slot create \
            --resource-group itms-rg \
            --name itms-prod \
            --slot before-deploy-${{ github.run_number }}
      
      - name: Deploy to production slot
        uses: azure/webapps-deploy@v2
        with:
          app-name: itms-prod
          slot-name: staging-slot
          images: ${{ env.REGISTRY }}/itms:${{ github.sha }}
      
      - name: Verify production
        run: |
          ./scripts/production-smoke-tests.sh \
            https://itms-prod-staging.azurewebsites.net
      
      - name: Swap slots
        run: |
          az webapp deployment slot swap \
            --resource-group itms-rg \
            --name itms-prod \
            --slot staging-slot
      
      - name: Monitor post-deployment
        run: |
          sleep 60
          ERROR_RATE=$(az monitor metrics list \
            --resource itms-prod \
            --metric-names "Http5xx" \
            --start-time now-5m | grep -o '[0-9]\+')
          if [ "$ERROR_RATE" -gt 10 ]; then
            echo "Error rate too high: $ERROR_RATE"
            # Automatic rollback
            az webapp deployment slot swap \
              --resource-group itms-rg \
              --name itms-prod \
              --slot staging-slot
            exit 1
          fi
      
      - name: Audit log deployment
        run: |
          curl -X POST https://auditlog.company.com/deployments \
            -H "Authorization: Bearer ${{ secrets.AUDIT_LOG_TOKEN }}" \
            -H "Content-Type: application/json" \
            -d '{
              "deployment_id": "${{ github.run_id }}",
              "environment": "production",
              "version": "${{ github.sha }}",
              "deployed_by": "${{ github.actor }}",
              "timestamp": "'$(date -u +'%Y-%m-%dT%H:%M:%SZ')'",
              "status": "success"
            }'
```

**Traceability:** NFR-009 (Production deployment automation), NFR-008 (Audit logging)

### 7.3 Failure Handling

| Scenario | Action | Notification |
|----------|--------|-------------|
| Build fails | Stop; do not proceed to test | Slack alert to #dev-alerts |
| Tests fail (<80% coverage) | Stop; do not proceed to staging | Email to PR author |
| SAST/SCA finds vulnerabilities | Manual review required; flag for security team | Jira ticket created |
| Staging deployment fails | Halt; rollback container | PagerDuty alert (P2) |
| Production health check fails | Automatic rollback to previous version | PagerDuty alert (P1), Slack #incidents |
| Production error rate spikes | Trigger incident response; notify on-call | Auto-page incident commander |

**Traceability:** NFR-009 (CI/CD reliability), NFR-006 (Reliability and RTO)

---

## 8. Deployment Target Environments

| Environment | Purpose | Resources | Uptime | Traceability |
|-------------|---------|-----------|--------|--------------|
| **Development** | Local and feature development | docker-compose | N/A | NFR-001 |
| **Staging** | UAT and performance testing | Azure App Service (Standard tier) | 99% | NFR-004, NFR-005 |
| **Production** | Live system | Azure App Service (Premium tier) + Auto-scale | 99.5% | NFR-006 |

---

## 9. Traceability Matrix

### 9.1 Requirements to Technical Design Mapping

| BRD Req ID | Requirement | Technical Design Decision | Implementation |
|-----------|-----------|--------------------------|-----------------|
| **FR-001** | Task Creation | REST API POST /api/v1/tasks; TypeORM entity mapping | Express route + validation middleware |
| **FR-002** | Task Assignment | Assignment service; async notification via Bull queue | Separate service layer; event-driven |
| **FR-003** | Dependency Management | Graph traversal for circular check; status automation | TypeORM queries; transaction-based mutations |
| **FR-004** | Status Tracking | State machine validation; audit log every change | Enum validation; AuditLog table |
| **FR-005** | Task Filtering | Indexed database queries; Redis caching | PostgreSQL indexes; Redis query cache |
| **FR-006** | Progress Dashboard | Aggregation queries; real-time report generation | Reporting service; 30-second cache |
| **NFR-001** | Modular Architecture | Separate services layer; dependency injection pattern | Express middleware; TypeDI for IoC |
| **NFR-002** | Unit Test Coverage | Jest 80%+ coverage threshold; coverage check in CI | npm test with coverage; CI/CD gate |
| **NFR-003** | API Documentation | OpenAPI/Swagger spec; automated from code | @nestjs/swagger decorators or similar |
| **NFR-004** | Performance <500ms | Database indexing; Redis caching; pagination | Strategic indexes; query optimization |
| **NFR-005** | Scalability 10K tasks | Connection pooling; index on common queries | pgBouncer; composite indexes |
| **NFR-006** | Availability 99.5% | Azure redundancy; automated backups; health checks | App Service with auto-scale; RTO testing |
| **NFR-007** | Data Security | JWT + OAuth; TLS 1.2+; AES-256 encryption | Passport.js; helmet.js; TDE database encryption |
| **NFR-008** | Audit Logging | Immutable audit table; 12-month retention | AuditLog table; blob storage archival |
| **NFR-009** | CI/CD Automation | GitHub Actions workflow; automated tests gate | Build → Test → Scan → Deploy |
| **NFR-010** | Usability | React SPA; Material-UI; WCAG 2.1 AA | Accessible components; keyboard shortcuts |
| **BR-R-001** | Priority enum | Enum type in database and API | SQL enum + TypeScript type |
| **BR-R-002** | Date validation | POST method checks date > today | Express Validator middleware |
| **BR-R-003** | Immutable Task ID | UUID primary key in database | DATABASE-level NOT NULL constraint |
| **BR-R-004** | Unidirectional deps | Foreign key with direction specified | single FK relationship (not bidirectional) |
| **BR-R-005** | Circular prevention | DFS/BFS graph traversal before insert | Transaction with validation before commit |
| **BR-R-006** | Cannot complete if deps | Status update checks dependency state | State machine in UPDATE endpoint |
| **BR-R-007** | Auto-block on incomplete | Trigger or application logic on dep incomplete | Service layer logic; event-driven updates |
| **BR-R-008** | Cannot manual unlock | Status machine prevents BLOCKED → unblocked transitions | Enum validation on PATCH endpoint |
| **BR-R-009** | Notify on assignment | Bull job queue; email/SMS notifications | Async queue; notification service |
| **BR-R-010** | Only active users | User service checks is_active = true | Middleware validates on assignment |
| **BR-R-011** | Log all status changes | Task history table; audit log entry | TaskHistory entity auto-populated |
| **BR-R-012** | Auto-populate completion date | Application logic on status update | Trigger or service layer sets actual_completion |

### 9.2 Architecture Components to Traceability

| Component | Satisfies | Evidence |
|-----------|-----------|----------|
| React SPA Frontend | NFR-010 (Usability), FR-006 (Dashboard) | Accessible, responsive UI; <1s load time |
| Express.js Backend | NFR-001 (Modularity), IS-010 (API) | Service-layer architecture; OpenAPI docs |
| PostgreSQL Database | FR-001-006 (All task operations); NFR-005 (Scalability) | Relational model supports 10K+ tasks; indexes |
| Redis Cache | NFR-004 (Performance <500ms); NFR-005 (Scalability) | Query cache; session storage; 30s dashboard |
| TypeORM ORM | NFR-002 (Testability); NFR-001 (Modularity) | Repository pattern enables mock testing |
| JWT + OAuth | NFR-007 (Authentication); BR-R-010 (Active user check) | Token-based stateless auth; user validation |
| TLS/HTTPS | NFR-007 (Encryption in transit) | Enforced by Azure Front Door; TLS 1.2+ |
| AES-256 (TDE) | NFR-007 (Encryption at rest); NFR-008 (Audit immutability) | Database-level encryption; blob storage security |
| Audit Log Table | NFR-008 (Audit); BR-R-011 (History) | Separate immutable table with 12-month retention |
| Bull Job Queue | FR-002 (Async notifications); BR-R-009 (Assignment notification) | Reliable delivery; retry logic |
| Winston Logging | NFR-006, NFR-008 (Logging); NFR-009 (CI/CD visibility) | Centralized logs; structured JSON; Azure Log Analytics |
| GitHub Actions | NFR-009 (CI/CD); R-005 (Security scanning) | Automated build → test → deploy pipeline |
| SonarQube/Snyk | NFR-002 (Code quality); R-005 (Dependency security) | SAST + SCA in every pipeline run |
| Azure Container Registry | NFR-009 (Deployment); NFR-006 (Reliability) | Secure image storage; audit trail |
| Azure App Service | NFR-006 (Availability 99.5%); NFR-004, NFR-005 (Scale) | Premium tier with auto-scale; azure managed |

---

## 10. Performance & Scalability Targets

### 10.1 Response Time SLAs

**Traceability:** NFR-004 (Performance - Response Time)

| Operation | Target | Current Design | Verification |
|-----------|--------|-----------------|----------------|
| POST /tasks | <200ms | Direct insert + Redis cache invalidation | Load test (50 concurrent users) |
| GET /tasks (filter) | <500ms | Indexed query + Redis cache | Query plan analysis + load test |
| PATCH /tasks/{id} | <200ms | Transaction with index lookups | Benchmark test |
| GET /reports/progress | <1000ms | Aggregation query; 30s cache | Dashboard load test |
| GET /users (list) | <500ms | Small table; full scan acceptable | Verify no N+1 queries |

### 10.2 Scalability Thresholds

**Traceability:** NFR-005 (Performance - Scalability)

| Metric | Target | Design Strategy |
|--------|--------|-----------------|
| Concurrent Users | 50 minimum | Connection pool: 20-30 connections; pgBouncer multiplexer |
| Total Tasks | 10,000 minimum | Strategic indexing; pagination in UI (50 tasks/page) |
| Storage | 500MB baseline | Single task record ~5KB; 10K tasks = 50MB + overhead |
| Backup Size | <1GB | Daily incremental; monthly full backup |

### 10.3 Cache Strategy

**Traceability:** NFR-004, NFR-005 (Performance optimization)

```typescript
// Cache invalidation patterns
class CacheStrategy {
  // Task operations invalidate related caches
  async updateTaskStatus(taskId, status) {
    await taskRepository.update(taskId, { status });
    
    // Invalidate caches
    await redis.del(`task:${taskId}`);           // Single task
    await redis.del(`tasks:user:*`);              // User's task list (wildcard)
    await redis.del(`report:progress:*`);         // Dashboard (wildcard)
    await redis.del(`dependencies:blocking:${taskId}`);  // Dependency chains
  }
}

// Cache TTL policies
const CACHE_TTL = {
  task_detail: 300,          // 5 minutes
  task_list: 120,            // 2 minutes
  dashboard: 30,             // 30 seconds (real-time requirement)
  user_list: 3600,           // 1 hour (slow-changing)
  session: 1800              // 30 minutes
};
```

---

## 11. Glossary of Technical Terms

| Term | Definition | Context |
|------|-----------|---------|
| **REST API** | Representational State Transfer; HTTP-based API using GET, POST, PATCH, DELETE | Interface between frontend and backend |
| **JWT (JSON Web Token)** | Stateless authentication token; contains payload and signature | Authentication mechanism for API requests |
| **OAuth 2.0** | Open authorization protocol for delegated authentication | Integration with LDAP/directory provider |
| **ORM (Object-Relational Mapping)** | Library mapping database tables to code objects | TypeORM enables type-safe queries |
| **Transaction** | Database operation ensuring ACID properties | Circular dependency check requires atomicity |
| **Index** | Database structure for fast lookup on specific columns | Performance optimization for filter operations |
| **Connection Pool** | Reusable database connections; reduces connection overhead | Handles 50+ concurrent users efficiently |
| **Redis** | In-memory data store; fast reads; used for caching and sessions | Query caching + session management |
| **Bull Queue** | Node.js job queue library backed by Redis | Reliable async task processing for notifications |
| **SAST (Static Application Security Testing)** | Analyzes source code for security vulnerabilities | SonarQube in CI/CD pipeline |
| **SCA (Software Composition Analysis)** | Scans dependencies for known vulnerabilities | Snyk or npm audit in CI/CD |
| **Container** | Lightweight virtualization; packages app + dependencies | Docker enables consistent deployment across environments |
| **CI/CD Pipeline** | Continuous Integration + Continuous Deployment; automated build/test/deploy | GitHub Actions automates release process |
| **Health Check** | Endpoint verifying service availability; used by load balancers | /health endpoint returns 200 OK if ready |
| **Audit Log** | Immutable record of all system changes | Compliance and troubleshooting |
| **State Machine** | Defines valid state transitions (To Do → In Progress → Completed) | Enforces business rules for task status |
| **Circular Dependency** | Cycle in dependency graph (Task A → B → A); disallowed | Validation prevents on creation |
| **Schema Migration** | Version-controlled database structure changes | TypeORM migrations for reproducibility |
| **Rollback** | Reverting to previous production version | Automated if production health check fails |

---

## Document Control

| Aspect | Details |
|--------|---------|
| **Document Owner** | Technical Lead / Solution Architect |
| **Last Updated** | March 9, 2026 |
| **Review Required** | Before any TOS changes; quarterly technical review |
| **Distribution** | Development Team, Architecture Review Board, DevOps Team |
| **Approved By** | CTO / Technical Director |

---

**End of Technical Specification Document**

This TSD provides the complete technical blueprint for implementing the Intelligent Task Management System in accordance with the Business Requirements Document. Every technical decision is traceable to specific BRD requirements and business objectives.
