const io = require('socket.io');
const clientIo = require('socket.io-client');
const os = require('os');
const { log } = require('console');

var pilot_data;
var class_data;
var heat_data;
var leaderboard;
var result_data;


var initial_connection = 0;

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
    return 'Unknown';
}


function logMessage(message) {
    console.log(message); 
    logCallback(message);
}

function handlePilotData(socket){
    logMessage(`Pilot Data from Memory: ${JSON.stringify(pilot_data)}`);
    socket.emit('pilot_data', pilot_data);
}

function handleClassData(socket){
    logMessage(`Class Data from Memory: ${JSON.stringify(class_data)}`);
    socket.emit('class_data', class_data);
}

function handleHeatData(socket){
    logMessage(`Heat Data from Memory: ${JSON.stringify(heat_data)}`);
    socket.emit('heat_data', heat_data);
}

function handleLeaderboardData(socket){
    logMessage(`Leaderboard from Memory: ${JSON.stringify(leaderboard)}`);
    socket.emit('leaderboard', leaderboard);
}

function handleResultData(socket){
    logMessage(`Result Data from Memory: ${JSON.stringify(result_data)}`);
    socket.emit('result_data', result_data);
}

function pilotDataRequest(lapTimerSocket){
    data_dependencies = ['leaderboard', 'pilot_data', 'class_data', 'heat_data', 'result_data'];
    lapTimerSocket.emit('load_data', {'load_types': data_dependencies});
    logMessage('Pilot data requested');
}

function startRepeater(newLapTimerUrl, newRepeaterPort, logCb) {
    if (server) {
        logMessage("Repeater already running.");
        return;
    }

    lapTimerUrl = newLapTimerUrl;
    repeaterPort = newRepeaterPort;
    logCallback = logCb;

    logMessage(`Connecting with RotorHazard on: ${lapTimerUrl}`);

    lapTimerSocket = clientIo(lapTimerUrl, {
        transports: ["polling", "websocket"]
    });

    server = io(repeaterPort, {
        cors: { origin: "*", methods: ["GET", "POST"] }
    });

    server.on('connection', (socket) => {
        logMessage(`New client connected: ${socket.id}`);
        
        if (initial_connection == 0){
            initial_connection = 1;
            pilotDataRequest(lapTimerSocket);
        }


        socket.on('load_data', (data) => {        
            if (data.load_types && Array.isArray(data.load_types)) {
                if (data.load_types.includes('pilot_data')) {
                    handlePilotData(socket);
                    data.load_types = data.load_types.filter(type => type !== 'pilot_data');
                }
                if (data.load_types.includes('class_data')) {
                    handleClassData(socket);
                    data.load_types = data.load_types.filter(type => type !== 'class_data');
                }
                if (data.load_types.includes('heat_data')) {
                    handleHeatData(socket);
                    data.load_types = data.load_types.filter(type => type !== 'heat_data');
                }
                if (data.load_types.includes('leaderboard')) {
                    handleLeaderboardData(socket);
                    data.load_types = data.load_types.filter(type => type !== 'leaderboard');
                }
                if (data.load_types.includes('result_data')) {
                    handleResultData(socket);
                    data.load_types = data.load_types.filter(type => type !== 'result_data');
                }
            }            
            lapTimerSocket.emit('load_data', data);
        });

        socket.on('get_pi_time', (data) => {
            logMessage(`Data received: ${JSON.stringify(data)}`);
            lapTimerSocket.emit('get_pi_time', data);
        });
   
        socket.on('get_race_scheduled', (data) => {
            logMessage(`Data received: ${JSON.stringify(data)}`);
            lapTimerSocket.emit('get_race_scheduled', data);
        });

        lapTimerSocket.on('pi_time', (data) => {
            logMessage(`Data received: ${JSON.stringify(data)}`);
            socket.emit('pi_time', data);
        });

        lapTimerSocket.on('current_heat', (data) => {
            logMessage(`Current Heat Data received: ${JSON.stringify(data)}`);
            socket.emit('current_heat', data);
        });

        lapTimerSocket.on('race_scheduled', (data) => {
            logMessage(`Data received: ${JSON.stringify(data)}`);
            socket.emit('race_scheduled', data);
        });

        lapTimerSocket.on('race_status', (data) => {
            logMessage(`RS Data received: ${JSON.stringify(data)}`);
            socket.emit('race_status', data);
        });

        lapTimerSocket.on('prestage_ready', (data) => {
            logMessage(`PR Data received: ${JSON.stringify(data)}`);
            socket.emit('prestage_ready', data);
        });

        lapTimerSocket.on('stage_ready', (data) => {
            logMessage(`SR Data received: ${JSON.stringify(data)}`);
            socket.emit('stage_ready', data);
        });

        lapTimerSocket.on('stop_timer', (data) => {
            logMessage(`ST Data received: ${JSON.stringify(data)}`);
            socket.emit('stop_timer', data);
        });


        lapTimerSocket.on('result_data', (data) => {
            logMessage(`RD Data received: ${JSON.stringify(data)}`);
            socket.emit('result_data', data);
        });


        lapTimerSocket.on('current_laps', (data) => {
            logMessage(`Data received: ${JSON.stringify(data)}`);
            socket.emit('current_laps', data);
        });

        lapTimerSocket.on('race_list', (data) => {
            logMessage(`Racelist Data received: ${JSON.stringify(data)}`);
            socket.emit('race_list', data);
        });
        

        lapTimerSocket.on('leaderboard', (data) => {
            logMessage(`LB Data received: ${JSON.stringify(data)}`);
            leaderboard = data;
            socket.emit('leaderboard', data);
        });

        lapTimerSocket.on('pilot_data', (data) => {
            logMessage(`PD Data received: ${JSON.stringify(data)}`);
            pilot_data = data;
            socket.emit('pilot_data', data);
        });

        lapTimerSocket.on('heat_data', (data) => {
            logMessage(`heat_data Data received: ${JSON.stringify(data)}`);
            heat_data = data;
            socket.emit('heat_data', data);
        });
        
        lapTimerSocket.on('class_data', (data) => {
            logMessage(`class_data Data received: ${JSON.stringify(data)}`);
            class_data = data;
            socket.emit('class_data', data);
        });

        lapTimerSocket.on('result_data', (data) => {
            logMessage(`result_data Data received: ${JSON.stringify(data)}`);
            result_data = data;
            socket.emit('result_data', data);
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

function getLapTimerSocket() {
    return lapTimerSocket;
}


module.exports = { startRepeater, stopRepeater, getLocalIp, getLapTimerSocket, pilotDataRequest };