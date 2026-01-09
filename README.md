# 🗳️ Nutanix RealTime Poll

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15+-black.svg)](https://nextjs.org/)
[![Flux](https://img.shields.io/badge/GitOps-Flux-5468ff.svg)](https://fluxcd.io/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-Ready-326CE5.svg)](https://kubernetes.io/)

Application de sondage en temps réel conçue pour les démonstrations Nutanix Kubernetes Platform (NKP). Déployée avec GitOps via Flux CD.

## 🌐 URLs

| Environnement | URL |
|---------------|-----|
| **Production** | https://tke-poll.ntnxlab.ch |
| **Development** | https://dev.tke-poll.ntnxlab.ch |

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
- ✅ External Secrets Operator
- ✅ Traefik Ingress (kommander-traefik)
- ✅ cert-manager (kommander-acme-issuer)
- ✅ External-DNS
- ✅ Network Policies (Zero Trust)
- ✅ Pod Security Standards (Restricted)

## 📁 Structure

```
├── backend/                 # API Node.js + Socket.io
├── frontend/                # Next.js 15 + React 19
├── k8s/
│   ├── base/               # Ressources Kubernetes partagées
│   ├── overlays/
│   │   ├── dev/            # dev.tke-poll.ntnxlab.ch
│   │   └── prod/           # tke-poll.ntnxlab.ch
│   └── flux-system/        # Configuration Flux CD
├── docker-compose.yml      # Production locale
└── docker-compose.dev.yml  # Développement avec hot-reload
```

## 🛠️ Démarrage Local

```bash
# Docker Compose
docker compose -f docker-compose.dev.yml up

# Accéder à l'application
open http://localhost:3000
```

## ☸️ Déploiement Kubernetes

### Prérequis sur le cluster

- Traefik Ingress Controller (`kommander-traefik`)
- cert-manager avec ClusterIssuer `kommander-acme-issuer`
- External-DNS configuré pour `ntnxlab.ch`
- External Secrets Operator avec ClusterSecretStore

### 1. Configurer les secrets

Dans votre backend de secrets (Vault, AWS SM, etc.):

```bash
# Production
vault kv put secret/realtime-poll/secrets \
  redis-password="$(openssl rand -base64 32)" \
  session-secret="$(openssl rand -base64 32)"

# Development
vault kv put secret/realtime-poll/dev/secrets \
  redis-password="dev-password" \
  session-secret="dev-session-secret"
```

### 2. Bootstrap Flux

```bash
flux bootstrap github \
  --owner=tkelkermans \
  --repository=nkp-webapp \
  --branch=main \
  --path=k8s/flux-system
```

### 3. Vérifier

```bash
# Flux status
flux get kustomizations

# Pods
kubectl get pods -n realtime-poll

# Certificats
kubectl get certificates -n realtime-poll

# External Secrets
kubectl get externalsecrets -n realtime-poll
```

## 🔐 Architecture Sécurité

```
┌─────────────────────────────────────────────────────────────┐
│                     Internet                                 │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS (443)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Traefik (kommander-traefik)                                │
│  + cert-manager (kommander-acme-issuer)                     │
│  + Security Headers Middleware                               │
└─────────────────────┬───────────────────────────────────────┘
                      │
    ┌─────────────────┼─────────────────┐
    │                 │                 │
    ▼                 ▼                 ▼
┌────────┐      ┌──────────┐     ┌───────────┐
│Frontend│      │ Backend  │     │  Redis    │
│ :3000  │ ──── │  :3001   │ ─── │  :6379    │
└────────┘      └──────────┘     └───────────┘
    │                 │                 │
    └─────────────────┼─────────────────┘
                      │
              Network Policies
              (Zero Trust)
```

## 📊 Observabilité

```bash
# Logs Flux
flux logs --follow

# Logs applicatifs
kubectl logs -f -l app.kubernetes.io/name=realtime-poll -n realtime-poll

# Events
kubectl get events -n realtime-poll --sort-by='.lastTimestamp'
```

---

**Propulsé par Nutanix Kubernetes Platform** 🟣
