// server/src/network/Network.js
const { Server } = require("socket.io");
const config = require('../config');

class Network {
    constructor(httpServer, game) {
        this.game = game;
        this.io = new Server(httpServer, {
            cors: {
                origin: "*", // Cho phép kết nối từ mọi nguồn (quan trọng khi dev)
                methods: ["GET", "POST"]
            }
        });

        this.setupSocket();
        this.startGameLoop();
    }

    setupSocket() {
        this.io.on("connection", (socket) => {
            console.log(`[Net] New connection: ${socket.id}`);

            // 1. Join Game
            this.game.addPlayer(socket.id);

            // 2. Handle Input từ Client
            socket.on("input", (inputData) => {
                // inputData dạng { up: true, down: false... }
                this.game.handleInput(socket.id, inputData);
            });

            // 3. Disconnect
            socket.on("disconnect", () => {
                console.log(`[Net] Disconnected: ${socket.id}`);
                this.game.removePlayer(socket.id);
            });
        });
    }

    startGameLoop() {
        // Vòng lặp gửi dữ liệu (Broadcast Loop)
        const interval = 1000 / config.TPS;
        
        setInterval(() => {
            // Bước 1: Tính toán logic game
            this.game.update();

            // Bước 2: Lấy dữ liệu
            const state = this.game.getState();

            // Bước 3: Gửi về TẤT CẢ client
            // 'u' là viết tắt của 'update' để tiết kiệm băng thông
            this.io.emit("u", state); 
        }, interval);
    }
}

module.exports = Network;