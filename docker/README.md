# Docker

There are several options for how you can use the dockerized version of the web-logbook application. The provided examples are for amd64 architecture, but you can build your own docker image and for any platform, using the Dockerfile examples below.

# Images

## Docker Hub

There is an official public repository at the Docker Hub [https://hub.docker.com/repository/docker/vsimakhin/web-logbook/](https://hub.docker.com/repository/docker/vsimakhin/web-logbook/) where you can pull the image. You can pull either the `latest` tag or a tag according to the release version.

```bash
docker pull vsimakhin/web-logbook:latest
```

## Build mage from latest release

To build a docker image from the latest published release you can use [release.Dockerfile](./release.Dockerfile)

```bash
docker build -t vsimakhin/web-logbook:latest -f $PWD/docker/release.Dockerfile .
```

## Build image from build files

To build a docker image from the compiled binaries you can use [build.Dockerfile](./build.Dockerfile)

```bash
# first build binaries
make build_all
# build docker image
docker build -t vsimakhin/web-logbook:latest -f $PWD/docker/build.Dockerfile .

```

# Run container


By default the dockerized app will create an sqlite database in `/data/` directory. So the recommended way to run the container is to mount a volume with database

```bash
docker run --rm -it -p 4000:4000 -v /YOUR/FULL/PATH/WITH/DATABASE:/data vsimakhin/web-logbook:latest
```
So once you run the container it will create a `web-logbook.sql` file with all data at `/YOUR/FULL/PATH/WITH/DATABASE/web-logbook.sql`

It is also possible to override the standard entry point and set your own additional options, like cert for SSL and etc

```bash
docker run --rm -it -p 4000:4000 -v /YOUR/FULL/PATH/WITH/DATABASE:/data -v /PATH/TO/CERTS:/certs vsimakhin/web-logbook:latest ./web-logbook -dsn /data/web-logbook.sql -cert /certs/my-certificate.pem
```

You may use docker-compose to run the container
```yaml
services:
  web-logbook:
    image: vsimakhin/web-logbook:latest
    command: ./web-logbook -dsn /data/web-logbook.sql
    ports:
      - 4000:4000
    volumes:
      - /YOUR/FULL/PATH/WITH/DATABASE:/data
```
