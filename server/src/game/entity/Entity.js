// server/src/game/entities/Entity.js
class Entity {
    constructor(game, x, y, radius) {
        this.game = game;
        this.id = Math.random().toString(36).substr(2, 9); // Tạo ID ngẫu nhiên
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.markedForDelete = false; // Cờ đánh dấu để xóa khỏi game
    }

    update(dt) {
        // Logic chung (ví dụ: vật lý cơ bản) sẽ viết ở đây sau này
    }

    // Dữ liệu đóng gói để gửi về Client
    getSnapshot() {
        return {
            id: this.id,
            x: Math.round(this.x), // Làm tròn để giảm dung lượng gói tin
            y: Math.round(this.y),
            r: this.radius
        };
    }
}

module.exports = Entity;