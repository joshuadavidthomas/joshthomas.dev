export const THEME_STORAGE_KEY = 'theme';

export const themeBootstrap = String.raw`
(() => {
	const root = document.documentElement;
	const media = matchMedia('(prefers-color-scheme: dark)');
	const storageKey = 'theme';
	const nameKey = 'theme-name';
	const normalizeName = (value) => ['tokyo-night', 'catppuccin', 'dracula'].includes(value) ? value : 'default';
	const readName = () => {
		try { return normalizeName(localStorage.getItem(nameKey)); }
		catch { return 'default'; }
	};

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
		? 'Appearance: Light. Choose appearance.'
		: preference === 'dark'
			? 'Appearance: Dark. Choose appearance.'
			: 'Appearance: System (currently ' + mode + '). Choose appearance.';
	const syncButton = () => {
		const button = document.querySelector('#theme-toggle');
		if (!button) return;
		const preference = current();
		const text = label(preference, resolved(preference));
		button.setAttribute('aria-label', text);
		button.setAttribute('title', text);
		for (const option of document.querySelectorAll('[data-theme-preference]')) {
			const selected = option.dataset.themePreference === preference &&
				(preference === 'system' || normalizeName(option.dataset.themeName) === root.dataset.themeName);
			option.setAttribute('aria-pressed', String(selected));
		}
	};
	const syncFavicon = () => {
		const link = document.querySelector('link[rel="icon"]');
		if (!link) return;
		const style = getComputedStyle(root);
		const paper = style.getPropertyValue('--paper').trim();
		const accent = style.getPropertyValue('--accent').trim();
		if (!paper || !accent) return;
		const glyph = 'M20 15h9v28c0 9-5 14-14 14h-3v-8h2c4 0 6-2 6-6V15Zm13 0h24v8h-8v34h-9V23h-7v-8Z';
		const svg =
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="' +
			paper +
			'"/><path d="' +
			glyph +
			'" fill="' +
			accent +
			'"/></svg>';
		link.href = 'data:image/svg+xml,' + encodeURIComponent(svg);
	};
	const apply = (preference) => {
		const mode = resolved(preference);
		root.dataset.modeState = preference;
		root.dataset.theme = mode;
		syncButton();
		syncFavicon();
	};
	const save = (preference) => {
		try {
			if (preference === 'system') {
				localStorage.removeItem(storageKey);
				localStorage.removeItem(nameKey);
			} else {
				localStorage.setItem(nameKey, root.dataset.themeName);
				localStorage.setItem(storageKey, preference);
			}
		} catch {
			// The selected theme still applies when storage is unavailable.
		}
	};
	const setup = () => {
		syncButton();
		syncFavicon();
	};

	document.addEventListener('click', (event) => {
		const option = event.target?.closest?.('[data-theme-preference]');
		if (!option) return;
		const preference = normalize(option.dataset.themePreference);
		root.dataset.themeName = normalizeName(option.dataset.themeName);
		save(preference);
		apply(preference);
		document.querySelector('#theme-menu')?.hidePopover();
		document.querySelector('#theme-toggle')?.focus();
	});
	root.dataset.themeName = readName();
	apply(read());
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', setup, { once: true });
	} else {
		setup();
	}
	// Theme identity is independent of the persisted light/dark/system preference.
	document.addEventListener('astro:before-swap', (event) => {
		event.newDocument.documentElement.dataset.themeName = root.dataset.themeName;
	});
	document.addEventListener('astro:after-swap', () => apply(read()));
	media.addEventListener('change', () => {
		if (current() === 'system') apply('system');
	});
	window.addEventListener('pageshow', () => {
		root.dataset.themeName = readName();
		apply(read());
	});
	window.addEventListener('storage', (event) => {
		if (event.key === storageKey || event.key === nameKey || event.key === null) {
			root.dataset.themeName = readName();
			apply(read());
		}
	});
})();
`;
