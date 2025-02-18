document.addEventListener('DOMContentLoaded', async () => {
    const localIp = await window.api.getLocalIp();
    document.getElementById('local-ip').textContent = localIp;

    const savedIp = localStorage.getItem('lapTimerIp');
    const savedPort = localStorage.getItem('repeaterPort');

    if (savedIp) document.getElementById('lapTimerIp').value = savedIp;
    if (savedPort) document.getElementById('repeaterPort').value = savedPort;

    window.api.onLogMessage((message) => {
        logToConsole(message);
    });
});

function startRepeater() {
    const lapTimerIp = document.getElementById('lapTimerIp').value;
    const repeaterPort = document.getElementById('repeaterPort').value;

    if (!lapTimerIp || !repeaterPort) {
        alert("Enter a valid laptimer IP and Port number.");
        return;
    }

    localStorage.setItem('lapTimerIp', lapTimerIp);
    localStorage.setItem('repeaterPort', repeaterPort);

    window.api.startRepeater(lapTimerIp, parseInt(repeaterPort));
}

function stopRepeater() {
    window.api.stopRepeater();
}

function logToConsole(message) {
    const consoleDiv = document.getElementById('console');
    const entry = document.createElement('div');
    entry.classList.add('log-entry');
    entry.textContent = message;
    consoleDiv.appendChild(entry);
    consoleDiv.scrollTop = consoleDiv.scrollHeight;
}

function clearConsole() {
    document.getElementById('console').innerHTML = '';
}

function requestPilotData() {
    window.api.sendPilotDataRequest();
}

function pilotDataRequest(lapTimerSocket){
    data_dependencies = ['pilot_data'];
    lapTimerSocket.emit('load_data', {'load_types': data_dependencies});
    logMessage('Pilot data requested');
}