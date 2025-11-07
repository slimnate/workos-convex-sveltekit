import { FunctionReference } from 'convex/server';
import { AuthKitAuth, authKit, configureAuthKit } from '@workos/authkit-sveltekit';
import { RequestEvent } from '@sveltejs/kit';

/**
 * Core types for WorkOS + Convex authentication
 */

/**
 * Custom auth handler type
 *
 * @param T - The type of the event
 * @returns A promise that resolves to the type of the event
 */
type CustomAuthHandler<T> = (event: RequestEvent & {
    auth: AuthKitAuth;
}) => Promise<T>;
/**
 * WorkOS specific configuration
 *
 * @param clientId - WorkOS client ID
 * @param apiKey - WorkOS API key
 * @param redirectUri - WorkOS redirect URI
 * @param cookiePassword - WorkOS cookie password
 */
type WorkOSConfig = {
    clientId: string;
    apiKey: string;
    redirectUri: string;
    cookiePassword: string;
};
/**
 * Authentication configuration for WorkOS + Convex
 *
 * @param api - API configuration for users
 * @param convexUrl - Convex URL
 * @param workos - WorkOS configuration
 */
type AuthConfig = {
    api: {
        users: {
            store: FunctionReference<"mutation">;
            getCurrentUser: FunctionReference<"query">;
            getUserById: FunctionReference<"query">;
            getAllUsers: FunctionReference<"query">;
            getUserByEmail: FunctionReference<"query">;
        };
    };
    convexUrl: string;
    workos: WorkOSConfig;
};

/**
 * Authenticated request handler. Wraps a request handler with authentication.
 */
declare function authenticatedRequest<T>(authKitInstance: typeof authKit, handler: CustomAuthHandler<T>): (event: RequestEvent) => Promise<T>;
/**
 * Configure server authentication. Use this in hooks.server.ts
 */
declare function configureServerAuth(config: AuthConfig, authKitInstance: typeof authKit, configureAuthKit: typeof configureAuthKit): void;
/**
 * Configure client authentication. Use this in +layout.svelte
 */
declare function configureClientAuth(browser: boolean, convexUrl: string): void;
/**
 * Token endpoint handler for /api/auth/token
 */
declare function handleToken(authKitInstance: typeof authKit): (event: RequestEvent) => Promise<Response>;
/**
 * Sign out handler for POST /api/auth/signout
 */
declare function handleSignOut(authKitInstance: typeof authKit): (event: RequestEvent) => Promise<Response>;
/**
 * Sign in handler for GET /api/auth/signin
 * @param defaultReturnTo The default return to URL if no return to URL is provided in the query parameters. If neither is provided, the default return to URL is '/'.
 */
declare function handleSignIn(authKitInstance: typeof authKit, defaultReturnTo?: string): (event: RequestEvent) => Promise<never>;

export { authenticatedRequest, configureClientAuth, configureServerAuth, handleSignIn, handleSignOut, handleToken };
