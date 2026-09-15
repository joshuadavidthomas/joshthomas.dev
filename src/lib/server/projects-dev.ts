const downloadStats = { lastDay: 42, lastWeek: 294, lastMonth: 1_260 };

export const developmentProjectData = {
	projects: [
		{
			name: 'django-language-server',
			fullName: 'joshuadavidthomas/django-language-server',
			description: 'A language server for Django templates and Python projects.',
			url: 'https://github.com/joshuadavidthomas/django-language-server',
			homepage: null,
			topics: ['django', 'language-server', 'python'],
			stars: 128,
			forks: 9,
			languages: [
				{ name: 'Rust', icon: 'devicon-rust-original' },
				{ name: 'Python', icon: 'devicon-python-plain' }
			],
			pypiPackage: 'django-language-server',
			pypiStats: downloadStats,
			npmPackage: null,
			npmStats: null,
			cratesIOCrates: [],
			releaseDownloads: 3_840,
			zedExtension: null,
			zedStats: null
		},
		{
			name: 'sveltekit-adapter-cloudflare',
			fullName: 'joshuadavidthomas/sveltekit-adapter-cloudflare',
			description: 'A Cloudflare adapter for SvelteKit applications.',
			url: 'https://github.com/joshuadavidthomas/sveltekit-adapter-cloudflare',
			homepage: null,
			topics: ['cloudflare', 'sveltekit', 'typescript'],
			stars: 76,
			forks: 5,
			languages: [{ name: 'TypeScript', icon: 'devicon-typescript-plain' }],
			pypiPackage: null,
			pypiStats: null,
			npmPackage: '@joshthomas/sveltekit-adapter-cloudflare',
			npmStats: downloadStats,
			cratesIOCrates: [],
			releaseDownloads: null,
			zedExtension: null,
			zedStats: null
		},
		{
			name: 'kbd',
			fullName: 'joshuadavidthomas/kbd',
			description: 'Cross-platform keyboard input primitives for Rust applications.',
			url: 'https://github.com/joshuadavidthomas/kbd',
			homepage: null,
			topics: ['keyboard', 'rust'],
			stars: 34,
			forks: 3,
			languages: [{ name: 'Rust', icon: 'devicon-rust-original' }],
			pypiPackage: null,
			pypiStats: null,
			npmPackage: null,
			npmStats: null,
			cratesIOCrates: [
				{ name: 'kbd', stats: downloadStats },
				{ name: 'kbd-crossterm', stats: downloadStats }
			],
			releaseDownloads: null,
			zedExtension: null,
			zedStats: null
		},
		{
			name: 'zed-django',
			fullName: 'joshuadavidthomas/zed-django',
			description: 'Django support for the Zed editor.',
			url: 'https://github.com/joshuadavidthomas/zed-django',
			homepage: 'https://zed.dev/extensions/django',
			topics: ['django', 'zed-extension'],
			stars: 21,
			forks: 2,
			languages: [{ name: 'Rust', icon: 'devicon-rust-original' }],
			pypiPackage: null,
			pypiStats: null,
			npmPackage: null,
			npmStats: null,
			cratesIOCrates: [],
			releaseDownloads: null,
			zedExtension: 'django',
			zedStats: { totalDownloads: 2_430 }
		}
	],
	contributions: [
		{
			title: 'Improve type inference for template context',
			url: 'https://github.com/django/django/pull/19001',
			repoFullName: 'django/django',
			repoUrl: 'https://github.com/django/django',
			number: 19_001
		},
		{
			title: 'Document custom language server configuration',
			url: 'https://github.com/zed-industries/zed/pull/31042',
			repoFullName: 'zed-industries/zed',
			repoUrl: 'https://github.com/zed-industries/zed',
			number: 31_042
		}
	]
};
