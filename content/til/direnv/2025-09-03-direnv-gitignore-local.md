---
title: Using direnv to add a personal `.gitignore` file to repos
---

Git comes with a handy way to add custom user ignore rules to a repository without messing with a repo's default `.gitignore`: the `.git/info/exclude` file. It uses the same syntax and rules, but stays local to your repository and never gets committed.

Git only mentions this in its reference documentation (like the [gitignore page](https://git-scm.com/docs/gitignore)) — nothing in the book or guides where you'd actually look for it, at least that I could find.

The problem: I need personal ignore files just infrequently enough that I can never remember the exact path buried in `.git/`. What I want is a `.gitignore.local` — visible in the project root.

To solve this I turned to one of my favorite utilities, [direnv](https://github.com/direnv/direnv). I added a function to my direnv utilities (`~/.config/direnv/utils.sh`) that watches for `.gitignore.local` files: 

```bash
#!/usr/bin/env bash

set -oue pipefail

gitignore_local() {
    local log_prefix="gitignore_local"

    watch_file .gitignore.local

    if [ -f ".gitignore.local" ] && [ -d ".git" ]; then
        log_status "Found .gitignore.local file"
        mkdir -p ".git/info" || {
            log_error "Failed to create .git/info directory"
            return 1
        }

        log_status "Updating exclude file with .gitignore.local contents"
        {
            echo ".gitignore.local"
            cat ".gitignore.local"
        } >".git/info/exclude" || {
            log_error "Failed to write to .git/info/exclude"
            return 1
        }

        local pattern_count=$(grep -v "^#" ".git/info/exclude" | grep -v "^$" | wc -l | tr -d ' ')
        log_status "Applied $pattern_count ignore patterns"
    fi
}
```

All this does is check if both a `.gitignore.local` file and `.git` directory exist, then copies the contents to `.git/info/exclude` (after first adding `.gitignore.local` itself to the exclude list to prevent accidentally committing it). The `watch_file` is from the direnv stdlib and ensures direnv reloads when `.gitignore.local` changes. The `log_status`/`log_error` are custom logging utility functions I use across my direnv setup for consistent output.

You could simplify this a bit to just:

```bash
gitignore_local() {
    if [ -f .gitignore.local ]; then
        cp .gitignore.local .git/info/exclude
    fi
}
```

But the more verbose version gives helpful logging feedback about what's happening, handles edge cases like missing directories, and automatically adds `.gitignore.local` itself to the exclude list. With the simple version, you would need to add `.gitignore.local` to your global `~/.config/git/ignore` file yourself.

Once added to your direnv config, you can use this one of two ways. Either adding a `gitignore_local` line to a repo's `.envrc` or if, like me, you want this to apply this globally, add it to your `~/.config/direnv/direnvrc`:

```bash
# .envrc or ~/.config/direnv/direnvrc
#!/usr/bin/env bash

gitignore_local
```

I've found this super useful for:

- My own editor configurations (project specific Neovim configs via [`.lazy.lua`](https://kezhenxu94.me/blog/lazyvim-project-specific-settings) FTW)
- A `Justfile` containing any custom scripts or recipes for working with a project
- Project-specific notes or TODO files

H/T to [Marijke Luttekes](https://hachyderm.io/@mahryekuh/115139824041941241) for the Mastodon post that reminded me about `.git/info/exclude`, and led to me remembering I had written this direnv utility to fix my small problem with it but had never written or posted about it.
