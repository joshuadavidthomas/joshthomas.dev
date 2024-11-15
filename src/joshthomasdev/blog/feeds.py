from __future__ import annotations

from django.contrib.syndication.views import Feed
from django.urls import reverse

from .models import Entry


class EntriesFeed(Feed):
    title = "Josh Thomas"
    description = "Latest entries posted to Josh Thomas's blog."

    def link(self):
        return reverse("blog:index")

    def items(self):
        return Entry.objects.published().reverse_chronological()

    def item_title(self, item):
        return item.title

    def item_description(self, item):
        return item.render_content()

    def item_pubdate(self, item):
        return item.published_at

    def item_updateddate(self, item):
        return item.updated_at
