export function entryTransitionName(title: string): string {
	return `post-${title
		.replace(/<[^>]*>/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')}`;
}
