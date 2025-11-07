#!/usr/bin/env node
import { v } from 'convex/values';
import { defineTable } from 'convex/server';

var usersFields = {
  email: v.string(),
  name: v.optional(v.string()),
  firstName: v.optional(v.string()),
  lastName: v.optional(v.string()),
  workosUserId: v.string(),
  // The WorkOS user ID (from identity.subject)
  organizationId: v.optional(v.string()),
  organizationName: v.optional(v.string()),
  role: v.optional(v.string()),
  // Organization role (e.g., "admin", "member")
  createdAt: v.number(),
  updatedAt: v.number(),
  lastSignInAt: v.optional(v.number()),
  profilePictureUrl: v.optional(v.string())
};
var usersTable = applyIndicies(defineTable(usersFields));
function extendUsers(additionalFields) {
  return applyIndicies(defineTable({
    ...usersFields,
    ...additionalFields
  }));
}
function applyIndicies(table) {
  return table.index("by_email", ["email"]).index("by_workos_user_id", ["workosUserId"]).index("by_organization", ["organizationId"]);
}

export { extendUsers, usersTable };
//# sourceMappingURL=schema.js.map
//# sourceMappingURL=schema.js.map