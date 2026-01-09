# ===================================
# Backend Dockerfile - Multi-stage build
# ===================================

# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Installer les dépendances
COPY package*.json ./
RUN npm ci

# Copier le code source
COPY . .

# Compiler TypeScript
RUN npm run build

# Stage 2: Production
FROM node:22-alpine AS runner

WORKDIR /app

# Créer un utilisateur non-root pour la sécurité
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=3001

# Copier les fichiers de production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Installer uniquement les dépendances de production
RUN npm ci --only=production && npm cache clean --force

# Changer de propriétaire
RUN chown -R expressjs:nodejs /app

# Utiliser l'utilisateur non-root
USER expressjs

# Exposer le port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health/live || exit 1

# Démarrer l'application
CMD ["node", "dist/server.js"]
