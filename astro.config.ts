import cloudflare from '@astrojs/cloudflare';
import { cacheCloudflare } from '@astrojs/cloudflare/cache';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';

const isDevelopment = process.env.NODE_ENV === 'development';
if (isDevelopment && existsSync('.dev.vars')) loadEnvFile('.dev.vars');

export default defineConfig({
	site: 'https://joshthomas.dev',
	output: 'static',
	trailingSlash: 'always',
	devToolbar: { enabled: false },
	adapter: isDevelopment ? undefined : cloudflare({ imageService: 'compile' }),
	cache: isDevelopment ? undefined : { provider: cacheCloudflare() },
	image: isDevelopment ? { service: { entrypoint: 'astro/assets/services/noop' } } : undefined,
	vite: {
		plugins: [tailwindcss()],
		resolve: {
			alias: isDevelopment
				? {
						'cloudflare:workers': fileURLToPath(
							new URL('./src/lib/server/cloudflare-workers-dev.ts', import.meta.url)
						)
					}
				: {}
		}
	}
});
