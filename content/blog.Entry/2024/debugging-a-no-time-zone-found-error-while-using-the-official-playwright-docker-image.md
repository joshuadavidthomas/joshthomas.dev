title: Debugging a "No time zone found" error while using the official Playwright Docker image
slug: debugging-a-no-time-zone-found-error-while-using-the-official-playwright-docker-image
summary: "I ran into a surprising hiccup after making a change to my `Dockerfile`: the time zone data was missing! Here's how I tracked down the source of the error."
published_at: 2024-05-01 18:48:00+00:00

---

I recently ran into an odd error after refactoring a small part of the [`Dockerfile` template](https://github.com/westerveltco/django-twc-project/blob/af641ecb727e9b3e6efae420b1c1101cffc3fbdc/examples/default/Dockerfile) we use at my [day job](https://westervelt.com). It took me a while to chase down where the error was coming from and connect all the dots to realize that the change I had made was the reason for that error.

After making the change to the `Dockerfile`, I went and worked on something else unrelated for a while. When I circled back after some time had passed and the change had left my brain, I built and started the Docker Compose stack for the application using the updated `Dockerfile`. That's when the application threw the following traceback:

```bash
app-1       |   File "/usr/local/lib/python3.12/site-packages/django/utils/timezone.py", line 52, in get_default_timezone
app-1       |     return zoneinfo.ZoneInfo(settings.TIME_ZONE)
app-1       |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
app-1       |   File "/usr/local/lib/python3.12/zoneinfo/_common.py", line 24, in load_tzdata
app-1       |     raise ZoneInfoNotFoundError(f"No time zone found with key {key}")
app-1       | zoneinfo._common.ZoneInfoNotFoundError: 'No time zone found with key America/Chicago'
```

I thought that was odd since I had never encountered this error before. I've created plenty of timezone related bugs, but the data had always been there for me to screw up. So, what had changed? Where did my timezones go?

## An unrelated change?

As part of our common `Dockerfile` template, we install Playwright for end-to-end testing. It's installed in two stages: one to install the library and all the system dependencies it needs, and another to use that stage to load our application code in development. It looks like this:

```dockerfile
# the `py` stage (not shown) installs all of our application's
# Python dependencies
FROM py as playwright
ENV PLAYWRIGHT_BROWSERS_PATH /usr/local/bin/playwright-browsers
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
  --mount=type=cache,target=/var/lib/apt,sharing=locked \
  apt-get update --fix-missing \
  && playwright install --with-deps

FROM playwright as dev
# the `app` stage (not shown) copies all of our application's source code
# into the Docker image
COPY --from=app --link /app /app
```

While this worked, whenever the cache for the initial `playwright` build stage was invalidated -- typically by changing something regarding a Python dependency -- you would have to install Playwright, its system dependencies, and the browsers all over again. I started to get very frustrated with this as the build process for Playwright involves installing a ton of system dependencies and the browsers themselves, so it can be quite slow.

As a solution, I decided to leverage the Docker image Microsoft provides at `mcr.microsoft.com/playwright/python` instead of installing Playwright manually. As a bonus, it got rid of the extra build stage and slimmed our `Dockerfile` down slightly.

```diff
-FROM py as playwright
-ENV PLAYWRIGHT_BROWSERS_PATH /usr/local/bin/playwright-browsers
-RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
-  --mount=type=cache,target=/var/lib/apt,sharing=locked \
-  apt-get update --fix-missing \
-  && playwright install --with-deps

-FROM playwright as dev
+FROM mcr.microsoft.com/playwright/python:v1.43.0 as dev
+COPY --from=py --link /usr/local /usr/local
 COPY --from=app --link /app /app
```

!!! note

    Microsoft does not provide a tag for major or minor versions, only the full version number including the patch, so to ensure there is no drift between the version of Playwright used in the `Dockerfile` stage and the version installed by the application, I also adjusted the `requirements.in` to pin the version there as well:

    ```linuxconfig
    playwright==1.43.0
    ```

Once I made this change, I went and worked on something else. When I came back, I saw the timezone error at the top of the post and was very confused. Where did the timezone data go? Did I bump the version of Python or Django without realizing it and there was a breaking change there? It was just working this morning, why would it not work now? Nothing has changed, I haven't even touched anything related to timezones!

## Connecting the dots

It had been just long enough since making the Playwright change that I had completely forgotten that the call was coming from inside the house.

It took me a while to connect the dots, but after testing a bunch of different things -- downgrading both Python and Django, forcing an upgrade to the latest for both, combing through my `Dockerfile` line-by-line for any clue -- I managed to track down the source of the bug after looking at the source code for the two `Dockerfile` images.

Playwright Docker image's base is `ubuntu` and does not come with `tzdata` installed in the base image -- which Python's stdlib library `zoneinfo` relies on for Linux. Previously, I used the official Python Docker image as a base for all build stages, which does install `tzdata`.

Once I tracked this down, it was a simple fix:

```diff
 FROM playwright as dev
 FROM mcr.microsoft.com/playwright/python:v1.43.0 as dev
 COPY --from=py --link /usr/local /usr/local
 COPY --from=app --link /app /app
+RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
+  --mount=type=cache,target=/var/lib/apt,sharing=locked \
+  apt-get update --fix-missing \
+  && apt-get install -y --no-install-recommends \
+  tzdata \
+  && apt-get autoremove -y && apt-get clean -y && rm -rf /var/lib/apt/lists/*
```

I considered adding the `tzdata` Python package to my application's dependencies. However, since this Docker build stage is solely used in development and I can rely on the official Python Docker image to include `tzdata` (for now!), sticking with this approach seemed the best way forward.

---

This was an interesting bug to track down. Fortunately, the recent switch to the Playwright Docker image was still fresh in my mind. Even though I initially forgot about the change, this proximity in time helped me quickly track down the source of the bug. Had there been a delay of a day or more between introducing the change and the bug happening, I can't help but wonder how much longer it might have taken to solve this puzzle.
