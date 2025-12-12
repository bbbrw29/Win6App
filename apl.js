/* app.css */

/* General Styles */
body {
    background-color: #1f2937; /* Dark background */
    color: #ffffff;
    font-family: 'Arial', sans-serif;
}

/* Game Card & History Log Styles */
.game-card {
    background-color: #374151;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Input & Buttons */
.input-digit {
    background-color: #4b5563;
    color: #ffffff;
    border: 1px solid #6b7280;
    text-align: center;
    font-size: 1.5rem;
    padding: 0.5rem;
    height: 3rem;
}
.input-digit:focus {
    border-color: #f87171;
    box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.5);
}

/* Neon Effects (Bubbles) */
.large-bubble {
    width: 60px;
    height: 60px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    margin-top: 0.5rem;
}

/* Neon Colors */
/* Solid Success (P) - Emerald */
.neon-solid-s {
    background-color: #10b981; /* bg-emerald-500 */
    box-shadow: 0 0 8px #10b981, 0 0 15px #059669;
    border: 2px solid #047857;
}

/* Solid Base (X) - Blue/Indigo */
.neon-solid-b {
    background-color: #3b82f6; /* bg-blue-500 */
    box-shadow: 0 0 8px #3b82f6, 0 0 15px #2563eb;
    border: 2px solid #1d4ed8;
}

/* Border Success (E) - Indigo */
.neon-border-s {
    background-color: transparent;
    border: 3px solid #6366f1; /* border-indigo-500 */
    box-shadow: 0 0 8px #6366f1, 0 0 15px #4f46e5;
}

/* History Log Styles */
#history-log-container {
    /* Vertical Scroll ကို ထိန်းချုပ်ရန် Max Height နှင့် Overflow-y ကို ထည့်သွင်းထားသည် (History Fix) */
    max-height: 110px; /* 3-4 history items အတွက် ခန့်မှန်းထားသော အမြင့် */
    overflow-y: auto; /* ဒေတာများရင် ဒေါင်လိုက် scroll လုပ်ရန် */

    /* Horizontal Scroll ကို ထိန်းချုပ်ရန် */
    display: flex;
    gap: 0.5rem;
    padding-bottom: 0.5rem;
    flex-wrap: nowrap; /* items တွေ အောက်ကို မကျအောင် */
}

.history-item {
    flex-shrink: 0;
}

.history-bubble {
    width: 30px;
    height: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    font-size: 1rem;
    font-weight: 700;
    margin-bottom: 0.2rem;
}

/* Custom Animation */
@keyframes flash {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

.animate-flash {
    animation: flash 0.3s ease-in-out;
}