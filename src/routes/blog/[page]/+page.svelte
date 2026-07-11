<script lang="ts">
	import { Rss } from '@lucide/svelte';
	import Meta from '$lib/components/Meta.svelte';
	import BlogList from '$lib/components/BlogList.svelte';
	let { data } = $props();
</script>

<Meta title={`Blog · Page ${data.page}`} description="Writing and Today I Learned notes from Josh Thomas." path={`/blog/${data.page}/`} />
<header class="flex">
	<h1 class="sr-only">Blog page {data.page}</h1>
	<a class="group ml-auto flex items-center gap-1 underline-offset-4" href="/feeds/blog.xml"><Rss class="size-4 text-tokyonight-day-orange group-hover:text-inherit dark:text-tokyonight-moon-orange" aria-hidden="true" /> RSS</a>
</header>
<BlogList entries={data.entries} page={data.page} totalPages={data.totalPages} />
