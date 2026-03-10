/**
 * Repository / data-access layer entry point.
 *
 * Repositories encapsulate all interaction with the data store
 * (currently in-memory via `InMemoryStore`; PostgreSQL in Phase 2).
 *
 * Repositories are co-located with their resource module:
 *   src/api/v1/[resource]/[resource].repository.ts
 *
 * Planned repositories (to be added in upcoming sprints):
 *   - task.repository.ts
 *   - user.repository.ts
 *   - dependency.repository.ts
 *   - assignment.repository.ts
 *
 * @see src/storage/store.ts  — singleton in-memory data store
 */
export {};
