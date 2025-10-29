import { handleSignOut } from 'workos-convex-sveltekit';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = handleSignOut();
