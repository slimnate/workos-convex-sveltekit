import type { RequestHandler } from './$types';
import { authKit } from '@workos/authkit-sveltekit';
import { handleToken } from 'workos-convex-sveltekit';

export const GET: RequestHandler = handleToken(authKit);
