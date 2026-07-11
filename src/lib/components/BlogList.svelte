<script lang="ts">
	import { CalendarDays } from '@lucide/svelte';
	import type { Entry } from '$lib/server/content';
	type Props = { entries: Entry[]; page: number; totalPages: number };
	let { entries, page, totalPages }: Props = $props();
	const format = (date: string) =>
		new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(
			new Date(date)
		);
	const transitionName = (title: string) =>
		`post-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
</script>

<div class="mt-4 space-y-12">
	{#each entries as entry (entry.url)}
		<article
			class="group relative"
			style:view-transition-name={transitionName(entry.title)}
			data-entry-type={entry.type}
		>
			<time
				datetime={entry.date.slice(0, 10)}
				class="flex items-baseline gap-2 text-xs text-gray-600 dark:text-gray-200 {entry.type === 'post' ? 'sm:text-sm' : 'sm:text-xs'}"
			>
				<CalendarDays
					class="text-gray-700 dark:text-gray-300 {entry.type === 'post'
						? 'size-3 sm:size-4'
						: 'size-2 sm:size-3'}"
					aria-hidden="true"
				/>
				{format(entry.date)}
			</time>
			{#if entry.type === 'post'}
				<h2 class="mt-2 text-xl/6 font-semibold sm:text-2xl/7">
					<a href={entry.url}><span class="absolute inset-0"></span>{@html entry.titleHtml}</a>
				</h2>
				{#if entry.summary}<p class="mt-4 text-sm text-gray-600 sm:text-base dark:text-gray-300">{entry.summary}</p>{/if}
			{:else}
				<h2 class="flex items-baseline-last justify-between gap-8 text-lg font-semibold text-gray-800 sm:text-xl dark:text-gray-100">
					<a href={entry.url}>
						<span class="absolute inset-0"></span>
						<span class="my-auto mr-2 text-tokyonight-day-teal dark:text-tokyonight-moon-teal">TIL</span>
						{@html entry.titleHtml}
					</a>
				</h2>
			{/if}
		</article>
	{/each}
	{#if totalPages > 1}
		<nav class="mt-8 flex items-center justify-between" aria-label="Blog pagination">
			<p class="text-sm text-gray-800 dark:text-gray-200">Page <span class="font-medium">{page}</span> of <span class="font-medium">{totalPages}</span></p>
			<div class="mt-1 flex gap-4 text-sm">
				{#if page > 1}<span class="flex items-center space-x-2"><a href="/blog/">first</a><a href={page === 2 ? '/blog/' : `/blog/${page - 1}/`}>previous</a></span>{/if}
				{#if page < totalPages}<span class="ml-auto flex items-center space-x-2"><a href={`/blog/${page + 1}/`}>next</a><a href={`/blog/${totalPages}/`}>last</a></span>{/if}
			</div>
		</nav>
	{/if}
</div>
