import { handleSignOut } from 'workos-convex-sveltekit';
import type { RequestHandler } from '@sveltejs/kit';
import { authKit } from '@workos/authkit-sveltekit';

export const GET: RequestHandler = handleSignOut(authKit);
