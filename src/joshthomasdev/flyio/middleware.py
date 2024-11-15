from __future__ import annotations

import os
from http import HTTPStatus

from django.http import HttpResponse

from .exceptions import WritesAttemptedError
from .machines import get_primary_instance

FLY_REPLAY = "fly-replay"


class ReplayMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)

    def process_exception(self, request, exception):
        if not isinstance(exception, WritesAttemptedError):
            return

        primary = get_primary_instance()
        response = HttpResponse(status=HTTPStatus.CONFLICT)
        response[FLY_REPLAY] = f"instance={primary}"
        return response


def region_selection_middleware(get_response):
    def middleware(request):
        response = get_response(request)

        current_region = os.environ.get("FLY_REGION")
        requested_region = request.GET.get("region")

        if requested_region and requested_region != current_region:
            response = HttpResponse(status=HTTPStatus.TEMPORARY_REDIRECT)
            replay_header = f"region={requested_region}"
            if response.has_header(FLY_REPLAY):
                response[FLY_REPLAY] += f";{ replay_header }"
            else:
                response[FLY_REPLAY] = replay_header

        return response

    return middleware
