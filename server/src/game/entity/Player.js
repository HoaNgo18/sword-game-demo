// server/src/game/entities/Player.js
const Entity = require('./Entity');
const config = require('../../config');

class Player extends Entity {
    constructor(game, socketId, x, y) {
        super(game, x, y, config.PLAYER.RADIUS);
        this.socketId = socketId; // ID của socket để gửi tin riêng
        this.username = "Unknown";
        
        // Input hiện tại từ client
        this.input = { up: false, down: false, left: false, right: false };
    }

    update(dt) {
        const speed = config.PLAYER.SPEED;

        // Tính toán vị trí mới dựa trên input và thời gian (dt)
        if (this.input.up) this.y -= speed * dt;
        if (this.input.down) this.y += speed * dt;
        if (this.input.left) this.x -= speed * dt;
        if (this.input.right) this.x += speed * dt;

        // Giữ player không chạy ra khỏi bản đồ (Clamping)
        this.x = Math.max(0, Math.min(config.MAP_SIZE, this.x));
        this.y = Math.max(0, Math.min(config.MAP_SIZE, this.y));
    }

    // Ghi đè hàm getSnapshot để thêm thông tin riêng của Player
    getSnapshot() {
        return {
            ...super.getSnapshot(),
            type: 'player' // Để client biết đây là người chơi
        };
    }
}

module.exports = Player;