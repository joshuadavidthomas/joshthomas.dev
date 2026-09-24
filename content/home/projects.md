---
title: Projects
order: 2
kind: projects
link:
  label: More on GitHub
  href: https://github.com/joshuadavidthomas?tab=repositories&type=source
---

Most of these started because I wanted something that didn’t exist, wanted to understand how something worked, or got curious enough to disappear down a rabbit hole. I learned to build software by reading what other people put out in the open, so this is where a lot of mine ends up too.

# Language tooling & editors

Learning Rust led me to build a language server for Django. The editor extensions and pre-commit integration are separate pieces of the same project: making Django templates easier to work with wherever you write them.

## [django-language-server](https://github.com/joshuadavidthomas/django-language-server)

A language server for Django, written in Rust. It started because I wanted a real project to learn Rust with, and I’d wanted better tooling for Django templates for years. It has since turned into a much bigger static-analysis problem than I expected: parsing Python and Django templates, following values through a project, understanding models, forms, URLs, settings, and template context, all without importing or executing the Django project. It’s probably the project I’ve learned the most from. I knew basically nothing about language servers, compilers, parsers, or static analysis when I started it.

## [tree-sitter-htmldjango](https://github.com/joshuadavidthomas/tree-sitter-htmldjango)

A fork of the tree-sitter grammar for Django templates that I maintain for Zed, with fixes and additions for comments, translation syntax, and verbatim blocks.

## [zed-django](https://github.com/joshuadavidthomas/zed-django)

Django support for the Zed editor.

## [djls-vscode](https://github.com/joshuadavidthomas/djls-vscode)

A VS Code client for Django Language Server.

## [djls-pre-commit](https://github.com/joshuadavidthomas/djls-pre-commit)

Run Django Language Server checks with pre-commit.

## [django-template-ast](https://github.com/joshuadavidthomas/django-template-ast)

_Experiment._ An earlier attempt at learning Rust by building a Django template compiler, before the language server.

## [djtagspecs](https://github.com/joshuadavidthomas/djtagspecs)

_Abandoned experiment._ An RFC-style specification for describing Django template tags in TOML, from the early language-server work. I eventually abandoned the approach in favor of extracting the information statically, but I’ve kept it around as a record of one of the paths I went down first.

# Django & Python

Most of my day-to-day web development is in Django, so I’ve ended up making a lot of things for it. Some came out of work, some were things I wanted for my own projects, and some were just ideas I wanted to try.

## [mcp-django](https://github.com/joshuadavidthomas/mcp-django)

An MCP server that gives coding agents structured, ORM-aware access to Django projects. Instead of making an agent work everything out from source text alone, it gives it a way to inspect the project through Django itself.

## djangodocs\.org

Documentation search built for the way I use Django with coding agents: get the relevant documentation into context without making the model hunt through the web or guess. It’s currently in private alpha.

## [docs2markdown](https://github.com/joshuadavidthomas/docs2markdown)

The CLI tool and Python library underneath djangodocs\.org, which turns HTML documentation into Markdown suitable for search and LLM context.

## [django-github-app](https://github.com/joshuadavidthomas/django-github-app)

A toolkit for building GitHub Apps with Django: signed webhooks, event routing, installation and repository state, and authenticated sync and async GitHub API clients. It now powers the Python Software Foundation’s CLA bot.

## [django-simple-nav](https://github.com/joshuadavidthomas/django-simple-nav)

Define navigation in Python and render it in Django templates, with URL resolution, active-page detection, and permission filtering.

## [django-bird](https://github.com/joshuadavidthomas/django-bird)

Reusable components defined entirely in Django templates, with properties, slots, and their own CSS and JavaScript. I wanted the ergonomics of a component system without leaving Django’s template language. I’m not actively maintaining it these days; most of that time now goes into the language server. High-flying components for perfectionists with deadlines.

## [django-bird-playground](https://github.com/joshuadavidthomas/django-bird-playground)

An interactive web playground for building and testing django-bird components.

## [django-bird-autoconf](https://github.com/joshuadavidthomas/django-bird-autoconf)

Automatically configures the Django settings needed by django-bird.

## [django-q-signals](https://github.com/joshuadavidthomas/django-q-signals)

Process Django signals asynchronously with Django Q2.

# LLMs & agent harnesses

I use coding agents enough to keep finding things I want them to do differently. Some of these extend OpenCode or Pi; others help me share skills, manage sessions, or keep track of usage across tools.

## [ast-grep-rules](https://github.com/joshuadavidthomas/ast-grep-rules)

Reusable ast-grep rules for catching recurring mistakes in agent-written code, across Rust, TypeScript, Svelte, Python, Go, and more. They run as deterministic checks rather than relying on the agent to remember the same instructions every time.

## [gh-actionkit](https://github.com/joshuadavidthomas/gh-actionkit)

A GitHub CLI extension for finding Actions, checking for outdated references, validating workflow syntax, and running security checks.

## [agent-skills](https://github.com/joshuadavidthomas/agent-skills)

Workflows and patterns for coding agents, packaged as reusable skills.

## [ts-skills](https://github.com/joshuadavidthomas/ts-skills)

A registry for sharing agent skills privately within a Tailscale network.

## [vibeusage](https://github.com/joshuadavidthomas/vibeusage)

Track usage across LLM providers from the terminal.

## [opencode-beads](https://github.com/joshuadavidthomas/opencode-beads)

The Beads issue tracker inside OpenCode, so an agent can create, update, and reason about work without leaving the coding session.

## [opencode-agent-memory](https://github.com/joshuadavidthomas/opencode-agent-memory)

Persistent memory for OpenCode, inspired by Letta. It started from wanting useful context to survive between coding sessions without stuffing everything into one ever-growing prompt.

## [opencode-agent-skills](https://github.com/joshuadavidthomas/opencode-agent-skills)

An OpenCode plugin that provides tools for using agent skills.

## [opencode-handoff](https://github.com/joshuadavidthomas/opencode-handoff)

Create focused handoff prompts for continuing work in new OpenCode sessions.

## [pi-o-my](https://github.com/joshuadavidthomas/pi-o-my)

My collection of Pi extensions, installable together or individually.

## [pi-opensync-plugin](https://github.com/joshuadavidthomas/pi-opensync-plugin)

Sync Pi sessions to OpenSync dashboards.

## [hrd](https://github.com/joshuadavidthomas/hrd)

A terminal picker for local and remote Herdr sessions, with support for Sprites sandboxes.

## [agents-svelte](https://github.com/joshuadavidthomas/agents-svelte)

Community Svelte 5 bindings for the Cloudflare Agents SDK.

## [llm-uv-tool](https://github.com/joshuadavidthomas/llm-uv-tool)

Makes plugin installation and upgrades work when Simon Willison’s LLM command-line tool is installed through uv tool.

## [pi-peon-ping](https://github.com/joshuadavidthomas/pi-peon-ping)

Peon-ping sound notifications for the Pi coding agent.

# Web interfaces

I use Svelte for most of my frontend work outside Django. A few of these started because I found something built for React that I liked and wanted to use it without React.

## [kumo-svelte](https://github.com/joshuadavidthomas/kumo-svelte)

A Svelte 5 port of Cloudflare’s Kumo component library.

## [sveltekit-adapter-cloudflare](https://github.com/joshuadavidthomas/sveltekit-adapter-cloudflare)

A fork of @sveltejs/adapter-cloudflare with support for scheduled, queue, and email handlers.

## [sonner-web-component](https://github.com/joshuadavidthomas/sonner-web-component)

A web-component port of Emil Kowalski’s Sonner toast library.

# Desktop & command-line tools

Small tools for my own computer, mostly Linux: capturing a thought, working in the terminal, or filling a gap in the software I use. Some are everyday tools, and some are still ideas I’m trying out.

## [waywire](https://github.com/joshuadavidthomas/waywire)

Stream a Wayland desktop to the browser.

## [dashtext](https://github.com/joshuadavidthomas/dashtext)

A quick-capture text editor for Linux, inspired by Drafts.

## [dictate](https://github.com/joshuadavidthomas/dictate)

A command-line tool for local voice-to-text transcription on Linux.

## [kbd](https://github.com/joshuadavidthomas/kbd)

A keyboard-shortcut engine for Rust.

## [wakatime-focusd](https://github.com/joshuadavidthomas/wakatime-focusd)

A daemon for Linux that tracks focused desktop applications and sends heartbeats to WakaTime.

## [sp](https://github.com/joshuadavidthomas/sp)

_Prototype._ A personal music player for the Linux terminal.

# Shared work at The Westervelt Company

Libraries shared across our applications at work and published for other people to use, too. They grew out of the practical details of running Django applications together.

## [django-email-relay](https://github.com/westerveltco/django-email-relay)

A database-backed email queue that relays mail from multiple Django applications through an internal SMTP server.

## [django-twc-toolbox](https://github.com/westerveltco/django-twc-toolbox)

Shared tools for Django projects at The Westervelt Company.

## [django-q-registry](https://github.com/westerveltco/django-q-registry)

Register periodic Django Q tasks.

## [django-flyio](https://github.com/westerveltco/django-flyio)

Utilities for Django apps running on Fly\.io.

## [wagtail-heroicons](https://github.com/westerveltco/wagtail-heroicons)

Heroicons in the Wagtail admin.
