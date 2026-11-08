const { app, BrowserWindow, Tray, Menu, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let settingsWindow = null;
let tray = null;

// Settings file path in userData
const configPath = path.join(app.getPath('userData'), 'drishti-settings.json');

const defaultSettings = {
  animationEnabled: true,
  swingIntensity: 1.0,
  animationSpeed: 1.0,
  position: 'center',
  startWithWindows: false,
  showString: true,
  customX: null,
  currentCharm: 'classic'
};

function loadSettings() {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8');
      return { ...defaultSettings, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error('Failed to load settings, using defaults:', err);
  }
  return { ...defaultSettings };
}

function saveSettings(settings) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

let currentSettings = loadSettings();

// Calculate position on primary display
function calculateWindowX(preset, winWidth) {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth } = primaryDisplay.workArea;

  switch (preset) {
    case 'left':
      return 40;
    case 'right':
      return Math.max(0, screenWidth - winWidth - 40);
    case 'center':
    default:
      return Math.round((screenWidth - winWidth) / 2);
  }
}

function createMainWindow() {
  const winWidth = 240;
  const winHeight = 280;

  let initialX;
  if (currentSettings.customX !== null && typeof currentSettings.customX === 'number') {
    initialX = currentSettings.customX;
  } else {
    initialX = calculateWindowX(currentSettings.position, winWidth);
  }

  mainWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x: initialX,
    y: 0,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    focusable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
  mainWindow.setVisibleOnAllWorkspaces(true);

  // By default, ignore mouse clicks so background apps are clickable
  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.show();
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 440,
    height: 720,
    title: 'Drishti Dangle - Settings',
    resizable: false,
    minimizable: false,
    maximizable: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  settingsWindow.loadFile(path.join(__dirname, 'settings.html'));

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

function updateWindowPositionPreset(preset) {
  if (!mainWindow) return;
  const winWidth = mainWindow.getBounds().width;
  const newX = calculateWindowX(preset, winWidth);
  mainWindow.setPosition(newX, 0);

  currentSettings.position = preset;
  currentSettings.customX = newX;
  saveSettings(currentSettings);

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('settings-updated', currentSettings);
  }
}

function updateCharm(charmKey) {
  currentSettings.currentCharm = charmKey;
  saveSettings(currentSettings);

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('settings-updated', currentSettings);
  }
  buildTrayMenu();
}

function buildTrayMenu() {
  const isVisible = mainWindow && mainWindow.isVisible();
  const activeCharm = currentSettings.currentCharm || 'classic';

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Drishti Dangle',
      enabled: false,
      icon: path.join(__dirname, 'assets', 'tray-icon.png')
    },
    { type: 'separator' },
    {
      label: 'Show Drishti',
      type: 'checkbox',
      checked: isVisible,
      click: () => {
        if (!mainWindow) {
          createMainWindow();
        } else if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
        }
        buildTrayMenu();
      }
    },
    {
      label: 'Position',
      submenu: [
        {
          label: 'Left',
          type: 'radio',
          checked: currentSettings.position === 'left',
          click: () => updateWindowPositionPreset('left')
        },
        {
          label: 'Center',
          type: 'radio',
          checked: currentSettings.position === 'center',
          click: () => updateWindowPositionPreset('center')
        },
        {
          label: 'Right',
          type: 'radio',
          checked: currentSettings.position === 'right',
          click: () => updateWindowPositionPreset('right')
        }
      ]
    },
    {
      label: 'Charm Design',
      submenu: [
        {
          label: 'Classic Black Mask',
          type: 'radio',
          checked: activeCharm === 'classic',
          click: () => updateCharm('classic')
        },
        {
          label: 'Terracotta Guardian',
          type: 'radio',
          checked: activeCharm === 'terracotta',
          click: () => updateCharm('terracotta')
        },
        {
          label: 'Swarna Royal Gold',
          type: 'radio',
          checked: activeCharm === 'gold',
          click: () => updateCharm('gold')
        },
        {
          label: 'Cute Chibi Guardian',
          type: 'radio',
          checked: activeCharm === 'chibi',
          click: () => updateCharm('chibi')
        },
        {
          label: 'Spider-Man (Web-Slinger)',
          type: 'radio',
          checked: activeCharm === 'spiderman',
          click: () => updateCharm('spiderman')
        },
        {
          label: 'Batman (The Dark Knight)',
          type: 'radio',
          checked: activeCharm === 'batman',
          click: () => updateCharm('batman')
        }
      ]
    },
    { type: 'separator' },
    {
      label: 'Settings...',
      click: () => createSettingsWindow()
    },
    { type: 'separator' },
    {
      label: 'Quit Drishti Dangle',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  if (tray) {
    tray.setContextMenu(contextMenu);
  }
}

function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'tray-icon.png');
  tray = new Tray(iconPath);
  tray.setToolTip('Drishti Dangle - Screen Guardian');

  buildTrayMenu();

  tray.on('double-click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        createSettingsWindow();
      } else {
        mainWindow.show();
      }
    } else {
      createMainWindow();
    }
    buildTrayMenu();
  });
}

// Single instance lock
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    // Sync auto-launch at login
    app.setLoginItemSettings({
      openAtLogin: !!currentSettings.startWithWindows,
      path: process.execPath
    });

    createMainWindow();
    createTray();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });
  });
}

// IPC Handlers
ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && !win.isDestroyed()) {
    win.setIgnoreMouseEvents(ignore, options || { forward: true });
  }
});

ipcMain.on('drag-window', (event, deltaX) => {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  const [currentX] = mainWindow.getPosition();
  const bounds = mainWindow.getBounds();
  const primaryDisplay = screen.getPrimaryDisplay();
  const maxRight = primaryDisplay.workArea.width - bounds.width;

  const newX = Math.round(Math.min(Math.max(0, currentX + deltaX), maxRight));
  mainWindow.setPosition(newX, 0);

  currentSettings.customX = newX;
  currentSettings.position = 'custom';
  saveSettings(currentSettings);
});

ipcMain.on('set-position-preset', (event, preset) => {
  updateWindowPositionPreset(preset);
});

ipcMain.handle('get-settings', () => {
  return currentSettings;
});

ipcMain.handle('save-settings', (event, newSettings) => {
  currentSettings = { ...currentSettings, ...newSettings };
  saveSettings(currentSettings);

  // Update auto-start setting
  app.setLoginItemSettings({
    openAtLogin: !!currentSettings.startWithWindows,
    path: process.execPath
  });

  // Notify main overlay window
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('settings-updated', currentSettings);
  }

  // Update position if preset was changed
  if (newSettings.position && ['left', 'center', 'right'].includes(newSettings.position)) {
    updateWindowPositionPreset(newSettings.position);
  }

  buildTrayMenu();
  return currentSettings;
});

ipcMain.on('open-settings', () => {
  createSettingsWindow();
});

ipcMain.on('hide-bommai', () => {
  if (mainWindow) {
    mainWindow.hide();
    buildTrayMenu();
  }
});

ipcMain.on('quit-app', () => {
  app.isQuitting = true;
  app.quit();
});

app.on('window-all-closed', () => {
  // Keep app running in system tray unless explicitly quitting
  if (process.platform !== 'darwin' && app.isQuitting) {
    app.quit();
  }
});
