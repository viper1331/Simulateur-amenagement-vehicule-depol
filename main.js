const { app, BrowserWindow } = require('electron');
const path = require('path');

const MAIN_LOG_PREFIX = '[MainProcess]';

const logInfo = (message, details) => {
  if (details !== undefined) {
    console.log(`${MAIN_LOG_PREFIX} ${message}`, details);
  } else {
    console.log(`${MAIN_LOG_PREFIX} ${message}`);
  }
};

const logError = (message, error) => {
  if (error !== undefined) {
    console.error(`${MAIN_LOG_PREFIX} ${message}`, error);
  } else {
    console.error(`${MAIN_LOG_PREFIX} ${message}`);
  }
};

function createWindow() {
  logInfo('Creating main window');
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 720,
    title: 'Simulateur 3D de véhicule de dépollution',
    backgroundColor: '#10131a',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.webContents.on('did-finish-load', () => {
    logInfo('Renderer finished loading');
  });

  win.on('unresponsive', () => {
    logError('Renderer became unresponsive');
  });

  win.on('render-process-gone', (_event, details) => {
    logError('Renderer process terminated', details);
  });

  win.loadFile('index.html').catch((error) => {
    logError('Failed to load index.html', error);
  });
}

app.whenReady()
  .then(() => {
    logInfo('App is ready');
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        logInfo('Recreating window after activate event');
        createWindow();
      }
    });
  })
  .catch((error) => {
    logError('Error during app initialization', error);
  });

app.on('render-process-gone', (_event, webContents, details) => {
  logError(`Render process gone for contents id=${webContents?.id}`, details);
});

app.on('child-process-gone', (_event, details) => {
  logError('Child process terminated', details);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    logInfo('All windows closed, quitting application');
    app.quit();
  }
});
