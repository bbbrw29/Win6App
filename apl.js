// ====================================================
// *** SUPABASE AUTHENTICATION & LOGIN LOGIC ***
// ====================================================

// Supabase Keys
const SUPABASE_URL = 'https://gnkoonzdusouatbicbdn.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdua29vbnpkdXNvdWF0YmljYmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMDA5ODIsImV4cCI6MjA4MDg3Njk4Mn0.xo5RB_lmxsZGFxLXpZ4gH0oleyO6pyWNQZqRXHvzQdk'; 

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Local Storage Keys
const ACCESS_KEY = 'app_access_granted';
const EXPIRY_KEY = 'app_expiry_date';
const DEVICE_ID_KEY = 'app_unique_device_id';
const HISTORY_KEY = 'game_history';
const STATE_KEY = 'game_state';

// UI element references
const loginGateEl = document.getElementById('login-gate'); 
const appContentWrapperEl = document.getElementById('game-ui-content'); 
const accessCodeInputEl = document.getElementById('access-code-input');
const loginMessageEl = document.getElementById('login-message');

// Generates or retrieves a unique ID for the device
function generateUniqueId() {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
        deviceId = 'device-' + Date.now().toString(36) + Math.random().toString(36).substring(2);
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
}

// Main function to initialize the app
function initApp() {
    
    if (!loginGateEl || !appContentWrapperEl) {
        console.error("Initialization Error: Login or App Wrapper elements not found in HTML!");
        return; 
    }
    
    const accessGranted = localStorage.getItem(ACCESS_KEY) === 'true';
    const expiryDateString = localStorage.getItem(EXPIRY_KEY);
    let isExpired = true; 

    if (expiryDateString) {
        const expiryDate = new Date(expiryDateString);
        if (expiryDate > new Date()) {
            isExpired = false;
        }
    }
    
    // Check 1: Access VALID and NOT expired
    if (accessGranted && !isExpired) {
        showAppContent(); 
    } else {
        // Check 2: Access INVALID or EXPIRED
        showLoginGate(expiryDateString); 
    }
}

// 🚨 FIX: Login Gate ကို ဖွင့်/ပိတ် Logic (style attribute ကို ဖယ်ရှားခြင်း)
function showLoginGate(expiredDateString) {
    
    // Login Overlay ကို ဖွင့်ခြင်း
    if (loginGateEl) {
        loginGateEl.classList.remove('hidden'); 
        // 🚨 HTML Fix ကို ပြန်ပြင်နိုင်ရန်
        loginGateEl.style.display = ''; 
    }
    
    // App Content ကို ပိတ်ခြင်း
    if (appContentWrapperEl) {
        appContentWrapperEl.classList.add('hidden'); 
    }

    if (loginMessageEl) {
        if (expiredDateString && new Date(expiredDateString) < new Date()) {
            loginMessageEl.textContent = `သင့်ရဲ့ အသုံးပြုခွင့် သက်တမ်းကုန်ဆုံးသွားပါပြီ။`;
            loginMessageEl.classList.add('text-red-400');
        } else {
             loginMessageEl.textContent = '... သို့မဟုတ် အခမဲ့ စမ်းသပ်ပါ ...';
             loginMessageEl.classList.remove('text-red-400');
        }
    }
}

// App Content ကို ဖွင့်/ပိတ် Logic
function showAppContent() {
    
    // App Content ကို ဖွင့်ခြင်း
    if (appContentWrapperEl) {
        appContentWrapperEl.classList.remove('hidden');
    }
    
    // Login Gate ကို ပိတ်ခြင်း
    if (loginGateEl) {
        loginGateEl.classList.add('hidden');
        // 🚨 HTML Fix ကို ဖုံးကွယ်ခြင်း
        loginGateEl.style.display = 'none'; 
    }
    
    initGame(); 
}

// Single-User Key Verification and Device Binding
async function checkAccessCode() {
    const code = accessCodeInputEl.value.trim().toUpperCase();
    if (!code) {
        if (loginMessageEl) loginMessageEl.textContent = 'Code ထည့်ပါ။';
        return;
    }
    
    if (loginMessageEl) loginMessageEl.textContent = 'စစ်ဆေးနေသည်...';
    const currentDeviceId = generateUniqueId();
    
    try {
        const { data, error } = await supabase
            .from('app_keys') 
            .select('expires_at, is_used, device_id') 
            .eq('id', code)
            .single();

        if (error || !data) {
            if (loginMessageEl) loginMessageEl.textContent = 'Code မှားနေသည် သို့မဟုတ် မရှိပါ။';
            return;
        }

        if (data.device_id && data.device_id !== currentDeviceId) {
            if (loginMessageEl) loginMessageEl.textContent = 'ဒီ Code ကို အခြားဖုန်းနဲ့ အသုံးပြုထားပါတယ်။ 🔑';
            return;
        }

        const expiry = new Date(data.expires_at);

        if (expiry <= new Date()) {
             if (loginMessageEl) loginMessageEl.textContent = 'ဒီ Code ဟာ သက်တမ်းကုန်ဆုံးနေပါပြီ။';
             return;
        }

        // --- SUCCESS: BIND DEVICE AND GRANT ACCESS ---
        const { updateError } = await supabase
            .from('app_keys')
            .update({ is_used: true, device_id: currentDeviceId }) 
            .eq('id', code);
            
        if (updateError) {
             console.error("Failed to update code status:", updateError);
             if (loginMessageEl) loginMessageEl.textContent = 'Error: Code ကို မှတ်သားရာတွင် ပြဿနာရှိပါသည်။';
             return;
        }
        
        localStorage.setItem(ACCESS_KEY, 'true');
        localStorage.setItem(EXPIRY_KEY, expiry.toISOString());
        
        if (loginMessageEl) loginMessageEl.textContent = 'ဝင်ရောက်ခွင့် အောင်မြင်ပါသည်။';
        alertUserMessage(`Premium Access ရရှိပါပြီ။ (သက်တမ်းကုန်ဆုံးမည်: ${expiry.toLocaleDateString('my-MM')})`);
        
        showAppContent();
        
    } catch (e) {
        if (loginMessageEl) loginMessageEl.textContent = 'Server Error! ကျေးဇူးပြု၍ စစ်ဆေးပါ။';
        console.error("Supabase Error:", e);
    }
}

// 7-Day Trial Logic
function startTrial() {
    const trialDays = 7; 
    const today = new Date();
    
    if (localStorage.getItem('trial_used') === 'true') {
        alertUserMessage('အခမဲ့ စမ်းသပ်သုံးစွဲခွင့်ကို တစ်ကြိမ်သာ ခွင့်ပြုထားပါသည်။');
        return;
    }
    
    const expiry = new Date(today);
    expiry.setDate(today.getDate() + trialDays);
    
    localStorage.setItem(ACCESS_KEY, 'true');
    localStorage.setItem(EXPIRY_KEY, expiry.toISOString());
    localStorage.setItem('trial_used', 'true'); 
    
    alertUserMessage(`၇ ရက် အခမဲ့ စမ်းသပ်သုံးစွဲခွင့် စတင်ပါပြီ။ (သက်တမ်းကုန်ဆုံးမည်: ${expiry.toLocaleDateString('my-MM')})`);
    
    showAppContent();
}

function alertUserMessage(message) {
    alert(message); 
}

// User Recovery Function
function resetAppData() {
    // Login/Access Data များ ရှင်းလင်းခြင်း
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(EXPIRY_KEY);
    localStorage.removeItem('trial_used');
    
    // Game Data များ (မှတ်တမ်းများ) ရှင်းလင်းခြင်း
    localStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem(STATE_KEY);
    
    alertUserMessage("အသုံးပြုမှု ဒေတာများအားလုံး ရှင်းလင်းပြီးပါပြီ။ App ကို ပြန်လည်စတင်ပါမည်။");
    
    // Page ကို Refresh လုပ်ပြီး initApp() ကို ပြန်လည်စစေ