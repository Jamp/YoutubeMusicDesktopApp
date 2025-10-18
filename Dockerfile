FROM node:20-bullseye

# Instalar dependencias para electron-builder
RUN apt-get update && apt-get install -y \
    rpm \
    fakeroot \
    dpkg \
    && rm -rf /var/lib/apt/lists/*

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos del proyecto
COPY package*.json ./
COPY main.js ./
COPY mini-player.html ./
COPY assets ./assets/

# Instalar dependencias
RUN npm install

# El comando se ejecutará desde el script de build
CMD ["npm", "run", "build:linux"]
