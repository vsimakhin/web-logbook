FROM alpine

LABEL org.opencontainers.image.source="https://github.com/vsimakhin/web-logbook" \
    org.opencontainers.image.authors="Vladimir Simakhin" \
    org.opencontainers.image.title="Web Logbook" \
    org.opencontainers.image.description="Container image for Web Logbook https://github.com/vsimakhin/web-logbook"

WORKDIR /web-logbook

RUN apk update --no-cache && \
    apk add ca-certificates libssl3 openssl && \
    adduser -g "WebLogbook" -s /usr/sbin/nologin -D -H weblogbook && \
    chown -R weblogbook /web-logbook

ARG TARGETARCH

COPY ./dist/web-logbook-linux-${TARGETARCH}/web-logbook /web-logbook/web-logbook

VOLUME [ "/data", "/certs" ]

EXPOSE 4000

USER weblogbook
ENTRYPOINT ["./web-logbook" ]
CMD ["-dsn", "/data/web-logbook.sql"]