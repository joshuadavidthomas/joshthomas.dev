import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';
import { themeBootstrap } from './theme';

type Listener = (event?: {
	key?: string | null;
	newValue?: string | null;
	newDocument?: { documentElement: { dataset: { themeName: string } } };
	target?: { closest: (selector: string) => unknown };
}) => void;

function runTheme({
	stored = null,
	storedName = null,
	systemDark = false,
	search = ''
}: {
	stored?: string | null;
	storedName?: string | null;
	systemDark?: boolean;
	search?: string;
} = {}) {
	const documentListeners = new Map<string, Listener>();
	const windowListeners = new Map<string, Listener>();
	const mediaListeners: Listener[] = [];
	const attributes = new Map<string, string>();
	const storage = new Map<string, string>();
	const variables = new Map<string, string>([
		['--paper', '#fcfbf8'],
		['--accent', '#8b4933']
	]);
	if (stored !== null) storage.set('theme', stored);
	if (storedName !== null) storage.set('theme-name', storedName);
	const root = { dataset: { themeName: 'default', modeState: 'system', theme: 'light' } };
	const button = {
		focus: vi.fn(),
		setAttribute: (name: string, value: string) => attributes.set(name, value)
	};
	const favicon = { href: '' };
	type Control = {
		dataset: Record<string, string>;
		setAttribute: ReturnType<typeof vi.fn>;
	};
	const control = (dataset: Record<string, string>): Control => ({
		dataset,
		setAttribute: vi.fn()
	});
	const modeControls = ['system', 'light', 'dark'].map((modeChoice) => control({ modeChoice }));
	const themeControls = [
		'default',
		'tokyo-night',
		'catppuccin',
		'dracula',
		'django',
		'django-admin',
		'djangonaut-space'
	].map((themeChoice) => control({ themeChoice }));
	const resetControl = control({ themeReset: '' });
	const click = (target: Control | undefined) =>
		documentListeners.get('click')?.({ target: { closest: () => target } });
	const chooseMode = (mode: string) =>
		click(modeControls.find((option) => option.dataset.modeChoice === mode));
	const chooseTheme = (name: string) =>
		click(themeControls.find((option) => option.dataset.themeChoice === name));
	const reset = () => click(resetControl);
	const exit = () => click(control({ themeExit: '' }));
	const cycle = () => click(control({ modeCycle: '' }));
	const modeControl = (mode: string) =>
		modeControls.find((option) => option.dataset.modeChoice === mode)!;
	const themeControl = (name: string) =>
		themeControls.find((option) => option.dataset.themeChoice === name)!;
	const media = {
		matches: systemDark,
		addEventListener: (_name: string, listener: Listener) => mediaListeners.push(listener)
	};
	const document = {
		documentElement: root,
		readyState: 'loading',
		querySelector: (selector: string) =>
			selector === '#theme-toggle' ? button : selector === 'link[rel="icon"]' ? favicon : null,
		querySelectorAll: (selector: string) =>
			selector.includes('mode-choice') ? modeControls : themeControls,
		addEventListener: (name: string, listener: Listener) => documentListeners.set(name, listener)
	};
	const localStorage = {
		getItem: (key: string) => storage.get(key) ?? null,
		setItem: (key: string, value: string) => storage.set(key, value),
		removeItem: (key: string) => storage.delete(key)
	};
	const window = {
		addEventListener: (name: string, listener: Listener) => windowListeners.set(name, listener)
	};
	const location = { pathname: '/blog/2026/post/', search, hash: '' };
	const history = {
		state: null,
		replaceState: vi.fn((_state: unknown, _title: string, url: string) => {
			location.search = url.slice(location.pathname.length);
		})
	};
	const matchMedia = (query: string) =>
		query.includes('reduced-motion') ? { matches: true, addEventListener: vi.fn() } : media;

	runInNewContext(themeBootstrap, {
		document,
		history,
		localStorage,
		location,
		matchMedia,
		window,
		getComputedStyle: () => ({
			getPropertyValue: (name: string) => variables.get(name) ?? ''
		}),
		setTimeout: vi.fn()
	});
	documentListeners.get('DOMContentLoaded')?.();

	return {
		attributes,
		chooseMode,
		chooseTheme,
		exit,
		cycle,
		reset,
		modeControl,
		themeControl,
		favicon,
		documentListeners,
		history,
		location,
		media,
		mediaListeners,
		root,
		storage,
		variables,
		windowListeners
	};
}

describe('theme bootstrap', () => {
	it('chooses and keeps a theme from a ?theme= link, then removes the parameter', () => {
		const runtime = runTheme({ storedName: 'dracula', search: '?change&theme=django-admin' });
		expect(runtime.root.dataset.themeName).toBe('django-admin');
		expect(runtime.storage.get('theme-name')).toBe('django-admin');
		expect(runtime.location.search).toBe('?change');
	});

	it('ignores an unknown ?theme= name but still removes it', () => {
		const runtime = runTheme({ storedName: 'dracula', search: '?theme=nope' });
		expect(runtime.root.dataset.themeName).toBe('dracula');
		expect(runtime.location.search).toBe('');
	});

	it('forgets the stored theme for ?theme=default', () => {
		const runtime = runTheme({ storedName: 'dracula', search: '?theme=default' });
		expect(runtime.root.dataset.themeName).toBe('default');
		expect(runtime.storage.has('theme-name')).toBe(false);
	});

	it('applies a ?theme= link after a client-side navigation', () => {
		const runtime = runTheme();
		runtime.location.search = '?theme=catppuccin';
		runtime.documentListeners.get('astro:after-swap')?.();
		expect(runtime.root.dataset.themeName).toBe('catppuccin');
		expect(runtime.location.search).toBe('');
	});

	it.each([
		['catppuccin', 'light'],
		['catppuccin', 'dark'],
		['dracula', 'light'],
		['dracula', 'dark'],
		['django', 'light'],
		['django', 'dark'],
		['django-admin', 'light'],
		['django-admin', 'dark'],
		['djangonaut-space', 'light'],
		['djangonaut-space', 'dark']
	])('persists and restores %s %s independently of the OS, then resets', (name, mode) => {
		const runtime = runTheme({ systemDark: mode === 'light' });
		runtime.chooseTheme(name);
		runtime.chooseMode(mode);
		expect(runtime.storage.get('theme-name')).toBe(name);
		expect(runtime.storage.get('theme')).toBe(mode);
		const restored = runTheme({ storedName: name, stored: mode, systemDark: mode === 'light' });
		expect(restored.root.dataset.themeName).toBe(name);
		expect(restored.root.dataset.theme).toBe(mode);
		expect(restored.themeControl(name).setAttribute).toHaveBeenLastCalledWith(
			'aria-pressed',
			'true'
		);
		expect(restored.modeControl(mode).setAttribute).toHaveBeenLastCalledWith(
			'aria-pressed',
			'true'
		);
		restored.mediaListeners[0]?.();
		expect(restored.root.dataset.theme).toBe(mode);
		restored.reset();
		expect(restored.storage.size).toBe(0);
		expect(restored.root.dataset.themeName).toBe('default');
		expect(restored.root.dataset.theme).toBe(mode === 'light' ? 'dark' : 'light');
	});

	it('changes the theme without touching the mode, and the mode without touching the theme', () => {
		const runtime = runTheme({ systemDark: true });
		runtime.chooseTheme('tokyo-night');
		expect(runtime.root.dataset.modeState).toBe('system');
		expect(runtime.root.dataset.theme).toBe('dark');
		expect(runtime.storage.has('theme')).toBe(false);
		expect(runtime.storage.get('theme-name')).toBe('tokyo-night');
		runtime.chooseMode('light');
		expect(runtime.root.dataset.themeName).toBe('tokyo-night');
		expect(runtime.root.dataset.theme).toBe('light');
		runtime.chooseTheme('default');
		expect(runtime.root.dataset.theme).toBe('light');
		expect(runtime.storage.has('theme-name')).toBe(false);
		expect(runtime.storage.get('theme')).toBe('light');
	});

	it('leaves a theme through an exit control without touching the mode', () => {
		const runtime = runTheme({ storedName: 'django-admin', stored: 'dark' });
		runtime.exit();
		expect(runtime.root.dataset.themeName).toBe('default');
		expect(runtime.root.dataset.theme).toBe('dark');
		expect(runtime.storage.has('theme-name')).toBe(false);
		expect(runtime.storage.get('theme')).toBe('dark');
	});

	it.each([
		[false, ['dark', 'light', 'system']],
		[true, ['light', 'dark', 'system']]
	])('cycles modes like the Django admin toggle (system dark: %s)', (systemDark, steps) => {
		const runtime = runTheme({ systemDark });
		for (const step of steps) {
			runtime.cycle();
			expect(runtime.root.dataset.modeState).toBe(step);
		}
		expect(runtime.storage.has('theme')).toBe(false);
	});

	it('keeps theme identity separate from mode changes and carries it into an Astro swap', () => {
		const runtime = runTheme();
		runtime.root.dataset.themeName = 'tokyo-night';
		runtime.mediaListeners[0]?.();
		expect(runtime.root.dataset.modeState).toBe('system');
		expect(runtime.root.dataset.theme).toBe('light');
		expect(runtime.root.dataset.themeName).toBe('tokyo-night');
		const newDocument = { documentElement: { dataset: { themeName: 'default' } } };
		runtime.documentListeners.get('astro:before-swap')?.({ newDocument });
		expect(newDocument.documentElement.dataset.themeName).toBe('tokyo-night');
		runtime.documentListeners.get('astro:after-swap')?.();
		expect(runtime.root.dataset.themeName).toBe('tokyo-night');
		expect(runtime.storage.has('theme')).toBe(false);
	});

	it('restores Tokyo Moon before paint and marks its controls pressed', () => {
		const runtime = runTheme({ stored: 'dark', storedName: 'tokyo-night' });
		expect(runtime.root.dataset.themeName).toBe('tokyo-night');
		expect(runtime.root.dataset.theme).toBe('dark');
		expect(runtime.themeControl('tokyo-night').setAttribute).toHaveBeenLastCalledWith(
			'aria-pressed',
			'true'
		);
		expect(runtime.themeControl('default').setAttribute).toHaveBeenLastCalledWith(
			'aria-pressed',
			'false'
		);
		expect(runtime.modeControl('dark').setAttribute).toHaveBeenLastCalledWith(
			'aria-pressed',
			'true'
		);
	});

	it('ignores an unknown stored theme name', () => {
		const runtime = runTheme({ storedName: 'pony' });
		expect(runtime.root.dataset.themeName).toBe('default');
	});

	it('repaints the favicon with the active theme colors', () => {
		const runtime = runTheme();
		expect(runtime.favicon.href).toContain(encodeURIComponent('#fcfbf8'));
		expect(runtime.favicon.href).toContain(encodeURIComponent('#8b4933'));

		runtime.variables.set('--paper', '#eff1f5');
		runtime.variables.set('--accent', '#8839ef');
		runtime.chooseTheme('catppuccin');
		expect(runtime.favicon.href).toContain(encodeURIComponent('#eff1f5'));
		expect(runtime.favicon.href).toContain(encodeURIComponent('#8839ef'));
		expect(runtime.favicon.href).toContain('data:image/svg+xml');
	});

	it('applies a saved dark theme before the toggle initializes', () => {
		const runtime = runTheme({ stored: 'dark' });
		expect(runtime.root.dataset.modeState).toBe('dark');
		expect(runtime.root.dataset.theme).toBe('dark');
		expect(runtime.attributes.get('aria-label')).toBe('Appearance: Dark. Choose appearance.');
	});

	it('saves explicit modes and removes the override for system', () => {
		const runtime = runTheme({ systemDark: true });
		expect(runtime.root.dataset.modeState).toBe('system');
		expect(runtime.root.dataset.theme).toBe('dark');

		runtime.chooseMode('light');
		expect(runtime.root.dataset.modeState).toBe('light');
		expect(runtime.root.dataset.theme).toBe('light');
		expect(runtime.storage.get('theme')).toBe('light');

		runtime.chooseMode('dark');
		expect(runtime.root.dataset.modeState).toBe('dark');
		expect(runtime.root.dataset.theme).toBe('dark');
		expect(runtime.storage.get('theme')).toBe('dark');

		runtime.chooseMode('system');
		expect(runtime.root.dataset.modeState).toBe('system');
		expect(runtime.root.dataset.theme).toBe('dark');
		expect(runtime.storage.has('theme')).toBe(false);
	});

	it('tracks system changes only while the system preference is selected', () => {
		const runtime = runTheme();
		runtime.media.matches = true;
		runtime.mediaListeners[0]?.();
		expect(runtime.root.dataset.theme).toBe('dark');

		runtime.chooseMode('dark');
		runtime.media.matches = false;
		runtime.mediaListeners[0]?.();
		expect(runtime.root.dataset.modeState).toBe('dark');
		expect(runtime.root.dataset.theme).toBe('dark');
	});

	it('restores the stored theme before paint after an Astro swap', () => {
		const runtime = runTheme({ stored: 'dark' });
		runtime.root.dataset.modeState = 'system';
		runtime.root.dataset.theme = 'light';
		runtime.documentListeners.get('astro:after-swap')?.();
		expect(runtime.root.dataset.modeState).toBe('dark');
		expect(runtime.root.dataset.theme).toBe('dark');
	});

	it('restores the current stored theme when a page returns from the back-forward cache', () => {
		const runtime = runTheme({ stored: 'light' });
		runtime.storage.set('theme', 'dark');
		runtime.windowListeners.get('pageshow')?.();
		expect(runtime.root.dataset.modeState).toBe('dark');
		expect(runtime.root.dataset.theme).toBe('dark');
	});

	it('returns to the system theme when storage is cleared in another tab', () => {
		const runtime = runTheme({ stored: 'dark' });
		runtime.storage.clear();
		runtime.windowListeners.get('storage')?.({ key: null });
		expect(runtime.root.dataset.modeState).toBe('system');
		expect(runtime.root.dataset.theme).toBe('light');
	});
});
