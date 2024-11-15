from __future__ import annotations

import json
from http import HTTPStatus
from pathlib import Path

from attrs import define
from django.http import HttpRequest
from django.urls import NoReverseMatch
from django.urls import reverse


@define(frozen=True)
class Redirects:
    redirects: list[Redirect]

    @classmethod
    def from_json(cls, path: Path) -> Redirects:
        contents = json.loads(path.read_text())
        return cls(
            redirects=[
                Redirect(
                    source=redirect["source"],
                    destination=redirect["destination"],
                    permanent=redirect.get("permanent", False),
                )
                for redirect in contents
            ]
        )

    @property
    def paths(self) -> list[str]:
        return [redirect.source for redirect in self.redirects]

    def get_redirect(self, request: HttpRequest) -> Redirect | None:
        path = request.path[:-1] if request.path.endswith("/") else request.path
        if path in self.paths:
            redirect = next(
                redirect for redirect in self.redirects if redirect.source == path
            )
            return redirect
        return None


@define(frozen=True)
class Redirect:
    source: str
    destination: str
    permanent: bool = False

    def get_destination_url(self) -> str:
        try:
            return reverse(self.destination)
        except NoReverseMatch:
            return self.destination

    def get_status(self) -> HTTPStatus:
        match self.permanent:
            case True:
                return HTTPStatus.MOVED_PERMANENTLY
            case _:
                return HTTPStatus.TEMPORARY_REDIRECT
