import Phaser from "phaser";

export default class ClientPlayer extends Phaser.GameObjects.Container {
  constructor(scene, data) {
    console.log("Creating Player with data:", data);
    super(scene, data.x, data.y);
    this.id = data.id;

    // 1. Body
    this.bodyShape = scene.add.circle(0, 0, data.r, 0x2ecc71); // Màu xanh lục
    this.bodyShape.setStrokeStyle(2, 0x000000); // Viền đen
    this.add(this.bodyShape);

    //2. Weapon
    this.weaponContainer = scene.add.container(0, 0);
    // Vẽ lưỡi kiếm (Hình chữ nhật xám)
    // Tọa độ x=data.r nghĩa là kiếm nằm ngoài mép người chơi
    const swordBlade = scene.add.rectangle(data.r + 20, 0, 60, 10, 0xbdc3c7);
    swordBlade.setStrokeStyle(1, 0x000000);
    this.weaponContainer.add(swordBlade);
    
    // Thêm container vũ khí vào container chính
    this.add(this.weaponContainer);

    // 3. Tên
    this.nameTag = scene.add.text(0, -data.r - 20, "Player", {
      fontSize: "14px",
      fontFamily: "Arial",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 3
    }).setOrigin(0.5);
    this.add(this.nameTag);

    scene.add.existing(this);

    // Nội suy
    this.targetX = data.x;
    this.targetY = data.y;
    this.targetAngle = data.a || 0; // Góc đích
  }

  // Hàm này chạy mỗi frame (60 lần/giây) để vẽ mượt
  update(t, dt) {
    // 1. Nội suy vị trí (Lerp position)
    this.x += (this.targetX - this.x) * 0.15;
    this.y += (this.targetY - this.y) * 0.15;

    // 2. Nội suy góc quay (Lerp angle)
    // Phaser.Math.Angle.RotateTo giúp xoay theo đường ngắn nhất (không xoay vòng tròn vô nghĩa)
    const currentAngle = this.weaponContainer.rotation;
    this.weaponContainer.rotation = Phaser.Math.Angle.RotateTo(
        currentAngle, 
        this.targetAngle, 
        0.1 // Tốc độ xoay (0.1 là khá mượt)
    );
  }

  playAttackAnimation() {
    // Nếu đang chém rồi thì thôi (tránh spam animation)
    if (this.isAttacking) return;
    this.isAttacking = true;

    // Animation vung kiếm
    this.scene.tweens.add({
      targets: this.weaponContainer,
      angle: this.weaponContainer.angle + 60, // Xoay thêm 60 độ
      duration: 100, // Tốc độ chém (ms)
      yoyo: true, // Tự quay về vị trí cũ
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.isAttacking = false; // Kết thúc chém
        // Reset góc về 0 (tương đối với container) nếu cần, 
        // nhưng do có logic nội suy ở update nên nó sẽ tự sửa lại.
      }
    });
  }
}