/**
 * Top-level route aggregation.
 *
 * Route definitions live alongside their resource module:
 *   src/api/v1/[resource]/[resource].routes.ts
 *
 * They are registered in src/api/v1/routes.ts, which is then mounted
 * at /api/v1 inside src/app.ts.
 *
 * This file can be used for non-versioned routes (e.g. /metrics, /docs)
 * that sit outside the /api/v1 namespace.
 */
export {};
