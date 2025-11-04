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

