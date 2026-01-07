# 🚀 Kubernetes Deployment - GitOps with Flux

Ce dossier contient les manifestes Kubernetes organisés pour GitOps avec Flux CD.

## 📁 Structure

```
k8s/
├── base/                    # Ressources de base (partagées)
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── redis/
│   ├── backend/
│   ├── frontend/
│   └── kustomization.yaml
├── overlays/
│   ├── dev/                 # Configuration développement
│   │   ├── kustomization.yaml
│   │   └── patches/
│   └── prod/                # Configuration production
│       ├── kustomization.yaml
│       ├── patches/
│       └── sealed-secrets/
├── flux-system/             # Configuration Flux CD
│   ├── gotk-components.yaml
│   ├── gotk-sync.yaml
│   └── kustomization.yaml
└── README.md
```

## 🔐 Gestion des Secrets

### Option 1: Sealed Secrets (Recommandé pour démarrer)

```bash
# Installer le controller
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.5/controller.yaml

# Installer kubeseal CLI
brew install kubeseal

# Créer un sealed secret
kubectl create secret generic realtime-poll-secrets \
  --from-literal=REDIS_PASSWORD=your-password \
  --from-literal=SESSION_SECRET=your-session-secret \
  --dry-run=client -o yaml | \
  kubeseal --format yaml > k8s/overlays/prod/sealed-secrets/secrets.yaml
```

### Option 2: External Secrets (Pour HashiCorp Vault, AWS SM, etc.)

Voir `k8s/base/external-secrets.yaml`

## 🔄 Déploiement avec Flux

### 1. Bootstrap Flux

```bash
flux bootstrap github \
  --owner=<GITHUB_USER> \
  --repository=nkp-webapp \
  --branch=main \
  --path=k8s/flux-system \
  --personal
```

### 2. Créer les sources

```bash
# Source Git
flux create source git nkp-webapp \
  --url=https://github.com/<GITHUB_USER>/nkp-webapp \
  --branch=main \
  --interval=1m

# Kustomization pour dev
flux create kustomization nkp-webapp-dev \
  --source=nkp-webapp \
  --path="./k8s/overlays/dev" \
  --prune=true \
  --interval=5m

# Kustomization pour prod
flux create kustomization nkp-webapp-prod \
  --source=nkp-webapp \
  --path="./k8s/overlays/prod" \
  --prune=true \
  --interval=5m \
  --health-check="Deployment/backend.realtime-poll" \
  --health-check="Deployment/frontend.realtime-poll"
```

## 📊 Observabilité

### Prometheus ServiceMonitor

Les métriques sont exposées via `/api/metrics` sur le backend.

### Alerting

Configurer des alertes Flux pour les déploiements échoués :

```yaml
apiVersion: notification.toolkit.fluxcd.io/v1beta2
kind: Alert
metadata:
  name: deployment-alerts
spec:
  providerRef:
    name: slack
  eventSeverity: error
  eventSources:
    - kind: Kustomization
      name: '*'
```

## 🔒 Sécurité

- ✅ Network Policies isolant les pods
- ✅ Pod Security Standards (restricted)
- ✅ ServiceAccounts dédiés avec RBAC minimal
- ✅ Secrets chiffrés (Sealed Secrets)
- ✅ Resource Quotas et Limit Ranges
- ✅ Pod Disruption Budgets pour la haute disponibilité
