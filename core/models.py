from __future__ import annotations

from typing import TYPE_CHECKING

from django.db import models

if TYPE_CHECKING:
    from typing import Any


class TimeStamped(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False)

    class Meta:
        abstract = True
        indexes = [
            models.Index(fields=["created_at"]),
            models.Index(fields=["updated_at"]),
        ]
        ordering = ["created_at"]

    def save(self, *args, **kwargs):
        """
        Overriding the save method in order to make sure that
        modified field is updated even if it is not given as
        a parameter to the update field argument.
        """
        update_fields = kwargs.get("update_fields", None)
        if update_fields:
            kwargs["update_fields"] = set(update_fields).union({"updated_at"})

        super().save(*args, **kwargs)

    @property
    def is_edited(self):
        return self.created_at != self.updated_at


def get_min_max_of_field(queryset: models.QuerySet, field: str) -> tuple[Any, Any]:
    aggregation = queryset.aggregate(
        field_min=models.Min(field),
        field_max=models.Max(field),
    )

    field_min = aggregation.get("field_min")
    field_max = aggregation.get("field_max")

    return field_min, field_max
