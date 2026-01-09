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
| Push sur `main` | Build des images modifiées, tag `latest` |
| Tag `v*.*.*` | Build + mise à jour des manifests K8s |
| Pull Request | Build uniquement (pas de push) |
| Manual (`workflow_dispatch`) | Force build de toutes les images |

## Tags générés

| Source | Tags créés |
|--------|------------|
| Push `main` | `latest`, `main`, `<sha>` |
| Tag `v1.2.3` | `1.2.3`, `1.2`, `<sha>` |
| PR #42 | `pr-42` (pas de push) |

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

```
1. Developer push sur main
        ↓
2. GitHub Actions (self-hosted runner)
        ↓
3. Build Docker images
        ↓
4. Push vers Harbor (interne)
        ↓
5. Flux détecte nouvelles images
        ↓
6. Déploiement automatique sur K8s
```
