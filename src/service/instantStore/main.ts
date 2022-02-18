/**
 * 本文件修改 creep 原型上的 withdraw & transfer，使得
 * - 当 creep 与容器发生交互的时候，creep 和容器的 store 都会被更新为预测值，供本 tick 其余决策使用。
 * - 这样的更新仅在 tick 以内生效。
 */

if (!Creep.prototype._withdraw) {
  Creep.prototype._withdraw = Creep.prototype.withdraw;
  Creep.prototype.withdraw = function(target: Structure | Ruin | Tombstone, resourceType: ResourceConstant, amount?: number): ScreepsReturnCode {
    let validAmount = Math.min(this.store.getFreeCapacity(resourceType), target.store?.getUsedCapacity(resourceType) || 0);
    if (amount === undefined || amount > validAmount) {
      amount = validAmount;
    }
    if (amount === 0) {
      return ERR_INVALID_ARGS;
    }
    let result = this._withdraw!(target, resourceType, amount);
    if (result === OK) {
      this.store[resourceType] += amount;
      target.store![resourceType] -= amount;
    }
    return result;
  }
}

if (!Creep.prototype._transfer) {
  Creep.prototype._transfer = Creep.prototype.transfer;
  Creep.prototype.transfer = function(target: Structure, resourceType: ResourceConstant, amount?: number): ScreepsReturnCode {
    let validAmount = Math.min(this.store[resourceType], target.store?.getFreeCapacity(resourceType) || 0);
    if (amount === undefined || amount > validAmount) {
      amount = validAmount;
    }
    if (amount === 0) {
      return ERR_INVALID_ARGS;
    }
    let result = this._transfer!(target, resourceType, amount);
    if (result === OK) {
      this.store[resourceType] -= amount;
      target.store![resourceType] += amount;
    }
    return result;
  }
}
