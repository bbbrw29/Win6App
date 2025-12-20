const STORAGE_KEY = 'WIN6_PRO_STATE_V2';
let history = [];
let currentRoll = 1, roundInRoll = 1;
let predP = null, predE = null, predS = null;

const getEl = (id) => document.getElementById(id);

// --- 🎮 CORE LOGIC ---
function getGrp(d) { return d >= 5 ? 'B' : 'S'; }

function updatePredictions(lastVal) {
    // Prediction P (Last Digit Based)
    predP = lastVal % 2 === 0 ? 'S' : 'B';

    // Prediction E (Last 3 Sum Based)
    if (history.length >= 3) {
        const s3 = history.slice(-3).reduce((a, b) => a + b.val, 0);
        predE = s3 % 2 === 0 ? 'S' : 'B';
    }

    // Prediction S (Last 10 Sum Based) - ၁၁ လုံးမြောက်အတွက်
    if (history.length >= 10) {
        const s10 = history.slice(-10).reduce((a, b) => a + b.val, 0);
        if (s10 > 45) predS = 'S';
        else if (s10 < 45) predS = 'B';
        else predS = getGrp(lastVal);
    }
    renderTopUI(lastVal);
}

function renderTopUI(lastVal) {
    getEl('pred-p').textContent = predP || '?';
    getEl('pred-p').className = `large-bubble ${predP ? 'neon-p' : 'bg-slate-700'}`;
    getEl('pred-e').textContent = predE || '?';
    getEl('pred-e').className = `large-bubble ${predE ? 'neon-e' : 'bg-slate-700'}`;
    getEl('pred-s').textContent = predS || '?';
    getEl('pred-s').className = `large-bubble ${predS ? 'neon-s' : 'bg-slate-700'}`;
    getEl('highlight-g').textContent = lastVal !== null ? lastVal : '-';
}

// --- ✍️ SUBMIT ---
window.submitDigit = () => {
    const input = getEl('digit-input');
    const val = parseInt(input.value);
    const grp = getGrp(val);

    // Record Current Entry with Predictions and Reviews
    history.push({
        val, grp, roll: currentRoll, stage: roundInRoll,
        p: predP, pOk: predP ? (predP === grp) : null,
        e: predE, eOk: predE ? (predE === grp) : null,
        s: predS, sOk: predS ? (predS === grp) : null
    });

    if (roundInRoll === 10) { currentRoll++; roundInRoll = 1; } else { roundInRoll++; }

    updatePredictions(val);
    checkPatterns();
    updateTableUI();
    saveState();
    input.value = ''; input.focus(); getEl('btn-submit').disabled = true;
};

// --- 🔍 PATTERNS ---
function checkPatterns() {
    if (history.length < 6) return;
    const seq = history.map(i => i.grp).join('');
    let msg = "";
    let last = seq.slice(-1), s = 0;
    for(let i=seq.length-1; i>=0; i--) { if(seq[i]===last) s++; else break; }
    if(s >= 6) msg = `⚠️ ${last==='B'?'အကြီး':'အသေး'} ${s} ကြိမ် ဆက်တိုက် ကျနေပါသည်။`;
    
    const box = getEl('pattern-warning');
    if(msg) { box.innerHTML = msg; box.classList.remove('hidden'); }
    else box.classList.add('hidden');
}

// --- 📋 COPY (Header တစ်ခါပဲပါမည်) ---
window.copyHistoryToClipboard = async () => {
    if (history.length === 0) return alert("မှတ်တမ်းမရှိပါ။");
    let text = "--- Win6 Pro Predictor (Full Review) ---\n\n";
    text += "STG | P | P.C | E | E.C | S | S.C | [G]\n";
    text += "========================================\n";

    const rolls = history.reduce((acc, i) => { if(!acc[i.roll]) acc[i.roll] = []; acc[i.roll].push(i); return acc; }, {});

    Object.keys(rolls).forEach(r => {
        text += `[Roll ${r}]\n----------------------------------------\n`;
        rolls[r].forEach(i => {
            const pc = i.pOk === null ? "-" : (i.pOk ? "✅" : "❌");
            const ec = i.eOk === null ? "-" : (i.eOk ? "✅" : "❌");
            const sc = i.sOk === null ? "-" : (i.sOk ? "✅" : "❌");
            text += `${i.stage.toString().padEnd(3)} | ${i.p||'-'} | ${pc.padEnd(3)} | ${i.e||'-'} | ${ec.padEnd(3)} | ${i.s||'-'} | ${sc.padEnd(3)} | [${i.val}]\n`;
        });
        text += `----------------------------------------\n`;
    });

    await navigator.clipboard.writeText(text);
    alert("Review အပြည့်အစုံကို Copy ယူပြီးပါပြီ။");
};

// --- 🛠️ UI & STORAGE ---
function updateTableUI() {
    const container = getEl('history-log-container');
    container.innerHTML = '';
    const rolls = history.reduce((acc, i) => { if(!acc[i.roll]) acc[i.roll] = []; acc[i.roll].push(i); return acc; }, {});

    Object.keys(rolls).forEach(r => {
        const div = document.createElement('div');
        div.className = 'flex-shrink-0 w-44 bg-slate-800 rounded-xl p-2 border border-slate-700 h-fit';
        div.innerHTML = `<h3 class="text-[10px] font-bold text-center text-slate-500 border-b border-slate-700 mb-2 pb-1">ROLL ${r}</h3>`;
        rolls[r].forEach(i => {
            div.innerHTML += `
                <div class="grid grid-cols-4 gap-1 text-[10px] py-1 border-b border-slate-700/50 items-center text-center">
                    <span class="text-slate-500 text-left">S${i.stage}</span>
                    <span class="font-bold ${i.pOk?'text-green-400':'text-red-400'}">${i.p||'-'}</span>
                    <span class="g-highlight">${i.val}</span>
                    <span class="text-[8px] opacity-70">${i.sOk===null?'-':(i.sOk?'✅':'❌')}</span>
                </div>`;
        });
        container.appendChild(div);
    });
    container.scrollLeft = container.scrollWidth;
}

function saveState() { 
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
        history, currentRoll, roundInRoll, 
        lastDigit: history.length ? history[history.length-1].val : null 
    })); 
}

function loadState() {
    const d = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!d) return;
    history = d.history; currentRoll = d.currentRoll; roundInRoll = d.roundInRoll;
    if (history.length) updatePredictions(d.lastDigit);
    updateTableUI();
}

window.resetGame = () => { if(confirm("အကုန်ဖျက်ရန် သေချာပါသလား?")) { localStorage.removeItem(STORAGE_KEY); location.reload(); } };
window.handleInput = (e) => { 
    if(e.target.value.length > 1) e.target.value = e.target.value.slice(-1);
    getEl('btn-submit').disabled = e.target.value === ""; 
};
window.checkEnter = (e) => { if(e.key === 'Enter') window.submitDigit(); };

setInterval(() => getEl('clock').textContent = new Date().toLocaleString(), 1000);
loadState();
