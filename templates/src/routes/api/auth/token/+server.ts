import type { RequestHandler } from './$types';
import {  handleToken } from 'workos-convex-sveltekit';

export const GET: RequestHandler = handleToken();

