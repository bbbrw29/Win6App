// 🔑 SUPABASE CONFIG
const SUPABASE_URL = 'https://qqyabwiknxdypxcdoxev.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxeWFid2lrbnhkeXB4Y2RveGV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NjQ5MzIsImV4cCI6MjA4MTQ0MDkzMn0.HOXs3rh3Qs0JdgnI3O3hE6p4sBDRSGK_DrChgQiQUHE';
const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 📦 GAME STATE
const ROUNDS_PER_ROLL = 10;
const STORAGE_KEY = 'APP_PREDICTOR_STATE_V4_TerminatedPatterns';
let currentDigit = null, appPrediction = null, appExtraPrediction = null, currentRoll = 1, roundInRoll = 1, gameStartTime = null;
const history = [], recordedPatterns = [];

const getEl = (id) => document.getElementById(id);

// --- 🔒 AUTH & SUBSCRIPTION ---
async function checkAccess() {
    const { data: { user } } = await client.auth.getUser();
    if (!user) { window.location.href = 'index.html'; return; }
    const { data } = await client.from('profiles').select('subscription_expiry').eq('id', user.id).single();
    const now = new Date();
    const expiry = data?.subscription_expiry ? new Date(data.subscription_expiry) : null;
    if (expiry && expiry > now) {
        getEl('status-box').innerHTML = `<span class="text-emerald-400 font-bold">ACTIVE ✅</span><br>Expires: ${expiry.toLocaleDateString()}`;
        getEl('play-btn').classList.remove('hidden');
        getEl('expiry-display').textContent = `Plan Expires: ${expiry.toLocaleDateString()}`;
    } else {
        getEl('status-box').innerHTML = `<span class="text-red-400 font-bold">EXPIRED ❌</span>`;
        getEl('activation-area').classList.remove('hidden');
    }
}
window.addEventListener('load', checkAccess);

// --- 🔍 PATTERN WARNING LOGIC ---
function checkAndRecordPatterns() {
    if (history.length < 4) return;
    const seq = history.map(i => i.targetGroup).join('');
    const fullSeq = history.map(i => i.targetGroup);
    let warning = "";

    // 🚩 Streak (4+)
    let last = fullSeq[fullSeq.length-1], count = 0;
    for(let i=fullSeq.length-1; i>=0; i--) { if(fullSeq[i] === last) count++; else break; }
    if(count >= 4) warning = `⚠️ STREAK: ${last==='B'?'BIG':'SMALL'} x ${count}`;

    // 🚩 Alternating (BSBS)
    const last4 = seq.slice(-4);
    if(last4 === "BSBS" || last4 === "SBSB") warning = `⚠️ ALT: တစ်လှည့်စီထွက်နေသည်။`;

    // 🚩 Double (BBSS / SSBB)
    if(last4 === "BBSS" || last4 === "SSBB") warning = `⚠️ DOUBLE: နှစ်ခုပူးထွက်နေသည်။`;

    const wBox = getEl('pattern-warning-box');
    if(warning) { wBox.innerHTML = warning; wBox.classList.remove('hidden'); }
    else { wBox.classList.add('hidden'); }
}

// --- 📊 UI UPDATES ---
function updateHistory() {
    const container = getEl('history-log-container');
    container.innerHTML = '';
    const rolls = history.reduce((acc, item) => {
        if (!acc[item.rollNumber]) acc[item.rollNumber] = [];
        acc[item.rollNumber].push(item);
        return acc;
    }, {});

    Object.keys(rolls).forEach(r => {
        const col = document.createElement('div');
        col.className = 'flex-shrink-0 w-[210px] bg-gray-800 rounded-lg p-2 border border-gray-700 shadow-lg';
        col.innerHTML = `
            <h3 class="text-xs font-extrabold text-red-400 text-center mb-1 border-b border-red-600 pb-1">Roll ${r}</h3>
            <div class="flex justify-between text-[8px] font-bold text-gray-500 mb-1 border-b border-gray-600 pb-0.5">
                <span class="w-[12%]">STG</span><span class="w-[15%] text-center">P</span><span class="w-[18%] text-center">P.C</span>
                <span class="w-[15%] text-center">G</span><span class="w-[15%] text-center">E</span><span class="w-[18%] text-center">E.C</span>
            </div>`;
        rolls[r].forEach(i => {
            const pB = `<span class="history-bubble ${i.appPrediction==='B'?'neon-solid-b':'neon-solid-s'}">${i.appPrediction||''}</span>`;
            const eB = i.appExtraPrediction ? `<span class="history-bubble ${i.appExtraPrediction==='B'?'neon-extra-b':'neon-extra-s'}">${i.appExtraPrediction}</span>` : '—';
            col.innerHTML += `
                <div class="flex justify-between items-center text-[10px] font-mono py-1 border-b border-gray-700/30">
                    <span class="w-[12%] text-gray-400">${i.roundInRoll}</span>
                    <span class="w-[15%] text-center">${pB}</span><span class="w-[18%] text-center">${i.isCorrect?'✅':'❌'}</span>
                    <span class="w-[15%] text-center text-yellow-300 font-bold">${i.userDigit}</span>
                    <span class="w-[15%] text-center">${eB}</span><span class="w-[18%] text-center">${i.appExtraPrediction?(i.isExtraCorrect?'✅':'❌'):'—'}</span>
                </div>`;
        });
        container.appendChild(col);
    });
    container.scrollLeft = container.scrollWidth;
}

// --- CORE GAMEPLAY ---
function getGroup(d) { return d >= 5 ? 'B' : 'S'; }
function makeAppPrediction() { return currentDigit === null ? null : (currentDigit % 2 === 0 ? 'S' : 'B'); }
function makeAppExtraPrediction() {
    if (history.length < 3) return null;
    const sum = history.slice(-3).reduce((t, i) => t + i.userDigit, 0);
    return sum % 2 === 0 ? 'S' : 'B';
}

window.submitDigit = () => {
    const input = getEl('next-digit-input');
    const val = input.value;
    if (val !== "" && val >= 0 && val <= 9) {
        const userDigit = parseInt(val);
        const targetGroup = getGroup(userDigit);
        history.push({
            userDigit, targetGroup, appPrediction, appExtraPrediction,
            rollNumber: currentRoll, roundInRoll: roundInRoll,
            isCorrect: appPrediction === targetGroup,
            isExtraCorrect: appExtraPrediction === targetGroup
        });
        currentDigit = userDigit;
        checkAndRecordPatterns();
        if (roundInRoll === ROUNDS_PER_ROLL) { currentRoll++; roundInRoll = 1; } else roundInRoll++;
        appPrediction = makeAppPrediction();
        appExtraPrediction = makeAppExtraPrediction();
        updateUI();
        saveGameState();
        input.value = ''; input.focus(); getEl('submit-button').disabled = true;
    }
};

function updateUI() {
    getEl('current-digit').textContent = currentDigit ?? '...';
    getEl('round-display').textContent = `Roll: ${currentRoll} | Stage: ${roundInRoll} / ${ROUNDS_PER_ROLL}`;
    getEl('app-prediction').textContent = appPrediction ?? '...';
    getEl('app-prediction').className = `text-2xl large-bubble ${appPrediction==='B'?'neon-solid-b':(appPrediction==='S'?'neon-solid-s':'')}`;
    getEl('app-extra-prediction').textContent = appExtraPrediction ?? '...';
    getEl('app-extra-prediction').className = `text-2xl large-bubble ${appExtraPrediction==='B'?'neon-extra-b':(appExtraPrediction==='S'?'neon-extra-s':'')}`;
    updateHistory();
}

// --- UTILS ---
window.handleInput = (e) => { let v = e.target.value; if (v.length > 1) v = v.slice(-1); e.target.value = v; getEl('submit-button').disabled = !(v !== "" && v >= 0 && v <= 9); };
window.checkEnter = (e) => { if (['e', '+', '-', '.'].includes(e.key)) e.preventDefault(); if (e.key === 'Enter' && !getEl('submit-button').disabled) window.submitDigit(); };
function saveGameState() { localStorage.setItem(STORAGE_KEY, JSON.stringify({ history, currentDigit, currentRoll, roundInRoll, gameStartTime: gameStartTime?.toISOString() })); }
function loadGameState() {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY)); if (!s) return false;
    history.push(...s.history); currentDigit = s.currentDigit; currentRoll = s.currentRoll; roundInRoll = s.roundInRoll;
    gameStartTime = s.gameStartTime ? new Date(s.gameStartTime) : new Date(); return true;
}
function initGame() { if(!loadGameState()) gameStartTime = new Date(); updateUI(); getEl('game-start-time').textContent = `Start Time: ${gameStartTime.toLocaleString()}`; setInterval(()=>getEl('datetime-display').textContent = new Date().toLocaleString(),1000); }
window.showGame = () => { getEl('subscription-overlay').classList.add('hidden'); getEl('game-container').classList.remove('hidden'); initGame(); };
window.showConfirmationModal = (msg, cb) => { getEl('confirmation-modal-message').textContent = msg; getEl('confirmation-modal-overlay').classList.remove('hidden'); getEl('modal-confirm-button').onclick = () => { cb(); closeConfirmationModal(); }; };
window.closeConfirmationModal = () => getEl('confirmation-modal-overlay').classList.add('hidden');
window.handleConfirmedReset = () => { localStorage.removeItem(STORAGE_KEY); location.reload(); };
async function logout() { await client.auth.signOut(); window.location.href = 'index.html'; }
