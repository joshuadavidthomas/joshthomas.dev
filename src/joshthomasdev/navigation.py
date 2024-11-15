from __future__ import annotations

from django_simple_nav.nav import Nav
from django_simple_nav.nav import NavItem


class MainNav(Nav):
    template_name = "navigation/main.html"
    items = [
        NavItem(title="Home", url="index"),
        NavItem(title="Blog", url="blog:index"),
        NavItem(
            title="Admin",
            url="admin:index",
            permissions=["is_staff"],
            extra_context={"boost": False},
        ),
    ]


class SocialNav(Nav):
    template_name = "navigation/social.html"
    items = [
        NavItem(
            title="Email",
            url="mailto:hello@joshthomas.dev",
            extra_context={"icon": "envelope"},
        ),
        NavItem(
            title="Mastodon",
            url="https://joshthomas.dev/@josh",
        ),
        NavItem(
            title="Bluesky",
            url="https://bsky.app/profile/joshthomas.dev",
        ),
        NavItem(
            title="GitHub",
            url="https://github.com/joshuadavidthomas",
        ),
        NavItem(
            title="LinkedIn",
            url="https://www.linkedin.com/in/joshua-thomas-b1745a16/",
        ),
        NavItem(
            title="RSS",
            url="blog:feed",
        ),
    ]
