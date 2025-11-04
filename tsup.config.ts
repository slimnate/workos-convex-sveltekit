import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    schema: "src/schema.ts",
    cli: "src/cli.ts",
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  treeshake: true,
  external: [
    "svelte",
    "convex",
    "convex-svelte",
    "@workos/authkit-sveltekit",
    "@sveltejs/kit",
  ],
  outDir: "dist",
  clean: true,
  banner: { js: "#!/usr/bin/env node" },
});
