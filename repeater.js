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
    logMessage(`Pilot Data from Memory`);
    socket.emit('pilot_data', pilot_data);
}

function handleClassData(socket){
    logMessage(`Class Data from Memory`);
    socket.emit('class_data', class_data);
}

function handleHeatData(socket){
    logMessage(`Heat Data from Memory`);
    socket.emit('heat_data', heat_data);
}

function handleLeaderboardData(socket){
    logMessage(`Leaderboard from Memory`);
    socket.emit('leaderboard', leaderboard);
}

function handleResultData(socket){
    logMessage(`Result Data from Memory`);
    socket.emit('result_data', result_data);
}

function handleNodeData(socket){
    logMessage(`Node Data from Memory`);
    socket.emit('node_data', node_data);
}

function handleFrequencyData(socket){
    logMessage(`Frequency Data from Memory`);
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
        transports: ["polling"],
        upgrade: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
        forceNew: true,
        path: '/socket.io/'
    });

    lapTimerSocket.on('connect_error', (error) => {
        logMessage(`Connection error: ${error.message}`);
        if (error.message.includes('websocket')) {
            logMessage('Falling back to polling transport');
            lapTimerSocket.io.opts.transports = ['polling'];
        }
    });

    lapTimerSocket.on('connect', () => {
        logMessage('Successfully connected to RotorHazard server');
    });

    lapTimerSocket.on('disconnect', (reason) => {
        logMessage(`Disconnected from RotorHazard server: ${reason}`);
    });

    server = io(repeaterPort, {
        cors: { 
            origin: "*", 
            methods: ["GET", "POST"],
            credentials: true
        },
        allowEIO3: true,
        transports: ["polling", "websocket"],
        path: '/socket.io/'
    });

    server.on('connection', (socket) => {
        logMessage(`🔼 New client connected: ${socket.id}`);
        
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
            logMessage(`🔼 Get Pi Time`);
            lapTimerSocket.emit('get_pi_time', data);
        });
   
        socket.on('get_race_scheduled', (data) => {
            logMessage(`🔼 Get Race Scheduled`);
            lapTimerSocket.emit('get_race_scheduled', data);
        });


        socket.on('schedule_race', (data) => {
            logMessage(`🔼 Schedule Race`);
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
            logMessage(`🔼 Play Callout Text`);
            lapTimerSocket.emit('play_callout_text', data);
        });

        socket.on('LED_solid', (data) => {
            logMessage(`🔼 LED Solid`);
            lapTimerSocket.emit('LED_solid', data);    
        });

        socket.on('LED_brightness', (data) => {
            logMessage(`🔼 LED Brightness`);
            lapTimerSocket.emit('LED_brightness', data);
        });

        socket.on('use_led_effect', (data) => {
            logMessage(`🔼 Use LED Effect`);
            lapTimerSocket.emit('use_led_effect', data);
        });

        socket.on('broadcast_message', (data) => {
            logMessage(`🔼 Broadcast Message`);
            broadcast_message.emit('LED_color', data);
        });


        // Lap Timer Socket Events
        lapTimerSocket.on('pi_time', (data) => {
            logMessage(`🔽 Pi Time`);
            socket.emit('pi_time', data);
        });

        lapTimerSocket.on('current_heat', (data) => {
            logMessage(`🔽 Current Heat`);
            socket.emit('current_heat', data);
        });

        lapTimerSocket.on('race_scheduled', (data) => {
            logMessage(`🔽 Race Scheduled`);
            socket.emit('race_scheduled', data);
        });

        lapTimerSocket.on('race_status', (data) => {
            logMessage(`🔽 Race Status`);
            socket.emit('race_status', data);
        });

        lapTimerSocket.on('prestage_ready', (data) => {
            logMessage(`🔽 Prestage Ready`);
            socket.emit('prestage_ready', data);
        });

        lapTimerSocket.on('stage_ready', (data) => {
            logMessage(`🔽 Stage Ready`);
            socket.emit('stage_ready', data);
        });

        lapTimerSocket.on('stop_timer', (data) => {
            logMessage(`🔽 Stop Timer`);
            socket.emit('stop_timer', data);
        });


        lapTimerSocket.on('current_laps', (data) => {
            logMessage(`🔽 Current Laps`);
            socket.emit('current_laps', data);
        });

        lapTimerSocket.on('race_list', (data) => {
            logMessage(`🔽 Race List`);
            socket.emit('race_list', data);
        });
        

        lapTimerSocket.on('leaderboard', (data) => {
            //logMessage(`🔽 Leaderboard: ${JSON.stringify(data)}`);
            logMessage(`🔽 Leaderboard`);
            leaderboard = data;
            socket.emit('leaderboard', data);
        });

        lapTimerSocket.on('pilot_data', (data) => {
            //logMessage(`🔽 Pilot Data: ${JSON.stringify(data)}`);
            logMessage(`🔽 Pilot Data`);
            pilot_data = data;
            socket.emit('pilot_data', data);
        });

        lapTimerSocket.on('heat_data', (data) => {
            //logMessage(`🔽 Heat Data: ${JSON.stringify(data)}`);
            logMessage(`🔽 Heat Data`);
            heat_data = data;
            socket.emit('heat_data', data);
        });
        
        lapTimerSocket.on('class_data', (data) => {
            //logMessage(`🔽 Class Data: ${JSON.stringify(data)}`);
            logMessage(`🔽 Class Data`);
            class_data = data;
            socket.emit('class_data', data);
        });

        lapTimerSocket.on('result_data', (data) => {
            //logMessage(`🔽 Result Data: ${JSON.stringify(data)}`);
            logMessage(`🔽 Result Data`);
            result_data = data;
            socket.emit('result_data', data);
        });

        lapTimerSocket.on('priority_message', (data) => {
            //logMessage(`🔽 Result Data: ${JSON.stringify(data)}`);
            logMessage(`🔽 Message`);
            socket.emit('priority_message', data);
        });

        /*
        lapTimerSocket.on('node_data', (data) => {
            logMessage(`node_data Data received: ${JSON.stringify(data)}`);
            node_data = data;
            socket.emit('node_data', data);
        });*/

        
        lapTimerSocket.on('frequency_data', (data) => {
            //logMessage(`🔽 Frequency Data: ${JSON.stringify(data)}`);
            logMessage(`🔽 Frequency Data`);
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

function sendPilotDataRequest(){
    pilotDataRequest(lapTimerSocket);
}


module.exports = { startRepeater, stopRepeater, getLocalIp, getLapTimerSocket, pilotDataRequest };