# 🔧 GitHub Actions CI/CD

## Workflows

### `build-images.yaml`

Build et push des images Docker vers Harbor.

## Configuration requise

### 1. Self-hosted Runner

Le workflow utilise un **self-hosted runner** pour accéder au registry Harbor interne.

```bash
# Installation sur une VM Linux avec Docker
# Settings → Actions → Runners → New self-hosted runner
```

**Prérequis du runner :**
- Docker installé
- Accès réseau au registry Harbor
- Labels: `self-hosted` (par défaut)

### 2. Environment GitHub

Le workflow utilise l'environnement `ntnxlab` pour accéder aux secrets et variables.

**Settings → Environments → `ntnxlab`**

### 3. Secrets (dans l'environnement `ntnxlab`)

| Secret | Description |
|--------|-------------|
| `HARBOR_USERNAME` | Username du robot account Harbor |
| `HARBOR_PASSWORD` | Token du robot account Harbor |

### 4. Variables (dans l'environnement `ntnxlab`)

| Variable | Exemple | Description |
|----------|---------|-------------|
| `HARBOR_REGISTRY` | `tke-nkpmgmt.ntnxlab.ch:5000` | URL du registry Harbor |
| `HARBOR_PROJECT` | `nkp-webapp` | Nom du projet dans Harbor |

## Déclencheurs

| Événement | Action |
|-----------|--------|
| Push sur `main` | Build images modifiées → **Update dev overlay avec SHA** → Flux déploie |
| Tag `v*.*.*` | Build all → **Update prod overlay avec version** → Flux déploie |
| Pull Request | Build uniquement (pas de push) |
| Manual (`workflow_dispatch`) | Force build de toutes les images |

## Tags générés

| Source | Tags créés | Manifest mis à jour |
|--------|------------|---------------------|
| Push `main` | `latest`, `main`, `<sha>` | `k8s/overlays/dev` |
| Tag `v1.2.3` | `1.2.3`, `1.2`, `<sha>` | `k8s/overlays/prod` |
| PR #42 | `pr-42` (pas de push) | Aucun |

## Créer un Robot Account Harbor

1. **Harbor UI** → Administration → Robot Accounts
2. **New Robot Account**
   - Name: `github-actions`
   - Expiration: Never (ou selon politique)
3. **Permissions** sur le projet `nkp-webapp`:
   - `push`
   - `pull`
4. **Copier le token** généré
5. **Configurer les secrets GitHub**

## Structure des images

```
tke-nkpmgmt.ntnxlab.ch:5000/
└── nkp-webapp/
    ├── backend:latest
    ├── backend:v1.0.0
    ├── backend:<sha>
    ├── frontend:latest
    ├── frontend:v1.0.0
    └── frontend:<sha>
```

## Flux de travail

### Développement (push sur main)

```
1. Developer push sur main
        ↓
2. GitHub Actions (self-hosted runner)
        ↓
3. Build Docker images (uniquement si frontend/ ou backend/ modifiés)
        ↓
4. Push vers Harbor avec tag SHA (ex: abc1234)
        ↓
5. Update k8s/overlays/dev/kustomization.yaml avec le nouveau tag
        ↓
6. Flux détecte le changement de manifest
        ↓
7. Déploiement automatique sur dev.tke-poll.ntnxlab.ch
```

### Production (tag v*.*.*)

```
1. Créer un tag: git tag v1.2.3 && git push --tags
        ↓
2. GitHub Actions build toutes les images
        ↓
3. Push vers Harbor avec tag semver (ex: v1.2.3)
        ↓
4. Update k8s/overlays/prod/kustomization.yaml avec la version
        ↓
5. Flux détecte le changement de manifest
        ↓
6. Déploiement automatique sur tke-poll.ntnxlab.ch
```
