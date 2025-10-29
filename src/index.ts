import type { AuthConfig, CustomAuthHandler } from "./types";
import type { RequestEvent } from "@sveltejs/kit";

import { authKit, configureAuthKit, authKitHandle } from "@workos/authkit-sveltekit";
import { redirect, json } from "@sveltejs/kit";
import { ConvexHttpClient } from "convex/browser";
import { setupConvex, useConvexClient, useQuery } from "convex-svelte";
import { v } from "convex/values";

// Globally scoped auth configuration
let authConfig: AuthConfig | undefined;

/**
 * Authenticated request handler. Wraps a request handler with authentication.
 */
function authenticatedRequest<T>(handler: CustomAuthHandler<T>) {
  return authKit.withAuth(async (event) => {
    const accessToken = event.auth.accessToken;
    const user = event.auth.user;

    if (!user) {
      throw redirect(302, "/auth/login");
    }

    if (!authConfig) {
      throw new Error("Auth not configured. Please call configureAuth first.");
    }

    // Sync user data to Convex on login
    if (accessToken) {
      const convexClient = new ConvexHttpClient(authConfig.convexUrl);
      convexClient.setAuth(accessToken);

      try {
        await convexClient.mutation(authConfig.api.users.store, {
          workosUserId: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePictureUrl: user.profilePictureUrl,
        });
      } catch (error) {
        console.error("Failed to sync user data:", error);
      }
    }

    return handler(event);
  });
}

/**
 * Configure server authentication. Use this in hooks.server.ts
 */
function configureServerAuth(config: AuthConfig) {
  authConfig = config;

  if (!authConfig) {
    throw new Error("Auth configuration not found");
  }
  if (!authConfig.api) {
    throw new Error("API not found");
  }
  if (!authConfig.api.users) {
    throw new Error("Users API not found");
  }

  configureAuthKit({
    clientId: config.workos.clientId,
    apiKey: config.workos.apiKey,
    redirectUri: config.workos.redirectUri,
    cookiePassword: config.workos.cookiePassword,
  });
}

/**
 * Configure client authentication. Use this in +layout.svelte
 */
function configureClientAuth(browser: boolean, convexUrl: string) {
  if (!convexUrl) {
    throw new Error("ConvexUrl must be provided to client auth configuration.");
  }

  setupConvex(convexUrl);

  if (browser) {
    const convex = useConvexClient();
    convex.setAuth(async () => {
      try {
        const response = await fetch("/api/auth/token");
        if (!response.ok) {
          return null;
        }
        const res = await response.json();
        if (!(res as { token: string }).token) {
          throw new Error("Token not found");
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
function handleToken() {
  return authKit.withAuth(async ({ auth }) => {
    if (!auth.user || !auth.accessToken) {
      return json({ token: null }, { status: 401 });
    }
    return json({ token: auth.accessToken });
  });
}

/**
 * Sign out handler for POST /api/auth/signout
 */
function handleSignOut() {
  return async (event: RequestEvent) => {
    return authKit.signOut(event);
  };
}

// Alias for authKit.handleCallback. Use in /api/auth/callback
const handleAuthCallback = authKit.handleCallback;

export {
  // Server utilities
  configureServerAuth,
  authenticatedRequest,
  handleToken,
  handleSignOut,
  authKitHandle,
  authKit,
  handleAuthCallback,
  // Client utilities
  configureClientAuth,
  useConvexClient,
  useQuery,
};
