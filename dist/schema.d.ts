import * as convex_values from 'convex/values';
import { TableDefinition } from 'convex/server';

/**
 * A reusable users table definition that host apps can include into their schema
 */
declare const usersTable: TableDefinition<convex_values.Validator<any, any, any>, {
    by_email: [string, "_creationTime"];
    by_workos_user_id: [string, "_creationTime"];
    by_organization: [string, "_creationTime"];
}, {}, {}>;
/**
 * Extend the users table with additional fields
 * @param additionalFields - The additional fields to add to the users table
 * @returns The extended users table
 */
declare function extendUsers(additionalFields: Record<string, any>): TableDefinition<convex_values.Validator<any, any, any>, {
    by_email: [string, "_creationTime"];
    by_workos_user_id: [string, "_creationTime"];
    by_organization: [string, "_creationTime"];
}, {}, {}>;

export { extendUsers, usersTable };
