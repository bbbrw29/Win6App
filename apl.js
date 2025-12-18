// **********************************************
// 🔑 SUPABASE CONFIGURATION
// **********************************************
const SUPABASE_URL = 'https://qqyabwiknxdypxcdoxev.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxeWFid2lrbnhkeXB4Y2RveGV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NjQ5MzIsImV4cCI6MjA4MTQ0MDkzMn0.HOXs3rh3Qs0JdgnI3O3hE6p4sBDRSGK_DrChgQiQUHE';
const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// **********************************************
// 🎮 ORIGINAL CONSTANTS & VARIABLES (မူလအတိုင်း)
// **********************************************
const ROUNDS_PER_ROLL = 10;
const STORAGE_KEY = 'APP_PREDICTOR_STATE_V4_TerminatedPatterns'; 

let currentDigit = null, appPrediction = null, appExtraPrediction = null, currentRoll = 0, roundInRoll = 0, gameStartTime = null; 
const history = [], recordedPatterns = []; 

// UI element references
const currentDigitEl = document.getElementById('current-digit');
const roundDisplayEl = document.getElementById('round-display');
const nextDigitInputEl = document.getElementById('next-digit-input');
const historyLogContainerEl = document.getElementById('history-log-container');
const appPredictionEl = document.getElementById('app-prediction');
const appExtraPredictionEl = document.getElementById('app-extra-prediction'); 
const currentDigitDisplayContainerEl = document.getElementById('current-digit-display'); 
const datetimeDisplayEl = document.getElementById('datetime-display'); 
const patternRecordsContainerEl = document.getElementById('pattern-records-container'); 

// **********************************************
// 💎 SUBSCRIPTION SECURITY (The Gate)
// **********************************************
async function checkAccess() {
    try {
        const { data: { user } } = await client.auth.getUser();
        if (!user) { window.location.href = 'index.html'; return false; }

        const { data } = await client.from('profiles').select('subscription_expiry').eq('id', user.id).single();
        const expiry = data?.subscription_expiry ? new Date(data.subscription_expiry) : null;
        
        if (!expiry || expiry < new Date()) {
            alert("သင့်သက်တမ်းကုန်ဆုံးသွားပါပြီ။");
            window.location.href = 'app.html';
            return false;
        }
        return true;
    } catch (e) { return false; }
}

// **********************************************
// 🔄 CORE GAME LOGIC (Pattern တွက်ချက်မှုများ အပြည့်အစုံ)
// **********************************************
function getGroup(digit) { return digit >= 5 ? 'B' : 'S'; }
function makeAppPrediction() { return currentDigit === null ? null : (currentDigit % 2 === 0 ? 'S' : 'B'); }
function makeAppExtraPrediction() {
    if (history.length < 3) return null;
    const sum = history.slice(-3).reduce((t, i) => t + i.userDigit, 0);
    return sum % 2 === 0 ? 'S' : 'B';
}

function checkAndRecordPatterns() {
    const minPatternLength = 6;
    if (history.length < minPatternLength + 1) return;
    const fullSeq = history.map(i => i.targetGroup).join('');
    const term = history[history.length - 1].targetGroup;
    const lengths = [12, 10, 8, 7, 6]; 
    for (const len of lengths) {
        if (history.length > len) { 
            const patt = fullSeq.slice((len + 1) * -1, -1);
            let type = null, isTerm = false;
            if (new Set(patt).size === 1) {
                if (term !== patt[0]) { type = 'တူညီဆက်တိုက် (Streak)'; isTerm = true; }
            } else {
                let isAlt = true;
                for (let i = 0; i < len - 1; i++) { if (patt[i] === patt[i+1]) { isAlt = false; break; } }
                if (isAlt && term === patt[len-1]) { type = 'တစ်လှည့်စီ (Single Alt)'; isTerm = true; }
            }
            if (isTerm) {
                const last = history[history.length - 2];
                recordedPatterns.push({ type, sequence: patt, roll: last.rollNumber, stage: last.roundInRoll, term, id: Date.now() });
                alert(`Pattern ${patt} ပြီးဆုံးသွားပါပြီ။`);
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
    if (currentDigitDisplayContainerEl) currentDigitDisplayContainerEl.classList.remove('hidden');
    
    triggerFlashEffect(); 
    checkAndRecordPatterns(); 
    updateHistory(); 
    updatePatternRecordsUI();
    
    if (roundInRoll === ROUNDS_PER_ROLL) { currentRoll++; roundInRoll = 1; } else { roundInRoll++; }
    
    appPrediction = makeAppPrediction(); 
    appExtraPrediction = makeAppExtraPrediction();
    updateUI(); 
    updatePredictionDisplays(); 
    saveGameState();
}

// **********************************************
// 🖥️ UI & INITIALIZATION
// **********************************************
window.initGame = async function() {
    const hasAccess = await checkAccess();
    if (!hasAccess) return;

    if (!loadGameState()) {
        currentRoll = 1; roundInRoll = 1; gameStartTime = new Date();
    }
    updateUI(); updateHistory(); updatePatternRecordsUI(); updateDateTime(); updatePredictionDisplays();
    if (!window.dateTimeInterval) window.dateTimeInterval = setInterval(updateDateTime, 1000);
    if(nextDigitInputEl) setTimeout(() => nextDigitInputEl.focus(), 50);
}

function updateUI() {
    if(currentDigitEl) currentDigitEl.textContent = currentDigit ?? '...';
    if(roundDisplayEl) roundDisplayEl.textContent = `Roll: ${currentRoll} | Stage: ${roundInRoll} / ${ROUNDS_PER_ROLL}`;
}

function updateDateTime() { if(datetimeDisplayEl) datetimeDisplayEl.textContent = new Date().toLocaleString(); }
function triggerFlashEffect() { if(currentDigitDisplayContainerEl) { currentDigitDisplayContainerEl.classList.remove('animate-flash'); void currentDigitDisplayContainerEl.offsetWidth; currentDigitDisplayContainerEl.classList.add('animate-flash'); } }
function updatePredictionDisplays() { 
    if(appPredictionEl) appPredictionEl.textContent = appPrediction ?? '...'; 
    if(appExtraPredictionEl) appExtraPredictionEl.textContent = appExtraPrediction ?? '...'; 
}

// **********************************************
// 💾 STATE MANAGEMENT (LocalStorage)
// **********************************************
function saveGameState() { localStorage.setItem(STORAGE_KEY, JSON.stringify({ history, currentDigit, currentRoll, roundInRoll, recordedPatterns })); }
function loadGameState() {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!s) return false;
    history.length = 0; history.push(...s.history); 
    recordedPatterns.length = 0; recordedPatterns.push(...(s.recordedPatterns || []));
    currentDigit = s.currentDigit; currentRoll = s.currentRoll; roundInRoll = s.roundInRoll;
    appPrediction = makeAppPrediction(); appExtraPrediction = makeAppExtraPrediction();
    return true;
}

function updateHistory() {
    if (!historyLogContainerEl) return;
    historyLogContainerEl.innerHTML = history.slice().reverse().map(entry => {
        const statusClass = entry.isCorrect ? 'neon-solid-s' : 'neon-solid-b';
        return `
            <div class="history-row p-2 border-b border-gray-700 flex justify-between items-center text-[10px]">
                <span class="text-gray-400">R${entry.rollNumber}-S${entry.roundInRoll}</span>
                <span class="font-bold">Digit: ${entry.userDigit} (${entry.targetGroup})</span>
                <div class="base-bubble ${statusClass} h-5 w-5">${entry.appPrediction}</div>
            </div>
        `;
    }).join('');
}

function updatePatternRecordsUI() {
    if (!patternRecordsContainerEl) return;
    patternRecordsContainerEl.innerHTML = recordedPatterns.slice().reverse().map(p => `
        <div class="text-[9px] text-yellow-400 border-l-2 border-yellow-600 pl-2 mb-1">
            ${p.type}: ${p.sequence} ➔ ${p.term} (R${p.roll}-S${p.stage})
        </div>
    `).join('');
}

// Global functions for HTML
window.submitDigit = () => {
    const v = nextDigitInputEl.value.trim();
    if (/^[0-9]$/.test(v)) { submitAnswer(parseInt(v)); nextDigitInputEl.value = ''; nextDigitInputEl.focus(); }
};
window.handleInput = (e) => { e.target.value = e.target.value.trim().charAt(0); };
window.checkEnter = (e) => { if (e.key === 'Enter') window.submitDigit(); };
