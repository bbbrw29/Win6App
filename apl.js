// ====================================================
// *** CORE GAME LOGIC (6-Digit Predictor) ***
// ====================================================

// 🚨 LOGIN/SUPABASE Logic အားလုံးကို ဖယ်ရှားပြီးဖြစ်သည် 🚨

// Local Storage Keys
const HISTORY_KEY = 'game_history';
const STATE_KEY = 'game_state';

// Global Variables
let currentDigits = []; 
let currentRound = 1;
let currentStep = 1;
const MAX_STEPS = 10;

// Main function to initialize the app (Login Logic မပါဘဲ Game ကို တိုက်ရိုက်စတင်သည်)
function initApp() {
    initGame(); 
}

// Global Alert Function (အတိုချုပ်ထားသည်)
function alertUserMessage(message) {
    alert(message); 
}

// Load initial state or default digits
function loadGameState() {
    const savedState = localStorage.getItem(STATE_KEY);
    if (savedState) {
        const state = JSON.parse(savedState);
        currentDigits = state.digits;
        currentRound = state.round;
        currentStep = state.step;
        return true;
    }
    // Default starting sequence if no state is found
    currentDigits = [3, 9, 7, 0, 1, 6]; 
    currentRound = 1;
    currentStep = 1;
    return false;
}

function saveGameState() {
    const state = {
        digits: currentDigits,
        round: currentRound,
        step: currentStep
    };
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
    saveHistoryLog();
}

function generatePrediction() {
    if (currentDigits.length < 3) return { P: '...', E: '...' };
    const lastThree = currentDigits.slice(-3);
    const sum = lastThree.reduce((a, b) => a + b, 0);
    const P = sum % 10; 
    const E = currentDigits.length >= 4 ? currentDigits[currentDigits.length - 4] : '...';
    return { P: P, E: E };
}

function updateUI() {
    const prediction = generatePrediction();
    
    const roundDisplayEl = document.getElementById('round-display');
    if (roundDisplayEl) {
        roundDisplayEl.textContent = `Roll: ${currentRound} | အဆင့်: ${currentStep} / ${MAX_STEPS}`;
    }

    const currentDigitEl = document.getElementById('current-digit');
    const lastDigit = currentDigits.length > 0 ? currentDigits[currentDigits.length - 1] : '...';
    if(currentDigitEl) {
        currentDigitEl.textContent = lastDigit;
    }
    
    const pPredictionEl = document.getElementById('app-prediction');
    const ePredictionEl = document.getElementById('app-extra-prediction');
    
    if(pPredictionEl) pPredictionEl.textContent = prediction.P;
    if(ePredictionEl) ePredictionEl.textContent = prediction.E;

    if (currentDigits.length > 0) {
        const lastIndex = currentDigits.length - 1;
        const winStatus = checkWinStatus(lastIndex);
        const circleEl = document.getElementById('current-digit-display');

        if (circleEl) {
            circleEl.classList.remove('neon-solid-s', 'neon-solid-b', 'neon-border-s', 'neon-border-b', 'animate-flash');
            circleEl.classList.add(winStatus.P ? 'neon-solid-s' : winStatus.E ? 'neon-border-s' : 'neon-solid-b');
            circleEl.classList.add('animate-flash');
            setTimeout(() => circleEl.classList.remove('animate-flash'), 500);
        }
    }
    
    // Pattern Warning Logic (Streak Count Fix)
    checkPatternWarning();
    
    // Undo Button Logic (Undo Last 2 Feature)
    const undoButton = document.getElementById('undo-button');
    if (undoButton) {
        if (currentDigits.length >= 2) {
            undoButton.classList.remove('hidden');
            undoButton.disabled = false;
        } else {
            undoButton.classList.add('hidden');
            undoButton.disabled = true;
        }
    }
    
    // UI update ပြီးနောက် Input ၏ disabled state ကို ပြန်စစ်ဆေး
    const input = document.getElementById('next-digit-input');
    if (input) {
        handleInput({ target: input });
    }
    
    renderHistoryLog();
}

function initGame() {
    loadGameState();
    updateUI();
    updateDateTime();
    setInterval(updateDateTime, 1000); 
}

// Input Logic
function handleInput(event) {
    const input = event.target;
    const submitButton = document.getElementById('submit-button');
    
    let value = input.value.trim();
    let digit = NaN;

    if (value.length > 1) {
        value = value.slice(0, 1);
        input.value = value;
    }
    
    if (value.length === 1) {
        digit = parseInt(value);
    }
    
    if (submitButton) {
        if (value && !isNaN(digit) && digit >= 0 && digit <= 9) {
            submitButton.disabled = false;
        } else {
            submitButton.disabled = true;
        }
    }
}

function checkEnter(event) {
    const submitButton = document.getElementById('submit-button');
    if (event.key === 'Enter' && submitButton && !submitButton.disabled) {
        submitDigit();
    }
}

function submitDigit() {
    const input = document.getElementById('next-digit-input');
    const digit = parseInt(input.value);

    if (isNaN(digit) || digit < 0 || digit > 9) {
        alertUserMessage("ဂဏန်း 0 မှ 9 အတွင်းသာ ထည့်သွင်းပါ။");
        return;
    }

    currentDigits.push(digit);
    currentStep++;
    if (currentStep > MAX_STEPS) {
        currentRound++;
        currentStep = 1;
    }

    input.value = '';
    
    document.getElementById('submit-button').disabled = true; 
    
    saveGameState();
    updateUI();
}

// Pattern Warning Logic (Streak Count Fix)
function checkPatternWarning() {
    const warningBox = document.getElementById('pattern-warning-box');
    if (!warningBox || currentDigits.length < 3) {
        if (warningBox) {
            warningBox.classList.add('hidden', 'opacity-0');
        }
        return;
    }

    let lastStatus = '';
    let currentStreak = 0;
    
    for (let i = currentDigits.length - 1; i >= 3; i--) {
        const { P } = checkWinStatus(i); 
        const status = P ? 'P' : 'X';
        
        if (lastStatus === '') {
            lastStatus = status;
            currentStreak = 1;
        } else if (status === lastStatus) {
            currentStreak++;
        } else {
            break;
        }
    }
    
    if (currentStreak >= 8) {
        warningBox.innerHTML = `⚠️ Pattern Alert: **${lastStatus}** ပုံစံသည် **${currentStreak}** ကြိမ် ဆက်တိုက် ဖြစ်နေပါသည်။`;
        warningBox.classList.remove('hidden');
        setTimeout(() => warningBox.classList.remove('opacity-0'), 10);
    } else {
        warningBox.classList.add('opacity-0');
        setTimeout(() => warningBox.classList.add('hidden'), 300);
    }
}

// Undo Last Two Inputs Function
function undoLastTwoInputs() {
    if (currentDigits.length < 2) {
        alertUserMessage("ဖျက်သိမ်းရန် မှတ်တမ်းအလုံအလောက် မရှိပါ။");
        return;
    }

    currentDigits.pop();
    currentDigits.pop();

    if (currentStep > 1) {
        currentStep -= 2;
        if (currentStep <= 0) {
            if (currentRound > 1) {
                currentRound--;
                currentStep = MAX_STEPS + currentStep; 
            } else {
                currentStep = 1;
            }
        }
    }