# workos-convex-sveltekit

This library is designed to augment WorkOS AuthKit + Convex with built in user management functionality. It provides wrappers for some convex-svelte and @workos/authkit-sveltekit functions that keep the convex users database in sync with user data from AuthKit

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
- Set up custom JWT template. Navigate to [WorkOS Dashboard > Authentication > Sessions](https://dashboard.workos.com/environment/authentication/sessions) and add the folowing custom JWT template:
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
```

> **NOTE** To generate a secure cookie password use: `openssl rand -base64 24`
> **NOTE** Remember to add .env.local to your .gitignore

## Copy template files

The library provides a CLI that automatically copies necessary files to your project. These files provide all the boilerplate needed for a basic Convex + WorkOS SvelteKit auth integration. If you are implementing into an existing project, you may need to manually merge the files.

- `src/convex/auth.config.ts`: Default authentication configuration for convex. Copied directly from the Convex Documentation
- `src/convex/users.ts` - Convex user query functions
- `src/convex/schema.ts` - Convex schema file
- `src/routes/api/auth/callback/+server.ts` - Handles the auth callback 
- `src/routes/api/auth/logout/+server.ts` - Handles logging the user out
- `src/routes/api/auth/token/+server.ts` - Returns a JWT token for the currently authenticated user
- `src/routes/+layout.svelte` - Base layout file that configures auth on the client
- `src/routes/admin/+layout.server.ts` - Example of how to use the authenticatedRoute to protect a specific route
- `src/hooks.server.ts` - SvelteKit server hooks to handle configuring auth
- `src/app.d.ts` -  Extended global types for SvelteKit
- `convex.json` -  Configure the convex directory to be inside `src`

You can inspect and modify these files as needed after copying. All files preserve your existing code if conflicts are found - interactive diff and prompt are shown before any overwrite.

```bash
npx workos-convex-sveltekit copy
```

See [CLI Options](#cli-options) for more details about the CLI tool.

## Configure convex deployment
You'll need to create a new convex deployment and configure it. Run the `npx convex dev` command and follow the prompts to either create or use and existing project. Then follow the steps to configure the `WORKOS_CLIENT_ID` in the convex dashboard.

## Optional configurations
TODO: This section will outline some additional configurations that can be made in the WorkOS UI, and how to integrate them with this library.

# Usage
Once you have all the [Configuration](#configure-project) steps completed, you're ready to start using the library.

## Authenticating server routes
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

## Using queries in pages
In any `+page.svelte`, you can access the `useQuery()` or `convex.mutation()` functions in your svelte app:
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

# Deployment
When deploying besure to include all the WorkOS environment variables for the build.

# CLI Options
The `workos-convex-sveltekit` CLI provides several options to control how files are copied and how conflicts are handled. These can be combined as needed.
| Option               | Alias   | Description                                                                                  | Default                   |
|----------------------|---------|----------------------------------------------------------------------------------------------|---------------------------|
| `--dest <path>`      |         | Destination directory for copied files                                                        | Current working directory |
| `--force`            |         | Overwrite conflicting files without prompting                                                | `false`                   |
| `--yes`              | `-y`    | Assume "yes" to all prompts (non-interactive). Combine with CI use                           | `false`                   |
| `--dry-run`          |         | Show planned actions (which files would be created, overwritten, or skipped), but make no changes | `false`                   |
| `--backup`           |         | When overwriting, create backups of existing files                                           | `false`                   |
| `--verbose`          | `-v`    | Print verbose output, including individual file actions                                      | `false`                   |
| `--help`             | `-h`    | Show usage help                                                                              |                           |
| `--version`          | `-V`    | Show CLI version                                                                             |                           |

### Example
```bash
npx workos-convex-sveltekit copy --dest ./src --dry-run --verbose
```
- This will show a summary of all file actions that would be taken, writing nothing.
### Conflict Handling
- By default, if a destination file already exists and contents differ, you'll be shown a colorized diff and prompted for action (`overwrite`, `skip`, `backup`, `overwrite all`, `skip all`).
- To automate in CI or non-interactive use, use `--force` or `--yes` to skip prompts and automatically overwrite conflicting files.
- Use `--backup` to always back up existing files before overwriting.

See the output of:
```bash
npx workos-convex-sveltekit --help
```
for a full list of options.

# Development

#### Planned improvements:
 - [ ] Look more into how profile images are handled and how we might allow users to change them and not have them re-written by workos syncing. Or maybe they can be updated through workos directly?
 - [ ] Figure out how to get the users queries exported with proper typescript support, to avoid copying them all directly from the template. This will help with handling udpates where changes may be needed to the fucntionality of users queries.
 - [ ] Add support for organizations, and role based authorization
 - [ ] 

## Project Structure

```
workos-convex-sveltekit/
├── src/
│   ├── index.ts            # Main library exports
│   ├── schema.ts           # Schema helpers (exported as subpath)
│   ├── cli.ts              # CLI tool (exported as command)
│   └── cli/                # CLI implementation
│       ├── args.ts
│       ├── copy.ts
│       ├── log.ts
│       ├── paths.ts
│       └── prompts.ts
├── templates/              # Files copied into consuming app
│   └── src/...
├── dist/                   # Build output
└── package.json
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

## License

ISC