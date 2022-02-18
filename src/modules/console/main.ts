global.fillTerminal = function(roomName: string) {
  const room = Game.rooms[roomName];
  let term = room.terminal!;
  global.NewCarrierTask(roomName, 'storage', 'terminal', 'energy', term.store.getFreeCapacity());
}

global.takeTerminal = function(roomName: string) {
  const room = Game.rooms[roomName];
  let term = room.terminal!;
  global.NewCarrierTask(roomName, 'terminal', 'storage', 'energy');
}

global.keepSell = function(roomName: string, res: ResourceConstant) {
  global.tickEndHook.push(() => {
    let term = Game.rooms[roomName].terminal!;
    if (!term.cooldown && term.store[res] > 0 && term.store.energy >= term.store[res] * 0.2) {
      global.SellResource(roomName, res, term.store[res], 0.1);
    }
  });
}
