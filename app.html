<!DOCTYPE html>
<html lang="my">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Subscription Management</title>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <style>
        body { font-family: 'Segoe UI', Tahoma, sans-serif; background-color: #0f172a; color: white; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
        .container { background: #1e293b; padding: 30px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); width: 100%; max-width: 400px; text-align: center; border: 1px solid #334155; }
        h2 { color: #38bdf8; }
        .status-box { padding: 15px; border-radius: 8px; margin-bottom: 20px; font-weight: bold; border: 1px solid transparent; }
        .active { background-color: rgba(22, 163, 74, 0.2); color: #4ade80; border-color: #4ade80; }
        .expired { background-color: rgba(220, 38, 38, 0.2); color: #ef4444; border-color: #ef4444; }
        input { width: 100%; padding: 12px; margin-bottom: 15px; border-radius: 6px; border: 1px solid #334155; background: #0f172a; color: white; box-sizing: border-box; text-align: center; }
        button { width: 100%; padding: 12px; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: bold; transition: 0.3s; margin-bottom: 10px; }
        .btn-activate { background-color: #0284c7; color: white; }
        .btn-activate:hover { background-color: #0369a1; }
        .btn-play { background-color: #16a34a; color: white; display: none; }
        .btn-logout { background: none; color: #94a3b8; text-decoration: underline; font-size: 14px; }
        #message { font-size: 13px; margin: 10px 0; min-height: 20px; }
    </style>
</head>
<body>

<div class="container">
    <h2>Subscription စနစ်</h2>
    <div id="status-box" class="status-box">အခြေအနေ စစ်ဆေးနေသည်...</div>
    
    <input type="text" id="code-input" placeholder="Subscription Code ထည့်ပါ">
    <button id="activate-btn" class="btn-activate">Activate လုပ်မည်</button>
    <p id="message"></p>
    
    <button id="play-btn" class="btn-play" onclick="location.href='game.html'">ဂိမ်းသို့ သွားရန် ➔</button>
    <button id="logout-btn" class="btn-logout">အကောင့်ထွက်ရန်</button>
</div>

<script>
    const SUPABASE_URL = 'https://qqyabwiknxdypxcdoxev.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxeWFid2lrbnhkeXB4Y2RveGV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NjQ5MzIsImV4cCI6MjA4MTQ0MDkzMn0.HOXs3rh3Qs0JdgnI3O3hE6p4sBDRSGK_DrChgQiQUHE';
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    async function updateStatus() {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) { window.location.href = 'index.html'; return; }

        const { data: profile } = await supabaseClient.from('profiles').select('subscription_expiry').eq('id', user.id).single();
        const statusBox = document.getElementById('status-box');
        const playBtn = document.getElementById('play-btn');
        
        const expiry = profile?.subscription_expiry ? new Date(profile.subscription_expiry) : null;
        const now = new Date();

        if (expiry && expiry > now) {
            statusBox.className = 'status-box active';
            statusBox.innerHTML = `အခြေအနေ: Active ✅<br>သက်တမ်းကုန်ရက်: ${expiry.toLocaleDateString()}`;
            playBtn.style.display = 'block';
        } else {
            statusBox.className = 'status-box expired';
            statusBox.innerHTML = `အခြေအနေ: Expired ❌<br>သက်တမ်းကုန်ရက်: ${expiry ? expiry.toLocaleDateString() : 'မရှိသေးပါ'}`;
            playBtn.style.display = 'none';
        }
    }

    document.getElementById('activate-btn').onclick = async () => {
        const code = document.getElementById('code-input').value.trim();
        const msg = document.getElementById('message');
        if (!code) return;

        msg.textContent = "စစ်ဆေးနေပါသည်...";
        const { data, error } = await supabaseClient.rpc('activate_subscription', { input_code: code });

        if (error) {
            msg.style.color = "#ef4444";
            msg.textContent = "အမှား: " + error.message;
        } else {
            msg.style.color = "#4ade80";
            msg.textContent = "အောင်မြင်ပါသည်!";
            document.getElementById('code-input').value = "";
            updateStatus();
        }
    };

    document.getElementById('logout-btn').onclick = async () => {
        await supabaseClient.auth.signOut();
        window.location.href = 'index.html';
    };

    window.onload = updateStatus;
</script>
</body>
</html>
