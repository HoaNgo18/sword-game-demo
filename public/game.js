const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const socket = io();

// --- 1. TỐI ƯU GRID (OFFSCREEN CANVAS) ---
// Tạo canvas phụ để vẽ lưới 1 lần duy nhất, sau đó dùng như một tấm ảnh
const gridCanvas = document.createElement('canvas');
const gridCtx = gridCanvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// CONSTANTS
const MAP_SIZE = 2000;
const LERP_FACTOR = 0.15; 
const BASE_RADIUS = 20;

// STATE
let players = {};
let serverPlayers = {};
let orbs = [];
let myListId = null;
let camera = { x: 0, y: 0 };
let lastLbUpdate = 0;
let viewRect = { x: 0, y: 0, w: 0, h: 0 };

// INPUT STATE (MỚI)
let inputAngle = 0;       // Lưu góc hiện tại
let lastInputSent = 0;    // Thời gian gửi gói tin cuối

function lerp(start, end, t) { return start * (1 - t) + end * t; }

function prepareGridCache() {
    gridCanvas.width = MAP_SIZE;
    gridCanvas.height = MAP_SIZE;
    gridCtx.fillStyle = '#111111';
    gridCtx.fillRect(0, 0, gridCanvas.width, gridCanvas.height);

    gridCtx.strokeStyle = '#222';
    gridCtx.lineWidth = 1;
    const step = 100;
    gridCtx.beginPath();
    for (let x = 0; x <= MAP_SIZE; x += step) { gridCtx.moveTo(x, 0); gridCtx.lineTo(x, MAP_SIZE); }
    for (let y = 0; y <= MAP_SIZE; y += step) { gridCtx.moveTo(0, y); gridCtx.lineTo(MAP_SIZE, y); }
    gridCtx.stroke();
}

// UI
const loginPanel = document.getElementById('login-panel');
const hud = document.getElementById('hud');
const joinBtn = document.getElementById('join-btn');
const usernameInput = document.getElementById('username');
const scoreDisplay = document.getElementById('score');
const leaderboardList = document.getElementById('lb-list');

joinBtn.addEventListener('click', () => {
    const name = usernameInput.value || "Warrior";
    socket.emit('join', name);
    loginPanel.classList.add('hidden');
    hud.classList.remove('hidden');
});

// --- INPUT HANDLING (ĐÃ TỐI ƯU CHỐNG SPAM) ---
const mouse = { x: 0, y: 0 };

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    // Chỉ tính toán góc, KHÔNG gửi socket ngay lập tức
    inputAngle = Math.atan2(mouse.y - canvas.height/2, mouse.x - canvas.width/2);
});

// Vòng lặp gửi Input riêng (30 lần/giây) -> Giảm tải mạng cực lớn
setInterval(() => {
    if (players[myListId]) {
        socket.emit('input', { angle: inputAngle });
    }
}, 1000 / 30); 

// Click chuột trái để đánh
window.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
        socket.emit('attack');
    }
});

window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// SOCKET EVENTS
socket.on('init', (data) => {
    myListId = data.id;
    serverPlayers = data.players;
    players = JSON.parse(JSON.stringify(data.players));
    prepareGridCache(); // Vẽ lưới vào bộ nhớ đệm
});

socket.on('update', (data) => {
    if (data.orbs) orbs = data.orbs;
    if (data.players) {
        serverPlayers = data.players;
        for (let id in serverPlayers) {
            if (!players[id]) players[id] = serverPlayers[id];
        }
        for (let id in players) {
            if (!serverPlayers[id]) delete players[id];
        }
    }
});

// RENDER LOOP
function render() {
    updateLeaderboard();
    const now = Date.now();
    
    // Cập nhật khung nhìn để loại bỏ vật thể ngoài màn hình (Culling)
    viewRect.x = camera.x;
    viewRect.y = camera.y;
    viewRect.w = canvas.width;
    viewRect.h = canvas.height;

    // Xóa màn hình
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Sync Logic (Lerp)
    for (let id in players) {
        if (serverPlayers[id]) {
            let p = players[id];
            let target = serverPlayers[id];
            
            p.x = lerp(p.x, target.x, LERP_FACTOR);
            p.y = lerp(p.y, target.y, LERP_FACTOR);
            p.angle = lerp(p.angle, target.angle, 0.2);
            
            p.radius = target.radius || BASE_RADIUS;
            p.hp = target.hp;
            p.maxHp = target.maxHp;
            p.isAttacking = target.isAttacking;
            p.score = target.score;
            p.name = target.name;
        }
    }

    // Camera Follow
    if (players[myListId]) {
        const me = players[myListId];
        camera.x = lerp(camera.x, me.x - canvas.width / 2, LERP_FACTOR);
        camera.y = lerp(camera.y, me.y - canvas.height / 2, LERP_FACTOR);
        scoreDisplay.innerText = Math.floor(me.score);
    }

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // 1. Vẽ Map (Grid Cached)
    ctx.strokeStyle = 'rgba(255, 50, 50, 0.5)';
    ctx.lineWidth = 5;
    ctx.strokeRect(0, 0, MAP_SIZE, MAP_SIZE);
    
    // Dùng drawImage thay vì vẽ lại từng dòng kẻ -> Siêu nhanh
    ctx.drawImage(gridCanvas, 0, 0);
    
    // 2. Vẽ Orbs (Có Culling)
    drawOrbs();

    // 3. Vẽ Players (Có Culling & Sắp xếp Layer)
    const playerIds = Object.keys(players).sort((a, b) => (a === myListId ? 1 : (b === myListId ? -1 : 0)));
    
    playerIds.forEach(id => {
        const p = players[id];
        const r = p.radius || BASE_RADIUS;
        
        // Frustum Culling: Nếu người chơi nằm ngoài màn hình thì không vẽ
        // Thêm padding 100px để tránh vật thể bị biến mất đột ngột ở mép
        if (p.x + r < viewRect.x - 100 || 
            p.x - r > viewRect.x + viewRect.w + 100 || 
            p.y + r < viewRect.y - 100 || 
            p.y - r > viewRect.y + viewRect.h + 100) return;
            
        drawPlayer(p, id === myListId, now);
    });

    ctx.restore();
    requestAnimationFrame(render);
}

function drawOrbs() {
    // Culling Orbs
    const pad = 50; // Padding nhỏ cho orb
    const minX = viewRect.x - pad;
    const maxX = viewRect.x + viewRect.w + pad;
    const minY = viewRect.y - pad;
    const maxY = viewRect.y + viewRect.h + pad;

    for (let i = 0; i < orbs.length; i++) {
        const orb = orbs[i];
        // Kiểm tra xem orb có trong màn hình không
        if (orb.x < minX || orb.x > maxX || orb.y < minY || orb.y > maxY) continue;
        
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fillStyle = orb.color;
        ctx.fill();
    }
}

function drawPlayer(player, isMe, now) {
    const scale = player.radius / BASE_RADIUS;

    // A. Fake Glow (Vòng tròn mờ dưới cùng)
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = isMe ? '#00f2ff' : '#ff4757';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius + 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // B. Thân
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = isMe ? '#00f2ff' : '#ff4757'; 
    if (player.hp < player.maxHp) ctx.globalAlpha = (player.hp / player.maxHp) + 0.2;
    ctx.fill();
    ctx.globalAlpha = 1;

    // C. Kiếm
    ctx.save();
    ctx.translate(player.x, player.y);
    let swingAngle = 0;
    if (player.isAttacking) swingAngle = Math.sin((now || Date.now()) / 50) * 2.5; 
    ctx.rotate(player.angle + swingAngle);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    const swordLen = 60 * scale;
    const swordWidth = 12 * scale;
    const offset = player.radius + 5;
    ctx.roundRect(offset, -swordWidth/2, swordLen, swordWidth, 5);
    ctx.fill();
    ctx.restore();

    // D. Tên & Máu
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(player.name, player.x, player.y - player.radius - 25);

    const hpPercent = Math.max(0, player.hp / player.maxHp);
    const barW = 50; const barH = 6;
    const barY = player.y - player.radius - 20;

    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(player.x - barW/2, barY, barW, barH);
    
    if (hpPercent > 0.5) ctx.fillStyle = '#2ecc71';
    else if (hpPercent > 0.25) ctx.fillStyle = '#f1c40f';
    else ctx.fillStyle = '#e74c3c';
    ctx.fillRect(player.x - barW/2, barY, barW * hpPercent, barH);
}

function updateLeaderboard() {
    const now = Date.now();
    if (now - lastLbUpdate < 1000) return; 
    lastLbUpdate = now;
    const list = Object.values(players).sort((a, b) => b.score - a.score).slice(0, 5);
    leaderboardList.innerHTML = '';
    list.forEach((p, i) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>#${i + 1} ${p.name}</span><span>${Math.floor(p.score)}</span>`;
        if (p.name === (players[myListId] && players[myListId].name)) li.style.color = '#00f2ff';
        leaderboardList.appendChild(li);
    });
}

render();