import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { userQueries } from 'workos-convex-sveltekit/users';

const { store, getCurrentUser, getUserById, getAllUsers } = userQueries(mutation, query);
export { store, getCurrentUser, getUserById, getAllUsers };

/** Additional queries can be added here */


/** Example of adding and additional query to the users table

export const testUserFunction = query({
	args: {
    	testParam: v.string()
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('User not authenticated');
		}

		const user = await ctx.db.query('users').withIndex('by_workos_user_id', (q) => q.eq('workosUserId', identity.subject)).unique();
		if (!user) {
			throw new Error('User not found');
		}

		return args.testParam;
	}
});

*/