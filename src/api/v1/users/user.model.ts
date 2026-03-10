/**
 * Represents a user record stored in the system.
 */
export interface UserModel {
  /** Unique user identifier (format: usr_xxxxx) */
  id: string;

  /** User's email address (unique) */
  email: string;

  /** User's first name */
  firstName: string;

  /** User's last name */
  lastName: string;

  /** Hashed password — never exposed in responses */
  password: string;

  /** User's role in the system */
  role: 'user' | 'admin';

  /** Whether the user account is active */
  isActive: boolean;

  /** ISO 8601 timestamp of account creation */
  createdAt: string;

  /** ISO 8601 timestamp of last update */
  updatedAt: string;
}
