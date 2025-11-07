import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
	users: defineTable({
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
		profilePictureUrl: v.optional(v.string())
	})
		.index('by_email', ['email'])
		.index('by_workos_user_id', ['workosUserId'])
		.index('by_organization', ['organizationId'])
});

/**
 * Example of extending the users table with additional fields

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { extendUsers } from "workos-convex-sveltekit/schema";

export default defineSchema({
  users: extendUsers({
    extraField: v.string(),
  })
  .index("by_extra_field", ["extraField"]),

  public_data: defineTable({
    text: v.string(),
    userId: v.optional(v.string()),
  }),

  private_data: defineTable({
    text: v.string(),
    userId: v.optional(v.string()),
  }),
});

 */
