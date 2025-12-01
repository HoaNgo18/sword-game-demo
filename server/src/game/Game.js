// server/src/game/Game.js
// LƯU Ý: Kiểm tra kỹ folder là 'entities' hay 'entity'
const Player = require('./entity/Player'); 
const config = require('../config');

class Game {
    constructor() {
        this.onAttack = null; // Callback sẽ được gán từ Network.js
        this.players = {}; 
        this.lastTime = Date.now();
    }

    addPlayer(socketId) {
        const x = Math.random() * config.MAP_SIZE;
        const y = Math.random() * config.MAP_SIZE;
        
        const player = new Player(this, socketId, x, y);
        this.players[socketId] = player;
        
        console.log(`[Game] Created: ${socketId}`);
        return player;
    }

    removePlayer(socketId) {
        if (this.players[socketId]) {
            delete this.players[socketId];
            console.log(`[Game] Removed: ${socketId}`);
        }
    }

    handleInput(socketId, input) {
        if (this.players[socketId]) {
            this.players[socketId].input = input;
        }
    }

    update() {
        const now = Date.now();
        const dt = (now - this.lastTime) / 1000;
        this.lastTime = now;

        for (const id in this.players) {
            this.players[id].update(dt);
        }
    }

    getState() {
        const pack = [];
        for (const id in this.players) {
            pack.push(this.players[id].getSnapshot());
        }
        return pack;
    }

    handleAttack(socketId) {
        const attacker = this.players[socketId];
        // Kiểm tra tồn tại và hồi chiêu
        if (!attacker || !attacker.canAttack()) return;

        // 1. Kích hoạt Callback để Network gửi tin về Client
        // (Đây là cách đúng để tách biệt logic Game và Mạng)
        if (this.onAttack) {
            this.onAttack(attacker.id);
        }

        // 2. Tính toán hitbox
        const attackRange = 60; // Tầm xa
        const attackHitboxRadius = 40; // Độ rộng nhát chém
        
        // Tâm của cú chém (nằm phía trước mặt người chơi)
        const hitX = attacker.x + Math.cos(attacker.angle) * attackRange;
        const hitY = attacker.y + Math.sin(attacker.angle) * attackRange;

        // 3. Check va chạm với người khác
        for (const targetId in this.players) {
            if (targetId === socketId) continue; // Không tự chém mình

            const target = this.players[targetId];
            
            const dx = target.x - hitX;
            const dy = target.y - hitY;
            const dist = Math.sqrt(dx*dx + dy*dy);

            // Logic va chạm hình tròn (Circle vs Circle)
            if (dist < attackHitboxRadius + target.radius) {
                // TRÚNG!
                target.hp -= 10;
                console.log(`⚔️ Hit! ${attacker.id} -> ${target.id} (HP: ${target.hp})`);

                // Xử lý chết (Respawn)
                if (target.hp <= 0) {
                    target.hp = 100;
                    target.x = Math.random() * config.MAP_SIZE;
                    target.y = Math.random() * config.MAP_SIZE;
                    console.log(`💀 ${target.id} died and respawned.`);
                }
            }
        }
    }
}

module.exports = Game;