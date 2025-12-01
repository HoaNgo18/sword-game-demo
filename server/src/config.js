
module.exports = {
    PORT: process.env.PORT || 3000,
    TPS: 20, // Ticks Per Second (Server cập nhật 20 lần/giây => 50ms/frame)
    MAP_SIZE: 2000, // Kích thước bản đồ 2000x2000
    PLAYER: {
        RADIUS: 40,
        SPEED: 300, // Tốc độ di chuyển (pixel/giây)
        START_HP: 100
    }
};