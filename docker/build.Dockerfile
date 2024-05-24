FROM debian:bookworm-slim

WORKDIR /web-logbook

RUN apt-get update && \
    apt-get install ca-certificates libssl3 openssl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY ./dist/web-logbook-linux-amd64/web-logbook /web-logbook/web-logbook

VOLUME [ "/data", "/certs" ]

EXPOSE 4000

ENTRYPOINT ["./web-logbook", "-dsn", "/data/web-logbook.sql"]