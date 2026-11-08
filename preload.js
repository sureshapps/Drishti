const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Mouse event pass-through control
  setIgnoreMouseEvents: (ignore, options) => {
    ipcRenderer.send('set-ignore-mouse-events', ignore, options);
  },

  // Window positioning and dragging
  dragWindow: (deltaX) => {
    ipcRenderer.send('drag-window', deltaX);
  },
  setPositionPreset: (preset) => {
    ipcRenderer.send('set-position-preset', preset);
  },

  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  onSettingsUpdate: (callback) => {
    const subscription = (_event, value) => callback(value);
    ipcRenderer.on('settings-updated', subscription);
    return () => ipcRenderer.removeListener('settings-updated', subscription);
  },

  // Window control & Settings dialog
  openSettings: () => ipcRenderer.send('open-settings'),
  hideBommai: () => ipcRenderer.send('hide-bommai'),
  quitApp: () => ipcRenderer.send('quit-app')
});
