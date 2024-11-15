from __future__ import annotations

import pyotp
import qrcode
import qrcode.image.svg
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.db import models

from joshthomasdev.core.models import TimeStamped

from .managers import OTPDataManager


class User(AbstractUser):
    def __str__(self) -> str:
        return self.username

    def create_otp_data(self) -> OTPData:
        if hasattr(self, "otp_data"):
            msg = "Cannot create OTPData for user that already has one"
            raise ValidationError(msg)

        return OTPData.objects.create(
            user=self,
            secret=pyotp.random_base32(),
        )


class OTPData(TimeStamped, models.Model):
    user = models.OneToOneField(
        "users.User", on_delete=models.CASCADE, related_name="otp_data"
    )
    secret = models.CharField(max_length=255)

    objects = OTPDataManager()

    def generate_qrcode(self) -> str:
        totp = pyotp.TOTP(self.secret)
        qr_uri = totp.provisioning_uri(
            name=self.user.email, issuer_name="joshthomas.dev Admin 2FA"
        )
        qr_code_image = qrcode.make(
            qr_uri,
            image_factory=qrcode.image.svg.SvgPathImage,
        )
        return qr_code_image.to_string().decode("utf-8")

    def validate_otp(self, otp: str | None) -> bool:
        if otp is None:
            return False

        totp = pyotp.TOTP(self.secret)

        return totp.verify(otp)
