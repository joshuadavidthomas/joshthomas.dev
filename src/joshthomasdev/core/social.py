from __future__ import annotations

from attrs import define
from django.urls import NoReverseMatch
from django.urls import reverse


@define
class SocialItem:
    title: str
    url: str
    icon: str = "exclamation-triangle"
    icon_template: str = ""

    def get_url(self) -> str:
        try:
            return reverse(self.url)
        except NoReverseMatch:
            return self.url
