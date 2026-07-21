import { defineConfig } from 'vite-plus';

export default defineConfig({
	lint: {
		plugins: ['oxc', 'typescript', 'unicorn'],
		categories: { correctness: 'warn' },
		env: { builtin: true, browser: true, node: true },
		globals: { Astro: 'readonly' },
		ignorePatterns: [
			'**/node_modules/',
			'**/dist/',
			'**/.astro/',
			'**/.cache/',
			'**/.wrangler/',
			'**/.env*',
			'!**/.env*.example',
			'**/.dev.vars*',
			'!**/.dev.vars*.example'
		],
		rules: {
			'no-unused-vars': 'error',
			'no-undef': 'error',
			'typescript/no-explicit-any': 'error'
		},
		overrides: [
			{
				files: ['src/lib/server/projects.ts'],
				rules: {
					'typescript/ban-ts-comment': 'off',
					'no-unused-vars': 'off',
					'typescript/require-array-sort-compare': 'off'
				}
			}
		],
		options: { typeAware: true, typeCheck: true }
	},
	fmt: {
		useTabs: true,
		singleQuote: true,
		trailingComma: 'none',
		printWidth: 100,
		sortTailwindcss: { stylesheet: './src/lib/styles/style.css' },
		sortPackageJson: false,
		ignorePatterns: ['pnpm-lock.yaml', '/public/', '**/.astro/']
	}
});
