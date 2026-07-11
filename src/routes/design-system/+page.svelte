<script lang="ts">
	import Meta from '$lib/components/Meta.svelte';
	let { data } = $props();
</script>

<Meta title="Design system" description="The visual language and content styles used on joshthomas.dev." path="/design-system/" />

<article class="prose grid max-w-none grid-container-2xl xl:prose-xl dark:prose-invert">{@html data.html}</article>
