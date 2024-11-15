from __future__ import annotations

from django.shortcuts import render
from django.utils import timezone
from django.views.decorators.http import require_GET
from sentry_sdk import last_event_id

from joshthomasdev.blog.models import Entry

from .raindrop import raindropio
from .steam import get_recently_played_games


def custom_error_404(request, exception=None, *args, **kwargs):
    return render(request, "404.html", context={}, status=404)


def custom_error_500(request, *args, **kwargs):
    return render(
        request, "500.html", context={"sentry_event_id": last_event_id()}, status=500
    )


@require_GET
def robots_txt(request):
    return render(request, "robots.txt", content_type="text/plain")


@require_GET
def security_txt(request):
    return render(
        request,
        ".well-known/security.txt",
        context={
            "year": timezone.now().year + 1,
        },
        content_type="text/plain",
    )


@require_GET
def index(request):
    entries = Entry.objects.recent_entries(5)
    drafts = Entry.objects.drafts() if request.user.is_staff else Entry.objects.none()
    games = get_recently_played_games()
    raindrops = raindropio.get_recent_raindrops()
    return render(
        request,
        "index.html",
        context={
            "entries": entries,
            "drafts": drafts,
            "games": games,
            "raindrops": raindrops,
        },
    )
