const { app, BrowserWindow, ipcMain } = require('electron');
const { startRepeater, stopRepeater, getLocalIp, getLapTimerSocket, pilotDataRequest } = require('./repeater');

let mainWindow;

ipcMain.on('request-pilot-data', () => {
    const lapTimerSocket = getLapTimerSocket();
    if (lapTimerSocket) {
        pilotDataRequest(lapTimerSocket);
    } else {
        console.log("❌ No connection with RotorHazard socket.");
    }
});

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 700,
        height: 900,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: __dirname + '/preload.js'
        }
    });

    mainWindow.loadFile('index.html');

    ipcMain.on('start-repeater', (event, lapTimerUrl, repeaterPort) => {
        startRepeater(lapTimerUrl, repeaterPort, (message) => {
            mainWindow.webContents.send('log-message', message);
        });
    });

    ipcMain.on('stop-repeater', () => {
        stopRepeater();
        mainWindow.webContents.send('log-message', "Repeater stopped.");
    });

    ipcMain.handle('get-local-ip', () => getLocalIp());

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });
});