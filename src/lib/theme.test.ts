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
	systemDark = false
}: { stored?: string | null; storedName?: string | null; systemDark?: boolean } = {}) {
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
	const options = [
		['system', 'default'],
		['light', 'default'],
		['dark', 'default'],
		['light', 'tokyo-night'],
		['dark', 'tokyo-night'],
		['light', 'catppuccin'],
		['dark', 'catppuccin'],
		['dark', 'dracula']
	].map(([themePreference, themeName]) => ({
		dataset: { themePreference, themeName },
		setAttribute: vi.fn()
	}));
	const choose = (preference: string, name = 'default') =>
		documentListeners.get('click')?.({
			target: {
				closest: () =>
					options.find(
						(option) =>
							option.dataset.themePreference === preference && option.dataset.themeName === name
					)
			}
		});
	const media = {
		matches: systemDark,
		addEventListener: (_name: string, listener: Listener) => mediaListeners.push(listener)
	};
	const document = {
		documentElement: root,
		readyState: 'loading',
		querySelector: (selector: string) =>
			selector === '#theme-toggle' ? button : selector === 'link[rel="icon"]' ? favicon : null,
		querySelectorAll: () => options,
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
	const matchMedia = (query: string) =>
		query.includes('reduced-motion') ? { matches: true, addEventListener: vi.fn() } : media;

	runInNewContext(themeBootstrap, {
		document,
		localStorage,
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
		choose,
		favicon,
		options,
		documentListeners,
		media,
		mediaListeners,
		root,
		storage,
		variables,
		windowListeners
	};
}

describe('theme bootstrap', () => {
	it.each([
		['catppuccin', 'light'],
		['catppuccin', 'dark'],
		['dracula', 'dark']
	])('persists and restores %s %s independently of the OS, then resets', (name, mode) => {
		const runtime = runTheme({ systemDark: mode === 'light' });
		runtime.choose(mode, name);
		expect(runtime.storage.get('theme-name')).toBe(name);
		expect(runtime.storage.get('theme')).toBe(mode);
		const restored = runTheme({ storedName: name, stored: mode, systemDark: mode === 'light' });
		expect(restored.root.dataset.themeName).toBe(name);
		expect(restored.root.dataset.theme).toBe(mode);
		expect(
			restored.options.find(
				(option) => option.dataset.themeName === name && option.dataset.themePreference === mode
			)?.setAttribute
		).toHaveBeenLastCalledWith('aria-pressed', 'true');
		restored.mediaListeners[0]?.();
		expect(restored.root.dataset.theme).toBe(mode);
		restored.choose('system');
		expect(restored.storage.size).toBe(0);
		expect(restored.root.dataset.themeName).toBe('default');
		expect(restored.root.dataset.theme).toBe(mode === 'light' ? 'dark' : 'light');
	});

	it('keeps theme identity separate from mode changes and carries it into an Astro swap', () => {
		const runtime = runTheme();
		runtime.root.dataset.themeName = 'test-theme';
		runtime.mediaListeners[0]?.();
		expect(runtime.root.dataset.modeState).toBe('system');
		expect(runtime.root.dataset.theme).toBe('light');
		expect(runtime.root.dataset.themeName).toBe('test-theme');
		const newDocument = { documentElement: { dataset: { themeName: 'default' } } };
		runtime.documentListeners.get('astro:before-swap')?.({ newDocument });
		expect(newDocument.documentElement.dataset.themeName).toBe('test-theme');
		runtime.documentListeners.get('astro:after-swap')?.();
		expect(runtime.root.dataset.themeName).toBe('test-theme');
		expect(runtime.storage.has('theme')).toBe(false);
	});

	it('restores Tokyo Moon before paint and distinguishes it from Ember', () => {
		const runtime = runTheme({ stored: 'dark', storedName: 'tokyo-night' });
		expect(runtime.root.dataset.themeName).toBe('tokyo-night');
		expect(runtime.root.dataset.theme).toBe('dark');
		expect(runtime.options[4].setAttribute).toHaveBeenLastCalledWith('aria-pressed', 'true');
		expect(runtime.options[2].setAttribute).toHaveBeenLastCalledWith('aria-pressed', 'false');
		runtime.choose('dark');
		expect(runtime.root.dataset.themeName).toBe('default');
		expect(runtime.storage.get('theme-name')).toBe('default');
	});

	it('persists Tokyo Day and reset clears both overrides, returning to system default', () => {
		const runtime = runTheme({ systemDark: true });
		runtime.choose('light', 'tokyo-night');
		expect(runtime.root.dataset.theme).toBe('light');
		expect(runtime.storage.get('theme')).toBe('light');
		expect(runtime.storage.get('theme-name')).toBe('tokyo-night');
		runtime.choose('system');
		expect(runtime.root.dataset.themeName).toBe('default');
		expect(runtime.root.dataset.theme).toBe('dark');
		expect(runtime.storage.size).toBe(0);
	});

	it('repaints the favicon with the active theme colors', () => {
		const runtime = runTheme();
		expect(runtime.favicon.href).toContain(encodeURIComponent('#fcfbf8'));
		expect(runtime.favicon.href).toContain(encodeURIComponent('#8b4933'));

		runtime.variables.set('--paper', '#eff1f5');
		runtime.variables.set('--accent', '#8839ef');
		runtime.choose('light', 'catppuccin');
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

	it('saves explicit choices and removes the override when reset to system', () => {
		const runtime = runTheme({ systemDark: true });
		expect(runtime.root.dataset.modeState).toBe('system');
		expect(runtime.root.dataset.theme).toBe('dark');

		runtime.choose('light');
		expect(runtime.root.dataset.modeState).toBe('light');
		expect(runtime.root.dataset.theme).toBe('light');
		expect(runtime.storage.get('theme')).toBe('light');

		runtime.choose('dark');
		expect(runtime.root.dataset.modeState).toBe('dark');
		expect(runtime.root.dataset.theme).toBe('dark');
		expect(runtime.storage.get('theme')).toBe('dark');

		runtime.choose('system');
		expect(runtime.root.dataset.modeState).toBe('system');
		expect(runtime.root.dataset.theme).toBe('dark');
		expect(runtime.storage.has('theme')).toBe(false);
	});

	it('tracks system changes only while the system preference is selected', () => {
		const runtime = runTheme();
		runtime.media.matches = true;
		runtime.mediaListeners[0]?.();
		expect(runtime.root.dataset.theme).toBe('dark');

		runtime.choose('dark');
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
