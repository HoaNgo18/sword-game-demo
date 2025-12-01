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
  }

  update() {
    // Gom trạng thái phím
    const input = {
      up: this.cursors.up.isDown || this.wasd.up.isDown,
      down: this.cursors.down.isDown || this.wasd.down.isDown,
      left: this.cursors.left.isDown || this.wasd.left.isDown,
      right: this.cursors.right.isDown || this.wasd.right.isDown,
    };

    // Chỉ gửi lên server nếu có gì đó thay đổi (để tiết kiệm mạng)
    if (JSON.stringify(input) !== JSON.stringify(this.lastInput)) {
      this.socket.emitInput(input);
      this.lastInput = input;
    }
  }
}