import io from "socket.io-client";

export default class Socket {
  constructor(scene) {
    this.scene = scene;
    // Kết nối tới Server (Port 3000 như config bên server)
    this.socket = io("http://localhost:3000");

    this.setupEvents();
  }

  setupEvents() {
    this.socket.on("connect", () => {
      console.log("Connected to Server via Socket.io");
    });

    // Nhận gói tin update vị trí từ Server (20 lần/giây)
    this.socket.on("u", (packet) => {
      // 'u' là tên sự kiện rút gọn ta đã đặt bên server
      if (this.scene && this.scene.processUpdate) {
        this.scene.processUpdate(packet);
      }
    });
  }

  // Gửi input (lên, xuống, trái, phải) lên Server
  emitInput(inputData) {
    this.socket.emit("input", inputData);
  }
}