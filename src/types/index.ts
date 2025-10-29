/**
 * Core types for WorkOS + Convex authentication
 */

import type { GenericId as Id } from 'convex/values';
import { FunctionReference } from 'convex/server';
import type { AuthKitAuth } from '@workos/authkit-sveltekit';
import type { RequestEvent } from '@sveltejs/kit';


/**
 * Custom auth handler type
 * 
 * @param T - The type of the event
 * @returns A promise that resolves to the type of the event
 */
type CustomAuthHandler<T> = (event: RequestEvent & { auth: AuthKitAuth }) => Promise<T>;

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
}

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
    }
  };
  convexUrl: string;
  workos: WorkOSConfig;
}

/**
 * WorkOS user type - represents the user data from WorkOS
 * 
 * @param object - The type of the object
 * @param id - The ID of the user
 * @param email - The email of the user
 * @param emailVerified - Whether the email is verified
 * @param profilePictureUrl - The profile picture URL of the user
 * @param firstName - The first name of the user
 * @param lastName - The last name of the user
 * @param lastSignInAt - The last sign in at timestamp
 * @param createdAt - The creation timestamp
 * @param updatedAt - The update timestamp
 * @param externalId - The external ID of the user
 * @param metadata - The metadata of the user
 */
type WorkOSUser = {
  object: 'user';
  id: string;
  email: string;
  emailVerified: boolean;
  profilePictureUrl: string | null;
  firstName: string | null;
  lastName: string | null;
  lastSignInAt: string | null;
  createdAt: string;
  updatedAt: string;
  externalId: string | null;
  metadata: Record<string, string>;
}

/**
 * Convex user type
 * 
 * @param _id - The ID of the user
 * @param _creationTime - The creation timestamp
 * @param workosUserId - The WorkOS user ID
 * @param email - The email of the user
 * @param firstName - The first name of the user
 * @param lastName - The last name of the user
 * @param profilePictureUrl - The profile picture URL of the user
 * @param createdAt - The creation timestamp
 * @param updatedAt - The update timestamp
 * @param lastSignInAt - The last sign in at timestamp
 */
type ConvexUser = {
  _id: Id<'users'>;
  _creationTime: number;
  workosUserId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profilePictureUrl?: string;
  createdAt: number;
  updatedAt: number;
  lastSignInAt: number;
}

export type {
  WorkOSUser,
  ConvexUser,
  CustomAuthHandler,
  AuthConfig,
  WorkOSConfig,
};






// /**
//  * User creation/update data
//  */
// export interface UserInput {
//   email: string;
//   firstName?: string;
//   lastName?: string;
//   profilePictureUrl?: string;
//   workosUserId: string;
// }

// /**
//  * Field mapping configuration for user data transformation
//  */
// export interface UserFieldMapping {
//   email: keyof WorkOSUser;
//   firstName?: keyof WorkOSUser;
//   lastName?: keyof WorkOSUser;
//   profilePictureUrl?: keyof WorkOSUser;
// }

// /**
//  * Default field mapping from WorkOS to Convex
//  */
// export const DEFAULT_FIELD_MAPPING: UserFieldMapping = {
//   email: 'email',
//   firstName: 'first_name',
//   lastName: 'last_name',
//   profilePictureUrl: 'profile_picture_url',
// };

// /**
//  * Configuration for user store function
//  */
// export interface UserStoreConfig {
//   fieldMapping?: Partial<UserFieldMapping>;
//   syncMode?: 'upsert' | 'create' | 'update';
// }

// /**
//  * User store result
//  */
// export interface UserStoreResult {
//   userId: Id<'users'>;
//   isNewUser: boolean;
// }

