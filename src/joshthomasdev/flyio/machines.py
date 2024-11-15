from __future__ import annotations

from pathlib import Path

from django.conf import settings

PRIMARY_PATH = Path(settings.DATABASES["default"]["NAME"]).parent / ".primary"


def is_primary_instance() -> bool:
    return not PRIMARY_PATH.is_file()


def get_primary_instance() -> str:
    return PRIMARY_PATH.read_text().strip()
