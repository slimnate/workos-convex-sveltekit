import { v } from 'convex/values';
import { MutationBuilder, QueryBuilder } from 'convex/server';


function userQueries(mutation: MutationBuilder<any, any>, query: QueryBuilder<any, any>) {
	return {
		/**
		 * Store or update user information from WorkOS identity.
		 * This is called whenever a user logs in to sync their data into the database.
		 */
		store: mutation({
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
		}),
		/**
		 * Get the current user from the database.
		 * This is called to get the user's data when they are logged in.
		 */
		getCurrentUser: query({
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
		}),
		/**
		 * Get a user by their WorkOS user ID.
		 */
		getUserById: query({
			args: { workosUserId: v.string() },
			handler: async (ctx, args) => {
				const user = await ctx.db
					.query('users')
					.withIndex('by_workos_user_id', (q) => q.eq('workosUserId', args.workosUserId))
					.unique();
		
				return user;
			}
		}),
		/**
		 * Get a user by their email.
		 */
		getUserByEmail: query({
			args: { email: v.string() },
			handler: async (ctx, args) => {
				const user = await ctx.db
					.query('users')
					.withIndex('by_email', (q) => q.eq('email', args.email))
					.unique();
		
				return user;
			}
		}),
		/**
		 * Get all users from the database.
		 */
		getAllUsers: query({
			args: {},
			handler: async (ctx) => {
				return await ctx.db.query('users').collect();
			}
		})
	}
}

export { userQueries};