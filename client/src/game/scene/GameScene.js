import Phaser from "phaser";
import Socket from "../../network/Socket";
import ClientPlayer from "../entity/ClientPlayer";
import InputManager from "../input/InputManager";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
    this.players = {}; // Lưu trữ danh sách người chơi hiển thị
  }

  create() {
    // 1. Kết nối mạng
    this.socket = new Socket(this);

    // 2. Setup Input
    this.inputs = new InputManager(this, this.socket);

    // 3. Setup Camera & Background tạm
    this.cameras.main.setBackgroundColor("#222");
    this.add.grid(0, 0, 4000, 4000, 100, 100, 0x333333).setDepth(-1);
  }

  update(time, delta) {
    // Xử lý Input
    if (this.inputs) this.inputs.update();

    // Update hiệu ứng chuyển động cho từng player
    for (const id in this.players) {
      this.players[id].update(time, delta);
    }
  }

  // Hàm xử lý gói tin từ Server gửi về
  processUpdate(snapshot) {
    // Set đánh dấu để tìm những player bị disconnect
    const seenIds = new Set();

    snapshot.forEach((entityData) => {
      const id = entityData.id;
      seenIds.add(id);

      if (this.players[id]) {
        // Player đã có -> Cập nhật vị trí đích
        this.players[id].targetX = entityData.x;
        this.players[id].targetY = entityData.y;
      } else {
        // Player chưa có -> Tạo mới
        this.players[id] = new ClientPlayer(this, entityData);
        console.log("New player created:", id);
      }
      
      // Nếu ID trùng với socket ID của mình -> Camera bám theo
      if(this.socket.socket.id === id) {
          this.cameras.main.startFollow(this.players[id], true, 0.1, 0.1);
      }
    });

    // Xóa player không còn trong snapshot (đã thoát)
    for (const id in this.players) {
      if (!seenIds.has(id)) {
        this.players[id].destroy();
        delete this.players[id];
      }
    }
  }
}