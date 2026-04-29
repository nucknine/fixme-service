# Minikube + Lens Setup (WSL2)

Both minikube and Lens run inside WSL2. Lens renders on the Windows desktop via WSLg.
No kubeconfig syncing, no socat relay, no TLS workarounds needed.

## Prerequisites

- Docker Desktop (Windows) with WSL2 integration enabled
- WSL2 distro (Ubuntu 24) with WSLg enabled (default on Windows 11)
- Minikube installed inside WSL2
- Lens installed inside WSL2

## Install Minikube (if not already installed)

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

## 1. Start Minikube

First time only (flags are remembered for subsequent starts):

```bash
minikube start --driver=docker --listen-address=0.0.0.0 --insecure-registry="10.0.0.0/24"
```

After that, just:

```bash
minikube start
```

- `--insecure-registry` — allows pulling from a private registry on that subnet without TLS
- `--listen-address=0.0.0.0` — binds the API server on all interfaces
- `minikube delete` is required to change these startup flags

## 2. Launch Lens

```bash
lens-desktop &
```

Lens opens on your Windows desktop via WSLg. It reads `~/.kube/config` directly — the same kubeconfig that minikube manages. No manual config needed.

## After Reboot

```bash
minikube start
lens-desktop &
```

That's it. No IP changes to worry about, no kubeconfig to re-export.

---

# kubectl & Minikube Cheat Sheet

## What is kubectl?

`kubectl` is the command-line tool for talking to Kubernetes clusters. It sends commands to the Kubernetes API server — the same API that Lens uses under the hood. Anything you can do in Lens, you can do with `kubectl`, and vice versa.

Minikube installs a single-node Kubernetes cluster locally. `kubectl` is how you interact with it from the terminal.

## Minikube Management

```bash
# Start the cluster
minikube start

# Stop the cluster (preserves state, frees resources)
minikube stop

# Delete the cluster entirely (clean slate)
minikube delete

# Check cluster status
minikube status

# Open the Kubernetes dashboard in a browser
minikube dashboard

# SSH into the minikube node
minikube ssh

# List enabled addons
minikube addons list

# Enable an addon (e.g. registry, ingress, metrics-server)
minikube addons enable registry
minikube addons enable ingress
minikube addons enable metrics-server

# Get the IP of the minikube node
minikube ip

# View minikube logs (useful for debugging startup issues)
minikube logs
```

## kubectl — Cluster Info

```bash
# Check connection to the cluster
kubectl cluster-info

# View current kubeconfig context
kubectl config current-context

# List all contexts (useful if you have multiple clusters)
kubectl config get-contexts

# Switch context
kubectl config use-context minikube
```

## kubectl — Working with Resources

```bash
# List resources
kubectl get pods                    # all pods in current namespace
kubectl get pods -A                 # all pods in all namespaces
kubectl get services                # services
kubectl get deployments             # deployments
kubectl get nodes                   # cluster nodes
kubectl get all                     # everything in current namespace

# Describe a resource (detailed info, events, errors)
kubectl describe pod <pod-name>
kubectl describe service <service-name>

# View pod logs
kubectl logs <pod-name>
kubectl logs <pod-name> -f          # follow (tail) logs
kubectl logs <pod-name> --previous  # logs from a crashed container

# Execute a command inside a pod
kubectl exec -it <pod-name> -- /bin/sh
kubectl exec -it <pod-name> -- bash
```

## kubectl — Creating & Updating Resources

```bash
# Apply a manifest file (create or update)
kubectl apply -f deployment.yaml
kubectl apply -f .                  # apply all YAML files in current directory

# Delete resources
kubectl delete -f deployment.yaml
kubectl delete pod <pod-name>
kubectl delete deployment <name>

# Scale a deployment
kubectl scale deployment <name> --replicas=3

# Restart a deployment (rolling restart)
kubectl rollout restart deployment <name>

# Check rollout status
kubectl rollout status deployment <name>
```

## kubectl — Namespaces

```bash
# List namespaces
kubectl get namespaces

# Set default namespace for current context
kubectl config set-context --current --namespace=<namespace>

# Run a command in a specific namespace
kubectl get pods -n kube-system
```

## kubectl — Debugging

```bash
# Get events (useful for diagnosing scheduling/startup issues)
kubectl get events --sort-by='.lastTimestamp'

# Check resource usage (requires metrics-server addon)
kubectl top pods
kubectl top nodes

# Port-forward a service to localhost (access from WSL2)
kubectl port-forward service/<service-name> 8080:80

# Dry-run a manifest to check for errors without applying
kubectl apply -f deployment.yaml --dry-run=client
```
