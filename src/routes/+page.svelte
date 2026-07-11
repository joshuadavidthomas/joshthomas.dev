<script lang="ts">
	import { CalendarDays, Newspaper, Rss } from '@lucide/svelte';
	import avatar from '$lib/assets/me.png';
	import Meta from '$lib/components/Meta.svelte';
	let { data } = $props();
</script>

<Meta description="The personal website of Josh Thomas, a web developer living in Alabama." path="/" />
<svelte:head><link rel="preload" as="image" href={avatar} fetchpriority="high" /></svelte:head>
<section class="mt-10 text-center font-brico sm:mt-16">
	<img
		src={avatar}
		width="250"
		height="250"
		alt="Josh Thomas"
		fetchpriority="high"
		class="mx-auto size-56 rounded-full drop-shadow-md sm:size-72"
	/>
	<p class="mt-6 text-4xl/8 font-bold tracking-tight sm:text-5xl/8">👋 Hi, my name is Josh</p>
	<p class="mt-2 text-base sm:mt-4 sm:text-2xl">I'm a web developer living in Alabama</p>
</section>
{#if data.latest}<section class="mt-24">
		<header class="flex flex-col justify-between sm:flex-row">
			<h2 class="text-lg font-medium sm:text-xl">Latest blog post</h2>
			<div class="flex items-center gap-4 text-sm font-medium tracking-tighter text-gray-600 dark:text-gray-200">
				<a href="/feeds/blog.xml" class="group flex items-center gap-1 underline-offset-4">
					<Rss class="size-4 text-tokyonight-day-orange group-hover:text-inherit dark:text-tokyonight-moon-orange" aria-hidden="true" /> RSS
				</a>
				<a href="/blog/" class="group order-first flex items-center gap-1 underline-offset-4 xs:order-none">
					<Newspaper class="size-4 group-hover:text-inherit" aria-hidden="true" /> View all posts
				</a>
			</div>
		</header>
		<article class="group relative mt-6">
			<time datetime={data.latest.date.slice(0, 10)} class="flex items-baseline gap-2 text-xs text-gray-600 sm:text-sm dark:text-gray-300">
				<CalendarDays class="size-3 text-gray-700 sm:size-4 dark:text-gray-300" aria-hidden="true" />
				{new Date(data.latest.date).toLocaleDateString('en-US', {
					dateStyle: 'long',
					timeZone: 'UTC'
				})}
			</time>
			<h3 class="mt-2 text-xl/6 font-semibold text-gray-900 group-hover:text-gray-600 sm:text-2xl/7 dark:text-gray-50 dark:group-hover:text-gray-400">
				<a href={data.latest.url}><span class="absolute inset-0"></span>{@html data.latest.titleHtml}</a>
			</h3>
			<p class="mt-4 text-sm text-gray-600 sm:text-base dark:text-gray-300">{data.latest.summary}</p>
		</article>
	</section>{/if}
