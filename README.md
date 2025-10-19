# YouTube Music Desktop App

Aplicación de escritorio para YouTube Music con soporte para system tray.

## Características

- Reproduce YouTube Music en una ventana de escritorio dedicada
- Al cerrar la ventana, se minimiza al system tray en lugar de cerrar la aplicación
- La música sigue reproduciéndose en segundo plano
- **Mini reproductor personalizado** con interfaz gráfica moderna
  - Aparece al hacer clic en el icono del tray
  - Muestra la canción actual y controles de reproducción
  - Diseño elegante con gradiente morado
  - Se cierra automáticamente al perder el foco
- **Información en tiempo real** de la canción actual en el tooltip del tray
- **Notificaciones** cuando cambia la canción (con título y artista)
- **Menú contextual** del system tray que muestra:
  - Título y artista de la canción actual
  - Estado de reproducción (reproduciendo/pausado)
  - Controles de reproducción (Reproducir/Pausar, Siguiente, Anterior)
  - Mostrar/Ocultar ventana
  - Salir de la aplicación

## Instalación

1. Instala las dependencias:
```bash
pnpm install
```

> **Nota**: Este proyecto usa **pnpm** en lugar de npm por ser más rápido y eficiente. Los builds de Docker también usan pnpm para mayor velocidad. También puedes usar `npm install` si prefieres.

## Uso

### Opción 1: Ejecutar la aplicación compilada (RECOMENDADO para macOS)

Para ver el icono correcto en el Dock de macOS, debes compilar la aplicación:

```bash
pnpm build:mac
```

Esto generará una aplicación en `dist/YouTube Music-1.0.0-arm64.dmg`.

Para instalarla:
1. Abre el archivo DMG
2. Arrastra "YouTube Music" a la carpeta Aplicaciones
3. Ejecuta la app desde Aplicaciones

### Opción 2: Modo desarrollo

Ejecuta la aplicación en modo desarrollo (mostrará el icono de Electron en el Dock):
```bash
pnpm start
```

### Otras plataformas

Para compilar en otras plataformas:
```bash
pnpm build:win    # Windows
pnpm build:linux  # Linux
pnpm build        # Todas las plataformas
```

## Funcionamiento

### Minimizar al system tray
Cuando cierres la ventana (haciendo clic en X), la aplicación:
- Se ocultará de la barra de tareas
- Seguirá corriendo en el system tray
- La música continuará reproduciéndose

### Información de la canción actual
La aplicación muestra información en tiempo real:
- **Tooltip del tray**: Muestra el título, artista y estado (▶/⏸) al pasar el cursor
- **Menú del tray**: Incluye el título y artista en la parte superior
- **Notificaciones**: Aparecen automáticamente cuando cambia la canción

### Mini reproductor
Haz **clic simple** en el icono del tray para abrir el mini reproductor:
- Muestra una interfaz gráfica moderna y elegante
- Visualiza la canción actual, artista y estado de reproducción
- Incluye botones grandes para controlar la música
- Permite abrir la ventana principal o salir de la app
- Se cierra automáticamente cuando haces clic fuera de él

### Menú contextual
Haz **clic derecho** en el icono del tray para:
- Ver la canción que se está reproduciendo
- Reproducir/Pausar la música
- Cambiar a la canción siguiente o anterior
- Mostrar/Ocultar la ventana principal

### Mostrar la ventana nuevamente
Puedes volver a mostrar la ventana:
- Haciendo doble clic en el icono del system tray
- Seleccionando "Mostrar YouTube Music" del menú del tray
- Haciendo clic en una notificación de canción

### Cerrar completamente la aplicación
Para cerrar la aplicación por completo:
- Haz clic derecho en el icono del system tray
- Selecciona "Salir"

## Estructura del proyecto

```
youtube-music/
├── main.js           # Proceso principal de Electron
├── mini-player.html  # Interfaz del mini reproductor
├── package.json      # Configuración del proyecto
├── assets/           # Iconos de la aplicación
│   └── README.md     # Instrucciones para los iconos
└── README.md         # Este archivo
```

## Personalización

### Iconos
Puedes agregar tus propios iconos en la carpeta [assets/](assets/). Lee [assets/README.md](assets/README.md) para más detalles.

### Modificar la URL
Si quieres cargar una URL diferente, edita [main.js:19](main.js#L19):
```javascript
mainWindow.loadURL('https://music.youtube.com');
```

## Requisitos

- Node.js 16 o superior
- pnpm (instalar con `npm install -g pnpm` o `corepack enable`)

## Plataformas soportadas

- macOS
- Windows
- Linux

## Build y Releases

### Compilar localmente

#### macOS
```bash
npm run build:mac
```
Genera: `.dmg` y `.zip` (Intel x64 y Apple Silicon ARM64)

#### Windows
```bash
npm run build:win
```
Genera: `.exe` (instalador NSIS) y `-portable.exe` (x64 y ia32)

#### Linux (usando Docker)

Para compilar para Linux desde macOS/Windows, usa Docker:

```bash
# Compilar para x64 solamente
./build-linux.sh x64

# Compilar para ARM64 solamente (Raspberry Pi, etc.)
./build-linux.sh arm64

# Compilar para ambas arquitecturas
./build-linux.sh all
```

**Requisitos:**
- Docker Desktop instalado y corriendo
- Soporte para multi-arquitectura habilitado en Docker

Genera: `.AppImage` y `.deb` (x64 y ARM64)

> **Nota**: Docker compila en contenedores Linux nativos, por lo que funciona perfectamente desde macOS o Windows.

### Crear un release en GitHub

1. **Compila localmente** los archivos para tu plataforma
2. **Actualiza la versión** en `package.json`
3. **Crea un tag** y súbelo a GitHub:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
4. **Ve a GitHub** y [crea un nuevo release](https://github.com/TU_USUARIO/youtube-music-desktop/releases/new)
5. **Arrastra los archivos** de `dist/` al release
6. **Publica el release**

> **Nota**: El workflow de GitHub Actions creará automáticamente el release cuando hagas push del tag, pero necesitarás subir los binarios manualmente desde tu computadora.

### Descargar releases

Los releases están disponibles en la [página de releases](https://github.com/TU_USUARIO/youtube-music-desktop/releases).

## Licencia

MIT
