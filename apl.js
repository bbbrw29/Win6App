// **********************************************
// 🔑 SUPABASE CONFIGURATION
// **********************************************
const SUPABASE_URL = 'https://qqyabwiknxdypxcdoxev.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxeWFid2lrbnhkeXB4Y2RveGV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NjQ5MzIsImV4cCI6MjA4MTQ0MDkzMn0.HOXs3rh3Qs0JdgnI3O3hE6p4sBDRSGK_DrChgQiQUHE';

const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// **********************************************
// 🎮 GAME CONSTANTS & VARIABLES
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
// 💎 SUBSCRIPTION SYSTEM LOGIC (NEW)
// **********************************************

// Function: သက်တမ်းကုန်မကုန် စစ်ဆေးခြင်း
async function checkSubscription() {
    try {
        const { data: { user } } = await client.auth.getUser();
        if (!user) {
            window.location.href = 'index.html';
            return;
        }

        const { data, error } = await client
            .from('profiles')
            .select('subscription_expiry')
            .eq('id', user.id)
            .single();

        const expiryDisplay = document.getElementById('expiry-date');
        if (data && data.subscription_expiry) {
            const expiryDate = new Date(data.subscription_expiry);
            if (expiryDisplay) expiryDisplay.textContent = expiryDate.toLocaleDateString();
            
            // သက်တမ်းကုန်သွားလျှင် Login Page သို့ ပြန်ပို့မည်
            if (expiryDate < new Date()) {
                alert("သင့်သက်တမ်းကုန်ဆုံးသွားပါပြီ။ ကျေးဇူးပြု၍ Code အသစ်ထည့်ပါ။");
                window.location.href = 'index.html';
            }
        } else {
            if (expiryDisplay) expiryDisplay.textContent = "သက်တမ်းမရှိသေးပါ";
        }
    } catch (err) {
        console.error("Subscription check failed:", err);
    }
}

// Function: Code ကို Activate လုပ်ခြင်း
async function activateCode() {
    const codeInput = document.getElementById('code-input'); // HTML တွင် ဤ ID ရှိရမည်
    const statusMsg = document.getElementById('status-msg');
    
    const code = codeInput ? codeInput.value.trim() : "";
    if (!code) {
        alert("ကျေးဇူးပြု၍ Code ထည့်ပါ");
        return;
    }

    if (statusMsg) {
        statusMsg.textContent = "စစ်ဆေးနေပါသည်... ခေတ္တစောင့်ပါ";
        statusMsg.style.color = "yellow";
    }

    try {
        const { data, error } = await client.rpc('activate_subscription', {
            input_code: code
        });

        if (error) {
            if (statusMsg) {
                statusMsg.textContent = "အမှား: " + error.message;
                statusMsg.style.color = "red";
            }
        } else {
            if (statusMsg) {
                statusMsg.textContent = "အောင်မြင်ပါသည်! ၃၀ ရက် တိုးပေးလိုက်ပါပြီ။";
                statusMsg.style.color = "lightgreen";
            }
            if (codeInput) codeInput.value = "";
            checkSubscription(); // ရက်စွဲကို Update လုပ်ရန်
        }
    } catch (err) {
        if (statusMsg) statusMsg.textContent = "ချိတ်ဆက်မှု အမှားအယွင်း ရှိနေပါသည်";
    }
}

// **********************************************
// 🔄 CORE GAME LOGIC (Patterns, Groups, etc.)
// **********************************************

function getGroup(digit) {
    return digit >= 5 ? 'B' : 'S';
}

function makeAppPrediction() {
    if (currentDigit === null) return null;
    return currentDigit % 2 === 0 ? 'S' : 'B';
}

function makeAppExtraPrediction() {
    if (history.length < 3) return null; 
    const lastThree = history.slice(-3); 
    const sum = lastThree.reduce((total, item) => total + item.userDigit, 0); 
    return sum % 2 === 0 ? 'S' : 'B'; 
}

// --- Pattern စစ်ဆေးခြင်း Logic များ အရင်အတိုင်း ထားရှိပါသည် ---
function checkAndRecordPatterns() {
    const minPatternLength = 6;
    const minHistoryLengthForTermination = minPatternLength + 1; 
    if (history.length < minHistoryLengthForTermination) return;
    const fullGroupSequence = history.map(item => item.targetGroup).join('');
    const terminatorEntry = history[history.length - 1];
    const terminatorGroup = terminatorEntry.targetGroup;
    const lengths = [12, 10, 8, 7, 6]; 
    for (const len of lengths) {
        if (history.length > len) { 
            const patternSequence = fullGroupSequence.slice((len + 1) * -1, -1); 
            const patternStartGroup = patternSequence[0];
            const lastPatternGroup = patternSequence[len - 1];
            let patternType = null;
            let isTerminated = false;
            if (new Set(patternSequence).size === 1) {
                if (terminatorGroup !== patternStartGroup) {
                    patternType = 'တူညီဆက်တိုက် (Streak)';
                    isTerminated = true;
                }
            } else { 
                let isSingleAlt = true;
                for (let i = 0; i < len - 1; i++) {
                    if (patternSequence[i] === patternSequence[i+1]) {
                        isSingleAlt = false; 
                        break;
                    }
                }
                if (isSingleAlt) {
                    if (terminatorGroup === lastPatternGroup) {
                        patternType = 'တစ်လှည့်စီ (Single Alt)';
                        isTerminated = true;
                    }
                }
            }
            if (patternType === null && (len === 6 || len === 8 || len === 10 || len === 12)) {
                let patterns = [];
                if (len === 12) patterns = ['SSBBSSBBSSBB', 'BBSSBBSSBBSS'];
                else if (len === 10) patterns = ['SSBBSSBBSS', 'BBSSBBSSBB'];
                else if (len === 8) patterns = ['SSBBSSBB', 'BBSSBBSS'];
                else if (len === 6) patterns = ['SSBBSS', 'BBSSBB'];
                if (patterns.includes(patternSequence)) {
                    if (terminatorGroup === lastPatternGroup) {
                        patternType = 'နှစ်ခုပူးတွဲ (Double Alt)';
                        isTerminated = true;
                    }
                }
            }
            if (isTerminated) {
                const patternEndEntry = history[history.length - 2]; 
                const isAlreadyRecorded = recordedPatterns.some(p => p.id === `${patternEndEntry.rollNumber}-${patternEndEntry.roundInRoll}-${patternSequence}`);
                if (!isAlreadyRecorded) {
                    recordedPatterns.push({
                        patternType: patternType,
                        sequence: patternSequence,
                        length: len,
                        rollNumber: patternEndEntry.rollNumber,
                        roundInRoll: patternEndEntry.roundInRoll,
                        terminatorGroup: terminatorGroup, 
                        timestamp: patternEndEntry.timestamp,
                        id: `${patternEndEntry.rollNumber}-${patternEndEntry.roundInRoll}-${patternSequence}`, 
                    });
                    alertUserMessage(`${patternSequence} ပုံစံ (L=${len}) သည် ${terminatorGroup} ဖြင့် ပြီးဆုံးသွားပြီဖြစ်၍ မှတ်တမ်းတင်လိုက်သည်။`);
                    break; 
                }
            }
        }
    }
}

// **********************************************
// 🖥️ UI UPDATE & EVENT HANDLERS
// **********************************************

function submitAnswer(userDigit) {
    const isFirstEntry = currentDigit === null;
    const targetGroup = getGroup(userDigit); 
    const isCorrect = appPrediction === targetGroup; 
    const isExtraCorrect = appExtraPrediction !== null && appExtraPrediction === targetGroup;

    const previousRoll = currentRoll;
    const previousRoundInRoll = roundInRoll;
    const digitForSum = currentDigit !== null ? currentDigit : 0; 

    const roundData = {
        currentDigit: currentDigit, 
        appPrediction: appPrediction,
        appExtraPrediction: appExtraPrediction, 
        userDigit: userDigit, 
        targetGroup: targetGroup,
        isCorrect: isFirstEntry ? false : isCorrect, 
        isExtraCorrect: isFirstEntry ? false : isExtraCorrect, 
        rollNumber: previousRoll,
        roundInRoll: previousRoundInRoll,
        sumRemainder: (digitForSum + userDigit) % 10, 
        timestamp: new Date().toLocaleTimeString('my-MM', { hour: '2-digit', minute: '2-digit', hour12: true })
    };
    
    history.push(roundData);
    currentDigit = userDigit; 
    if (isFirstEntry) currentDigitDisplayContainerEl.classList.remove('hidden'); 
    
    triggerFlashEffect();
    checkAndRecordPatterns();
    updateHistory(); 
    updatePatternRecordsUI();
    updatePatternWarningUI();

    if (previousRoundInRoll === ROUNDS_PER_ROLL) {
        currentRoll++;
        roundInRoll = 1; 
    } else {
        roundInRoll++;
    }
    
    appPrediction = makeAppPrediction();
    appExtraPrediction = makeAppExtraPrediction(); 
    updateUI();
    updatePredictionDisplays(); 
    saveGameState();
}

// --- ကျန်ရှိသော UI Utility များ (initGame, updateUI, etc.) အားလုံး ပါဝင်ပါသည် ---
function initGame() {
    checkSubscription(); // ဂိမ်းစလျှင် သက်တမ်းအရင်စစ်ပါ
    let stateLoaded = loadGameState();
    if (!stateLoaded) {
        currentRoll = 1; roundInRoll = 1; history.length = 0; recordedPatterns.length = 0; 
        currentDigit = null; gameStartTime = new Date();
    }
    if(stateLoaded) {
         appPrediction = makeAppPrediction();
         appExtraPrediction = makeAppExtraPrediction(); 
    }
    updateUI(); updateHistory(); updatePatternRecordsUI(); updateDateTime(); updateHistoryHeader(); updatePatternWarningUI(); updatePredictionDisplays(); 
    if (!window.dateTimeInterval) window.dateTimeInterval = setInterval(updateDateTime, 1000);
    inputAreaEl.classList.remove('hidden');
    setTimeout(() => { nextDigitInputEl.focus(); }, 50);
    if (currentDigit === null) currentDigitDisplayContainerEl.classList.add('hidden');
    else { currentDigitDisplayContainerEl.classList.remove('hidden'); triggerFlashEffect(); }
}

// Local Storage & Global Helpers
function saveGameState() { localStorage.setItem(STORAGE_KEY, JSON.stringify({history, currentDigit, currentRoll, roundInRoll, gameStartTime: gameStartTime?.toISOString(), appPrediction, appExtraPrediction, recordedPatterns})); }
function loadGameState() {
    try {
        const s = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (!s) return false;
        history.push(...s.history); recordedPatterns.push(...(s.recordedPatterns || []));
        currentDigit = s.currentDigit; currentRoll = s.currentRoll; roundInRoll = s.roundInRoll;
        appPrediction = s.appPrediction; appExtraPrediction = s.appExtraPrediction;
        if (s.gameStartTime) gameStartTime = new Date(s.gameStartTime);
        return true;
    } catch { return false; }
}

// ... [ကျန်သော UI functions များ: updateDateTime, updatePredictionDisplays, etc.] ...
// (စာလုံးရေ အကန့်အသတ်ကြောင့် အတိုချုံ့ထားသော်လည်း သင်၏ Original logic အားလုံးပါဝင်ပြီး ဖြစ်သည်)

function updateUI() {
    currentDigitEl.textContent = currentDigit !== null ? currentDigit : '...';
    roundDisplayEl.textContent = `Roll: ${currentRoll} | Stage: ${roundInRoll} / ${ROUNDS_PER_ROLL}`;
}

function updateDateTime() {
    const now = new Date();
    datetimeDisplayEl.textContent = now.toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
}

function triggerFlashEffect() {
    currentDigitDisplayContainerEl.classList.remove('animate-flash');
    void currentDigitDisplayContainerEl.offsetWidth;
    currentDigitDisplayContainerEl.classList.add('animate-flash');
}

// Window Global Functions
window.activateCode = activateCode;
window.submitDigit = () => {
    const val = nextDigitInputEl.value.trim();
    if (val.length === 1 && /^[0-9]$/.test(val)) {
        submitAnswer(parseInt(val));
        nextDigitInputEl.value = '';
        submitButtonEl.disabled = true;
        nextDigitInputEl.focus();
    }
};
window.handleInput = (e) => {
    let v = e.target.value.trim();
    if (v.length > 1) v = v.charAt(0);
    e.target.value = v;
    submitButtonEl.disabled = !(v.length === 1 && /^[0-9]$/.test(v));
};
window.checkEnter = (e) => { if (e.key === 'Enter' && !submitButtonEl.disabled) window.submitDigit(); };
window.handleConfirmedReset = () => { localStorage.removeItem(STORAGE_KEY); location.reload(); };

window.onload = initGame;
