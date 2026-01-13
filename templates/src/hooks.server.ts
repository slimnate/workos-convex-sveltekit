// Note from WorkOS: For simpler setups where you're using process.env, you can skip the configureAuthKit call and the SDK will automatically read from process.env.
import { HandleServerError } from '@sveltejs/kit';

import { env } from '$env/dynamic/private';
import { configureAuthKit, authKitHandle } from '@workos/authkit-sveltekit';
import { configureServerAuth } from 'workos-convex-sveltekit';
import { api } from './convex/_generated/api';
import { PUBLIC_CONVEX_URL } from '$env/static/public';

// Configure AuthKit with SvelteKit's environment variables

configureServerAuth(
	{
		workos: {
			clientId: env.WORKOS_CLIENT_ID as string,
			apiKey: env.WORKOS_API_KEY as string,
			redirectUri: env.WORKOS_REDIRECT_URI as string,
			cookiePassword: env.WORKOS_COOKIE_PASSWORD as string,
			organizationId: env.WORKOS_ORGANIZATION_ID as string
		},
		convexUrl: PUBLIC_CONVEX_URL as string,
		api: api
	},
	configureAuthKit
);

export const handle = authKitHandle();

// Handle errors that occur during server-side rendering or in load functions
export const handleError: HandleServerError = ({ error, event, status, message }) => {
	// Log the error for debugging
	console.error('Server error:', {
		error,
		status,
		message,
		url: event.url.pathname,
		timestamp: new Date().toISOString()
	});

	return {
		message: (error as any)?.body?.message || message || 'An error occurred',
		status: ((error as any)?.status as number) || status || 500
	};
};
