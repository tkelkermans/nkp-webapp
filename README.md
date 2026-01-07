# 🗳️ Nutanix RealTime Poll

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15+-black.svg)](https://nextjs.org/)
[![Flux](https://img.shields.io/badge/GitOps-Flux-5468ff.svg)](https://fluxcd.io/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-Ready-326CE5.svg)](https://kubernetes.io/)

Application de sondage en temps réel conçue pour les démonstrations Nutanix Kubernetes Platform (NKP). Déployée avec GitOps via Flux CD.

## 🎨 Nutanix Brand Colors

| Type | Color | Hex | Usage |
|------|-------|-----|-------|
| Primary | 🟣 Iris Purple | `#7855fa` | Buttons, accent |
| Primary | ⬜ White | `#ffffff` | Background |
| Primary | ⬛ Charcoal | `#131313` | Text |
| Secondary | 🔵 Cyan | `#1fdde9` | Highlight |
| Secondary | 🟢 Lime | `#92dd23` | Success |
| Secondary | 🟠 Coral | `#ff9178` | Warning |

## 🚀 Fonctionnalités

- ✅ Sondages en temps réel (WebSocket)
- ✅ QR Code automatique pour partage
- ✅ GitOps avec Flux CD
- ✅ Secrets chiffrés (Sealed Secrets)
- ✅ Network Policies (Zero Trust)
- ✅ Pod Security Standards (Restricted)
- ✅ HPA (Auto-scaling)
- ✅ PDB (Haute disponibilité)

## 📁 Structure Kubernetes

```
k8s/
├── base/                    # Ressources partagées
│   ├── redis/
│   ├── backend/
│   ├── frontend/
│   ├── network-policies.yaml
│   ├── rbac.yaml
│   └── kustomization.yaml
├── overlays/
│   ├── dev/                 # Overlay développement
│   └── prod/                # Overlay production
│       └── sealed-secrets/  # Secrets chiffrés
└── flux-system/             # Configuration Flux
    ├── sources.yaml
    ├── app-kustomizations.yaml
    └── notifications.yaml
```

## 🛠️ Démarrage Local

```bash
# Docker Compose
docker compose -f docker-compose.dev.yml up

# Ou manuellement
docker run -d --name poll-redis -p 6379:6379 redis:7.4-alpine
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
```

## ☸️ Déploiement GitOps avec Flux

### 1. Installer Flux sur le cluster

```bash
# Bootstrap Flux (remplacez YOUR_ORG)
flux bootstrap github \
  --owner=YOUR_ORG \
  --repository=nkp-webapp \
  --branch=main \
  --path=k8s/flux-system \
  --personal
```

### 2. Créer les Sealed Secrets

```bash
# Installer kubeseal
brew install kubeseal

# Générer les sealed secrets pour production
kubectl create secret generic realtime-poll-secrets \
  --namespace=realtime-poll \
  --from-literal=REDIS_PASSWORD='$(openssl rand -base64 32)' \
  --from-literal=SESSION_SECRET='$(openssl rand -base64 32)' \
  --dry-run=client -o yaml | \
  kubeseal --format yaml > k8s/overlays/prod/sealed-secrets/secrets.yaml
```

### 3. Personnaliser les URLs

Éditez `k8s/overlays/prod/kustomization.yaml` :

```yaml
# Remplacez yourcompany.com par votre domaine
- poll.yourcompany.com
- api.poll.yourcompany.com
```

### 4. Push & Deploy

```bash
git add .
git commit -m "feat: configure production deployment"
git push origin main

# Flux synchronise automatiquement !
```

### 5. Vérifier le déploiement

```bash
# État des kustomizations
flux get kustomizations

# Pods
kubectl get pods -n realtime-poll

# Logs Flux
flux logs --follow
```

## 🔐 Gestion des Secrets

### Option A: Sealed Secrets (Recommandé)

Les secrets sont chiffrés avec la clé du cluster et peuvent être commitée en toute sécurité.

```bash
# Voir les sealed secrets
kubectl get sealedsecrets -n realtime-poll
```

### Option B: External Secrets

Pour HashiCorp Vault, AWS Secrets Manager, etc. Voir `k8s/base/external-secrets.yaml`.

## 🔒 Sécurité Appliquée

| Pratique | Implémentation |
|----------|----------------|
| Pod Security Standards | `restricted` policy sur le namespace |
| Network Policies | Zero-trust, deny-all par défaut |
| RBAC | ServiceAccounts dédiés, pas de token auto-monté |
| Secrets | Sealed Secrets (chiffrés) |
| Read-only FS | Conteneurs avec `readOnlyRootFilesystem: true` |
| Non-root | Tous les conteneurs en `runAsNonRoot: true` |
| Resource Limits | Quotas et LimitRanges |
| Seccomp | `RuntimeDefault` profile |

## 📊 Observabilité

### Prometheus Metrics

Le backend expose des métriques sur `/api/health`.

### Flux Notifications

Configurez les alertes Slack/Teams dans `k8s/flux-system/notifications.yaml`.

## 🔄 Image Automation

Flux peut automatiquement mettre à jour les tags d'images. Voir `k8s/flux-system/image-automation.yaml`.

```bash
# Activer l'automation
kubectl apply -f k8s/flux-system/image-automation.yaml
```

## 📋 Commandes Utiles

```bash
# Forcer la synchronisation
flux reconcile kustomization nkp-webapp-prod

# Suspendre les déploiements
flux suspend kustomization nkp-webapp-prod

# Reprendre
flux resume kustomization nkp-webapp-prod

# Voir les différences avant apply
flux diff kustomization nkp-webapp-prod
```

---

**Propulsé par Nutanix Kubernetes Platform** 🟣
