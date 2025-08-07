const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // App version
  getVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Menu actions
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-action', callback);
  },
  
  // Dialog methods
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  
  // File operations
  exportData: (filePath, data) => ipcRenderer.invoke('export-data', filePath, data),
  importData: (filePath) => ipcRenderer.invoke('import-data', filePath),
  
  // Database operations
  backupDatabase: (filePath) => ipcRenderer.invoke('backup-database', filePath),
  restoreDatabase: (filePath) => ipcRenderer.invoke('restore-database', filePath),
  
  // System info
  platform: process.platform,
  
  // Utility methods
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  
  // Remove all listeners (cleanup)
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});

// Expose a flag to indicate we're running in Electron
contextBridge.exposeInMainWorld('isElectron', true);
