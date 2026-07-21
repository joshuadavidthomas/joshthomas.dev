export const PROJECT_PACKAGES = {
	'joshuadavidthomas/django-language-server': { pypi: 'django-language-server' },
	'joshuadavidthomas/django-bird': { pypi: 'django-bird' },
	'joshuadavidthomas/mcp-django': { pypi: 'mcp-django' },
	'joshuadavidthomas/django-github-app': { pypi: 'django-github-app' },
	'joshuadavidthomas/django-simple-nav': { pypi: 'django-simple-nav' },
	'joshuadavidthomas/llm-uv-tool': { pypi: 'llm-uv-tool' },
	'joshuadavidthomas/djtagspecs': { pypi: 'djtagspecs' },
	'joshuadavidthomas/django-q-signals': { pypi: 'django-q-signals' },
	'westerveltco/django-email-relay': { pypi: 'django-email-relay' },
	'westerveltco/django-q-registry': { pypi: 'django-q-registry' },
	'westerveltco/wagtail-heroicons': { pypi: 'wagtail-heroicons' },
	'westerveltco/django-flyio': { pypi: 'django-flyio' },
	'westerveltco/django-twc-toolbox': { pypi: 'django-twc-toolbox' },

	'joshuadavidthomas/opencode-agent-memory': { npm: 'opencode-agent-memory' },
	'joshuadavidthomas/opencode-beads': { npm: 'opencode-beads' },
	'joshuadavidthomas/opencode-agent-skills': { npm: 'opencode-agent-skills' },
	'joshuadavidthomas/opencode-handoff': { npm: 'opencode-handoff' },
	'joshuadavidthomas/pi-peon-ping': { npm: 'pi-peon-ping' },
	'joshuadavidthomas/pi-opensync-plugin': { npm: 'pi-opensync-plugin' },
	'joshuadavidthomas/sveltekit-adapter-cloudflare': {
		npm: '@joshthomas/sveltekit-adapter-cloudflare'
	},

	'joshuadavidthomas/kbd': {
		crates: [
			'kbd',
			'kbd-crossterm',
			'kbd-egui',
			'kbd-evdev',
			'kbd-global',
			'kbd-iced',
			'kbd-tao',
			'kbd-winit'
		]
	},

	'joshuadavidthomas/zed-django': { zed: 'django' }
} as const;

export const PYPI_PACKAGES = Object.values(PROJECT_PACKAGES)
	.flatMap((packages) => ('pypi' in packages ? [packages.pypi] : []))
	.sort();
