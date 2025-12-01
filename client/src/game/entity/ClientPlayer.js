import Phaser from "phaser";

export default class ClientPlayer extends Phaser.GameObjects.Container {
  constructor(scene, data) {
    super(scene, data.x, data.y);
    this.id = data.id;

    // 1. Vẽ hình tròn đại diện (Thay bằng Sprite sau này)
    this.bodyShape = scene.add.circle(0, 0, data.r, 0x00ff00);
    this.add(this.bodyShape);

    // 2. Vẽ tên
    this.nameTag = scene.add.text(0, -data.r - 10, "Player", {
      fontSize: "14px",
      color: "#ffffff",
      align: "center",
    }).setOrigin(0.5);
    this.add(this.nameTag);

    // 3. Thêm vào scene
    scene.add.existing(this);

    // Biến dùng để nội suy (làm mượt chuyển động)
    this.targetX = data.x;
    this.targetY = data.y;
  }

  // Hàm này chạy mỗi frame (60 lần/giây) để vẽ mượt
  update(t, dt) {
    // Linear Interpolation (Lerp): Di chuyển từ từ đến vị trí đích
    // Hệ số 0.1 càng nhỏ thì càng mượt nhưng càng trễ (latency)
    this.x += (this.targetX - this.x) * 0.15;
    this.y += (this.targetY - this.y) * 0.15;
  }
}