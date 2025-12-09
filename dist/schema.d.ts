import { v } from 'convex/values';

/**
 * Extend the users table with additional fields
 * @param v - The Convex values object
 * @param additionalFields - The additional fields to add to the users table
 * @returns The extended users table
 */
declare function extendUsers(v: typeof v, additionalFields: Record<string, any>): any;
/**
 * A reusable users table definition that host apps can include in their schema
 * @param v - The Convex values object
 * @returns The users table
 */
declare function defaultUsers(v: typeof v): any;

export { defaultUsers, extendUsers };
