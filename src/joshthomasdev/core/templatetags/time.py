from __future__ import annotations

from datetime import datetime

from django import template

register = template.Library()


@register.filter
def minutes_to_hours(minutes):
    return round(minutes / 60, 2)


@register.filter
def format_date_str(date_str, format):
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%dT%H:%M:%SZ")
        return dt.strftime(format)
    except ValueError:
        return date_str
