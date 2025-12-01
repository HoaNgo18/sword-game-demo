import Phaser from "phaser";

export default class ClientPlayer extends Phaser.GameObjects.Container {
  constructor(scene, data) {
    super(scene, data.x, data.y);
    this.scene = scene;
    this.id = data.id;

    // 1. Body
    this.bodyShape = scene.add.circle(0, 0, data.r, 0x2ecc71);
    this.bodyShape.setStrokeStyle(2, 0x000000);
    this.add(this.bodyShape);

    // 2. Weapon
    this.weaponContainer = scene.add.container(0, 0);
    const swordBlade = scene.add.rectangle(data.r + 20, 0, 60, 10, 0xbdc3c7);
    swordBlade.setStrokeStyle(1, 0x000000);
    this.weaponContainer.add(swordBlade);
    this.add(this.weaponContainer);

    // 3. Tên (Dời lên cao một chút để nhường chỗ cho thanh máu)
    this.nameTag = scene.add.text(0, -data.r - 35, "Player", { 
      fontSize: "14px",
      fontFamily: "Arial",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 3,
      align: "center"
    }).setOrigin(0.5);
    this.add(this.nameTag);

    // --- 4. THANH MÁU (HP BAR) ---
    // Thanh nền (Màu đỏ)
    this.hpBarBg = scene.add.rectangle(0, -data.r - 15, 50, 8, 0xe74c3c);
    this.hpBarBg.setStrokeStyle(1, 0x000000); // Viền đen
    this.add(this.hpBarBg);

    // Thanh máu hiện tại (Màu xanh)
    this.hpBar = scene.add.rectangle(0, -data.r - 15, 50, 8, 0x2ecc71);
    this.add(this.hpBar);
    
    // Lưu max HP (Tạm thời fix cứng 100, sau này server gửi về nếu có hệ thống level)
    this.maxHp = 100;

    scene.add.existing(this);

    // Init biến nội suy
    this.targetX = data.x;
    this.targetY = data.y;
    this.targetAngle = data.a || 0;
  }

  // Hàm cập nhật máu (Gọi từ GameScene)
  updateHealth(newHp) {
    if (newHp < 0) newHp = 0;
    
    // Tính phần trăm máu
    const percentage = newHp / this.maxHp;
    
    // Co chiều dài thanh máu lại
    this.hpBar.width = 50 * percentage; // 50 là chiều dài gốc
    
    // Cập nhật màu (Xanh -> Cam -> Đỏ) cho chuyên nghiệp
    if (percentage < 0.3) {
        this.hpBar.fillColor = 0xff0000; // Đỏ báo động
    } else {
        this.hpBar.fillColor = 0x2ecc71; // Xanh an toàn
    }
  }

  update(t, dt) {
    // Nội suy vị trí
    this.x += (this.targetX - this.x) * 0.15;
    this.y += (this.targetY - this.y) * 0.15;

    // Nội suy góc quay
    this.weaponContainer.rotation = Phaser.Math.Angle.RotateTo(
        this.weaponContainer.rotation, 
        this.targetAngle, 
        0.15
    );
  }
}