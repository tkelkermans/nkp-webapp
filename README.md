# 🗳️ Nutanix RealTime Poll

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black.svg)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22_LTS-green.svg)](https://nodejs.org/)
[![Flux](https://img.shields.io/badge/GitOps-Flux_CD-5468ff.svg)](https://fluxcd.io/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-Ready-326CE5.svg)](https://kubernetes.io/)

Application de sondage en temps réel conçue pour les démonstrations Nutanix Kubernetes Platform (NKP). Déployée avec GitOps via Flux CD.

## ✨ Fonctionnalités

- 🔄 **Temps réel** - Votes et résultats en direct via WebSocket (Socket.io)
- 📱 **QR Code** - Génération automatique pour partage facile
- 📊 **Graphiques** - Visualisation des résultats (barres et camembert)
- 🎨 **Design Nutanix** - Couleurs et branding officiels
- ☸️ **Cloud Native** - Kubernetes, GitOps, sécurité Zero Trust

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

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet                              │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS (443)
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Traefik Ingress (kommander-traefik)                        │
│  + cert-manager (Let's Encrypt via kommander-acme-issuer)   │
│  + External-DNS (automatic DNS records)                     │
└─────────────────────────┬───────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │ /               │ /api, /socket.io│
        ▼                 ▼                 
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Frontend   │   │   Backend    │   │    Redis     │
│   Next.js    │──▶│   Express    │──▶│   7.4        │
│   :3000      │   │   :3001      │   │   :6379      │
└──────────────┘   └──────────────┘   └──────────────┘
        │                 │                 │
        └─────────────────┴─────────────────┘
                Network Policies (Zero Trust)
```

## 📁 Structure du Projet

```
├── backend/                 # API Node.js + Express + Socket.io
│   ├── src/
│   │   ├── routes/         # Endpoints REST (/api/polls, /api/health)
│   │   ├── socket/         # WebSocket handlers
│   │   ├── models/         # Redis data layer
│   │   └── middleware/     # Rate limiting, error handling
│   └── Dockerfile
│
├── frontend/                # Next.js 15 + React 19 + TailwindCSS
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom hooks (useSocket, usePolls)
│   │   └── lib/           # API client, utilities
│   └── Dockerfile
│
├── k8s/                     # Kubernetes manifests
│   ├── base/               # Shared resources
│   │   ├── backend/       # Backend Deployment, Service, HPA
│   │   ├── frontend/      # Frontend Deployment, Service, HPA
│   │   ├── redis/         # Redis Deployment, Service, PVC
│   │   ├── ingress.yaml   # Traefik Ingress
│   │   └── network-policies.yaml
│   ├── overlays/
│   │   ├── dev/           # dev.tke-poll.ntnxlab.ch
│   │   └── prod/          # tke-poll.ntnxlab.ch + ESO
│   └── flux-system/       # Flux CD configuration
│
├── .github/workflows/      # GitHub Actions CI/CD
│   └── build-images.yaml  # Build & push to Harbor
│
├── docker-compose.yml      # Local production (nginx proxy)
├── docker-compose.dev.yml  # Local development (hot-reload)
└── nginx.conf              # Reverse proxy for local prod
```

## 🛠️ Développement Local

### Prérequis

- Docker Desktop
- Node.js 22+ (optionnel, pour développement sans Docker)

### Option 1: Docker Compose (recommandé)

```bash
# Développement avec hot-reload
docker compose -f docker-compose.dev.yml up

# Accéder à l'application
open http://localhost:3000
```

### Option 2: Production locale

```bash
# Build et run avec nginx proxy
docker compose up --build

# Accéder via nginx (port 80)
open http://localhost
```

### Option 3: Sans Docker

```bash
# Terminal 1: Redis
docker run -p 6379:6379 redis:7.4-alpine

# Terminal 2: Backend
cd backend && npm install && npm run dev

# Terminal 3: Frontend
cd frontend && npm install && npm run dev
```

## ☸️ Déploiement Kubernetes

### Prérequis sur le cluster NKP

| Composant | Nom | Description |
|-----------|-----|-------------|
| Ingress | `kommander-traefik` | Traefik IngressClass |
| TLS | `kommander-acme-issuer` | cert-manager ClusterIssuer |
| DNS | External-DNS | Automatise les enregistrements DNS |
| Secrets | External Secrets Operator | Synchronise les secrets depuis Vault/AWS |

### 1. Configurer les secrets (Production)

```bash
# Dans Vault ou AWS Secrets Manager
vault kv put secret/realtime-poll/secrets \
  redis-password="$(openssl rand -base64 32)" \
  session-secret="$(openssl rand -base64 32)"
```

### 2. Bootstrap Flux CD

```bash
flux bootstrap github \
  --owner=tkelkermans \
  --repository=nkp-webapp \
  --branch=main \
  --path=k8s/flux-system
```

### 3. Vérifier le déploiement

```bash
# Status Flux
flux get kustomizations

# Pods
kubectl get pods -n realtime-poll

# Ingress
kubectl get ingress -n realtime-poll

# Certificats TLS
kubectl get certificates -n realtime-poll

# External Secrets
kubectl get externalsecrets -n realtime-poll
```

## 🔒 Sécurité

### Kubernetes Security

- ✅ **Pod Security Standards**: Mode `restricted`
- ✅ **Network Policies**: Zero Trust (deny all, allow specific)
- ✅ **RBAC**: ServiceAccounts dédiés sans automount token
- ✅ **Resource Quotas**: Limites CPU/mémoire par namespace
- ✅ **Secrets**: External Secrets Operator (pas de secrets en clair)

### Application Security

- ✅ **Rate Limiting**: Protection contre les abus
- ✅ **Input Validation**: Zod schemas
- ✅ **CORS**: Origines autorisées configurables
- ✅ **Security Headers**: X-Frame-Options, X-Content-Type-Options

## 🔄 CI/CD

### GitHub Actions

Le workflow `.github/workflows/build-images.yaml` :

1. **Déclenché par** : Push sur `main` (frontend/** ou backend/**)
2. **Build** : Images Docker multi-stage
3. **Push** : Registry Harbor privé
4. **Cache** : BuildKit cache layers

### Configuration requise

Dans GitHub Settings → Environments → `ntnxlab` :

| Type | Nom | Description |
|------|-----|-------------|
| Secret | `HARBOR_USERNAME` | Robot account Harbor |
| Secret | `HARBOR_PASSWORD` | Token Harbor |
| Variable | `HARBOR_REGISTRY` | `tke-nkpmgmt.ntnxlab.ch:5000` |
| Variable | `HARBOR_PROJECT` | `nkp-webapp` |

## 📊 Observabilité

```bash
# Logs Flux CD
flux logs --follow

# Logs applicatifs
kubectl logs -f -l app.kubernetes.io/name=realtime-poll -n realtime-poll

# Events Kubernetes
kubectl get events -n realtime-poll --sort-by='.lastTimestamp'

# Describe pods
kubectl describe pods -n realtime-poll
```

## 🧪 Tests

```bash
# Backend unit tests
cd backend && npm test

# Type checking
cd frontend && npm run type-check
cd backend && npm run type-check
```

## 📝 API Reference

### REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/polls` | Liste des sondages actifs |
| GET | `/api/polls/:id` | Détails d'un sondage |
| POST | `/api/polls` | Créer un sondage |
| POST | `/api/polls/:id/vote` | Voter |

### WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join-poll` | Client → Server | Rejoindre un sondage |
| `leave-poll` | Client → Server | Quitter un sondage |
| `vote-update` | Server → Client | Mise à jour des votes |
| `poll-closed` | Server → Client | Sondage fermé |

## 🤝 Stack Technique

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 15, React 19, TailwindCSS 3.4, Chart.js 4, TanStack Query |
| **Backend** | Node.js 22, Express 4, Socket.io 4, ioredis, Zod |
| **Database** | Redis 7.4 (in-memory, AOF persistence) |
| **Infrastructure** | Kubernetes, Flux CD, Traefik, cert-manager |
| **CI/CD** | GitHub Actions, Harbor Registry |

---

**Propulsé par Nutanix Kubernetes Platform** 🟣
