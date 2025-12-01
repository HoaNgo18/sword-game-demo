export default class InputManager {
  constructor(scene, socket) {
    this.scene = scene;
    this.socket = socket;
    
    // Khởi tạo các phím
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });

    this.lastInput = { up: false, down: false, left: false, right: false };

    //Lang nghe su kien chuot trai
    this.scene.input.on('pointerdown', (pointer) => {
        if (pointer.leftButtonDown()) {
            this.socket.socket.emit("attack"); // Gửi tín hiệu tấn công ngay lập tức
        }
    });
  }

  


  update() {
    // 1. Lấy vị trí chuột so với tâm màn hình (Camera)
    const pointer = this.scene.input.activePointer;
    // Tính góc (radian) từ tâm màn hình đến chuột
    const angle = Phaser.Math.Angle.Between(
      this.scene.cameras.main.width / 2,
      this.scene.cameras.main.height / 2,
      pointer.x,
      pointer.y
    );

    // Gom trạng thái phím
    const input = {
      up: this.cursors.up.isDown || this.wasd.up.isDown,
      down: this.cursors.down.isDown || this.wasd.down.isDown,
      left: this.cursors.left.isDown || this.wasd.left.isDown,
      right: this.cursors.right.isDown || this.wasd.right.isDown,
      angle: angle
    };

    input.angle = parseFloat(input.angle.toFixed(2));
    
    // Chỉ gửi lên server nếu có gì đó thay đổi (để tiết kiệm mạng)
    if (JSON.stringify(input) !== JSON.stringify(this.lastInput)) {
      this.socket.emitInput(input);
      this.lastInput = input;
    }
  }
}