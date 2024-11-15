from __future__ import annotations

import datetime

import pytest

from joshthomasdev.core.date_utils import get_range_between_dates


@pytest.mark.parametrize(
    "start_date,end_date,expected",
    [
        (
            datetime.datetime(2021, 1, 1),
            datetime.datetime(2021, 1, 1),
            [datetime.datetime(2021, 1, 1)],
        ),
        (
            datetime.datetime(2021, 1, 1),
            datetime.datetime(2021, 1, 2),
            [datetime.datetime(2021, 1, 1), datetime.datetime(2021, 1, 2)],
        ),
        (
            datetime.datetime(2021, 1, 2),
            datetime.datetime(2021, 1, 1),
            [datetime.datetime(2021, 1, 2), datetime.datetime(2021, 1, 1)],
        ),
    ],
)
def test_get_range_between_dates(start_date, end_date, expected):
    assert get_range_between_dates(start_date, end_date) == expected
