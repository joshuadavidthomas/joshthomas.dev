from __future__ import annotations

from django.apps import AppConfig


class AdminConfig(AppConfig):
    name = "joshthomasdev.core.admin"
    label = "core_admin"
    verbose_name = "joshthomas.dev Admin"
    default_site = "core.admin.sites.AdminSite"
