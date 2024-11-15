from __future__ import annotations

from urllib.parse import urlparse

from django import template

register = template.Library()


@register.filter
def domain(url):
    parsed_uri = urlparse(url)
    return parsed_uri.netloc.replace("www.", "")
