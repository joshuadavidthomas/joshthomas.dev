from __future__ import annotations

import httpx
from django.conf import settings
from django.core.cache import cache


def get_recently_played_games(cache_time: int = 60 * 60 * 24):
    CACHE_KEY = "steam_recently_played"
    if cache.get(CACHE_KEY):
        games = cache.get(CACHE_KEY)
    else:
        try:
            games = httpx.get(
                "https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/",
                params={
                    "key": settings.STEAM["API_KEY"],
                    "steamid": settings.STEAM["USER_ID"],
                },
            ).raise_for_status()
            games = games.json()
            cache.set(CACHE_KEY, games, cache_time)
        except httpx.HTTPError:
            return None

    if games["response"]["total_count"] == 0:
        return None

    games["response"]["games"] = sorted(
        games["response"]["games"], key=lambda x: x["playtime_2weeks"], reverse=True
    )
    return games["response"]
