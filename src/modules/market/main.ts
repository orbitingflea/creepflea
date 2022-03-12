// 本文件在 end hook 上挂载市场行为

function sellAnyResource(room: Room) {
  let term = room.terminal;
  if (!term || term.cooldown || term.store.energy < 1000) return;
  let resources = term.store;
  for (let resourceType in resources) {
    if (resourceType === RESOURCE_ENERGY) continue;
    let amount = resources[resourceType as ResourceConstant];
    if (amount <= 10000) continue;
    let transferAmount = Math.min(amount, term.store.energy * 3 + 1000);
    global.SellResource(room.name, resourceType as ResourceConstant, transferAmount, 0.1);
    return;
  }
  if (term.store.energy >= 200000) {
    global.SellResource(room.name, RESOURCE_ENERGY, Math.max(term.store.energy / 2, 10000), 0.1);
  }
}

function sellHook() {
  if (Game.time % 10 !== 0) return;
  for (let name in Game.rooms) {
    let room = Game.rooms[name];
    if (room.controller && room.controller.my && room.storage && room.terminal) {
      sellAnyResource(room);
    }
  }
}

global.tickEndHook.push(sellHook);
