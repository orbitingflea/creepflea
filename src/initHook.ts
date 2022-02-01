global.tickBeginHook = [];
global.tickEndHook = [function(): void {
  if (Game.cpu.bucket >= 10000) {
    Game.cpu.generatePixel();
  }
}];
