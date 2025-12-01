// server/src/game/Game.js
const Player = require('./entity/Player');
const config = require('../config');

class Game {
    constructor() {
        this.players = {}; // Danh sách người chơi: { socketId: Player }
        this.lastTime = Date.now();
    }

    addPlayer(socketId) {
        // Spawn ngẫu nhiên trong map
        const x = Math.random() * config.MAP_SIZE;
        const y = Math.random() * config.MAP_SIZE;
        
        const player = new Player(this, socketId, x, y);
        this.players[socketId] = player;
        
        console.log(`[Game] Player created: ${socketId} at (${Math.round(x)}, ${Math.round(y)})`);
        return player;
    }

    removePlayer(socketId) {
        if (this.players[socketId]) {
            delete this.players[socketId];
            console.log(`[Game] Player removed: ${socketId}`);
        }
    }

    handleInput(socketId, input) {
        if (this.players[socketId]) {
            this.players[socketId].input = input;
        }
    }

    // Hàm update chính (Chạy mỗi tick)
    update() {
        const now = Date.now();
        const dt = (now - this.lastTime) / 1000; // Delta time tính bằng giây
        this.lastTime = now;

        // Update tất cả người chơi
        for (const id in this.players) {
            this.players[id].update(dt);
        }

        // Sau này: Update quái vật, check va chạm, tính điểm...
    }

    // Gom dữ liệu để gửi cho Network
    getState() {
        const pack = [];
        for (const id in this.players) {
            pack.push(this.players[id].getSnapshot());
        }
        return pack;
    }
}

module.exports = Game;