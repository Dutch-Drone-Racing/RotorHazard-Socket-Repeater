const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    startRepeater: (lapTimerUrl, repeaterPort) => ipcRenderer.send('start-repeater', lapTimerUrl, repeaterPort),
    stopRepeater: () => ipcRenderer.send('stop-repeater'),
    getLocalIp: () => ipcRenderer.invoke('get-local-ip'),
    onLogMessage: (callback) => ipcRenderer.on('log-message', (_event, message) => callback(message))
});