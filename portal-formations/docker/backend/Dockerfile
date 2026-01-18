FROM node:20-alpine

WORKDIR /app

# Installer les dépendances système nécessaires pour Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Définir Puppeteer pour utiliser Chromium installé
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copier les fichiers de dépendances
COPY package*.json ./
COPY package-lock.json* ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le code source
COPY . .

# Copier la configuration TypeScript
COPY tsconfig.json ./

# Compiler TypeScript (si nécessaire) ou utiliser tsx directement
# Pour la production, on peut pré-compiler ou utiliser tsx
RUN npm install -g tsx

# Exposer le port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Démarrer le serveur
CMD ["tsx", "src/server.ts"]
