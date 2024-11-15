from __future__ import annotations

import datetime
from zoneinfo import ZoneInfo

from django.conf import settings


def get_range_between_dates(
    start_date: datetime.datetime,
    end_date: datetime.datetime,
    reset_to_midnight: bool = True,
) -> list[datetime.datetime]:
    """Given a start and end date, get a list of datetime objects between the two dates.

    Return a list of datetime objects to preserve timezone information, optionally resetting
    the time to midnight.
    """
    if end_date.date() == start_date.date():
        return [
            start_date.replace(hour=0, minute=0, second=0, microsecond=0)
            if reset_to_midnight
            else start_date
        ]

    if end_date < start_date:
        date_range = [
            start_date - datetime.timedelta(days=n)
            for n in range((start_date - end_date).days + 1)
        ]
    else:
        date_range = [
            start_date + datetime.timedelta(days=n)
            for n in range((end_date - start_date).days + 1)
        ]

    if reset_to_midnight:
        date_range = [
            date.replace(hour=0, minute=0, second=0, microsecond=0)
            for date in date_range
        ]

    return date_range


def is_same_date_in_timezone(
    source_datetime: datetime.datetime,
    target_datetime: datetime.datetime,
    timezone: str | ZoneInfo | None = None,
) -> bool:
    """Given a datetime object, convert to the given timezone and compare to the target datetime's date.

    By default, we use the timezone defined in settings.TIME_ZONE, but you can pass in a
    timezone string or a ZoneInfo object to override the default.
    """
    if timezone is None:
        timezone = ZoneInfo(settings.TIME_ZONE)
    if isinstance(timezone, str):
        timezone = ZoneInfo(timezone)
    return source_datetime.astimezone(timezone).date() == target_datetime.date()
