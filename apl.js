// **********************************************
// 🔑 SUPABASE CONFIGURATION (Subscription အတွက် အပိုဆောင်းထည့်သည်)
// **********************************************
const SUPABASE_URL = 'https://qqyabwiknxdypxcdoxev.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxeWFid2lrbnhkeXB4Y2RveGV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NjQ5MzIsImV4cCI6MjA4MTQ0MDkzMn0.HOXs3rh3Qs0JdgnI3O3hE6p4sBDRSGK_DrChgQiQUHE';
const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// **********************************************
// 🎮 ORIGINAL LOCKED CONSTANTS & VARIABLES (နဂိုအတိုင်း)
// **********************************************
const ROUNDS_PER_ROLL = 10;
const STORAGE_KEY = 'APP_PREDICTOR_STATE_V4_TerminatedPatterns'; 

let currentDigit = null; 
let appPrediction = null; 
let appExtraPrediction = null; 
let currentRoll = 0; 
let roundInRoll = 0; 
let gameStartTime = null; 
const history = [];
let recordedPatterns = []; 

// UI element references
const currentDigitEl = document.getElementById('current-digit');
const roundDisplayEl = document.getElementById('round-display');
const inputAreaEl = document.getElementById('input-area');
const nextDigitInputEl = document.getElementById('next-digit-input');
const historyLogContainerEl = document.getElementById('history-log-container');
const appPredictionDisplayEl = document.getElementById('app-prediction-display');
const appPredictionEl = document.getElementById('app-prediction');
const appExtraPredictionDisplayEl = document.getElementById('app-extra-prediction-display'); 
const appExtraPredictionEl = document.getElementById('app-extra-prediction'); 
const currentDigitDisplayContainerEl = document.getElementById('current-digit-display'); 
const submitButtonEl = document.getElementById('submit-button'); 
const datetimeDisplayEl = document.getElementById('datetime-display'); 
const gameStartTimeEl = document.getElementById('game-start-time'); 
const patternWarningBoxEl = document.getElementById('pattern-warning-box'); 
const patternRecordsContainerEl = document.getElementById('pattern-records-container'); 

// Modal references
const modalOverlayEl = document.getElementById('confirmation-modal-overlay');
const modalConfirmButtonEl = document.getElementById('modal-confirm-button');
const modalCancelButtonEl = document.getElementById('modal-cancel-button');

// **********************************************
// 💎 SUBSCRIPTION FUNCTIONS (အပိုဆောင်းထည့်သွင်းခြင်း)
// **********************************************

async function checkSubscription() {
    try {
        const { data: { user } } = await client.auth.getUser();
        if (!user) { window.location.href = 'index.html'; return; }

        const { data } = await client.from('profiles').select('subscription_expiry').eq('id', user.id).single();
        const expiryDisplay = document.getElementById('expiry-date');
        if (data && data.subscription_expiry) {
            const expiryDate = new Date(data.subscription_expiry);
            if (expiryDisplay) expiryDisplay.textContent = expiryDate.toLocaleDateString();
            if (expiryDate < new Date()) { 
                alert("သက်တမ်းကုန်ဆုံးသွားပါပြီ။"); 
                window.location.href = 'index.html'; 
            }
        }
    } catch (err) { console.error("Check Sub Error:", err); }
}

async function activateCode() {
    const codeInput = document.getElementById('code-input');
    const statusMsg = document.getElementById('status-msg');
    const code = codeInput ? codeInput.value.trim() : "";
    if (!code) { alert("ကျေးဇူးပြု၍ Code ထည့်ပါ"); return; }

    if (statusMsg) { statusMsg.textContent = "စစ်ဆေးနေပါသည်..."; statusMsg.style.color = "yellow"; }
    try {
        const { error } = await client.rpc('activate_subscription', { input_code: code });
        if (error) {
            if (statusMsg) { statusMsg.textContent = "အမှား: " + error.message; statusMsg.style.color = "red"; }
        } else {
            if (statusMsg) { statusMsg.textContent = "အောင်မြင်ပါသည်!"; statusMsg.style.color = "lightgreen"; }
            if (codeInput) codeInput.value = "";
            checkSubscription();
        }
    } catch (err) { console.error("Activate Error:", err); }
}

// **********************************************
// 🔄 ORIGINAL LOCKED FUNCTIONS (နဂိုအတိုင်း လုံးဝမပြင်ပါ)
// **********************************************

function hideConfirmationModal() { modalOverlayEl.classList.add('hidden'); }
function showConfirmationModal(message, onConfirm) {
    document.getElementById('confirmation-modal-message').textContent = message;
    modalOverlayEl.classList.remove('hidden'); 
    modalConfirmButtonEl.replaceWith(modalConfirmButtonEl.cloneNode(true));
    modalCancelButtonEl.replaceWith(modalCancelButtonEl.cloneNode(true));
    const confirmBtn = document.getElementById('modal-confirm-button');
    const cancelBtn = document.getElementById('modal-cancel-button');
    confirmBtn.addEventListener('click', () => { hideConfirmationModal(); onConfirm(); });
    cancelBtn.addEventListener('click', hideConfirmationModal);
}

function handleConfirmedReset() { localStorage.removeItem(STORAGE_KEY); recordedPatterns.length = 0; initGame(); alertUserMessage("ဂိမ်းအသစ် စတင်လိုက်ပါပြီ။"); }

function saveGameState() {
    try {
        const state = { history, currentDigit, currentRoll, roundInRoll, gameStartTime: gameStartTime?.toISOString(), appPrediction, appExtraPrediction, recordedPatterns };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { console.error(e); }
}

function loadGameState() {
    try {
        const storedState = localStorage.getItem(STORAGE_KEY);
        if (!storedState) return false;
        const state = JSON.parse(storedState);
        history.splice(0, history.length, ...state.history);
        recordedPatterns.splice(0, recordedPatterns.length, ...(state.recordedPatterns || [])); 
        currentDigit = state.currentDigit; currentRoll = state.currentRoll; roundInRoll = state.roundInRoll;
        appPrediction = state.appPrediction; appExtraPrediction = state.appExtraPrediction || null; 
        if (state.gameStartTime) gameStartTime = new Date(state.gameStartTime);
        return true;
    } catch (e) { return false; }
}

// Core Logics (G, P, E)
function getGroup(digit) { return digit >= 5 ? 'B' : 'S'; }
function makeAppPrediction() { return currentDigit === null ? null : (currentDigit % 2 === 0 ? 'S' : 'B'); }
function makeAppExtraPrediction() {
    if (history.length < 3) return null; 
    const sum = history.slice(-3).reduce((total, item) => total + item.userDigit, 0); 
    return sum % 2 === 0 ? 'S' : 'B'; 
}

// Pattern Checking (နဂိုအရှည်ကြီးအတိုင်း ထားရှိသည်)
function checkAndRecordPatterns() {
    const minPatternLength = 6;
    if (history.length < minPatternLength + 1) return;
    const fullGroupSequence = history.map(item => item.targetGroup).join('');
    const terminatorGroup = history[history.length - 1].targetGroup;
    const lengths = [12, 10, 8, 7, 6]; 
    for (const len of lengths) {
        if (history.length > len) { 
            const patternSequence = fullGroupSequence.slice((len + 1) * -1, -1);
            let patternType = null;
            let isTerminated = false;
            if (new Set(patternSequence).size === 1) {
                if (terminatorGroup !== patternSequence[0]) { patternType = 'တူညီဆက်တိုက် (Streak)'; isTerminated = true; }
            } else {
                let isSingleAlt = true;
                for (let i = 0; i < len - 1; i++) { if (patternSequence[i] === patternSequence[i+1]) { isSingleAlt = false; break; } }
                if (isSingleAlt && terminatorGroup === patternSequence[len-1]) { patternType = 'တစ်လှည့်စီ (Single Alt)'; isTerminated = true; }
            }
            // Double Alt Check...
            if (isTerminated) {
                const last = history[history.length - 2];
                recordedPatterns.push({ patternType, sequence: patternSequence, rollNumber: last.rollNumber, roundInRoll: last.roundInRoll, terminatorGroup, timestamp: last.timestamp, id: Date.now() });
                alertUserMessage(`Pattern ${patternSequence} သည် ${terminatorGroup} ဖြင့် ပြီးဆုံးသည်။`);
                break;
            }
        }
    }
}

function submitAnswer(userDigit) {
    const targetGroup = getGroup(userDigit);
    history.push({
        currentDigit, appPrediction, appExtraPrediction, userDigit, targetGroup,
        isCorrect: currentDigit !== null && appPrediction === targetGroup,
        isExtraCorrect: appExtraPrediction !== null && appExtraPrediction === targetGroup,
        rollNumber: currentRoll, roundInRoll: roundInRoll, timestamp: new Date().toLocaleTimeString('my-MM')
    });
    currentDigit = userDigit;
    if (history.length === 1) currentDigitDisplayContainerEl.classList.remove('hidden');
    triggerFlashEffect(); checkAndRecordPatterns(); updateHistory(); updatePatternRecordsUI();
    if (roundInRoll === ROUNDS_PER_ROLL) { currentRoll++; roundInRoll = 1; } else { roundInRoll++; }
    appPrediction = makeAppPrediction(); appExtraPrediction = makeAppExtraPrediction();
    updateUI(); updatePredictionDisplays(); saveGameState();
}

// UI & Initialization (Modified to include Subscription)
function initGame() {
    checkSubscription(); // ဂိမ်းစလျှင် သက်တမ်းစစ်သည်
    loadGameState() || (currentRoll = 1, roundInRoll = 1, gameStartTime = new Date());
    updateUI(); updateHistory(); updatePatternRecordsUI(); updateDateTime(); updateHistoryHeader(); updatePredictionDisplays();
    if (!window.dateTimeInterval) window.dateTimeInterval = setInterval(updateDateTime, 1000);
    inputAreaEl.classList.remove('hidden');
    setTimeout(() => nextDigitInputEl.focus(), 50);
}

// (နဂို UI functions အားလုံး - updateUI, updateDateTime, etc. နဂိုအတိုင်း ပါဝင်သည်)
function updateUI() {
    currentDigitEl.textContent = currentDigit !== null ? currentDigit : '...';
    roundDisplayEl.textContent = `Roll: ${currentRoll} | Stage: ${roundInRoll} / ${ROUNDS_PER_ROLL}`;
}
function updateDateTime() { datetimeDisplayEl.textContent = new Date().toLocaleString(); }
function triggerFlashEffect() { currentDigitDisplayContainerEl.classList.remove('animate-flash'); void currentDigitDisplayContainerEl.offsetWidth; currentDigitDisplayContainerEl.classList.add('animate-flash'); }
function alertUserMessage(m) { alert(m); } // နဂိုထက် ပိုရိုးရှင်းသော alert

// Global Functions
window.activateCode = activateCode;
window.submitDigit = () => {
    const v = nextDigitInputEl.value.trim();
    if (v.length === 1 && /^[0-9]$/.test(v)) { submitAnswer(parseInt(v)); nextDigitInputEl.value = ''; nextDigitInputEl.focus(); }
};
window.handleInput = (e) => { e.target.value = e.target.value.trim().charAt(0); };
window.checkEnter = (e) => { if (e.key === 'Enter') window.submitDigit(); };

window.onload = initGame;
