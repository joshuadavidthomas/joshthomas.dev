(function() {
  const THEME_STORAGE_KEY = 'theme';
  const THEME_DATA_ATTR = 'data-theme';

  function getStoredTheme() {
    return localStorage.getItem(THEME_STORAGE_KEY);
  }

  function getSystemTheme() {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function getCurrentState() {
    const stored = getStoredTheme();
    if (stored === 'light') return 'light';
    if (stored === 'dark') return 'dark';
    return 'auto';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute(THEME_DATA_ATTR, theme);
  }

  function persistTheme(state) {
    if (state === 'auto') {
      localStorage.removeItem(THEME_STORAGE_KEY);
      applyTheme(getSystemTheme());
    } else {
      localStorage.setItem(THEME_STORAGE_KEY, state);
      applyTheme(state);
    }
  }

  function getNextState(currentState) {
    if (currentState === 'light') return 'dark';
    if (currentState === 'dark') return 'auto';
    return 'light';
  }

  function updateThemeButton(state, animate = true) {
    const button = document.getElementById('theme-toggle');
    if (!button) return;

    const appliedTheme = state === 'auto' ? getSystemTheme() : state;

    if (animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      button.classList.add('rotating');
      
      const currentIcon = button.querySelector('[data-theme-state]:not(.hidden)');
      if (currentIcon) {
        currentIcon.style.opacity = '0';
      }
      
      setTimeout(() => {
        document.querySelectorAll('[data-theme-state]').forEach(icon => {
          icon.classList.add('hidden');
          icon.style.opacity = '0';
        });
        
        const activeIcon = document.querySelector(`[data-theme-state="${state}"]`);
        if (activeIcon) {
          activeIcon.classList.remove('hidden');
          activeIcon.style.transition = 'opacity 300ms ease-in-out';
          void activeIcon.offsetWidth;
          activeIcon.style.opacity = '1';
        }
        
        setTimeout(() => {
          button.classList.remove('rotating');
        }, 100);
      }, 200);
    } else {
      document.querySelectorAll('[data-theme-state]').forEach(icon => {
        icon.classList.add('hidden');
        icon.style.opacity = '1';
      });
      
      const activeIcon = document.querySelector(`[data-theme-state="${state}"]`);
      if (activeIcon) {
        activeIcon.classList.remove('hidden');
        activeIcon.style.opacity = '1';
      }
    }

    const labels = {
      light: 'Theme: Light. Click to switch to dark mode.',
      dark: 'Theme: Dark. Click to use system theme.',
      auto: `Theme: Auto (currently ${appliedTheme}). Click to switch to light mode.`
    };

    button.setAttribute('aria-label', labels[state]);
    button.setAttribute('title', labels[state]);
  }

  const initialState = getCurrentState();
  persistTheme(initialState);

  document.addEventListener('DOMContentLoaded', function() {
    const currentState = getCurrentState();
    updateThemeButton(currentState, false);

    const button = document.getElementById('theme-toggle');
    if (button) {
      button.addEventListener('click', () => {
        const currentState = getCurrentState();
        const nextState = getNextState(currentState);
        persistTheme(nextState);
        updateThemeButton(nextState, true);
      });
    }

    window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (getCurrentState() === 'auto') {
        const newTheme = e.matches ? 'dark' : 'light';
        applyTheme(newTheme);
        updateThemeButton('auto', false);
      }
    });
  });
})();
