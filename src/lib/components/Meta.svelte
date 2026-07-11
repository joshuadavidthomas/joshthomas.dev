<script lang="ts">
	type Props = { title?: string; description: string; path: string; type?: 'website' | 'article'; updated?: string };
	let { title, description, path, type = 'website', updated }: Props = $props();
	const pageTitle = $derived(title ?? 'joshthomas.dev');
	const socialTitle = $derived(title ? `${title} - joshthomas.dev` : 'joshthomas.dev');
	const url = $derived(`https://joshthomas.dev${path}`);
	const screenshotUrl = $derived(updated ? `${url}?updatedAt=${encodeURIComponent(updated)}` : url);
	const image = $derived(`https://v1.screenshot.11ty.dev/${encodeURIComponent(screenshotUrl)}/opengraph/`);
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={url} />
	<meta property="og:title" content={socialTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content={type} />
	<meta property="og:url" content={url} />
	<meta property="og:image" content={image} />
	<meta name="twitter:title" content={socialTitle} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={image} />
</svelte:head>
