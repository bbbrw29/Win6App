// **********************************************
// 🔑 SUPABASE & CONFIG
// **********************************************
const SUPABASE_URL = 'https://qqyabwiknxdypxcdoxev.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxeWFid2lrbnhkeXB4Y2RveGV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NjQ5MzIsImV4cCI6MjA4MTQ0MDkzMn0.HOXs3rh3Qs0JdgnI3O3hE6p4sBDRSGK_DrChgQiQUHE';
const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ROUNDS_PER_ROLL = 10;
const STORAGE_KEY = 'APP_PREDICTOR_STATE_V4_TerminatedPatterns'; 

let currentDigit = null, appPrediction = null, appExtraPrediction = null, currentRoll = 1, roundInRoll = 1; 
const history = [], recordedPatterns = []; 

// UI Element References
const currentDigitEl = document.getElementById('current-digit');
const roundDisplayEl = document.getElementById('round-display');
const nextDigitInputEl = document.getElementById('next-digit-input');
const historyLogContainerEl = document.getElementById('history-log-container');
const appPredictionEl = document.getElementById('app-prediction');
const appExtraPredictionEl = document.getElementById('app-extra-prediction'); 
const currentDigitDisplayContainerEl = document.getElementById('current-digit-display'); 
const warningBoxEl = document.getElementById('pattern-warning-box');

// **********************************************
// 🔄 CORE FUNCTIONS (အရင် App အတိုင်း ၁၀၀% တူသည်)
// **********************************************

// ၁။ Group ခွဲခြင်း (B/S)
function getGroup(digit) { return digit >= 5 ? 'B' : 'S'; }

// ၂။ Prediction တွက်ခြင်း (အရင်က Formula အတိုင်း)
function makeAppPrediction() { return currentDigit === null ? null : (currentDigit % 2 === 0 ? 'S' : 'B'); }
function makeAppExtraPrediction() {
    if (history.length < 3) return null;
    const sum = history.slice(-3).reduce((t, i) => t + i.userDigit, 0);
    return sum % 2 === 0 ? 'S' : 'B';
}

// ၃။ Pattern စစ်ဆေးခြင်း (Streak နှင့် Alt Pattern များ)
function checkAndRecordPatterns() {
    if (history.length < 7) return;
    const fullSeq = history.map(i => i.targetGroup).join('');
    const term = history[history.length - 1].targetGroup;
    const lengths = [12, 10, 8, 7, 6]; 

    for (const len of lengths) {
        if (history.length > len) { 
            const patt = fullSeq.slice((len + 1) * -1, -1);
            let type = null, isTerm = false;
            
            // Streak Check
            if (new Set(patt).size === 1 && term !== patt[0]) {
                type = 'တူညီဆက်တိုက် (Streak)'; isTerm = true;
            } 
            // Single Alt Check
            else {
                let isAlt = true;
                for (let i = 0; i < len - 1; i++) { if (patt[i] === patt[i+1]) { isAlt = false; break; } }
                if (isAlt && term === patt[len-1]) { type = 'တစ်လှည့်စီ (Single Alt)'; isTerm = true; }
            }

            if (isTerm) {
                recordedPatterns.push({ type, sequence: patt, roll: currentRoll, stage: roundInRoll, term });
                if (warningBoxEl) {
                    warningBoxEl.innerText = `🚨 ${type}: ${patt} ပြီးဆုံး။`;
                    warningBoxEl.style.display = 'block';
                }
                alert(`Pattern ${patt} ပြီးဆုံးသွားပါပြီ။`);
                break;
            }
        }
    }
}

// ၄။ Answer Submit လုပ်ခြင်း
function submitAnswer(userDigit) {
    const targetGroup = getGroup(userDigit);
    history.push({
        userDigit, targetGroup, appPrediction, appExtraPrediction,
        rollNumber: currentRoll, roundInRoll: roundInRoll,
        isCorrect: appPrediction === targetGroup
    });

    currentDigit = userDigit;
    if (currentDigitDisplayContainerEl) currentDigitDisplayContainerEl.classList.remove('hidden');
    
    checkAndRecordPatterns();
    updateHistory(); 
    
    // Roll & Stage Update
    if (roundInRoll === ROUNDS_PER_ROLL) { currentRoll++; roundInRoll = 1; } else { roundInRoll++; }
    
    appPrediction = makeAppPrediction(); 
    appExtraPrediction = makeAppExtraPrediction();
    
    updateUI(); 
    saveGameState();
}

// **********************************************
// 💾 UI & STATE MANAGEMENT
// **********************************************
function updateUI() {
    if (currentDigitEl) currentDigitEl.textContent = currentDigit ?? '...';
    if (roundDisplayEl) roundDisplayEl.textContent = `Roll: ${currentRoll} | Stage: ${roundInRoll} / ${ROUNDS_PER_ROLL}`;
    if (appPredictionEl) appPredictionEl.textContent = appPrediction ?? '...';
    if (appExtraPredictionEl) appExtraPredictionEl.textContent = appExtraPrediction ?? '...';
}

function updateHistory() {
    if (!historyLogContainerEl) return;
    historyLogContainerEl.innerHTML = history.slice().reverse().map(e => `
        <div class="history-item" style="display:flex; justify-content:space-between; padding:8px; border-bottom:1px solid #334; font-size:12px;">
            <span>R${e.rollNumber}-S${e.roundInRoll}</span>
            <span>Digit: ${e.userDigit} (${e.targetGroup})</span>
            <span style="color:${e.isCorrect ? '#4ade80' : '#ef4444'}">Pred: ${e.appPrediction}</span>
        </div>
    `).join('');
}

function saveGameState() { localStorage.setItem(STORAGE_KEY, JSON.stringify({ history, currentDigit, currentRoll, roundInRoll })); }

function loadGameState() {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!s) return false;
    history.length = 0; history.push(...s.history); 
    currentDigit = s.currentDigit; currentRoll = s.currentRoll; roundInRoll = s.roundInRoll;
    return true;
}

// **********************************************
// 🚀 INITIALIZATION
// **********************************************
window.initGame = () => {
    loadGameState();
    appPrediction = makeAppPrediction();
    appExtraPrediction = makeAppExtraPrediction();
    updateUI();
    updateHistory();
};

window.submitDigit = () => {
    const v = nextDigitInputEl.value.trim();
    if (/^[0-9]$/.test(v)) { submitAnswer(parseInt(v)); nextDigitInputEl.value = ''; nextDigitInputEl.focus(); }
};
window.handleInput = (e) => { e.target.value = e.target.value.charAt(0); };
window.checkEnter = (e) => { if (e.key === 'Enter') window.submitDigit(); };
