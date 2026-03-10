/** Application-wide constants. */

/** Semantic version of the API. */
export const APP_VERSION = '1.0.0';

/** Human-readable application name used in logs and responses. */
export const APP_NAME = 'ITMS API';

/** URL prefix for all routes. */
export const API_PREFIX = '/api';

// ── Pagination defaults ────────────────────────────────────────────────────
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 500;

// ── Retry & security ───────────────────────────────────────────────────────
export const MAX_RETRY_ATTEMPTS = 3;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_SALT_ROUNDS = 12;

// ── Task constants ─────────────────────────────────────────────────────────
export const TASK_TITLE_MAX_LENGTH = 255;
export const TASK_DESCRIPTION_MAX_LENGTH = 2000;
