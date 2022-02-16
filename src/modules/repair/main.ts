const MIN_TRIGGER_RAMPART = 1000000;
const MAX_TRIGGER_RAMPART = 1200000;
const STOP_RAMPART = 1500000;
const TOWER_RAMPART = 1000;

const MIN_TRIGGER_OTHER = 0.6;
const MAX_TRIGGER_OTHER = 0.8;
const STOP_OTHER = 1;
const TOWER_OTHER = 0.4;

export function getRepairerTasks(room: Room): WorkerTask[] {
  if (room._repairerTasks) return room._repairerTasks;
  room._repairerTasks = [];

  const walls = room.structuresOfType(STRUCTURE_WALL).concat(room.ramparts.filter(r => r.my));
  if (walls.some(w => w.hits < MIN_TRIGGER_RAMPART)) {
    for (let wall of walls) {
      if (wall.hits < MAX_TRIGGER_RAMPART) wall.cache.needRepair = true;
    }
  }

  for (let wall of walls) {
    if (wall.hits >= STOP_RAMPART) wall.cache.needRepair = false;
    if (wall.cache.needRepair) {
      room._repairerTasks.push({
        id: wall.id,
        action: 'repair',
        priority: 50,
      });
    }
  }

  const structures = room.functionalStructures.concat(room.roads);
  if (structures.some(s => s.hits < MIN_TRIGGER_OTHER * s.hitsMax)) {
    for (let structure of structures) {
      if (structure.hits < MAX_TRIGGER_OTHER * structure.hitsMax) structure.cache.needRepair = true;
    }
  }

  for (let s of structures) {
    if (s.hits >= STOP_OTHER * s.hitsMax) s.cache.needRepair = false;
    if (s.cache.needRepair) {
      room._repairerTasks.push({
        id: s.id,
        action: 'repair',
        priority: 120,
      });
    }
  }

  return room._repairerTasks;
}

export function getTowerRepairTarget(room: Room): Structure | null {
  if (room._towerRepairTarget !== undefined) return room._towerRepairTarget;
  room._towerRepairTarget = null;

  let structures = room.functionalStructures.concat(room.roads);
  let item = structures.find(s => s.hits < TOWER_OTHER * s.hitsMax);
  if (item) {
    room._towerRepairTarget = item;
    return item;
  }

  let walls = room.structuresOfType(STRUCTURE_WALL).concat(room.ramparts.filter(r => r.my));
  item = walls.find(s => s.hits < TOWER_RAMPART);
  if (item) {
    room._towerRepairTarget = item;
    return item;
  }

  return null;
}
