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
    const seenIds = new Set();

    snapshot.forEach((entityData) => {
      const id = entityData.id;
      seenIds.add(id);

      if (this.players[id]) {
        // Player đã có -> Cập nhật vị trí & góc
        this.players[id].targetX = entityData.x;
        this.players[id].targetY = entityData.y;
        this.players[id].targetAngle = entityData.a;
        
        // --- CẬP NHẬT MÁU ---
        if (entityData.h !== undefined) {
            this.players[id].updateHealth(entityData.h);
        }

      } else {
        // Player chưa có -> Tạo mới
        this.players[id] = new ClientPlayer(this, entityData);

        // Nếu đây là player local của client, cho camera follow
        if (this.socket && this.socket.socket && id === this.socket.socket.id) {
          this.cameras.main.startFollow(this.players[id]);
          this.cameras.main.setBounds(0, 0, 4000, 4000);
        }
      }
    });
  }

  //Ham xu ly attack
  handlePlayerAttack(id) {
    if (this.players[id]) {
        this.players[id].playAttackAnimation();
    }
}
}