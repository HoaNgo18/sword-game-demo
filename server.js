const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

// --- CẤU HÌNH GAME ---
const MAP_SIZE = 2000;
const BASE_SPEED = 200;       // Tăng lên vì giờ tính theo giây (pixels/second)
const LUNGE_SPEED = 600;      // Tốc độ lướt (pixels/second)
const ATTACK_COOLDOWN = 400; 
const ATTACK_RANGE = 80;

const ORB_COUNT = 60;
const ORB_VALUE = 5;

// --- STATE ---
let players = {};
let orbs = [];

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join', (name) => {
        players[socket.id] = createPlayer(name);
        // Send a sanitized init payload (avoid exposing internal fields)
        const initPayload = { id: socket.id, players: {} };
        for (const id in players) {
            const p = players[id];
            initPayload.players[id] = {
                x: p.x, y: p.y, angle: p.angle, radius: p.radius,
                name: p.name, score: p.score, hp: p.hp, maxHp: p.maxHp,
                isAttacking: !!p.isAttacking
            };
        }
        socket.emit('init', initPayload);
    });

    // --- LOGIC NHẬN INPUT ---
    socket.on('input', (data) => {
        // Chỉ lưu input lại, không di chuyển ngay tại đây
        if (players[socket.id]) {
            const p = players[socket.id];
            if (data && typeof data.angle === 'number' && isFinite(data.angle)) {
                p.inputAngle = data.angle;
                p.lastInputTime = Date.now();
                p.isInputting = true;
            }
        }
    });

    // --- LOGIC TẤN CÔNG ---
    socket.on('attack', () => {
        const p = players[socket.id];
        if (p && !p.isAttacking) {
            p.isAttacking = true; 
            
            setTimeout(() => {
                if(players[socket.id]) players[socket.id].isAttacking = false;
            }, ATTACK_COOLDOWN);
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
    });
});

// --- GAME LOOP (SERVER AUTHORITATIVE) ---
// Physics: 60Hz | Network: 20Hz
let lastTick = Date.now();
let emitAccumulator = 0;
const EMIT_RATE = 1000 / 20; // Gửi dữ liệu 20 lần/giây

setInterval(() => {
    const now = Date.now();
    // dt = delta time (thời gian trôi qua tính bằng giây)
    let dt = (now - lastTick) / 1000;
    lastTick = now;
    
    // Giới hạn dt để tránh nhảy cóc nếu server bị lag
    if (dt > 0.1) dt = 0.1; 

    // 1. XỬ LÝ DI CHUYỂN (Physics)
    for (const id in players) {
        const p = players[id];
        
        // Nếu không có input trong 200ms thì coi như đứng im (AFK check)
        if (p.isInputting && (now - p.lastInputTime) < 200) {
            const speed = p.isAttacking ? LUNGE_SPEED : BASE_SPEED;
            
            // Lấy góc từ input đã lưu
            const moveAngle = (typeof p.inputAngle === 'number') ? p.inputAngle : 0;
            
            // [QUAN TRỌNG] Cập nhật hướng quay của nhân vật
            p.angle = moveAngle; 

            // Tính toán vị trí mới: Vị trí cũ + (Tốc độ * Thời gian)
            p.x += Math.cos(moveAngle) * speed * dt;
            p.y += Math.sin(moveAngle) * speed * dt;

            // Giới hạn map
            p.x = Math.max(0, Math.min(MAP_SIZE, p.x));
            p.y = Math.max(0, Math.min(MAP_SIZE, p.y));
        }
    }

    // 2. XỬ LÝ VA CHẠM
    checkCollisions();
    checkOrbCollisions();

    // 3. GỬI DỮ LIỆU (Network Update)
    emitAccumulator += dt * 1000;
    if (emitAccumulator >= EMIT_RATE) {
        emitAccumulator -= EMIT_RATE; // preserve remainder to reduce jitter
        
        // Đóng gói dữ liệu gọn nhẹ
        const payload = { players: {}, orbs };
        for (const id in players) {
            const p = players[id];
            payload.players[id] = {
                x: Math.round(p.x),       // Làm tròn để giảm băng thông
                y: Math.round(p.y),
                angle: Number(p.angle.toFixed(2)),
                radius: Math.round(p.radius),
                name: p.name,
                score: Math.round(p.score),
                hp: Math.round(p.hp),
                maxHp: p.maxHp,
                isAttacking: p.isAttacking
            };
        }
        io.emit('update', payload);
    }
}, 1000 / 60); // Server chạy physics 60Hz

// --- HELPER FUNCTIONS ---
function createPlayer(name) {
    return {
        x: Math.random() * 800 + 100, 
        y: Math.random() * 600 + 100,
        radius: 20,
        angle: 0,
        name: name || "Warrior",
        score: 0,
        hp: 100,
        maxHp: 100,
        isAttacking: false,
        lastHitTime: 0,
        
        // Input State mới
        inputAngle: 0,
        lastInputTime: Date.now(),
        isInputting: false
    };
}

function initOrbs() {
    for (let i = 0; i < ORB_COUNT; i++) orbs.push(createOrb());
}

function createOrb() {
    return {
        x: Math.random() * MAP_SIZE,
        y: Math.random() * MAP_SIZE,
        radius: 5 + Math.random() * 5,
        color: `hsl(${Math.random() * 360}, 70%, 60%)`
    };
}

function checkCollisions() {
    const playerIds = Object.keys(players);
    const NOW = Date.now();

    for (let i = 0; i < playerIds.length; i++) {
        let attacker = players[playerIds[i]];
        if (attacker.isAttacking) {
            for (let j = 0; j < playerIds.length; j++) {
                if (i === j) continue;
                let victim = players[playerIds[j]];

                if (victim.lastHitTime && NOW - victim.lastHitTime < 300) continue;

                const dist = Math.hypot(victim.x - attacker.x, victim.y - attacker.y);

                if (dist < ATTACK_RANGE + victim.radius && dist > 10) {
                    victim.lastHitTime = NOW;
                    victim.hp -= 10;
                    
                    // Knockback dựa trên attacker.angle (đã được cập nhật trong Game Loop)
                    victim.x += Math.cos(attacker.angle) * 60;
                    victim.y += Math.sin(attacker.angle) * 60;
                    
                    victim.x = Math.max(0, Math.min(MAP_SIZE, victim.x));
                    victim.y = Math.max(0, Math.min(MAP_SIZE, victim.y));

                    if (victim.hp <= 0) {
                        attacker.score += 50;
                        updatePlayerSize(attacker);
                        players[playerIds[j]] = createPlayer(victim.name);
                    }
                }
            }
        }
    }
}

function checkOrbCollisions() {
    for (let id in players) {
        let p = players[id];
        for (let i = orbs.length - 1; i >= 0; i--) {
            let orb = orbs[i];
            if (Math.hypot(p.x - orb.x, p.y - orb.y) < p.radius + orb.radius) {
                p.score += ORB_VALUE;
                p.hp = Math.min(p.maxHp, p.hp + 2);
                updatePlayerSize(p);
                orbs.splice(i, 1);
                orbs.push(createOrb());
            }
        }
    }
}

function updatePlayerSize(p) {
    p.radius = 20 + (p.score * 0.05);
    if (p.radius > 60) p.radius = 60;
}

initOrbs();
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => { console.log(`Server running on http://localhost:${PORT}`); });