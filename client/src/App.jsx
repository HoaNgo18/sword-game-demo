import React, { useEffect, useRef } from "react";
import Phaser from "phaser";
import GameScene from "./game/scene/GameScene";

const App = () => {
  const gameRef = useRef(null);

  useEffect(() => {
    // Config cho Phaser
    const config = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: "game-container", // ID của thẻ div bên dưới
      physics: { default: "arcade" },
      scene: [GameScene], // Load scene của chúng ta
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      }
    };

    // Khởi tạo game
    const game = new Phaser.Game(config);
    gameRef.current = game;

    // Cleanup khi component unmount
    return () => {
      game.destroy(true);
    };
  }, []);

  return (
    <div style={{ width: "100%", height: "100vh", overflow: "hidden" }}>
      {/* UI React sẽ nằm đè lên đây (z-index cao hơn) */}
      <div style={{ position: "absolute", top: 10, left: 10, color: "white", zIndex: 10 }}>
        <h1>Sword Battle Demo</h1>
        <p>Use WASD to move</p>
      </div>

      {/* Phaser sẽ vẽ vào đây */}
      <div id="game-container" />
    </div>
  );
};

export default App;