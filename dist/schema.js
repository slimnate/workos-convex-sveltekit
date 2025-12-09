import { defineTable } from 'convex/server';

// src/schema.ts
function extendUsers(v, additionalFields) {
  const defaultUsersFields = {
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    workosUserId: v.string(),
    // The WorkOS user ID (from identity.subject)
    organization: v.optional(v.string()),
    roles: v.optional(v.array(v.string())),
    // Application roles (e.g., ["admin", "bookings"])
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
function defaultUsers(v) {
  return extendUsers(v, {});
}
function applyIndicies(table) {
  return table.index("by_email", ["email"]).index("by_workos_user_id", ["workosUserId"]);
}

export { defaultUsers, extendUsers };
//# sourceMappingURL=schema.js.map
//# sourceMappingURL=schema.js.map