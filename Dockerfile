# syntax=docker/dockerfile:1
ARG DJANGO_PORT=8000
ARG PYTHON_VERSION=3.12
ARG NODE_VERSION=20
ARG UID=1000
ARG GID=1000

FROM python:${PYTHON_VERSION}-slim as base

SHELL ["/bin/sh", "-exc"]
ARG NODE_VERSION
ARG UID
ARG GID
ENV DEBIAN_FRONTEND noninteractive
ENV DEBUG False
ENV PYTHONPATH /app
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PIP_DISABLE_PIP_VERSION_CHECK 1
ENV UV_LINK_MODE copy
ENV UV_COMPILE_BYTECODE 1
ENV UV_PYTHON_DOWNLOADS never
ENV UV_PYTHON python${PYTHON_VERSION}
ENV UV_PROJECT_ENVIRONMENT /app

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
  --mount=type=cache,target=/var/lib/apt,sharing=locked \
  apt-get update -qy \
  && apt-get install -qyy \
  -o APT::Install-Recommends=false \
  -o APT::Install-Suggests=false \
  build-essential \
  curl \
  git \
  jq \
  && curl -sL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - \
  && apt-get update -qy \
  && apt-get install -qyy \
  -o APT::Install-Recommends=false \
  -o APT::Install-Suggests=false \
  nodejs \
  && npm install -g npm@latest \
  && apt-get clean -y \
  && rm -rf /var/lib/apt/lists/*


FROM base AS py-deps

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
COPY pyproject.toml uv.lock /_lock/
RUN --mount=type=cache,target=/root/.cache <<EOT
cd /_lock || exit
uv sync \
    --locked \
    --no-dev \
    --no-install-project
EOT


FROM py-deps AS py-dev

COPY . /src
RUN --mount=type=cache,target=/root/.cache <<EOT
cd /src || exit 1
uv sync \
    --locked \
    --dev
EOT


FROM py-deps AS py-prod

COPY . /src
RUN --mount=type=cache,target=/root/.cache <<EOT
cd /src || exit
uv sync \
  --locked \
  --no-dev \
  --no-editable
EOT


FROM py-deps as node-deps

ARG UID
ARG GID
ARG BUILDARCH
ARG BUILDVARIANT
COPY . /src
RUN --mount=type=cache,target=/root/.npm <<EOT
cd /src || exit
npm install
case ${BUILDARCH} in
  arm64)
    case ${BUILDVARIANT} in
      v7) TAILWINDCSS_ARCH=armv7 ;;
      *)  TAILWINDCSS_ARCH=arm64 ;;
    esac ;;
  *) TAILWINDCSS_ARCH=x64 ;;
esac
TAILWINDCSS_VERSION=$(jq -r '.dependencies.tailwindcss // .devDependencies.tailwindcss' package.json | sed 's/^[^0-9]*//')
curl -L https://github.com/tailwindlabs/tailwindcss/releases/download/v${TAILWINDCSS_VERSION}/tailwindcss-linux-${TAILWINDCSS_ARCH} -o /usr/local/bin/tailwindcss-linux-${TAILWINDCSS_ARCH}-${TAILWINDCSS_VERSION}
chmod 755 /usr/local/bin/tailwindcss-linux-${TAILWINDCSS_ARCH}-${TAILWINDCSS_VERSION}
chown ${UID}:${GID} /usr/local/bin/tailwindcss-linux-${TAILWINDCSS_ARCH}-${TAILWINDCSS_VERSION}
EOT


FROM py-deps AS static

COPY --from=node-final --link /app/static/dist /app/static/dist
COPY --from=node-final --link /app/package*.json /app/
COPY --link . /app/
RUN uv run manage.py tailwind --skip-checks build \
  && uv run manage.py collectstatic --noinput --clear --skip-checks --no-default-ignore


FROM python:${PYTHON_VERSION}-slim AS final

SHELL ["/bin/sh", "-exc"]
ARG DJANGO_PORT
ARG UID
ARG GID
ENV PATH=/app/bin:$PATH
ENV PYTHONPATH /app
ENV PYTHONUNBUFFERED 1

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
  --mount=type=cache,target=/var/lib/apt,sharing=locked \
  apt-get update -qy && \
  apt-get install -qyy \
  -o APT::Install-Recommends=false \
  -o APT::Install-Suggests=false \
  # litefs
  fuse3 \
  gosu \
  sqlite3 \
  && apt-get clean -y \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd -g "${GID}" --system django \
  && useradd -u "${UID}" -g "${GID}" --home /app --system django \
  && mkdir -p /app \
  && chown ${UID}:${GID} /app

COPY --from=py-deps --chown=${UID}:${GID} --link /app /app
COPY --from=static --chown=${UID}:${GID} --link /app/staticfiles /app/staticfiles
COPY --chown=${UID}:${GID} --link . /app/
COPY --from=flyio/litefs:0.5 /usr/local/bin/litefs /usr/local/bin/litefs

USER django
WORKDIR /app
EXPOSE ${DJANGO_PORT}
ENTRYPOINT litefs mount
