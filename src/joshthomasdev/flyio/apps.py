from __future__ import annotations

from django.apps import AppConfig
from django.db import connections
from django.db.backends.signals import connection_created

from .db_hook import install_hook
from .machines import is_primary_instance


class FlyioConfig(AppConfig):
    default_auto_field = "django.db.models.AutoField"
    name = "joshthomasdev.flyio"
    label = "flyio"
    verbose_name = "Fly.io"

    def ready(self) -> None:
        if is_primary_instance():
            return
        install_hook(connections["default"])
        connection_created.connect(install_hook)
