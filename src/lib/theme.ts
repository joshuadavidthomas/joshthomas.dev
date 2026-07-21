export const THEME_STORAGE_KEY = 'theme';

export const themeBootstrap = String.raw`
(() => {
	const root = document.documentElement;
	const media = matchMedia('(prefers-color-scheme: dark)');
	const storageKey = 'theme';

	const normalize = (value) => value === 'light' || value === 'dark' ? value : 'system';
	const current = () => normalize(root.dataset.modeState);
	const read = () => {
		try {
			return normalize(localStorage.getItem(storageKey));
		} catch {
			return 'system';
		}
	};
	const resolved = (preference) => preference === 'dark' || (preference === 'system' && media.matches) ? 'dark' : 'light';
	const label = (preference, mode) => preference === 'light'
		? 'Theme: Light. Click to switch to dark mode.'
		: preference === 'dark'
			? 'Theme: Dark. Click to use system theme.'
			: 'Theme: Auto (currently ' + mode + '). Click to switch to light mode.';
	const syncButton = () => {
		const button = document.querySelector('#theme-toggle');
		if (!button) return;
		const preference = current();
		const text = label(preference, resolved(preference));
		button.setAttribute('aria-label', text);
		button.setAttribute('title', text);
	};
	const apply = (preference) => {
		const mode = resolved(preference);
		root.dataset.modeState = preference;
		root.dataset.theme = mode;
		syncButton();
	};
	const save = (preference) => {
		try {
			localStorage.setItem(storageKey, preference);
		} catch {
			// The selected theme still applies when storage is unavailable.
		}
	};
	const setup = () => {
		syncButton();
	};

	document.addEventListener('click', (event) => {
		const button = event.target?.closest?.('#theme-toggle');
		if (!button || button.classList.contains('rotating')) return;
		const preference = current();
		const next = preference === 'system' ? 'light' : preference === 'light' ? 'dark' : 'system';
		const animate = !matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (animate) button.classList.add('rotating');
		save(next);
		apply(next);
		if (animate) setTimeout(() => button.classList.remove('rotating'), 300);
	});
	apply(read());
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', setup, { once: true });
	} else {
		setup();
	}
	document.addEventListener('astro:after-swap', () => apply(read()));
	media.addEventListener('change', () => {
		if (current() === 'system') apply('system');
	});
	window.addEventListener('pageshow', () => apply(read()));
	window.addEventListener('storage', (event) => {
		if (event.key === storageKey) apply(normalize(event.newValue));
		else if (event.key === null) apply(read());
	});
})();
`;
