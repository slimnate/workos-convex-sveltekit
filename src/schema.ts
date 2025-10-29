import { v } from "convex/values";


// A reusable users table definition that host apps can spread into their schema
const userTable = {
    email: v.string(),
    name: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    profilePictureUrl: v.optional(v.string()),
    workosUserId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    lastSignInAt: v.optional(v.number()),
  };


export { userTable }