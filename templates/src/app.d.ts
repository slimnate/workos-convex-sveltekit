// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

/// <reference types="@sveltejs/kit" />

declare global {
	namespace App {
		interface Locals {
			auth: import('@workos/authkit-sveltekit').AuthKitAuth;
		}
		interface Error {
			status?: number;
			message: string;
		}
	}
}

export {};
