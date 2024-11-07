# Builder image
FROM alpine AS weblogbookbuilder

WORKDIR /web-logbook

RUN apk update --no-cache && \
    apk add ca-certificates libssl3 openssl curl jq

ARG TARGETARCH

RUN LATEST_RELEASE=$(curl --silent "https://api.github.com/repos/vsimakhin/web-logbook/releases/latest" | \
    jq -r ".assets[] | select(.name == \"web-logbook-linux-$TARGETARCH.tar.gz\") | .browser_download_url") && \
    curl -L -o web-logbook.tar.gz $LATEST_RELEASE && \
    tar -xzf web-logbook.tar.gz && \
    cp ./web-logbook-linux-${TARGETARCH}/web-logbook ./ && \
    rm -rf web-logbook.tar.gz web-logbook-linux-${TARGETARCH}

# Final image
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

COPY --from=weblogbookbuilder /web-logbook/web-logbook /web-logbook/web-logbook

VOLUME [ "/data", "/certs" ]

EXPOSE 4000

USER weblogbook
ENTRYPOINT ["./web-logbook" ]
CMD ["-dsn", "/data/web-logbook.sql"]