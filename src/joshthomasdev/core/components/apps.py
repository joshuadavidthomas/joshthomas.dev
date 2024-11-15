from __future__ import annotations

from django.apps import AppConfig
from django.conf import settings
from django_cotton.apps import wrap_loaders as cotton_wrap_loaders


def wrap_loaders(name):
    for template_config in settings.TEMPLATES:
        engine_name = (
            template_config.get("NAME") or template_config["BACKEND"].split(".")[-2]  # type: ignore[attr-defined]
        )
        if engine_name == name:
            options = template_config.setdefault("OPTIONS", {})
            loaders = options.setdefault("loaders", [])  # type: ignore[attr-defined]

            # find the inner-most loaders, which is an iterable of only strings
            while not all(isinstance(loader, str) for loader in loaders):
                for loader in loaders:
                    # if we've found a list or tuple, we aren't yet in the inner-most loaders
                    if isinstance(loader, list | tuple):
                        # reassign `loaders` variable to force the while loop restart
                        loaders = loader

            # if django-cotton's loader is the first, we good
            loaders_already_configured = (
                len(loaders) > 0 and "django_cotton.cotton_loader.Loader" == loaders[0]
            )
            # if django-cotton's templatetag is in the builtins, we good
            builtins_already_configured = (
                "django_cotton.templatetags.cotton"
                in options.setdefault("builtins", [])  # type: ignore[attr-defined]
            )

            # if aren't already configured, fallback to using django-cotton's wrapper
            if not loaders_already_configured and not builtins_already_configured:
                cotton_wrap_loaders(name)


class ComponentsConfig(AppConfig):
    name = "joshthomasdev.core.components"
    label = "core_components"
    verbose_name = "Components"

    def ready(self):
        wrap_loaders("django")
