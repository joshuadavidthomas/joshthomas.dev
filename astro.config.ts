import cloudflare from '@astrojs/cloudflare';
import { cacheCloudflare } from '@astrojs/cloudflare/cache';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

const cache = process.env.NODE_ENV === 'development' ? undefined : { provider: cacheCloudflare() };

export default defineConfig({
	site: 'https://joshthomas.dev',
	output: 'static',
	trailingSlash: 'always',
	adapter: cloudflare({ imageService: 'compile' }),
	cache,
	vite: {
		plugins: [tailwindcss()]
	}
});
