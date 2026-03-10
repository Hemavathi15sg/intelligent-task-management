# Functional Requirements Document
## Intelligent Task Management System

**Document Version:** 1.0  
**Date Created:** March 9, 2026  
**Status:** Approved for Development  
**Classification:** Internal Use

---

## 1. Introduction & Purpose

### 1.1 Document Purpose

This Functional Requirements Document (FRD) defines the observable, testable functional behavior of the Intelligent Task Management System. It specifies what the system must do from the user's perspective, independent of implementation details. Every requirement in this document is independently testable and traceable to business objectives defined in the Business Requirements Document (BRD).

### 1.2 Document Audience

- **Development Team:** Implement features exactly as specified
- **QA/Test Engineers:** Create and execute test cases from acceptance criteria
- **Product Manager:** Verify feature completeness during UAT
- **Project Manager:** Track feature delivery status

### 1.3 Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | March 9, 2026 | Functional Analyst | Initial FRD creation |
| | | | • 6 use cases defined (UC-001 to UC-006) |
| | | | • 24 user stories with Gherkin scenarios |
| | | | • Role-based permissions matrix |
| | | | • 45+ functional requirements catalogued |

### 1.4 Traceability

This document references:
- **BRD:** Business Requirements Document (doc/brd.md)
- **TSD:** Technical Specification Document (doc/tsd.md)
- **REQ:** Original Requirements (requirements.md)

---

## 2. System Overview

### 2.1 Functional Scope

The Intelligent Task Management System is a web-based application enabling software development teams to:
- Create and manage project tasks with title, description, priority, and due dates
- Assign tasks to team members and track workload distribution
- Define dependencies between tasks; automatically mark dependent tasks as Blocked
- Track task status transitions (To Do → In Progress → Blocked → Completed)
- Filter and search tasks by status, priority, assignee, and due date
- View real-time project progress dashboard showing task distribution
- Maintain complete audit trail of all task changes and assignments
- Receive timely notifications for task assignments and dependency status changes

### 2.2 User Categories

1. **Developer/Engineer:** Primary user; creates, updates, completes tasks
2. **Team Lead:** Assigns tasks; reassigns when needed; views team workload
3. **Project Manager:** Views project progress; identifies bottlenecks; communicates status
4. **QA Engineer:** Creates test tasks; manages test task dependencies; tracks test completion

### 2.3 Key Use Cases

| Use Case ID | Title | Primary Actor | Triggers |
|-----------|-------|---------------|----------|
| UC-001 | Task Creation | Developer / Team Lead | User initiates new task |
| UC-002 | Task Assignment | Team Lead / Project Manager | Task created or reassignment needed |
| UC-003 | Dependency Management | Developer / Team Lead | Task dependencies need to be defined |
| UC-004 | Status Tracking | Developer / Team Lead | Task progresses or blocked |
| UC-005 | Task Filtering & Search | All Users | Need to find specific tasks |
| UC-006 | Project Progress Summary | Project Manager | Dashboard access or reporting need |

---

## 3. User Roles & Permissions Matrix

### 3.1 Role Definitions

| Role | Department | Primary Responsibilities | Traceability |
|------|-----------|------------------------|--------------|
| **Developer/Engineer** | Engineering | Create tasks; update status; receive assignments | IS-001, IS-002 |
| **Team Lead** | Engineering | Assign/reassign tasks; review team progress; manage dependencies | IS-003, IS-004 |
| **Project Manager** | Program Management | Track project progress; identify bottlenecks; manage stakeholders | IS-007 |
| **QA Engineer** | Quality Assurance | Create QA test tasks; manage test dependencies; track completion | IS-001, IS-002 |

### 3.2 Feature Access Matrix

| Feature | Developer | Team Lead | Project Manager | QA Engineer |
|---------|-----------|-----------|-----------------|-------------|
| **Create Task** | ✅ | ✅ | ✅ | ✅ |
| **Edit Own Task** | ✅ | ✅ | ✅ | ✅ |
| **Edit Any Task** | ❌ | ✅ | ✅ | ❌ |
| **Delete Task** | ❌ | ✅ | ✅ | ❌ |
| **Assign Task (during creation)** | ✅ | ✅ | ✅ | ✅ |
| **Reassign Task (change assignee)** | ❌ | ✅ | ✅ | ❌ |
| **Add Task Dependency** | ✅ | ✅ | ✅ | ✅ |
| **Remove Task Dependency** | ❌ | ✅ | ✅ | ❌ |
| **Update Task Status** | ✅ | ✅ | ✅ | ✅ |
| **View Project Dashboard** | ✅ | ✅ | ✅ | ✅ |
| **View Team Workload Report** | ❌ | ✅ | ✅ | ❌ |
| **View Blocked Tasks Report** | ✅ | ✅ | ✅ | ✅ |
| **View Audit Log** | ❌ | ✅ | ✅ | ❌ |
| **Export Task Data** | ❌ | ❌ | ✅ | ❌ |

### 3.3 Permission Rules

**Rule PR-001:** Only task creator or assigned user can update task status  
**Rule PR-002:** Only Team Lead or Project Manager can reassign tasks to other users  
**Rule PR-003:** Only task creator can add initial dependencies; Team Lead can add dependencies later  
**Rule PR-004:** All users can view project dashboard; only Team Lead/PM can view audit logs  

---

## 4. Use Cases

### UC-001: Task Creation

**Traceability:** FR-001, IS-001

#### 4.1.1 Overview

Authorized users can create new tasks with required attributes to capture work that needs to be completed. The system generates a unique Task ID and allows the creator to specify title, description, priority, assignee, and due date.

#### 4.1.2 Actors

- **Primary Actor:** Developer, Team Lead, Project Manager, QA Engineer
- **Secondary Actors:** System (generates Task ID), Email Service (sends creation notification)

#### 4.1.3 Preconditions

- User is authenticated and logged into the system
- User has permission to create tasks (all active users have this permission)
- System database is accessible and responsive

#### 4.1.4 Main Flow

1. User navigates to "Create New Task" or clicks "+" button
2. System displays task creation form with the following fields:
   - Task Title (text input, required)
   - Description (text area, required)
   - Priority (dropdown: Low / Medium / High, defaults to Medium)
   - Assigned To (searchable user dropdown, required)
   - Estimated Completion Date (date picker, required - must be future date)
   - Task Dependencies (multi-select, optional)
3. User fills in required fields and selects optional dependency tasks
4. User clicks "Create Task" button
5. System validates all required fields are populated
6. System validates estimated completion date is in the future
7. System checks for circular dependencies if any are specified
8. System generates unique Task ID (format: T-[sequential number])
9. System persists task to database with status "To Do"
10. System displays success confirmation: "Task [T-XXX] created successfully"
11. System sends creation notification to assigned user (if different from creator)
12. System refreshes task list to show new task at top
13. System's user is returned to task list view

#### 4.1.5 Alternative Flows

**Alt Flow A1: User cancels task creation**
- At any point before clicking "Create Task", user clicks "Cancel"
- System displays modal: "Discard unsaved changes?"
- User confirms "Yes" or "No"
- If "Yes": System returns to task list without saving
- If "No": System returns to form

**Alt Flow A2: Task creation with circular dependency**
- At step 7, system detects circular dependency (e.g., Task A depends on Task B which depends on Task A)
- System displays error: "Circular dependency detected: [dependency chain shown]"
- System highlights circular dependencies in red
- User must remove circular dependency to proceed
- System returns to step 5 (validation)

**Alt Flow A3: Assigned user is inactive**
- At step 5, system validates assignee exist and is_active = true
- If assigned user is inactive, system displays error: "Cannot assign to inactive user. User must be active to receive assignments."
- System suggests active alternatives: [list of similar named active users]
- User must select active user to proceed

#### 4.1.6 Postconditions

- Task is created and persisted in database with unique Task ID
- Task status is "To Do"
- Assigned user receives notification of new assignment
- Task ID is displayed as confirmation
- User is on task list view showing newly created task

#### 4.1.7 Business Rules Referenced

- BR-R-001: Task priority must be one of: Low, Medium, High
- BR-R-002: Estimated completion date must be in future; cannot be in past
- BR-R-003: Task ID is immutable once assigned
- BR-R-005: Circular dependencies are not permitted and prevented on creation

---

### UC-002: Task Assignment and Reassignment

**Traceability:** FR-002, IS-003

#### 4.2.1 Overview

Team Lead or Project Manager can assign tasks to team members during task creation or later reassign tasks to different team members when workload needs rebalancing.

#### 4.2.2 Actors

- **Primary Actor:** Team Lead, Project Manager
- **Secondary Actors:** Developer (receives assignment notification), Database, Email Service

#### 4.2.3 Preconditions

- Task exists in system with current assignee
- User has Team Lead or Project Manager role
- Assignee user exists and has is_active = true
- Task is not in Completed status

#### 4.2.4 Main Flow (Task Assignment During Creation)

1. See UC-001 Task Creation, steps 1-3 (user is in create task form)
2. User clicks on "Assigned To" dropdown field
3. System displays searchable list of active team members
4. User searches by name or starts typing: "dev1"
5. System filters results to matching active users
6. User selects desired team member
7. System updates form field showing selected user
8. User completes other required fields and clicks "Create Task"
9. System creates task and sets assigned_to = selected user
10. System sends notification to newly assigned user: "[Creator Name] assigned [Task T-XXX] to you"
11. Task is created and visible in assignee's task list

#### 4.2.5 Main Flow (Reassign Existing Task)

1. Team Lead or Project Manager clicks on task to view task details
2. System displays task detail view with all task information
3. User clicks "Change Assignment" or "Reassign" button
4. System displays reassignment modal with:
   - Current assignee: [User Name] (highlighted in yellow for visibility)
   - New assignee: (empty searchable dropdown)
   - Reason for reassignment: (optional text field)
5. User searches and selects new assignee from active users list
6. User optionally enters reason: e.g., "Expertise in file upload systems"
7. User clicks "Confirm Reassignment" button
8. System validates:
   - New assignee is not the same as current assignee
   - New assignee is active user (is_active = true)
   - Task is not in Completed status
9. System updates task: assigned_to = new user
10. System records assignment change in ASSIGNMENTS_HISTORY table with:
    - task_id, assigned_by (current user), recipient_user (new), previous_assignee, assigned_at, reason
11. System sends notifications:
    - **To new assignee:** "[Reassigner Name] has reassigned [Task T-XXX] to you. Reason: [reason provided]"
    - **To previous assignee:** "Task [T-XXX] has been reassigned to [New Assignee Name]"
12. System updates task detail view with new assignee highlighted
13. System displays success message: "Task reassigned to [New Assignee Name]"

#### 4.2.6 Alternative Flows

**Alt Flow A1: Assignment cancelled**
- User opens reassignment modal but clicks "Cancel" before confirming
- System closes modal without making changes
- Task assignment remains unchanged

**Alt Flow A2: Target user is inactive**
- User selects user who is now inactive
- System displays error: "Cannot reassign to inactive user [User Name]. User must be active."
- System suggests alternative active users
- User must select an active user to proceed

**Alt Flow A3: Reassign to self**
- User attempts to reassign task to current assignee
- System displays warning: "Task is already assigned to this user. No changes made."
- System closes modal

#### 4.2.7 Postconditions

- Task assigned_to field updated to new user
- Assignment history recorded for audit trail
- Both previous and new assignee receive notifications
- Task appears in new assignee's task list
- Assignment change is logged in audit trail

#### 4.2.8 Business Rules Referenced

- BR-R-010: Only active team members can receive new task assignments
- BR-R-009: Task reassignment requires notification to both old and new assignee

---

### UC-003: Task Dependency Management

**Traceability:** FR-003, IS-004

#### 4.3.1 Overview

Users can define task dependencies to represent blocking relationships (e.g., "Task A depends on Task B" means B must be completed before A can proceed). The system prevents circular dependencies and automatically marks dependent tasks as Blocked when blocking tasks are incomplete.

#### 4.3.2 Actors

- **Primary Actor:** Developer, Team Lead
- **Secondary Actors:** System (validates, updates status), Database, Notification Service

#### 4.3.3 Preconditions

- Both tasks (blocking and dependent) exist in the system
- User has permission to edit dependencies (creator or Team Lead)
- Database is accessible

#### 4.3.4 Main Flow (Add Dependency During Task Creation)

1. See UC-001 Task Creation, steps 1-3 (user is in create task form)
2. User clicks on "Task Dependencies" section (optional multi-select)
3. System displays searchable list of existing tasks with statuses
4. User types to search for blocking tasks: "security review"
5. System filters results to matching tasks
6. User selects one or more tasks that current task depends on:
   - "T-051: Complete Security Review" (Status: In Progress)
   - "T-052: Database Migration" (Status: To Do)
7. System displays selected dependencies in form
8. User completes other required fields and clicks "Create Task"
9. System validates for circular dependencies:
   - Does T-051 or T-052 depend on this new task? (No)
   - Would creating this dependency create a cycle? (No)
10. System creates task with dependencies
11. System sets task status to "Blocked" if any dependency is incomplete (not in Completed status)
12. System creates entries in TASK_DEPENDENCIES table
13. System sends notification to task assignee: "Task [T-XXX] created with blocking dependencies: [dependency list]. Task is currently Blocked."

#### 4.3.5 Main Flow (Add Dependency to Existing Task)

1. Team Lead clicks on task to view task details page
2. System displays task detail view with all task information
3. User scrolls down to "Dependencies" section
4. User clicks "Add Dependency" button
5. System displays modal for adding new dependency with:
   - List of current blocking tasks (read-only)
   - "Search for blocking task:" search field
   - List of other existing tasks (excluding current task and already-blocked-by tasks)
6. User searches for and selects a task: "T-051: Complete Security Review"
7. System validates circular dependency:
   - Check if selected task depends on current task
   - Check if selected task has dependencies that eventually depend on current task
   - Result: No circular dependency detected
8. User clicks "Add Dependency" button in modal
9. System creates TASK_DEPENDENCIES entry:
   - blocking_task_id = T-051
   - dependent_task_id = [current task]
   - created_at = now, created_by = current user
10. System re-evaluates current task status:
    - If all dependencies are completed: keep status as-is
    - If any dependency is incomplete: change status to "Blocked"
11. System updates task detail view showing new dependency
12. System sends notification to task assignee: "Your task [T-XXX] now depends on [T-051]. Status changed to Blocked."

#### 4.3.6 Main Flow (Remove Dependency)

1. Team Lead views task detail page with dependencies
2. User sees list of blocking tasks in dependencies section
3. User clicks "Remove" button next to dependency: "T-051: Complete Security Review"
4. System displays confirmation modal: "Remove dependency on [T-051]? This may allow task [current task] to proceed."
5. User confirms "Remove Dependency"
6. System soft-deletes TASK_DEPENDENCIES entry by setting deleted_at = now
7. System re-evaluates task status:
    - Check if all remaining dependencies are completed
    - If yes: change status from "Blocked" to "To Do" (or previous status)
    - If no: keep as "Blocked"
8. System updates task detail view
9. System sends notification: "Dependency on [T-051] has been removed from task [T-XXX]."

#### 4.3.7 Alternative Flows

**Alt Flow A1: Circular dependency detected**
- At step 9 (add dependency), system detects circular reference
- Scenario: T-051 depends on current task, which would create cycle
- System displays alert: "Circular dependency detected. Task [T-051] already depends on this task: [chain: T-051 → T-053 → current task]"
- System prevents adding this dependency
- User must select different task

**Alt Flow A2: Cannot remove dependency from completed task**
- Completed tasks cannot have dependencies modified
- If user attempts to remove dependency, system displays: "Cannot modify dependencies on completed tasks."

#### 4.3.8 Postconditions

- Dependency relationship is created or deleted in TASK_DEPENDENCIES table
- Dependent task status automatically updated (may change to/from Blocked)
- Users affected by status changes receive notifications
- Change is logged in audit trail

#### 4.3.9 Business Rules Referenced

- BR-R-004: Dependencies are unidirectional (Task A depends on Task B; B does not depend on A)
- BR-R-005: Circular dependencies are not permitted and detected on creation/modification
- BR-R-007: Blocked status automatically applied when any dependency is incomplete

---

### UC-004: Task Status Tracking

**Traceability:** FR-004, IS-005

#### 4.4.1 Overview

Users can update task status to reflect current progress (To Do → In Progress → Completed). The system enforces valid state transitions, prevents completing tasks with unresolved dependencies, and maintains complete history of all status changes.

#### 4.4.2 Actors

- **Primary Actor:** Developer, Team Lead (task assignee)
- **Secondary Actors:** System (status state machine validator), Notification Service

#### 4.4.3 Preconditions

- Task exists and user has permission to update it (creator or assignee)
- User is authenticated and logged in
- Task status is not already at target status

#### 4.4.4 Main Flow (Update Status)

1. User views task detail page or task list with status column
2. User clicks on status field/dropdown to update
3. System displays valid status options based on current task status:
   - **Current: To Do** → Allow: In Progress, Completed (with warning if dependencies incomplete)
   - **Current: In Progress** → Allow: To Do, Completed (with warning if dependencies incomplete)
   - **Current: Blocked** → Allow: No manual change; must resolve dependencies
   - **Current: Completed** → Allow: No change (completed tasks are immutable by status)
4. User selects new status: "In Progress"
5. System checks:
   - Can status be changed to "In Progress"? (Yes)
   - Are dependencies satisfied? (N/A for In Progress)
6. User clicks "Update" or presses Enter
7. System validates:
   - New status is valid transition from current status
   - If new status is "Completed": Verify all dependencies are satisfied
8. System updates task record:
   - status = "In Progress"
   - updated_at = current timestamp
9. System creates TASK_HISTORY entry:
   - change_type = "STATUS_CHANGED"
   - previous_values = {status: "To Do"}
   - new_values = {status: "In Progress"}
   - modified_by = current user
   - changed_at = now
10. System sends notification to:
    - Task assignee: "Task [T-XXX] status changed to 'In Progress'"
    - Project Manager (if different): "Task [T-XXX] status changed to 'In Progress'"
11. System updates UI to show new status immediately
12. Task history is updated to show this change with timestamp

#### 4.4.5 Main Flow (Auto-Block When Dependency Incomplete)

1. User tries to create or modify task status to "In Progress" or "To Do"
2. System discovers task has unresolved (incomplete) dependencies
3. **Automatic action:** System sets task status to "Blocked"
4. System sends notification: "Task [T-XXX] has been automatically marked as Blocked due to incomplete blocking tasks: [list dependency names]"
5. Task is prevented from changing status until dependencies are resolved

#### 4.4.6 Main Flow (Task Completion With Auto-populated Completion Date)

1. User views task and clicks status field
2. System shows valid transitions; user selects "Completed"
3. System validates all dependencies are complete (status = Completed)
4. System checks if any dependencies are incomplete:
   - If incomplete detected: Display error "Cannot complete task. Blocking dependencies not resolved: [list]"
   - User must select different status
5. If all dependencies complete:
   - System updates task_status = "Completed"
   - System auto-populates actual_completion = today's date
   - System records both in same TASK_HISTORY entry
6. System sends notification to assignee and stakeholders:
   - "Task [T-XXX] completed! Actual completion: [date]"
7. System automatically re-evaluates any dependent tasks:
   - For each task depending on this task: check if all their dependencies are now complete
   - If all dependencies complete: change status from "Blocked" to "To Do"
   - Send notification: "Blocking task [T-XXX] is now complete. Your task [dependent T-xxx] is no longer blocked."

#### 4.4.7 Alternative Flows

**Alt Flow A1: Attempt to complete task with unresolved dependencies**
- User tries to change status to "Completed"
- System checks dependencies and finds incomplete blocking task(s)
- System displays error: "Cannot mark task as Completed. The following blocking tasks must be completed first: [T-051, T-052]"
- Task status is not changed
- User must resolve dependencies before completing

**Alt Flow A2: Attempt to manually unblock task**
- Current status is "Blocked"
- User attempts to change status to "To Do" or similar
- System displays: "Cannot manually change status of Blocked task. You must resolve the following blocking dependencies: [list with links]"
- Status is not changed

**Alt Flow A3: Status update by non-creator**
- Only assignee or creator can update task status
- If user is neither, system displays: "You don't have permission to update this task's status. Contact the assignee or Team Lead."

#### 4.4.8 Postconditions

- Task status updated in database
- Status history entry created with timestamp and user info
- Notifications sent to relevant users
- If task auto-blocked: status is "Blocked" and dependent tasks notified
- If task completed: dependent tasks re-evaluated for unblocking
- UI updated to reflect new status

#### 4.4.9 Business Rules Referenced

- BR-R-006: A task cannot be marked Completed if it has unresolved dependencies
- BR-R-007: Blocked status is automatically applied when any dependency is incomplete
- BR-R-008: Blocked status cannot be manually removed; dependencies must be resolved first
- BR-R-011: All status changes must be logged with timestamp and user
- BR-R-012: Completion date must be automatically populated when task status changed to Completed

---

### UC-005: Task Listing and Filtering

**Traceability:** FR-005, IS-006

#### 4.5.1 Overview

Users can retrieve and view lists of tasks with multiple filter and sort options. The system provides flexible filtering by status, priority, assignee, and due date, supporting cumulative filters (AND logic).

#### 4.5.2 Actors

- **Primary Actor:** All authenticated users (Developer, Team Lead, Project Manager, QA Engineer)
- **Secondary Actors:** System (filter validation, query execution)

#### 4.5.3 Preconditions

- User is authenticated and logged in
- At least one task exists in the system
- User has permissions to view tasks (all roles can view)

#### 4.5.4 Main Flow (View Default Task List)

1. User logs into system or navigates to "My Tasks" tab
2. System displays default task list containing:
   - All tasks assigned to current user
   - Sorted by estimated_completion date (ascending)
   - Status and priority shown as visual indicators
   - Shows result count: "Showing 12 of 45 tasks assigned to you"
3. List displays columns: Task ID, Title, Priority (icon), Status (badge), Assigned To, Due Date
4. User can click on any task to view full details
5. User can click column header to sort (e.g., click "Priority" to sort by priority)

#### 4.5.5 Main Flow (Apply Single Filter)

1. User sees task list and clicks on filter panel on left sidebar
2. System displays filter options:
   - **Status** (checkbox group): To Do, In Progress, Blocked, Completed
   - **Priority** (checkbox group): Low, Medium, High
   - **Assigned To** (searchable dropdown with active users)
   - **Due Date Range** (date picker: from date to date)
   - **Search** (text field, searches title and description)
3. User clicks checkbox for "Status: In Progress"
4. System immediately applies filter and updates list:
   - Only shows tasks with status = "In Progress"
   - Updates result count: "Showing 8 of 45 tasks"
   - Re-renders task list in <2 seconds
5. User sees filtered results with "In Progress" status indicator

#### 4.5.6 Main Flow (Apply Multiple Cumulative Filters)

1. User has already filtered by Status: In Progress (see Alt Flow A1)
2. User also selects Priority: High
3. System applies cumulative filter (AND logic):
   - status = "In Progress" AND priority = "High"
   - Result count updates: "Showing 3 of 45 tasks"
4. User also sets Due Date Range: Next 7 days
5. System applies third cumulative filter:
   - status = "In Progress" AND priority = "High" AND estimated_completion <= (today + 7 days)
   - Result count: "Showing 1 of 45 tasks"
6. User can add more filters; all are applied cumulatively

#### 4.5.7 Main Flow (Sort Results)

1. User views filtered task list
2. User clicks column header "Due Date" to sort
3. System re-renders list sorted by estimated_completion in ascending order (earliest first)
4. User clicks "Due Date" again
5. System toggles sort order to descending (latest first)
6. Sort preference is maintained while filters remain applied

#### 4.5.8 Main Flow (Clear All Filters)

1. User has multiple active filters applied
2. System shows "X filters active" indicator with "Clear All" button
3. User clicks "Clear All"
4. System resets all filters to default state
5. System displays default task list (all assigned tasks)

#### 4.5.9 Main Flow (Search by Text)

1. User enters text in "Search" field: "payment api"
2. System performs case-insensitive search on task titles and descriptions
3. System returns tasks matching search term
4. Results displayed with matching text highlighted
5. Search is cumulative with other filters applied

#### 4.5.10 Main Flow (Save Filter Configuration as Named View)

1. User applies multiple filters: Status=In Progress, Priority=High
2. User clicks "Save This View" button
3. System displays modal: "Save filter configuration as:"
4. User enters name: "High Priority In Progress"
5. User clicks "Save View"
6. System saves configuration with name and user association
7. System displays confirmation: "View saved"
8. View button appears in filter panel with saved name
9. User can click saved view to instantly apply those filters

#### 4.5.11 Alternative Flows

**Alt Flow A1: No tasks match filter criteria**
- User applies filters that result in zero tasks
- System displays: "No tasks match your filter criteria. [Clear All Filters] or modify filters"
- List is empty with helpful message

**Alt Flow A2: User searches non-existent term**
- User enters search term that doesn't match any tasks
- System displays empty list with message: "No tasks found matching 'xyz'"

**Alt Flow A3: Pagination for large result sets**
- Result set contains 342 tasks
- System displays: "Showing 50 of 342 tasks" with pagination controls
- User can navigate: Previous, Next, or enter page number

#### 4.5.12 Postconditions

- Task list updated to show only matching tasks
- Filters remain applied until explicitly cleared
- Sort order maintained across filter changes
- Result count displayed to show matching task count

#### 4.5.13 Business Rules Referenced

- Filters are cumulative (AND operator); all filter criteria must be satisfied

---

### UC-006: Project Progress Summary Dashboard

**Traceability:** FR-006, IS-007

#### 4.6.1 Overview

The Project Progress Dashboard provides a real-time at-a-glance view of project status, showing task distribution by status, workload by assignee, identification of blocked tasks, and overdue high-priority tasks.

#### 4.6.2 Actors

- **Primary Actor:** Project Manager, Team Lead, All Users
- **Secondary Actors:** System (real-time aggregation), Database (query execution)

#### 4.6.3 Preconditions

- User is authenticated and logged in
- At least one task exists in the project
- User has permission to view dashboard (all roles have access)

#### 4.6.4 Main Flow (View Project Progress Dashboard)

1. User clicks "Dashboard" in main navigation
2. System loads and displays dashboard within 1 second
3. Dashboard displays in sections:

   **Section A: Task Summary Cards (Top Row)**
   - Card 1 - Total Tasks: large number, e.g., "45"
   - Card 2 - Completed: "18" with % complete: "40%"
   - Card 3 - In Progress: "12" with % of total: "27%"
   - Card 4 - Blocked: "3" with % of total: "7%"
   - Card 5 - Pending (To Do): "12" with % of total: "27%"
   - Each card clickable to drill-down to filtered task list

   **Section B: Visual Distribution Chart (Middle Left)**
   - Pie or donut chart showing task status distribution
   - Color coding: Green (Completed), Blue (In Progress), Red (Blocked), Gray (To Do)
   - Interactive; click segment to filter
   - Legend shows exact counts

   **Section C: Blocked Tasks Alert (Middle Right)**
   - Header: "Blocked Tasks (3)" with red alert icon
   - Table showing:
     - Task ID | Task Title | Blocking Reason | Days Blocked
     - "T-045 Deploy Application | Depends on: T-051 (In Progress) | 2 days"
     - "T-048 Database Migration | Depends on: T-047, T-049 (both To Do) | 5 days"
     - "T-050 Documentation | Depends on: T-045 (Blocked) | 1 day"
   - Action: Click task to view details
   - Action: Click "Resolve" to navigate to blocking task

   **Section D: High Priority Overdue Tasks (Bottom Left)**
   - Header: "Overdue High Priority Tasks" with warning icon
   - Table showing:
     - Task ID | Task Title | Assigned To | Days Overdue
     - "T-032 Security Audit | Dev Team Lead | 3 days"
     - "T-035 Performance Testing | QA Engineer | 1 day"
   - Click task to view details

   **Section E: Team Workload Distribution (Bottom Right)**
   - Table showing:
     - Team Member | Assigned | Completed | In Progress | Blocked
     - "Developer A | 8 | 5 | 2 | 1"
     - "Developer B | 6 | 4 | 2 | 0"
     - "Developer C | 4 | 3 | 1 | 0"
   - Click developer name to filter task list to that assignee

4. Dashboard data refreshes automatically every 30 seconds
5. User can click "Refresh Now" to get immediate update
6. User can click any data element to drill-down to detailed task list with filters applied

#### 4.6.5 Alternative Flows

**Alt Flow A1: No blocked tasks**
- Section C "Blocked Tasks" displays: "No tasks currently blocked. Great progress!"

**Alt Flow A2: No overdue tasks**
- Section D "Overdue High Priority Tasks" displays: "All high-priority tasks are on schedule."

**Alt Flow A3: Dashboard accessed on mobile device**
- Dashboard responsive; sections stack vertically on small screens
- Charts display appropriately scaled
- All interactive elements accessible via touch

#### 4.6.6 Postconditions

- Dashboard displays current project status
- All metrics are based on current data (updated within 30 seconds)
- User can navigate from dashboard to detailed views
- Dashboard remains accessible throughout session

#### 4.6.7 Business Rules Referenced

- Dashboard calculations performed in real-time based on current data
- Progress data refreshed every 30 seconds or on-demand
- Dashboard accessible from main navigation to all users

---

## 5. User Stories with Gherkin Acceptance Criteria

### US-001: Developer Creates New Task

**Related Use Case:** UC-001 Task Creation  
**Traceability:** FR-001, IS-001

**User Story:**
> As a **Developer**, I want to **create a new task** so that **my work is tracked and visible to the team**.

**Acceptance Criteria:**

```gherkin
Feature: Task Creation by Developer

Scenario: Developer successfully creates task with all required fields
  Given I am logged in as a Developer
  And I am on the "Create Task" page
  When I fill in the task form:
    | Field | Value |
    | Title | Implement User Authentication |
    | Description | Add OAuth 2.0 authentication with JWT tokens |
    | Priority | High |
    | Assigned To | Developer A (me) |
    | Due Date | 2026-03-20 |
  And I click "Create Task" button
  Then a task with ID "T-XXX" is created successfully
  And the system displays confirmation: "Task T-XXX created successfully"
  And I am redirected to the task list view
  And the new task appears at the top of my task list
  And the task shows status "To Do"

Scenario: System prevents task creation with missing required fields
  Given I am logged in as a Developer
  And I am on the "Create Task" page
  When I fill in the task form with:
    | Title | |
    | Description | Add OAuth |
    | Priority | High |
    | Assigned To | Developer A |
    | Due Date | 2026-03-20 |
  And I click "Create Task" button
  Then the system displays error: "Title is required"
  And the task is not created
  And I remain on the "Create Task" page

Scenario: System prevents task creation with past due date
  Given I am logged in as a Developer
  And I am on the "Create Task" page
  When I fill in the task form with:
    | Title | Complete old work |
    | Description | Finish previous work |
    | Priority | Low |
    | Assigned To | Developer A |
    | Due Date | 2026-03-08 |
  And I click "Create Task" button
  Then the system displays error: "Due date must be in the future"
  And the task is not created

Scenario: System prevents assigning task to inactive user
  Given I am logged in as a Developer
  And I am on the "Create Task" page
  When I search for user "InactiveUser" in the Assigned To field
  Then the system displays: "InactiveUser is inactive and cannot receive assignments"
  And the system suggests active users with similar names
  And I cannot select the inactive user

Scenario: Developer creates task with circular dependency
  Given I am logged in as a Developer
  And I am on the "Create Task" page
  When I try to create a task depending on Task T-051
  And Task T-051 depends on Task T-052
  And Task T-052 eventually depends on the new task
  Then the system detects the circular dependency
  And displays error: "Circular dependency detected: [chain description]"
  And the task is not created
  And I can revise the dependencies and retry
```

---

### US-002: Team Lead Assigns Task to Developer

**Related Use Case:** UC-002 Task Assignment  
**Traceability:** FR-002, IS-003

**User Story:**
> As a **Team Lead**, I want to **assign tasks to my team members** so that **work is distributed fairly and team members know what to work on**.

**Acceptance Criteria:**

```gherkin
Feature: Task Assignment by Team Lead

Scenario: Team Lead assigns existing task to developer
  Given I am logged in as a Team Lead
  And I am viewing task T-032
  When I click "Change Assignment" button
  And I search for and select "Developer B" as the new assignee
  And I enter reason: "Better knowledge of database systems"
  And I click "Confirm Reassignment" button
  Then the task is assigned to Developer B
  And Developer B receives notification: "Team Lead assigned T-032 to you. Reason: Better knowledge of database systems"
  And the previous assignee receives notification: "Task T-032 has been reassigned to Developer B"
  And the assignment is logged in the audit trail
  And the task detail page shows: "Assigned To: Developer B"

Scenario: Team Lead cannot assign task to inactive user
  Given I am logged in as a Team Lead
  And I am reassigning a task
  When I try to select an inactive user
  Then the system displays: "Cannot assign to inactive user"
  And the inactive user does not appear in the selection list
  And I must select an active user to proceed

Scenario: Team Lead cannot reassign task to same assignee
  Given I am logged in as a Team Lead
  And I am reassigning task T-032 which is assigned to Developer A
  When I select Developer A as the new assignee
  Then the system displays: "Task is already assigned to this user"
  And the reassignment is not processed

Scenario: Team Lead gets notification of task creation by developer
  Given I am logged in as a Team Lead
  And Developer A creates task T-095 assigned to me
  When the task is created
  Then I receive notification: "Developer A created task T-095 and assigned it to you"
  And the notification includes a link to the task
  And the task appears in my assigned task list
```

---

### US-003: Developer Adds Task Dependency

**Related Use Case:** UC-003 Dependency Management  
**Traceability:** FR-003, IS-004

**User Story:**
> As a **Developer**, I want to **mark task dependencies** so that **the team understands task order and knows when tasks are blocked**.

**Acceptance Criteria:**

```gherkin
Feature: Task Dependency Management

Scenario: Developer adds dependency when creating task
  Given I am logged in as a Developer
  And I am on the "Create Task" page
  When I fill in task details
  And I click on "Task Dependencies" section
  And I search for and select "T-051: Complete Security Review"
  And I click "Create Task"
  Then task T-XXX is created
  And a dependency is created: T-XXX depends on T-051
  And if T-051 is not Completed, task T-XXX status is set to "Blocked"
  And I receive notification: "Your task has blocking dependencies. Currently Blocked."

Scenario: System detects circular dependency
  Given I am creating a new task that would depend on T-051
  And T-051 depends on T-052
  And T-052 depends on the task I'm creating
  When I try to add T-051 as a dependency
  Then the system displays: "Circular dependency detected: [chain shown]"
  And the dependency is not created
  And I must select a different task

Scenario: Blocked task automatically transitions when dependency completes
  Given task T-100 has status "Blocked" and depends on T-051
  When task T-051 is marked as "Completed"
  Then task T-100 automatically transitions from "Blocked" to "To Do"
  And the assignee of T-100 receives notification: "Blocking task T-051 is complete. Your task T-100 is no longer blocked."
  And the task detail page immediately reflects the new status

Scenario: Team Lead removes dependency from task
  Given task T-100 depends on T-051
  When the Team Lead removes the T-051 dependency
  Then the dependency is removed from the system
  And if all other dependencies are satisfied, T-100 status changes from "Blocked" to "To Do"
  And the task assignee receives notification: "Dependency removed. Your task status updated."

Scenario: Cannot remove dependency from completed task
  Given task T-100 is Completed
  When I try to remove a dependency
  Then the system displays: "Cannot modify dependencies on completed tasks"
  And the action is not allowed
```

---

### US-004: Developer Updates Task Status

**Related Use Case:** UC-004 Status Tracking  
**Traceability:** FR-004, IS-005

**User Story:**
> As a **Developer**, I want to **update my task status** so that **the team knows what progress I'm making**.

**Acceptance Criteria:**

```gherkin
Feature: Task Status Tracking

Scenario: Developer marks task as In Progress
  Given I am logged in as a Developer
  And I have task T-032 with status "To Do"
  When I click on the status field
  And I select "In Progress"
  Then the task status is updated to "In Progress"
  And a status change entry is created in the task history
  And my manager receives notification: "Task T-032 status changed to In Progress"
  And the task detail page immediately shows the new status

Scenario: System prevents completion of task with unresolved dependencies
  Given task T-100 has status "In Progress"
  And task T-100 depends on task T-051 which is "To Do"
  When I click on the status field to change to "Completed"
  Then the system displays error: "Cannot complete task. Blocking dependencies not resolved: T-051"
  And the status is not changed
  And I can click link to view the blocking task

Scenario: Completion date auto-populated when task marked Completed
  Given task T-032 has no dependencies or all dependencies are Completed
  When I change the status to "Completed"
  Then the task status is updated to "Completed"
  And the "actual_completion" date is automatically set to today's date
  And the task history shows both the status change and completion date
  And stakeholders receive notification: "Task T-032 Completed on 2026-03-10"

Scenario: Blocked status is automatic, cannot be manually removed
  Given task T-100 depends on incomplete task T-051
  When I try to change task T-100's status from "Blocked" to another status
  Then the system displays: "Cannot manually remove Blocked status. Resolve dependencies first: T-051"
  And the status remains "Blocked"
  And I can only proceed when all dependencies are Completed

Scenario: Status change triggers dependent task re-evaluation
  Given task T-100 depends on task T-051
  And task T-100 is "Blocked"
  When I complete task T-051 and set its status to "Completed"
  Then task T-051 status is updated to "Completed"
  And task T-100 is automatically re-evaluated
  And task T-100 status automatically changes from "Blocked" to "To Do"
  And the assignee of T-100 receives notification: "Task T-051 is now complete. Your task T-100 is no longer blocked."
```

---

### US-005: Project Manager Filters Tasks by Multiple Criteria

**Related Use Case:** UC-005 Task Filtering  
**Traceability:** FR-005, IS-006

**User Story:**
> As a **Project Manager**, I want to **filter tasks by status, priority and due date** so that **I can focus on urgent and at-risk items**.

**Acceptance Criteria:**

```gherkin
Feature: Task Filtering and Search

Scenario: Project Manager filters tasks by status and priority
  Given I am logged in as a Project Manager
  And I am on the task list view
  When I select filter Status: "In Progress"
  And I select filter Priority: "High"
  Then the task list is updated to show only High priority In Progress tasks
  And the result count displays: "Showing 5 of 45 tasks"
  And filters remain applied until I clear them

Scenario: Project Manager applies due date range filter
  Given I have multiple tasks with various due dates
  When I specify Due Date Range: 2026-03-10 to 2026-03-17
  And I click "Apply Filter"
  Then the task list shows only tasks due within the next 7 days
  And the result count updates
  And I can combine this with other filters

Scenario: Project Manager searches by task title
  Given I am on the task list view
  When I enter "payment" in the search field
  Then the system searches all task titles and descriptions case-insensitively
  And displays matching tasks: "T-032 Implement Payment API", "T-045 Payment Processing Tests"
  And search results display in less than 2 seconds

Scenario: Project Manager saves filter configuration
  Given I have applied filters: Status=High Priority=Blocked
  When I click "Save This View"
  And I enter name: "High Priority Blocked"
  And I click "Save"
  Then the view is saved with that name
  And a button appears in the filter panel for this saved view
  And I can later click the button to instantly apply the same filters

Scenario: No tasks match filter criteria
  Given I apply filters that result in zero matching tasks
  Then the system displays: "No tasks match your filter criteria"
  And a "Clear All Filters" button is shown
  And the task list is empty with helpful message
```

---

### US-006: Project Manager Views Project Progress Dashboard

**Related Use Case:** UC-006 Project Progress  
**Traceability:** FR-006, IS-007

**User Story:**
> As a **Project Manager**, I want to **view the project progress dashboard** so that **I can quickly identify blockers and communicate status to stakeholders**.

**Acceptance Criteria:**

```gherkin
Feature: Project Progress Dashboard

Scenario: Project Manager views project summary on dashboard
  Given I am logged in as a Project Manager
  When I click "Dashboard" in the main navigation
  Then the dashboard loads in less than 1 second
  And I can see:
    | Metric | Display |
    | Total Tasks | 45 |
    | Completed | 18 (40%) |
    | In Progress | 12 (27%) |
    | Blocked | 3 (7%) |
    | Pending (To Do) | 12 (27%) |
  And each card is clickable to drill-down to filtered task list
  And the dashboard indicates which team members have overdue tasks

Scenario: Project Manager sees blocked tasks with reasons
  Given the dashboard is displayed
  When I look at the "Blocked Tasks" section
  Then I see a list of all currently blocked tasks
  And each blocked task shows:
    | Field | Example |
    | Task ID | T-045 |
    | Title | Deploy Application |
    | Blocking Reason | Depends on: T-051 (In Progress) |
    | Days Blocked | 2 |
  And I can click on a blocked task to view details
  And I can click "Resolve" to jump to the blocking task

Scenario: Project Manager sees overdue high-priority tasks warning
  Given I am viewing the dashboard
  When there are overdue High priority tasks
  Then the "Overdue High Priority Tasks" section is displayed
  And shows task ID, title, assigned developer, days overdue
  And the section has a warning/alert icon
  And I can click on task to view details or contact assignee

Scenario: Dashboard data automatically refreshes
  Given I am viewing the dashboard
  And 30 seconds have passed
  When the refresh cycle completes
  Then the dashboard data is automatically updated
  And the page shows latest task counts and status
  And no manual refresh is required
  And I can click "Refresh Now" to update immediately

Scenario: Project Manager sees team workload distribution
  Given I am viewing the dashboard
  When I look at the "Team Workload Distribution" section
  Then I see a table showing:
    | Developer | Assigned | Completed | In Progress | Blocked |
    | Developer A | 8 | 5 | 2 | 1 |
    | Developer B | 6 | 4 | 2 | 0 |
  And each developer name is clickable
  And clicking developer name filters task list to that person's tasks
```

---

## 6. Functional Requirements Catalogue

### Complete FR-ID Listing

| FR-ID | Category | Requirement | Priority | Status | BRD Ref | Testable |
|-------|----------|-----------|----------|--------|---------|----------|
| **FR-001** | Task Ops | Create tasks with title, description, priority, assignee, due date | **MUST** | Ready | FR-001 | ✅ |
| **FR-002** | Task Ops | Auto-generate and assign unique Task ID | **MUST** | Ready | FR-001 | ✅ |
| **FR-003** | Task Ops | Validate task title (required, max 255 chars) | **MUST** | Ready | FR-001 | ✅ |
| **FR-004** | Task Ops | Validate description (required, max 2000 chars) | **MUST** | Ready | FR-001 | ✅ |
| **FR-005** | Task Ops | Validate priority enum (Low, Medium, High) | **MUST** | Ready | FR-001 | ✅ |
| **FR-006** | Task Ops | Validate due date is in future (not past) | **MUST** | Ready | FR-001 | ✅ |
| **FR-007** | Task Ops | Set task status to "To Do" on creation | **MUST** | Ready | FR-001 | ✅ |
| **FR-008** | Assignment | Allow task assignment during creation | **MUST** | Ready | FR-002 | ✅ |
| **FR-009** | Assignment | Allow task reassignment to different user | **MUST** | Ready | FR-002 | ✅ |
| **FR-010** | Assignment | Validate assignee is active user (is_active=true) | **MUST** | Ready | FR-002 | ✅ |
| **FR-011** | Assignment | Send notification to new assignee on assignment | **MUST** | Ready | FR-002 | ✅ |
| **FR-012** | Assignment | Send notification to previous assignee on reassignment | **MUST** | Ready | FR-002 | ✅ |
| **FR-013** | Assignment | Maintain assignment history for audit | **MUST** | Ready | FR-002 | ✅ |
| **FR-014** | Assignment | Record assignment metadata (assigned_by, reason, timestamp) | **MUST** | Ready | FR-002 | ✅ |
| **FR-015** | Dependency | Support task-to-task dependencies (A depends on B) | **MUST** | Ready | FR-003 | ✅ |
| **FR-016** | Dependency | Enforce unidirectional dependencies | **MUST** | Ready | FR-003 | ✅ |
| **FR-017** | Dependency | Detect circular dependencies on creation | **MUST** | Ready | FR-003 | ✅ |
| **FR-018** | Dependency | Prevent task completion if dependencies incomplete | **MUST** | Ready | FR-003 | ✅ |
| **FR-019** | Dependency | Auto-apply Blocked status when dependency incomplete | **MUST** | Ready | FR-003 | ✅ |
| **FR-020** | Dependency | Auto-remove Blocked status when all dependencies complete | **MUST** | Ready | FR-003 | ✅ |
| **FR-021** | Dependency | Allow adding dependencies to existing task | **MUST** | Ready | FR-003 | ✅ |
| **FR-022** | Dependency | Allow removing dependencies from task | **MUST** | Ready | FR-003 | ✅ |
| **FR-023** | Dependency | Log dependency changes in audit trail | **MUST** | Ready | FR-003 | ✅ |
| **FR-024** | Status | Support status values: To Do, In Progress, Blocked, Completed | **MUST** | Ready | FR-004 | ✅ |
| **FR-025** | Status | Enfo State machine transitions (valid progressions only) | **MUST** | Ready | FR-004 | ✅ |
| **FR-026** | Status | Prevent manual unblocking (dependencies must be resolved) | **MUST** | Ready | FR-004 | ✅ |
| **FR-027** | Status | Auto-populate actual_completion date on Completed status | **MUST** | Ready | FR-004 | ✅ |
| **FR-028** | Status | Record status change history with timestamp and user | **MUST** | Ready | FR-004 | ✅ |
| **FR-029** | Status | Send notification on status changes | **MUST** | Ready | FR-004 | ✅ |
| **FR-030** | Status | Support status change by task assignee or creator | **MUST** | Ready | FR-004 | ✅ |
| **FR-031** | Filtering | Filter tasks by status (single and multiple) | **MUST** | Ready | FR-005 | ✅ |
| **FR-032** | Filtering | Filter tasks by priority (single and multiple) | **MUST** | Ready | FR-005 | ✅ |
| **FR-033** | Filtering | Filter tasks by assigned user | **MUST** | Ready | FR-005 | ✅ |
| **FR-034** | Filtering | Filter tasks by due date range | **MUST** | Ready | FR-005 | ✅ |
| **FR-035** | Filtering | Support cumulative filters (AND logic) | **MUST** | Ready | FR-005 | ✅ |
| **FR-036** | Filtering | Search tasks by title and description (case-insensitive) | **MUST** | Ready | FR-005 | ✅ |
| **FR-037** | Filtering | Return results in <2 seconds | **MUST** | Ready | FR-005 | ✅ |
| **FR-038** | Filtering | Support sorting by any column | **MUST** | Ready | FR-005 | ✅ |
| **FR-039** | Filtering | Allow saving filter configurations as named views | **SHOULD** | Ready | FR-005 | ✅ |
| **FR-040** | Filtering | Display result count showing matching/total tasks | **MUST** | Ready | FR-005 | ✅ |
| **FR-041** | Dashboard | Display total task count | **SHOULD** | Ready | FR-006 | ✅ |
| **FR-042** | Dashboard | Display task count by status (Completed, In Progress, Blocked, Pending) | **SHOULD** | Ready | FR-006 | ✅ |
| **FR-043** | Dashboard | Display percentage completion for each status | **SHOULD** | Ready | FR-006 | ✅ |
| **FR-044** | Dashboard | Show list of currently blocked tasks with reasons | **SHOULD** | Ready | FR-006 | ✅ |
| **FR-045** | Dashboard | Show overdue high-priority tasks warning | **SHOULD** | Ready | FR-006 | ✅ |
| **FR-046** | Dashboard | Display team workload distribution by developer | **SHOULD** | Ready | FR-006 | ✅ |
| **FR-047** | Dashboard | Auto-refresh dashboard every 30 seconds | **SHOULD** | Ready | FR-006 | ✅ |
| **FR-048** | Dashboard | Load dashboard in <1 second | **SHOULD** | Ready | FR-006 | ✅ |
| **FR-049** | Dashboard | Provide drill-down from dashboard to filtered task lists | **SHOULD** | Ready | FR-006 | ✅ |
| **FR-050** | Audit | Maintain complete task change history | **MUST** | Ready | FR-004 | ✅ |
| **FR-051** | Audit | Record user who made each change | **MUST** | Ready | FR-004 | ✅ |
| **FR-052** | Audit | Record timestamp of each change | **MUST** | Ready | FR-004 | ✅ |
| **FR-053** | Audit | Make audit log immutable (append-only) | **MUST** | Ready | NFR-008 | ✅ |
| **FR-054** | Permissions | Restrict task editing to creator or assignee | **MUST** | Ready | IS-001 | ✅ |
| **FR-055** | Permissions | Restrict reassignment to Team Lead or PM only | **MUST** | Ready | IS-003 | ✅ |
| **FR-056** | Permissions | Restrict dependency removal to Team Lead or PM only | **MUST** | Ready | IS-004 | ✅ |

---

## 7. Data Requirements & Validation Rules

### 7.1 Task Attributes Validation

#### Task ID

| Attribute | Constraint | Rule | Validation Method |
|-----------|-----------|------|------------------|
| **Task ID** | Auto-generated | Format: T-[sequential number], e.g., T-001, T-1234 | Generated by system; immutable after creation |
| | Uniqueness | Must be globally unique across all projects | Database unique constraint |
| | Immutability | Cannot be changed after task creation | Enforce in data layer |
| | Example | T-032, T-001, T-9999 | N/A |

#### Task Title

| Attribute | Constraint | Rule | Validation Method |
|-----------|-----------|------|------------------|
| **Title** | Required | Must be provided; system rejects empty or whitespace-only | Client-side + server-side validation |
| | Length | Minimum 3 characters, Maximum 255 characters | String length check |
| | Type | Text (Unicode allowed) | Type check in API |
| | Special Characters | Allowed: letters, numbers, spaces, hyphens, underscores, parentheses | Regex: `^[a-zA-Z0-9\s\-_()]+$` |
| | Example | "Implement Payment API", "Fix bug in user login" | N/A |

#### Task Description

| Attribute | Constraint | Rule | Validation Method |
|-----------|-----------|------|------------------|
| **Description** | Required | Must be provided; system rejects empty or whitespace-only | Client-side + server-side validation |
| | Min Length | Minimum 10 characters | String length check |
| | Max Length | Maximum 2000 characters | String length check |
| | Type | Text (markdown or plain text) | Type check |
| | Special Characters | All characters allowed including newlines | No special validation |
| | Example | "Develop RESTful API endpoints for payment processing including request validation and error handling" | N/A |

#### Priority

| Attribute | Constraint | Rule | Validation Method |
|-----------|-----------|------|------------------|
| **Priority** | Required | Must be one of: Low, Medium, High | Enum validation |
| | Default | If not specified during creation, defaults to Medium | Default value in code |
| | Case Sensitivity | Values are case-insensitive in API but stored normalized | Uppercase storage |
| | Valid Values | Exactly 3 options; no custom values | Hardcoded enum |
| | Example | "HIGH", "Medium", "low" (normalized to HIGH, MEDIUM, LOW) | N/A |

#### Status

| Attribute | Constraint | Rule | Validation Method |
|-----------|-----------|------|------------------|
| **Status** | Required | Must be one of: TO_DO, IN_PROGRESS, BLOCKED, COMPLETED | Enum validation |
| | Initial Value | On creation, must be "TO_DO" | Enforced in business logic |
| | Valid Transitions | Enforced state machine (see section 7.3) | State machine validation |
| | Auto-Assignment | "BLOCKED" status automatically applied if dependencies incomplete | Application logic |
| | Manual Override | "BLOCKED" status cannot be manually removed or changed | Enforce in PATCH handler |
| | Example | "TO_DO", "In Progress" → rejected; use normalized form | N/A |

#### Estimated Completion Date

| Attribute | Constraint | Rule | Validation Method |
|-----------|-----------|------|------------------|
| **Estimated Completion Date** | Required | Must be provided; cannot be empty | Required field validation |
| | Future Date | Must be greater than today's date (cannot be today or past) | Date comparison: `estimated_date > today` |
| | Format | ISO 8601 format: YYYY-MM-DD | Regex: `^\d{4}-\d{2}-\d{2}$` |
| | Timezone | Stored as UTC; user's timezone handled on UI | Server stores UTC |
| | Business Days | Can include weekends and holidays (no filtering) | No holiday calendar |
| | Example | "2026-03-20", "2026-12-31" | Invalid: "2026-03-08" (past), "03/20/2026" (wrong format) |

#### Actual Completion Date

| Attribute | Constraint | Rule | Validation Method |
|-----------|-----------|------|------------------|
| **Actual Completion Date** | Auto-Popul | Automatically set to today's date when task status changed to COMPLETED | Automatic in PATCH handler |
| | Immutable | Once set, cannot be modified by user | Read-only field after population |
| | Format | ISO 8601 format: YYYY-MM-DD | Same as estimated date |
| | Optional Until Completion | NULL/empty until task marked COMPLETED | NULL default |
| | Example | "2026-03-10" (set automatically on completion) | N/A |

#### Assigned User

| Attribute | Constraint | Rule | Validation Method |
|-----------|-----------|------|------------------|
| **Assigned To (User ID)** | Required | Must be valid user_id from USERS table | Foreign key constraint |
| | Active Status | User must have is_active = true | Check in business logic |
| | Existence | User must exist in system | Database query before assign |
| | Validation | System prevents assigning to inactive users | Enforce in assignment handler |
| | Search Capability | UI provides searchable list of active users only | Filter USERS where is_active=true |
| | Example | User UUID: "a1b2c3d4-e5f6-7890..." | Invalid: inactive user (rejected) |

### 7.2 Dependency Validation Rules

| Rule | Description | Check Point |
|------|-----------|-----------|
| **No Self-Dependencies** | Task cannot depend on itself (Task A → A) | Validation: if blocking_task_id == dependent_task_id, reject with error "Task cannot depend on itself" |
| **No Circular Dependencies** | DFS/BFS check: Task A → B → C → A (no cycles) | On ADD: Traverse dependency graph; if path found from blocking_task to dependent_task via existing dependencies, reject |
| **Unidirectional Only** | If A depends on B, then B does NOT depend on A | Validation: check if A has dependency on B; prevent B from getting dependency on A |
| **Dependency Existence** | Both tasks must exist | Check both task IDs exist in TASKS table before creating dependency |
| **No Duplicate Dependencies** | Cannot create the same dependency twice | Check for existing TASK_DEPENDENCIES row with same blocking_task_id and dependent_task_id |
| **Soft Delete** | Deleted dependencies have deleted_at timestamp | Use soft delete (deleted_at IS NOT NULL) when removing; include WHERE deleted_at IS NULL in queries |
| **Task Not Completed** | Cannot add dependencies to completed tasks | Validation: if task.status = COMPLETED, reject modification |

### 7.3 Status Transition State Machine

```
Valid Status Transitions:

TO_DO
├─→ IN_PROGRESS
├─→ COMPLETED (only if no blocking dependencies)
└─→ BLOCKED (automatic if dependencies incomplete)

IN_PROGRESS
├─→ TO_DO
├─→ COMPLETED (only if no blocking dependencies)
└─→ BLOCKED (automatic if dependencies incomplete)

BLOCKED
└─→ Cannot change manually; must resolve dependencies
   └─→ Once dependencies complete → TO_DO (automatic)

COMPLETED
└─→ Terminal state; no transitions allowed (immutable)

Invalid Transitions (Rejected):
- FROM any state TO itself (no-op)
- FROM BLOCKED TO any state manually (only automatic transition to TO_DO)
- FROM COMPLETED TO any other state
- FROM BLOCKED TO COMPLETED directly (must resolve dependencies)
```

Validation Logic:
```
function canTransitionStatus(currentStatus, newStatus, hasPendingDependencies) {
  // Cannot transition to same status
  if (currentStatus === newStatus) return false;
  
  // Completed is terminal
  if (currentStatus === COMPLETED) return false;
  
  // Cannot manually change BLOCKED status
  if (currentStatus === BLOCKED && newStatus !== BLOCKED) return false;
  
  // Cannot complete with pending dependencies
  if (newStatus === COMPLETED && hasPendingDependencies) return false;
  
  // Successful transitions
  return (currentStatus === TO_DO || currentStatus === IN_PROGRESS) &&
         (newStatus === TO_DO || newStatus === IN_PROGRESS || newStatus === COMPLETED);
}
```

---

## 8. Notification & Email Requirements

### 8.1 Notification Trigger Matrix

| Event | Trigger | Recipients | Content | Channel | Timing |
|-------|---------|-----------|---------|---------|--------|
| **Task Created & Assigned** | Task created with assigned_to != creator | New assignee | "Dev Team Lead assigned you task T-XXX: '[Title]'. Due: 2026-03-20. Priority: High. [View Task Link]" | In-app, Email | Immediate |
| **Task Reassigned** | Task assigned_to changed by Team Lead/PM | New assignee, Previous assignee | **New:** "[Reassigner] reassigned T-XXX to you. Reason: [reason]. [View Task Link]"  **Previous:** "Task T-XXX has been reassigned from you to [New Assignee]" | In-app, Email | Immediate |
| **Dependency Added** | New dependency created on task | Task assignee | "Task T-XXX now depends on T-051, T-052. Task marked as Blocked until dependencies complete. [View Dependencies]" | In-app, Email | Immediate |
| **Task Blocked by Dependency** | Task auto-blocked due to incomplete dependency | Task assignee | "Task T-XXX is Blocked. Blocking task(s): T-051 (Depends on: T-052). [View Blocking Task]" | In-app, Email | Immediate |
| **Task Unblocked** | Blocking dependency completed; task auto-unblocked | Task assignee | "Good news! Task T-051 is now complete. Your task T-XXX is no longer blocked. [View Task]" | In-app, Email | Immediate |
| **Status Changed to In Progress** | Task marked IN_PROGRESS by assignee | Task creator (if different), Team Lead, PM | "[Developer] started work on T-XXX: [Title]. [View Task]" | In-app, Dashboard notification | Immediate |
| **Status Changed to Completed** | Task marked COMPLETED by assignee | Task creator, Team Lead, PM, project watchers | "[Developer] completed T-XXX: [Title] on [date]. [View Task]" | In-app, Email, Dashboard | Immediate |
| **Task Overdue Alert** | System runs daily at 5 PM; discovers overdue task | Task assignee, Team Lead, PM | "ALERT: Task T-XXX '[Title]' is overdue by [N] days. Priority: [High]. Please update status. [View Task]" | In-app, Email | Daily at 5 PM |
| **High Priority Overdue** | High priority task 3+ days overdue | Task assignee, Team Lead, PM, Project Manager | "URGENT: Task T-XXX '[Title]' is [N] days overdue. Requires immediate action. [View Task]" | In-app, Email, SMS (PM only) | Daily at 8 AM & 4 PM |
| **Multiple Dependencies Pending** | Task has 3+ unresolved blocking dependencies | Task assignee | "Task T-XXX has multiple blocking dependencies. Current blockers: [count]. Review and address: [link]" | In-app | Once on creation + daily reminder |

### 8.2 Notification Content Templates

#### Template NT-001: Task Assignment Notification

**Subject:** You've been assigned task [T-XXX]

**Body:**
```
Hi [Assignee Name],

[Assigner Name] has assigned you a new task:

Task ID: T-XXX
Title: [Task Title]
Priority: [High/Medium/Low]
Due Date: [YYYY-MM-DD]
Assigned By: [Assigner Name]

Description:
[First 100 characters of description]...

[View Full Task] [Accept Assignment] [Discuss]

---
This is an automated notification from the Intelligent Task Management System.
```

---

#### Template NT-002: Task Dependency Blocked Notification

**Subject:** Task blocked: Waiting on T-XXX

**Body:**
```
Hi [Assignee Name],

Your task is currently blocked by an incomplete dependency:

Your Task: T-XXX - [Your Task Title]
Status: BLOCKED

Blocking Task:
- T-051 - [Blocking Task Title] (Status: In Progress)

You cannot proceed on T-XXX until T-051 is completed.

[View My Task] [View Blocking Task] [Contact Assignee of Blocking Task]

---
One or more of your tasks is blocked. This is an automated notification.
```

---

#### Template NT-003: Task Unblocked Notification

**Subject:** Good news: Your blocked task T-XXX is unblocked!

**Body:**
```
Hi [Assignee Name],

The task blocking your work has been completed!

Completed Task: T-051 - [Blocking Task Title]
Your Task: T-XXX - [Your Task Title]
New Status: TO_DO

You can now proceed with work on T-XXX.

[Go to Task] [Start Work]

---
Your task is no longer blocked. This is an automated notification.
```

---

#### Template NT-004: Task Reassignment Notification

**Subject:** Task T-XXX reassigned to [New Assignee Name]

**Body (To Previous Assignee):**
```
Hi [Previous Assignee Name],

Task T-XXX has been reassigned away from you.

Task: T-XXX - [Task Title]
New Assignee: [New Assignee Name]
Reassigned By: [Reassigner Name]
Reason: [Reason provided]

If you have ongoing work on this task, please wrap up and brief [New Assignee Name].

[View Task] [Contact New Assignee]

---
This is an automated notification about task reassignment.
```

**Body (To New Assignee):**
```
Hi [New Assignee Name],

[Reassigner Name] has reassigned a task to you.

Task: T-XXX - [Task Title]
Priority: [High/Medium/Low]
Due Date: [YYYY-MM-DD]
Reason for Reassignment: [Reason provided]
Previous Assignee: [Previous Assignee Name]

Description:
[First 150 characters]...

[View Full Task] [Acknowledge] [Ask Questions]

---
You've been assigned a task. This is an automated notification.
```

---

#### Template NT-005: Status Change Notification

**Subject:** Task [T-XXX] status changed to [IN PROGRESS/COMPLETED]

**Body:**
```
Hi [Recipient Name],

Task [T-XXX] status has been updated.

Task ID: T-XXX
Title: [Task Title]
New Status: [IN PROGRESS / COMPLETED]
Changed By: [Developer Name]
Changed At: [Date Time - Local TZ]

[View Task Details]

---
This is an automated notification about task status change.
```

---

### 8.3 Notification Delivery Preferences

- **In-App Notifications:** Real-time; displayed in notification bell icon; stored in database for 30 days
- **Email Notifications:** Sent immediately; can be disabled per user per notification type
- **SMS Notifications:** Only for URGENT events (high-priority overdue); Project Manager only; can be disabled
- **Digest Options:** Users can opt for daily or weekly digest instead of real-time (Phase 2)
- **Do Not Disturb:** Users can set quiet hours (e.g., 6 PM - 9 AM) for notifications

---

## 9. Error Handling & User-Facing Error Messages

### 9.1 Validation Errors

| Error Code | Scenario | User-Facing Message | Cause | Resolution |
|-----------|----------|-------------------|-------|-----------|
| **VAL-001** | Task title missing | "Task title is required. Please enter a title (3-255 characters)." | Empty title field | Enter task title |
| **VAL-002** | Task title too long | "Task title exceeds maximum length of 255 characters. Current: [count]. Please shorten." | Title > 255 chars | Reduce title length |
| **VAL-003** | Task title too short | "Task title must be at least 3 characters long. Current: [count]." | Title < 3 chars | Enter longer title |
| **VAL-004** | Description missing | "Task description is required. Please provide details (10-2000 characters)." | Description empty | Enter description |
| **VAL-005** | Description too long | "Description exceeds maximum length of 2000 characters. Current: [count]. Please shorten." | Description > 2000 | Shorten description |
| **VAL-006** | Invalid priority | "Invalid priority value. Please select from: Low, Medium, High." | Priority not in enum | Select from dropdown |
| **VAL-007** | Due date missing | "Due date is required. Please select a future date." | No date provided | Select date |
| **VAL-008** | Due date in past | "Due date must be in the future. You selected: [date]. Today is: [today]." | Selected date ≤ today | Pick future date |
| **VAL-009** | Invalid date format | "Invalid date format. Please use YYYY-MM-DD (e.g., 2026-03-20)." | Wrong format entered | Correct date format |
| **VAL-010** | Assignee missing | "Task assignee is required. Please select a team member." | No assignee selected | Select assignee from dropdown |

### 9.2 Assignment Errors

| Error Code | Scenario | User-Facing Message | Cause | Resolution |
|-----------|----------|-------------------|-------|-----------|
| **ASSIGN-001** | Assigning to inactive user | "Cannot assign task to [User Name]. This user is currently inactive. Select an active team member instead." | Target user is_active = false | Choose active user |
| **ASSIGN-002** | Assignee not found | "Selected user not found or no longer exists. Please select another team member." | User deleted since list loaded | Refresh and select again |
| **ASSIGN-003** | Cannot reassign to same user | "Task is already assigned to [User Name]. No changes made." | New assignee == current assignee | Select different assignee |
| **ASSIGN-004** | Insufficient permissions | "You don't have permission to reassign this task. Only Team Leads and Project Managers can reassign tasks." | User is Developer, not TL/PM | Contact Team Lead or PM |
| **ASSIGN-005** | Cannot re-assign completed task | "Cannot reassign completed tasks. Completed tasks are immutable." | Task status = COMPLETED | Contact manager if needed |

### 9.3 Dependency Errors

| Error Code | Scenario | User-Facing Message | Cause | Resolution |
|-----------|----------|-------------------|-------|-----------|
| **DEP-001** | Circular dependency | "Circular dependency detected. Task chain: [T-AAA] → [T-BBB] → [T-CCC] → [current task]. Circular dependencies create deadlocks and are not allowed." | Circular reference found | Remove or change dependency |
| **DEP-002** | Self-dependency | "A task cannot depend on itself. Please select a different task." | User selected current task as dependency | Pick different task |
| **DEP-003** | Duplicate dependency | "Task already depends on [Task ID]. Duplicate dependencies are not allowed." | Dependency already exists | Remove duplicate or cancel |
| **DEP-004** | Non-existent dependency | "Selected task [T-XXX] no longer exists or has been deleted." | Blocking task deleted | Select different task |
| **DEP-005** | Cannot modify completed task deps | "Cannot add or modify dependencies on completed tasks. Completed tasks are locked." | Task status = COMPLETED | Cannot modify completed task |
| **DEP-006** | Dependency still incomplete | "Cannot complete task. The following blocking tasks must be completed first: [T-051 (Status: In Progress), T-052 (Status: To Do)]" | Has incomplete dependencies | Complete blocking tasks |

### 9.4 Status Transition Errors

| Error Code | Scenario | User-Facing Message | Cause | Resolution |
|-----------|----------|-------------------|-------|-----------|
| **STATUS-001** | Invalid status change | "Cannot change task status from [Current] to [Requested]. Valid options from [Current]: [options]" | Not valid state transition | Select valid status |
| **STATUS-002** | Cannot unblock manually | "Cannot manually change Blocked task status. You must resolve the blocking dependencies: [list with links]. Task will automatically update when dependencies are complete." | User trying to change BLOCKED | Resolve dependencies |
| **STATUS-003** | Cannot revert completed task | "Completed tasks are immutable. You cannot change the status back. Contact a Project Manager if this must be overridden." | User trying to change COMPLETED status | Contact PM |
| **STATUS-004** | Task blocked, cannot complete | "Cannot mark task as Completed until blocking tasks are Completed. Blocking tasks: [T-051 (In Progress)]" | Dependencies incomplete | Complete dependencies first |

### 9.5 System Errors

| Error Code | Scenario | User-Facing Message | Cause | Resolution |
|-----------|----------|-------------------|-------|-----------|
| **SYS-001** | Database unavailable | "System error: Database connection failed. Please try again in a moment. If this persists, contact support@company.com" | DB connection issue | Retry; contact IT if continues |
| **SYS-002** | Authentication failed | "Session has expired. Please log in again." | User session expired | Re-authenticate |
| **SYS-003** | Permission denied | "You don't have permission to perform this action. Contact your Team Lead for access." | Insufficient permissions | Request elevated access |
| **SYS-004** | Service timeout | "Request took too long to complete. Please try again." | Query/request exceeded timeout | Retry; may indicate system load |
| **SYS-005** | Internal server error | "An unexpected error occurred. Error ID: [unique-id]. Please contact support@company.com and reference this ID." | Unhandled exception | Contact support with error ID |

### 9.6 Error Recovery Actions

Each error message should include:

1. **Clear description** of what went wrong
2. **Why** it happened (user-friendly explanation)
3. **How to fix** it (actionable next steps)
4. **Support contact** for unresolved issues

**Example Good Error Message:**
```
❌ Cannot mark task as Completed

Your task T-032 has 2 blocking tasks that aren't finished yet:
  • T-023: Database Schema Migration (Status: In Progress)
  • T-024: Performance Testing (Status: To Do)

Complete these blocking tasks first. We'll automatically update your task status when they're done.

[View Blocking Task | Contact Assignee]
```

**Example Bad Error Message:**
```
❌ Error: Cannot update status
```

---

## 10. UI/UX Requirements

### 10.1 Task List View

**Display Elements:**
- Sortable columns: Task ID, Title, Priority (icon), Status (badge), Assigned To, Due Date
- Row hover actions: View, Edit, Delete (for Team Lead/PM), Reassign (for TL/PM)
- Color coding: Priority (Red=High, Yellow=Medium, Green=Low), Status (Green=Completed, Blue=In Progress, Red=Blocked, Gray=To Do)
- Pagination: 50 tasks per page with navigation
- Bulk actions: Select multiple, reassign all, change priority, etc.
- Empty state: "No tasks assigned to you" with "Create Task" button

### 10.2 Task Creation/Edit Form

**Form Fields (Left-to-Right, Top-to-Bottom):**
1. Task Title (text input, required)
2. Description (textarea, required)
3. Priority (dropdown, required)
4. Assigned To (searchable user dropdown, required)
5. Estimated Completion Date (date picker, required)
6. Task Dependencies (multi-select, optional)
7. Action buttons: Create/Update, Cancel

### 10.3 Task Detail View

**Sections:**
1. **Header:** Task ID, Title, Priority indicator, Status badge
2. **Summary:** Description, Assignment, Due Date, Created Date
3. **Status Section:** Current status, History of changes (chronological)
4. **Dependencies Section:** Blocking tasks (if any), Blocked by tasks (if any)
5. **Activity Feed:** All changes, assignments, comments
6. **Action Panel:** Edit, Reassign (TL/PM), Change Status, Delete (TL/PM)

### 10.4 Dashboard View

- Responsive; mobile-friendly
- Real-time updates
- Click-to-drill-down capability
- Visual indicators (colors, icons, charts)
- Performance: <1 second load time

---

## 11. Reporting Requirements

### 11.1 Project Progress Report

**Report Name:** Project Progress Summary  
**Audience:** Project Manager, Team Lead  
**Frequency:** Real-time; auto-refresh every 30 seconds  
**Data Fields:**
- Total tasks, Completed (count + %), In Progress (count + %), Blocked (count + %), Pending (count + %)
- Blocked tasks list with blocking reason and days blocked
- Overdue high-priority tasks
- Team workload distribution (tasks per person)

### 11.2 Task Aging Report (Future)

**Report Name:** Task Age and Status  
**Scheduled:** Phase 2  
**Data Fields:** Task ID, Age, Current Status, Last Updated, Days in Current Status

### 11.3 Export Capability (Future)

**Planned:**
- Export task list to CSV
- Generate PDF project report
- Integration with reporting tools

---

## 12. Constraints & Assumptions

### 12.1 Constraints

| Constraint | Description | Impact |
|-----------|-----------|--------|
| **C-001** | Phase 1 limited to single project context | Multi-project support in Phase 2 |
| **C-002** | No user provisioning within Phase 1 | External directory (LDAP) required |
| **C-003** | No advanced reporting or custom queries | Standard reports only; analytics in Phase 2 |
| **C-004** | No third-party integrations in Phase 1 | Jira, DevOps, Slack integration in Phase 2 |
| **C-005** | English language only in Phase 1 | Internationalization in Phase 2 |
| **C-006** | No offline capability in Phase 1 | Connected usage required; mobile web only |
| **C-007** | No time tracking or resource leveling | Planned for Phase 2 |
| **C-008** | No collaboration tools (chat, comments) | Planned for Phase 2 |

### 12.2 Assumptions

| Assumption | Risk | Mitigation |
|-----------|------|-----------|
| **A-001** | Users have moderate computer literacy | Provide training; intuitive UI design |
| **A-002** | LDAP or directory service available | Mock authentication for dev/test |
| **A-003** | Max 50 concurrent users in Phase 1 | Scalability in Phase 2; monitor resource usage |
| **A-004** | Max 10K tasks per project | Performance testing at scale; index strategy |
| **A-005** | Users will maintain task data accurately | Governance practices; deprecation of stale tasks |
| **A-006** | Team prefers web over desktop app | Survey team; mobile-responsive design |
| **A-007** | Project lives 12+ months (audit retention) | Set policies; implement archival strategy |

---

## 13. Glossary

| Term | Definition |
|------|-----------|
| **Task** | Atomic unit of work with defined scope, owner, status, and completion date |
| **Task ID** | Unique identifier assigned by system (e.g., T-001) |
| **Assignee** | Team member responsible for completing a task |
| **Status** | Current state of task: To Do, In Progress, Blocked, or Completed |
| **Priority** | Relative urgency/importance: Low, Medium, or High |
| **Dependency** | Task relationship where one task cannot proceed until another completes |
| **Blocked Task** | Task unable to progress due to incomplete dependencies |
| **Circular Dependency** | Impossible cycle of dependencies (A→B→A); not allowed |
| **Status Transition** | Change of task status from one valid state to another |
| **State Machine** | Set of valid status transitions enforced by system |
| **Audit Trail** | Complete immutable record of all task changes and user actions |
| **Dashboard** | Real-time summary view of project progress by task status |
| **Workload Distribution** | Allocation of tasks across team members |
| **Overdue** | Task with estimated completion date in the past |

---

## 14. Document Control

| Item | Detail |
|------|--------|
| **Document Owner** | Functional Analyst / Requirements Lead |
| **Last Updated** | March 9, 2026 |
| **Status** | Approved for Development |
| **Review Cycle** | Quarterly or upon major requirement change |
| **Approved By** | Product Owner, Development Lead, QA Lead |
| **Distribution** | Development Team, QA Team, Product Manager, Project Manager |

---

**End of Functional Requirements Document**

This FRD is the definitive functional specification for testing, development, and UAT. Every acceptance criterion is independently testable; every requirement is independently implementable.
