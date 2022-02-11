StructureLink.prototype.tryTransfer = function(target: StructureLink): number {
  let amount = this.store[RESOURCE_ENERGY];
  if (amount === 0) return ERR_NOT_ENOUGH_ENERGY;
  let freeCapacity = target.store.getFreeCapacity(RESOURCE_ENERGY);
  if (freeCapacity < amount) return ERR_FULL;
  if (target.gotEnergy) return ERR_BUSY;
  let ret = this.transferEnergy(target);
  if (ret === OK) target.gotEnergy = true;
  return ret;
}
