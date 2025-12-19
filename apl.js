// 🔑 SUPABASE CONFIG
const SUPABASE_URL = 'https://qqyabwiknxdypxcdoxev.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxeWFid2lrbnhkeXB4Y2RveGV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NjQ5MzIsImV4cCI6MjA4MTQ0MDkzMn0.HOXs3rh3Qs0JdgnI3O3hE6p4sBDRSGK_DrChgQiQUHE';
const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 📦 GAME STATE
const ROUNDS_PER_ROLL = 10;
const STORAGE_KEY = 'APP_PREDICTOR_STATE_V4_TerminatedPatterns';
let currentDigit = null, appPrediction = null, appExtraPrediction = null, currentRoll = 1, roundInRoll = 1, gameStartTime = null;
const history = [], recordedPatterns = [];

// 🛠️ UI ELEMENTS
const getEl = (id) => document.getElementById(id);

// 🔄 CORE LOGIC
const getGroup = (d) => d >= 5 ? 'B' : 'S';
const makeAppPrediction = () => currentDigit === null ? null : (currentDigit % 2 === 0 ? 'S' : 'B');
const makeAppExtraPrediction = () => {
    if (history.length < 3) return null;
    const sum = history.slice(-3).reduce((t, i) => t + i.userDigit, 0);
    return sum % 2 === 0 ? 'S' : 'B';
};

// ⌨️ INPUT CONTROL (NUMBER ONE DIGIT ONLY)
window.handleInput = function(e) {
    let v = e.target.value;
    if (v.length > 1) v = v.slice(-1);
    e.target.value = v;
    getEl('submit-button').disabled = !(v !== "" && v >= 0 && v <= 9);
};

window.checkEnter = function(e) {
    if (['e', '+', '-', '.'].includes(e.key)) e.preventDefault();
    if (e.key === 'Enter' && !getEl('submit-button').disabled) window.submitDigit();
};

window.submitDigit = function() {
    const input = getEl('next-digit-input');
    if (input.value !== "") {
        submitAnswer(parseInt(input.value));
        input.value = '';
        getEl('submit-button').disabled = true;
        input.focus();
    }
};

function submitAnswer(userDigit) {
    const targetGroup = getGroup(userDigit);
    history.push({
        userDigit, targetGroup, appPrediction, appExtraPrediction,
        rollNumber: currentRoll, roundInRoll: roundInRoll,
        isCorrect: appPrediction === targetGroup,
        isExtraCorrect: appExtraPrediction === targetGroup,
        timestamp: new Date().toLocaleTimeString()
    });
    currentDigit = userDigit;
    checkAndRecordPatterns();
    if (roundInRoll === ROUNDS_PER_ROLL) { currentRoll++; roundInRoll = 1; } else roundInRoll++;
    appPrediction = makeAppPrediction();
    appExtraPrediction = makeAppExtraPrediction();
    updateUI();
    saveGameState();
}

// 📊 UI UPDATES
function updateUI() {
    getEl('current-digit').textContent = currentDigit ?? '...';
    getEl('round-display').textContent = `Roll: ${currentRoll} | Stage: ${roundInRoll} / ${ROUNDS_PER_ROLL}`;
    getEl('app-prediction').textContent = appPrediction ?? '...';
    getEl('app-prediction').className = `text-2xl large-bubble ${appPrediction === 'B' ? 'neon-solid-b' : (appPrediction === 'S' ? 'neon-solid-s' : '')}`;
    getEl('app-extra-prediction').textContent = appExtraPrediction ?? '...';
    getEl('app-extra-prediction').className = `text-2xl large-bubble ${appExtraPrediction === 'B' ? 'neon-extra-b' : (appExtraPrediction === 'S' ? 'neon-extra-s' : '')}`;
    updateHistory();
    updatePatternRecordsUI();
    updatePatternWarningUI();
}

function updateHistory() {
    const container = getEl('history-log-container');
    container.innerHTML = '';
    const rolls = history.reduce((acc, item) => {
        if (!acc[item.rollNumber]) acc[item.rollNumber] = [];
        acc[item.rollNumber].push(item);
        return acc;
    }, {});
    Object.keys(rolls).forEach(r => {
        const div = document.createElement('div');
        div.className = 'flex-shrink-0 w-[200px] bg-gray-800 p-2 rounded-lg border border-gray-700';
        div.innerHTML = `<h3 class="text-red-400 font-bold text-center border-b border-red-600 mb-1">Roll ${r}</h3>`;
        rolls[r].forEach(i => {
            const pClass = i.appPrediction === 'B' ? 'neon-solid-b' : 'neon-solid-s';
            div.innerHTML += `<div class="flex justify-between text-[10px] mb-1"><span>S${i.roundInRoll}</span> <span class="history-bubble ${pClass}">${i.appPrediction}</span> <span>${i.isCorrect?'✅':'❌'}</span> <span class="text-yellow-300">${i.userDigit}</span></div>`;
        });
        container.appendChild(div);
    });
    container.scrollLeft = container.scrollWidth;
}

// 🔍 PATTERN LOGIC
function checkAndRecordPatterns() {
    const seq = history.slice(-20).map(i => i.targetGroup).join('');
    if (seq.length < 4) return;
    // Streak/Alt Logic...
}

function updatePatternRecordsUI() {
    const container = getEl('pattern-records-container');
    container.innerHTML = recordedPatterns.length ? '' : '<p class="text-center text-gray-500">မှတ်တမ်းမရှိသေးပါ။</p>';
}

function updatePatternWarningUI() {
    // Warning logic...
}

function saveGameState() { localStorage.setItem(STORAGE_KEY, JSON.stringify({ history, recordedPatterns, currentDigit, currentRoll, roundInRoll })); }

function loadGameState() {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!s) return false;
    history.push(...s.history);
    recordedPatterns.push(...(s.recordedPatterns || []));
    currentDigit = s.currentDigit; currentRoll = s.currentRoll; roundInRoll = s.roundInRoll;
    return true;
}

function initGame() {
    loadGameState();
    appPrediction = makeAppPrediction();
    appExtraPrediction = makeAppExtraPrediction();
    updateUI();
    getEl('datetime-display').textContent = new Date().toLocaleString();
    setInterval(() => getEl('datetime-display').textContent = new Date().toLocaleString(), 1000);
}

// Reset functions
window.showConfirmationModal = (msg, cb) => { getEl('confirmation-modal-message').textContent = msg; getEl('confirmation-modal-overlay').classList.remove('hidden'); getEl('modal-confirm-button').onclick = cb; };
window.closeConfirmationModal = () => getEl('confirmation-modal-overlay').classList.add('hidden');
window.handleConfirmedReset = () => { localStorage.removeItem(STORAGE_KEY); location.reload(); };

window.copyCSVToClipboard = () => alert("CSV Copy logic goes here.");
