Creep.prototype.repairRoad = function() {
  if (this.store[RESOURCE_ENERGY] > 0 && this.getActiveBodyparts(WORK) > 0) {
    const roads = this.pos.lookFor(LOOK_STRUCTURES).filter(s => s.structureType == STRUCTURE_ROAD && s.hits < s.hitsMax);
    if (roads.length > 0) {
      this.repair(roads[0]);
      return OK;
    }
    const road_sites = this.pos.lookFor(LOOK_CONSTRUCTION_SITES).filter(s => s.structureType == STRUCTURE_ROAD);
    if (road_sites.length > 0) {
      this.build(road_sites[0]);
      return OK;
    }
  }
  return 1;
}

Creep.prototype.collectEnergyOrDrop = function() {
  // 优先捡起 dropped resource
  let dropped = this.pos.findInRange(FIND_DROPPED_RESOURCES, 1, {
    filter: d => d.resourceType == RESOURCE_ENERGY
  });
  if (dropped.length > 0) {
    let target = dropped[0];
    if (this.store.getFreeCapacity() == 0) {
      this.drop(RESOURCE_ENERGY);
      return OK;
    }
    this.pickup(target);
    return OK;
  }

  // 捡起墓碑
  let tombstones = this.pos.findInRange(FIND_TOMBSTONES, 1, {
    filter: t => t.store[RESOURCE_ENERGY] > 0
  });
  if (tombstones.length > 0) {
    let target = tombstones[0];
    if (this.store.getFreeCapacity() == 0) {
      this.drop(RESOURCE_ENERGY);
      return OK;
    }
    this.withdraw(target, RESOURCE_ENERGY);
    return OK;
  }

  return 1;
}
