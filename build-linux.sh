#!/bin/bash

# Script para compilar la aplicación para Linux usando Docker
# Soporta múltiples arquitecturas: x64 y arm64

set -e

echo "🐳 YouTube Music Desktop - Build para Linux con Docker"
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para mostrar uso
show_usage() {
    echo "Uso: ./build-linux.sh [ARQUITECTURA]"
    echo ""
    echo "Arquitecturas disponibles:"
    echo "  x64     - Build para Linux x86_64 (AMD/Intel 64-bit)"
    echo "  arm64   - Build para Linux ARM64 (Raspberry Pi, etc.)"
    echo "  all     - Build para todas las arquitecturas"
    echo ""
    echo "Ejemplo:"
    echo "  ./build-linux.sh x64"
    echo "  ./build-linux.sh all"
}

# Verificar argumentos
ARCH=${1:-all}

if [[ "$ARCH" != "x64" && "$ARCH" != "arm64" && "$ARCH" != "all" ]]; then
    echo "❌ Arquitectura no válida: $ARCH"
    echo ""
    show_usage
    exit 1
fi

# Verificar que Docker esté instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado"
    echo "Por favor instala Docker Desktop desde: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Verificar que Docker esté corriendo
if ! docker info &> /dev/null; then
    echo "❌ Docker no está corriendo"
    echo "Por favor inicia Docker Desktop"
    exit 1
fi

# Función para hacer build en una arquitectura específica
build_for_arch() {
    local target_arch=$1

    echo -e "${BLUE}📦 Compilando para Linux ${target_arch}...${NC}"

    # Nombre de la imagen
    local image_name="youtube-music-builder-${target_arch}"

    # Construir la imagen de Docker para la arquitectura específica
    echo -e "${YELLOW}🔨 Construyendo imagen Docker...${NC}"
    docker buildx build \
        --platform linux/${target_arch} \
        -t ${image_name} \
        -f Dockerfile \
        .

    # Crear directorio de salida si no existe
    mkdir -p dist

    # Ejecutar el build dentro del contenedor
    echo -e "${YELLOW}⚙️  Ejecutando electron-builder...${NC}"
    docker run --rm \
        --platform linux/${target_arch} \
        -v "$(pwd)/dist:/app/dist" \
        ${image_name}

    echo -e "${GREEN}✅ Build completado para ${target_arch}${NC}"
    echo ""
}

# Ejecutar builds según la arquitectura seleccionada
echo -e "${BLUE}Iniciando builds...${NC}"
echo ""

if [[ "$ARCH" == "all" ]]; then
    build_for_arch "amd64"  # x64 en Docker se llama amd64
    build_for_arch "arm64"
else
    if [[ "$ARCH" == "x64" ]]; then
        build_for_arch "amd64"
    else
        build_for_arch "$ARCH"
    fi
fi

echo -e "${GREEN}🎉 ¡Todos los builds completados!${NC}"
echo ""
echo "Los archivos están en la carpeta 'dist/':"
ls -lh dist/ | grep -E '\.(AppImage|deb|rpm)$' || true
echo ""
echo -e "${BLUE}Formatos generados:${NC}"
echo "  • AppImage - Funciona en todas las distribuciones"
echo "  • DEB - Para Ubuntu/Debian"
echo ""
