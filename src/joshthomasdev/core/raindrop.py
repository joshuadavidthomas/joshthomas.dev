from __future__ import annotations

import httpx
from attrs import define
from django.conf import settings
from django.core.cache import cache

DEFAULT_COLLECTION = 0


@define
class RaindropIO:
    base_url = "https://api.raindrop.io/rest/v1"

    def get(
        self,
        endpoint: str,
        cache_key: str,
        perpage: int = 50,
        cache_time: int = 60 * 60,
    ) -> dict[str, object]:
        if cached_response := cache.get(cache_key):
            return cached_response

        try:
            response = httpx.get(
                f"{self.base_url}/{endpoint}",
                headers={"Authorization": f"Bearer {settings.RAINDROPIO['API_KEY']}"},
                params={
                    "perpage": perpage,
                },
            ).raise_for_status()
            response_json = response.json()
            cache.set(cache_key, response_json, cache_time)
        except httpx.HTTPError:
            response_json = {}

        return response_json

    def get_recent_raindrops(self):
        return self.get(
            f"raindrops/{DEFAULT_COLLECTION}", "recent_raindrops", perpage=5
        )


raindropio = RaindropIO()
