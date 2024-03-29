ARG PYTHON_VERSION=3.12
ARG NODE_VERSION=20.9.0
ARG NVM_VERSION=0.39.5
ARG TAILWINDCSS_VERSION=3.4.0
ARG UID=1000
ARG GID=1000

FROM python:${PYTHON_VERSION}-slim as base
ARG UID
ARG GID
ENV DEBUG False
ENV PYTHONPATH /app
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
RUN mkdir -p /app /app/mediafiles
RUN echo 'deb http://deb.debian.org/debian/ bookworm main contrib' >> /etc/apt/sources.list \
	&& DEBIAN_FRONTEND=noninteractive apt-get update && apt-get install -y --no-install-recommends \
	build-essential \
	curl \
	# litefs
	fuse3 \
	gosu \
	sqlite3 \
	# cleanup
	&& apt-get autoremove -y && apt-get clean -y && rm -rf /var/lib/apt/lists/*
RUN addgroup -gid "${GID}" --system django \
	&& adduser -uid "${UID}" -gid "${GID}" --home /home/django --system django
WORKDIR /app


FROM base as py
COPY requirements*.txt ./
RUN python -m pip install --upgrade pip \
	&& python -m pip install -r requirements.txt


FROM base as node
ARG NODE_VERSION
ARG NVM_VERSION
ENV NVM_DIR=/usr/local/share/nvm
ENV PATH="$NVM_DIR/versions/node/v${NODE_VERSION}/bin:${PATH}"
COPY --from=py /usr/local /usr/local
COPY package*.json /app/
RUN mkdir -p ${NVM_DIR} \
	&& curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v${NVM_VERSION}/install.sh | bash \
	&& . "$NVM_DIR/nvm.sh" \
	&& nvm use v${NODE_VERSION} \
	&& nvm alias default v${NODE_VERSION} \
	&& chmod -R 755 "$NVM_DIR" \
	&& npm install -g npm@latest \
	&& npm install


FROM node as tailwind
ARG TAILWINDCSS_VERSION
ADD https://github.com/tailwindlabs/tailwindcss/releases/download/v${TAILWINDCSS_VERSION}/tailwindcss-linux-x64 /usr/local/bin/tailwindcss-linux-x64-${TAILWINDCSS_VERSION}
RUN chmod 755 /usr/local/bin/tailwindcss-linux-x64-${TAILWINDCSS_VERSION} \
	&& chown ${UID}:${GID} /usr/local/bin/tailwindcss-linux-x64-${TAILWINDCSS_VERSION}


FROM base as app
COPY --from=py /usr/local /usr/local
COPY litefs.yml manage.py redirects.json /app/
COPY blog /app/blog
COPY config /app/config
COPY core /app/core
COPY flyio /app/flyio
COPY templates /app/templates
COPY users /app/users


FROM node as node-final
COPY --from=tailwind /usr/local /usr/local
COPY --from=app /app /app
COPY static /app/static
COPY postcss.config.cjs tailwind.config.cjs /app/
RUN python manage.py tailwind --skip-checks build


FROM app as static
ENV DATABASE_URL sqlite://:memory:
COPY --from=py /usr/local /usr/local
COPY --from=node-final /app/static/dist /app/static/dist
COPY static/public /app/static/public
RUN python manage.py collectstatic --noinput --clear --skip-checks --no-default-ignore


FROM base as final
COPY --from=py /usr/local /usr/local
COPY --from=app /app /app
COPY --from=static /app/staticfiles /app/staticfiles
COPY --from=flyio/litefs:0.5 /usr/local/bin/litefs /usr/local/bin/litefs
RUN chown -R django:django /app \
	&& DEBIAN_FRONTEND=noninteractive apt-get remove -y --purge \
	build-essential \
	curl \
	&& apt-get autoremove -y && apt-get clean -y && rm -rf /var/lib/apt/lists/*
EXPOSE 8000
ENTRYPOINT litefs mount
