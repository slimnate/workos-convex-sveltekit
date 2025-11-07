import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

/**
 * Additional users table queries can be added here. Do not remove the store query, it is required to store the user's data into the users table.
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
		const existingUser = await ctx.db
			.query('users')
			.withIndex('by_workos_user_id', (q) => q.eq('workosUserId', args.workosUserId))
			.unique();

		const now = Date.now();

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
			await ctx.db.patch(existingUser._id, userData);
			return existingUser._id;
		}

		return await ctx.db.insert('users', {
			...userData,
			createdAt: now
		});
	}
});

export const getCurrentUser = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return null;
		}

		const user = await ctx.db
			.query('users')
			.withIndex('by_workos_user_id', (q) => q.eq('workosUserId', identity.subject))
			.unique();

		return user;
	}
});

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

export const getAllUsers = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query('users').collect();
	}
});
