const { app, BrowserWindow, Tray, Menu, nativeImage, Notification, ipcMain, screen } = require('electron');
const path = require('path');

let mainWindow = null;
let miniPlayerWindow = null;
let tray = null;
let isQuitting = false;
let currentSong = {
  title: 'Sin reproducción',
  artist: '',
  isPlaying: false
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'YouTube Music',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    }
  });

  // Cargar YouTube Music
  mainWindow.loadURL('https://music.youtube.com');

  // Manejar el evento de cerrar ventana
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();

      // Mostrar notificación en macOS
      if (process.platform === 'darwin') {
        app.dock.hide();
      }

      return false;
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Escuchar cambios en la canción actual
  mainWindow.webContents.on('did-finish-load', () => {
    startTrackingMusic();
  });
}

// Función para obtener información de la canción actual
function startTrackingMusic() {
  if (!mainWindow) return;

  // Verificar la canción cada 2 segundos
  setInterval(async () => {
    if (!mainWindow) return;

    try {
      const songInfo = await mainWindow.webContents.executeJavaScript(`
        (function() {
          const titleElement = document.querySelector('.title.style-scope.ytmusic-player-bar');
          const artistElement = document.querySelector('.byline.style-scope.ytmusic-player-bar');
          const playButton = document.querySelector('.play-pause-button');

          if (titleElement && artistElement) {
            // Detectar si está reproduciendo basándose en el aria-label o el título
            let isPlaying = false;
            if (playButton) {
              const ariaLabel = playButton.getAttribute('aria-label') || '';
              const title = playButton.getAttribute('title') || '';
              // Puede estar en español (Pausar/Reproducir) o inglés (Pause/Play)
              isPlaying = ariaLabel.includes('Pausar') || ariaLabel.includes('Pause') ||
                          title.includes('Pausar') || title.includes('Pause');
            }

            return {
              title: titleElement.textContent.trim(),
              artist: artistElement.textContent.trim(),
              isPlaying: isPlaying
            };
          }
          return null;
        })();
      `);

      if (songInfo && songInfo.title !== currentSong.title) {
        const previousSong = { ...currentSong };
        currentSong = songInfo;
        // updateTrayMenu();
        updateTrayTooltip();

        // Mostrar notificación si la canción cambió
        if (previousSong.title !== 'Sin reproducción' && Notification.isSupported()) {
          showNotification(songInfo.title, songInfo.artist);
        }
      } else if (songInfo && songInfo.isPlaying !== currentSong.isPlaying) {
        currentSong.isPlaying = songInfo.isPlaying;
        // updateTrayMenu();
        updateTrayTooltip(); // También actualizar el mini player cuando cambia el estado
      }
    } catch (error) {
      // Ignorar errores silenciosamente
    }
  }, 2000);
}

// Mostrar notificación de nueva canción
function showNotification(title, artist) {
  const notification = new Notification({
    title: 'Reproduciendo ahora',
    body: `${title}\n${artist}`,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    silent: true
  });

  notification.on('click', () => {
    if (mainWindow) {
      mainWindow.show();
      if (process.platform === 'darwin') {
        app.dock.show();
      }
    }
  });

  notification.show();
}

// Actualizar el tooltip del tray con la canción actual
function updateTrayTooltip() {
  if (!tray) return;

  if (currentSong.title === 'Sin reproducción') {
    tray.setToolTip('YouTube Music');
  } else {
    const statusIcon = currentSong.isPlaying ? '▶' : '⏸';
    tray.setToolTip(`${statusIcon} ${currentSong.title}\n${currentSong.artist}`);
  }

  // Actualizar mini player si está abierto
  if (miniPlayerWindow && !miniPlayerWindow.isDestroyed()) {
    miniPlayerWindow.webContents.send('update-song', currentSong);
  }
}

// Crear ventana del mini reproductor
function createMiniPlayer() {
  if (miniPlayerWindow && !miniPlayerWindow.isDestroyed()) {
    miniPlayerWindow.show();
    miniPlayerWindow.focus();
    return;
  }

  // Obtener posición del tray
  const trayBounds = tray.getBounds();
  const primaryDisplay = screen.getPrimaryDisplay();
  const displayBounds = primaryDisplay.workAreaSize;

  // Calcular posición (cerca del tray)
  let x, y;
  if (process.platform === 'darwin') {
    // macOS: tray está en la parte superior
    x = Math.round(trayBounds.x - 160 + trayBounds.width / 2);
    y = Math.round(trayBounds.y + trayBounds.height + 5);
  } else if (process.platform === 'win32') {
    // Windows: tray generalmente está abajo a la derecha
    x = Math.round(displayBounds.width - 340);
    y = Math.round(displayBounds.height - 400);
  } else {
    // Linux: varía según el escritorio
    x = Math.round(displayBounds.width - 340);
    y = Math.round(trayBounds.y + trayBounds.height + 5);
  }

  miniPlayerWindow = new BrowserWindow({
    width: 380,
    height: 340,
    x: x,
    y: y,
    frame: false,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    transparent: false,
    show: false,
    backgroundColor: '#000000',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  miniPlayerWindow.loadFile('mini-player.html');

  miniPlayerWindow.once('ready-to-show', () => {
    miniPlayerWindow.show();
    // Enviar información actual de la canción
    miniPlayerWindow.webContents.send('update-song', currentSong);
  });

  // Cerrar cuando pierde el foco
  miniPlayerWindow.on('blur', () => {
    if (miniPlayerWindow && !miniPlayerWindow.isDestroyed()) {
      miniPlayerWindow.hide();
    }
  });

  miniPlayerWindow.on('closed', () => {
    miniPlayerWindow = null;
  });
}

// Manejar acciones del mini reproductor
ipcMain.on('player-action', async (event, action) => {
  try {
    switch (action) {
      case 'play-pause':
        if (mainWindow && !mainWindow.isDestroyed()) {
          try {
            await mainWindow.webContents.executeJavaScript(`
              (function() {
                const playButton = document.querySelector('.play-pause-button');
                if (playButton) {
                  playButton.click();
                  return true;
                }
                return false;
              })();
            `);
          } catch (error) {
            console.error('Error ejecutando play-pause:', error);
          }
        }
        break;

      case 'next':
        if (mainWindow && !mainWindow.isDestroyed()) {
          try {
            await mainWindow.webContents.executeJavaScript(`
              (function() {
                const nextButton = document.querySelector('.next-button');
                if (nextButton) {
                  nextButton.click();
                  return true;
                }
                return false;
              })();
            `);
          } catch (error) {
            console.error('Error ejecutando next:', error);
          }
        }
        break;

      case 'previous':
        if (mainWindow && !mainWindow.isDestroyed()) {
          try {
            await mainWindow.webContents.executeJavaScript(`
              (function() {
                const prevButton = document.querySelector('.previous-button');
                if (prevButton) {
                  prevButton.click();
                  return true;
                }
                return false;
              })();
            `);
          } catch (error) {
            console.error('Error ejecutando previous:', error);
          }
        }
        break;

      case 'open-main':
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.show();
          if (process.platform === 'darwin') {
            app.dock.show();
          }
        }
        if (miniPlayerWindow && !miniPlayerWindow.isDestroyed()) {
          miniPlayerWindow.close();
        }
        break;

      case 'quit':
        isQuitting = true;
        // Cerrar todas las ventanas antes de salir
        if (miniPlayerWindow && !miniPlayerWindow.isDestroyed()) {
          miniPlayerWindow.destroy();
        }
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.destroy();
        }
        app.quit();
        break;

      case 'close-mini':
        if (miniPlayerWindow && !miniPlayerWindow.isDestroyed()) {
          miniPlayerWindow.close();
        }
        break;
    }
  } catch (error) {
    console.error('Error en player-action:', error);
  }
});

// Enviar información de canción cuando se solicita
ipcMain.on('request-song-info', (event) => {
  event.reply('update-song', currentSong);
});

function createTray() {
  // Crear icono para el system tray
  // En macOS, los iconos deben ser plantillas (template images)
  let iconPath;

  if (process.platform === 'darwin') {
    iconPath = path.join(__dirname, 'assets', 'trayTemplate.png');
  } else {
    iconPath = path.join(__dirname, 'assets', 'tray.png');
  }

  // Cargar el icono
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon);

  tray.setToolTip('YouTube Music');

  // Click en el icono del tray muestra el mini player
  tray.on('click', () => {
    createMiniPlayer();
  });

  // Click derecho muestra el menú contextual
  // tray.on('right-click', () => {
  //   updateTrayMenu();
  //   tray.popUpContextMenu();
  // });

  // Doble click en el icono del tray muestra la ventana principal
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      if (process.platform === 'darwin') {
        app.dock.show();
      }
    }
  });
}

// Actualizar el menú del tray con la información actual
function updateTrayMenu() {
  if (!tray) return;

  const menuTemplate = [
    {
      label: 'Mostrar YouTube Music',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          if (process.platform === 'darwin') {
            app.dock.show();
          }
        }
      }
    },
    {
      type: 'separator'
    }
  ];

  // Agregar información de la canción actual si está disponible
  if (currentSong.title !== 'Sin reproducción') {
    menuTemplate.push({
      label: `${currentSong.isPlaying ? '▶' : '⏸'} ${currentSong.title}`,
      enabled: false
    });
    menuTemplate.push({
      label: `   ${currentSong.artist}`,
      enabled: false
    });
    menuTemplate.push({
      type: 'separator'
    });
  }

  // Controles de reproducción
  menuTemplate.push(
    {
      label: currentSong.isPlaying ? 'Pausar' : 'Reproducir',
      click: async () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          try {
            await mainWindow.webContents.executeJavaScript(`
              (function() {
                const playButton = document.querySelector('.play-pause-button');
                if (playButton) {
                  playButton.click();
                  return true;
                }
                return false;
              })();
            `);
          } catch (error) {
            console.error('Error ejecutando play-pause desde menú:', error);
          }
        }
      }
    },
    {
      label: 'Siguiente',
      click: async () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          try {
            await mainWindow.webContents.executeJavaScript(`
              (function() {
                const nextButton = document.querySelector('.next-button');
                if (nextButton) {
                  nextButton.click();
                  return true;
                }
                return false;
              })();
            `);
          } catch (error) {
            console.error('Error ejecutando next desde menú:', error);
          }
        }
      }
    },
    {
      label: 'Anterior',
      click: async () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          try {
            await mainWindow.webContents.executeJavaScript(`
              (function() {
                const prevButton = document.querySelector('.previous-button');
                if (prevButton) {
                  prevButton.click();
                  return true;
                }
                return false;
              })();
            `);
          } catch (error) {
            console.error('Error ejecutando previous desde menú:', error);
          }
        }
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Salir',
      click: () => {
        isQuitting = true;
        // Cerrar todas las ventanas antes de salir
        if (miniPlayerWindow && !miniPlayerWindow.isDestroyed()) {
          miniPlayerWindow.destroy();
        }
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.destroy();
        }
        app.quit();
      }
    }
  );

  const contextMenu = Menu.buildFromTemplate(menuTemplate);
  tray.setContextMenu(contextMenu);
}

// Evento cuando la app está lista
app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow) {
      mainWindow.show();
      if (process.platform === 'darwin') {
        app.dock.show();
      }
    }
  });
});

// Salir cuando todas las ventanas están cerradas
app.on('window-all-closed', () => {
  // Si isQuitting es true, salir completamente
  if (isQuitting) {
    app.quit();
  }
  // Si no, la app sigue corriendo en el tray (no hacer nada)
});

// Manejar el evento before-quit
app.on('before-quit', () => {
  isQuitting = true;
});

// Asegurarse de que la app se cierre completamente
app.on('will-quit', () => {
  // Limpiar cualquier recurso si es necesario
});
