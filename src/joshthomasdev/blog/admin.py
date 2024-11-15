from __future__ import annotations

from django.contrib import admin

from .models import Entry
from .models import Link
from .models import Tag


@admin.register(Entry)
class EntryAdmin(admin.ModelAdmin):
    list_display = ["title", "published_at"]
    ordering = ["-published_at"]


@admin.register(Link)
class LinkAdmin(admin.ModelAdmin):
    fields = [
        "title",
        "slug",
        "url",
        "via_title",
        "via_url",
        "comments",
        "tags",
        "created_at",
        "updated_at",
        "published_at",
    ]
    list_display = ["title", "created_at", "updated_at", "published_at"]
    readonly_fields = ["slug", "created_at", "updated_at"]


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ["name", "slug"]
