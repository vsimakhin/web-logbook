FROM debian:bookworm-slim

WORKDIR /web-logbook

RUN apt-get update && \
    apt-get install ca-certificates libssl3 openssl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY ./dist/web-logbook-linux-amd64/web-logbook /web-logbook/web-logbook

RUN mkdir db

EXPOSE 4000

CMD ["./web-logbook", "-dsn", "/web-logbook/db/web-logbook.sql"]