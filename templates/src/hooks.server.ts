import { env } from '$env/dynamic/private';
import { configureServerAuth, authKitHandle } from 'workos-convex-sveltekit';
import { api } from './convex/_generated/api';
import { PUBLIC_CONVEX_URL } from '$env/static/public';

// Configure AuthKit with SvelteKit's environment variables

configureServerAuth({
  workos: {
    clientId: env.WORKOS_CLIENT_ID as string,
    apiKey: env.WORKOS_API_KEY as string,
    redirectUri: env.WORKOS_REDIRECT_URI as string,
    cookiePassword: env.WORKOS_COOKIE_PASSWORD as string
  },
  convexUrl: PUBLIC_CONVEX_URL as string,
  api: api
});

export const handle = authKitHandle();