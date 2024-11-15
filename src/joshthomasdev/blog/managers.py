from __future__ import annotations

from typing import TYPE_CHECKING

from django.core.paginator import Page
from django.core.paginator import Paginator
from django.db import models
from django.utils import timezone

if TYPE_CHECKING:
    from django.contrib.auth.models import AnonymousUser

    from users.models import User

    from .models import Entry


class EntryQuerySet(models.QuerySet["Entry"]):
    def for_user(self, user: User | AnonymousUser):
        return self.published()

    def with_is_draft(self):
        return self.annotate(
            is_draft=models.Case(
                models.When(published_at__isnull=True, then=models.Value(True)),
                default=models.Value(False),
                output_field=models.BooleanField(),
            )
        )

    def published(self):
        return self.with_is_draft().filter(
            is_draft=False, published_at__lte=timezone.now()
        )

    def drafts(self):
        return self.with_is_draft().filter(is_draft=True)

    def chronological(self):
        return self.order_by("published_at")

    def reverse_chronological(self):
        return self.order_by("-published_at")

    def recent_entries(self, count: int = 10):
        return self.published().reverse_chronological()[:count]

    def paginated(
        self, page_number: int | str | None = 1, per_page: int = 10
    ) -> Page["Entry"]:
        paginator = Paginator(self, per_page)

        page_number = page_number or 1
        page_obj = paginator.get_page(int(page_number))

        return page_obj
