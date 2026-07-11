<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head
	><title>{page.status === 404 ? 'Page not found' : 'Something went wrong'} · Josh Thomas</title
	></svelte:head
>
<section class="py-24 text-center">
	<p class="text-sm font-semibold">{page.status}</p>
	<h1 class="mt-2 text-4xl font-bold">
		{page.status === 404 ? 'Page not found' : 'Something went wrong'}
	</h1>
	<p class="mt-4 text-gray-600 dark:text-gray-300">
		{page.error?.message ?? 'The requested page could not be loaded.'}
	</p>
	<a class="mt-8 inline-block" href="/">Return home</a>
</section>
