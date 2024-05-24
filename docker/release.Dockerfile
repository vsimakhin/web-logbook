FROM debian:bookworm-slim

WORKDIR /web-logbook

RUN apt-get update && \
    apt-get install -y curl jq && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN LATEST_RELEASE=$(curl --silent "https://api.github.com/repos/vsimakhin/web-logbook/releases/latest" | \
    jq -r '.assets[] | select(.name == "web-logbook-linux-amd64.tar.gz") | .browser_download_url') && \
    curl -L -o web-logbook.tar.gz $LATEST_RELEASE && \
    tar -xzf web-logbook.tar.gz && \
    cp ./web-logbook-linux-amd64/web-logbook ./ && \
    rm -rf web-logbook.tar.gz web-logbook-linux-amd64

RUN mkdir db

EXPOSE 4000

CMD ["./web-logbook", "-dsn", "/web-logbook/db/web-logbook.sql"]