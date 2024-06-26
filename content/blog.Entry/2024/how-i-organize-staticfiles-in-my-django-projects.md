title: How I organize `staticfiles` in my Django projects
slug: how-i-organize-staticfiles-in-my-django-projects
summary: A brief post about how I setup and organize my staticfiles directories in all of my Django projects.
published_at: 2024-04-20 20:26:00+00:00

---

In the most recent meeting of Jeff Triplett's [office hours](https://micro.webology.dev/2024/04/12/office-hours-on.html), the topic of how everyone handled the static CSS and JS files in their Django projects came up. I mentioned my preferred setup, which Jeff himself is familiar with as at my [day job](https://westervelt.com) we have contracted his Django consultancy [REVSYS](https://revsys.com) to help out with our development needs, but rather than just keeping it contained to that Zoom meeting I thought it might be useful to write about it.

So, here's how I like to organize the `staticfiles` in my Django projects and the reasoning behind the choices I've made.

For context, these days I mostly build Django projects with server-side generated templates. Standard, predictable... the [boring](https://boringtechnology.club) choice. Within those Django templates, I use the following:

- Tailwind CSS with its utility CSS classes for styling, using the excellent [`django-tailwind-cli`](https://github.com/oliverandrich/django-tailwind-cli)
- HTMX for getting SPA-like interactions
- Alpine.js for sprinkles of JS interactivity (menu dropdowns, dynamic CSS classes, etc.)

For projects requiring more than what the HTMX and Alpine.js combination offers, I use React and Vite, with [`django-vite`](https://github.com/MrBin99/django-vite) helping integrate them with Django.

Below is the tree view layout of the relevant `staticfiles` directories in my projects:

```shell
project/
├── static/
│   ├── dist/
│   ├── public/
│   └── src/
└── staticfiles/
```

We'll start with `static/public/` and `static/src/`, as those are where the actual files go.

`static/public/` is for assets that require no processing by external tools, such as logo images, vendored CSS/JS assets, and any handwritten vanilla JS files that do not need to be compiled or transpiled.

`static/src/` houses assets that require processing to be usable. For instance, my Tailwind CSS `styles.css` file and any JavaScript/TypeScript files destined for Vite processing are placed here.

After those assets have been run through whatever build pipeline they need, they end up in the `static/dist/` folder.

`staticfiles/` serves as the collection point for all assets, gathered via the `python manage.py collectstatic` Django management command during the deployment build process.

Here are the Django settings you need to set in order to use this layout:

```python
# settings.py
# django.contrib.staticfiles
STATIC_ROOT = BASE_DIR / "staticfiles"

STATIC_URL = "/static/"

STATICFILES_DIRS = [
    BASE_DIR / "static" / "dist",
    BASE_DIR / "static" / "public",
]

# django-tailwind-cli
TAILWIND_CLI_DIST_CSS = "css/tailwind.css"

TAILWIND_CLI_SRC_CSS = "static/src/tailwind.css"

# django-vite (optional)
DJANGO_VITE_ASSETS_PATH = BASE_DIR / "static" / "dist"
```

With this configuration, the `collectstatic` command will gather all files from `STATICFILES_DIRS` (`static/dist/` and `static/public/` here in these example settings), store them in `STATIC_ROOT` (`staticfiles/`), and in production serve them under the url prefix `STATIC_URL` (`/static/`).

A quirk of the `django-tailwind-cli` configuration is that the path for the source CSS file originates from the `BASE_DIR`, whereas the path for the compiled CSS file is relative to the first location listed in `STATICFILES_DIRS`. That means the `TAILWIND_CLI_SRC_CSS` setting **must** include the `static/src/` prefix, while `TAILWIND_CLI_DIST_CSS` should omit the `static/dist/` prefix to align with the expectations of the package. Importantly, `django-tailwind-cli` considers only the first entry in `STATICFILES_DIRS` for locating compiled assets, which is why `static/dist/` is positioned first in the list.

For completeness, below is an example `vite.config.ts` file for projects that process JavaScript/TypeScript files using Vite.

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import { resolve } from "path";
import react from "@vitejs/plugin-react";

export default defineConfig({
    // Set the base path for all static assets. Useful for deployment where paths need prefixing.
    base: "/static/",
    build: {
        // Directory for storing build-time assets (empty here to avoid nesting).
        assetsDir: "",
        // Enable the generation of manifest.json for asset management.
        manifest: true,
        // Output directory for built files, resolved to 'static/dist' within the project.
        outDir: resolve(__dirname, "./static/dist"),
        rollupOptions: {
            // Entry point for the app, necessary for multi-page apps to specify multiple entries.
            input: [resolve(__dirname, "./static/src/main.tsx")],
            output: {
                chunkFileNames: undefined,
            },
        },
    },
    plugins: [react()],
    // The directory to serve as the public folder (empty here since we're managing paths manually).
    publicDir: "",
    resolve: {
        // Aliases to simplify imports; '@' points to the 'static/src' directory.
        alias: {
            "@": resolve(__dirname, "./static/src"),
        },
        extensions: [".js", ".jsx", ".ts", ".tsx"],
    },
    // Root directory for source files, set to 'static/src' to centralize code.
    root: resolve(__dirname, "./static/src"),
    server: {
        host: "127.0.0.1",
        port: 5173,
        open: false,
        watch: {
            usePolling: true,
            disableGlobbing: false,
        },
    },
});
```

Additionally, you should update your project's `.gitignore` to exclude the `static/dist/` and `staticfiles/` directories from version control. This prevents unnecessary tracking of compiled and collected assets:

```unixconfig
#.gitignore
staticfiles/
static/dist/
# Optionally, to universally ignore all 'dist' directories:
# dist
```

## What it looks like in practice

Below is the structure of the `static/` folder from one of my smaller Django projects.

You can see the `tailwind.css` file in both the `static/src/css/` and `static/dist/css/` folders. The version in `src` is the shell CSS file required by Tailwind CSS for its initial configuration, while the one in `dist` contains the compiled CSS styles actively used by the project.

For JavaScript libraries, I use the `static/public/vendor/js/` folder to store minified scripts for HTMX and Alpine.js. I prefer to place any vendored assets in their own `vendor/` folder, which helps keep the directory structure clean and organized for easier management.

```shell
static/
├── dist/
│   └── css/
│       └── tailwind.css          # Compiled CSS
├── public/
│   ├── vendor/
│   │    └── js/
│   │        ├── alpinejs.min.js  # Minified Alpine.js
│   │        └── htmx.min.js      # Minified HTMX
│   └── logo-sm.png               # Static image asset
└── src/
    └── css/
        └── tailwind.css          # Source CSS for Tailwind
```

For a slightly more complicated setup, consider a project of mine that incorporates a fairly large React SPA. The structure below demonstrates how I organize files to support both development and production environments effectively:

```shell
static/
├── dist/
│   ├── css/
│   │   └── tailwind.css     # Compiled CSS
│   ├── main-BvH4oN1P.js     # Compiled main JS file with hash for cache busting
│   ├── main-D-2GwwJG.css    # Compiled main CSS file with hash
│   ├── router-9A0RiP7h.css  # Compiled router CSS with hash
│   └── router-DlIDJo3H.js   # Compiled router JS with hash
├── public/
│   └── logo-sm.png          # Static image asset
└── src/
    ├── api/                 # API interaction layers
    ├── components/          # React components
    ├── config/              # Configuration files
    ├── contexts/            # React contexts
    ├── helpers/             # Helper functions
    ├── hooks/               # Custom React hooks
    ├── images/              # Source images
    ├── models/              # Data models
    ├── queries/             # Data fetching queries
    ├── routes/              # Route definitions
    ├── scss/                # SCSS files before processing
    ├── utils/               # Utility functions
    ├── main.tsx             # Main entry point for the SPA
    ├── router.tsx           # Router setup
    ├── tailwind.css         # Source CSS for Tailwind
    └── vite-env.d.ts        # TypeScript definitions for Vite
```

This directory structure accommodates a comprehensive React application by separating source files, components, and configuration data into subdirectories within `src/`. The `dist/` directory holds compiled and versioned assets.

## Why?

So, why opt for this segmented directory setup rather than a single `static/` or `assets/` folder containing all CSS, JS, and other static files directly in the base of the project?

To be honest, this is a strategy that many popular JS frameworks — such as Astro, Next.js, and SvelteKit — get right. They clearly distinguish between source files requiring processing and those that can be directly served. This common pattern, which I've adopted, involves placing directly servable files within a `public/` directory and others in the `src/` directory. This approach allows anyone to immediately understand which source files depend on some sort of build pipeline.

One consideration when using two source folders but only one distribution folder is the potential for file conflicts and one folder’s files clobbering another’s. However, this can generally be managed by maintaining unique filenames or organizing files within specific directories. Additionally, when using tools like Vite, which generates hashed filenames during the build, this concern is mitigated. Nonetheless, it's a trade-off worth noting in this setup.

---

Thanks for reading! I hope you've found this post useful — whether it's inspired you to try a new way of organizing your Django staticfiles, or even if it's a method you'd prefer to avoid.

I'm on Mastodon at [@josh@joshthomas.dev](https://joshthomas.dev/@josh) and would love to hear what you think.

Many thanks to [Jeff](https://mastodon.social/@webology) for reading the first draft and offering his thoughts on how I could improve it.
