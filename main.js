const { app, BrowserWindow } = require('electron');
const path = require('path');

const logger = (() => {
  const prefix = '[Electron]';
  const timestamp = () => new Date().toISOString();
  const log = (method) => (message, details) => {
    const formatted = `${prefix} ${timestamp()} - ${message}`;
    if (details) {
      console[method](formatted, details);
    } else {
      console[method](formatted);
    }
  };
  return {
    info: log('info'),
    warn: log('warn'),
    error: log('error')
  };
})();

function createWindow() {
  logger.info('Création d\'une nouvelle fenêtre principale');
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

  win.loadFile('index.html');
  win.webContents.on('did-finish-load', () => {
    logger.info('Fenêtre prête, contenu chargé');
  });
  win.on('closed', () => {
    logger.info('Fenêtre principale fermée');
  });
}

app.whenReady().then(() => {
  logger.info('Application prête');
  createWindow();
  app.on('activate', () => {
    logger.info('Activation de l\'application');
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  logger.info('Toutes les fenêtres sont fermées');
  if (process.platform !== 'darwin') {
    logger.info('Fermeture de l\'application');
    app.quit();
  }
});
