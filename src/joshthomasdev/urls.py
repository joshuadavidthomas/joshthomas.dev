from __future__ import annotations

from django.conf import settings
from django.contrib import admin
from django.urls import include
from django.urls import path
from health_check.views import MainView

from joshthomasdev.core import views as core_views

urlpatterns = [
    path(".well-known/security.txt", core_views.security_txt),
    path("robots.txt", core_views.robots_txt),
    path("admin/", admin.site.urls),
    path("blog/", include("blog.urls")),
    path("health/", MainView.as_view()),
    path("404/", core_views.custom_error_404, name="404"),
    path("500/", core_views.custom_error_500, name="500"),
    path("", core_views.index, name="index"),
]

handler404 = "joshthomasdev.core.views.custom_error_404"  # noqa: F811
handler500 = "joshthomasdev.core.views.custom_error_500"  # noqa: F811


if settings.DEBUG:
    urlpatterns = [
        path("__debug__/", include("debug_toolbar.urls")),
        path("__reload__/", include("django_browser_reload.urls")),
    ] + urlpatterns
