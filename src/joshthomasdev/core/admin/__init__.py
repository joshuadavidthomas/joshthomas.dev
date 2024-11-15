from __future__ import annotations

from django.contrib.admin.apps import AdminConfig


class default(AdminConfig):
    default_site = "joshthomasdev.core.admin.sites.AdminSite"
