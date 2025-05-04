const io = require('socket.io');
const clientIo = require('socket.io-client');
const os = require('os');
const { log } = require('console');

var pilot_data;
var class_data;
var heat_data;
var leaderboard;
var result_data;
var node_data;
var frequency_data;

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

function handleNodeData(socket){
    logMessage(`Node Data from Memory: ${JSON.stringify(node_data)}`);
    socket.emit('node_data', node_data);
}

function handleFrequencyData(socket){
    logMessage(`Frequency Data from Memory: ${JSON.stringify(frequency_data)}`);
    socket.emit('frequency_data', frequency_data);
}

function pilotDataRequest(lapTimerSocket){
    data_dependencies = ['leaderboard', 'pilot_data', 'class_data', 'heat_data', 'result_data', 'frequency_data'];
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
                if (data.load_types.includes('node_data')) {
                    handleNodeData(socket);
                    data.load_types = data.load_types.filter(type => type !== 'node_data');
                }
                if (data.load_types.includes('frequency_data')) {
                    handleFrequencyData(socket);
                    data.load_types = data.load_types.filter(type => type !== 'frequency_data');
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


        socket.on('schedule_race', (data) => {
            logMessage(`🔼 Schedule Race: ${JSON.stringify(data)}`);
            lapTimerSocket.emit('schedule_race', data);
        });

        socket.on('save_laps', () => {
            logMessage(`🔼 Save Laps`);
            lapTimerSocket.emit('save_laps');
        });

        socket.on('discard_laps', () => {
            logMessage(`🔼 Discard Laps`);
            lapTimerSocket.emit('discard_laps');
        });

        socket.on('cancel_schedule_race', () => {
            logMessage(`🔼 Cancel Schedule Race`);
            lapTimerSocket.emit('cancel_schedule_race');
        });

        socket.on('stop_race', () => {
            logMessage(`🔼 Stop Race`);
            lapTimerSocket.emit('stop_race');
        });

        socket.on('stage_race', () => {
            logMessage(`🔼 Stage Race`);
            lapTimerSocket.emit('stage_race');
        });
        
        socket.on('play_callout_text', (data) => {
            logMessage(`🔼 Play Callout Text: ${JSON.stringify(data)}`);
            lapTimerSocket.emit('play_callout_text', data);
        });

        socket.on('LED_solid', (data) => {
            logMessage(`🔼 LED Solid: ${JSON.stringify(data)}`);
            lapTimerSocket.emit('LED_solid', data);    
        });

        socket.on('LED_brightness', (data) => {
            logMessage(`🔼 LED Brightness: ${JSON.stringify(data)}`);
            lapTimerSocket.emit('LED_brightness', data);
        });

        socket.on('use_led_effect', (data) => {
            logMessage(`🔼 Use LED Effect: ${JSON.stringify(data)}`);
            lapTimerSocket.emit('use_led_effect', data);
        });

        socket.on('broadcast_message', (data) => {
            logMessage(`🔼 Broadcast Message: ${JSON.stringify(data)}`);
            broadcast_message.emit('LED_color', data);
        });


        // Lap Timer Socket Events
        lapTimerSocket.on('pi_time', (data) => {
            logMessage(`🔽 Pi Time: ${JSON.stringify(data)}`);
            socket.emit('pi_time', data);
        });

        lapTimerSocket.on('current_heat', (data) => {
            logMessage(`🔽 Current Heat: ${JSON.stringify(data)}`);
            socket.emit('current_heat', data);
        });

        lapTimerSocket.on('race_scheduled', (data) => {
            logMessage(`🔽 Race Scheduled: ${JSON.stringify(data)}`);
            socket.emit('race_scheduled', data);
        });

        lapTimerSocket.on('race_status', (data) => {
            logMessage(`🔽 Race Status: ${JSON.stringify(data)}`);
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

        /*
        lapTimerSocket.on('node_data', (data) => {
            logMessage(`node_data Data received: ${JSON.stringify(data)}`);
            node_data = data;
            socket.emit('node_data', data);
        });*/

        
        lapTimerSocket.on('frequency_data', (data) => {
            logMessage(`frequency_data Data received: ${JSON.stringify(data)}`);
            frequency_data = data;
            socket.emit('frequency_data', data);
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