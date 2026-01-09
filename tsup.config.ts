import { defineConfig } from 'tsup';

export default defineConfig({
	entry: {
		index: 'src/index.ts',
		cli: 'src/cli.ts',
		schema: 'src/schema.ts'
	},
	format: ['esm'],
	dts: true,
	sourcemap: true,
	treeshake: true,
	platform: 'node',
	external: [
		'svelte',
		'convex',
		'@workos/authkit-sveltekit',
		'@sveltejs/kit',
		'fs-extra',
		'fast-glob',
		'picocolors',
		'diff'
	],
	outDir: 'dist',
	clean: true
});
