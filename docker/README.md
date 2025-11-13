# Docker

There are several options for how you can use the dockerized version of the web-logbook application.

# Images

## Docker Hub

There is an official public repository at the Docker Hub [https://hub.docker.com/repository/docker/vsimakhin/web-logbook/](https://hub.docker.com/repository/docker/vsimakhin/web-logbook/) where you can pull the image for `amd64` or `arm64` platforms. You can pull either the `latest` tag or a tag according to the release version.

```bash
docker pull vsimakhin/web-logbook:latest
```

## Build mage from latest release

To build a docker image from the latest published release you can use [release.Dockerfile](./release.Dockerfile)

```bash
docker build -t vsimakhin/web-logbook:latest -f $PWD/docker/release.Dockerfile .
```

If you build locally you can use any container image name instead of `vsimakhin/web-logbook:latest`, for example `my-logbook:latest`.

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

The standard entrypoint and cmd for the container image is 
```bash
ENTRYPOINT ["./web-logbook" ]
CMD ["-dsn", "/data/web-logbook.sql"]
```

You may override it and set additional options like cert for SSL and etc

```bash
docker run --rm -it -p 4000:4000 -v /YOUR/FULL/PATH/WITH/DATABASE:/data -v /PATH/TO/CERTS:/certs vsimakhin/web-logbook:latest -dsn /data/web-logbook.sql -cert /certs/my-certificate.pem -env dev
```

You may use docker-compose to run the container
```yaml
services:
  web-logbook:
    image: vsimakhin/web-logbook:latest
    command: -dsn /data/web-logbook.sql
    ports:
      - 4000:4000
    volumes:
      - /YOUR/FULL/PATH/WITH/DATABASE:/data
```

# Kubernetes & Cloudflare example

For a more advanced setup, you can run the app inside a `Kubernetes` cluster and use `Cloudflare` for DNS and TLS management.

- Install [Kubernetes](https://kubernetes.io/) on your instance. For a lightweight, single-node setup, you may use [k3s](https://k3s.io)
```bash
curl -sfL https://get.k3s.io | sh -
```
- Install Traefik (Ingress Controller). K3s comes with Traefik preinstalled by default. If you’re using a different Kubernetes distribution, you can install Traefik manually with Helm
```bash
helm repo add traefik https://traefik.github.io/charts
helm repo update
helm install traefik traefik/traefik \
  --namespace kube-system \
  --set service.type=LoadBalancer
```

- Create an A record in your Cloudflare DNS zone pointing to your instance’s public IP address.
  - If you plan to serve multiple applications, use a wildcard subdomain such as *.my-awesome-domain.com.
  - Otherwise, create a specific record, for example logbook.my-awesome-domain.com.

| Type | Name    | Content (IP Address) | Proxy Status               | TTL  |
| ---- | ------- | -------------------- | -------------------------- | ---- |
| A    | logbook | INSTANCE_IP_ADDRESS  | **Proxied** (orange cloud) | Auto |

Keeping Proxy Status enabled (orange cloud) allows Cloudflare to:
- Automatically manage TLS certificates for your domain
- Proxy traffic securely (HTTPS without managing certificates in your cluster)
- Cache and accelerate responses

If you disable proxying (grey cloud), you will need to manage your own TLS certificates inside Kubernetes (e.g., using cert-manager).

- After updating your configuration file as needed, deploy your app
```bash
kubectl apply -f logbook.yaml
```

Example `logbook.yaml`
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: logbook-data
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: local-path
  resources:
    requests:
      storage: 100Mi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: logbook
spec:
  replicas: 1
  selector:
    matchLabels:
      app: logbook
  template:
    metadata:
      labels:
        app: logbook
    spec:
      containers:
      - name: app-container
        image: vsimakhin/web-logbook:latest
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 4000
        volumeMounts:
        - name: logbook-data
          mountPath: /data
      volumes:
      - name: logbook-data
        persistentVolumeClaim:
          claimName: logbook-data
---
apiVersion: v1
kind: Service
metadata:
  name: logbook-service
spec:
  type: ClusterIP
  selector:
    app: logbook
  ports:
    - port: 4000
      targetPort: 4000
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: logbook-ingress
  annotations:
    traefik.ingress.kubernetes.io/router.entrypoints: web,websecure
    traefik.ingress.kubernetes.io/router.tls: "true"
spec:
  rules:
  - host: logbook.my-awesome-domain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: logbook-service
            port:
              number: 4000
  tls:
  - hosts:
    - logbook.my-awesome-domain.com

```