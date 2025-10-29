import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

/**
 * Store or update user information from WorkOS identity.
 * This should be called whenever a user logs in to sync their data.
 */
export const store = mutation({
	args: {
		workosUserId: v.string(),
		email: v.string(),
		firstName: v.string(),
		lastName: v.string(),
		profilePictureUrl: v.string()
	},
	handler: async (ctx, args) => {
		// Check if we've already stored this user
		const existingUser = await ctx.db
			.query('users')
			.withIndex('by_workos_user_id', (q) => q.eq('workosUserId', args.workosUserId))
			.unique();

		const now = Date.now();

		// Helper to convert JSONValue to string or undefined
		const toString = (value: any): string | undefined => {
			return typeof value === 'string' ? value : undefined;
		};

		const userData = {
			email: args.email,
			firstName: args.firstName,
			lastName: args.lastName,
			workosUserId: args.workosUserId,
			profilePictureUrl: args.profilePictureUrl,
			lastSignInAt: now,
			updatedAt: now
		};

		if (existingUser !== null) {
			// Update existing user with latest WorkOS data
			await ctx.db.patch(existingUser._id, userData);
			return existingUser._id;
		}

		// Create new user from WorkOS identity
		return await ctx.db.insert('users', {
			...userData,
			createdAt: now
		});
	}
});

/**
 * Get the current authenticated user's profile.
 */
export const getCurrentUser = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return null;
		}

		// Get user from WorkOS ID
		const user = await ctx.db
			.query('users')
			.withIndex('by_workos_user_id', (q) => q.eq('workosUserId', identity.subject))
			.unique();

		return user;
	}
});

/**
 * Get a user by their WorkOS user ID.
 */
export const getUserById = query({
	args: { workosUserId: v.string() },
	handler: async (ctx, args) => {
		const user = await ctx.db
			.query('users')
			.withIndex('by_workos_user_id', (q) => q.eq('workosUserId', args.workosUserId))
			.unique();

		return user;
	}
});

/**
 * Get a user by their email.
 */
export const getUserByEmail = query({
	args: { email: v.string() },
	handler: async (ctx, args) => {
		const user = await ctx.db
			.query('users')
			.withIndex('by_email', (q) => q.eq('email', args.email))
			.unique();

		return user;
	}
});

/**
 * Get all users.
 */
export const getAllUsers = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query('users').collect();
	}
});