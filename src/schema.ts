import { v as ConvexValues } from 'convex/values';
import { defineTable } from 'convex/server';

/**
 * Extend the users table with additional fields
 * @param v - The Convex values object
 * @param additionalFields - The additional fields to add to the users table
 * @returns The extended users table
 */
function extendUsers(v: typeof ConvexValues, additionalFields: Record<string, any>) {
	const defaultUsersFields = {
		email: v.string(),
		firstName: v.optional(v.string()),
		lastName: v.optional(v.string()),
		workosUserId: v.string(), // The WorkOS user ID (from identity.subject)
		organization: v.optional(v.string()),
		roles: v.optional(v.array(v.string())), // Application roles (e.g., ["admin", "bookings"])
		createdAt: v.number(),
		updatedAt: v.number(),
		lastSignInAt: v.optional(v.number()),
		profilePictureUrl: v.optional(v.string())
	};

	return applyIndicies(
		defineTable({
			...defaultUsersFields,
			...additionalFields
		})
	);
}

/**
 * A reusable users table definition that host apps can include in their schema
 * @param v - The Convex values object
 * @returns The users table
 */
function defaultUsers(v: typeof ConvexValues) {
	return extendUsers(v, {});
}

function applyIndicies(table: any) {
	return table.index('by_email', ['email']).index('by_workos_user_id', ['workosUserId']);
}

export { defaultUsers, extendUsers };
