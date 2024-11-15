from __future__ import annotations

from django.http import HttpRequest
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.shortcuts import render

from .models import Entry
from .services import PostService


def index(request: HttpRequest) -> HttpResponse:
    dated_items, page_obj = PostService.get_posts(request)

    return render(
        request,
        "blog/index.html",
        {
            "dated_items": dated_items,
            "page_obj": page_obj,
        },
    )


def entry(request: HttpRequest, year: int, slug: str) -> HttpResponse:
    entry = get_object_or_404(Entry, slug=slug, published_at__year=year)
    return render(request, "blog/entry.html", {"entry": entry})
