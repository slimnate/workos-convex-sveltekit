# workos-convex-sveltekit

This library is designed to augment WorkOS AuthKit + Convex with built in user management functionality. It provides wrappers for some convex-svelte and @workos/authkit-sveltekit functions that keep the convex users database in sync with user data from AuthKit

## Table of Contents

- [Installation](#installation)
  - [Install npm package](#install-npm-package)
  - [Configure project](#configure-project)
    - [Configure WorkOS account](#configure-workos-account-adapted-from-convex-docs)
    - [Configure environment variables](#configure-environment-variables)
  - [Copy template files](#copy-template-files)
  - [Convex Deployment (dev)](#convex-deployment-dev)
- [Deployment](#deployment)
  - [Convex Deployment (prod)](#convex-deployment-prod)
  - [Environment Variables](#environment-variables)
  - [WorkOS Production Config](#workos-production-config)
- [Optional Configurations](#optional-configurations)
- [Usage](#usage)
  - [Schema Helpers Usage](#schema-helpers-usage)
  - [Library Exports](#library-exports)
  - [Client Setup (+layout.svelte)](#client-setup-layoutsvelte)
  - [Authenticating Server Routes](#authenticating-server-routes)
  - [Auth routes provided by the template](#auth-routes-provided-by-the-template)
  - [Using queries in pages](#using-queries-in-pages)
    - [Role check example](#role-check-example)
  - [Server actions](#server-actions)
  - [Best Practices](#best-practices)
- [CLI Options](#cli-options)
  - [Example](#example)
  - [Conflict Handling](#conflict-handling)
- [Development](#development)
  - [Project Structure](#project-structure)
  - [Linking locally (dev workflow)](#linking-locally-dev-workflow)
  - [Debugging](#debugging)
  - [Planned improvements](#planned-improvements)
- [License](#license)

# Installation
**Be sure to follow all the steps in the installation guide, see referenced documenation for more information.** The guide assumes you have a new or existing sveltekit project and that all commands are run from within that project directory.

## Install npm package
Convex and AuthKit dependencies:
```bash
npm install -S convex convex-svelte @workos-inc/node @workos/authkit-sveltekit
```

This package:
```bash
npm install workos-convex-sveltekit
```


## Configure project

Follow the steps below from the [Convex & WorkOS AuthKit](https://docs.convex.dev/auth/authkit/) documentation:

### Configure WorkOS account (adapted from [Convex docs](https://docs.convex.dev/auth/authkit/#configuring-an-existing-workos-account)):
- Sign up for an account at: [https://signin.workos.com/sign-up](https://signin.workos.com/sign-up)
- Enable AuthKit on your account
- Add callback endpoint during setup: `https://<domain>/api/auth/callback`
- Copy Client and API keys
- Enable CORS for your domain (eg. `https://localhost:5173` for development) in the [WorkOS Dashboard](https://dashboard.workos.com/environment/authentication/sessions)
- *[Optional]* Create a WorkOS Organization that your users will belong to. As of `v1.1.0` this package adds org based auth for authenticated routes. If you choose not to use org based authentication, leave the `WORKOS_ORGANIZATION_ID` env var unset.
- Set up custom JWT template. Navigate to [WorkOS Dashboard > Authentication > Sessions](https://dashboard.workos.com/environment/authentication/sessions) and add the following custom JWT template:
```json
   {
     "aud": "<your_workos_client_id>",
     "user_id": {{user.id}},
     "email": {{user.email}},
     "first_name": {{user.first_name}},
     "last_name": {{user.last_name}},
     "name": "{{user.first_name}} {{user.last_name}}",
     "email_verified": {{user.email_verified}},
     "org_id": {{organization.id}},
     "org_name": {{organization.name}},
     "org_role": {{organization_membership.role}}
   }
```
> **NOTE** We have to supply the workos client id here in the JWT response manually because the convex library expects our JWT to have the "aud" claim, which is not included by WorkOS by default.

### Configure environment variables:

Create `.env.local` with the following contents in the project root:
```
# WorkOS AuthKit Configuration
WORKOS_CLIENT_ID=<client_id>
WORKOS_API_KEY=<api_key>
WORKOS_REDIRECT_URI=http://localhost:5173/api/auth/callback
WORKOS_COOKIE_PASSWORD=<cookie_password>
WORKOS_ORGANIZATION_ID=<organization_id>
#
# Convex (public) URL
CONVEX_DEPLOYMENT=dev:convex-deployment-123
PUBLIC_CONVEX_URL=https://convex-deployment.convex.cloud
```

> **TIP** To generate a secure cookie password use: `openssl rand -base64 24`

> **SECURITY** Don't commit your secrets!!! Add `.env.local` to your `.gitignore`

## Copy template files

The library provides a CLI that automatically copies necessary files to your project. These files provide all the boilerplate needed for a basic Convex + WorkOS SvelteKit auth integration.

The CLI tool will prompt you to overwite, merge, or skip any conflicting files:

```bash
npx workos-convex-sveltekit copy
```

<details>
<summary>See all template files</summary>

- `src/convex/auth.config.ts`: Default authentication configuration for convex. Copied directly from the Convex Documentation
- `src/convex/users.ts` - Convex user query functions
- `src/convex/schema.ts` - Convex schema file
- `src/routes/api/auth/callback/+server.ts` - Handles the auth callback 
- `src/routes/api/auth/logout/+server.ts` - Handles logging the user out
- `src/routes/api/auth/token/+server.ts` - Returns a JWT token for the currently authenticated user
- `src/routes/+error.svelte` - Custom error page that displays sveltekit errors. Added to properly handle `403` org auth errors in version `1.1.0`
- `src/routes/+layout.svelte` - Base layout file that configures auth on the client
- `src/routes/admin/+layout.server.ts` - Example of how to use the authenticatedRoute to protect a specific route
- `src/hooks.server.ts` - SvelteKit server hooks to handle configuring auth
- `src/app.d.ts` -  Extended global types for SvelteKit
- `convex.json` -  Configure the convex directory to be inside `src`
</details>

<br/>

See [CLI Options](#cli-options) for more details about the CLI tool.

## Convex Deployment (dev)
You'll need to create a new convex deployment and configure it. Run the `npx convex dev` command and follow the prompts to either create or use an existing project. See [Convex Quickstart](https://docs.convex.dev/quickstart/svelte) and [Convex CLI docs](https://docs.convex.dev/cli) for more info on convex deployments.

After your convex deployment is created, visit the [Convex Dashboard](https://dashboard.convex.dev/) and add the `WORKOS_CLIENT_ID` environment variable

> On successful authentication, the library uses ConvexHttpClient and calls `users:store` convex function to upsert the current user in your `users` table. Existing `roles` are preserved; new users start with `roles: []`.


# Deployment

## Convex Deployment (prod)
To ensure that convex functions are deployed at build time, you'll need to add `npx convex codegen` to your build script:
```json
"scripts": {
    ...
    "build": "npx convex codegen && vite build",
    ...
}
```

Then ensure that your hosting/CI build command is set to `npx convex deploy --cmd 'npm run build'`

## Environment Variables
For production deployments, you need to configure some environment variables in convex and some in your production environment.

Required env vars in Convex:
- `WORKOS_CLIENT_ID`

Required env vars for production environment:
- `CONVEX_DEPLOY_KEY`
- `CONVEX_DEPLOYMENT`
- `PUBLIC_CONVEX_URL`
- `WORKOS_API_KEY`
- `WORKOS_CLIENT_ID`
- `WORKOS_COOKIE_PASSWORD`
- `WORKOS_REDIRECT_URI`

It is recommended to generate a separate cookie password for production deployments.


## WorkOS Production Config
Make sure that WorkOS is configured to accept CORS from your production domain: [Authentication > Sessions](https://dashboard.workos.com/authentication) > Cross-Origin Resource Sharing (CORS)

Ensure that your production callback url (eg. `https://<yourdomain>/api/auth/callback`) is configured under [Redirects](https://dashboard.workos.com/redirects)

## Optional Configurations
TODO: This section will outline some additional configurations that can be made in the WorkOS UI, and how to integrate them with this library.

# Usage
Once you have all the [Configuration](#configure-project) steps completed, you're ready to start using the library.

## Schema Helpers Usage
```ts
// src/convex/schema.ts
import { defineSchema } from 'convex/server';
import { v } from 'convex/values';
import { defaultUsers, extendUsers } from 'workos-convex-sveltekit/schema';

export default defineSchema({
  users: defaultUsers(v)
});

// Or extend with custom fields (+ you can chain your own indexes)
// users: extendUsers(v, { extraField: v.string() })
//   .index('by_extra_field', ['extraField'])
```
Notes:
- The helpers already apply indexes `by_email` and `by_workos_user_id`.
- No generics are required.

## Library Exports
```ts
// Server utilities
import {
  configureServerAuth,
  authenticatedRequest,
  handleToken,
  handleSignOut,
  handleSignIn,
} from 'workos-convex-sveltekit';

// Client utility
import { configureClientAuth } from 'workos-convex-sveltekit';

// Schema helpers
import { defaultUsers, extendUsers } from 'workos-convex-sveltekit/schema';
```

## Client Setup (+layout.svelte)
```svelte
<script lang="ts">
  import { browser } from '$app/environment';
  import { setupConvex, useConvexClient } from 'convex-svelte';
  import { configureClientAuth } from 'workos-convex-sveltekit';
  import { PUBLIC_CONVEX_URL } from '$env/static/public';

  configureClientAuth(setupConvex, useConvexClient, browser, PUBLIC_CONVEX_URL as string);
  let { children } = $props();
</script>

{@render children?.()}
```

## Authenticating Server Routes
You can authenticate a server route using the `authenticatedRequest` function in any `+layout.server.ts` file:

```ts
import type { LayoutServerLoad } from './$types';
import { authenticatedRequest } from 'workos-convex-sveltekit';
import { authKit } from '@workos/authkit-sveltekit';

export const load: LayoutServerLoad = authenticatedRequest(authKit, async ({ auth, url, locals }) => {
	const user = auth.user;

    //User is authenticated here

	return {
		user: user
	};
});
```

## Auth routes provided by the template
- `GET /api/auth/callback` (WorkOS callback)
- `GET /api/auth/token` (returns JWT via `handleToken`)
- `GET /api/auth/logout` (signs out via `handleSignOut`)

## Using queries in pages
In any `+page.svelte`, you can access the `useQuery()` or `convex.mutation()` functions in your svelte app. The template provides user queries in `src/convex/users.ts`:
 - `store` (mutation): upserts the current user on sign-in; preserves existing `roles`; initializes `roles: []` for new users; updates `lastSignInAt` and timestamps.
 - `getCurrentUser` (query): returns the current authenticated user or `null`.
 - `getUserById` (query): looks up a user by `workosUserId`.
 - `getUserByEmail` (query): looks up a user by email.
 - `getAllUsers` (query): returns all users.
 - `hasRole` (query): returns `true/false` if the current user has the provided role.
```svelte
<script lang="ts">
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '../convex/_generated/api';
	import UserLookup from '$lib/components/UserLookup.svelte';

	//Use the useQuery hook to query convex
	const queryResult = useQuery(api.data.somQuery, {});

	//Use the useConvexClient hook to get the convex client for mutations
	const convex = useConvexClient();

	let textInput = $state('');

	async function handleSubmit() {
		await convex.mutation(api.data.somMutation, { text: textInput });
		textInput = '';
	}
</script>

<div>
	<!-- Display results of query -->
	{#if queryResult.isLoading}
		<div class="loading">Loading...</div>
	{:else if queryResult.error}
		<div class="error">Error: {queryResult.error.message}</div>
	{:else if !queryResult.data || queryResult.data.length === 0}
		<div class="empty">No data here!</div>
	{:else}
		{#each queryResult.data as item, index}
			<div>item</div>
		{/each}
	{/if}
	
	<!-- Perform mutation -->
	<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="form">
		<input
			type="text"
			bind:value={textInput}
			placeholder="Enter some text..."
		/>
		<button type="submit">
			Add Public Data
		</button>
	</form>
</div>
```

### Role check example
```svelte
<script lang="ts">
  import { useQuery } from 'convex-svelte';
  import { api } from '../convex/_generated/api';

  const isAdmin = useQuery(api.users.hasRole, { role: 'admin' });
</script>
```

## Server actions
You can also use SvelteKits server actions
```ts
import { authenticatedRequest } from "workos-convex-sveltekit";
import { authKit } from "@workos/authkit-sveltekit";
import { api } from "../../convex/_generated/api.js";
import { PUBLIC_CONVEX_URL } from "$env/static/public";
import { ConvexHttpClient } from "convex/browser";

export const actions = {
    privateAction: authenticatedRequest(authKit, async ({auth, request}) => {
        const convex = new ConvexHttpClient(PUBLIC_CONVEX_URL);
        convex.setAuth(auth.accessToken as string);

        const result = await convex.query(api.users.getAllUsers, { });

        return { data: result };
    })
};
```

## Best Practices
These are some best practices that I have come up with
- Authorization inside your convex query/mutation functions. Limit client side trust as much as possible.

# CLI Options
The `workos-convex-sveltekit` CLI provides several options to control how files are copied and how conflicts are handled. These can be combined as needed.
| Option               | Alias   | Description                                                                                  | Default                   |
|----------------------|---------|----------------------------------------------------------------------------------------------|---------------------------|
| `--dest <path>`      |         | Destination directory for copied files                                                        | Current working directory |
| `--force`            |         | Overwrite conflicting files without prompting                                                | `false`                   |
| `--yes`              | `-y`    | Assume "yes" to all prompts (non-interactive). Combine with CI use                           | `false`                   |
| `--dry-run`          |         | Show planned actions (which files would be created, overwritten, or skipped), but make no changes | `false`                   |
| `--backup`           |         | When overwriting, create backups of existing files                                           | `false`                   |
| `--merge`            |         | Merge changes with Git-style conflict markers (for code files)                              | `false`                   |
| `--verbose`          | `-v`    | Print verbose output, including individual file actions                                      | `false`                   |
| `--help`             | `-h`    | Show usage help                                                                              |                           |
| `--version`          | `-V`    | Show CLI version                                                                             |                           |

### Example
```bash
npx workos-convex-sveltekit copy --dry-run --verbose
# or explicitly target the project root
npx workos-convex-sveltekit copy --dest . --dry-run --verbose
```
- This will show a summary of all file actions that would be taken, writing nothing.

```bash
# Merge conflicting files with Git-style conflict markers
npx workos-convex-sveltekit copy --merge
```
- This will merge conflicting code files using conflict markers, allowing you to manually resolve differences.
### Conflict Handling
- By default, if a destination file already exists and contents differ, you'll be shown a colorized diff and prompted for action (`overwrite`, `skip`, `backup`, `merge`, `overwrite all`, `skip all`, `merge all`).
- The `merge` option uses Git-style conflict markers (`<<<<<<< HEAD`, `=======`, `>>>>>>> template`) to combine existing and template content, allowing manual resolution. Merge works for code files (`.js`, `.ts`, `.jsx`, `.tsx`, `.svelte`, `.vue`, `.css`, `.scss`, `.html`, `.json`).
- Use `--backup` to always back up existing files before overwriting.

See the output of:
```bash
npx workos-convex-sveltekit --help
```
for a full list of options.

# Development

## Project Structure
```
workos-convex-sveltekit/
├── src/
│   ├── index.ts            # Main library exports
│   ├── schema.ts           # Schema helpers (exported as subpath)
│   ├── users.ts            # User management utilities
│   ├── cli.ts              # CLI tool (exported as command)
│   ├── cli/                # CLI implementation
│   │   ├── args.ts
│   │   ├── copy.ts
│   │   ├── log.ts
│   │   ├── paths.ts
│   │   └── prompts.ts
│   └── types/              # TypeScript type definitions
│       └── index.ts
├── templates/              # Files copied into consuming app
│   ├── convex.json         # Convex configuration
│   └── src/
│       ├── app.d.ts        # Extended global types for SvelteKit
│       ├── hooks.server.ts # SvelteKit server hooks
│       ├── convex/
│       │   ├── auth.config.ts
│       │   ├── schema.ts
│       │   └── users.ts
│       └── routes/
│           ├── +error.svelte
│           ├── +layout.svelte
│           ├── admin/
│           │   └── +layout.server.ts
│           └── api/
│               └── auth/
│                   ├── callback/
│                   │   └── +server.ts
│                   ├── logout/
│                   │   └── +server.ts
│                   └── token/
│                       └── +server.ts
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

```bash
# Build the library
npm run build

# Clean build artifacts
npm run clean
```

## Linking locally (dev workflow)

```bash
# In this repo
npm run build && npm link

# In your consuming app
npm link --save workos-convex-sveltekit
workos-convex-sveltekit copy --dry-run --verbose
```

## Debugging
To show debug messages set environment variable: `WORKOS_CONVEX_SVELTEKIT_DEBUG=true`

#### Planned improvements:
 - [ ] Look more into how profile images are handled and how we might allow users to change them and not have them re-written by workos syncing. Or maybe they can be updated through workos directly?
 - [x] Figure out how to get the users queries exported with proper typescript support, to avoid copying them all directly from the template. This will help with handling udpates where changes may be needed to the functionality of users queries.
 - [x] Add support for organizations, and role based authorization
 - [ ] 

## License

ISC