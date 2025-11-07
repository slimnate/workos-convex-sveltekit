#!/usr/bin/env node
import { redirect, json } from '@sveltejs/kit';
import { ConvexHttpClient } from 'convex/browser';
import { setupConvex, useConvexClient } from 'convex-svelte';
export { useConvexClient, useQuery } from 'convex-svelte';

var authConfig;
function authenticatedRequest(authKitInstance, handler) {
  return authKitInstance.withAuth(async (event) => {
    debug("authenticatedRequest", "called");
    const accessToken = event.auth.accessToken;
    const user = event.auth.user;
    if (!user) {
      throw redirect(302, "api/auth/login");
    }
    if (!authConfig) {
      throw new Error("Auth not configured. Please call configureAuth first.");
    }
    if (accessToken) {
      const convexClient = new ConvexHttpClient(authConfig.convexUrl);
      convexClient.setAuth(accessToken);
      try {
        await convexClient.mutation(authConfig.api.users.store, {
          workosUserId: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePictureUrl: user.profilePictureUrl
        });
      } catch (error) {
        console.error("Failed to sync user data:", error);
      }
    }
    return handler(event);
  });
}
function configureServerAuth(config, authKitInstance, configureAuthKit) {
  authConfig = config;
  debug("configureServerAuth", "called");
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
    cookiePassword: config.workos.cookiePassword
  });
}
function configureClientAuth(browser, convexUrl) {
  debug("configureClientAuth", `browser=${browser} convexUrl=${convexUrl}`);
  if (!convexUrl) {
    throw new Error("ConvexUrl must be provided to client auth configuration.");
  }
  setupConvex(convexUrl);
  debug("configureClientAuth", `setupConvex ${convexUrl}`);
  if (browser) {
    debug("configureClientAuth", "setting up convex client");
    const convex = useConvexClient();
    debug("configureClientAuth", "convex client initialized");
    convex.setAuth(async () => {
      try {
        debug("configureClientAuth", "fetching token");
        const response = await fetch("/api/auth/token");
        debug("configureClientAuth", `token response ok=${response.ok}`);
        if (!response.ok) {
          return null;
        }
        const res = await response.json();
        debug("configureClientAuth", "token response parsed");
        if (!res.token) {
          throw new Error("Token not found");
        }
        return res.token;
      } catch (error) {
        return null;
      }
    });
  }
}
function handleToken(authKitInstance) {
  debug("handleToken", "called");
  return authKitInstance.withAuth(async ({ auth }) => {
    debug("handleToken", `auth present user=${Boolean(auth.user)} token=${Boolean(auth.accessToken)}`);
    if (!auth.user || !auth.accessToken) {
      return redirect(302, "/api/auth/login");
    }
    debug("handleToken", "returning token");
    return json({ token: auth.accessToken });
  });
}
function handleSignOut(authKitInstance) {
  debug("handleSignOut", "called");
  return authKitInstance.withAuth(async (event) => {
    debug("handleSignOut", `auth present user=${Boolean(event.auth.user)} token=${Boolean(event.auth.accessToken)}`);
    if (!event.auth.user || !event.auth.accessToken) {
      return redirect(302, "/api/auth/login");
    }
    debug("handleSignOut", "signing out");
    return authKitInstance.signOut(event);
  });
}
function handleSignIn(authKitInstance, defaultReturnTo = "/") {
  debug("handleSignIn", `called defaultReturnTo=${defaultReturnTo}`);
  if (!authKitInstance) {
    throw new Error("AuthKit instance not found");
  }
  return async (event) => {
    const returnTo = event.url.searchParams.get("return_to") || defaultReturnTo;
    debug("handleSignIn", `returnTo=${returnTo}`);
    const signInUrl = await authKitInstance.getSignInUrl({
      returnTo
    });
    return redirect(302, signInUrl);
  };
}
function debug(func, message) {
  console.log(`[DEBUG] ${func}: ${message}`);
}

export { authenticatedRequest, configureClientAuth, configureServerAuth, handleSignIn, handleSignOut, handleToken };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map