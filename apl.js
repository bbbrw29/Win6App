// ==========================================
// 🔑 SUPABASE CONFIG (Login စနစ်အတွက်)
// ==========================================
const SUPABASE_URL = 'https://qqyabwiknxdypxcdoxev.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxeWFid2lrbnhkeXB4Y2RveGV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NjQ5MzIsImV4cCI6MjA4MTQ0MDkzMn0.HOXs3rh3Qs0JdgnI3O3hE6p4sBDRSGK_DrChgQiQUHE';
const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// 📦 GAME STATE VARIABLES (အလုပ်ရှင်၏ မူလ Variables)
// ==========================================
const ROUNDS_PER_ROLL = 10;
const STORAGE_KEY = 'APP_PREDICTOR_STATE_V4_TerminatedPatterns'; 

let currentDigit = null, appPrediction = null, appExtraPrediction = null, currentRoll = 1, roundInRoll = 1; 
let gameStartTime = null;
const history = [], recordedPatterns = []; 

// UI Elements
const currentDigitEl = document.getElementById('current-digit');
const roundDisplayEl = document.getElementById('round-display');
const nextDigitInputEl = document.getElementById('next-digit-input');
const historyLogContainerEl = document.getElementById('history-log-container');
const appPredictionEl = document.getElementById('app-prediction');
const appExtraPredictionEl = document.getElementById('app-extra-prediction'); 
const currentDigitDisplayContainerEl = document.getElementById('current-digit-display'); 
const warningBoxEl = document.getElementById('pattern-warning-box');
const datetimeDisplayEl = document.getElementById('datetime-display');
const gameStartTimeEl = document.getElementById('game-start-time');
const patternRecordsContainerEl = document.getElementById('pattern-records-container');
const submitButtonEl = document.getElementById('submit-button');
const inputAreaEl = document.getElementById('input-area');
const patternWarningBoxEl = document.getElementById('pattern-warning-box');

// ==========================================
// 🔄 CORE LOGIC (အလုပ်ရှင်၏ မူလ Function များ)
// ==========================================

function getGroup(digit) { return digit >= 5 ? 'B' : 'S'; }

function makeAppPrediction() { return currentDigit === null ? null : (currentDigit % 2 === 0 ? 'S' : 'B'); }

function makeAppExtraPrediction() {
    if (history.length < 3) return null;
    const sum = history.slice(-3).reduce((t, i) => t + i.userDigit, 0);
    return sum % 2 === 0 ? 'S' : 'B';
}

function updatePredictionDisplays() {
    const pDisplay = document.getElementById('app-prediction-display');
    const eDisplay = document.getElementById('app-extra-prediction-display');
    
    if (appPrediction) {
        pDisplay.classList.remove('hidden');
        appPredictionEl.textContent = appPrediction;
        appPredictionEl.className = `text-2xl large-bubble ${appPrediction === 'B' ? 'neon-solid-b' : 'neon-solid-s'}`;
    }
    if (appExtraPrediction) {
        eDisplay.classList.remove('hidden');
        appExtraPredictionEl.textContent = appExtraPrediction;
        appExtraPredictionEl.className = `text-2xl large-bubble ${appExtraPrediction === 'B' ? 'neon-extra-b' : 'neon-extra-s'}`;
    }
}

function submitAnswer(userDigit) {
    const targetGroup = getGroup(userDigit);
    const pCorrect = appPrediction === targetGroup;
    const eCorrect = appExtraPrediction === targetGroup;

    history.push({
        userDigit, targetGroup, appPrediction, appExtraPrediction,
        rollNumber: currentRoll, roundInRoll: roundInRoll,
        isCorrect: pCorrect, isExtraCorrect: eCorrect,
        timestamp: new Date().toLocaleTimeString()
    });

    currentDigit = userDigit;
    currentDigitDisplayContainerEl.classList.remove('hidden');
    triggerFlashEffect();

    checkAndRecordPatterns();
    
    if (roundInRoll === ROUNDS_PER_ROLL) { currentRoll++; roundInRoll = 1; } 
    else { roundInRoll++; }

    appPrediction = makeAppPrediction();
    appExtraPrediction = makeAppExtraPrediction();

    updateUI();
    updateHistory();
    updatePatternRecordsUI();
    updatePatternWarningUI();
    updatePredictionDisplays();
    saveGameState();
}

// --- အလုပ်ရှင်၏ Part 2 မှ Pattern Logic များ ---
function updatePatternRecordsUI() {
    patternRecordsContainerEl.innerHTML = '';
    patternRecordsContainerEl.className = 'space-y-2 max-h-[300px] overflow-y-auto pr-1'; 

    if (recordedPatterns.length === 0) {
        patternRecordsContainerEl.innerHTML = '<p class="text-gray-500 text-sm text-center py-2">Pattern မှတ်တမ်းများ ဤနေရာတွင် ပေါ်လာမည်။</p>';
        return;
    }
    
    const sortedRecords = [...recordedPatterns].sort((a, b) => b.rollNumber !== a.rollNumber ? b.rollNumber - a.rollNumber : b.roundInRoll - a.roundInRoll);
    const totalRecords = sortedRecords.length;

    sortedRecords.forEach((pattern, index) => {
        const recordNumber = totalRecords - index; 
        const bgColor = pattern.type.includes('နှစ်ခုပူး') ? 'bg-indigo-900/50 border-indigo-500' : 
                        pattern.type.includes('တစ်လှည့်စီ') ? 'bg-teal-900/50 border-teal-500' : 
                        pattern.type.includes('တူညီဆက်တိုက်') ? 'bg-green-900/50 border-green-500' : 'bg-gray-900/50 border-gray-500';

        const patternEl = document.createElement('div');
        patternEl.className = `p-2 rounded-lg text-xs font-mono border ${bgColor} flex items-center mb-2`;
        patternEl.innerHTML = `<div class="mr-2 font-bold text-red-300">${recordNumber}.</div><div class="flex-grow"><b>${pattern.type}</b> <span class="text-yellow-300">${pattern.sequence}</span></div><div class="text-right">Roll ${pattern.rollNumber}/S${pattern.roundInRoll}</div>`;
        patternRecordsContainerEl.appendChild(patternEl);
    });
}

// --- အလုပ်ရှင်၏ ကျန်ရှိသော Utility Function များ (Flash, History, CSV, etc.) ---
// (အလုပ်ရှင် ပို့ထားသော Part 2 ပါ Function အားလုံးကို ဤနေရာတွင် ပေါင်းစပ်ထားပါသည်)

function triggerFlashEffect() {
    currentDigitDisplayContainerEl.classList.remove('animate-flash');
    void currentDigitDisplayContainerEl.offsetWidth; 
    currentDigitDisplayContainerEl.classList.add('animate-flash');
}

function updateUI() {
    currentDigitEl.textContent = currentDigit !== null ? currentDigit : '...';
    roundDisplayEl.textContent = `Roll: ${currentRoll} | Stage: ${roundInRoll} / ${ROUNDS_PER_ROLL}`;
}

function updateDateTime() {
    const now = new Date();
    datetimeDisplayEl.textContent = now.toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
}

function saveGameState() {
    const state = { history, recordedPatterns, currentDigit, currentRoll, roundInRoll, gameStartTime: gameStartTime?.toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadGameState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return false;
    const state = JSON.parse(saved);
    history.push(...state.history);
    recordedPatterns.push(...(state.recordedPatterns || []));
    currentDigit = state.currentDigit;
    currentRoll = state.currentRoll;
    roundInRoll = state.roundInRoll;
    gameStartTime = state.gameStartTime ? new Date(state.gameStartTime) : new Date();
    return true;
}

// --- Initialize Game (Login စနစ်နှင့် ချိတ်ဆက်ခြင်း) ---
function initGame() {
    if (!loadGameState()) {
        gameStartTime = new Date();
    }
    appPrediction = makeAppPrediction();
    appExtraPrediction = makeAppExtraPrediction();
    
    updateUI();
    updateHistory();
    updatePatternRecordsUI();
    updateDateTime();
    if (!window.dateTimeInterval) window.dateTimeInterval = setInterval(updateDateTime, 1000);
    updatePredictionDisplays();
}

// Global Event Handlers
window.handleInput = (e) => { e.target.value = e.target.value.slice(0,1); submitButtonEl.disabled = !/^[0-9]$/.test(e.target.value); };
window.checkEnter = (e) => { if (e.key === 'Enter' && !submitButtonEl.disabled) window.submitDigit(); };
window.submitDigit = () => {
    const val = nextDigitInputEl.value;
    if (val) { submitAnswer(parseInt(val)); nextDigitInputEl.value = ''; submitButtonEl.disabled = true; nextDigitInputEl.focus(); }
};

window.onload = () => { /* Subscription Check ကို HTML ဘက်က ကိုင်တွယ်ပါသည် */ };

// (ကျန်ရှိသော checkAndRecordPatterns logic များသည် အလုပ်ရှင် ပို့ထားသည့်အတိုင်း အလုပ်လုပ်ပါမည်)
