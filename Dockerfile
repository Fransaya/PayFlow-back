# Dockerfile optimizado para desarrollo
FROM node:22.14.0-slim

# Instalar herramientas necesarias para desarrollo
RUN apt-get update && apt-get install -y \
    openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instalar dependencias globales útiles para desarrollo
RUN npm install -g nodemon

# Copiar package files primero para aprovechar cache de Docker
COPY package*.json ./

# Instalar dependencias del proyecto
RUN npm install

# Copiar el resto de la aplicación
COPY --chown=node:node . .

# Usar el usuario node que ya viene con la imagen
USER node

# Puerto expuesto
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "run", "start:dev"]