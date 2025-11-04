import { v } from "convex/values";
import { defineTable, TableDefinition } from "convex/server";

const usersFields = {
  email: v.string(),
  name: v.optional(v.string()),
  firstName: v.optional(v.string()),
  lastName: v.optional(v.string()),
  workosUserId: v.string(), // The WorkOS user ID (from identity.subject)
  organizationId: v.optional(v.string()),
  organizationName: v.optional(v.string()),
  role: v.optional(v.string()), // Organization role (e.g., "admin", "member")
  createdAt: v.number(),
  updatedAt: v.number(),
  lastSignInAt: v.optional(v.number()),
  profilePictureUrl: v.optional(v.string()),
};

/**
 * A reusable users table definition that host apps can include into their schema
 */
const usersTable = applyIndicies(defineTable(usersFields));

/**
 * Extend the users table with additional fields
 * @param additionalFields - The additional fields to add to the users table
 * @returns The extended users table
 */
function extendUsers(additionalFields: Record<string, any>) {
  return applyIndicies(defineTable({
    ...usersFields,
    ...additionalFields,
  }));
}

function applyIndicies(table: TableDefinition) {
  return table.index("by_email", ["email"])
    .index("by_workos_user_id", ["workosUserId"])
    .index("by_organization", ["organizationId"]);
}

export { usersTable, extendUsers };
