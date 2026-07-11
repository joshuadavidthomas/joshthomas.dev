<script lang="ts">
	import { CalendarDays } from '@lucide/svelte';
	import Meta from '$lib/components/Meta.svelte';
	let { data } = $props();
	const transitionName = $derived(`post-${data.entry.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`);
</script>

<Meta title={data.entry.title} description={data.entry.summary ?? data.entry.title} path={data.entry.url} type="article" updated={data.entry.date} />
<svelte:head>
	<link rel="preload" href="/static/fonts/monolisa-v2.015/0-normal.woff2" as="font" type="font/woff2" crossorigin="anonymous" />
	<link rel="preload" href="/static/fonts/monolisa-v2.015/1-italic.woff2" as="font" type="font/woff2" crossorigin="anonymous" />
</svelte:head>
<article class="prose grid max-w-none grid-container-2xl prose-pre:grid-bleed-7xl prose-a:hover:text-blue-500 xl:prose-xl dark:prose-invert">
	<header class="not-prose mb-8 max-w-2xl" style:view-transition-name={transitionName}>
		<h2 class="text-3xl tracking-tight text-gray-800 sm:text-4xl dark:text-gray-100">
			<span class="my-auto mr-3 text-tokyonight-day-teal dark:text-tokyonight-moon-teal">TIL</span>{@html data.entry.titleHtml}
		</h2>
		<time datetime={data.entry.date.slice(0, 10)} class="mt-4 flex items-baseline gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
			<CalendarDays class="size-4 text-gray-700 dark:text-gray-300" aria-hidden="true" />
			{new Date(data.entry.date).toLocaleDateString('en-US', { dateStyle: 'long', timeZone: 'UTC' })}
		</time>
	</header>
	{@html data.entry.html}
</article>
