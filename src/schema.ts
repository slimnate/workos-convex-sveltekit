import { v } from "convex/values";
import { defineTable } from "convex/server";

// A reusable users table definition that host apps can spread into their schema
const userTable = defineTable({
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
})
  .index("by_email", ["email"])
  .index("by_workos_user_id", ["workosUserId"])
  .index("by_organization", ["organizationId"])

export { userTable }