from __future__ import annotations

from django.conf import settings
from django.contrib import admin
from django.contrib.auth import REDIRECT_FIELD_NAME
from django.urls import path
from django.urls import reverse

from joshthomasdev import __version__
from joshthomasdev.users.models import OTPData

from .views import AdminConfirmTwoFactorAuthView
from .views import AdminSetupTwoFactorAuthView


class AdminSite(admin.AdminSite):
    admin_header = f"joshthomas.dev v{__version__} Admin"
    site_header = admin_header
    site_title = admin_header
    enable_nav_sidebar = False

    def get_urls(self):
        base_urlpatterns = super().get_urls()

        extra_urlpatterns = [
            path(
                "setup-2fa/",
                self.admin_view(AdminSetupTwoFactorAuthView.as_view()),
                name="setup-2fa",
            ),
            path(
                "confirm-2fa/",
                self.admin_view(AdminConfirmTwoFactorAuthView.as_view()),
                name="confirm-2fa",
            ),
        ]

        return extra_urlpatterns + base_urlpatterns

    def login(self, request, *args, **kwargs):
        if request.method != "POST" or not settings.ENABLE_ADMIN_2FA:
            return super().login(request, *args, **kwargs)

        username = request.POST.get("username")

        two_factor_auth_data = OTPData.objects.for_username(username)

        request.POST._mutable = True
        request.POST[REDIRECT_FIELD_NAME] = reverse("admin:confirm-2fa")

        if two_factor_auth_data is None:
            request.POST[REDIRECT_FIELD_NAME] = reverse("admin:setup-2fa")

        request.POST._mutable = False

        return super().login(request, *args, **kwargs)
