FROM alpine:3.22

ENV NODE_VERSION 22.16.0-r2
ENV NPM_VERSION 11.3.0-r1

VOLUME ["/app/node_modules"]

RUN echo @edge http://dl-cdn.alpinelinux.org/alpine/edge/community >> /etc/apk/repositories
RUN apk upgrade --update-cache --available
RUN apk update

RUN apk add --no-cache \
    nodejs="$NODE_VERSION" \
    npm="$NPM_VERSION"

RUN npm config set legacy-peer-deps true
RUN npm i -g npm-check-updates

WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
