# FixMe K8s Setup

## Prerequisites

- Docker Desktop (Windows) with WSL2 integration enabled
- WSL2 distro (Ub24)
- Minikube installed inside WSL2
- Lens K8s IDE installed on Windows

## Install Minikube (inside WSL2)

```bash
curl -LO https://github.com/kubernetes/minikube/releases/latest/download/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube && rm minikube-linux-amd64
```

## Start Minikube

Always start with the insecure registry flag:

```bash
minikube start --driver=docker --insecure-registry "10.0.0.0/24"
```

## Enable Registry Addon

```bash
minikube addons enable registry
```

The registry addon with the docker driver uses a non-standard port (e.g. `59047`) instead of `5000`.
Check the output of `minikube addons enable registry` for the actual port.

## Push Images to Minikube Registry

```bash
docker tag my-image localhost:59047/my-image
docker push localhost:59047/my-image
```

In Kubernetes manifests, reference images as:

```yaml
image: localhost:59047/my-image
```

## Lens IDE Setup (Windows)

Lens reads kubeconfig from `C:\Users\<username>\.kube\config`.
Since minikube runs inside WSL2, the kubeconfig needs to be copied with embedded certs:

```bash
CA_DATA=$(base64 -w 0 /home/valmet/.minikube/ca.crt)
CLIENT_CERT_DATA=$(base64 -w 0 /home/valmet/.minikube/profiles/minikube/client.crt)
CLIENT_KEY_DATA=$(base64 -w 0 /home/valmet/.minikube/profiles/minikube/client.key)

mkdir -p /mnt/c/Users/tremaksiol/.kube

sed \
  -e "s|    certificate-authority: .*|    certificate-authority-data: $CA_DATA|" \
  -e "s|    client-certificate: .*|    client-certificate-data: $CLIENT_CERT_DATA|" \
  -e "s|    client-key: .*|    client-key-data: $CLIENT_KEY_DATA|" \
  ~/.kube/config > /mnt/c/Users/tremaksiol/.kube/config
```

Re-run this after `minikube delete` + `minikube start` since certs and ports change.

## Notes

- `minikube delete` is required to change startup flags like `--insecure-registry`
- WSL2 IP can change on reboot — Lens kubeconfig may need updating
- Docker Desktop forwards WSL2 localhost ports to Windows, so `localhost` works from both sides
