import cloudflare from '@astrojs/cloudflare';
import { cacheCloudflare } from '@astrojs/cloudflare/cache';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, memoryCache } from 'astro/config';

const cacheProvider = process.env.NODE_ENV === 'development' ? memoryCache() : cacheCloudflare();

export default defineConfig({
	site: 'https://joshthomas.dev',
	output: 'static',
	trailingSlash: 'always',
	adapter: cloudflare({ imageService: 'compile' }),
	cache: { provider: cacheProvider },
	vite: {
		plugins: [tailwindcss()]
	}
});
