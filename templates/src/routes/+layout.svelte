<script lang="ts">
	import '../app.css';
	import { browser } from '$app/environment';
	import { configureClientAuth } from 'workos-convex-sveltekit';
	import { PUBLIC_CONVEX_URL } from '$env/static/public';

	configureClientAuth(browser, PUBLIC_CONVEX_URL as string);

	let { children } = $props();
</script>

{@render children?.()}
