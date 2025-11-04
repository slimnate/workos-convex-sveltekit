import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { userTable } from "workos-convex-sveltekit/schema";

export default defineSchema({
  users: userTable,

  public_data: defineTable({
    text: v.string(),
    userId: v.optional(v.string()),
  }),

  private_data: defineTable({
    text: v.string(),
    userId: v.optional(v.string()),
  }),
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