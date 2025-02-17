const io = require('socket.io');
const clientIo = require('socket.io-client');
const os = require('os');

let server, lapTimerSocket;
let lapTimerUrl = '';
let repeaterPort = 3000;
let logCallback = () => {};

function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (let iface of Object.values(interfaces)) {
        for (let config of iface) {
            if (config.family === 'IPv4' && !config.internal) {
                return config.address;
            }
        }
    }
    return 'Onbekend';
}

function logMessage(message) {
    console.log(message); 
    logCallback(message);
}

function startRepeater(newLapTimerUrl, newRepeaterPort, logCb) {
    if (server) {
        logMessage("Repeater draait al.");
        return;
    }

    lapTimerUrl = newLapTimerUrl;
    repeaterPort = newRepeaterPort;
    logCallback = logCb;

    logMessage(`Verbinding maken met laptimer op: ${lapTimerUrl}`);

    lapTimerSocket = clientIo(lapTimerUrl, {
        transports: ["websocket"]
    });

    server = io(repeaterPort, {
        cors: { origin: "*", methods: ["GET", "POST"] }
    });

    server.on('connection', (socket) => {
        logMessage(`Nieuw client connected: ${socket.id}`);

        socket.onAny((event, ...args) => {
            logMessage(`📤 Overlay request received: ${event} - Data: ${JSON.stringify(args)}`);
            lapTimerSocket.emit(event, ...args);
        });


        lapTimerSocket.on('pi_time', (data) => {
            logMessage(`Data received: ${JSON.stringify(data)}`);
            socket.emit('pi_time', data);
        });

        lapTimerSocket.on('current_heat', (data) => {
            logMessage(`Data received: ${JSON.stringify(data)}`);
            socket.emit('current_heat', data);
        });

        lapTimerSocket.on('race_scheduled', (data) => {
            logMessage(`Data received: ${JSON.stringify(data)}`);
            socket.emit('race_scheduled', data);
        });

        lapTimerSocket.on('race_status', (data) => {
            logMessage(`Data received: ${JSON.stringify(data)}`);
            socket.emit('race_status', data);
        });

        lapTimerSocket.on('leaderboard', (data) => {
            logMessage(`Data received: ${JSON.stringify(data)}`);
            socket.emit('leaderboard', data);
        });

        lapTimerSocket.on('prestage_ready', (data) => {
            logMessage(`Data received: ${JSON.stringify(data)}`);
            socket.emit('prestage_ready', data);
        });

        lapTimerSocket.on('stage_ready', (data) => {
            logMessage(`Data received: ${JSON.stringify(data)}`);
            socket.emit('stage_ready', data);
        });

        lapTimerSocket.on('stop_timer', (data) => {
            logMessage(`Data received: ${JSON.stringify(data)}`);
            socket.emit('stop_timer', data);
        });


        lapTimerSocket.on('result_data', (data) => {
            logMessage(`Data received: ${JSON.stringify(data)}`);
            socket.emit('result_data', data);
        });

        lapTimerSocket.on('pilot_data', (data) => {
            logMessage(`Data received: ${JSON.stringify(data)}`);
            socket.emit('pilot_data', data);
        });

        lapTimerSocket.on('current_laps', (data) => {
            logMessage(`Data received: ${JSON.stringify(data)}`);
            socket.emit('current_laps', data);
        });

        

        socket.on('disconnect', () => {
            logMessage(`Client disconnected: ${socket.id}`);
        });
    });

    logMessage(`Repeater started on ${getLocalIp()}:${repeaterPort}`);
}

function stopRepeater() {
    if (server) {
        server.close();
        lapTimerSocket.close();
        server = null;
        lapTimerSocket = null;
        logMessage("Repeater stopped.");
    }
}

module.exports = { startRepeater, stopRepeater, getLocalIp };