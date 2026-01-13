import type { AuthConfig, CustomAuthHandler } from './types';
import type { RequestEvent } from '@sveltejs/kit';
import {
	authKit as AuthKit,
	configureAuthKit as ConfigureAuthKit
} from '@workos/authkit-sveltekit';

import { redirect, json, error } from '@sveltejs/kit';
import { ConvexHttpClient } from 'convex/browser';
import process from 'process';

// Globally scoped auth configuration
let authConfig: AuthConfig | undefined;

/**
 * Authenticated request handler. Wraps a request handler with authentication.
 */
function authenticatedRequest<T>(authKitInstance: typeof AuthKit, handler: CustomAuthHandler<T>) {
	return authKitInstance.withAuth(async (event) => {
		debug('authenticatedRequest', 'called');
		const accessToken = event.auth.accessToken;
		const user = event.auth.user;
		const organizationId = event.auth.organizationId;
		const expectedOrganizationId = authConfig.workos.organizationId;

		if (!authConfig) {
			throw new Error('Auth not configured. Please call configureAuth first.');
		}

		if (!user) {
			throw redirect(302, 'api/auth/login');
		}

		debug(
			'authenticatedRequest',
			`organizationId=${organizationId} authConfig.workos.organizationId=${authConfig.workos.organizationId}`
		);

		if (expectedOrganizationId && organizationId !== expectedOrganizationId) {
			throw error(403, 'You do not have access to this organization');
		}

		// Sync user data to Convex on login
		if (accessToken) {
			const convexClient = new ConvexHttpClient(authConfig.convexUrl);
			convexClient.setAuth(accessToken);

			try {
				await convexClient.mutation(authConfig.api.users.store, {
					workosUserId: user.id,
					organizationId: organizationId,
					email: user.email,
					firstName: user.firstName,
					lastName: user.lastName,
					profilePictureUrl: user.profilePictureUrl
				});
			} catch (error) {
				console.error('Failed to sync user data:', error);
			}
		}

		return handler(event);
	});
}

/**
 * Configure server authentication. Use this in hooks.server.ts
 */
function configureServerAuth(config: AuthConfig, configureAuthKit: typeof ConfigureAuthKit) {
	authConfig = config;

	debug('configureServerAuth', 'called');
	if (!authConfig) {
		throw new Error('Auth configuration not found');
	}
	if (!authConfig.api) {
		throw new Error('API not found');
	}
	if (!authConfig.api.users) {
		throw new Error('Users API not found');
	}
	if (process.env.WORKOS_CONVEX_SVELTEKIT_DEBUG) {
		authConfig.debug = true;
	}

	configureAuthKit({
		clientId: config.workos.clientId,
		apiKey: config.workos.apiKey,
		redirectUri: config.workos.redirectUri,
		cookiePassword: config.workos.cookiePassword
	});
}

/**
 * Configure client authentication. Use this in +layout.svelte
 */
function configureClientAuth(
	setupConvex: Function,
	useConvexClient: Function,
	browser: boolean,
	convexUrl: string
) {
	debug('configureClientAuth', `browser=${browser} convexUrl=${convexUrl}`);
	if (!convexUrl) {
		throw new Error('ConvexUrl must be provided to client auth configuration.');
	}

	setupConvex(convexUrl);
	debug('configureClientAuth', `setupConvex ${convexUrl}`);

	if (browser) {
		debug('configureClientAuth', 'setting up convex client');
		const convex = useConvexClient();
		debug('configureClientAuth', 'convex client initialized');
		convex.setAuth(async () => {
			try {
				debug('configureClientAuth', 'fetching token');
				const response = await fetch('/api/auth/token');
				debug('configureClientAuth', `token response ok=${response.ok}`);
				if (!response.ok) {
					return null;
				}
				const res = await response.json();
				debug('configureClientAuth', 'token response parsed');
				if (!(res as { token: string }).token) {
					throw new Error('Token not found');
				}
				return (res as { token: string }).token;
			} catch (error) {
				return null;
			}
		});
	}
}

/**
 * Token endpoint handler for /api/auth/token
 */
function handleToken(authKitInstance: typeof AuthKit) {
	debug('handleToken', 'called');
	return authKitInstance.withAuth(async ({ auth }) => {
		debug(
			'handleToken',
			`auth present user=${Boolean(auth.user)} token=${Boolean(auth.accessToken)}`
		);
		if (!auth.user || !auth.accessToken) {
			return redirect(302, '/api/auth/login');
		}
		debug('handleToken', 'returning token');
		return json({ token: auth.accessToken });
	});
}

/**
 * Sign out handler for POST /api/auth/signout
 */
function handleSignOut(authKitInstance: typeof AuthKit) {
	debug('handleSignOut', 'called');
	return authKitInstance.withAuth(async (event) => {
		debug(
			'handleSignOut',
			`auth present user=${Boolean(event.auth.user)} token=${Boolean(event.auth.accessToken)}`
		);
		if (!event.auth.user || !event.auth.accessToken) {
			return redirect(302, '/api/auth/login');
		}
		debug('handleSignOut', 'signing out');
		return authKitInstance.signOut(event as RequestEvent);
	});
}

/**
 * Sign in handler for GET /api/auth/signin
 * @param defaultReturnTo The default return to URL if no return to URL is provided in the query parameters. If neither is provided, the default return to URL is '/'.
 */
function handleSignIn(authKitInstance: typeof AuthKit, defaultReturnTo: string = '/') {
	debug('handleSignIn', `called defaultReturnTo=${defaultReturnTo}`);
	if (!authKitInstance) {
		throw new Error('AuthKit instance not found');
	}

	return async (event: RequestEvent) => {
		const returnTo = (event.url.searchParams.get('return_to') as string) || defaultReturnTo;
		debug('handleSignIn', `returnTo=${returnTo}`);
		const signInUrl = await authKitInstance.getSignInUrl({
			returnTo: returnTo
		});
		return redirect(302, signInUrl);
	};
}

/**
 * Debug function. Use this to log debug messages.
 * @param func The function name.
 * @param message The message to log.
 */
function debug(func: string, message: string) {
	if (authConfig?.debug) {
		console.log(`[DEBUG|workos-convex-sveltekit] ${func}: ${message}`);
	}
}

export {
	// Server utilities
	configureServerAuth,
	authenticatedRequest,
	handleToken,
	handleSignOut,
	handleSignIn,
	// Client utilities
	configureClientAuth
};
