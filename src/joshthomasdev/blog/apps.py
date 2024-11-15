from __future__ import annotations

from django.apps import AppConfig


class BlogConfig(AppConfig):
    default_auto_field = "django.db.models.AutoField"
    name = "joshthomasdev.blog"
    label = "blog"
    verbose_name = "Blog"
