// server/src/network/Network.js
const { Server } = require("socket.io");
const config = require('../config');

class Network {
    constructor(httpServer, game) {
        this.game = game;

        // 1. Khởi tạo IO trước
        this.io = new Server(httpServer, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

        // 2. Gán callback sau khi đã có this.io
        this.game.onAttack = (id) => {
            // Gửi cho tất cả mọi người (kể cả người đánh) để chạy animation
            this.io.emit('player_attack', id);
        }

        this.setupSocket();
        this.startGameLoop();
    }

    setupSocket() {
        this.io.on("connection", (socket) => {
            console.log(`[Net] +Conn: ${socket.id}`);

            this.game.addPlayer(socket.id);

            socket.on("input", (inputData) => {
                this.game.handleInput(socket.id, inputData);
            });

            socket.on("attack", () => {
                this.game.handleAttack(socket.id);
            });

            socket.on("disconnect", () => {
                console.log(`[Net] -Disc: ${socket.id}`);
                this.game.removePlayer(socket.id);
            });
        });
    }

    startGameLoop() {
        const interval = 1000 / config.TPS;
        setInterval(() => {
            this.game.update();
            const state = this.game.getState();
            this.io.emit("u", state); 
        }, interval);
    }
}

module.exports = Network;