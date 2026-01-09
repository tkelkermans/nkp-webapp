#!/bin/bash
# Script de développement local

set -e

echo "🛠️  Démarrage de l'environnement de développement"

if [ "$1" == "--redis-only" ]; then
    echo "Démarrage de Redis uniquement..."
    docker run -d --name poll-redis -p 6379:6379 redis:7.4-alpine
    echo "✅ Redis démarré sur localhost:6379"
    echo ""
    echo "Lancez maintenant:"
    echo "  cd backend && npm run dev"
    echo "  cd frontend && npm run dev"
    exit 0
fi

echo "Démarrage avec Docker Compose..."
docker-compose -f docker-compose.dev.yml up -d

echo ""
echo "✅ Environnement de développement démarré !"
echo ""
echo "📱 Frontend:  http://localhost:3000"
echo "🔌 Backend:   http://localhost:3001"
echo "🗄️  Redis:    localhost:6379"
