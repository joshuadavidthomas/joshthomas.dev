from __future__ import annotations

from django.contrib.admin.apps import AdminConfig as BaseAdminConfig


class AdminConfig(BaseAdminConfig):
    default_site = "core.admin.sites.AdminSite"
