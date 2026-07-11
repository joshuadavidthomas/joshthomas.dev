<script lang="ts">
	import { Monitor, Moon, Sun } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { ModeWatcher, mode, setMode, userPrefersMode } from 'mode-watcher';
	import { page } from '$app/state';
	import '$lib/styles/style.css';
	import favicon from '$lib/assets/favicon.svg';
	import BrandIcon from '$lib/components/BrandIcon.svelte';

	let { children } = $props();
	type ThemePreference = 'light' | 'dark' | 'system';
	let animating = $state(false);
	let displayedTheme = $state<ThemePreference>('system');

	const social = [
		{ label: 'Mastodon', short: 'M', href: 'https://joshthomas.dev/@josh' },
		{ label: 'Bluesky', short: 'B', href: 'https://bsky.app/profile/joshthomas.dev' },
		{ label: 'GitHub', short: 'GH', href: 'https://github.com/joshuadavidthomas' },
		{ label: 'LinkedIn', short: 'in', href: 'https://www.linkedin.com/in/joshua-thomas-b1745a16/' }
	] as const;

	async function cycleTheme() {
		if (animating) return;
		const next =
			userPrefersMode.current === 'system'
				? 'light'
				: userPrefersMode.current === 'light'
					? 'dark'
					: 'system';
		const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

		if (!reduceMotion) animating = true;
		setMode(next);

		if (reduceMotion) {
			displayedTheme = next;
			return;
		}

		await new Promise((resolve) => setTimeout(resolve, 200));
		displayedTheme = next;
		await new Promise((resolve) => setTimeout(resolve, 100));
		animating = false;
	}

	onMount(() => {
		displayedTheme = userPrefersMode.current;
		delete document.documentElement.dataset.modeState;
		const syncDisplayedTheme = (event: StorageEvent) => {
			if (event.key !== 'theme' || animating) return;
			displayedTheme =
				event.newValue === 'light' || event.newValue === 'dark' ? event.newValue : 'system';
		};
		window.addEventListener('storage', syncDisplayedTheme);
		return () => window.removeEventListener('storage', syncDisplayedTheme);
	});

	const themeLabel = $derived(
		userPrefersMode.current === 'system'
			? `Theme: Auto (currently ${mode.current ?? 'light'}). Click to switch to light mode.`
			: userPrefersMode.current === 'light'
				? 'Theme: Light. Click to switch to dark mode.'
				: 'Theme: Dark. Click to use system theme.'
	);
	const active = (href: string) => href !== '/' && page.url.pathname.startsWith(href);
	const wideMain = $derived(
		/^\/blog\/\d{4}\//.test(page.url.pathname) ||
		page.url.pathname.startsWith('/til/') ||
		page.url.pathname === '/design-system/'
	);
	const sourcePath = $derived.by(() => {
		const path = page.url.pathname;
		if (path === '/') return 'src/routes/+page.svelte';
		if (path === '/blog/') return 'src/routes/blog/+page.svelte';
		if (/^\/blog\/\d+\/$/.test(path)) return 'src/routes/blog/[page]/+page.svelte';
		if (/^\/blog\/\d{4}\//.test(path)) return 'src/routes/blog/[year]/[slug]/+page.svelte';
		if (path.startsWith('/til/')) return 'src/routes/til/[category]/[slug]/+page.svelte';
		if (path === '/projects/') return 'src/routes/projects/+page.svelte';
		if (path === '/design-system/') return 'src/routes/design-system/+page.svelte';
		return 'src/routes';
	});
</script>

<ModeWatcher modeStorageKey="theme" disableTransitions={false} />

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="alternate" type="application/atom+xml" title="Josh Thomas" href="/feeds/blog.xml" />
	<meta name="description" content="The personal website of Josh Thomas." />
	<meta name="author" content="Josh Thomas" />
	<meta property="og:site_name" content="joshthomas.dev" />
	<meta property="og:type" content="website" />
	<meta property="og:locale" content="en_US" />
	<meta name="twitter:card" content="summary_large_image" />
	<link rel="preload" href="/static/fonts/BricolageGrotesque.woff2" as="font" type="font/woff2" crossorigin="anonymous" />
	<link rel="preload" href="/static/fonts/InterVariable.woff2" as="font" type="font/woff2" crossorigin="anonymous" />
	<link rel="preload" href="/static/fonts/InterVariable-Italic.woff2" as="font" type="font/woff2" crossorigin="anonymous" />
	<link href="mailto:josh@joshthomas.dev" rel="me" />
	<link href="https://github.com/joshuadavidthomas" rel="me" />
	<link href="https://joshthomas.dev/@josh" rel="me" />
	<link href="https://social.joshthomas.dev/@josh" rel="me" />
	<script data-goatcounter="https://joshthomasdev.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
</svelte:head>

<div class="grid-layout px-2">
	<header class="flex flex-col items-baseline justify-between gap-y-2 xs:flex-row">
		<div>
			<h1 class="text-2xl"><a href="/">Josh Thomas</a></h1>
			<nav class="flex items-center gap-4 text-sm" aria-label="Main navigation">
				{#each [['/', 'HOME'], ['/blog/', 'BLOG'], ['/projects/', 'PROJECTS']] as item}
					<a href={item[0]} class="uppercase underline-offset-4 hover:underline" class:font-semibold={active(item[0])} class:underline={active(item[0])}>{item[1]}</a>
				{/each}
			</nav>
		</div>
		<div class="order-first mt-2 flex w-full items-center justify-between gap-2 xs:order-none xs:mt-0 xs:w-auto xs:justify-end">
			<nav class="flex items-center gap-2 text-xs font-semibold" aria-label="Social media">
				{#each social as item}
					<a href={item.href} target="_blank" rel="noopener noreferrer" aria-label={item.label} title={item.label}><BrandIcon label={item.label} /></a>
				{/each}
			</nav>
			<button id="theme-toggle" class:rotating={animating} class="ml-4 grid size-4 cursor-pointer place-items-center" type="button" aria-label={themeLabel} title={themeLabel} onclick={cycleTheme}>
				<Sun data-theme-state="light" class="size-4 hover:text-[#FF8C00] {displayedTheme !== 'light' ? 'hidden' : ''}" aria-hidden="true" />
				<Moon data-theme-state="dark" class="size-4 hover:text-[#F1C40F] {displayedTheme !== 'dark' ? 'hidden' : ''}" aria-hidden="true" />
				<Monitor data-theme-state="system" class="size-4 hover:text-[#3498DB] {displayedTheme !== 'system' ? 'hidden' : ''}" aria-hidden="true" />
			</button>
			<script>
				{
					const button = document.currentScript?.previousElementSibling;
					const preference = document.documentElement.dataset.modeState ?? 'system';
					const resolved = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
					const label =
						preference === 'light'
							? 'Theme: Light. Click to switch to dark mode.'
							: preference === 'dark'
								? 'Theme: Dark. Click to use system theme.'
								: `Theme: Auto (currently ${resolved}). Click to switch to light mode.`;
					button?.setAttribute('aria-label', label);
					button?.setAttribute('title', label);
				}
			</script>
		</div>
	</header>
	<main id="skip" class:w-full={wideMain}>{@render children()}</main>
	<footer class="mt-24 pb-4 text-xs">
		<hr aria-hidden="true" class="mx-auto w-24 text-gray-300 dark:text-white/15" />
		<div class="mt-4 flex items-center justify-between">
			<nav class="flex items-center gap-2 uppercase" aria-label="Secondary navigation"><a href="/design-system/" class="underline-offset-4" class:font-semibold={page.url.pathname === '/design-system/'} class:underline={page.url.pathname === '/design-system/'}>Design system</a></nav>
			<div class="flex items-center gap-2 italic">
				<span>Built with <a href="https://svelte.dev/docs/kit" class="underline-offset-4">SvelteKit</a></span>
				<span>·</span>
				<a href={`https://github.com/joshuadavidthomas/joshthomas.dev/tree/main/${sourcePath}`} class="underline-offset-4">Source</a>
			</div>
		</div>
	</footer>
</div>
