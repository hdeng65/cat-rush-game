// Anonymous session management — persists a session ID in localStorage.

function getSessionId() {
    let sessionId = localStorage.getItem('catRushSessionId');
    if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem('catRushSessionId', sessionId);
    }
    return sessionId;
}

function getStoredPlayerName() {
    return localStorage.getItem('catRushPlayerName') || '';
}

function setStoredPlayerName(name) {
    localStorage.setItem('catRushPlayerName', name);
}
