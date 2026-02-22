# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM oven/bun:1.3.8 AS builder

WORKDIR /app

# Copie des fichiers de dépendances en premier pour profiter du cache Docker
COPY package*.json bun.lockb* ./

# Installation des dépendances
RUN bun install --frozen-lockfile

# Copie du code source
COPY . .

# Build de l'application Nuxt (génère .output/)
RUN bun run build

# ─── Stage 2: Production ─────────────────────────────────────────────────────
FROM oven/bun:1.3.8-slim

WORKDIR /app

# Copie uniquement le résultat du build depuis le stage builder
COPY --from=builder /app/.output ./output

ENV NODE_ENV=production
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=9000

EXPOSE 9000

# Démarrage avec le serveur de production Nitro
CMD ["bun", "run", "./output/server/index.mjs"]