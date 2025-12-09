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
	external: ['svelte', 'convex', '@workos/authkit-sveltekit', '@sveltejs/kit'],
	outDir: 'dist',
	clean: true
});
