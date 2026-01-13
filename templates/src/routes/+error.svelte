<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	const errorStatus = page.error?.status || page.status;
	const errorMessage = page.error?.message;
</script>

<div class="bg-base-300 flex min-h-screen items-center justify-center">
	<div class="card bg-base-200 card-xl">
		<div class="card-body items-center text-center">
			<h2 class="text-base-content card-title">
				Error {errorStatus || 500}
			</h2>
			<p class="text-base-content mb-4">
				{errorMessage || 'An error occurred'}
			</p>
			<div class="card-actions justify-center">
				<button on:click={() => goto('/api/auth/logout')} class="btn btn-primary">Log Out</button>
			</div>
		</div>
	</div>
</div>
