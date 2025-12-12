// script.js (Modified Version - Input/Submit/E-Display Fixes Applied)

// Constants
const ROUNDS_PER_ROLL = 10;
const STORAGE_KEY = 'APP_PREDICTOR_STATE_V4_TerminatedPatterns'; 

// Global variables for game state
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

// --- Confirmation Modal Logic ---

function alertUserMessage(message) {
    alert(message); 
}

function hideConfirmationModal() {
     if (modalOverlayEl) modalOverlayEl.classList.add('hidden');
}

function showConfirmationModal(message, onConfirm) {
    if (!modalOverlayEl) return;
    
    document.getElementById('confirmation-modal-message').textContent = message;
    
    modalOverlayEl.classList.remove('hidden'); 
    
    // Clone nodes to remove previous event listeners
    const newConfirm = modalConfirmButtonEl.cloneNode(true);
    const newCancel = modalCancelButtonEl.cloneNode(true);
    modalConfirmButtonEl.parentNode.replaceChild(newConfirm, modalConfirmButtonEl);
    modalCancelButtonEl.parentNode.replaceChild(newCancel, modalCancelButtonEl);
    
    const handleConfirm = () => {
        hideConfirmationModal();
        onConfirm();
    };

    const handleCancel = () => {
        hideConfirmationModal();
    };

    newConfirm.addEventListener('click', handleConfirm);
    newCancel.addEventListener('click', handleCancel);
}

function handleConfirmedReset() {
     localStorage.removeItem(STORAGE_KEY);
    recordedPatterns.length = 0; 
    initGame(); 
    alertUserMessage("ဂိမ်းအသစ် စတင်လိုက်ပါပြီ။"); 
}

// --- Local Storage Functions ---

function saveGameState() {
    try {
        const state = {
            history: history,
            currentDigit: currentDigit,
            currentRoll: currentRoll,
            roundInRoll: roundInRoll,
            gameStartTime: gameStartTime ? gameStartTime.toISOString() : null,
            appPrediction: appPrediction,
            appExtraPrediction: appExtraPrediction, 
            recordedPatterns: recordedPatterns,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.error("Error saving game state to localStorage:", e);
    }
}

function loadGameState() {
    try {
        const storedState = localStorage.getItem(STORAGE_KEY);
        if (!storedState) return false;

        const state = JSON.parse(storedState);

        history.splice(0, history.length, ...state.history);
        recordedPatterns.splice(0, recordedPatterns.length, ...(state.recordedPatterns || [])); 
        
        currentDigit = state.currentDigit;
        currentRoll = state.currentRoll;
        roundInRoll = state.roundInRoll;
        appPrediction = state.appPrediction;
        appExtraPrediction = state.appExtraPrediction || null; 
        
        if (state.gameStartTime) {
            gameStartTime = new Date(state.gameStartTime);
        }

        return true;

    } catch (e) {
        console.error("Error loading or parsing game state from localStorage:", e);
        localStorage.removeItem(STORAGE_KEY);
        return false;
    }
}

// --- Core Logic Functions (G, P, E Logics are locked) ---

function getGroup(digit) {
    // Target Group (G) Logic: 0-4 is S, 5-9 is B. (Correct logic)
    return digit >= 5 ? 'B' : 'S';
}

function makeAppPrediction() {
    if (currentDigit === null) {
        return null;
    }
    // P Logic: Even (0, 2, 4, 6, 8) -> S ; Odd (1, 3, 5, 7, 9) -> B
    if (currentDigit % 2 === 0) {
        return 'S';
    } 
    else {
        return 'B';
    }
}

function makeAppExtraPrediction() {
    if (history.length < 3) {
        return null; 
    }
    
    // E Logic: Sum of the last 3 userDigits (Manual Inputs) remainder
    const lastThree = history.slice(-3); 
    const sum = lastThree.reduce((total, item) => total + item.userDigit, 0); 
    
    if (sum % 2 === 0) {
        return 'S'; 
    } else {
        return 'B'; 
    }
}

function checkAndRecordPatterns() {
    const minPatternLength = 6;
    const minHistoryLengthForTermination = minPatternLength + 1; 

    if (history.length < minHistoryLengthForTermination) return;

    const fullGroupSequence = history.map(item => item.targetGroup).join('');
    
    const terminatorEntry = history[history.length - 1];
    const terminatorGroup = terminatorEntry.targetGroup;

    const lengths = [8, 7, 6]; 
    
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
            } 
            
            else { 
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
                        isT