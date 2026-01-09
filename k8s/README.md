# 🚀 Kubernetes Deployment - GitOps with Flux

Ce dossier contient les manifestes Kubernetes organisés pour GitOps avec Flux CD.

## 🌐 URLs

| Environnement | URL |
|---------------|-----|
| **Production** | https://tke-poll.ntnxlab.ch |
| **Development** | https://dev.tke-poll.ntnxlab.ch |

## 📁 Structure

```
k8s/
├── base/                    # Ressources de base (partagées)
│   ├── namespace.yaml       # Pod Security Standards
│   ├── configmap.yaml       # Configuration non-sensible
│   ├── rbac.yaml            # ServiceAccounts
│   ├── network-policies.yaml
│   ├── external-secrets.yaml # ESO ExternalSecret
│   ├── ingress.yaml         # Traefik + cert-manager
│   ├── redis/
│   ├── backend/
│   ├── frontend/
│   └── kustomization.yaml
├── overlays/
│   ├── dev/                 # dev.tke-poll.ntnxlab.ch
│   └── prod/                # tke-poll.ntnxlab.ch
└── flux-system/             # Configuration Flux CD
```

## 🔧 Configuration

### Ingress Controller

- **Type**: Traefik
- **IngressClass**: `kommander-traefik`
- **TLS**: Port 443 (websecure)

### Certificats SSL

- **Issuer**: cert-manager ClusterIssuer
- **Nom**: `kommander-acme-issuer`
- **Automatique**: Let's Encrypt via ACME

### DNS

- **Provider**: External-DNS
- **Domaines**:
  - `tke-poll.ntnxlab.ch` (production)
  - `dev.tke-poll.ntnxlab.ch` (development)

## 🔐 Gestion des Secrets (External Secrets Operator)

### Configuration requise

1. **External Secrets Operator** doit être installé dans le cluster
2. Un **ClusterSecretStore** doit pointer vers votre backend de secrets

### Structure des secrets

```yaml
# Dans votre backend de secrets (Vault, AWS SM, Azure KV, etc.)
realtime-poll/secrets:
  redis-password: "your-strong-redis-password"
  session-secret: "your-32-char-session-secret"

realtime-poll/dev/secrets:
  redis-password: "dev-redis-password"
  session-secret: "dev-session-secret"
```

### Exemple: Créer les secrets dans Vault

```bash
# Production
vault kv put secret/realtime-poll/secrets \
  redis-password="$(openssl rand -base64 32)" \
  session-secret="$(openssl rand -base64 32)"

# Development
vault kv put secret/realtime-poll/dev/secrets \
  redis-password="dev-redis-password" \
  session-secret="dev-session-secret"
```

### Vérifier la synchronisation

```bash
# Voir l'état des ExternalSecrets
kubectl get externalsecrets -n realtime-poll

# Vérifier que le secret K8s est créé
kubectl get secrets realtime-poll-secrets -n realtime-poll
```

## 🔄 Déploiement avec Flux

### 1. Bootstrap Flux

```bash
flux bootstrap github \
  --owner=tkelkermans \
  --repository=nkp-webapp \
  --branch=main \
  --path=k8s/flux-system \
  --personal
```

### 2. Vérifier le déploiement

```bash
# État des kustomizations
flux get kustomizations

# Pods
kubectl get pods -n realtime-poll
kubectl get pods -n realtime-poll-dev

# Ingress et certificats
kubectl get ingress -n realtime-poll
kubectl get certificates -n realtime-poll

# External Secrets
kubectl get externalsecrets -A
```

### 3. Forcer une synchronisation

```bash
flux reconcile kustomization nkp-webapp-prod --with-source
```

## 🔒 Sécurité

| Pratique | Implémentation |
|----------|----------------|
| Pod Security Standards | `restricted` policy |
| Network Policies | Zero-trust, deny-all |
| RBAC | ServiceAccounts dédiés |
| Secrets | External Secrets Operator |
| TLS | cert-manager + Let's Encrypt |
| Headers | Traefik Middleware |

## 📋 Commandes Utiles

```bash
# Logs Flux
flux logs --follow

# Suspendre les déploiements
flux suspend kustomization nkp-webapp-prod

# Reprendre
flux resume kustomization nkp-webapp-prod

# Voir les différences avant apply
flux diff kustomization nkp-webapp-prod

# Debug External Secrets
kubectl describe externalsecret realtime-poll-secrets -n realtime-poll
```
