from __future__ import annotations

from typing import TYPE_CHECKING

from django.core.exceptions import ObjectDoesNotExist
from django.db import models

if TYPE_CHECKING:
    from .models import OTPData
    from .models import User


class OTPDataManager(models.Manager["OTPData"]):
    def for_user(self, user: User) -> OTPData | None:
        try:
            return self.get(user=user)
        except ObjectDoesNotExist:
            return None

    def for_username(self, username: str) -> OTPData | None:
        try:
            return self.get(user__username=username)
        except ObjectDoesNotExist:
            return None
