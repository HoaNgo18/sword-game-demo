// server/index.js
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');

const Game = require('./src/game/Game');
const Network = require('./src/network/Network');
const config = require('./src/config');

// Khởi tạo Express & HTTP Server
const app = express();
app.use(cors());
const server = http.createServer(app);

// Serve folder public (Client build) - Nếu bạn chạy chung server
app.use(express.static(path.join(__dirname, '../client/dist'))); 

// Khởi động Logic
const game = new Game();
const network = new Network(server, game);

// Start Server
server.listen(config.PORT, () => {
    console.log(`
    ========================================
    SERVER STARTED on port ${config.PORT}
    Map Size: ${config.MAP_SIZE}
    TPS: ${config.TPS}
    ========================================
    `);
});