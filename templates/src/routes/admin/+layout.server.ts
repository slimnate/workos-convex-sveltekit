import type { LayoutServerLoad } from './$types';
import { authenticatedRequest } from 'workos-convex-sveltekit';
import { authKit } from '@workos/authkit-sveltekit';

export const load: LayoutServerLoad = authenticatedRequest(
	authKit,
	async ({ auth, url, locals }) => {
		const user = auth.user;

		return {
			user: user
		};
	}
);
