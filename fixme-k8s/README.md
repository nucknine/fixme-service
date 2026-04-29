# FixMe K8s Setup

## Prerequisites

- Docker Desktop (Windows) with WSL2 integration enabled
- WSL2 distro (Ubuntu 24) with WSLg enabled (default on Windows 11)
- Minikube installed inside WSL2
- Lens installed inside WSL2 (renders on Windows via WSLg)

## Install Minikube (inside WSL2)

```bash
curl -LO https://github.com/kubernetes/minikube/releases/latest/download/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube && rm minikube-linux-amd64
```

## Install Lens (inside WSL2)

```bash
curl -fsSL https://downloads.k8slens.dev/keys/gpg | sudo gpg --dearmor -o /usr/share/keyrings/lens-archive-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/lens-archive-keyring.gpg] https://downloads.k8slens.dev/apt/debian stable main" \
  | sudo tee /etc/apt/sources.list.d/lens.list
sudo apt-get update && sudo apt-get install -y lens
```

## Start Minikube

First time only (flags are remembered for subsequent starts):

```bash
minikube start --driver=docker --listen-address=0.0.0.0 --insecure-registry="10.0.0.0/24"
```

After that, just:

```bash
minikube start
```

## Launch Lens

```bash
lens-desktop &
```

Lens reads `~/.kube/config` directly from WSL2. No kubeconfig syncing or TLS workarounds needed.

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

## After Reboot

```bash
minikube start
lens-desktop &
```

## Notes

- `minikube delete` is required to change startup flags like `--insecure-registry`
- Lens runs inside WSL2 and renders on Windows via WSLg — no IP or kubeconfig issues
- Docker Desktop forwards WSL2 localhost ports to Windows, so `localhost` works from both sides
- See [MINIKUBE-LENS-SETUP.md](MINIKUBE-LENS-SETUP.md) for detailed setup steps and kubectl cheat sheet
