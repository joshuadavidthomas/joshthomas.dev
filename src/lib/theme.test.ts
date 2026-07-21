import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';
import { themeBootstrap } from './theme';

type Listener = (event?: {
	key?: string | null;
	newValue?: string | null;
	target?: { closest: (selector: string) => unknown };
}) => void;

function runTheme({
	stored = null,
	systemDark = false
}: { stored?: string | null; systemDark?: boolean } = {}) {
	const documentListeners = new Map<string, Listener>();
	const windowListeners = new Map<string, Listener>();
	const mediaListeners: Listener[] = [];
	const attributes = new Map<string, string>();
	const buttonClasses = new Set<string>();
	const storage = new Map<string, string>();
	if (stored !== null) storage.set('theme', stored);
	const root = { dataset: { modeState: 'system', theme: 'light' } };
	const button = {
		classList: {
			contains: (name: string) => buttonClasses.has(name),
			add: (name: string) => buttonClasses.add(name),
			remove: (name: string) => buttonClasses.delete(name)
		},
		setAttribute: (name: string, value: string) => attributes.set(name, value)
	};
	const clickThemeToggle = () =>
		documentListeners.get('click')?.({
			target: { closest: (selector: string) => (selector === '#theme-toggle' ? button : null) }
		});
	const media = {
		matches: systemDark,
		addEventListener: (_name: string, listener: Listener) => mediaListeners.push(listener)
	};
	const document = {
		documentElement: root,
		readyState: 'loading',
		querySelector: (selector: string) => (selector === '#theme-toggle' ? button : null),
		addEventListener: (name: string, listener: Listener) => documentListeners.set(name, listener)
	};
	const localStorage = {
		getItem: (key: string) => storage.get(key) ?? null,
		setItem: (key: string, value: string) => storage.set(key, value)
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
		setTimeout: vi.fn()
	});
	documentListeners.get('DOMContentLoaded')?.();

	return {
		attributes,
		clickThemeToggle,
		documentListeners,
		media,
		mediaListeners,
		root,
		storage,
		windowListeners
	};
}

describe('theme bootstrap', () => {
	it('applies a saved dark theme before the toggle initializes', () => {
		const runtime = runTheme({ stored: 'dark' });
		expect(runtime.root.dataset.modeState).toBe('dark');
		expect(runtime.root.dataset.theme).toBe('dark');
		expect(runtime.attributes.get('aria-label')).toBe('Theme: Dark. Click to use system theme.');
	});

	it('cycles system to light to dark to system and persists each selection', () => {
		const runtime = runTheme({ systemDark: true });
		expect(runtime.root.dataset.modeState).toBe('system');
		expect(runtime.root.dataset.theme).toBe('dark');

		runtime.clickThemeToggle();
		expect(runtime.root.dataset.modeState).toBe('light');
		expect(runtime.root.dataset.theme).toBe('light');
		expect(runtime.storage.get('theme')).toBe('light');

		runtime.clickThemeToggle();
		expect(runtime.root.dataset.modeState).toBe('dark');
		expect(runtime.root.dataset.theme).toBe('dark');

		runtime.clickThemeToggle();
		expect(runtime.root.dataset.modeState).toBe('system');
		expect(runtime.root.dataset.theme).toBe('dark');
	});

	it('tracks system changes only while the system preference is selected', () => {
		const runtime = runTheme();
		runtime.media.matches = true;
		runtime.mediaListeners[0]?.();
		expect(runtime.root.dataset.theme).toBe('dark');

		runtime.clickThemeToggle();
		runtime.media.matches = false;
		runtime.mediaListeners[0]?.();
		expect(runtime.root.dataset.modeState).toBe('light');
		expect(runtime.root.dataset.theme).toBe('light');
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
